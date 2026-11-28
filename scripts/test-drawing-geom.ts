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

// Templates JSON: parse + each generic template has ≥2 blocks
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  edgeKey,
  flowsForScenario,
  nodesFromEdgeKeys,
  parseEdgeKey,
  synthesizeFlowsFromDrawing,
} from '../src/interactive/solutionFlows';
import type { ScenarioJson } from '../src/content/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templates = JSON.parse(readFileSync(join(root, 'src/data/templates.json'), 'utf8')) as {
  generic: { id: string; blocks: unknown[]; edges: unknown[] }[];
  scenarios: Record<string, { blocks: unknown[] }>;
};

assert.ok(Array.isArray(templates.generic) && templates.generic.length >= 3);
for (const tpl of templates.generic) {
  assert.ok(tpl.blocks.length >= 2, `generic template ${tpl.id} needs ≥2 blocks`);
  assert.ok(Array.isArray(tpl.edges));
}
assert.ok(templates.scenarios['image-upload']?.blocks.length >= 3);
assert.ok(templates.scenarios['url-shortener']?.blocks.length >= 3);
assert.ok(templates.scenarios['chat-messaging']?.blocks.length >= 3);

assert.equal(edgeKey('api', 'db'), 'api->db');
assert.deepEqual(parseEdgeKey('client->cdn'), { from: 'client', to: 'cdn' });
assert.deepEqual(nodesFromEdgeKeys(['a->b', 'b->c']).sort(), ['a', 'b', 'c']);

const drawing = {
  components: ['client', 'api', 'db'] as const,
  edges: [
    { from: 'client' as const, to: 'api' as const, label: { ar: 'طلب', en: 'request' } },
    { from: 'api' as const, to: 'db' as const, label: { ar: 'كتابة', en: 'write' } },
    { from: 'db' as const, to: 'api' as const, label: { ar: 'رد', en: 'reply' } },
  ],
  referenceLayout: [
    { type: 'client' as const, x: 0, y: 0 },
    { type: 'api' as const, x: 100, y: 0 },
    { type: 'db' as const, x: 200, y: 0 },
  ],
};
const syn = synthesizeFlowsFromDrawing(drawing);
assert.equal(syn.length, 1);
assert.ok(syn[0].steps.length >= 1 && syn[0].steps.length <= 3);

const stub = { drawing, flows: undefined } as Pick<ScenarioJson, 'drawing' | 'flows'>;
assert.equal(flowsForScenario(stub as ScenarioJson).length, 1);

console.log('test-templates-flows: ok');
