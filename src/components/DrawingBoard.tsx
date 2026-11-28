import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type {
  ComponentType,
  DrawingBlock,
  DrawingContainer,
  DrawingEdge,
  DrawingEdgeDirection,
  DrawingState,
  Lang,
} from '../types';
import { DrawingPaletteDesktop, DrawingPaletteMobile } from './DrawingPalette';
import { paletteColor, paletteIconUrl, paletteLabel, paletteShort } from '../interactive/palette';
import { DRAWING_EXPECTATIONS } from '../interactive/drawingData';
import {
  GAP,
  HANDLE,
  HANDLE_HIT,
  ICON,
  LABEL_SIZE,
  MIN_CONTAINER,
  PAD_X,
  PAD_Y,
  SUB_SIZE,
  blockMinSize,
  blockSize,
  cloneDrawingSlice,
  cycleDirection,
  edgePoint,
  findContainerAt,
  fittedBlockSize,
  midpoint,
  nodeBounds,
  pointInRect,
  resizeHandles,
  uid,
  type ResizeHandle,
} from '../interactive/drawingGeom';
import { applyContainerMoveDelta, collectContainerMoveMembers } from '../interactive/drawingMove';
import { t } from '../i18n';

type Tool = 'select' | 'connect' | 'container' | 'delete';
type Sel =
  | { kind: 'block'; id: string }
  | { kind: 'container'; id: string }
  | { kind: 'edge'; id: string }
  | null;

interface Props {
  scenarioId: string;
  lang: Lang;
  state: DrawingState;
  onChange: (next: DrawingState) => void;
}

type DragState = {
  kind: 'block' | 'container' | 'resize-container' | 'resize-block' | 'pan';
  id?: string;
  handle?: ResizeHandle;
  ox: number;
  oy: number;
  startW?: number;
  startH?: number;
  startX: number;
  startY: number;
  /** World position of the dragged container at gesture start (for absolute deltas). */
  originX?: number;
  originY?: number;
  moved: boolean;
  snapshot?: ReturnType<typeof cloneDrawingSlice>;
  /** Frozen membership + start coords — computed once on pointerdown. */
  moveBlockIds?: string[];
  moveContainerIds?: string[];
  startBlocks?: Record<string, { x: number; y: number }>;
  startContainers?: Record<string, { x: number; y: number }>;
};

function clearWindowSelection() {
  try {
    window.getSelection()?.removeAllRanges();
  } catch { /* ignore */ }
}

export function DrawingBoard({ scenarioId, lang, state, onChange }: Props) {
  const containers = state.containers || [];
  const [tool, setTool] = useState<Tool>('select');
  const [sel, setSel] = useState<Sel>(null);
  const [armedType, setArmedType] = useState<ComponentType | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  /** CSS-pixel size of the canvas element — drives viewBox so SVG fills without letterboxing/clip. */
  const [viewport, setViewport] = useState({ w: 390, h: 420 });
  const [deskCollapsed, setDeskCollapsed] = useState(false);
  const [editingLabel, setEditingLabel] = useState<{ kind: 'edge' | 'container'; id: string } | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const didInitialFit = useRef(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const history = useRef<ReturnType<typeof cloneDrawingSlice>[]>([]);
  const future = useRef<ReturnType<typeof cloneDrawingSlice>[]>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const drag = useRef<DragState | null>(null);
  const longPress = useRef<number | null>(null);
  /** Live sizes during resize so we don't fight React state lag. */
  const liveSizes = useRef<Record<string, { w: number; h: number }>>({});

  const expected = DRAWING_EXPECTATIONS[scenarioId];
  const rtl = lang === 'ar';

  const commit = useCallback(
    (partial: Partial<DrawingState>, pushHistory = true) => {
      if (pushHistory) {
        history.current.push(cloneDrawingSlice(state));
        if (history.current.length > 60) history.current.shift();
        future.current = [];
      }
      onChange({
        ...state,
        ...partial,
        containers: partial.containers ?? state.containers ?? [],
        compared: false,
      });
    },
    [onChange, state],
  );

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(cloneDrawingSlice(state));
    onChange({ ...state, ...prev, compared: false });
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(cloneDrawingSlice(state));
    onChange({ ...state, ...next, compared: false });
  };

  const toWorld = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) return { x: 0, y: 0 };
    const vp = viewportRef.current;
    const svgX = ((clientX - rect.left) / rect.width) * vp.w;
    const svgY = ((clientY - rect.top) / rect.height) * vp.h;
    return { x: (svgX - pan.x) / scale, y: (svgY - pan.y) / scale };
  };

  const placeBlock = (type: ComponentType, x: number, y: number) => {
    const fit = fittedBlockSize(type, lang);
    const parent = findContainerAt(x, y, containers);
    const block: DrawingBlock = {
      id: uid('b'),
      type,
      x: x - fit.w / 2,
      y: y - fit.h / 2,
      w: fit.w,
      h: fit.h,
      parentId: parent?.id ?? null,
    };
    commit({ blocks: [...state.blocks, block] });
    setSel({ kind: 'block', id: block.id });
    setArmedType(null);
  };

  const addContainer = (x: number, y: number) => {
    const c: DrawingContainer = {
      id: uid('c'),
      label: t('defaultContainerLabel', lang),
      x: x - 140,
      y: y - 90,
      w: 280,
      h: 180,
      parentId: findContainerAt(x, y, containers)?.id ?? null,
    };
    commit({ containers: [...containers, c] });
    setSel({ kind: 'container', id: c.id });
    setTool('select');
  };

  const deleteSelection = () => {
    if (!sel) return;
    if (sel.kind === 'edge') {
      commit({ edges: state.edges.filter(e => e.id !== sel.id) });
    } else if (sel.kind === 'block') {
      commit({
        blocks: state.blocks.filter(b => b.id !== sel.id),
        edges: state.edges.filter(e => e.from !== sel.id && e.to !== sel.id),
      });
    } else if (sel.kind === 'container') {
      commit({
        containers: containers
          .filter(c => c.id !== sel.id)
          .map(c => (c.parentId === sel.id ? { ...c, parentId: null } : c)),
        blocks: state.blocks.map(b => (b.parentId === sel.id ? { ...b, parentId: null } : b)),
        edges: state.edges.filter(e => e.from !== sel.id && e.to !== sel.id),
      });
    }
    setSel(null);
  };

  const fitView = useCallback(() => {
    const vp = viewportRef.current;
    const items = [
      ...state.blocks.map(b => {
        const s = blockSize(b, lang);
        return { x: b.x, y: b.y, w: s.w, h: s.h };
      }),
      ...containers.map(c => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
    ];
    if (!items.length) {
      setScale(1);
      setPan({ x: 24, y: 24 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const it of items) {
      minX = Math.min(minX, it.x);
      minY = Math.min(minY, it.y);
      maxX = Math.max(maxX, it.x + it.w);
      maxY = Math.max(maxY, it.y + it.h);
    }
    const pad = 36;
    const worldW = Math.max(1, maxX - minX + pad * 2);
    const worldH = Math.max(1, maxY - minY + pad * 2);
    const s = Math.max(0.8, Math.min(2.4, Math.min(vp.w / worldW, vp.h / worldH)));
    setScale(s);
    // Center content in the visible viewport
    setPan({
      x: (vp.w - worldW * s) / 2 - (minX - pad) * s,
      y: (vp.h - worldH * s) / 2 - (minY - pad) * s,
    });
  }, [containers, lang, state.blocks]);

  // Keep SVG viewBox = element size so content isn't letterboxed/clipped mid-canvas
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const apply = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(120, Math.round(r.width));
      const h = Math.max(160, Math.round(r.height));
      setViewport(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    window.addEventListener('orientationchange', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', apply);
    };
  }, []);

  useEffect(() => {
    if (didInitialFit.current) return;
    if ((state.blocks.length || containers.length) && viewport.w > 120) {
      didInitialFit.current = true;
      // defer so viewport is applied
      requestAnimationFrame(() => fitView());
    }
  }, [containers.length, fitView, state.blocks.length, viewport.w, viewport.h]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        deleteSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, state]);

  const suppressSelect = (e: React.SyntheticEvent) => {
    if ((e.target as HTMLElement)?.closest?.('input, textarea')) return;
    e.preventDefault();
    clearWindowSelection();
  };

  const beginResize = (
    e: ReactPointerEvent,
    kind: 'resize-container' | 'resize-block',
    id: string,
    handle: ResizeHandle,
    box: { w: number; h: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();
    clearWindowSelection();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const world = toWorld(e.clientX, e.clientY);
    liveSizes.current[id] = { w: box.w, h: box.h };
    drag.current = {
      kind,
      id,
      handle,
      ox: world.x,
      oy: world.y,
      startW: box.w,
      startH: box.h,
      startX: world.x,
      startY: world.y,
      moved: false,
      snapshot: cloneDrawingSlice(state),
    };
    setSel(kind === 'resize-block' ? { kind: 'block', id } : { kind: 'container', id });
  };

  const fitBlockToContent = (id: string) => {
    const b = state.blocks.find(x => x.id === id);
    if (!b) return;
    const fit = fittedBlockSize(b.type, lang);
    commit({ blocks: state.blocks.map(x => (x.id === id ? { ...x, w: fit.w, h: fit.h } : x)) });
  };

  const onCanvasPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as Element;
    if (target.closest('.drawing-ui-chrome')) return;
    if (target.closest('.drawing-resize-handle')) return;
    if (target.closest('input, textarea')) return;

    e.preventDefault();
    clearWindowSelection();

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinch.current = { dist, scale };
      drag.current = null;
      return;
    }

    const world = toWorld(e.clientX, e.clientY);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);

    if (armedType && tool === 'select') {
      placeBlock(armedType, world.x, world.y);
      return;
    }
    if (tool === 'container') {
      addContainer(world.x, world.y);
      return;
    }

    // Blocks on top
    for (const block of [...state.blocks].reverse()) {
      const sz = blockSize(block, lang);
      if (pointInRect(world.x, world.y, { x: block.x, y: block.y, w: sz.w, h: sz.h })) {
        if (tool === 'delete') {
          commit({
            blocks: state.blocks.filter(b => b.id !== block.id),
            edges: state.edges.filter(ed => ed.from !== block.id && ed.to !== block.id),
          });
          setSel(null);
          return;
        }
        if (tool === 'connect') {
          if (connectFrom && connectFrom !== block.id) {
            const exists = state.edges.some(ed => ed.from === connectFrom && ed.to === block.id);
            if (!exists) commit({ edges: [...state.edges, { id: uid('e'), from: connectFrom, to: block.id, direction: 'forward' }] });
            setConnectFrom(null);
          } else setConnectFrom(block.id);
          setSel({ kind: 'block', id: block.id });
          return;
        }
        setSel({ kind: 'block', id: block.id });
        drag.current = {
          kind: 'block',
          id: block.id,
          ox: world.x - block.x,
          oy: world.y - block.y,
          startX: world.x,
          startY: world.y,
          moved: false,
          snapshot: cloneDrawingSlice(state),
        };
        longPress.current = window.setTimeout(() => setSel({ kind: 'block', id: block.id }), 450);
        return;
      }
    }

    // Containers (body only — resize via handle layer)
    for (const c of [...containers].sort((a, b) => a.w * a.h - b.w * b.h)) {
      if (pointInRect(world.x, world.y, c)) {
        if (tool === 'delete') {
          commit({
            containers: containers.filter(x => x.id !== c.id),
            blocks: state.blocks.map(b => (b.parentId === c.id ? { ...b, parentId: null } : b)),
            edges: state.edges.filter(ed => ed.from !== c.id && ed.to !== c.id),
          });
          setSel(null);
          return;
        }
        if (tool === 'connect') {
          if (connectFrom && connectFrom !== c.id) {
            const exists = state.edges.some(ed => ed.from === connectFrom && ed.to === c.id);
            if (!exists) commit({ edges: [...state.edges, { id: uid('e'), from: connectFrom, to: c.id, direction: 'forward' }] });
            setConnectFrom(null);
          } else setConnectFrom(c.id);
          setSel({ kind: 'container', id: c.id });
          return;
        }
        setSel({ kind: 'container', id: c.id });
        // Freeze membership at drag start (parentId and/or center-inside).
        const members = collectContainerMoveMembers(c.id, state.blocks, containers);
        const moveContainerIds = [c.id, ...members.containerIds];
        const startContainers: Record<string, { x: number; y: number }> = {};
        for (const id of moveContainerIds) {
          const cc = containers.find(x => x.id === id);
          if (cc) startContainers[id] = { x: cc.x, y: cc.y };
        }
        const startBlocks: Record<string, { x: number; y: number }> = {};
        for (const id of members.blockIds) {
          const bb = state.blocks.find(x => x.id === id);
          if (bb) startBlocks[id] = { x: bb.x, y: bb.y };
        }
        drag.current = {
          kind: 'container',
          id: c.id,
          ox: world.x - c.x,
          oy: world.y - c.y,
          originX: c.x,
          originY: c.y,
          startX: world.x,
          startY: world.y,
          moved: false,
          snapshot: cloneDrawingSlice(state),
          moveBlockIds: members.blockIds,
          moveContainerIds,
          startBlocks,
          startContainers,
        };
        return;
      }
    }

    setSel(null);
    setConnectFrom(null);
    drag.current = {
      kind: 'pan',
      ox: pan.x,
      oy: pan.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const applyResizeMove = (world: { x: number; y: number }, d: DragState) => {
    if (!d.id || d.startW == null || d.startH == null) return;
    const dx = world.x - d.ox;
    const dy = world.y - d.oy;
    let w = d.startW;
    let h = d.startH;
    if (d.handle === 'se' || d.handle === 'e') w = d.startW + dx;
    if (d.handle === 'se' || d.handle === 's') h = d.startH + dy;

    if (d.kind === 'resize-container') {
      w = Math.max(MIN_CONTAINER, w);
      h = Math.max(MIN_CONTAINER, h);
      liveSizes.current[d.id] = { w, h };
      onChange({
        ...state,
        compared: false,
        containers: containers.map(c => (c.id === d.id ? { ...c, w, h } : c)),
      });
    } else if (d.kind === 'resize-block') {
      const b = state.blocks.find(x => x.id === d.id);
      if (!b) return;
      const min = blockMinSize(b, lang);
      w = Math.max(min.w, w);
      h = Math.max(min.h, h);
      liveSizes.current[d.id] = { w, h };
      onChange({
        ...state,
        compared: false,
        blocks: state.blocks.map(x => (x.id === d.id ? { ...x, w, h } : x)),
      });
    }
  };

  const onCanvasPointerMove = (e: ReactPointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointers.current.size === 2 && pinch.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinch.current.dist || 1);
      setScale(Math.max(0.8, Math.min(2.5, pinch.current.scale * ratio)));
      return;
    }

    const d = drag.current;
    if (!d) return;
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }

    if (d.kind === 'pan') {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const vp = viewportRef.current;
      const dx = ((e.clientX - d.startX) / rect.width) * vp.w;
      const dy = ((e.clientY - d.startY) / rect.height) * vp.h;
      setPan({ x: d.ox + dx, y: d.oy + dy });
      d.moved = true;
      return;
    }

    const world = toWorld(e.clientX, e.clientY);
    if (Math.hypot(world.x - d.startX, world.y - d.startY) > 2) d.moved = true;

    if (d.kind === 'resize-container' || d.kind === 'resize-block') {
      applyResizeMove(world, d);
      return;
    }

    if (d.kind === 'block' && d.id) {
      const x = world.x - d.ox;
      const y = world.y - d.oy;
      onChange({
        ...state,
        compared: false,
        blocks: state.blocks.map(b => (b.id === d.id ? { ...b, x, y } : b)),
      });
    } else if (d.kind === 'container' && d.id && d.originX != null && d.originY != null) {
      const nx = world.x - d.ox;
      const ny = world.y - d.oy;
      const dx = nx - d.originX;
      const dy = ny - d.originY;
      const moved = applyContainerMoveDelta(
        dx,
        dy,
        d.moveBlockIds || [],
        d.moveContainerIds || [d.id],
        state.blocks,
        containers,
        {
          blocks: d.startBlocks || {},
          containers: d.startContainers || {},
        },
      );
      onChange({
        ...state,
        compared: false,
        containers: moved.containers,
        blocks: moved.blocks,
      });
    }
  };

  const onCanvasPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
    const d = drag.current;
    drag.current = null;
    if (!d) return;

    if (d.kind === 'block' && d.id && d.moved) {
      const b = state.blocks.find(x => x.id === d.id);
      if (b) {
        if (d.snapshot) {
          history.current.push(d.snapshot);
          future.current = [];
        }
        const sz = blockSize(b, lang);
        const parent = findContainerAt(b.x + sz.w / 2, b.y + sz.h / 2, containers, null);
        let nextParent = parent?.id ?? null;
        if (b.parentId) {
          const prev = containers.find(c => c.id === b.parentId);
          if (prev && !pointInRect(b.x + sz.w / 2, b.y + sz.h / 2, prev)) nextParent = parent?.id ?? null;
        }
        onChange({
          ...state,
          compared: false,
          blocks: state.blocks.map(x => (x.id === d.id ? { ...x, parentId: nextParent } : x)),
        });
      }
    } else if (
      (d.kind === 'container' || d.kind === 'resize-container' || d.kind === 'resize-block') &&
      d.moved &&
      d.snapshot
    ) {
      history.current.push(d.snapshot);
      future.current = [];
      if (d.kind === 'container' && d.id) {
        const c = containers.find(x => x.id === d.id);
        if (c) {
          const parent = findContainerAt(c.x + c.w / 2, c.y + c.h / 2, containers, d.id);
          onChange({
            ...state,
            compared: false,
            containers: containers.map(x => (x.id === d.id ? { ...x, parentId: parent?.id ?? null } : x)),
          });
        }
      }
    }
    if (d.id) delete liveSizes.current[d.id];
    try { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); } catch { /* */ }
  };

  const onHandlePointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || (d.kind !== 'resize-container' && d.kind !== 'resize-block')) return;
    e.preventDefault();
    const world = toWorld(e.clientX, e.clientY);
    if (Math.hypot(world.x - d.startX, world.y - d.startY) > 1) d.moved = true;
    applyResizeMove(world, d);
  };

  const onHandlePointerUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || (d.kind !== 'resize-container' && d.kind !== 'resize-block')) return;
    if (d.moved && d.snapshot) {
      history.current.push(d.snapshot);
      future.current = [];
    }
    if (d.id) delete liveSizes.current[d.id];
    drag.current = null;
    try { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); } catch { /* */ }
  };

  const compare = useCallback(() => {
    if (!expected) return;
    const present = new Set(state.blocks.map(b => b.type));
    const matchedComponents = expected.components.filter(c => present.has(c));
    const missedComponents = expected.components.filter(c => !present.has(c));
    const edgeKey = (from: ComponentType, to: ComponentType) => `${from}->${to}`;
    const userEdges = new Set<string>();
    for (const e of state.edges) {
      const a = state.blocks.find(b => b.id === e.from);
      const b = state.blocks.find(b => b.id === e.to);
      if (a && b) userEdges.add(edgeKey(a.type, b.type));
    }
    const matchedEdges = expected.edges.filter(e => userEdges.has(edgeKey(e.from, e.to))).map(e => edgeKey(e.from, e.to));
    const missedEdges = expected.edges.filter(e => !userEdges.has(edgeKey(e.from, e.to))).map(e => edgeKey(e.from, e.to));
    const compScore = expected.components.length ? matchedComponents.length / expected.components.length : 0;
    const edgeScore = expected.edges.length ? matchedEdges.length / expected.edges.length : 0;
    const score = Math.round((compScore * 0.6 + edgeScore * 0.4) * 100) / 100;
    onChange({
      ...state,
      compared: true,
      matchedComponents,
      missedComponents,
      matchedEdges,
      missedEdges,
      score,
    });
  }, [expected, onChange, state]);

  const selectedEdge = sel?.kind === 'edge' ? state.edges.find(e => e.id === sel.id) : null;
  const sortedContainers = useMemo(
    () => [...containers].sort((a, b) => b.w * b.h - a.w * a.h),
    [containers],
  );

  const startEdgeEdit = (edge: DrawingEdge) => {
    setEditingLabel({ kind: 'edge', id: edge.id });
    setLabelDraft(edge.label || '');
  };
  const startContainerEdit = (c: DrawingContainer) => {
    setEditingLabel({ kind: 'container', id: c.id });
    setLabelDraft(c.label);
  };
  const applyLabel = () => {
    if (!editingLabel) return;
    if (editingLabel.kind === 'edge') {
      commit({
        edges: state.edges.map(e => (e.id === editingLabel.id ? { ...e, label: labelDraft } : e)),
      });
    } else {
      commit({
        containers: containers.map(c => (c.id === editingLabel.id ? { ...c, label: labelDraft } : c)),
      });
    }
    setEditingLabel(null);
  };

  const toggleEdgeDir = () => {
    if (!selectedEdge) return;
    commit({
      edges: state.edges.map(e =>
        e.id === selectedEdge.id ? { ...e, direction: cycleDirection(e.direction) } : e,
      ),
    });
  };

  const onDragStartPlace = (type: ComponentType, clientX: number, clientY: number) => {
    setArmedType(type);
    const world = toWorld(clientX, clientY);
    placeBlock(type, world.x, world.y);
  };

  const toolbarItems: { id: Tool | 'undo' | 'redo'; labelKey: Parameters<typeof t>[0]; icon: string; action: () => void; active?: boolean; danger?: boolean }[] = [
    { id: 'select', labelKey: 'toolSelect', icon: '↖', active: tool === 'select', action: () => { setTool('select'); setConnectFrom(null); } },
    { id: 'connect', labelKey: 'toolConnect', icon: '⟷', active: tool === 'connect', action: () => setTool('connect') },
    { id: 'container', labelKey: 'toolContainer', icon: '▢', active: tool === 'container', action: () => { setTool('container'); setConnectFrom(null); } },
    {
      id: 'delete',
      labelKey: 'toolDelete',
      icon: '⌫',
      danger: true,
      action: () => {
        if (sel) deleteSelection();
        else setTool('delete');
      },
    },
    { id: 'undo', labelKey: 'toolUndo', icon: '↶', action: undo },
    { id: 'redo', labelKey: 'toolRedo', icon: '↷', action: redo },
  ];

  return (
    <div className="drawing-board" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="drawing-board__header">
        <h3 className="drawing-board__title">{t('drawingBoard', lang)}</h3>
        <p className="drawing-board__hint">{t('drawingHint', lang)}</p>
        {armedType && <p className="drawing-board__armed">{t('paletteArmed', lang)}</p>}
      </div>

      <div className="drawing-board__layout">
        <DrawingPaletteDesktop
          lang={lang}
          armedType={armedType}
          onArm={setArmedType}
          onDragStartPlace={onDragStartPlace}
          collapsed={deskCollapsed}
          onToggleCollapse={() => setDeskCollapsed(v => !v)}
        />

        <div className="drawing-board__main">
          <div className="drawing-board__zoom drawing-ui-chrome">
            <button type="button" className="drawing-icon-btn" onClick={() => setScale(s => Math.min(2.5, s * 1.15))} aria-label={t('toolZoomIn', lang)}>+</button>
            <button type="button" className="drawing-icon-btn" onClick={() => setScale(s => Math.max(0.8, s / 1.15))} aria-label={t('toolZoomOut', lang)}>−</button>
            <button type="button" className="drawing-icon-btn" onClick={fitView}>{t('toolFit', lang)}</button>
            <button type="button" className="drawing-icon-btn" onClick={compare}>{t('compareDesign', lang)}</button>
            <button
              type="button"
              className="drawing-icon-btn"
              onClick={() =>
                commit({
                  blocks: [],
                  containers: [],
                  edges: [],
                  score: 0,
                  matchedComponents: [],
                  missedComponents: [],
                  matchedEdges: [],
                  missedEdges: [],
                })
              }
            >
              {t('clearBoard', lang)}
            </button>
          </div>

          <div
            ref={wrapRef}
            className="drawing-board__canvas-wrap"
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={onCanvasPointerUp}
            onMouseDown={suppressSelect}
            onDoubleClick={suppressSelect}
            onDragStart={suppressSelect}
          >
            <svg
              ref={svgRef}
              className="drawing-board__svg"
              viewBox={`0 0 ${viewport.w} ${viewport.h}`}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            >
              <defs>
                <marker id="arrow-fwd" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
                </marker>
                <marker id="arrow-back" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
                  <polygon points="8 0, 0 3, 8 6" fill="var(--accent)" />
                </marker>
              </defs>
              <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
                {sortedContainers.map(c => {
                  const selected = sel?.kind === 'container' && sel.id === c.id;
                  const live = liveSizes.current[c.id];
                  const cw = live?.w ?? c.w;
                  const ch = live?.h ?? c.h;
                  return (
                    <g key={c.id} className="drawing-container">
                      <rect
                        x={c.x}
                        y={c.y}
                        width={cw}
                        height={ch}
                        rx={10}
                        fill="var(--accent-soft)"
                        stroke={selected ? 'var(--color-gold)' : 'var(--accent)'}
                        strokeWidth={selected ? 2.5 : 1.5}
                        strokeDasharray="6 4"
                        opacity={0.85}
                      />
                      <text
                        x={c.x + 10}
                        y={c.y + 18}
                        fontSize={12}
                        fontWeight={700}
                        fill="var(--text-primary)"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {c.label}
                      </text>
                    </g>
                  );
                })}

                {state.edges.map(edge => {
                  const ba = nodeBounds(edge.from, state.blocks, containers, lang);
                  const bb = nodeBounds(edge.to, state.blocks, containers, lang);
                  if (!ba || !bb) return null;
                  const ca = { x: ba.x + ba.w / 2, y: ba.y + ba.h / 2 };
                  const cb = { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 };
                  const p1 = edgePoint(ba, cb);
                  const p2 = edgePoint(bb, ca);
                  const mid = midpoint(p1, p2);
                  const selected = sel?.kind === 'edge' && sel.id === edge.id;
                  const dir: DrawingEdgeDirection = edge.direction || 'forward';
                  return (
                    <g key={edge.id} data-edge-id={edge.id}>
                      <line
                        className="drawing-edge-hit"
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="transparent"
                        strokeWidth={28}
                        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                        onPointerDown={ev => {
                          ev.stopPropagation();
                          ev.preventDefault();
                          clearWindowSelection();
                          if (tool === 'delete') {
                            commit({ edges: state.edges.filter(ed => ed.id !== edge.id) });
                            setSel(null);
                            return;
                          }
                          setSel({ kind: 'edge', id: edge.id });
                        }}
                      />
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={selected ? 'var(--color-gold)' : 'var(--accent)'}
                        strokeWidth={selected ? 2.5 : 2}
                        markerEnd={dir === 'forward' || dir === 'both' ? 'url(#arrow-fwd)' : undefined}
                        markerStart={dir === 'backward' || dir === 'both' ? 'url(#arrow-back)' : undefined}
                        opacity={0.85}
                        style={{ pointerEvents: 'none' }}
                      />
                      {edge.label && (
                        <text
                          x={mid.x}
                          y={mid.y - 8}
                          textAnchor="middle"
                          fontSize={10}
                          fill="var(--text-secondary)"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {edge.label}
                        </text>
                      )}
                      {selected && (
                        <g
                          className="drawing-ui-chrome"
                          transform={`translate(${mid.x}, ${mid.y})`}
                          onPointerDown={ev => {
                            ev.stopPropagation();
                            commit({ edges: state.edges.filter(ed => ed.id !== edge.id) });
                            setSel(null);
                          }}
                        >
                          <circle r={16} fill="var(--bg-elevated)" stroke="var(--warning)" strokeWidth={2} />
                          <text textAnchor="middle" dy="5" fontSize={16} fill="var(--warning)" style={{ pointerEvents: 'none' }}>
                            ✕
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {state.blocks.map(block => {
                  const selected = sel?.kind === 'block' && sel.id === block.id;
                  const connecting = connectFrom === block.id;
                  const icon = paletteIconUrl(block.type);
                  const fit = fittedBlockSize(block.type, lang);
                  const live = liveSizes.current[block.id];
                  const sz = live || blockSize(block, lang);
                  const textX = block.x + PAD_X + ICON + GAP;
                  const lineY0 = block.y + PAD_Y + LABEL_SIZE;
                  return (
                    <g key={block.id} style={{ cursor: 'grab' }}>
                      <rect
                        x={block.x}
                        y={block.y}
                        width={sz.w}
                        height={sz.h}
                        rx={10}
                        fill={paletteColor(block.type)}
                        stroke={selected || connecting ? 'var(--color-gold)' : 'transparent'}
                        strokeWidth={3}
                      />
                      {icon && (
                        <>
                          <rect
                            x={block.x + PAD_X - 2}
                            y={block.y + (sz.h - ICON) / 2 - 2}
                            width={ICON + 4}
                            height={ICON + 4}
                            rx={4}
                            fill="#ffffff"
                            style={{ pointerEvents: 'none' }}
                          />
                          <image
                            href={icon}
                            x={block.x + PAD_X}
                            y={block.y + (sz.h - ICON) / 2}
                            width={ICON}
                            height={ICON}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ pointerEvents: 'none' }}
                          />
                        </>
                      )}
                      {fit.lines.map((line, i) => (
                        <text
                          key={i}
                          x={textX}
                          y={lineY0 + i * (LABEL_SIZE + 3)}
                          fill="#fff"
                          fontSize={LABEL_SIZE}
                          fontWeight={700}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {line}
                        </text>
                      ))}
                      <text
                        x={textX}
                        y={lineY0 + fit.lines.length * (LABEL_SIZE + 3) + 2}
                        fill="rgba(255,255,255,0.88)"
                        fontSize={SUB_SIZE}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {fit.sub}
                      </text>
                      {(selected || tool === 'connect') && (
                        <>
                          {[
                            { x: block.x + sz.w / 2, y: block.y },
                            { x: block.x + sz.w, y: block.y + sz.h / 2 },
                            { x: block.x + sz.w / 2, y: block.y + sz.h },
                            { x: block.x, y: block.y + sz.h / 2 },
                          ].map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={6}
                              fill="var(--bg-elevated)"
                              stroke="var(--accent)"
                              strokeWidth={2}
                              onPointerDown={ev => {
                                ev.stopPropagation();
                                setTool('connect');
                                setConnectFrom(block.id);
                              }}
                            />
                          ))}
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Resize handles above everything */}
                {sel?.kind === 'container' && (() => {
                  const c = containers.find(x => x.id === sel.id);
                  if (!c) return null;
                  const live = liveSizes.current[c.id];
                  const box = { x: c.x, y: c.y, w: live?.w ?? c.w, h: live?.h ?? c.h };
                  return resizeHandles(box).map(h => (
                    <g
                      key={`ch-${h.id}`}
                      className="drawing-resize-handle drawing-ui-chrome"
                      style={{ cursor: h.cursor }}
                      onPointerDown={ev => beginResize(ev, 'resize-container', c.id, h.id, box)}
                      onPointerMove={onHandlePointerMove}
                      onPointerUp={onHandlePointerUp}
                      onDoubleClick={ev => {
                        ev.stopPropagation();
                        ev.preventDefault();
                      }}
                    >
                      <circle cx={h.x} cy={h.y} r={HANDLE_HIT} fill="transparent" />
                      <rect
                        x={h.x - HANDLE / 2}
                        y={h.y - HANDLE / 2}
                        width={HANDLE}
                        height={HANDLE}
                        fill="var(--accent)"
                        stroke="var(--bg-elevated)"
                        strokeWidth={1.5}
                        rx={2}
                      />
                    </g>
                  ));
                })()}

                {sel?.kind === 'block' && (() => {
                  const b = state.blocks.find(x => x.id === sel.id);
                  if (!b) return null;
                  const live = liveSizes.current[b.id];
                  const sz = live || blockSize(b, lang);
                  const box = { x: b.x, y: b.y, w: sz.w, h: sz.h };
                  return (
                    <>
                      {resizeHandles(box).map(h => (
                        <g
                          key={`bh-${h.id}`}
                          className="drawing-resize-handle drawing-ui-chrome"
                          style={{ cursor: h.cursor }}
                          onPointerDown={ev => beginResize(ev, 'resize-block', b.id, h.id, box)}
                          onPointerMove={onHandlePointerMove}
                          onPointerUp={onHandlePointerUp}
                          onDoubleClick={ev => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            fitBlockToContent(b.id);
                          }}
                        >
                          <circle cx={h.x} cy={h.y} r={HANDLE_HIT} fill="transparent" />
                          <rect
                            x={h.x - HANDLE / 2}
                            y={h.y - HANDLE / 2}
                            width={HANDLE}
                            height={HANDLE}
                            fill="var(--color-gold)"
                            stroke="var(--bg-elevated)"
                            strokeWidth={1.5}
                            rx={2}
                          />
                        </g>
                      ))}
                      <g
                        className="drawing-ui-chrome"
                        transform={`translate(${box.x + box.w - 28}, ${box.y - 18})`}
                        onPointerDown={ev => {
                          ev.stopPropagation();
                          fitBlockToContent(b.id);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <title>{t('toolFit', lang)}</title>
                        <rect width={26} height={16} rx={4} fill="var(--bg-elevated)" stroke="var(--accent)" />
                        <text x={13} y={11} textAnchor="middle" fontSize={8} fill="var(--accent)" fontWeight={700}>
                          Fit
                        </text>
                      </g>
                    </>
                  );
                })()}
              </g>
            </svg>
          </div>

          {selectedEdge && (
            <div className="drawing-edge-actions drawing-ui-chrome">
              <button type="button" className="drawing-icon-btn" onClick={() => startEdgeEdit(selectedEdge)}>
                {t('edgeLabel', lang)}
              </button>
              <button type="button" className="drawing-icon-btn" onClick={toggleEdgeDir}>
                {t('edgeDirection', lang)}
              </button>
            </div>
          )}

          {sel?.kind === 'container' && (
            <div className="drawing-edge-actions drawing-ui-chrome">
              <button
                type="button"
                className="drawing-icon-btn"
                onClick={() => {
                  const c = containers.find(x => x.id === sel.id);
                  if (c) startContainerEdit(c);
                }}
              >
                {t('containerLabel', lang)}
              </button>
            </div>
          )}

          <DrawingPaletteMobile
            lang={lang}
            armedType={armedType}
            onArm={setArmedType}
            onDragStartPlace={onDragStartPlace}
          />

          <div className="drawing-toolbar drawing-ui-chrome" role="toolbar" aria-label={t('drawingBoard', lang)}>
            {toolbarItems.map(item => (
              <button
                key={item.id}
                type="button"
                className={`drawing-toolbar__btn${item.active ? ' is-active' : ''}${item.danger && tool === 'delete' ? ' is-active' : ''}`}
                title={t(item.labelKey, lang)}
                aria-label={t(item.labelKey, lang)}
                onClick={item.action}
              >
                <span className="drawing-toolbar__icon" aria-hidden>{item.icon}</span>
                <span className="drawing-toolbar__label">{t(item.labelKey, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {editingLabel && (
        <div className="drawing-label-modal">
          <input
            autoFocus
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') applyLabel();
              if (e.key === 'Escape') setEditingLabel(null);
            }}
            placeholder={editingLabel.kind === 'edge' ? t('edgeLabel', lang) : t('containerLabel', lang)}
          />
          <button type="button" onClick={applyLabel}>{t('closeSheet', lang)}</button>
        </div>
      )}

      {state.compared && expected && (
        <div className="drawing-compare">
          <p className="drawing-compare__title">{t('proposedDesign', lang)}</p>
          <div className="drawing-compare__svg-wrap">
            <svg viewBox="0 0 900 560" width="100%" style={{ display: 'block', minHeight: 160 }}>
              {expected.edges.map((edge, i) => {
                const from = expected.referenceLayout.find(b => b.type === edge.from);
                const to = expected.referenceLayout.find(b => b.type === edge.to);
                if (!from || !to) return null;
                return (
                  <line
                    key={i}
                    x1={from.x + 60}
                    y1={from.y + 32}
                    x2={to.x + 60}
                    y2={to.y + 32}
                    stroke="#155E57"
                    strokeWidth={1.5}
                    opacity={0.5}
                  />
                );
              })}
              {expected.referenceLayout.map(block => (
                <g key={`${block.type}-${block.x}`}>
                  <rect x={block.x} y={block.y} width={120} height={64} rx={8} fill={paletteColor(block.type)} opacity={0.9} />
                  <image href={paletteIconUrl(block.type)} x={block.x + 8} y={block.y + 16} width={28} height={28} />
                  <text x={block.x + 44} y={block.y + 36} fill="#fff" fontSize={10} fontWeight={600}>
                    {paletteShort(block.type)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <p style={{ margin: '8px 0 4px', fontWeight: 600, color: 'var(--accent)' }}>
            {t('drawingScore', lang)}: {Math.round(state.score * 100)}%
          </p>
          <p style={{ margin: '0 0 4px', color: 'var(--success)', fontSize: '0.8125rem' }}>
            {t('matchedComponents', lang)}: {state.matchedComponents.map(c => paletteLabel(c as ComponentType, lang)).join(', ') || '—'}
          </p>
          <p style={{ margin: '0 0 4px', color: 'var(--warning)', fontSize: '0.8125rem' }}>
            {t('missedComponents', lang)}: {state.missedComponents.map(c => paletteLabel(c as ComponentType, lang)).join(', ') || '—'}
          </p>
          <p style={{ margin: '0 0 4px', color: 'var(--success)', fontSize: '0.8125rem' }}>
            {t('matchedEdges', lang)}: {state.matchedEdges.length}
          </p>
          <p style={{ margin: 0, color: 'var(--warning)', fontSize: '0.8125rem' }}>
            {t('missedEdges', lang)}: {state.missedEdges.length}
          </p>
        </div>
      )}
    </div>
  );
}
