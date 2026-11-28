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
import { paletteAws, paletteColor, paletteIconUrl, paletteLabel, paletteShort } from '../interactive/palette';
import { DRAWING_EXPECTATIONS } from '../interactive/drawingData';
import {
  BLOCK_H,
  BLOCK_W,
  BOARD_H,
  BOARD_W,
  HANDLE,
  MIN_CONTAINER,
  cloneDrawingSlice,
  collectDescendantIds,
  cycleDirection,
  edgePoint,
  findContainerAt,
  midpoint,
  nodeBounds,
  nodeCenter,
  pointInRect,
  uid,
} from '../interactive/drawingGeom';
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

export function DrawingBoard({ scenarioId, lang, state, onChange }: Props) {
  const containers = state.containers || [];
  const [tool, setTool] = useState<Tool>('select');
  const [sel, setSel] = useState<Sel>(null);
  const [armedType, setArmedType] = useState<ComponentType | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [deskCollapsed, setDeskCollapsed] = useState(false);
  const [editingLabel, setEditingLabel] = useState<{ kind: 'edge' | 'container'; id: string } | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const history = useRef<ReturnType<typeof cloneDrawingSlice>[]>([]);
  const future = useRef<ReturnType<typeof cloneDrawingSlice>[]>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number; panX: number; panY: number } | null>(null);
  const drag = useRef<{
    kind: 'block' | 'container' | 'resize' | 'pan' | 'connect' | 'place';
    id?: string;
    handle?: string;
    ox: number;
    oy: number;
    startX: number;
    startY: number;
    moved: boolean;
    placeType?: ComponentType;
    snapshot?: ReturnType<typeof cloneDrawingSlice>;
  } | null>(null);
  const longPress = useRef<number | null>(null);

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

  // g transform = translate(pan) scale(scale) → world = (svg - pan) / scale
  const toWorld = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const svgX = ((clientX - rect.left) / rect.width) * BOARD_W;
    const svgY = ((clientY - rect.top) / rect.height) * BOARD_H;
    return { x: (svgX - pan.x) / scale, y: (svgY - pan.y) / scale };
  };

  const placeBlock = (type: ComponentType, x: number, y: number) => {
    const parent = findContainerAt(x + BLOCK_W / 2, y + BLOCK_H / 2, containers);
    const block: DrawingBlock = {
      id: uid('b'),
      type,
      x: Math.max(0, Math.min(BOARD_W - BLOCK_W, x - BLOCK_W / 2)),
      y: Math.max(0, Math.min(BOARD_H - BLOCK_H, y - BLOCK_H / 2)),
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
      // Remove container only; children stay on the board unparented.
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

  const fitView = () => {
    const items = [
      ...state.blocks.map(b => ({ x: b.x, y: b.y, w: BLOCK_W, h: BLOCK_H })),
      ...containers.map(c => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
    ];
    if (!items.length) {
      setScale(1);
      setPan({ x: 40, y: 40 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const it of items) {
      minX = Math.min(minX, it.x);
      minY = Math.min(minY, it.y);
      maxX = Math.max(maxX, it.x + it.w);
      maxY = Math.max(maxY, it.y + it.h);
    }
    const pad = 40;
    const w = Math.max(1, maxX - minX + pad * 2);
    const h = Math.max(1, maxY - minY + pad * 2);
    const s = Math.max(0.35, Math.min(2.2, Math.min(BOARD_W / w, BOARD_H / h)));
    setScale(s);
    setPan({ x: -minX * s + pad * s, y: -minY * s + pad * s });
  };

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

  const onCanvasPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as Element;
    if (target.closest('.drawing-ui-chrome')) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinch.current = { dist, scale, panX: pan.x, panY: pan.y };
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

    // Edge hit (wide)
    for (const edge of [...state.edges].reverse()) {
      const a = nodeCenter(edge.from, state.blocks, containers);
      const b = nodeCenter(edge.to, state.blocks, containers);
      if (!a || !b) continue;
      const ba = nodeBounds(edge.from, state.blocks, containers)!;
      const bb = nodeBounds(edge.to, state.blocks, containers)!;
      const p1 = edgePoint(ba, b);
      const p2 = edgePoint(bb, a);
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const t0 = Math.max(0, Math.min(1, ((world.x - p1.x) * dx + (world.y - p1.y) * dy) / (len * len)));
      const dist = Math.hypot(world.x - (p1.x + t0 * dx), world.y - (p1.y + t0 * dy));
      if (dist < 14 / scale) {
        if (tool === 'delete') {
          commit({ edges: state.edges.filter(ed => ed.id !== edge.id) });
          setSel(null);
          return;
        }
        setSel({ kind: 'edge', id: edge.id });
        return;
      }
    }

    // Blocks on top
    for (const block of [...state.blocks].reverse()) {
      if (pointInRect(world.x, world.y, { x: block.x, y: block.y, w: BLOCK_W, h: BLOCK_H })) {
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

    // Container resize handles / body
    for (const c of [...containers].sort((a, b) => a.w * a.h - b.w * b.h)) {
      const handles = [
        { id: 'se', x: c.x + c.w, y: c.y + c.h },
        { id: 'e', x: c.x + c.w, y: c.y + c.h / 2 },
        { id: 's', x: c.x + c.w / 2, y: c.y + c.h },
      ];
      for (const h of handles) {
        if (Math.hypot(world.x - h.x, world.y - h.y) < 18 / scale) {
          setSel({ kind: 'container', id: c.id });
          drag.current = {
            kind: 'resize',
            id: c.id,
            handle: h.id,
            ox: c.w,
            oy: c.h,
            startX: world.x,
            startY: world.y,
            moved: false,
            snapshot: cloneDrawingSlice(state),
          };
          return;
        }
      }
      if (pointInRect(world.x, world.y, c)) {
        if (tool === 'delete') {
          setSel({ kind: 'container', id: c.id });
          // defer to deleteSelection semantics via commit unparent
          const { containerIds } = collectDescendantIds(c.id, state.blocks, containers);
          const kill = new Set([c.id, ...containerIds]);
          commit({
            containers: containers.filter(x => !kill.has(x.id)),
            blocks: state.blocks.map(b => (b.parentId && kill.has(b.parentId) ? { ...b, parentId: null } : b)),
            edges: state.edges.filter(ed => !kill.has(ed.from) && !kill.has(ed.to)),
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
        drag.current = {
          kind: 'container',
          id: c.id,
          ox: world.x - c.x,
          oy: world.y - c.y,
          startX: world.x,
          startY: world.y,
          moved: false,
          snapshot: cloneDrawingSlice(state),
        };
        return;
      }
    }

    // Empty canvas: pan or clear selection
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

  const onCanvasPointerMove = (e: ReactPointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointers.current.size === 2 && pinch.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinch.current.dist || 1);
      const next = Math.max(0.35, Math.min(2.5, pinch.current.scale * ratio));
      setScale(next);
      // two-finger pan: midpoint delta
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      // approximate using first frame midpoint stored implicitly via pan
      void mid;
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
      const dx = ((e.clientX - d.startX) / rect.width) * BOARD_W;
      const dy = ((e.clientY - d.startY) / rect.height) * BOARD_H;
      setPan({ x: d.ox + dx, y: d.oy + dy });
      d.moved = true;
      return;
    }

    const world = toWorld(e.clientX, e.clientY);
    if (Math.hypot(world.x - d.startX, world.y - d.startY) > 3) d.moved = true;

    if (d.kind === 'block' && d.id) {
      const x = world.x - d.ox;
      const y = world.y - d.oy;
      onChange({
        ...state,
        compared: false,
        blocks: state.blocks.map(b => (b.id === d.id ? { ...b, x, y } : b)),
      });
    } else if (d.kind === 'container' && d.id) {
      const c0 = containers.find(c => c.id === d.id);
      if (!c0) return;
      const nx = world.x - d.ox;
      const ny = world.y - d.oy;
      const dx = nx - c0.x;
      const dy = ny - c0.y;
      const { blockIds, containerIds } = collectDescendantIds(d.id, state.blocks, containers);
      const moveC = new Set([d.id, ...containerIds]);
      const moveB = new Set(blockIds);
      onChange({
        ...state,
        compared: false,
        containers: containers.map(c => (moveC.has(c.id) ? { ...c, x: c.x + dx, y: c.y + dy } : c)),
        blocks: state.blocks.map(b => (moveB.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } : b)),
      });
    } else if (d.kind === 'resize' && d.id) {
      const c0 = containers.find(c => c.id === d.id);
      if (!c0) return;
      let w = c0.w, h = c0.h;
      if (d.handle === 'se' || d.handle === 'e') w = Math.max(MIN_CONTAINER, world.x - c0.x);
      if (d.handle === 'se' || d.handle === 's') h = Math.max(MIN_CONTAINER, world.y - c0.y);
      onChange({
        ...state,
        compared: false,
        containers: containers.map(c => (c.id === d.id ? { ...c, w, h } : c)),
      });
    } else if (d.kind === 'place' && d.placeType) {
      // ghost handled via armedType only
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
        const parent = findContainerAt(b.x + BLOCK_W / 2, b.y + BLOCK_H / 2, containers, null);
        const parentId = parent && parent.id !== b.parentId ? parent.id : parent?.id ?? null;
        // leave container if center outside previous parent
        let nextParent = parentId;
        if (b.parentId) {
          const prev = containers.find(c => c.id === b.parentId);
          if (prev && !pointInRect(b.x + BLOCK_W / 2, b.y + BLOCK_H / 2, prev)) nextParent = parent?.id ?? null;
        }
        onChange({
          ...state,
          compared: false,
          blocks: state.blocks.map(x => (x.id === d.id ? { ...x, parentId: nextParent } : x)),
        });
      }
    } else if ((d.kind === 'container' || d.kind === 'resize') && d.moved && d.snapshot) {
      history.current.push(d.snapshot);
      future.current = [];
      if (d.kind === 'container' && d.id) {
        const c = (state.containers || []).find(x => x.id === d.id);
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
      // edges to/from containers ignored for scoring
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
            <button type="button" className="drawing-icon-btn" onClick={() => setScale(s => Math.max(0.35, s / 1.15))} aria-label={t('toolZoomOut', lang)}>−</button>
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
          >
            <svg
              ref={svgRef}
              className="drawing-board__svg"
              viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
              width="100%"
              height="100%"
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
                  return (
                    <g key={c.id} className="drawing-container">
                      <rect
                        x={c.x}
                        y={c.y}
                        width={c.w}
                        height={c.h}
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
                        onDoubleClick={() => startContainerEdit(c)}
                        style={{ cursor: 'text' }}
                      >
                        {c.label}
                      </text>
                      {selected && (
                        <>
                          <rect x={c.x + c.w - HANDLE / 2} y={c.y + c.h - HANDLE / 2} width={HANDLE} height={HANDLE} fill="var(--accent)" rx={2} />
                          <rect x={c.x + c.w - HANDLE / 2} y={c.y + c.h / 2 - HANDLE / 2} width={HANDLE} height={HANDLE} fill="var(--accent)" rx={2} />
                          <rect x={c.x + c.w / 2 - HANDLE / 2} y={c.y + c.h - HANDLE / 2} width={HANDLE} height={HANDLE} fill="var(--accent)" rx={2} />
                          {/* 44px invisible hit pads */}
                          <circle cx={c.x + c.w} cy={c.y + c.h} r={22} fill="transparent" />
                        </>
                      )}
                    </g>
                  );
                })}

                {state.edges.map(edge => {
                  const ba = nodeBounds(edge.from, state.blocks, containers);
                  const bb = nodeBounds(edge.to, state.blocks, containers);
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
                        data-edge-id={edge.id}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="transparent"
                        strokeWidth={28}
                        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                        onPointerDown={ev => {
                          ev.stopPropagation();
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
                          onDoubleClick={() => startEdgeEdit(edge)}
                          style={{ pointerEvents: 'none' }}
                        >
                          {edge.label}
                        </text>
                      )}
                      {selected && (
                        <g
                          className="drawing-ui-chrome"
                          data-edge-delete={edge.id}
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
                  return (
                    <g key={block.id} style={{ cursor: 'grab' }}>
                      <rect
                        x={block.x}
                        y={block.y}
                        width={BLOCK_W}
                        height={BLOCK_H}
                        rx={10}
                        fill={paletteColor(block.type)}
                        stroke={selected || connecting ? 'var(--color-gold)' : 'transparent'}
                        strokeWidth={3}
                      />
                      {icon && (
                        <image href={icon} x={block.x + 8} y={block.y + 16} width={30} height={30} preserveAspectRatio="xMidYMid meet" />
                      )}
                      <text x={block.x + 46} y={block.y + 26} fill="#fff" fontSize={11} fontWeight={700}>
                        {paletteLabel(block.type, lang).slice(0, 14)}
                      </text>
                      <text x={block.x + 46} y={block.y + 42} fill="rgba(255,255,255,0.85)" fontSize={9}>
                        {paletteAws(block.type, lang).slice(0, 16)}
                      </text>
                      {/* connect handles */}
                      {(selected || tool === 'connect') && (
                        <>
                          {[
                            { x: block.x + BLOCK_W / 2, y: block.y },
                            { x: block.x + BLOCK_W, y: block.y + BLOCK_H / 2 },
                            { x: block.x + BLOCK_W / 2, y: block.y + BLOCK_H },
                            { x: block.x, y: block.y + BLOCK_H / 2 },
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

          <DrawingPaletteMobile
            lang={lang}
            armedType={armedType}
            onArm={setArmedType}
            onDragStartPlace={onDragStartPlace}
          />

          <div className="drawing-toolbar drawing-ui-chrome" role="toolbar" aria-label={t('drawingBoard', lang)}>
            {(
              [
                ['select', 'toolSelect'],
                ['connect', 'toolConnect'],
                ['container', 'toolContainer'],
                ['delete', 'toolDelete'],
              ] as const
            ).map(([id, key]) => (
              <button
                key={id}
                type="button"
                className={`drawing-toolbar__btn${tool === id ? ' is-active' : ''}`}
                onClick={() => {
                  setTool(id);
                  if (id !== 'connect') setConnectFrom(null);
                }}
              >
                {t(key, lang)}
              </button>
            ))}
            <button type="button" className="drawing-toolbar__btn" onClick={undo}>{t('toolUndo', lang)}</button>
            <button type="button" className="drawing-toolbar__btn" onClick={redo}>{t('toolRedo', lang)}</button>
            <button
              type="button"
              className="drawing-toolbar__btn"
              disabled={!sel}
              onClick={deleteSelection}
            >
              {t('deleteSelected', lang)}
            </button>
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
            <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} width="100%" style={{ display: 'block', minHeight: 160 }}>
              {expected.edges.map((edge, i) => {
                const from = expected.referenceLayout.find(b => b.type === edge.from);
                const to = expected.referenceLayout.find(b => b.type === edge.to);
                if (!from || !to) return null;
                return (
                  <line
                    key={i}
                    x1={from.x + BLOCK_W / 2}
                    y1={from.y + BLOCK_H / 2}
                    x2={to.x + BLOCK_W / 2}
                    y2={to.y + BLOCK_H / 2}
                    stroke="#155E57"
                    strokeWidth={1.5}
                    opacity={0.5}
                  />
                );
              })}
              {expected.referenceLayout.map(block => (
                <g key={`${block.type}-${block.x}`}>
                  <rect x={block.x} y={block.y} width={BLOCK_W} height={BLOCK_H} rx={8} fill={paletteColor(block.type)} opacity={0.9} />
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
