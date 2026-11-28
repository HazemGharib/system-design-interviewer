/**
 * Lightweight unit checks for container move membership (run: npm test).
 */
import assert from 'node:assert/strict';
import { applyContainerMoveDelta, collectContainerMoveMembers } from '../src/interactive/drawingMove';
import type { DrawingBlock, DrawingContainer } from '../src/types';

const containers: DrawingContainer[] = [
  { id: 'outer', label: 'Outer', x: 0, y: 0, w: 400, h: 300, parentId: null },
  { id: 'inner', label: 'Inner', x: 40, y: 40, w: 180, h: 140, parentId: 'outer' },
  { id: 'sibling', label: 'Sibling', x: 500, y: 0, w: 100, h: 100, parentId: null },
];

const blocks: DrawingBlock[] = [
  // Inside outer, outside inner (inner ends at x=220). Explicit size so centers are stable.
  { id: 'by-parent', type: 'api', x: 250, y: 200, w: 100, h: 50, parentId: 'outer' },
  { id: 'by-geom', type: 'cache', x: 280, y: 60, w: 100, h: 50, parentId: null },
  { id: 'in-inner', type: 'db', x: 70, y: 80, w: 100, h: 50, parentId: 'inner' },
  { id: 'outside', type: 'client', x: 600, y: 20, w: 100, h: 50, parentId: null },
];

const members = collectContainerMoveMembers('outer', blocks, containers);
assert.ok(members.containerIds.includes('inner'));
assert.ok(!members.containerIds.includes('sibling'));
assert.ok(members.blockIds.includes('by-parent'));
assert.ok(members.blockIds.includes('by-geom'));
assert.ok(members.blockIds.includes('in-inner'));
assert.ok(!members.blockIds.includes('outside'));

const innerMembers = collectContainerMoveMembers('inner', blocks, containers);
assert.ok(!innerMembers.containerIds.includes('outer'));
assert.ok(innerMembers.blockIds.includes('in-inner'));
assert.ok(!innerMembers.blockIds.includes('by-geom'));
assert.ok(!innerMembers.blockIds.includes('by-parent'));

const moveIds = ['outer', ...members.containerIds];
const starts = {
  containers: Object.fromEntries(
    moveIds.map(id => {
      const c = containers.find(x => x.id === id)!;
      return [id, { x: c.x, y: c.y }];
    }),
  ),
  blocks: Object.fromEntries(
    members.blockIds.map(id => {
      const b = blocks.find(x => x.id === id)!;
      return [id, { x: b.x, y: b.y }];
    }),
  ),
};
const moved = applyContainerMoveDelta(50, 30, members.blockIds, moveIds, blocks, containers, starts);
assert.equal(moved.containers.find(c => c.id === 'outer')!.x, 50);
assert.equal(moved.containers.find(c => c.id === 'inner')!.x, 90);
assert.equal(moved.blocks.find(b => b.id === 'by-geom')!.x, 330);
assert.equal(moved.blocks.find(b => b.id === 'outside')!.x, 600);

console.log('test-drawing-geom: ok');
