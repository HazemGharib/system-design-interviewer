import type { Bi, FlowStepJson, ScenarioJson, SolutionFlowJson } from '../content/types';
import type { ComponentType } from '../types';

/** Default node box when caller does not pass fitted sizes (keeps this module free of palette/vite imports). */
const DEFAULT_NODE = { w: 152, h: 68 };

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
  w: number;
  h: number;
};

export type WalkthroughContainer = {
  id: string;
  label: string | Bi;
  x: number;
  y: number;
  w: number;
  h: number;
  memberIds: string[];
};

export type WalkthroughEdge = {
  id: string;
  key: string;
  fromType: string;
  toType: string;
  fromId: string;
  toId: string;
  label: Bi;
};

const H_GAP = 36;
const V_GAP = 28;
const PAD = 24;

export type NodeSizeFn = (type: ComponentType) => { w: number; h: number };

/** Layered left-to-right (wide) or top-to-bottom (narrow) layout using caller-provided node sizes. */
export function layoutToWalkthroughGraph(
  drawing: NonNullable<ScenarioJson['drawing']>,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  sizeOf: NodeSizeFn = () => DEFAULT_NODE,
) {
  const typeCount = new Map<string, number>();
  const rawBlocks = drawing.referenceLayout.map(r => {
    const n = typeCount.get(r.type) || 0;
    typeCount.set(r.type, n + 1);
    const fit = sizeOf(r.type as ComponentType);
    return {
      id: n === 0 ? r.type : `${r.type}#${n}`,
      type: r.type as ComponentType,
      ox: r.x,
      oy: r.y,
      w: fit.w,
      h: fit.h,
    };
  });

  const byType = new Map<string, typeof rawBlocks>();
  for (const b of rawBlocks) {
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
  const edges: WalkthroughEdge[] = drawing.edges.map((e, i) => {
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

  // Build adjacency for layering
  const ids = rawBlocks.map(b => b.id);
  const idSet = new Set(ids);
  const outgoing = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const id of ids) {
    outgoing.set(id, []);
    indeg.set(id, 0);
  }
  for (const e of edges) {
    if (!idSet.has(e.fromId) || !idSet.has(e.toId) || e.fromId === e.toId) continue;
    outgoing.get(e.fromId)!.push(e.toId);
    indeg.set(e.toId, (indeg.get(e.toId) || 0) + 1);
  }

  const layers: string[][] = [];
  const placed = new Set<string>();
  let frontier = ids.filter(id => (indeg.get(id) || 0) === 0);
  if (!frontier.length) frontier = [...ids];

  while (placed.size < ids.length) {
    const layer = frontier.filter(id => !placed.has(id));
    if (!layer.length) {
      const rest = ids.filter(id => !placed.has(id));
      if (!rest.length) break;
      layers.push(rest);
      rest.forEach(id => placed.add(id));
      break;
    }
    layers.push(layer);
    layer.forEach(id => placed.add(id));
    const next: string[] = [];
    for (const id of layer) {
      for (const t of outgoing.get(id) || []) {
        if (placed.has(t)) continue;
        // defer until all preds placed when possible
        const predsLeft = edges.filter(e => e.toId === t && !placed.has(e.fromId)).length;
        if (predsLeft === 0) next.push(t);
      }
    }
    frontier = [...new Set(next)];
    if (!frontier.length) {
      frontier = ids.filter(id => !placed.has(id));
    }
  }

  const byId = new Map(rawBlocks.map(b => [b.id, b]));
  const positions = new Map<string, { x: number; y: number }>();

  if (orientation === 'horizontal') {
    let x = PAD;
    for (const layer of layers) {
      const sized = layer.map(id => byId.get(id)!);
      const layerW = Math.max(...sized.map(b => b.w));
      const totalH = sized.reduce((s, b) => s + b.h, 0) + V_GAP * Math.max(0, sized.length - 1);
      let y = PAD;
      // center vertically within a nominal band
      const startY = PAD;
      y = startY;
      for (const b of sized) {
        positions.set(b.id, { x, y });
        y += b.h + V_GAP;
      }
      // Recenter layer around mid if short
      if (totalH < 280) {
        const offset = (280 - totalH) / 2;
        for (const b of sized) {
          const p = positions.get(b.id)!;
          positions.set(b.id, { x: p.x, y: p.y + offset });
        }
      }
      x += layerW + H_GAP;
      void layerW;
    }
  } else {
    let y = PAD;
    for (const layer of layers) {
      const sized = layer.map(id => byId.get(id)!);
      const layerH = Math.max(...sized.map(b => b.h));
      const totalW = sized.reduce((s, b) => s + b.w, 0) + H_GAP * Math.max(0, sized.length - 1);
      let x = PAD;
      if (totalW < 320) x = PAD + (320 - totalW) / 2;
      for (const b of sized) {
        positions.set(b.id, { x, y });
        x += b.w + H_GAP;
      }
      y += layerH + V_GAP;
    }
  }

  const blocks: WalkthroughBlock[] = rawBlocks.map(b => {
    const p = positions.get(b.id) || { x: b.ox, y: b.oy };
    return { id: b.id, type: b.type, x: p.x, y: p.y, w: b.w, h: b.h };
  });

  // Containers: membership from original coords, then re-wrap fitted positions
  const containers: WalkthroughContainer[] = (drawing.containers || []).map(c => {
    const members = rawBlocks.filter(b => {
      const cx = b.ox + b.w / 2;
      const cy = b.oy + b.h / 2;
      return cx >= c.x && cx <= c.x + c.w && cy >= c.y && cy <= c.y + c.h;
    });
    const memberIds = members.map(m => m.id);
    if (!memberIds.length) {
      return { id: c.id, label: c.label, x: c.x, y: c.y, w: c.w, h: c.h, memberIds };
    }
    const placedMembers = blocks.filter(b => memberIds.includes(b.id));
    const minX = Math.min(...placedMembers.map(b => b.x)) - 20;
    const minY = Math.min(...placedMembers.map(b => b.y)) - 36;
    const maxX = Math.max(...placedMembers.map(b => b.x + b.w)) + 20;
    const maxY = Math.max(...placedMembers.map(b => b.y + b.h)) + 20;
    return {
      id: c.id,
      label: c.label,
      x: minX,
      y: minY,
      w: Math.max(120, maxX - minX),
      h: Math.max(80, maxY - minY),
      memberIds,
    };
  });

  return { blocks, edges, containers };
}
