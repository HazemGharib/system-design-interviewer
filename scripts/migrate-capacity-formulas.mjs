/**
 * Rewrites capacity blocks in scenario JSON to formula-driven schema.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/data/scenarios');

const Bi = (ar, en) => ({ ar, en });

const capacities = {
  'image-upload': {
    variables: [
      { id: 'dau', label: Bi('اليوزرز النشطين يومياً', 'Daily Active Users'), unit: Bi('يوزر', 'users'), default: 10_000_000, role: 'input' },
      { id: 'uploadsPerUser', label: Bi('رفع لكل يوزر/يوم', 'Uploads per user/day'), unit: Bi('صورة', 'images'), default: 2, role: 'input' },
      { id: 'avgSizeMb', label: Bi('متوسط حجم الصورة', 'Avg image size'), unit: Bi('MB', 'MB'), default: 2, role: 'input' },
      { id: 'readWriteRatio', label: Bi('نسبة القراءة للكتابة', 'Read/Write ratio'), unit: Bi('x', 'x'), default: 100, role: 'input' },
      { id: 'peakFactor', label: Bi('معامل الذروة', 'Peak factor'), unit: Bi('x', 'x'), default: 3, role: 'assumption' },
      { id: 'serverCapacity', label: Bi('سعة السيرفر', 'Per-server capacity'), unit: Bi('طلب/ث', 'req/s'), default: 1500, role: 'assumption' },
      { id: 'retentionYears', label: Bi('سنوات الاحتفاظ', 'Retention years'), unit: Bi('سنة', 'years'), default: 5, role: 'assumption' },
      { id: 'daysPerYear', label: Bi('أيام/سنة', 'Days/year'), unit: Bi('يوم', 'days'), default: 365, role: 'assumption' },
    ],
    metrics: [
      {
        id: 'uploadsDay',
        label: Bi('رفع/يوم', 'Uploads/day'),
        unit: Bi('صورة', 'images'),
        format: 'count',
        expr: 'dau * uploadsPerUser',
        display: [{ ref: 'dau' }, { text: ' × ' }, { ref: 'uploadsPerUser' }],
        practice: false,
      },
      {
        id: 'writeQps',
        label: Bi('Write QPS', 'Write QPS'),
        unit: Bi('طلب/ث', 'req/s'),
        format: 'qps',
        expr: 'uploadsDay / 86400',
        display: [{ ref: 'uploadsDay' }, { text: ' ÷ ' }, { const: 86400 }],
        practice: true,
      },
      {
        id: 'readQps',
        label: Bi('Read QPS', 'Read QPS'),
        unit: Bi('طلب/ث', 'req/s'),
        format: 'qps',
        expr: 'writeQps * readWriteRatio',
        display: [{ ref: 'writeQps' }, { text: ' × ' }, { var: 'readWriteRatio' }],
        practice: true,
      },
      {
        id: 'peakQps',
        label: Bi('Peak QPS', 'Peak QPS'),
        unit: Bi('طلب/ث', 'req/s'),
        format: 'qps',
        expr: 'readQps * peakFactor',
        display: [{ ref: 'readQps' }, { text: ' × ' }, { var: 'peakFactor' }],
        practice: true,
      },
      {
        id: 'storageDay',
        label: Bi('تخزين/يوم', 'Storage/day'),
        unit: Bi('TB', 'TB'),
        format: 'storage',
        expr: 'uploadsDay * avgSizeMb / 1000000',
        display: [{ ref: 'uploadsDay' }, { text: ' × ' }, { var: 'avgSizeMb' }, { text: ' MB ÷ 1,000,000' }],
        practice: true,
      },
      {
        id: 'storage5y',
        label: Bi('تخزين طويل الأمد', 'Long-term storage'),
        unit: Bi('PB', 'PB'),
        format: 'storage',
        expr: 'storageDay * daysPerYear * retentionYears / 1000',
        display: [{ ref: 'storageDay' }, { text: ' × ' }, { var: 'daysPerYear' }, { text: ' × ' }, { var: 'retentionYears' }, { text: ' ÷ 1,000' }],
        practice: true,
      },
      {
        id: 'bandwidth',
        label: Bi('Bandwidth يومي', 'Daily bandwidth'),
        unit: Bi('TB', 'TB'),
        format: 'storage',
        expr: 'uploadsDay * readWriteRatio * avgSizeMb / 1000000',
        display: [{ ref: 'uploadsDay' }, { text: ' × ' }, { var: 'readWriteRatio' }, { text: ' × ' }, { var: 'avgSizeMb' }, { text: ' MB ÷ 1,000,000' }],
        practice: true,
      },
      {
        id: 'servers',
        label: Bi('عدد API servers', 'API servers'),
        unit: Bi('سيرفر', 'servers'),
        format: 'count',
        expr: 'peakQps / serverCapacity',
        display: [{ ref: 'peakQps' }, { text: ' ÷ ' }, { var: 'serverCapacity' }],
        practice: true,
      },
    ],
    steps: [
      Bi('1) Uploads/day = DAU × uploads. Write QPS = uploads/day ÷ 86400.', '1) Uploads/day = DAU × uploads. Write QPS = uploads/day ÷ 86400.'),
      Bi('2) Read QPS = write × ratio. Peak = read × peak factor.', '2) Read QPS = write × ratio. Peak = read × peak factor.'),
      Bi('3) Storage/day من الحجم، والتخزين طويل الأمد = يوم × أيام/سنة × سنين.', '3) Storage/day from size; long-term = day × days/year × years.'),
      Bi('4) Bandwidth ≈ reads × size. Servers ≈ peak ÷ per-server capacity.', '4) Bandwidth ≈ reads × size. Servers ≈ peak ÷ per-server capacity.'),
    ],
  },

  'url-shortener': {
    variables: [
      { id: 'urlsMonth', label: Bi('روابط جديدة/شهر', 'New URLs/month'), unit: Bi('URL', 'URLs'), default: 100_000_000, role: 'input' },
      { id: 'rwRatio', label: Bi('نسبة القراءة للكتابة', 'Read/Write ratio'), unit: Bi('x', 'x'), default: 100, role: 'input' },
      { id: 'recordBytes', label: Bi('حجم السجل', 'Record size'), unit: Bi('bytes', 'bytes'), default: 500, role: 'input' },
      { id: 'daysPerMonth', label: Bi('أيام/شهر', 'Days/month'), unit: Bi('يوم', 'days'), default: 30, role: 'assumption' },
      { id: 'peakFactor', label: Bi('معامل الذروة', 'Peak factor'), unit: Bi('x', 'x'), default: 3, role: 'assumption' },
      { id: 'retentionYears', label: Bi('سنوات الاحتفاظ', 'Retention years'), unit: Bi('سنة', 'years'), default: 5, role: 'assumption' },
      { id: 'daysPerYear', label: Bi('أيام/سنة', 'Days/year'), unit: Bi('يوم', 'days'), default: 365, role: 'assumption' },
      { id: 'cacheHotPct', label: Bi('نسبة الـ hot cache', 'Hot cache %'), unit: Bi('%', '%'), default: 20, role: 'assumption' },
      { id: 'cacheMonths', label: Bi('شهور الـ hot set', 'Hot-set months'), unit: Bi('شهر', 'months'), default: 8, role: 'assumption' },
      { id: 'keyLength', label: Bi('طول المفتاح', 'Key length'), unit: Bi('حرف', 'chars'), default: 7, role: 'assumption' },
      { id: 'alphabetSize', label: Bi('حجم الأبجدية', 'Alphabet size'), unit: Bi('', ''), default: 62, role: 'assumption' },
    ],
    metrics: [
      {
        id: 'writeQps',
        label: Bi('Write QPS', 'Write QPS'),
        unit: Bi('طلب/ث', 'req/s'),
        format: 'qps',
        expr: 'urlsMonth / daysPerMonth / 86400',
        display: [{ var: 'urlsMonth' }, { text: ' ÷ ' }, { var: 'daysPerMonth' }, { text: ' ÷ ' }, { const: 86400 }],
        practice: true,
      },
      {
        id: 'readQps',
        label: Bi('Redirect QPS', 'Redirect QPS'),
        unit: Bi('طلب/ث', 'req/s'),
        format: 'qps',
        expr: 'writeQps * rwRatio',
        display: [{ ref: 'writeQps' }, { text: ' × ' }, { var: 'rwRatio' }],
        practice: true,
      },
      {
        id: 'peakQps',
        label: Bi('Peak redirect QPS', 'Peak redirect QPS'),
        unit: Bi('طلب/ث', 'req/s'),
        format: 'qps',
        expr: 'readQps * peakFactor',
        display: [{ ref: 'readQps' }, { text: ' × ' }, { var: 'peakFactor' }],
        practice: true,
      },
      {
        id: 'storageDay',
        label: Bi('تخزين/يوم', 'Storage/day'),
        unit: Bi('GB', 'GB'),
        format: 'storage',
        expr: 'urlsMonth / daysPerMonth * recordBytes / 1000000000',
        display: [{ var: 'urlsMonth' }, { text: ' ÷ ' }, { var: 'daysPerMonth' }, { text: ' × ' }, { var: 'recordBytes' }, { text: ' B ÷ 1e9' }],
        practice: true,
      },
      {
        id: 'storage5y',
        label: Bi('تخزين طويل الأمد', 'Long-term storage'),
        unit: Bi('TB', 'TB'),
        format: 'storage',
        expr: 'storageDay * daysPerYear * retentionYears / 1000',
        display: [{ ref: 'storageDay' }, { text: ' × ' }, { var: 'daysPerYear' }, { text: ' × ' }, { var: 'retentionYears' }, { text: ' ÷ 1,000' }],
        practice: true,
      },
      {
        id: 'cacheSize',
        label: Bi('حجم الـ Cache', 'Cache size'),
        unit: Bi('GB', 'GB'),
        format: 'storage',
        expr: 'urlsMonth * cacheMonths * cacheHotPct / 100 * recordBytes / 1000000000',
        display: [{ var: 'urlsMonth' }, { text: ' × ' }, { var: 'cacheMonths' }, { text: ' × ' }, { var: 'cacheHotPct' }, { text: '% × ' }, { var: 'recordBytes' }, { text: ' B ÷ 1e9' }],
        practice: true,
      },
      {
        id: 'keySpace',
        label: Bi('Key space', 'Key space'),
        unit: Bi('تريليون', 'trillion'),
        format: 'count',
        expr: 'alphabetSize ** keyLength / 1000000000000',
        display: [{ var: 'alphabetSize' }, { text: '^' }, { var: 'keyLength' }, { text: ' ÷ 1e12' }],
        practice: true,
      },
    ],
    steps: [
      Bi('1) Write QPS = URLs/month ÷ أيام/شهر ÷ 86400. Read = write × ratio.', '1) Write QPS = URLs/month ÷ days/month ÷ 86400. Read = write × ratio.'),
      Bi('2) Storage/day من حجم السجل، والتخزين طويل الأمد عبر سنوات الاحتفاظ.', '2) Storage/day from record size; long-term via retention years.'),
      Bi('3) Cache = hot % من الروابط على شهور. Key space = alphabet^length.', '3) Cache = hot % of URLs over months. Key space = alphabet^length.'),
    ],
  },

  'chat-messaging': {
    variables: [
      { id: 'dau', label: Bi('اليوزرز النشطين يومياً', 'Daily Active Users'), unit: Bi('يوزر', 'users'), default: 500_000_000, role: 'input' },
      { id: 'msgsPerUser', label: Bi('رسائل/يوزر/يوم', 'Messages/user/day'), unit: Bi('رسالة', 'msgs'), default: 100, role: 'input' },
      { id: 'msgSizeKb', label: Bi('متوسط حجم الرسالة', 'Avg message size'), unit: Bi('KB', 'KB'), default: 1, role: 'input' },
      { id: 'concurrentPct', label: Bi('نسبة الـ concurrent', 'Concurrent %'), unit: Bi('%', '%'), default: 30, role: 'input' },
      { id: 'peakFactor', label: Bi('معامل الذروة', 'Peak factor'), unit: Bi('x', 'x'), default: 2.6, role: 'assumption' },
      { id: 'connPerServer', label: Bi('اتصالات/سيرفر', 'Connections/server'), unit: Bi('اتصال', 'conns'), default: 100_000, role: 'assumption' },
      { id: 'duplexFactor', label: Bi('معامل الإرسال/الاستقبال', 'Send+receive factor'), unit: Bi('x', 'x'), default: 2, role: 'assumption' },
    ],
    metrics: [
      {
        id: 'msgsDay',
        label: Bi('رسائل/يوم', 'Messages/day'),
        unit: Bi('رسالة', 'msgs'),
        format: 'count',
        expr: 'dau * msgsPerUser',
        display: [{ ref: 'dau' }, { text: ' × ' }, { ref: 'msgsPerUser' }],
        practice: false,
      },
      {
        id: 'msgQps',
        label: Bi('Messages/sec', 'Messages/sec'),
        unit: Bi('رسالة/ث', 'msg/s'),
        format: 'qps',
        expr: 'msgsDay / 86400',
        display: [{ ref: 'msgsDay' }, { text: ' ÷ ' }, { const: 86400 }],
        practice: true,
      },
      {
        id: 'peakQps',
        label: Bi('Peak messages/sec', 'Peak messages/sec'),
        unit: Bi('رسالة/ث', 'msg/s'),
        format: 'qps',
        expr: 'msgQps * peakFactor',
        display: [{ ref: 'msgQps' }, { text: ' × ' }, { var: 'peakFactor' }],
        practice: true,
      },
      {
        id: 'storageDay',
        label: Bi('تخزين/يوم', 'Storage/day'),
        unit: Bi('TB', 'TB'),
        format: 'storage',
        expr: 'msgsDay * msgSizeKb / 1000000000',
        display: [{ ref: 'msgsDay' }, { text: ' × ' }, { var: 'msgSizeKb' }, { text: ' KB ÷ 1e9' }],
        practice: true,
      },
      {
        id: 'connections',
        label: Bi('Concurrent connections', 'Concurrent connections'),
        unit: Bi('مليون', 'million'),
        format: 'count',
        expr: 'dau * concurrentPct / 100 / 1000000',
        display: [{ ref: 'dau' }, { text: ' × ' }, { var: 'concurrentPct' }, { text: '% ÷ 1,000,000' }],
        practice: true,
      },
      {
        id: 'wsServers',
        label: Bi('WebSocket servers', 'WebSocket servers'),
        unit: Bi('سيرفر', 'servers'),
        format: 'count',
        expr: 'dau * concurrentPct / 100 / connPerServer',
        display: [{ ref: 'dau' }, { text: ' × ' }, { var: 'concurrentPct' }, { text: '% ÷ ' }, { var: 'connPerServer' }],
        practice: true,
      },
      {
        id: 'bandwidth',
        label: Bi('Bandwidth يومي', 'Daily bandwidth'),
        unit: Bi('TB', 'TB'),
        format: 'storage',
        expr: 'msgsDay * msgSizeKb * duplexFactor / 1000000000',
        display: [{ ref: 'msgsDay' }, { text: ' × ' }, { var: 'msgSizeKb' }, { text: ' KB × ' }, { var: 'duplexFactor' }, { text: ' ÷ 1e9' }],
        practice: true,
      },
    ],
    steps: [
      Bi('1) Messages/day = DAU × msgs. QPS = day ÷ 86400. Peak = QPS × factor.', '1) Messages/day = DAU × msgs. QPS = day ÷ 86400. Peak = QPS × factor.'),
      Bi('2) Storage/day من حجم الرسالة. Connections = DAU × concurrent %.', '2) Storage/day from message size. Connections = DAU × concurrent %.'),
      Bi('3) WS servers = connections ÷ per-server. Bandwidth ≈ send+receive.', '3) WS servers = connections ÷ per-server. Bandwidth ≈ send+receive.'),
    ],
  },
};

for (const [id, capacity] of Object.entries(capacities)) {
  const path = join(dir, `${id}.json`);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  raw.capacity = capacity;
  writeFileSync(path, JSON.stringify(raw, null, 2) + '\n');
  console.log('updated', id);
}
