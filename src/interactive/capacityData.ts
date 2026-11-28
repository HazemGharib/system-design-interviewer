import type { CapacityField } from '../types';

export interface CapacityScenario {
  helpers: CapacityField[];
  fields: CapacityField[];
  steps: { ar: string; en: string }[];
}

export const CAPACITY_DATA: Record<string, CapacityScenario> = {
  'image-upload': {
    helpers: [
      { id: 'dau', label: { ar: 'اليوزرز النشطين يومياً', en: 'Daily Active Users' }, unit: { ar: 'يوزر', en: 'users' }, reference: 10000000 },
      { id: 'uploadsPerUser', label: { ar: 'رفع لكل يوزر/يوم', en: 'Uploads per user/day' }, unit: { ar: 'صورة', en: 'images' }, reference: 2 },
      { id: 'avgSizeMb', label: { ar: 'متوسط حجم الصورة', en: 'Avg image size' }, unit: { ar: 'MB', en: 'MB' }, reference: 2 },
      { id: 'readWriteRatio', label: { ar: 'نسبة القراءة للكتابة', en: 'Read/Write ratio' }, unit: { ar: 'x', en: 'x' }, reference: 100 },
    ],
    fields: [
      { id: 'writeQps', label: { ar: 'Write QPS', en: 'Write QPS' }, unit: { ar: 'طلب/ث', en: 'req/s' }, reference: 230, helper: { ar: 'uploads/day ÷ 86400', en: 'uploads/day ÷ 86400' } },
      { id: 'readQps', label: { ar: 'Read QPS', en: 'Read QPS' }, unit: { ar: 'طلب/ث', en: 'req/s' }, reference: 23000, helper: { ar: 'write × ratio', en: 'write × ratio' } },
      { id: 'peakQps', label: { ar: 'Peak QPS', en: 'Peak QPS' }, unit: { ar: 'طلب/ث', en: 'req/s' }, reference: 69000, helper: { ar: 'read × 3', en: 'read × 3' } },
      { id: 'storageDay', label: { ar: 'تخزين/يوم', en: 'Storage/day' }, unit: { ar: 'TB', en: 'TB' }, reference: 40, helper: { ar: 'uploads × size', en: 'uploads × size' } },
      { id: 'storage5y', label: { ar: 'تخزين 5 سنين', en: 'Storage 5 years' }, unit: { ar: 'PB', en: 'PB' }, reference: 73, helper: { ar: 'day × 365 × 5', en: 'day × 365 × 5' } },
      { id: 'bandwidth', label: { ar: 'Bandwidth يومي', en: 'Daily bandwidth' }, unit: { ar: 'TB', en: 'TB' }, reference: 4000, helper: { ar: 'reads × size', en: 'reads × size' } },
      { id: 'servers', label: { ar: 'عدد API servers', en: 'API servers' }, unit: { ar: 'سيرفر', en: 'servers' }, reference: 50, helper: { ar: 'peak / capacity', en: 'peak / capacity' } },
    ],
    steps: [
      {
        ar: '1) Uploads/day = 10M DAU × 2 = 20M. Write QPS = 20M / 86400 ≈ 230.',
        en: '1) Uploads/day = 10M DAU × 2 = 20M. Write QPS = 20M / 86400 ≈ 230.',
      },
      {
        ar: '2) Read QPS = 230 × 100 = 23,000. Peak ≈ 3× = 69,000.',
        en: '2) Read QPS = 230 × 100 = 23,000. Peak ≈ 3× = 69,000.',
      },
      {
        ar: '3) Storage/day = 20M × 2MB = 40TB. 5 years ≈ 40 × 365 × 5 ≈ 73PB.',
        en: '3) Storage/day = 20M × 2MB = 40TB. 5 years ≈ 40 × 365 × 5 ≈ 73PB.',
      },
      {
        ar: '4) Bandwidth ≈ reads × size → حوالي 4PB/day عبر CDN. Servers ≈ peak/1500 ≈ 50.',
        en: '4) Bandwidth ≈ reads × size → ~4PB/day via CDN. Servers ≈ peak/1500 ≈ 50.',
      },
    ],
  },
  'url-shortener': {
    helpers: [
      { id: 'urlsMonth', label: { ar: 'روابط جديدة/شهر', en: 'New URLs/month' }, unit: { ar: 'URL', en: 'URLs' }, reference: 100000000 },
      { id: 'rwRatio', label: { ar: 'نسبة القراءة للكتابة', en: 'Read/Write ratio' }, unit: { ar: 'x', en: 'x' }, reference: 100 },
      { id: 'recordBytes', label: { ar: 'حجم السجل', en: 'Record size' }, unit: { ar: 'bytes', en: 'bytes' }, reference: 500 },
    ],
    fields: [
      { id: 'writeQps', label: { ar: 'Write QPS', en: 'Write QPS' }, unit: { ar: 'طلب/ث', en: 'req/s' }, reference: 40 },
      { id: 'readQps', label: { ar: 'Redirect QPS', en: 'Redirect QPS' }, unit: { ar: 'طلب/ث', en: 'req/s' }, reference: 4000 },
      { id: 'peakQps', label: { ar: 'Peak redirect QPS', en: 'Peak redirect QPS' }, unit: { ar: 'طلب/ث', en: 'req/s' }, reference: 12000 },
      { id: 'storageDay', label: { ar: 'تخزين/يوم', en: 'Storage/day' }, unit: { ar: 'GB', en: 'GB' }, reference: 1.7 },
      { id: 'storage5y', label: { ar: 'تخزين 5 سنين', en: 'Storage 5 years' }, unit: { ar: 'TB', en: 'TB' }, reference: 3 },
      { id: 'cacheSize', label: { ar: 'حجم الـ Cache', en: 'Cache size' }, unit: { ar: 'GB', en: 'GB' }, reference: 80 },
      { id: 'keySpace', label: { ar: 'Key space (Base62^7)', en: 'Key space (Base62^7)' }, unit: { ar: 'تريليون', en: 'trillion' }, reference: 3.5 },
    ],
    steps: [
      {
        ar: '1) Write QPS = 100M / 30 / 86400 ≈ 40. Read = 40 × 100 = 4000. Peak ≈ 12K.',
        en: '1) Write QPS = 100M / 30 / 86400 ≈ 40. Read = 40 × 100 = 4000. Peak ≈ 12K.',
      },
      {
        ar: '2) Storage/day = 100M/30 × 500B ≈ 1.7GB. 5 years ≈ 3TB مع overhead.',
        en: '2) Storage/day = 100M/30 × 500B ≈ 1.7GB. 5 years ≈ 3TB with overhead.',
      },
      {
        ar: '3) Cache الـ hot 20% من الـ redirects → ~80GB. Base62^7 ≈ 3.5 trillion keys.',
        en: '3) Cache hot 20% of redirects → ~80GB. Base62^7 ≈ 3.5 trillion keys.',
      },
    ],
  },
  'chat-messaging': {
    helpers: [
      { id: 'dau', label: { ar: 'اليوزرز النشطين يومياً', en: 'Daily Active Users' }, unit: { ar: 'يوزر', en: 'users' }, reference: 500000000 },
      { id: 'msgsPerUser', label: { ar: 'رسائل/يوزر/يوم', en: 'Messages/user/day' }, unit: { ar: 'رسالة', en: 'msgs' }, reference: 100 },
      { id: 'msgSize', label: { ar: 'متوسط حجم الرسالة', en: 'Avg message size' }, unit: { ar: 'KB', en: 'KB' }, reference: 1 },
      { id: 'concurrentPct', label: { ar: 'نسبة الـ concurrent', en: 'Concurrent %' }, unit: { ar: '%', en: '%' }, reference: 30 },
    ],
    fields: [
      { id: 'msgQps', label: { ar: 'Messages/sec', en: 'Messages/sec' }, unit: { ar: 'رسالة/ث', en: 'msg/s' }, reference: 580000 },
      { id: 'peakQps', label: { ar: 'Peak messages/sec', en: 'Peak messages/sec' }, unit: { ar: 'رسالة/ث', en: 'msg/s' }, reference: 1500000 },
      { id: 'storageDay', label: { ar: 'تخزين/يوم', en: 'Storage/day' }, unit: { ar: 'TB', en: 'TB' }, reference: 50 },
      { id: 'connections', label: { ar: 'Concurrent connections', en: 'Concurrent connections' }, unit: { ar: 'مليون', en: 'million' }, reference: 150 },
      { id: 'wsServers', label: { ar: 'WebSocket servers', en: 'WebSocket servers' }, unit: { ar: 'سيرفر', en: 'servers' }, reference: 1500 },
      { id: 'bandwidth', label: { ar: 'Bandwidth يومي', en: 'Daily bandwidth' }, unit: { ar: 'TB', en: 'TB' }, reference: 100 },
    ],
    steps: [
      {
        ar: '1) Messages/day = 500M × 100 = 50B. QPS = 50B/86400 ≈ 580K. Peak ≈ 1.5M.',
        en: '1) Messages/day = 500M × 100 = 50B. QPS = 50B/86400 ≈ 580K. Peak ≈ 1.5M.',
      },
      {
        ar: '2) Storage/day = 50B × 1KB = 50TB. Connections = 500M × 30% = 150M.',
        en: '2) Storage/day = 50B × 1KB = 50TB. Connections = 500M × 30% = 150M.',
      },
      {
        ar: '3) WS servers = 150M / 100K ≈ 1500. Bandwidth ≈ 100TB/day (send+receive).',
        en: '3) WS servers = 150M / 100K ≈ 1500. Bandwidth ≈ 100TB/day (send+receive).',
      },
    ],
  },
};

export function emptyCapacity(scenarioId: string) {
  const data = CAPACITY_DATA[scenarioId];
  const values: Record<string, string> = {};
  const helpers: Record<string, string> = {};
  if (data) {
    for (const f of data.fields) values[f.id] = '';
    for (const h of data.helpers) helpers[h.id] = '';
  }
  return { values, helpers, checked: false, results: {} };
}

export function verdictFor(user: number, reference: number): { verdict: 'good' | 'ok' | 'off'; ratio: number } {
  if (!Number.isFinite(user) || user <= 0 || reference <= 0) return { verdict: 'off', ratio: 0 };
  const ratio = user / reference;
  const factor = ratio >= 1 ? ratio : 1 / ratio;
  if (factor <= 2) return { verdict: 'good', ratio };
  if (factor <= 10) return { verdict: 'ok', ratio };
  return { verdict: 'off', ratio };
}
