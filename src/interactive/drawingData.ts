import type { ComponentType } from '../types';

export interface ExpectedDesign {
  components: ComponentType[];
  edges: { from: ComponentType; to: ComponentType; label: { ar: string; en: string } }[];
  referenceLayout: { type: ComponentType; x: number; y: number }[];
}

export const DRAWING_EXPECTATIONS: Record<string, ExpectedDesign> = {
  'image-upload': {
    components: ['client', 'lb', 'api', 'storage', 'queue', 'worker', 'cdn', 'cache', 'db', 'monitoring'],
    edges: [
      { from: 'client', to: 'lb', label: { ar: 'رفع/قراءة', en: 'upload/read' } },
      { from: 'lb', to: 'api', label: { ar: 'توزيع', en: 'distribute' } },
      { from: 'api', to: 'storage', label: { ar: 'حفظ الأصل', en: 'store original' } },
      { from: 'api', to: 'queue', label: { ar: 'مهمة معالجة', en: 'process job' } },
      { from: 'queue', to: 'worker', label: { ar: 'consume', en: 'consume' } },
      { from: 'worker', to: 'storage', label: { ar: 'thumbnails', en: 'thumbnails' } },
      { from: 'client', to: 'cdn', label: { ar: 'قراءة سريعة', en: 'fast read' } },
      { from: 'cdn', to: 'storage', label: { ar: 'origin', en: 'origin' } },
      { from: 'api', to: 'db', label: { ar: 'metadata', en: 'metadata' } },
      { from: 'api', to: 'cache', label: { ar: 'cache metadata', en: 'cache metadata' } },
    ],
    referenceLayout: [
      { type: 'client', x: 20, y: 40 },
      { type: 'lb', x: 140, y: 40 },
      { type: 'api', x: 260, y: 40 },
      { type: 'storage', x: 400, y: 20 },
      { type: 'db', x: 400, y: 100 },
      { type: 'cache', x: 400, y: 180 },
      { type: 'queue', x: 260, y: 160 },
      { type: 'worker', x: 260, y: 240 },
      { type: 'cdn', x: 140, y: 160 },
      { type: 'monitoring', x: 20, y: 240 },
    ],
  },
  'url-shortener': {
    components: ['client', 'lb', 'api', 'kgs', 'cache', 'db', 'queue', 'monitoring'],
    edges: [
      { from: 'client', to: 'lb', label: { ar: 'create/redirect', en: 'create/redirect' } },
      { from: 'lb', to: 'api', label: { ar: 'توزيع', en: 'distribute' } },
      { from: 'api', to: 'kgs', label: { ar: 'طلب مفتاح', en: 'get key' } },
      { from: 'api', to: 'db', label: { ar: 'حفظ mapping', en: 'store mapping' } },
      { from: 'api', to: 'cache', label: { ar: 'cache-first', en: 'cache-first' } },
      { from: 'cache', to: 'db', label: { ar: 'miss → DB', en: 'miss → DB' } },
      { from: 'api', to: 'queue', label: { ar: 'analytics events', en: 'analytics events' } },
    ],
    referenceLayout: [
      { type: 'client', x: 20, y: 60 },
      { type: 'lb', x: 140, y: 60 },
      { type: 'api', x: 260, y: 60 },
      { type: 'kgs', x: 400, y: 20 },
      { type: 'cache', x: 400, y: 100 },
      { type: 'db', x: 400, y: 180 },
      { type: 'queue', x: 260, y: 180 },
      { type: 'monitoring', x: 20, y: 180 },
    ],
  },
  'chat-messaging': {
    components: ['client', 'lb', 'websocket', 'router', 'queue', 'db', 'presence', 'push', 'cache', 'monitoring'],
    edges: [
      { from: 'client', to: 'lb', label: { ar: 'connect', en: 'connect' } },
      { from: 'lb', to: 'websocket', label: { ar: 'sticky', en: 'sticky' } },
      { from: 'websocket', to: 'router', label: { ar: 'route message', en: 'route message' } },
      { from: 'router', to: 'queue', label: { ar: 'persist/async', en: 'persist/async' } },
      { from: 'queue', to: 'db', label: { ar: 'store', en: 'store' } },
      { from: 'router', to: 'websocket', label: { ar: 'deliver online', en: 'deliver online' } },
      { from: 'websocket', to: 'presence', label: { ar: 'heartbeat', en: 'heartbeat' } },
      { from: 'router', to: 'push', label: { ar: 'offline notify', en: 'offline notify' } },
      { from: 'presence', to: 'cache', label: { ar: 'online map', en: 'online map' } },
    ],
    referenceLayout: [
      { type: 'client', x: 20, y: 40 },
      { type: 'lb', x: 140, y: 40 },
      { type: 'websocket', x: 260, y: 40 },
      { type: 'router', x: 400, y: 40 },
      { type: 'queue', x: 400, y: 140 },
      { type: 'db', x: 400, y: 220 },
      { type: 'presence', x: 260, y: 140 },
      { type: 'cache', x: 140, y: 140 },
      { type: 'push', x: 260, y: 220 },
      { type: 'monitoring', x: 20, y: 220 },
    ],
  },
};

export function emptyDrawing() {
  return {
    blocks: [],
    edges: [],
    compared: false,
    matchedComponents: [] as string[],
    missedComponents: [] as string[],
    matchedEdges: [] as string[],
    missedEdges: [] as string[],
    score: 0,
  };
}
