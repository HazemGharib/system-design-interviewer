import type { CapacityField } from '../types';
import { getScenarioJson, SCENARIO_JSONS } from '../content/loadContent';

export interface CapacityScenario {
  helpers: CapacityField[];
  fields: CapacityField[];
  steps: { ar: string; en: string }[];
}

export const CAPACITY_DATA: Record<string, CapacityScenario> = Object.fromEntries(
  SCENARIO_JSONS.filter(s => s.capacity).map(s => [s.id, s.capacity as CapacityScenario])
);

export function emptyCapacity(scenarioId: string) {
  const data = getScenarioJson(scenarioId)?.capacity || CAPACITY_DATA[scenarioId];
  const values: Record<string, string> = {};
  const helpers: Record<string, string> = {};
  if (data) {
    for (const f of data.fields) values[f.id] = '';
    for (const h of data.helpers) helpers[h.id] = '';
  }
  return { values, helpers, checked: false, results: {} };
}

export function verdictFor(user: number, reference: number): { verdict: 'good' | 'ok' | 'off'; ratio: number } {
  if (!Number.isFinite(user) || user <= 0 || reference <= 0) return { verdict: 'off', ratio: 0 };
  const ratio = user / reference;
  const factor = ratio >= 1 ? ratio : 1 / ratio;
  if (factor <= 2) return { verdict: 'good', ratio };
  if (factor <= 10) return { verdict: 'ok', ratio };
  return { verdict: 'off', ratio };
}
