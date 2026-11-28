import type {
  ChecklistItem,
  ComponentType,
  ChaosIncident,
  TradeoffCard,
  Level,
} from '../types';
import type { CapacityModel } from '../interactive/capacityEngine';

export type Bi = { ar: string; en: string };

export interface FlowPacketJson {
  from: string;
  to: string;
}

export interface FlowStepJson {
  id: string;
  caption: Bi;
  /** Highlighted node types; derived from edgeKeys when omitted. */
  nodes?: string[];
  /** Keys like "client->api" matching drawing.edges from→to. */
  edgeKeys: string[];
  /** Optional packet path (component types). */
  packet?: FlowPacketJson;
  /** Autoplay dwell ms (UI default ~2200). */
  durationMs?: number;
}

export interface SolutionFlowJson {
  id: string;
  title: Bi;
  steps: FlowStepJson[];
}

export interface DrawingContainerJson {
  id: string;
  label: Bi;
  x: number;
  y: number;
  w: number;
  h: number;
  parentId?: string | null;
}

export interface ScenarioJson {
  id: string;
  title: Bi;
  description: Bi;
  difficulty: Bi;
  estimatedTime: Bi;
  problemStatement: Bi;
  facts: { label: Bi; value: Bi }[];
  stages: {
    id: string;
    title: Bi;
    shortTitle: Bi;
    prompt: Bi;
    items: ChecklistItem[];
    level: Level;
  }[];
  capacity: CapacityModel | null;
  chaos: ChaosIncident[];
  tradeoffs: TradeoffCard[];
  drawing: {
    components: ComponentType[];
    edges: { from: ComponentType; to: ComponentType; label: Bi }[];
    referenceLayout: { type: ComponentType; x: number; y: number }[];
    containers?: DrawingContainerJson[];
  } | null;
  /** Animated solution walkthrough flows (write / read / failure, …). */
  flows?: SolutionFlowJson[];
}

export interface CheatEntryJson {
  id: string;
  problem: Bi;
  patterns: Bi;
  when: Bi;
  tradeoffs: Bi;
  example: Bi;
  tags: string[];
  termIds?: string[];
}

export interface CheatCategoryJson {
  id: string;
  title: Bi;
  entries: CheatEntryJson[];
}

export interface CheatsheetJson {
  categories: CheatCategoryJson[];
  numbers: {
    title: Bi;
    items: { label: Bi; value: Bi }[];
  };
}

export interface GlossaryTermJson {
  id: string;
  category: string;
  name: Bi;
  short: Bi;
  definition: Bi;
  when: Bi;
  pros: Bi;
  cons: Bi;
  example: Bi;
  related: string[];
}

export interface GlossaryJson {
  categories: { id: string; title: Bi }[];
  terms: GlossaryTermJson[];
}
