import type { Scenario, ChecklistItem } from '../types';

function item(
  ar: string,
  en: string,
  detailAr: { why: string; how: string; tradeoffs: string; examples: string; mistakes: string },
  detailEn: { why: string; how: string; tradeoffs: string; examples: string; mistakes: string }
): ChecklistItem {
  return {
    text: { ar, en },
    detail: { ar: detailAr, en: detailEn }
  };
}

export const chatMessagingScenario: Scenario = {
  id: 'chat-messaging',
  title: { ar: 'نظام الشات والرسائل', en: 'Chat & Messaging System' },
  description: {
    ar: 'صمم نظام شات real-time زي WhatsApp مع group chats',
    en: 'Design a real-time chat system like WhatsApp with group chats'
  },
  difficulty: { ar: 'صعب', en: 'Hard' },
  estimatedTime: { ar: '50 دقيقة', en: '50 minutes' },
  problemStatement: {
    ar: 'عايزينك تصمم نظام شات real-time زي WhatsApp. الفيتشرز المطلوبة: 1:1 chat، group chats (لحد 500 عضو)، online/offline presence، delivery receipts (sent/delivered/read)، offline message delivery، والـ push notifications. الرسائل لازم تكون ordered وما تتفقدش.',
    en: 'Design a real-time chat system like WhatsApp. Required features: 1:1 chat, group chats (up to 500 members), online/offline presence, delivery receipts (sent/delivered/read), offline message delivery, and push notifications. Messages must be ordered and not lost.'
  },
  facts: [
    { label: { ar: 'اليوزرز النشطين', en: 'Daily Active Users' }, value: { ar: 'حوالي 500 مليون', en: '~500 million' } },
    { label: { ar: 'الرسائل في اليوم', en: 'Messages/day' }, value: { ar: 'حوالي 50 مليار', en: '~50 billion' } },
    { label: { ar: 'متوسط الرسائل/يوزر', en: 'Avg messages/user' }, value: { ar: 'حوالي 100', en: '~100' } },
    { label: { ar: 'أقصى حجم group', en: 'Max Group Size' }, value: { ar: '500 عضو', en: '500 members' } },
    { label: { ar: 'الـ latency target', en: 'Latency Target' }, value: { ar: 'أقل من 100ms', en: '< 100ms' } },
    { label: { ar: 'الـ availability', en: 'Availability' }, value: { ar: '99.99%', en: '99.99%' } },
    { label: { ar: 'الـ message retention', en: 'Message Retention' }, value: { ar: 'للأبد (أو حتى الحذف)', en: 'Forever (or until deleted)' } },
  ],
  stages: [
    {
      id: 'clarify',
      title: { ar: 'الأسئلة التوضيحية والحسبة', en: 'Clarifying Questions & Estimation' },
      shortTitle: { ar: 'الحسبة والأسئلة', en: 'Estimation' },
      prompt: {
        ar: 'قبل ما تصمم، اسأل الأسئلة التوضيحية اللي محتاجها، واعمل حسبة سريعة للأرقام: messages/sec، storage، concurrent connections.',
        en: 'Before designing, ask clarifying questions and do quick estimation: messages/sec, storage, concurrent connections.'
      },
      level: 'senior',
      items: [
        item(
          'سألت عن الـ scope: end-to-end encryption، media messages، typing indicators',
          'Asked about scope: end-to-end encryption, media messages, typing indicators',
          {
            why: 'الـ scope بيحدد الـ complexity. E2EE مثلا بيغير الـ architecture كلها.',
            how: 'اسأل: هل محتاجين encryption? Media support? Typing indicators? Read receipts?',
            tradeoffs: 'كل feature إضافية بتزود الـ complexity والـ latency.',
            examples: 'WhatsApp: E2EE لكل الرسائل. Slack: E2EE اختياري.',
            mistakes: 'خطأ شائع: تبدأ تصمم من غير ما تعرف الـ scope بالظبط.'
          },
          {
            why: 'Scope determines complexity. E2EE for example changes the entire architecture.',
            how: 'Ask: Do we need encryption? Media support? Typing indicators? Read receipts?',
            tradeoffs: 'Each additional feature adds complexity and latency.',
            examples: 'WhatsApp: E2EE for all messages. Slack: E2EE optional.',
            mistakes: 'Common mistake: Starting to design without knowing exact scope.'
          }
        ),
        item(
          'حسبت messages/sec: 50B/day = ~600K/sec',
          'Calculated messages/sec: 50B/day = ~600K/sec',
          {
            why: 'الـ throughput بيحدد عدد الـ servers والـ architecture.',
            how: '50 billion / 86400 seconds = 578K/sec. Peak = 2-3x = ~1.5M/sec.',
            tradeoffs: 'الـ peak مهم جدا، مش الـ average بس.',
            examples: 'WhatsApp: 100B messages/day = ~1.2M/sec average.',
            mistakes: 'خطأ شائع: تحسب الـ average بس وتنسى الـ peak.'
          },
          {
            why: 'Throughput determines number of servers and architecture.',
            how: '50 billion / 86400 seconds = 578K/sec. Peak = 2-3x = ~1.5M/sec.',
            tradeoffs: 'Peak is very important, not just average.',
            examples: 'WhatsApp: 100B messages/day = ~1.2M/sec average.',
            mistakes: 'Common mistake: Calculating only average, forgetting peak.'
          }
        ),
        item(
          'حسبت storage: 50B messages × 1KB avg = 50TB/day',
          'Calculated storage: 50B messages × 1KB avg = 50TB/day',
          {
            why: 'الـ storage بيحدد الـ database choice والـ retention policy.',
            how: '50B × 1KB = 50TB/day. سنة = 18PB. بس compression = ~6PB.',
            tradeoffs: 'الـ retention policy بتأثر كتير. Media أكبر بكتير.',
            examples: 'WhatsApp: messages stored حتى delivery. Media: 30 days.',
            mistakes: 'خطأ شائع: تنسى الـ media storage اللي أكبر بـ 10-100x.'
          },
          {
            why: 'Storage determines database choice and retention policy.',
            how: '50B × 1KB = 50TB/day. Year = 18PB. But with compression = ~6PB.',
            tradeoffs: 'Retention policy affects a lot. Media is much bigger.',
            examples: 'WhatsApp: messages stored until delivery. Media: 30 days.',
            mistakes: 'Common mistake: Forgetting media storage which is 10-100x larger.'
          }
        ),
        item(
          'حسبت concurrent connections: 500M DAU × 30% concurrent = 150M',
          'Calculated concurrent connections: 500M DAU × 30% concurrent = 150M',
          {
            why: 'WebSocket connections بتستهلك memory وfile descriptors.',
            how: '500M DAU × 30% online = 150M connections. كل connection ~10KB memory.',
            tradeoffs: 'أكتر connections = أكتر servers. بس أقل polling.',
            examples: '150M connections / 100K per server = 1500 connection servers.',
            mistakes: 'خطأ شائع: تقلل الـ concurrent percentage أوي.'
          },
          {
            why: 'WebSocket connections consume memory and file descriptors.',
            how: '500M DAU × 30% online = 150M connections. Each connection ~10KB memory.',
            tradeoffs: 'More connections = more servers. But less polling.',
            examples: '150M connections / 100K per server = 1500 connection servers.',
            mistakes: 'Common mistake: Underestimating concurrent percentage.'
          }
        ),
      ],
    },
    {
      id: 'architecture',
      title: { ar: 'الأركيتكتشر', en: 'Architecture' },
      shortTitle: { ar: 'الأركيتكتشر', en: 'Architecture' },
      prompt: {
        ar: 'صمم الـ high-level architecture: clients، WebSocket servers، message routing، storage، presence، notifications.',
        en: 'Design the high-level architecture: clients, WebSocket servers, message routing, storage, presence, notifications.'
      },
      level: 'senior',
      items: [
        item(
          '📊 الرسم التخطيطي للـ architecture',
          '📊 Architecture diagram',
          {
            why: 'الرسم بيوضح الـ flow والـ components بشكل visual.',
            how: 'ارسم الـ clients، WebSocket servers، routing، message queue، storage، presence service.',
            tradeoffs: 'الرسم المبسط أحسن من التفصيلي في المقابلة.',
            examples: 'Client → LB → WS Server → Router → Queue → Storage / Push.',
            mistakes: 'خطأ شائع: ترسم كل حاجة في رسم واحد معقد.'
          },
          {
            why: 'Diagram visualizes flow and components clearly.',
            how: 'Draw clients, WebSocket servers, routing, message queue, storage, presence service.',
            tradeoffs: 'Simple diagram is better than detailed one in interviews.',
            examples: 'Client → LB → WS Server → Router → Queue → Storage / Push.',
            mistakes: 'Common mistake: Drawing everything in one complex diagram.'
          }
        ),
        item(
          'WebSocket connection layer: persistent connections مع heartbeat',
          'WebSocket connection layer: persistent connections with heartbeat',
          {
            why: 'HTTP polling غير كفء. WebSocket بيدي real-time delivery.',
            how: 'Client يفتح WebSocket connection. Heartbeat كل 30 seconds.',
            tradeoffs: 'WebSocket: real-time بس stateful. HTTP: simpler بس latency.',
            examples: 'WhatsApp, Slack, Discord كلهم بيستخدموا WebSocket.',
            mistakes: 'خطأ شائع: HTTP polling، الـ latency عالية والـ load كبير.'
          },
          {
            why: 'HTTP polling is inefficient. WebSocket provides real-time delivery.',
            how: 'Client opens WebSocket connection. Heartbeat every 30 seconds.',
            tradeoffs: 'WebSocket: real-time but stateful. HTTP: simpler but latency.',
            examples: 'WhatsApp, Slack, Discord all use WebSocket.',
            mistakes: 'Common mistake: HTTP polling, high latency and big load.'
          }
        ),
        item(
          'Message routing: معرفة أي connection server الـ recipient عليه',
          'Message routing: knowing which connection server the recipient is on',
          {
            why: 'الـ sender والـ recipient على servers مختلفة. لازم routing.',
            how: 'User-to-server mapping في Redis. Message router يبحث ويرسل.',
            tradeoffs: 'Central router: simple بس bottleneck. Distributed: complex بس scalable.',
            examples: 'Redis cluster للـ mapping. Consistent hashing للـ distribution.',
            mistakes: 'خطأ شائع: central single router، point of failure.'
          },
          {
            why: 'Sender and recipient are on different servers. Need routing.',
            how: 'User-to-server mapping in Redis. Message router looks up and sends.',
            tradeoffs: 'Central router: simple but bottleneck. Distributed: complex but scalable.',
            examples: 'Redis cluster for mapping. Consistent hashing for distribution.',
            mistakes: 'Common mistake: Central single router, point of failure.'
          }
        ),
        item(
          'Message queue للـ async delivery والـ persistence',
          'Message queue for async delivery and persistence',
          {
            why: 'لو الـ recipient offline، الرسالة لازم تتخزن وتتبعت لما يرجع.',
            how: 'Kafka per-user topic أو per-conversation. Consumer = device connection.',
            tradeoffs: 'Per-user: simpler routing. Per-conversation: better for groups.',
            examples: 'Kafka مع millions of partitions. أو Cassandra-based message store.',
            mistakes: 'خطأ شائع: single queue لكل الرسائل، bottleneck.'
          },
          {
            why: 'If recipient is offline, message must be stored and sent when they return.',
            how: 'Kafka per-user topic or per-conversation. Consumer = device connection.',
            tradeoffs: 'Per-user: simpler routing. Per-conversation: better for groups.',
            examples: 'Kafka with millions of partitions. Or Cassandra-based message store.',
            mistakes: 'Common mistake: Single queue for all messages, bottleneck.'
          }
        ),
        item(
          'Group fan-out: write-time vs read-time fan-out',
          'Group fan-out: write-time vs read-time fan-out',
          {
            why: 'Group message محتاج يوصل لـ 500 member. إزاي?',
            how: 'Write-time: copy الرسالة لكل inbox (500 writes). Read-time: single write، كل member يقرا.',
            tradeoffs: 'Write-time: سريع للقراءة بس كتابة كتير. Read-time: كتابة أقل بس قراءة أبطأ.',
            examples: 'Small groups (< 100): write-time. Large groups: read-time أو hybrid.',
            mistakes: 'خطأ شائع: write-time fan-out لـ groups كبيرة، الـ write amplification ضخم.'
          },
          {
            why: 'Group message needs to reach 500 members. How?',
            how: 'Write-time: copy message to each inbox (500 writes). Read-time: single write, each member reads.',
            tradeoffs: 'Write-time: fast reads but many writes. Read-time: fewer writes but slower reads.',
            examples: 'Small groups (< 100): write-time. Large groups: read-time or hybrid.',
            mistakes: 'Common mistake: Write-time fan-out for large groups, write amplification is huge.'
          }
        ),
        item(
          'Delivery receipts: sent، delivered، read flow',
          'Delivery receipts: sent, delivered, read flow',
          {
            why: 'Users expect to know if message was delivered and read.',
            how: 'Sent: server acks. Delivered: device acks. Read: user opens conversation.',
            tradeoffs: 'Each receipt = additional message. Batching helps.',
            examples: 'WhatsApp: single tick (sent)، double tick (delivered)، blue ticks (read).',
            mistakes: 'خطأ شائع: receipts synchronous، بيبطّئ الـ sending.'
          },
          {
            why: 'Users expect to know if message was delivered and read.',
            how: 'Sent: server acks. Delivered: device acks. Read: user opens conversation.',
            tradeoffs: 'Each receipt = additional message. Batching helps.',
            examples: 'WhatsApp: single tick (sent), double tick (delivered), blue ticks (read).',
            mistakes: 'Common mistake: Synchronous receipts slow down sending.'
          }
        ),
        item(
          'Online/offline presence: heartbeat mechanism مع Redis',
          'Online/offline presence: heartbeat mechanism with Redis',
          {
            why: 'Users want to see who is online.',
            how: 'Heartbeat كل 30 sec يحدث TTL في Redis. No heartbeat = offline.',
            tradeoffs: 'Shorter heartbeat: more accurate بس more load. Longer: less accurate.',
            examples: 'Redis SETEX with 60 sec TTL. Heartbeat كل 30 sec.',
            mistakes: 'خطأ شائع: polling للـ presence، load عالي جدا.'
          },
          {
            why: 'Users want to see who is online.',
            how: 'Heartbeat every 30 sec updates TTL in Redis. No heartbeat = offline.',
            tradeoffs: 'Shorter heartbeat: more accurate but more load. Longer: less accurate.',
            examples: 'Redis SETEX with 60 sec TTL. Heartbeat every 30 sec.',
            mistakes: 'Common mistake: Polling for presence, very high load.'
          }
        ),
        item(
          'Push notifications للـ offline users',
          'Push notifications for offline users',
          {
            why: 'لو الـ user offline، لازم notification يوصله.',
            how: 'If user offline → push to FCM/APNs. Store device tokens.',
            tradeoffs: 'Push has latency (100ms-seconds). Not real-time.',
            examples: 'FCM for Android, APNs for iOS. Rate limiting مهم.',
            mistakes: 'خطأ شائع: push لكل message، الـ user بيتضايق من الـ spam.'
          },
          {
            why: 'If user is offline, notification must reach them.',
            how: 'If user offline → push to FCM/APNs. Store device tokens.',
            tradeoffs: 'Push has latency (100ms-seconds). Not real-time.',
            examples: 'FCM for Android, APNs for iOS. Rate limiting is important.',
            mistakes: 'Common mistake: Push for every message, user annoyed by spam.'
          }
        ),
      ],
    },
    {
      id: 'scaling',
      title: { ar: 'الـ Scaling', en: 'Scaling' },
      shortTitle: { ar: 'Scaling', en: 'Scaling' },
      prompt: {
        ar: 'إزاي تـ scale النظام لـ 500M users و150M concurrent connections؟',
        en: 'How do you scale the system for 500M users and 150M concurrent connections?'
      },
      level: 'senior',
      items: [
        item(
          'WebSocket server scaling: horizontal مع sticky sessions',
          'WebSocket server scaling: horizontal with sticky sessions',
          {
            why: 'Connection واحد = server واحد. محتاج sticky.',
            how: 'Load balancer يوجه user لنفس الـ server (IP hash أو cookie).',
            tradeoffs: 'Sticky: simpler reconnect بس uneven load ممكن.',
            examples: 'HAProxy مع IP hash. أو application-level routing.',
            mistakes: 'خطأ شائع: round-robin بدون sticky، الـ user بيفقد connection.'
          },
          {
            why: 'One connection = one server. Need sticky.',
            how: 'Load balancer routes user to same server (IP hash or cookie).',
            tradeoffs: 'Sticky: simpler reconnect but possible uneven load.',
            examples: 'HAProxy with IP hash. Or application-level routing.',
            mistakes: 'Common mistake: Round-robin without sticky, user loses connection.'
          }
        ),
        item(
          'Message storage sharding: by user_id أو conversation_id',
          'Message storage sharding: by user_id or conversation_id',
          {
            why: '50TB/day لا يمكن يتخزن في single database.',
            how: 'Shard by conversation_id. All messages للـ conversation في نفس الـ shard.',
            tradeoffs: 'By user: سهل للـ inbox. By conversation: سهل للـ chat history.',
            examples: 'Cassandra مع partition key = conversation_id.',
            mistakes: 'خطأ شائع: shard by message_id، الـ conversation queries بطيئة.'
          },
          {
            why: '50TB/day cannot be stored in single database.',
            how: 'Shard by conversation_id. All messages for conversation in same shard.',
            tradeoffs: 'By user: easy for inbox. By conversation: easy for chat history.',
            examples: 'Cassandra with partition key = conversation_id.',
            mistakes: 'Common mistake: Shard by message_id, conversation queries slow.'
          }
        ),
        item(
          'Presence service scaling: Redis cluster مع sharding by user_id',
          'Presence service scaling: Redis cluster with sharding by user_id',
          {
            why: 'Single Redis لا يستحمل 500M users.',
            how: 'Redis cluster مع sharding by user_id. Each shard handles subset.',
            tradeoffs: 'More shards = more complexity بس better performance.',
            examples: 'Redis cluster مع 100 shards. 5M users per shard.',
            mistakes: 'خطأ شائع: single Redis instance، memory overflow.'
          },
          {
            why: 'Single Redis cannot handle 500M users.',
            how: 'Redis cluster with sharding by user_id. Each shard handles subset.',
            tradeoffs: 'More shards = more complexity but better performance.',
            examples: 'Redis cluster with 100 shards. 5M users per shard.',
            mistakes: 'Common mistake: Single Redis instance, memory overflow.'
          }
        ),
        item(
          'Group membership caching: local cache مع invalidation',
          'Group membership caching: local cache with invalidation',
          {
            why: 'كل message في group محتاج list الـ members. DB query كل مرة بطيء.',
            how: 'Cache group members locally. Invalidate عند member join/leave.',
            tradeoffs: 'Stale cache ممكن يوصل message لـ ex-member لثواني.',
            examples: 'Local Caffeine cache مع 60 sec TTL. Pub/sub للـ invalidation.',
            mistakes: 'خطأ شائع: no cache، DB overload مع كل message.'
          },
          {
            why: 'Every message in group needs member list. DB query each time is slow.',
            how: 'Cache group members locally. Invalidate on member join/leave.',
            tradeoffs: 'Stale cache might send message to ex-member for seconds.',
            examples: 'Local Caffeine cache with 60 sec TTL. Pub/sub for invalidation.',
            mistakes: 'Common mistake: No cache, DB overload with every message.'
          }
        ),
      ],
    },
    {
      id: 'monitoring',
      title: { ar: 'الـ Monitoring', en: 'Monitoring' },
      shortTitle: { ar: 'Monitoring', en: 'Monitoring' },
      prompt: {
        ar: 'إيه الـ metrics اللي هتراقبها؟ وإزاي تعرف إن في مشكلة؟',
        en: 'What metrics would you monitor? How do you know when there is a problem?'
      },
      level: 'senior',
      items: [
        item(
          'End-to-end message latency: sent → delivered',
          'End-to-end message latency: sent → delivered',
          {
            why: 'Users feel slow chat. E2E latency أهم من server latency.',
            how: 'Timestamp at send، timestamp at delivery. p50، p99، p999.',
            tradeoffs: 'الـ clock drift بين devices ممكن يأثر.',
            examples: 'Target: p99 < 300ms for online recipients.',
            mistakes: 'خطأ شائع: تقيس server latency بس، الـ network latency مختفي.'
          },
          {
            why: 'Users feel slow chat. E2E latency more important than server latency.',
            how: 'Timestamp at send, timestamp at delivery. p50, p99, p999.',
            tradeoffs: 'Clock drift between devices might affect.',
            examples: 'Target: p99 < 300ms for online recipients.',
            mistakes: 'Common mistake: Measuring only server latency, network latency hidden.'
          }
        ),
        item(
          'WebSocket connection count وreconnection rate',
          'WebSocket connection count and reconnection rate',
          {
            why: 'High reconnection rate = network issues أو server problems.',
            how: 'Count active connections. Track reconnects per minute.',
            tradeoffs: 'Mobile: higher reconnection normal. Desktop: should be stable.',
            examples: 'Alert: reconnection rate > 5% per minute.',
            mistakes: 'خطأ شائع: متابعش الـ reconnections، الـ users بيعانوا.'
          },
          {
            why: 'High reconnection rate = network issues or server problems.',
            how: 'Count active connections. Track reconnects per minute.',
            tradeoffs: 'Mobile: higher reconnection normal. Desktop: should be stable.',
            examples: 'Alert: reconnection rate > 5% per minute.',
            mistakes: 'Common mistake: Not tracking reconnections, users suffer.'
          }
        ),
        item(
          'Message queue depth وprocessing lag',
          'Message queue depth and processing lag',
          {
            why: 'لو الـ queue بتتراكم، messages بتتأخر.',
            how: 'Kafka consumer lag metric. Alert لما lag > 10 seconds.',
            tradeoffs: 'Some lag acceptable during spikes. Sustained lag = problem.',
            examples: 'Kafka lag monitoring. Burrow أو built-in metrics.',
            mistakes: 'خطأ شائع: متابعش الـ lag، الرسائل بتتأخر من غير ما تعرف.'
          },
          {
            why: 'If queue is backing up, messages are delayed.',
            how: 'Kafka consumer lag metric. Alert when lag > 10 seconds.',
            tradeoffs: 'Some lag acceptable during spikes. Sustained lag = problem.',
            examples: 'Kafka lag monitoring. Burrow or built-in metrics.',
            mistakes: 'Common mistake: Not tracking lag, messages delayed without knowing.'
          }
        ),
        item(
          'Delivery success rate: messages delivered vs sent',
          'Delivery success rate: messages delivered vs sent',
          {
            why: 'لو messages مش بتوصل، الـ users هيشتكوا.',
            how: 'sent_count vs delivered_count. Success rate = delivered / sent.',
            tradeoffs: 'Offline users affect rate. Track online vs offline separately.',
            examples: 'Target: 99.9% delivery for online users. 100% eventual delivery.',
            mistakes: 'خطأ شائع: تعتبر undelivered (offline) كـ failure.'
          },
          {
            why: 'If messages not delivered, users will complain.',
            how: 'sent_count vs delivered_count. Success rate = delivered / sent.',
            tradeoffs: 'Offline users affect rate. Track online vs offline separately.',
            examples: 'Target: 99.9% delivery for online users. 100% eventual delivery.',
            mistakes: 'Common mistake: Treating undelivered (offline) as failure.'
          }
        ),
      ],
    },
    {
      id: 'bottlenecks',
      title: { ar: 'الاختناقات', en: 'Bottlenecks' },
      shortTitle: { ar: 'الاختناقات', en: 'Bottlenecks' },
      prompt: {
        ar: 'إيه الأماكن اللي متوقع تبقى عنق زجاجة، وإزاي تحلها؟',
        en: 'What are the expected bottlenecks and how do you solve them?'
      },
      level: 'senior',
      items: [
        item(
          'WebSocket connection limit per server: kernel tuning وC10M problem',
          'WebSocket connection limit per server: kernel tuning and C10M problem',
          {
            why: 'Default Linux limits: ~65K connections. محتاج tuning.',
            how: 'Increase file descriptors، ephemeral ports، memory. Event-driven server (epoll).',
            tradeoffs: 'High connections = high memory. بس أقل servers.',
            examples: 'Single server: 100K-500K connections مع tuning.',
            mistakes: 'خطأ شائع: default settings، الـ server بيرفض connections.'
          },
          {
            why: 'Default Linux limits: ~65K connections. Need tuning.',
            how: 'Increase file descriptors, ephemeral ports, memory. Event-driven server (epoll).',
            tradeoffs: 'High connections = high memory. But fewer servers.',
            examples: 'Single server: 100K-500K connections with tuning.',
            mistakes: 'Common mistake: Default settings, server rejects connections.'
          }
        ),
        item(
          'Group fan-out for large groups: batching وrate limiting',
          'Group fan-out for large groups: batching and rate limiting',
          {
            why: 'Group مع 500 member، كل message = 500 delivery.',
            how: 'Batch fan-out. Rate limit messages per group. Use read-time fan-out.',
            tradeoffs: 'Batching adds latency. بس يقلل الـ load.',
            examples: '500 member group: batch 50 deliveries at a time.',
            mistakes: 'خطأ شائع: immediate fan-out لكل message، thundering herd.'
          },
          {
            why: 'Group with 500 members, each message = 500 deliveries.',
            how: 'Batch fan-out. Rate limit messages per group. Use read-time fan-out.',
            tradeoffs: 'Batching adds latency. But reduces load.',
            examples: '500 member group: batch 50 deliveries at a time.',
            mistakes: 'Common mistake: Immediate fan-out for each message, thundering herd.'
          }
        ),
        item(
          'Presence updates storm: pub/sub batching',
          'Presence updates storm: pub/sub batching',
          {
            why: 'لو user عنده 500 contact، كل presence change = 500 notifications.',
            how: 'Batch presence updates. Send every 5 seconds instead of immediately.',
            tradeoffs: 'Stale presence for few seconds. بس acceptable.',
            examples: 'User comes online → wait 5 sec → batch notify all contacts.',
            mistakes: 'خطأ شائع: immediate presence broadcast، massive load spike.'
          },
          {
            why: 'If user has 500 contacts, each presence change = 500 notifications.',
            how: 'Batch presence updates. Send every 5 seconds instead of immediately.',
            tradeoffs: 'Stale presence for few seconds. But acceptable.',
            examples: 'User comes online → wait 5 sec → batch notify all contacts.',
            mistakes: 'Common mistake: Immediate presence broadcast, massive load spike.'
          }
        ),
        item(
          'Message ordering: per-conversation sequence numbers',
          'Message ordering: per-conversation sequence numbers',
          {
            why: 'Messages لازم تظهر بالترتيب. Network delays ممكن تعكس.',
            how: 'Server assigns sequence number per conversation. Client reorders.',
            tradeoffs: 'Waiting for missing sequence adds latency.',
            examples: 'Conversation sequence: 1، 2، 3... Client reorders if 3 arrives before 2.',
            mistakes: 'خطأ شائع: timestamp-based ordering، clock drift بيخرب الترتيب.'
          },
          {
            why: 'Messages must appear in order. Network delays can reverse.',
            how: 'Server assigns sequence number per conversation. Client reorders.',
            tradeoffs: 'Waiting for missing sequence adds latency.',
            examples: 'Conversation sequence: 1, 2, 3... Client reorders if 3 arrives before 2.',
            mistakes: 'Common mistake: Timestamp-based ordering, clock drift breaks order.'
          }
        ),
      ],
    },
    {
      id: 'tradeoffs',
      title: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
      shortTitle: { ar: 'Trade-offs', en: 'Trade-offs' },
      prompt: {
        ar: 'إيه الـ trade-offs الرئيسية اللي عملتها وليه؟',
        en: 'What are the main trade-offs you made and why?'
      },
      level: 'senior',
      items: [
        item(
          'Consistency vs Availability: eventual consistency للـ messages',
          'Consistency vs Availability: eventual consistency for messages',
          {
            why: 'Chat يتحمل eventual consistency. الـ user يستنى ثواني.',
            how: 'Async replication. Message might not appear immediately in all views.',
            tradeoffs: 'Strong consistency: slower، higher latency. Eventual: faster.',
            examples: 'WhatsApp: eventual. Message sent، might take seconds to appear everywhere.',
            mistakes: 'خطأ شائع: strong consistency لكل حاجة، الـ latency عالية.'
          },
          {
            why: 'Chat tolerates eventual consistency. User waits seconds.',
            how: 'Async replication. Message might not appear immediately in all views.',
            tradeoffs: 'Strong consistency: slower, higher latency. Eventual: faster.',
            examples: 'WhatsApp: eventual. Message sent, might take seconds to appear everywhere.',
            mistakes: 'Common mistake: Strong consistency for everything, high latency.'
          }
        ),
        item(
          'Storage cost vs Query speed: denormalization',
          'Storage cost vs Query speed: denormalization',
          {
            why: 'Normalized data = complex joins. Denormalized = fast reads.',
            how: 'Store message in both sender and recipient inbox. Duplicate data.',
            tradeoffs: 'More storage (2x+) بس faster reads.',
            examples: 'Message stored in sender outbox + recipient inbox.',
            mistakes: 'خطأ شائع: normalized schema، slow queries، high latency.'
          },
          {
            why: 'Normalized data = complex joins. Denormalized = fast reads.',
            how: 'Store message in both sender and recipient inbox. Duplicate data.',
            tradeoffs: 'More storage (2x+) but faster reads.',
            examples: 'Message stored in sender outbox + recipient inbox.',
            mistakes: 'Common mistake: Normalized schema, slow queries, high latency.'
          }
        ),
        item(
          'Real-time vs Push: WebSocket + fallback to push',
          'Real-time vs Push: WebSocket + fallback to push',
          {
            why: 'WebSocket is real-time بس battery-intensive on mobile.',
            how: 'WebSocket when app open. Push when app closed/background.',
            tradeoffs: 'Push: 100ms-seconds latency. WebSocket: immediate.',
            examples: 'WhatsApp: WebSocket foreground، push background.',
            mistakes: 'خطأ شائع: WebSocket-only، الـ battery بتفضى.'
          },
          {
            why: 'WebSocket is real-time but battery-intensive on mobile.',
            how: 'WebSocket when app open. Push when app closed/background.',
            tradeoffs: 'Push: 100ms-seconds latency. WebSocket: immediate.',
            examples: 'WhatsApp: WebSocket foreground, push background.',
            mistakes: 'Common mistake: WebSocket-only, battery drains.'
          }
        ),
      ],
    },
    {
      id: 'followup-1',
      title: { ar: 'سؤال متابعة: Message search', en: 'Follow-up: Message search' },
      shortTitle: { ar: 'سؤال 1', en: 'Follow-up 1' },
      prompt: {
        ar: 'إزاي تضيف message search للنظام؟',
        en: 'How would you add message search to the system?'
      },
      level: 'senior',
      items: [
        item(
          'Elasticsearch للـ full-text search',
          'Elasticsearch for full-text search',
          {
            why: 'DB LIKE queries بطيئة جدا لـ text search.',
            how: 'Index messages في Elasticsearch. Query بيرجع message IDs.',
            tradeoffs: 'Additional infrastructure بس fast search.',
            examples: 'ES index per user. Search within own messages only.',
            mistakes: 'خطأ شائع: search في الـ main DB، slow و resource-intensive.'
          },
          {
            why: 'DB LIKE queries very slow for text search.',
            how: 'Index messages in Elasticsearch. Query returns message IDs.',
            tradeoffs: 'Additional infrastructure but fast search.',
            examples: 'ES index per user. Search within own messages only.',
            mistakes: 'Common mistake: Search in main DB, slow and resource-intensive.'
          }
        ),
        item(
          'Search index partitioning: per-user أو per-conversation',
          'Search index partitioning: per-user or per-conversation',
          {
            why: '50B messages مش هتتحط في index واحد.',
            how: 'Partition by user_id. User searches their own messages only.',
            tradeoffs: 'Per-user: simple. Cross-user search needs aggregation.',
            examples: 'ES index: messages_user_123. Each user has own index.',
            mistakes: 'خطأ شائع: global search index، huge و slow.'
          },
          {
            why: '50B messages cannot fit in one index.',
            how: 'Partition by user_id. User searches their own messages only.',
            tradeoffs: 'Per-user: simple. Cross-user search needs aggregation.',
            examples: 'ES index: messages_user_123. Each user has own index.',
            mistakes: 'Common mistake: Global search index, huge and slow.'
          }
        ),
        item(
          'Async indexing: eventual consistency للـ search',
          'Async indexing: eventual consistency for search',
          {
            why: 'Sync indexing يبطّئ message delivery.',
            how: 'Message sent → async job → index في ES. Lag = seconds.',
            tradeoffs: 'New message might not be searchable immediately.',
            examples: 'Kafka consumer يقرا messages ويـ index في ES.',
            mistakes: 'خطأ شائع: sync indexing في الـ critical path، high latency.'
          },
          {
            why: 'Sync indexing slows message delivery.',
            how: 'Message sent → async job → index in ES. Lag = seconds.',
            tradeoffs: 'New message might not be searchable immediately.',
            examples: 'Kafka consumer reads messages and indexes in ES.',
            mistakes: 'Common mistake: Sync indexing in critical path, high latency.'
          }
        ),
      ],
    },
    {
      id: 'followup-2',
      title: { ar: 'سؤال متابعة: Typing indicators', en: 'Follow-up: Typing indicators' },
      shortTitle: { ar: 'سؤال 2', en: 'Follow-up 2' },
      prompt: {
        ar: 'إزاي تضيف typing indicators (الـ "typing..." status)؟',
        en: 'How would you add typing indicators (the "typing..." status)?'
      },
      level: 'senior',
      items: [
        item(
          'Ephemeral messages: لا تتخزن، direct routing',
          'Ephemeral messages: not stored, direct routing',
          {
            why: 'Typing events مش محتاج persistence. Fire and forget.',
            how: 'Direct WebSocket message. No DB write. No queue.',
            tradeoffs: 'Might be lost if network issue. بس acceptable.',
            examples: 'User types → server broadcasts → recipients see "typing..."',
            mistakes: 'خطأ شائع: تخزن typing events، unnecessary storage.'
          },
          {
            why: 'Typing events do not need persistence. Fire and forget.',
            how: 'Direct WebSocket message. No DB write. No queue.',
            tradeoffs: 'Might be lost if network issue. But acceptable.',
            examples: 'User types → server broadcasts → recipients see "typing..."',
            mistakes: 'Common mistake: Storing typing events, unnecessary storage.'
          }
        ),
        item(
          'Throttling: send typing event max every 2-3 seconds',
          'Throttling: send typing event max every 2-3 seconds',
          {
            why: 'كل keystroke = typing event? Too much traffic.',
            how: 'Client throttles. Send typing start، then nothing for 3 sec.',
            tradeoffs: 'Less real-time بس much less traffic.',
            examples: 'User types → send "typing"، wait 3 sec، send again if still typing.',
            mistakes: 'خطأ شائع: typing event لكل keystroke، massive traffic.'
          },
          {
            why: 'Every keystroke = typing event? Too much traffic.',
            how: 'Client throttles. Send typing start, then nothing for 3 sec.',
            tradeoffs: 'Less real-time but much less traffic.',
            examples: 'User types → send "typing", wait 3 sec, send again if still typing.',
            mistakes: 'Common mistake: Typing event for every keystroke, massive traffic.'
          }
        ),
        item(
          'Timeout: auto-clear typing indicator بعد 5 seconds',
          'Timeout: auto-clear typing indicator after 5 seconds',
          {
            why: 'لو الـ user بطّل يكتب، الـ "typing..." لازم يختفي.',
            how: 'Client sets 5 sec timeout. No new typing event = clear indicator.',
            tradeoffs: 'Simple implementation. No explicit "stopped typing" message needed.',
            examples: 'Show "typing..."، start 5 sec timer، hide if no new event.',
            mistakes: 'خطأ شائع: waiting for explicit "stopped" event، indicator stays forever.'
          },
          {
            why: 'If user stopped typing, "typing..." must disappear.',
            how: 'Client sets 5 sec timeout. No new typing event = clear indicator.',
            tradeoffs: 'Simple implementation. No explicit "stopped typing" message needed.',
            examples: 'Show "typing...", start 5 sec timer, hide if no new event.',
            mistakes: 'Common mistake: Waiting for explicit "stopped" event, indicator stays forever.'
          }
        ),
      ],
    },
    {
      id: 'followup-3',
      title: { ar: 'سؤال متابعة: Message encryption', en: 'Follow-up: Message encryption' },
      shortTitle: { ar: 'سؤال 3', en: 'Follow-up 3' },
      prompt: {
        ar: 'إزاي تضيف end-to-end encryption؟',
        en: 'How would you add end-to-end encryption?'
      },
      level: 'senior',
      items: [
        item(
          'Signal Protocol: Double Ratchet for forward secrecy',
          'Signal Protocol: Double Ratchet for forward secrecy',
          {
            why: 'Standard E2EE protocol. Used by WhatsApp، Signal، etc.',
            how: 'Each user has identity key pair. Session keys for each conversation.',
            tradeoffs: 'Complex key management. بس proven secure.',
            examples: 'WhatsApp uses Signal Protocol. Open source implementation available.',
            mistakes: 'خطأ شائع: invent own encryption protocol، security vulnerabilities.'
          },
          {
            why: 'Standard E2EE protocol. Used by WhatsApp, Signal, etc.',
            how: 'Each user has identity key pair. Session keys for each conversation.',
            tradeoffs: 'Complex key management. But proven secure.',
            examples: 'WhatsApp uses Signal Protocol. Open source implementation available.',
            mistakes: 'Common mistake: Inventing own encryption protocol, security vulnerabilities.'
          }
        ),
        item(
          'Key distribution: server as message relay، not key holder',
          'Key distribution: server as message relay, not key holder',
          {
            why: 'Server should not be able to decrypt messages.',
            how: 'Public keys exchanged via server. Server never sees private keys.',
            tradeoffs: 'Server cannot do content moderation. Trust device security.',
            examples: 'User A requests User B public key → server returns → A encrypts.',
            mistakes: 'خطأ شائع: server holds keys، E2EE is broken.'
          },
          {
            why: 'Server should not be able to decrypt messages.',
            how: 'Public keys exchanged via server. Server never sees private keys.',
            tradeoffs: 'Server cannot do content moderation. Trust device security.',
            examples: 'User A requests User B public key → server returns → A encrypts.',
            mistakes: 'Common mistake: Server holds keys, E2EE is broken.'
          }
        ),
        item(
          'Group E2EE: sender encrypts for each member',
          'Group E2EE: sender encrypts for each member',
          {
            why: 'Group message محتاج يتشفر لكل recipient.',
            how: 'Sender encrypts message with each member public key. Or use group session key.',
            tradeoffs: 'Per-member: more computation. Group key: key rotation complexity.',
            examples: 'WhatsApp: Sender Keys protocol for groups. Single encrypt، all decrypt.',
            mistakes: 'خطأ شائع: single group key بدون rotation، key compromise affects all history.'
          },
          {
            why: 'Group message needs to be encrypted for each recipient.',
            how: 'Sender encrypts message with each member public key. Or use group session key.',
            tradeoffs: 'Per-member: more computation. Group key: key rotation complexity.',
            examples: 'WhatsApp: Sender Keys protocol for groups. Single encrypt, all decrypt.',
            mistakes: 'Common mistake: Single group key without rotation, key compromise affects all history.'
          }
        ),
      ],
    },
    {
      id: 'cost',
      title: { ar: 'تقدير التكلفة', en: 'Cost Estimation' },
      shortTitle: { ar: 'التكلفة', en: 'Cost' },
      prompt: {
        ar: 'قدّر التكلفة الشهرية للبنية التحتية.',
        en: 'Estimate the monthly infrastructure cost.'
      },
      level: 'staff',
      items: [
        item(
          'WebSocket servers: 1500 servers × $500/month = $750K/month',
          'WebSocket servers: 1500 servers × $500/month = $750K/month',
          {
            why: '150M connections / 100K per server = 1500 servers.',
            how: 'c5.4xlarge ($500/month) مع 100K connections each.',
            tradeoffs: 'Reserved instances: 40% cheaper. Spot: risky for stateful.',
            examples: 'AWS: 1500 × c5.4xlarge reserved = ~$450K/month.',
            mistakes: 'خطأ شائع: on-demand pricing، الـ cost ضعف.'
          },
          {
            why: '150M connections / 100K per server = 1500 servers.',
            how: 'c5.4xlarge ($500/month) with 100K connections each.',
            tradeoffs: 'Reserved instances: 40% cheaper. Spot: risky for stateful.',
            examples: 'AWS: 1500 × c5.4xlarge reserved = ~$450K/month.',
            mistakes: 'Common mistake: On-demand pricing, cost doubles.'
          }
        ),
        item(
          'Storage: 50TB/day × 30 days = 1.5PB = ~$35K/month',
          'Storage: 50TB/day × 30 days = 1.5PB = ~$35K/month',
          {
            why: 'Messages stored for 30 days average.',
            how: 'S3 Standard: $23/TB/month. 1500TB × $23 = $35K.',
            tradeoffs: 'Tiering to Glacier: 80% cheaper for old messages.',
            examples: 'Hot (7 days): S3. Warm (30 days): S3-IA. Cold: Glacier.',
            mistakes: 'خطأ شائع: all data في hot storage، unnecessary cost.'
          },
          {
            why: 'Messages stored for 30 days average.',
            how: 'S3 Standard: $23/TB/month. 1500TB × $23 = $35K.',
            tradeoffs: 'Tiering to Glacier: 80% cheaper for old messages.',
            examples: 'Hot (7 days): S3. Warm (30 days): S3-IA. Cold: Glacier.',
            mistakes: 'Common mistake: All data in hot storage, unnecessary cost.'
          }
        ),
        item(
          'Bandwidth: 50B messages × 1KB × 2 (send+receive) = 100TB/day = ~$900K/month',
          'Bandwidth: 50B messages × 1KB × 2 (send+receive) = 100TB/day = ~$900K/month',
          {
            why: 'Egress bandwidth is expensive. $0.09/GB.',
            how: '100TB/day × 30 days × $0.09 = $270K. With CDN: ~$900K.',
            tradeoffs: 'CloudFront/CDN: cheaper egress. Direct: simpler.',
            examples: 'AWS egress after CDN: ~$0.085/GB. Still major cost.',
            mistakes: 'خطأ شائع: underestimate bandwidth cost، biggest surprise.'
          },
          {
            why: 'Egress bandwidth is expensive. $0.09/GB.',
            how: '100TB/day × 30 days × $0.09 = $270K. With CDN: ~$900K.',
            tradeoffs: 'CloudFront/CDN: cheaper egress. Direct: simpler.',
            examples: 'AWS egress after CDN: ~$0.085/GB. Still major cost.',
            mistakes: 'Common mistake: Underestimate bandwidth cost, biggest surprise.'
          }
        ),
      ],
    },
    {
      id: 'security',
      title: { ar: 'الأمان والـ Abuse', en: 'Security & Abuse' },
      shortTitle: { ar: 'الأمان', en: 'Security' },
      prompt: {
        ar: 'إيه الـ security concerns والـ abuse vectors؟',
        en: 'What are the security concerns and abuse vectors?'
      },
      level: 'staff',
      items: [
        item(
          'Spam prevention: rate limiting وreported account handling',
          'Spam prevention: rate limiting and reported account handling',
          {
            why: 'Spammers سيستهدفوا الـ chat platform.',
            how: 'Rate limit messages per user. ML-based spam detection. Report system.',
            tradeoffs: 'Aggressive limits: false positives. Lenient: spam gets through.',
            examples: 'Limit: 100 messages/min. Flag accounts با 10+ reports.',
            mistakes: 'خطأ شائع: no rate limits، spammers تغرق النظام.'
          },
          {
            why: 'Spammers will target the chat platform.',
            how: 'Rate limit messages per user. ML-based spam detection. Report system.',
            tradeoffs: 'Aggressive limits: false positives. Lenient: spam gets through.',
            examples: 'Limit: 100 messages/min. Flag accounts with 10+ reports.',
            mistakes: 'Common mistake: No rate limits, spammers flood the system.'
          }
        ),
        item(
          'Account takeover protection: 2FA، session management، suspicious activity detection',
          'Account takeover protection: 2FA, session management, suspicious activity detection',
          {
            why: 'Account compromise = access to all messages.',
            how: '2FA mandatory. Single session or multi-device management. Alert on new device.',
            tradeoffs: 'More friction for users. بس better security.',
            examples: 'WhatsApp: Web sessions require phone scan. Alert on new login.',
            mistakes: 'خطأ شائع: weak session management، easy account takeover.'
          },
          {
            why: 'Account compromise = access to all messages.',
            how: '2FA mandatory. Single session or multi-device management. Alert on new device.',
            tradeoffs: 'More friction for users. But better security.',
            examples: 'WhatsApp: Web sessions require phone scan. Alert on new login.',
            mistakes: 'Common mistake: Weak session management, easy account takeover.'
          }
        ),
        item(
          'Content moderation without breaking E2EE',
          'Content moderation without breaking E2EE',
          {
            why: 'Legal requirements vs user privacy.',
            how: 'Report-based moderation. Client-side scanning (controversial). Metadata analysis.',
            tradeoffs: 'Full E2EE: cannot moderate. Partial: privacy concerns.',
            examples: 'WhatsApp: reported messages decrypted by recipient، forwarded to moderators.',
            mistakes: 'خطأ شائع: break E2EE for moderation، lose user trust.'
          },
          {
            why: 'Legal requirements vs user privacy.',
            how: 'Report-based moderation. Client-side scanning (controversial). Metadata analysis.',
            tradeoffs: 'Full E2EE: cannot moderate. Partial: privacy concerns.',
            examples: 'WhatsApp: reported messages decrypted by recipient, forwarded to moderators.',
            mistakes: 'Common mistake: Break E2EE for moderation, lose user trust.'
          }
        ),
      ],
    },
    {
      id: 'dr',
      title: { ar: 'الـ Disaster Recovery', en: 'Disaster Recovery' },
      shortTitle: { ar: 'DR', en: 'DR' },
      prompt: {
        ar: 'إيه الـ DR strategy؟ وإيه الـ RPO/RTO؟',
        en: 'What is the DR strategy? What are RPO/RTO?'
      },
      level: 'staff',
      items: [
        item(
          'RPO: near-zero لـ messages (async replication)، RTO: < 5 minutes',
          'RPO: near-zero for messages (async replication), RTO: < 5 minutes',
          {
            why: 'Chat: losing messages = unacceptable. Downtime: users will wait.',
            how: 'Async replication to standby region. Hot standby for fast failover.',
            tradeoffs: 'Sync replication: zero RPO بس high latency. Async: near-zero RPO.',
            examples: 'Primary: us-east. Standby: us-west. Replication lag: < 1 sec.',
            mistakes: 'خطأ شائع: no async replication، lose minutes of messages in disaster.'
          },
          {
            why: 'Chat: losing messages = unacceptable. Downtime: users will wait.',
            how: 'Async replication to standby region. Hot standby for fast failover.',
            tradeoffs: 'Sync replication: zero RPO but high latency. Async: near-zero RPO.',
            examples: 'Primary: us-east. Standby: us-west. Replication lag: < 1 sec.',
            mistakes: 'Common mistake: No async replication, lose minutes of messages in disaster.'
          }
        ),
        item(
          'Multi-region: user affinity لـ home region، failover لـ standby',
          'Multi-region: user affinity to home region, failover to standby',
          {
            why: 'Global users محتاجين low latency. Single region = single point of failure.',
            how: 'User assigned to home region. Data replicated to standby. Failover via DNS.',
            tradeoffs: 'Cross-region chat is slower. But simpler consistency.',
            examples: 'User in Egypt: home = eu-west. Chat with US user: message goes through 2 regions.',
            mistakes: 'خطأ شائع: no affinity، data scattered and hard to manage.'
          },
          {
            why: 'Global users need low latency. Single region = single point of failure.',
            how: 'User assigned to home region. Data replicated to standby. Failover via DNS.',
            tradeoffs: 'Cross-region chat is slower. But simpler consistency.',
            examples: 'User in Egypt: home = eu-west. Chat with US user: message goes through 2 regions.',
            mistakes: 'Common mistake: No affinity, data scattered and hard to manage.'
          }
        ),
        item(
          'Cross-region message routing: regional gateways',
          'Cross-region message routing: regional gateways',
          {
            why: 'لو sender وrecipient في regions مختلفة، message لازم يعدي.',
            how: 'Regional gateway: receives message → routes to correct region → delivers.',
            tradeoffs: 'Added latency للـ cross-region. بس necessary.',
            examples: 'AWS: 50-150ms inter-region latency. Acceptable.',
            mistakes: 'خطأ شائع: direct connection بين regions، complex mesh.'
          },
          {
            why: 'If sender and recipient in different regions, message must pass through.',
            how: 'Regional gateway: receives message → routes to correct region → delivers.',
            tradeoffs: 'Added latency for cross-region. But necessary.',
            examples: 'AWS: 50-150ms inter-region latency. Acceptable.',
            mistakes: 'Common mistake: Direct connection between regions, complex mesh.'
          }
        ),
        item(
          'Failover: messages stored until delivered، لو region وقع',
          'Failover: messages stored until delivered, if region fails',
          {
            why: 'لو region وقع، messages لازم تستنى.',
            how: 'Messages stored in sender region حتى delivery ack. Retry عند failover.',
            tradeoffs: 'Longer retention في sender region أثناء الـ outage.',
            examples: 'Region down 1 hour → messages queue، deliver عند recovery.',
            mistakes: 'خطأ شائع: تعتبر message delivered قبل الـ ack، message lost.'
          },
          {
            why: 'If region is down, messages must wait.',
            how: 'Messages stored in sender region until delivery ack. Retry on failover.',
            tradeoffs: 'Longer retention in sender region during outage.',
            examples: 'Region down 1 hour → messages queue, deliver on recovery.',
            mistakes: 'Common mistake: Considering message delivered before ack, message lost.'
          }
        ),
      ],
    },
  ],
};
