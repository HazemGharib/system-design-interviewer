#!/usr/bin/env npx tsx
/**
 * Validates JSON content under src/data/. Fails the build on schema/i18n/glossary issues.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src/data');
const errors: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

const Bi = z.object({ ar: z.string().min(1), en: z.string().min(1) });

const ChecklistItem = z.object({
  text: Bi,
  detail: z.object({
    ar: z.object({ why: z.string(), how: z.string(), tradeoffs: z.string(), examples: z.string(), mistakes: z.string() }),
    en: z.object({ why: z.string(), how: z.string(), tradeoffs: z.string(), examples: z.string(), mistakes: z.string() }),
  }),
});

const Stage = z.object({
  id: z.string().min(1),
  title: Bi,
  shortTitle: Bi,
  prompt: Bi,
  items: z.array(ChecklistItem).min(1),
  level: z.enum(['senior', 'staff']),
});

const FormulaPart = z.union([
  z.object({ text: z.string() }),
  z.object({ const: z.number() }),
  z.object({ ref: z.string().min(1) }),
  z.object({ var: z.string().min(1) }),
]);

const CapacityVariable = z.object({
  id: z.string().min(1),
  label: Bi,
  unit: Bi,
  default: z.number(),
  role: z.enum(['input', 'assumption']),
});

const CapacityMetric = z.object({
  id: z.string().min(1),
  label: Bi,
  unit: Bi,
  format: z.enum(['count', 'qps', 'storage']),
  expr: z.string().min(1),
  display: z.array(FormulaPart).min(1),
  practice: z.boolean(),
});

const Chaos = z.object({
  id: z.string(),
  title: Bi,
  description: Bi,
  afterStage: z.string(),
  seconds: z.number().positive(),
  checklist: z.array(Bi).min(1),
});

const Tradeoff = z.object({
  id: z.string(),
  question: Bi,
  optionA: Bi,
  optionB: Bi,
  expected: z.enum(['A', 'B', 'either']),
  expectedNote: Bi,
  prosA: Bi,
  consA: Bi,
  prosB: Bi,
  consB: Bi,
  whenOtherWins: Bi,
});

const Drawing = z.object({
  components: z.array(z.string()).min(1),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: Bi })),
  referenceLayout: z.array(z.object({ type: z.string(), x: z.number(), y: z.number() })),
});

const ScenarioSchema = z.object({
  id: z.string().min(1),
  title: Bi,
  description: Bi,
  difficulty: Bi,
  estimatedTime: Bi,
  problemStatement: Bi,
  facts: z.array(z.object({ label: Bi, value: Bi })).min(1),
  stages: z.array(Stage).min(1),
  capacity: z.object({
    variables: z.array(CapacityVariable).min(1),
    metrics: z.array(CapacityMetric).min(1),
    steps: z.array(Bi).min(1),
  }).nullable(),
  chaos: z.array(Chaos),
  tradeoffs: z.array(Tradeoff),
  drawing: Drawing.nullable(),
});

const CheatEntry = z.object({
  id: z.string(),
  problem: Bi,
  patterns: Bi,
  when: Bi,
  tradeoffs: Bi,
  example: Bi,
  tags: z.array(z.string()),
  termIds: z.array(z.string()).default([]),
});

const CheatsheetSchema = z.object({
  categories: z.array(z.object({
    id: z.string(),
    title: Bi,
    entries: z.array(CheatEntry).min(1),
  })).min(1),
  numbers: z.object({
    title: Bi,
    items: z.array(z.object({ label: Bi, value: Bi })).min(1),
  }),
});

const GlossarySchema = z.object({
  categories: z.array(z.object({ id: z.string(), title: Bi })).min(1),
  terms: z.array(z.object({
    id: z.string(),
    category: z.string(),
    name: Bi,
    short: Bi,
    definition: Bi,
    when: Bi,
    pros: Bi,
    cons: Bi,
    example: Bi,
    related: z.array(z.string()),
  })).min(1),
});

function readJson(rel: string) {
  return JSON.parse(readFileSync(join(dataDir, rel), 'utf8'));
}

console.log('Validating content JSON…');

const glossary = GlossarySchema.parse(readJson('glossary.json'));
const termIds = new Set(glossary.terms.map(t => t.id));
const catIds = new Set(glossary.categories.map(c => c.id));

for (const term of glossary.terms) {
  if (!catIds.has(term.category)) fail(`glossary term "${term.id}" has unknown category "${term.category}"`);
  for (const rel of term.related) {
    if (!termIds.has(rel)) fail(`glossary term "${term.id}" related to missing id "${rel}"`);
  }
}

const cheatsheet = CheatsheetSchema.parse(readJson('cheatsheet.json'));
for (const cat of cheatsheet.categories) {
  for (const entry of cat.entries) {
    for (const tid of entry.termIds || []) {
      if (!termIds.has(tid)) fail(`cheatsheet entry "${entry.id}" links missing glossary term "${tid}"`);
    }
    if (!(entry.termIds || []).length) fail(`cheatsheet entry "${entry.id}" has no termIds`);
  }
}

const manifest = readJson('scenarios/manifest.json') as { scenarios: { id: string }[] };
const scenarioFiles = readdirSync(join(dataDir, 'scenarios')).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const fileIds = scenarioFiles.map(f => f.replace(/\.json$/, ''));

for (const id of manifest.scenarios.map(s => s.id)) {
  if (!fileIds.includes(id)) fail(`manifest lists scenario "${id}" but src/data/scenarios/${id}.json is missing`);
}
for (const id of fileIds) {
  if (!manifest.scenarios.some(s => s.id === id)) fail(`scenario file "${id}.json" missing from manifest.json`);
}

for (const file of scenarioFiles) {
  const raw = readJson(`scenarios/${file}`);
  const parsed = ScenarioSchema.safeParse(raw);
  if (!parsed.success) {
    fail(`scenario ${file}: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    continue;
  }
  const sc = parsed.data;
  if (sc.id !== file.replace(/\.json$/, '')) fail(`scenario file ${file} id mismatch (${sc.id})`);
  const stageIds = new Set(sc.stages.map(s => s.id));
  for (const incident of sc.chaos) {
    if (!stageIds.has(incident.afterStage)) fail(`scenario ${sc.id} chaos "${incident.id}" afterStage "${incident.afterStage}" not in stages`);
  }
  if (sc.drawing) {
    for (const edge of sc.drawing.edges) {
      if (!sc.drawing.components.includes(edge.from as never) && !sc.drawing.referenceLayout.some(r => r.type === edge.from)) {
        // soft: components list should include edge endpoints
      }
    }
  }
  if (sc.capacity) {
    const varIds = new Set(sc.capacity.variables.map(v => v.id));
    const metricIds = new Set<string>();
    if (!sc.capacity.variables.some(v => v.role === 'input')) {
      fail(`scenario ${sc.id} capacity has no input variables`);
    }
    for (const m of sc.capacity.metrics) {
      metricIds.add(m.id);
      for (const part of m.display) {
        if ('var' in part && !varIds.has(part.var)) fail(`scenario ${sc.id} metric "${m.id}" display var "${part.var}" missing`);
        if ('ref' in part && !varIds.has(part.ref) && !metricIds.has(part.ref) && !sc.capacity.metrics.some(x => x.id === part.ref)) {
          // ref may point to earlier metric — check full set after loop
        }
      }
    }
    const allMetricIds = new Set(sc.capacity.metrics.map(m => m.id));
    for (const m of sc.capacity.metrics) {
      for (const part of m.display) {
        if ('ref' in part && !varIds.has(part.ref) && !allMetricIds.has(part.ref)) {
          fail(`scenario ${sc.id} metric "${m.id}" display ref "${part.ref}" missing`);
        }
      }
    }
  }
}

const palette = readJson('palette.json') as { items: { type: string; label: { ar: string; en: string } }[] };
if (!palette.items?.length) fail('palette.json has no items');

if (errors.length) {
  console.error('\nContent validation FAILED:\n');
  for (const e of errors) console.error(' -', e);
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}

console.log(`OK — ${fileIds.length} scenarios, ${cheatsheet.categories.reduce((n, c) => n + c.entries.length, 0)} cheat entries, ${glossary.terms.length} glossary terms.`);
