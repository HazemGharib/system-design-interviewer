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
}

export interface GlobalState {
  lang: Lang;
  currentScenario: string | null;
  scenarios: Record<string, SavedScenarioState>;
}
