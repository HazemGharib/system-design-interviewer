import type { CapacityState } from '../types';
import { getScenarioJson, SCENARIO_JSONS } from '../content/loadContent';
import type { CapacityModel } from './capacityEngine';
import { emptyVariableMap, practiceMetrics } from './capacityEngine';

export const CAPACITY_DATA: Record<string, CapacityModel> = Object.fromEntries(
  SCENARIO_JSONS.filter(s => s.capacity).map(s => [s.id, s.capacity as CapacityModel])
);

export function getCapacityModel(scenarioId: string): CapacityModel | undefined {
  return getScenarioJson(scenarioId)?.capacity || CAPACITY_DATA[scenarioId];
}

export function emptyCapacity(scenarioId: string): CapacityState {
  const model = getCapacityModel(scenarioId);
  const variables = model ? emptyVariableMap(model) : {};
  const values: Record<string, string> = {};
  if (model) {
    for (const m of practiceMetrics(model)) values[m.id] = '';
  }
  return { variables, values, checked: false, results: {} };
}

export function verdictFor(user: number, reference: number): { verdict: 'good' | 'ok' | 'off'; ratio: number } {
  if (!Number.isFinite(user) || user <= 0 || !Number.isFinite(reference) || reference <= 0) {
    return { verdict: 'off', ratio: 0 };
  }
  const ratio = user / reference;
  const factor = ratio >= 1 ? ratio : 1 / ratio;
  if (factor <= 2) return { verdict: 'good', ratio };
  if (factor <= 10) return { verdict: 'ok', ratio };
  return { verdict: 'off', ratio };
}

export const CAPACITY_MODE_KEY = 'sysdesign-capacity-mode';

export function readCapacityMode(): 'auto' | 'practice' {
  try {
    const v = localStorage.getItem(CAPACITY_MODE_KEY);
    if (v === 'practice' || v === 'auto') return v;
  } catch { /* ignore */ }
  return 'auto';
}

export function writeCapacityMode(mode: 'auto' | 'practice') {
  try {
    localStorage.setItem(CAPACITY_MODE_KEY, mode);
  } catch { /* ignore */ }
}
