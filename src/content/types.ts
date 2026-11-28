import type {
  ChecklistItem,
  ComponentType,
  CapacityField,
  ChaosIncident,
  TradeoffCard,
  Level,
} from '../types';

export type Bi = { ar: string; en: string };

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
  capacity: {
    helpers: CapacityField[];
    fields: CapacityField[];
    steps: Bi[];
  } | null;
  chaos: ChaosIncident[];
  tradeoffs: TradeoffCard[];
  drawing: {
    components: ComponentType[];
    edges: { from: ComponentType; to: ComponentType; label: Bi }[];
    referenceLayout: { type: ComponentType; x: number; y: number }[];
  } | null;
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
