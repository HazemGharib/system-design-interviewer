import type { ComponentType, DrawingBlock, DrawingContainer, DrawingEdge, DrawingEdgeDirection, Lang } from '../types';
import { paletteAws, paletteLabel } from './palette';

export const BLOCK_W = 120;
export const BLOCK_H = 64;
export const BOARD_W = 900;
export const BOARD_H = 560;
export const HANDLE = 12;
export const HANDLE_HIT = 22; // world-space radius for hit / visual target
export const MIN_CONTAINER = 120;
export const PAD_X = 10;
export const PAD_Y = 8;
export const ICON = 28;
export const GAP = 8;
export const LABEL_SIZE = 11;
export const SUB_SIZE = 9;
export const MAX_LABEL_LINES = 2;
export const MAX_TEXT_WIDTH = 160;

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx() {
  if (measureCtx) return measureCtx;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  measureCtx = c.getContext('2d');
  return measureCtx;
}

export function measureTextWidth(text: string, fontSize: number, weight = 600) {
  const ctx = getMeasureCtx();
  if (!ctx) return text.length * fontSize * 0.55;
  ctx.font = `${weight} ${fontSize}px system-ui, "Noto Sans Arabic", sans-serif`;
  return ctx.measureText(text).width;
}

/** Wrap text to at most maxLines; ellipsis on overflow. */
export function wrapLabel(text: string, maxWidth: number, fontSize: number, maxLines = MAX_LABEL_LINES): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (measureTextWidth(trial, fontSize) <= maxWidth) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (lines.length < maxLines && cur) {
    if (measureTextWidth(cur, fontSize) <= maxWidth) lines.push(cur);
    else {
      let cut = cur;
      while (cut.length > 1 && measureTextWidth(`${cut}…`, fontSize) > maxWidth) cut = cut.slice(0, -1);
      lines.push(`${cut}…`);
    }
  } else if (lines.length >= maxLines) {
    // remaining words truncated on last line
    const last = lines[lines.length - 1] || cur;
    let cut = last;
    while (cut.length > 1 && measureTextWidth(`${cut}…`, fontSize) > maxWidth) cut = cut.slice(0, -1);
    lines[lines.length - 1] = cut.endsWith('…') ? cut : `${cut}…`;
  }
  return lines.length ? lines : [text];
}

export function fittedBlockSize(type: ComponentType, lang: Lang): { w: number; h: number; lines: string[]; sub: string } {
  const label = paletteLabel(type, lang);
  const sub = paletteAws(type, lang);
  const lines = wrapLabel(label, MAX_TEXT_WIDTH, LABEL_SIZE, MAX_LABEL_LINES);
  const labelW = Math.max(...lines.map(l => measureTextWidth(l, LABEL_SIZE, 700)), measureTextWidth(sub, SUB_SIZE, 500));
  const textCol = Math.min(MAX_TEXT_WIDTH, Math.ceil(labelW));
  const w = Math.ceil(PAD_X + ICON + GAP + textCol + PAD_X);
  const textH = lines.length * (LABEL_SIZE + 3) + SUB_SIZE + 4;
  const h = Math.ceil(Math.max(ICON + PAD_Y * 2, textH + PAD_Y * 2));
  return { w: Math.max(96, w), h: Math.max(48, h), lines, sub };
}

export function blockSize(b: DrawingBlock, lang: Lang): { w: number; h: number } {
  const fit = fittedBlockSize(b.type, lang);
  return {
    w: b.w != null && b.w > 0 ? Math.max(b.w, fit.w) : fit.w,
    // If user shrunk below fit, clamp to fit (text never overflows)
    h: b.h != null && b.h > 0 ? Math.max(b.h, fit.h) : fit.h,
  };
}

/** Raw size for resize min (fitted content). */
export function blockMinSize(b: DrawingBlock, lang: Lang) {
  const fit = fittedBlockSize(b.type, lang);
  return { w: fit.w, h: fit.h };
}

export function blockCenter(b: DrawingBlock, lang: Lang = 'en') {
  const { w, h } = blockSize(b, lang);
  return { x: b.x + w / 2, y: b.y + h / 2 };
}

export function containerCenter(c: DrawingContainer) {
  return { x: c.x + c.w / 2, y: c.y + c.h / 2 };
}

export function nodeBounds(
  id: string,
  blocks: DrawingBlock[],
  containers: DrawingContainer[],
  lang: Lang = 'en',
): { x: number; y: number; w: number; h: number } | null {
  const b = blocks.find(n => n.id === id);
  if (b) {
    const s = blockSize(b, lang);
    return { x: b.x, y: b.y, w: s.w, h: s.h };
  }
  const c = containers.find(n => n.id === id);
  if (c) return { x: c.x, y: c.y, w: c.w, h: c.h };
  return null;
}

export function nodeCenter(
  id: string,
  blocks: DrawingBlock[],
  containers: DrawingContainer[],
  lang: Lang = 'en',
) {
  const box = nodeBounds(id, blocks, containers, lang);
  if (!box) return null;
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

/** Point where a line from center exits the rect toward target. */
export function edgePoint(
  box: { x: number; y: number; w: number; h: number },
  toward: { x: number; y: number },
) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hx = box.w / 2;
  const hy = box.h / 2;
  const sx = dx !== 0 ? hx / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? hy / Math.abs(dy) : Infinity;
  const t = Math.min(sx, sy);
  return { x: cx + dx * t, y: cy + dy * t };
}

export function pointInRect(
  px: number,
  py: number,
  r: { x: number; y: number; w: number; h: number },
) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function findContainerAt(
  px: number,
  py: number,
  containers: DrawingContainer[],
  excludeId?: string | null,
): DrawingContainer | null {
  let best: DrawingContainer | null = null;
  let bestArea = Infinity;
  for (const c of containers) {
    if (excludeId && (c.id === excludeId || isDescendantContainer(c.id, excludeId, containers))) continue;
    if (pointInRect(px, py, c)) {
      const area = c.w * c.h;
      if (area < bestArea) {
        best = c;
        bestArea = area;
      }
    }
  }
  return best;
}

export function isDescendantContainer(
  childId: string,
  ancestorId: string,
  containers: DrawingContainer[],
): boolean {
  let cur: string | null | undefined = childId;
  const map = new Map(containers.map(c => [c.id, c]));
  const seen = new Set<string>();
  while (cur) {
    if (cur === ancestorId) return true;
    if (seen.has(cur)) break;
    seen.add(cur);
    cur = map.get(cur)?.parentId;
  }
  return false;
}

export function collectDescendantIds(
  containerId: string,
  blocks: DrawingBlock[],
  containers: DrawingContainer[],
): { blockIds: string[]; containerIds: string[] } {
  const blockIds: string[] = [];
  const containerIds: string[] = [];
  const queue = [containerId];
  while (queue.length) {
    const id = queue.pop()!;
    for (const c of containers) {
      if (c.parentId === id) {
        containerIds.push(c.id);
        queue.push(c.id);
      }
    }
    for (const b of blocks) {
      if (b.parentId === id) blockIds.push(b.id);
    }
  }
  return { blockIds, containerIds };
}

export function cycleDirection(d?: DrawingEdgeDirection): DrawingEdgeDirection {
  if (d === 'forward' || !d) return 'both';
  if (d === 'both') return 'backward';
  return 'forward';
}

export function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function cloneDrawingSlice(state: {
  blocks: DrawingBlock[];
  containers?: DrawingContainer[];
  edges: DrawingEdge[];
}) {
  return {
    blocks: state.blocks.map(b => ({ ...b })),
    containers: (state.containers || []).map(c => ({ ...c })),
    edges: state.edges.map(e => ({ ...e })),
  };
}

export type ResizeHandle = 'se' | 'e' | 's';

export function resizeHandles(box: { x: number; y: number; w: number; h: number }): { id: ResizeHandle; x: number; y: number; cursor: string }[] {
  return [
    { id: 'se', x: box.x + box.w, y: box.y + box.h, cursor: 'nwse-resize' },
    { id: 'e', x: box.x + box.w, y: box.y + box.h / 2, cursor: 'ew-resize' },
    { id: 's', x: box.x + box.w / 2, y: box.y + box.h, cursor: 'ns-resize' },
  ];
}
