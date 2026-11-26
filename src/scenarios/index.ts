import { imageUploadScenario } from './imageUpload';
import { urlShortenerScenario } from './urlShortener';
import { chatMessagingScenario } from './chatMessaging';
import type { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [
  imageUploadScenario,
  urlShortenerScenario,
  chatMessagingScenario,
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}
