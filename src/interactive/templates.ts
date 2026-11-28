import type {
  ComponentType,
  DrawingBlock,
  DrawingContainer,
  DrawingEdge,
  DrawingEdgeDirection,
  DrawingState,
} from '../types';
import type { Bi } from '../content/types';
import templatesJson from '../data/templates.json';
import { uid } from './drawingGeom';

export interface TemplateBlockJson {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  parentId?: string | null;
  w?: number;
  h?: number;
}

export interface TemplateContainerJson {
  id: string;
  label: string | Bi;
  x: number;
  y: number;
  w: number;
  h: number;
  parentId?: string | null;
}

export interface TemplateEdgeJson {
  id: string;
  from: string;
  to: string;
  label?: string;
  direction?: DrawingEdgeDirection;
}

export interface DrawingTemplate {
  id: string;
  title: Bi;
  description: Bi;
  blocks: TemplateBlockJson[];
  containers: TemplateContainerJson[];
  edges: TemplateEdgeJson[];
}

export interface TemplatesJson {
  generic: DrawingTemplate[];
  scenarios: Record<string, DrawingTemplate>;
}

export const TEMPLATES = templatesJson as TemplatesJson;

export function getGenericTemplates(): DrawingTemplate[] {
  return TEMPLATES.generic || [];
}

export function getScenarioTemplate(scenarioId: string): DrawingTemplate | undefined {
  return TEMPLATES.scenarios?.[scenarioId];
}

function resolveLabel(label: string | Bi, lang: 'ar' | 'en'): string {
  if (typeof label === 'string') return label;
  return label[lang] || label.en || label.ar || '';
}

/** Clone template into board state with fresh ids (keeps relative topology). */
export function templateToDrawingSlice(
  template: DrawingTemplate,
  lang: 'ar' | 'en' = 'en',
): Pick<DrawingState, 'blocks' | 'containers' | 'edges'> {
  const idMap = new Map<string, string>();
  for (const b of template.blocks) idMap.set(b.id, uid('b'));
  for (const c of template.containers || []) idMap.set(c.id, uid('c'));

  const blocks: DrawingBlock[] = template.blocks.map(b => ({
    id: idMap.get(b.id)!,
    type: b.type,
    x: b.x,
    y: b.y,
    ...(b.w != null ? { w: b.w } : {}),
    ...(b.h != null ? { h: b.h } : {}),
    parentId: b.parentId ? idMap.get(b.parentId) ?? null : null,
  }));

  const containers: DrawingContainer[] = (template.containers || []).map(c => ({
    id: idMap.get(c.id)!,
    label: resolveLabel(c.label, lang),
    x: c.x,
    y: c.y,
    w: c.w,
    h: c.h,
    parentId: c.parentId ? idMap.get(c.parentId) ?? null : null,
  }));

  const edges: DrawingEdge[] = template.edges.map(e => ({
    id: uid('e'),
    from: idMap.get(e.from)!,
    to: idMap.get(e.to)!,
    ...(e.label ? { label: e.label } : {}),
    direction: e.direction || 'forward',
  }));

  return { blocks, containers, edges };
}

export function boardIsEmpty(state: Pick<DrawingState, 'blocks' | 'containers' | 'edges'>): boolean {
  return !(state.blocks?.length || state.containers?.length || state.edges?.length);
}

export function emptyBoardSlice(): Pick<DrawingState, 'blocks' | 'containers' | 'edges'> {
  return { blocks: [], containers: [], edges: [] };
}
