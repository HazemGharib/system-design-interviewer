import type { DrawingBlock, DrawingContainer, DrawingEdge, DrawingEdgeDirection } from '../types';

export const BLOCK_W = 120;
export const BLOCK_H = 64;
export const BOARD_W = 900;
export const BOARD_H = 560;
export const HANDLE = 14; // visual; hit area larger in SVG
export const MIN_CONTAINER = 120;

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function blockCenter(b: DrawingBlock) {
  return { x: b.x + BLOCK_W / 2, y: b.y + BLOCK_H / 2 };
}

export function containerCenter(c: DrawingContainer) {
  return { x: c.x + c.w / 2, y: c.y + c.h / 2 };
}

export function nodeBounds(
  id: string,
  blocks: DrawingBlock[],
  containers: DrawingContainer[],
): { x: number; y: number; w: number; h: number } | null {
  const b = blocks.find(n => n.id === id);
  if (b) return { x: b.x, y: b.y, w: BLOCK_W, h: BLOCK_H };
  const c = containers.find(n => n.id === id);
  if (c) return { x: c.x, y: c.y, w: c.w, h: c.h };
  return null;
}

export function nodeCenter(
  id: string,
  blocks: DrawingBlock[],
  containers: DrawingContainer[],
) {
  const box = nodeBounds(id, blocks, containers);
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

/** Innermost container containing point (smallest area). */
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

export function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
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
