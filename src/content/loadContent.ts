import type { Scenario } from '../types';
import type { CheatsheetJson, GlossaryJson, ScenarioJson } from './types';
import cheatsheetJson from '../data/cheatsheet.json';
import glossaryJson from '../data/glossary.json';
import paletteJson from '../data/palette.json';
import manifestJson from '../data/scenarios/manifest.json';

const scenarioModules = import.meta.glob('../data/scenarios/*.json', { eager: true, import: 'default' }) as Record<string, ScenarioJson>;

function isScenarioFile(path: string): boolean {
  return /\/scenarios\/(?!manifest\.json)[^/]+\.json$/.test(path);
}

export const SCENARIO_JSONS: ScenarioJson[] = Object.entries(scenarioModules)
  .filter(([path]) => isScenarioFile(path))
  .map(([, data]) => data)
  .sort((a, b) => {
    const order = (manifestJson.scenarios as { id: string }[]).map(s => s.id);
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

export const SCENARIOS: Scenario[] = SCENARIO_JSONS.map(s => ({
  id: s.id,
  title: s.title,
  description: s.description,
  difficulty: s.difficulty,
  estimatedTime: s.estimatedTime,
  problemStatement: s.problemStatement,
  facts: s.facts,
  stages: s.stages,
}));

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

export function getScenarioJson(id: string): ScenarioJson | undefined {
  return SCENARIO_JSONS.find(s => s.id === id);
}

export const CHEATSHEET = cheatsheetJson as CheatsheetJson;
export const GLOSSARY = glossaryJson as GlossaryJson;
export const PALETTE_ITEMS = (paletteJson as {
  items: {
    type: string;
    label: { ar: string; en: string };
    color: string;
    short: string;
    category: string;
    awsService: { ar: string; en: string };
    icon: string;
  }[];
}).items;
export const MANIFEST = manifestJson;

export function getGlossaryTerm(id: string) {
  return GLOSSARY.terms.find(t => t.id === id);
}

export function getGlossaryByCategory() {
  return GLOSSARY.categories.map(cat => ({
    ...cat,
    terms: GLOSSARY.terms.filter(t => t.category === cat.id).sort((a, b) => a.name.en.localeCompare(b.name.en)),
  }));
}
