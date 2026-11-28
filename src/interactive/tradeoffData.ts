import type { TradeoffCard } from '../types';

export const TRADEOFF_CARDS: Record<string, TradeoffCard[]> = {
  'image-upload': [
    {
      id: 'sync-async',
      question: {
        ar: 'معالجة الـ thumbnails: sync ولا async؟',
        en: 'Thumbnail processing: sync or async?',
      },
      optionA: { ar: 'Sync في الـ request', en: 'Sync in the request' },
      optionB: { ar: 'Async عبر Queue + Workers', en: 'Async via Queue + Workers' },
      expected: 'B',
      expectedNote: {
        ar: 'الإنترفيور غالباً مستني async عشان الـ upload latency تفضل قليلة.',
        en: 'Interviewers usually expect async so upload latency stays low.',
      },
      prosA: { ar: 'اليوزر يشوف النتيجة فوراً', en: 'User sees result immediately' },
      consA: { ar: 'Latency عالية، timeouts، صعوبة الـ scale', en: 'High latency, timeouts, hard to scale' },
      prosB: { ar: 'Upload سريع، scale مستقل للـ workers', en: 'Fast upload, independently scalable workers' },
      consB: { ar: 'اليوزر يستنى شوية قبل ما الـ thumbs تجهز', en: 'User waits a bit before thumbs are ready' },
      whenOtherWins: {
        ar: 'Sync ممكن لو الصور صغيرة جداً والـ SLA يطلب جاهزية فورية.',
        en: 'Sync can win for tiny images when SLA requires immediate readiness.',
      },
    },
    {
      id: 'sql-nosql',
      question: {
        ar: 'Metadata store: SQL ولا NoSQL؟',
        en: 'Metadata store: SQL or NoSQL?',
      },
      optionA: { ar: 'SQL (Postgres)', en: 'SQL (Postgres)' },
      optionB: { ar: 'NoSQL (Dynamo/Cassandra)', en: 'NoSQL (Dynamo/Cassandra)' },
      expected: 'either',
      expectedNote: {
        ar: 'الاتنين مقبولين لو تبرر. SQL للـ relations، NoSQL للـ scale الأفقي.',
        en: 'Both are fine if justified. SQL for relations, NoSQL for horizontal scale.',
      },
      prosA: { ar: 'Transactions، joins، schema واضح', en: 'Transactions, joins, clear schema' },
      consA: { ar: 'Sharding أصعب عند النمو الكبير', en: 'Sharding harder at large scale' },
      prosB: { ar: 'Scale أفقي سهل، high write throughput', en: 'Easy horizontal scale, high write throughput' },
      consB: { ar: 'Queries محدودة، consistency أضعف', en: 'Limited queries, weaker consistency' },
      whenOtherWins: {
        ar: 'SQL يفوز لو فيه علاقات معقدة وصلاحيات؛ NoSQL يفوز مع مليارات الصفوف.',
        en: 'SQL wins with complex relations/ACL; NoSQL wins with billions of rows.',
      },
    },
    {
      id: 'cdn-direct',
      question: {
        ar: 'قراءة الصور: CDN ولا مباشرة من Object Storage؟',
        en: 'Image reads: CDN or direct from Object Storage?',
      },
      optionA: { ar: 'CDN أمام الـ storage', en: 'CDN in front of storage' },
      optionB: { ar: 'Direct من S3/GCS', en: 'Direct from S3/GCS' },
      expected: 'A',
      expectedNote: {
        ar: 'الـ CDN أساسي لـ read-heavy image delivery.',
        en: 'CDN is essential for read-heavy image delivery.',
      },
      prosA: { ar: 'Latency أقل، bandwidth أرخص، حماية للـ origin', en: 'Lower latency, cheaper bandwidth, origin protection' },
      consA: { ar: 'Cache invalidation وتعقيد إضافي', en: 'Cache invalidation and extra complexity' },
      prosB: { ar: 'أبسط تشغيلياً', en: 'Operationally simpler' },
      consB: { ar: 'تكلفة egress عالية وlatency أسوأ', en: 'High egress cost and worse latency' },
      whenOtherWins: {
        ar: 'Direct ممكن في internal tools بـ traffic قليل.',
        en: 'Direct can work for low-traffic internal tools.',
      },
    },
  ],
  'url-shortener': [
    {
      id: '301-302',
      question: {
        ar: 'Redirect: 301 ولا 302؟',
        en: 'Redirect: 301 or 302?',
      },
      optionA: { ar: '301 Permanent', en: '301 Permanent' },
      optionB: { ar: '302 Temporary', en: '302 Temporary' },
      expected: 'either',
      expectedNote: {
        ar: '301 أحسن للـ latency، 302 أحسن للـ analytics الدقيقة.',
        en: '301 is better for latency; 302 is better for accurate analytics.',
      },
      prosA: { ar: 'Browser/CDN يـ cache، ضغط أقل على السيرفر', en: 'Browser/CDN caches, less server load' },
      consA: { ar: 'Analytics ناقصة لأن الطلبات مش بترجع', en: 'Incomplete analytics because requests stop returning' },
      prosB: { ar: 'كل click يعدّي على السيرفر → analytics كاملة', en: 'Every click hits server → full analytics' },
      consB: { ar: 'Latency أعلى وload أكبر', en: 'Higher latency and more load' },
      whenOtherWins: {
        ar: 'اختار 301 لو analytics مش حرجة، و302 لو الـ product قايم على القياس.',
        en: 'Choose 301 if analytics are not critical, 302 if the product depends on measurement.',
      },
    },
    {
      id: 'base62-hash',
      question: {
        ar: 'توليد المفاتيح: Base62 counter ولا hash؟',
        en: 'Key generation: Base62 counter or hash?',
      },
      optionA: { ar: 'Base62 من counter', en: 'Base62 from counter' },
      optionB: { ar: 'Hash للـ URL', en: 'Hash of the URL' },
      expected: 'A',
      expectedNote: {
        ar: 'Counter/KGS أوضح وأقل collisions في المقابلات.',
        en: 'Counter/KGS is clearer and has fewer collisions in interviews.',
      },
      prosA: { ar: 'مفاتيح قصيرة، unique، predictable length', en: 'Short keys, unique, predictable length' },
      consA: { ar: 'محتاج خدمة counter موزعة', en: 'Needs a distributed counter service' },
      prosB: { ar: 'Stateless، نفس URL → نفس المفتاح', en: 'Stateless, same URL → same key' },
      consB: { ar: 'Collisions، طول غير ثابت أو أطول', en: 'Collisions, variable or longer length' },
      whenOtherWins: {
        ar: 'Hash ينفع لو عايز idempotent mapping ومن غير KGS.',
        en: 'Hash works if you want idempotent mapping without a KGS.',
      },
    },
    {
      id: 'sql-kv',
      question: {
        ar: 'تخزين الـ mapping: SQL ولا Key-Value؟',
        en: 'Mapping storage: SQL or Key-Value?',
      },
      optionA: { ar: 'SQL', en: 'SQL' },
      optionB: { ar: 'Key-Value (Dynamo/Cassandra)', en: 'Key-Value (Dynamo/Cassandra)' },
      expected: 'B',
      expectedNote: {
        ar: 'Access pattern بسيط (key → URL) فـ KV مناسب جداً.',
        en: 'Access pattern is simple (key → URL), so KV fits very well.',
      },
      prosA: { ar: 'مرونة في الـ queries والـ admin tools', en: 'Flexible queries and admin tools' },
      consA: { ar: 'Overkill للـ lookup البسيط', en: 'Overkill for simple lookup' },
      prosB: { ar: 'Latency واطي وscale ممتاز', en: 'Low latency and excellent scale' },
      consB: { ar: 'Secondary indexes أصعب', en: 'Secondary indexes harder' },
      whenOtherWins: {
        ar: 'SQL لو محتاج تقارير معقدة على نفس الـ store.',
        en: 'SQL if you need complex reporting on the same store.',
      },
    },
  ],
  'chat-messaging': [
    {
      id: 'ws-polling',
      question: {
        ar: 'Real-time delivery: WebSocket ولا long polling؟',
        en: 'Real-time delivery: WebSocket or long polling?',
      },
      optionA: { ar: 'WebSocket', en: 'WebSocket' },
      optionB: { ar: 'Long polling', en: 'Long polling' },
      expected: 'A',
      expectedNote: {
        ar: 'WebSocket هو المتوقع لنظام chat بحجم WhatsApp.',
        en: 'WebSocket is expected for a WhatsApp-scale chat system.',
      },
      prosA: { ar: 'Push فوري، أقل overhead', en: 'Immediate push, less overhead' },
      consA: { ar: 'Stateful connections وصعوبة الـ scale', en: 'Stateful connections and harder scaling' },
      prosB: { ar: 'أبسط مع الـ proxies والـ firewalls', en: 'Simpler with proxies and firewalls' },
      consB: { ar: 'Latency أعلى وload أكبر', en: 'Higher latency and more load' },
      whenOtherWins: {
        ar: 'Long polling fallback للشبكات اللي بتمنع WebSocket.',
        en: 'Long polling as fallback on networks that block WebSocket.',
      },
    },
    {
      id: 'fanout',
      question: {
        ar: 'Group fan-out: write-time ولا read-time؟',
        en: 'Group fan-out: write-time or read-time?',
      },
      optionA: { ar: 'Write-time fan-out', en: 'Write-time fan-out' },
      optionB: { ar: 'Read-time fan-out', en: 'Read-time fan-out' },
      expected: 'either',
      expectedNote: {
        ar: 'Hybrid شائع: write-time للجروبات الصغيرة، read-time للكبيرة.',
        en: 'Hybrid is common: write-time for small groups, read-time for large ones.',
      },
      prosA: { ar: 'قراءة سريعة للـ inbox', en: 'Fast inbox reads' },
      consA: { ar: 'Write amplification للجروبات الكبيرة', en: 'Write amplification for large groups' },
      prosB: { ar: 'كتابة واحدة، أرخص للجروبات الضخمة', en: 'Single write, cheaper for huge groups' },
      consB: { ar: 'قراءة أثقل وأكثر تعقيداً', en: 'Heavier, more complex reads' },
      whenOtherWins: {
        ar: 'Write-time للجروبات <100، read-time للـ broadcast/celebrity.',
        en: 'Write-time for groups <100, read-time for broadcast/celebrity.',
      },
    },
    {
      id: 'consistency',
      question: {
        ar: 'Message visibility: strong ولا eventual consistency؟',
        en: 'Message visibility: strong or eventual consistency?',
      },
      optionA: { ar: 'Strong consistency', en: 'Strong consistency' },
      optionB: { ar: 'Eventual consistency', en: 'Eventual consistency' },
      expected: 'B',
      expectedNote: {
        ar: 'Chat يتحمل تأخير ثواني؛ الـ availability أهم.',
        en: 'Chat can tolerate seconds of delay; availability matters more.',
      },
      prosA: { ar: 'كل الأجهزة تشوف نفس الترتيب فوراً', en: 'All devices see the same order immediately' },
      consA: { ar: 'Latency أعلى وصعوبة multi-region', en: 'Higher latency and harder multi-region' },
      prosB: { ar: 'أسرع وأكثر availability', en: 'Faster and more available' },
      consB: { ar: 'ممكن تشوف رسالة متأخرة لحظياً', en: 'Might briefly see a delayed message' },
      whenOtherWins: {
        ar: 'Strong consistency أهم في financial/ledger-like messaging.',
        en: 'Strong consistency matters more for financial/ledger-like messaging.',
      },
    },
  ],
};

export function emptyTradeoffs(scenarioId: string) {
  const cards = TRADEOFF_CARDS[scenarioId] || [];
  const answers: Record<string, { choice: 'A' | 'B' | null; justification: string; revealed: boolean; scored: boolean }> = {};
  for (const c of cards) {
    answers[c.id] = { choice: null, justification: '', revealed: false, scored: false };
  }
  return { answers };
}
