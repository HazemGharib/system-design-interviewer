import type { TradeoffCard } from '../types';
import { getScenarioJson, SCENARIO_JSONS } from '../content/loadContent';

export const TRADEOFF_CARDS: Record<string, TradeoffCard[]> = Object.fromEntries(
  SCENARIO_JSONS.map(s => [s.id, s.tradeoffs || []])
);

export function emptyTradeoffs(scenarioId: string) {
  const cards = getScenarioJson(scenarioId)?.tradeoffs || TRADEOFF_CARDS[scenarioId] || [];
  const answers: Record<string, { choice: 'A' | 'B' | null; justification: string; revealed: boolean; scored: boolean }> = {};
  for (const c of cards) {
    answers[c.id] = { choice: null, justification: '', revealed: false, scored: false };
  }
  return { answers };
}
