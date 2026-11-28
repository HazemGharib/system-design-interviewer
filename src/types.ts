export type Lang = 'ar' | 'en';
export type Level = 'senior' | 'staff';

export interface ChecklistItemDetail {
  why: string;
  how: string;
  tradeoffs: string;
  examples: string;
  mistakes: string;
}

export interface ChecklistItem {
  text: { ar: string; en: string };
  detail: { ar: ChecklistItemDetail; en: ChecklistItemDetail };
}

export interface Stage {
  id: string;
  title: { ar: string; en: string };
  shortTitle: { ar: string; en: string };
  prompt: { ar: string; en: string };
  items: ChecklistItem[];
  level: Level;
}

export interface Scenario {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  difficulty: { ar: string; en: string };
  estimatedTime: { ar: string; en: string };
  problemStatement: { ar: string; en: string };
  facts: { label: { ar: string; en: string }; value: { ar: string; en: string } }[];
  stages: Stage[];
}

export type ComponentType =
  | 'client'
  | 'lb'
  | 'api'
  | 'cache'
  | 'db'
  | 'replica'
  | 'storage'
  | 'cdn'
  | 'queue'
  | 'worker'
  | 'dlq'
  | 'websocket'
  | 'kgs'
  | 'push'
  | 'monitoring'
  | 'presence'
  | 'router';

export interface DrawingBlock {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  /** Optional manual size; omitted = auto-fit to label/icon. */
  w?: number;
  h?: number;
  /** Parent container id when nested inside a region/group. */
  parentId?: string | null;
}

export interface DrawingContainer {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Nested container parent. */
  parentId?: string | null;
}

export type DrawingEdgeDirection = 'forward' | 'backward' | 'both';

export interface DrawingEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  direction?: DrawingEdgeDirection;
}

export interface DrawingState {
  blocks: DrawingBlock[];
  /** Optional regions / VPCs / ASGs — ignored by default scoring. */
  containers?: DrawingContainer[];
  edges: DrawingEdge[];
  compared: boolean;
  matchedComponents: string[];
  missedComponents: string[];
  matchedEdges: string[];
  missedEdges: string[];
  score: number;
}

export interface CapacityField {
  id: string;
  label: { ar: string; en: string };
  unit: { ar: string; en: string };
  reference: number;
  helper?: { ar: string; en: string };
}

export type CapacityMode = 'auto' | 'practice';

export interface CapacityState {
  /** Variable / assumption inputs (start empty). */
  variables: Record<string, string>;
  /** Practice-mode user estimates keyed by metric id. */
  values: Record<string, string>;
  /** @deprecated migrated into variables */
  helpers?: Record<string, string>;
  /** Practice Check completed. */
  checked: boolean;
  results: Record<string, { verdict: 'good' | 'ok' | 'off'; ratio: number }>;
  /** Auto Check completed. */
  autoChecked?: boolean;
  autoResults?: Record<string, {
    verdict: 'good' | 'ok' | 'off' | 'missing';
    kind: 'input' | 'assumption';
  }>;
}

export interface ChaosIncident {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  afterStage: string;
  seconds: number;
  checklist: { ar: string; en: string }[];
}

export interface ChaosResponse {
  incidentId: string;
  answer: string;
  ticks: boolean[];
  revealed: boolean;
  timedOut: boolean;
}

export interface ChaosState {
  enabled: boolean;
  activeIncidentId: string | null;
  deadline: number | null;
  responses: Record<string, ChaosResponse>;
  triggered: string[];
}

export interface TradeoffCard {
  id: string;
  question: { ar: string; en: string };
  optionA: { ar: string; en: string };
  optionB: { ar: string; en: string };
  expected: 'A' | 'B' | 'either';
  expectedNote: { ar: string; en: string };
  prosA: { ar: string; en: string };
  consA: { ar: string; en: string };
  prosB: { ar: string; en: string };
  consB: { ar: string; en: string };
  whenOtherWins: { ar: string; en: string };
}

export interface TradeoffAnswer {
  choice: 'A' | 'B' | null;
  justification: string;
  revealed: boolean;
  scored: boolean;
}

export interface TradeoffState {
  answers: Record<string, TradeoffAnswer>;
}

export type RadarDimension =
  | 'requirements'
  | 'estimation'
  | 'architecture'
  | 'scaling'
  | 'reliability'
  | 'dataModeling'
  | 'tradeoffs'
  | 'monitoring';

export interface RadarScores {
  requirements: number;
  estimation: number;
  architecture: number;
  scaling: number;
  reliability: number;
  dataModeling: number;
  tradeoffs: number;
  monitoring: number;
}

export interface AttemptHistory {
  timestamp: number;
  scores: RadarScores;
  overall: number;
  level: Level;
}

export interface SavedScenarioState {
  answers: Record<string, string>;
  ticks: Record<string, boolean[]>;
  revealed: Record<string, boolean>;
  expanded: Record<string, Record<number, boolean>>;
  view: string;
  remaining: number;
  running: boolean;
  deadline: number | null;
  level: Level;
  drawing: DrawingState;
  capacity: CapacityState;
  chaos: ChaosState;
  tradeoffs: TradeoffState;
  history: AttemptHistory[];
}

export interface GlobalState {
  lang: Lang;
  currentScenario: string | null;
  scenarios: Record<string, SavedScenarioState>;
}
