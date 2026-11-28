import type { Bi, FlowStepJson, ScenarioJson, SolutionFlowJson } from '../content/types';
import type { ComponentType } from '../types';

export function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

export function parseEdgeKey(key: string): { from: string; to: string } | null {
  const idx = key.indexOf('->');
  if (idx <= 0) return null;
  return { from: key.slice(0, idx), to: key.slice(idx + 2) };
}

export function nodesFromEdgeKeys(edgeKeys: string[]): string[] {
  const set = new Set<string>();
  for (const key of edgeKeys) {
    const p = parseEdgeKey(key);
    if (p) {
      set.add(p.from);
      set.add(p.to);
    }
  }
  return [...set];
}

/** Normalize a step so nodes/packet are always usable in the UI. */
export function normalizeFlowStep(step: FlowStepJson): FlowStepJson & {
  nodes: string[];
  packet?: { from: string; to: string };
} {
  const nodes = step.nodes?.length ? step.nodes : nodesFromEdgeKeys(step.edgeKeys);
  let packet = step.packet;
  if (!packet && step.edgeKeys[0]) {
    const p = parseEdgeKey(step.edgeKeys[0]);
    if (p) packet = p;
  }
  return { ...step, nodes, packet };
}

/** When scenario has no flows, build a simple 3-step overview from drawing edges. */
export function synthesizeFlowsFromDrawing(drawing: NonNullable<ScenarioJson['drawing']>): SolutionFlowJson[] {
  const edges = drawing.edges;
  if (!edges.length) {
    return [{
      id: 'overview',
      title: { ar: 'نظرة عامة', en: 'Overview' },
      steps: [{
        id: 's1',
        caption: {
          ar: 'لا توجد وصلات في الرسم المرجعي بعد.',
          en: 'No edges in the reference drawing yet.',
        },
        edgeKeys: ['__none__'],
        nodes: drawing.referenceLayout.map(r => r.type),
      }],
    }];
  }

  const chunk = Math.max(1, Math.ceil(edges.length / 3));
  const steps: FlowStepJson[] = [];
  for (let i = 0; i < edges.length; i += chunk) {
    const slice = edges.slice(i, i + chunk);
    const keys = slice.map(e => edgeKey(e.from, e.to));
    const n = Math.floor(i / chunk) + 1;
    const labels = slice.map(e => e.label.en).filter(Boolean).join(', ');
    steps.push({
      id: `syn-${n}`,
      caption: {
        ar: `الخطوة ${n}: ${slice.map(e => e.label.ar).filter(Boolean).join('، ') || 'مسار البيانات'}`,
        en: `Step ${n}: ${labels || 'Data path'}`,
      },
      edgeKeys: keys,
      nodes: nodesFromEdgeKeys(keys),
      packet: { from: slice[0].from, to: slice[0].to },
      durationMs: 2400,
    });
  }

  return [{
    id: 'overview',
    title: { ar: 'نظرة عامة', en: 'Overview' },
    steps: steps.slice(0, 3),
  }];
}

export function flowsForScenario(scenario: ScenarioJson | undefined): SolutionFlowJson[] {
  if (!scenario?.drawing) return [];
  if (scenario.flows?.length) return scenario.flows;
  return synthesizeFlowsFromDrawing(scenario.drawing);
}

export function resolveContainerLabel(label: string | Bi, lang: 'ar' | 'en'): string {
  if (typeof label === 'string') return label;
  return label[lang] || label.en || label.ar || '';
}

export type WalkthroughBlock = {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
};

/** Map referenceLayout + type-based edges into id-based blocks/edges for rendering. */
export function layoutToWalkthroughGraph(drawing: NonNullable<ScenarioJson['drawing']>) {
  const typeCount = new Map<string, number>();
  const blocks: WalkthroughBlock[] = drawing.referenceLayout.map(r => {
    const n = typeCount.get(r.type) || 0;
    typeCount.set(r.type, n + 1);
    return {
      id: n === 0 ? r.type : `${r.type}#${n}`,
      type: r.type,
      x: r.x,
      y: r.y,
    };
  });

  const byType = new Map<string, WalkthroughBlock[]>();
  for (const b of blocks) {
    const list = byType.get(b.type) || [];
    list.push(b);
    byType.set(b.type, list);
  }

  const pick = (type: string, used: Map<string, number>) => {
    const list = byType.get(type) || [];
    if (!list.length) return null;
    const idx = used.get(type) || 0;
    used.set(type, idx + 1);
    return list[Math.min(idx, list.length - 1)];
  };

  const usedFrom = new Map<string, number>();
  const usedTo = new Map<string, number>();
  const edges = drawing.edges.map((e, i) => {
    const from = pick(e.from, usedFrom);
    const to = pick(e.to, usedTo);
    return {
      id: `ref-e-${i}`,
      key: edgeKey(e.from, e.to),
      fromType: e.from,
      toType: e.to,
      fromId: from?.id || e.from,
      toId: to?.id || e.to,
      label: e.label,
    };
  });

  return { blocks, edges };
}
