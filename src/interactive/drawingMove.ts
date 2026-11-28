import type { DrawingBlock, DrawingContainer } from '../types';

/** Defaults when a block has no explicit size (keep in sync with drawingGeom). */
const BLOCK_W = 120;
const BLOCK_H = 64;

function pointInRect(
  px: number,
  py: number,
  r: { x: number; y: number; w: number; h: number },
) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function isDescendantContainer(
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

function centerInsideAny(
  cx: number,
  cy: number,
  movingIds: Set<string>,
  containers: DrawingContainer[],
): boolean {
  for (const id of movingIds) {
    const m = containers.find(c => c.id === id);
    if (m && pointInRect(cx, cy, m)) return true;
  }
  return false;
}

function blockCenterApprox(b: DrawingBlock) {
  const w = b.w != null && b.w > 0 ? b.w : BLOCK_W;
  const h = b.h != null && b.h > 0 ? b.h : BLOCK_H;
  return { x: b.x + w / 2, y: b.y + h / 2 };
}

/**
 * Membership for dragging a container: explicit parentId descendants plus
 * anything whose center sits inside the moving group (supports nesting).
 * Call once at drag start and freeze the result for the gesture.
 */
export function collectContainerMoveMembers(
  containerId: string,
  blocks: DrawingBlock[],
  containers: DrawingContainer[],
): { blockIds: string[]; containerIds: string[] } {
  if (!containers.some(c => c.id === containerId)) {
    return { blockIds: [], containerIds: [] };
  }

  const movingContainers = new Set<string>([containerId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of containers) {
      if (movingContainers.has(c.id)) continue;
      // Never pull an ancestor along with a nested drag.
      if (isDescendantContainer(containerId, c.id, containers)) continue;
      const byParent = c.parentId != null && movingContainers.has(c.parentId);
      const byGeom = centerInsideAny(c.x + c.w / 2, c.y + c.h / 2, movingContainers, containers);
      if (byParent || byGeom) {
        movingContainers.add(c.id);
        grew = true;
      }
    }
  }

  const blockIds: string[] = [];
  for (const b of blocks) {
    const byParent = b.parentId != null && movingContainers.has(b.parentId);
    const ctr = blockCenterApprox(b);
    const byGeom = centerInsideAny(ctr.x, ctr.y, movingContainers, containers);
    if (byParent || byGeom) blockIds.push(b.id);
  }

  const containerIds = [...movingContainers].filter(id => id !== containerId);
  return { blockIds, containerIds };
}

/** Apply a world-space delta to a frozen move group (single undo-friendly update). */
export function applyContainerMoveDelta(
  dx: number,
  dy: number,
  memberBlockIds: Set<string> | string[],
  memberContainerIds: Set<string> | string[],
  blocks: DrawingBlock[],
  containers: DrawingContainer[],
  starts: {
    blocks: Record<string, { x: number; y: number }>;
    containers: Record<string, { x: number; y: number }>;
  },
): { blocks: DrawingBlock[]; containers: DrawingContainer[] } {
  const moveB = memberBlockIds instanceof Set ? memberBlockIds : new Set(memberBlockIds);
  const moveC = memberContainerIds instanceof Set ? memberContainerIds : new Set(memberContainerIds);
  return {
    containers: containers.map(c => {
      if (!moveC.has(c.id)) return c;
      const s = starts.containers[c.id];
      return s ? { ...c, x: s.x + dx, y: s.y + dy } : { ...c, x: c.x + dx, y: c.y + dy };
    }),
    blocks: blocks.map(b => {
      if (!moveB.has(b.id)) return b;
      const s = starts.blocks[b.id];
      return s ? { ...b, x: s.x + dx, y: s.y + dy } : { ...b, x: b.x + dx, y: b.y + dy };
    }),
  };
}
