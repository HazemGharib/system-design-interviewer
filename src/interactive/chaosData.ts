import type { ChaosIncident } from '../types';

export const CHAOS_INCIDENTS: Record<string, ChaosIncident[]> = {
  'image-upload': [
    {
      id: 'cache-down',
      title: { ar: 'الـ Cache cluster وقع', en: 'Cache cluster is down' },
      description: {
        ar: 'Redis cluster مش شغال. الـ metadata lookups كلها بتروح على الـ DB. الـ latency طالعة والـ DB CPU على 95%. إيه هتعمل؟',
        en: 'Redis cluster is down. All metadata lookups hit the DB. Latency is up and DB CPU is at 95%. What do you do?',
      },
      afterStage: 'architecture',
      seconds: 90,
      checklist: [
        { ar: 'فعّل circuit breaker / fail-open للـ cache', en: 'Enable circuit breaker / fail-open for cache' },
        { ar: 'زوّد DB read replicas أو throttle reads', en: 'Scale DB read replicas or throttle reads' },
        { ar: 'رجّع cache من snapshot أو cold start تدريجي', en: 'Restore cache from snapshot or gradual cold start' },
        { ar: 'راقب error rate وp99 أثناء الاستعادة', en: 'Watch error rate and p99 during recovery' },
      ],
    },
    {
      id: 'traffic-spike',
      title: { ar: 'ترافيك ×10 مفاجئ', en: 'Sudden 10× traffic spike' },
      description: {
        ar: 'حملة تسويقية خلّت الـ uploads والـ reads يزيدوا 10 أضعاف في نص ساعة. الـ workers بتأخر والـ queue بتتكدس. إيه خطتك؟',
        en: 'A marketing campaign caused uploads and reads to jump 10× in 30 minutes. Workers are lagging and the queue is backing up. What is your plan?',
      },
      afterStage: 'scaling',
      seconds: 90,
      checklist: [
        { ar: 'Auto-scale workers والـ API horizontally', en: 'Auto-scale workers and API horizontally' },
        { ar: 'Priority queue للـ uploads العاجلة', en: 'Priority queue for urgent uploads' },
        { ar: 'Rate limit / degrade غير الضروري (thumbnails كبيرة)', en: 'Rate limit / degrade non-essential work (large thumbnails)' },
        { ar: 'زوّد CDN وcache TTLs مؤقتاً', en: 'Increase CDN and cache TTLs temporarily' },
      ],
    },
    {
      id: 'region-outage',
      title: { ar: 'Region كاملة وقعت', en: 'Full region outage' },
      description: {
        ar: 'الـ primary region (us-east) offline. الـ uploads واقفة والـ CDN بيرجع errors من الـ origin. إيه الـ failover steps؟',
        en: 'Primary region (us-east) is offline. Uploads are stuck and CDN returns origin errors. What are your failover steps?',
      },
      afterStage: 'bottlenecks',
      seconds: 90,
      checklist: [
        { ar: 'DNS / traffic shift للـ secondary region', en: 'DNS / traffic shift to secondary region' },
        { ar: 'Promote read replica أو standby DB', en: 'Promote read replica or standby DB' },
        { ar: 'أكد RPO/RTO والـ data integrity بعد الـ failover', en: 'Confirm RPO/RTO and data integrity after failover' },
        { ar: 'Communicate status للـ users والـ status page', en: 'Communicate status to users and status page' },
      ],
    },
  ],
  'url-shortener': [
    {
      id: 'db-primary-fail',
      title: { ar: 'DB primary فشل', en: 'DB primary failure' },
      description: {
        ar: 'الـ primary DB مش بيرد. الـ creates واقفة، والـ redirects لسه شغالة من الـ cache بنسبة 80%. إيه هتعمل؟',
        en: 'Primary DB is not responding. Creates are stuck, redirects still work from cache ~80%. What do you do?',
      },
      afterStage: 'architecture',
      seconds: 90,
      checklist: [
        { ar: 'Promote replica لـ primary فوراً', en: 'Promote replica to primary immediately' },
        { ar: 'Queue الـ creates مؤقتاً أو رجّع 503 مع retry', en: 'Queue creates temporarily or return 503 with retry' },
        { ar: 'تأكد الـ cache ما يكتبش mappings خاطئة', en: 'Ensure cache does not write bad mappings' },
        { ar: 'Runbook: check replication lag قبل الـ promote', en: 'Runbook: check replication lag before promote' },
      ],
    },
    {
      id: 'hot-key',
      title: { ar: 'Hot key على رابط مشهور', en: 'Hot key on a viral link' },
      description: {
        ar: 'رابط واحد بياخد 30% من كل الـ redirects. الـ cache node والـ DB shard بتولّع. إزاي تحل؟',
        en: 'One link is getting 30% of all redirects. Cache node and DB shard are on fire. How do you fix it?',
      },
      afterStage: 'scaling',
      seconds: 90,
      checklist: [
        { ar: 'Local/edge cache أو CDN للـ hot key', en: 'Local/edge cache or CDN for the hot key' },
        { ar: 'Replicate key على كذا cache node', en: 'Replicate key across multiple cache nodes' },
        { ar: 'Rate limit أو serve من memory على الـ API', en: 'Rate limit or serve from memory on API' },
        { ar: 'Monitor hotspot metrics بعد الإصلاح', en: 'Monitor hotspot metrics after the fix' },
      ],
    },
    {
      id: 'queue-backlog',
      title: { ar: 'Analytics queue backlog', en: 'Analytics queue backlog' },
      description: {
        ar: 'Kafka lag وصل لـ 2 ساعات. الـ dashboards قديمة والـ consumers مش لاحقين. الـ redirects سليمة. إيه الأولوية؟',
        en: 'Kafka lag hit 2 hours. Dashboards are stale and consumers cannot keep up. Redirects are fine. What is the priority?',
      },
      afterStage: 'monitoring',
      seconds: 90,
      checklist: [
        { ar: 'Scale consumers وpartition count', en: 'Scale consumers and partition count' },
        { ar: 'Drop/sample non-critical events مؤقتاً', en: 'Drop/sample non-critical events temporarily' },
        { ar: 'Separate critical vs batch analytics', en: 'Separate critical vs batch analytics' },
        { ar: 'Alert على lag قبل ما يوصل لساعات', en: 'Alert on lag before it reaches hours' },
      ],
    },
  ],
  'chat-messaging': [
    {
      id: 'ws-storm',
      title: { ar: 'WebSocket reconnect storm', en: 'WebSocket reconnect storm' },
      description: {
        ar: 'بعد outage قصير، 40M clients بيحاولوا يعملوا reconnect في نفس الوقت. الـ LB والـ WS servers بتسقط تاني. إيه هتعمل؟',
        en: 'After a brief outage, 40M clients try to reconnect at once. LB and WS servers are falling again. What do you do?',
      },
      afterStage: 'architecture',
      seconds: 90,
      checklist: [
        { ar: 'Client jitter / exponential backoff', en: 'Client jitter / exponential backoff' },
        { ar: 'Connection rate limiting على الـ LB', en: 'Connection rate limiting on LB' },
        { ar: 'Scale WS fleet وshed load gracefully', en: 'Scale WS fleet and shed load gracefully' },
        { ar: 'Stagger reconnect by user shard', en: 'Stagger reconnect by user shard' },
      ],
    },
    {
      id: 'celebrity-group',
      title: { ar: 'Celebrity في group chat', en: 'Celebrity in a group chat' },
      description: {
        ar: 'مشهور انضم لجروب 500 عضو وبيبعت رسائل، بس الـ fan-out بقى لـ millions بسبب shared groups وتكديس. النظام بيتأخر. الحل؟',
        en: 'A celebrity joined a 500-member group and is messaging, but fan-out exploded to millions via shared groups and backlog. System is lagging. Fix?',
      },
      afterStage: 'scaling',
      seconds: 90,
      checklist: [
        { ar: 'Switch large fan-out لـ read-time / hybrid', en: 'Switch large fan-out to read-time / hybrid' },
        { ar: 'Rate limit celebrity senders', en: 'Rate limit celebrity senders' },
        { ar: 'Isolate hot conversations على shards منفصلة', en: 'Isolate hot conversations on dedicated shards' },
        { ar: 'Push notifications batching بدل per-message', en: 'Batch push notifications instead of per-message' },
      ],
    },
    {
      id: 'presence-storm',
      title: { ar: 'Presence update storm', en: 'Presence update storm' },
      description: {
        ar: 'بعد مباراة، ملايين اليوزرز online/offline بسرعة. الـ presence pub/sub بيغرق الـ connections. إيه التخفيف؟',
        en: 'After a match, millions of users go online/offline rapidly. Presence pub/sub is flooding connections. What is the mitigation?',
      },
      afterStage: 'bottlenecks',
      seconds: 90,
      checklist: [
        { ar: 'Batch وthrottle presence broadcasts', en: 'Batch and throttle presence broadcasts' },
        { ar: 'Only notify contacts / open conversations', en: 'Only notify contacts / open conversations' },
        { ar: 'Increase TTL وreduce heartbeat frequency مؤقتاً', en: 'Increase TTL and reduce heartbeat frequency temporarily' },
        { ar: 'Degrade presence accuracy أثناء الـ spike', en: 'Degrade presence accuracy during the spike' },
      ],
    },
  ],
};

export function emptyChaos(enabled = false) {
  return {
    enabled,
    activeIncidentId: null as string | null,
    deadline: null as number | null,
    responses: {} as Record<string, { incidentId: string; answer: string; ticks: boolean[]; revealed: boolean; timedOut: boolean }>,
    triggered: [] as string[],
  };
}
