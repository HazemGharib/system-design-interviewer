import type { ChaosIncident } from '../types';
import { getScenarioJson, SCENARIO_JSONS } from '../content/loadContent';

export const CHAOS_INCIDENTS: Record<string, ChaosIncident[]> = Object.fromEntries(
  SCENARIO_JSONS.map(s => [s.id, s.chaos || []])
);

export function emptyChaos(enabled = false) {
  return {
    enabled,
    activeIncidentId: null as string | null,
    deadline: null as number | null,
    responses: {} as Record<string, { incidentId: string; answer: string; ticks: boolean[]; revealed: boolean; timedOut: boolean }>,
    triggered: [] as string[],
  };
}

export function getChaosIncidents(scenarioId: string): ChaosIncident[] {
  return getScenarioJson(scenarioId)?.chaos || CHAOS_INCIDENTS[scenarioId] || [];
}
