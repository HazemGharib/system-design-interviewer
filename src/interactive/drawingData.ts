import type { ComponentType } from '../types';
import { getScenarioJson, SCENARIO_JSONS } from '../content/loadContent';

export interface ExpectedDesign {
  components: ComponentType[];
  edges: { from: ComponentType; to: ComponentType; label: { ar: string; en: string } }[];
  referenceLayout: { type: ComponentType; x: number; y: number }[];
}

export const DRAWING_EXPECTATIONS: Record<string, ExpectedDesign> = Object.fromEntries(
  SCENARIO_JSONS.filter(s => s.drawing).map(s => [s.id, s.drawing as ExpectedDesign])
);

export function emptyDrawing() {
  return {
    blocks: [],
    containers: [] as import('../types').DrawingContainer[],
    edges: [],
    compared: false,
    matchedComponents: [] as string[],
    missedComponents: [] as string[],
    matchedEdges: [] as string[],
    missedEdges: [] as string[],
    score: 0,
  };
}

export function getDrawingExpectation(scenarioId: string): ExpectedDesign | undefined {
  return getScenarioJson(scenarioId)?.drawing || DRAWING_EXPECTATIONS[scenarioId];
}
