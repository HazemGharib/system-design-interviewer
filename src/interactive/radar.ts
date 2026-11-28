import type { RadarScores, RadarDimension, SavedScenarioState, Stage, Lang } from '../types';

export const RADAR_LABELS: Record<RadarDimension, { ar: string; en: string }> = {
  requirements: { ar: 'المتطلبات', en: 'Requirements' },
  estimation: { ar: 'الحسبة', en: 'Estimation' },
  architecture: { ar: 'الأركيتكتشر', en: 'Architecture' },
  scaling: { ar: 'الـ Scaling', en: 'Scaling' },
  reliability: { ar: 'الموثوقية', en: 'Reliability' },
  dataModeling: { ar: 'نمذجة البيانات', en: 'Data modeling' },
  tradeoffs: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
  monitoring: { ar: 'المراقبة', en: 'Monitoring' },
};

export const RADAR_DIMS: RadarDimension[] = [
  'requirements',
  'estimation',
  'architecture',
  'scaling',
  'reliability',
  'dataModeling',
  'tradeoffs',
  'monitoring',
];

function stageRatio(state: SavedScenarioState, stageId: string, stages: Stage[]): number {
  const stage = stages.find(s => s.id === stageId);
  if (!stage || stage.items.length === 0) return 0;
  const ticks = state.ticks[stageId] || [];
  const done = ticks.filter(Boolean).length;
  return done / stage.items.length;
}

function avg(nums: number[]): number {
  const valid = nums.filter(n => Number.isFinite(n));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function computeRadarScores(state: SavedScenarioState, stages: Stage[]): RadarScores {
  const clarify = stageRatio(state, 'clarify', stages);
  const architecture = stageRatio(state, 'architecture', stages);
  const scaling = stageRatio(state, 'scaling', stages);
  const monitoring = stageRatio(state, 'monitoring', stages);
  const bottlenecks = stageRatio(state, 'bottlenecks', stages);
  const tradeoffsStage = stageRatio(state, 'tradeoffs', stages);
  const followups = avg([
    stageRatio(state, 'followup-1', stages),
    stageRatio(state, 'followup-2', stages),
    stageRatio(state, 'followup-3', stages),
  ]);
  const staff = avg([
    stageRatio(state, 'cost', stages),
    stageRatio(state, 'security', stages),
    stageRatio(state, 'dr', stages),
  ]);

  const capacityScore = (() => {
    if (!state.capacity.checked) return clarify;
    const results = Object.values(state.capacity.results);
    if (results.length === 0) return 0;
    const points = results.map(r => (r.verdict === 'good' ? 1 : r.verdict === 'ok' ? 0.6 : 0.2));
    return avg(points);
  })();

  const drawingScore = state.drawing.compared ? state.drawing.score : architecture;

  const tradeoffCards = Object.values(state.tradeoffs.answers);
  const tradeoffScore = (() => {
    const scored = tradeoffCards.filter(a => a.revealed);
    if (scored.length === 0) return tradeoffsStage;
    const pts = scored.map(a => {
      if (!a.scored) return 0.4;
      return a.scored ? 1 : 0.3;
    });
    return avg([tradeoffsStage, avg(pts)]);
  })();

  const chaosResponses = Object.values(state.chaos.responses);
  const chaosScore = (() => {
    if (!state.chaos.enabled || chaosResponses.length === 0) return bottlenecks;
    const pts = chaosResponses.map(r => {
      if (!r.revealed || r.ticks.length === 0) return 0.2;
      return r.ticks.filter(Boolean).length / r.ticks.length;
    });
    return avg([bottlenecks, avg(pts)]);
  })();

  return {
    requirements: Math.round(avg([clarify, followups]) * 100),
    estimation: Math.round(capacityScore * 100),
    architecture: Math.round(drawingScore * 100),
    scaling: Math.round(scaling * 100),
    reliability: Math.round(avg([chaosScore, staff || bottlenecks]) * 100),
    dataModeling: Math.round(avg([architecture, scaling]) * 100),
    tradeoffs: Math.round(tradeoffScore * 100),
    monitoring: Math.round(monitoring * 100),
  };
}

export function overallFromRadar(scores: RadarScores): number {
  const vals = RADAR_DIMS.map(d => scores[d]);
  return Math.round(avg(vals));
}

export function strengthsAndWeaknesses(scores: RadarScores, lang: Lang): { strengths: string[]; weaknesses: string[] } {
  const ranked = RADAR_DIMS.map(d => ({ d, v: scores[d] })).sort((a, b) => b.v - a.v);
  const strengths = ranked.slice(0, 2).filter(x => x.v >= 50).map(x => RADAR_LABELS[x.d][lang]);
  const weaknesses = ranked.slice(-2).filter(x => x.v < 80).map(x => RADAR_LABELS[x.d][lang]);
  return { strengths, weaknesses };
}
