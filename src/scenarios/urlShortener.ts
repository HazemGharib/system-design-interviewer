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

export const urlShortenerScenario: Scenario = {
  id: 'url-shortener',
  title: { ar: 'خدمة اختصار الروابط', en: 'URL Shortener Service' },
  description: {
    ar: 'صمم خدمة اختصار روابط زي bit.ly مع analytics',
    en: 'Design a URL shortener service like bit.ly with analytics'
  },
  difficulty: { ar: 'متوسط', en: 'Medium' },
  estimatedTime: { ar: '45 دقيقة', en: '45 minutes' },
  problemStatement: {
    ar: 'عايزينك تصمم خدمة اختصار روابط (URL Shortener). اليوزر بيدّي رابط طويل، والسيستم بيرجّعله رابط قصير. لما حد يفتح الرابط القصير، بيتحوّل للرابط الأصلي. كمان محتاجين analytics (عدد الزيارات، الـ referrers، إلخ)، وإمكانية custom aliases، وانتهاء صلاحية الروابط.',
    en: 'Design a URL shortener service. Users provide a long URL and get a short URL back. When someone opens the short URL, they are redirected to the original. Also need analytics (visit counts, referrers, etc.), custom aliases, and link expiration.'
  },
  facts: [
    { label: { ar: 'روابط جديدة في الشهر', en: 'New URLs/month' }, value: { ar: 'حوالي 100 مليون', en: '~100 million' } },
    { label: { ar: 'الـ redirects في الشهر', en: 'Redirects/month' }, value: { ar: 'حوالي 10 مليار', en: '~10 billion' } },
    { label: { ar: 'القراءة للكتابة', en: 'Read/Write Ratio' }, value: { ar: 'حوالي 100 إلى 1', en: '~100:1' } },
    { label: { ar: 'طول الرابط القصير', en: 'Short URL Length' }, value: { ar: '7 characters', en: '7 characters' } },
    { label: { ar: 'هدف الـ redirect latency', en: 'Redirect Latency Target' }, value: { ar: 'أقل من 50ms', en: '< 50ms' } },
    { label: { ar: 'الـ availability', en: 'Availability' }, value: { ar: '99.99%', en: '99.99%' } },
    { label: { ar: 'الـ retention', en: 'Retention' }, value: { ar: '5 سنين default', en: '5 years default' } },
  ],
  stages: [
    {
      id: 'clarify',
      title: { ar: 'الأسئلة التوضيحية والحسبة', en: 'Clarifying Questions & Estimation' },
      shortTitle: { ar: 'الحسبة والأسئلة', en: 'Estimation' },
      prompt: {
        ar: 'قبل ما تصمم، اسأل الأسئلة التوضيحية اللي محتاجها، واعمل حسبة سريعة للأرقام. اكتب تقديراتك لعدد الـ URLs، الـ storage، وقد إيه unique short codes محتاج.',
        en: 'Before designing, ask clarifying questions and do quick estimation. Write your estimates for URLs count, storage, and how many unique short codes you need.'
      },
      level: 'senior',
      items: [
        item(
          'سألت عن الـ scope: custom aliases، expiration، analytics، API vs web',
          'Asked about scope: custom aliases, expiration, analytics, API vs web',
          {
            why: 'الـ features بتحدد الـ complexity. Custom aliases محتاجة uniqueness check. Analytics محتاجة event streaming.',
            how: 'اسأل: هل الـ custom aliases مطلوبة؟ هل الروابط ليها expiry؟ هل محتاجين analytics real-time ولا batch؟',
            tradeoffs: 'كل feature بتزود complexity. ابدأ بالـ core (create + redirect) وزوّد بعدين.',
            examples: 'bit.ly بيدّي custom aliases للـ premium users. TinyURL مفيهاش analytics.',
            mistakes: 'خطأ شائع: تفترض إن كل features مطلوبة وتعقّد التصميم من الأول.'
          },
          {
            why: 'Features determine complexity. Custom aliases need uniqueness check. Analytics need event streaming.',
            how: 'Ask: Are custom aliases required? Do links have expiry? Do we need real-time or batch analytics?',
            tradeoffs: 'Every feature adds complexity. Start with core (create + redirect) and add later.',
            examples: 'bit.ly gives custom aliases to premium users. TinyURL has no analytics.',
            mistakes: 'Common mistake: Assuming all features are required and over-complicating design from start.'
          }
        ),
        item(
          'قدّرت الـ writes/sec: ~40 URL/sec، والـ reads/sec: ~4000 redirect/sec',
          'Estimated writes/sec: ~40 URL/sec, reads/sec: ~4000 redirect/sec',
          {
            why: 'الأرقام دي بتحدد حجم الـ DB والـ cache اللي محتاجهم.',
            how: '100M/month ÷ 30 days ÷ 86400 sec ≈ 40/sec writes. 100:1 ratio = 4000/sec reads.',
            tradeoffs: 'الـ reads هي bottleneck. لازم cache قوي.',
            examples: 'bit.ly بيعمل billions of redirects/month. 4000/sec معقول لـ mid-size service.',
            mistakes: 'خطأ شائع: تنسى إن الـ reads أكتر بكتير من الـ writes.'
          },
          {
            why: 'These numbers determine DB and cache size needed.',
            how: '100M/month ÷ 30 days ÷ 86400 sec ≈ 40/sec writes. 100:1 ratio = 4000/sec reads.',
            tradeoffs: 'Reads are the bottleneck. Need strong caching.',
            examples: 'bit.ly does billions of redirects/month. 4000/sec is reasonable for mid-size service.',
            mistakes: 'Common mistake: Forgetting reads are much more than writes.'
          }
        ),
        item(
          'قدّرت الـ unique codes المحتاجة: 100M × 12 × 5 = 6 billion URLs',
          'Estimated unique codes needed: 100M × 12 × 5 = 6 billion URLs',
          {
            why: 'لازم تعرف كام unique code محتاج عشان تختار طول الـ short URL.',
            how: '100M/month × 12 months × 5 years = 6B URLs. Base62 مع 7 characters = 62^7 = 3.5 trillion.',
            tradeoffs: 'أطول = أكتر combinations بس أصعب في الـ remember. أقصر = أقل combinations.',
            examples: '7 characters كفاية لـ trillions. bit.ly بيستخدم 7.',
            mistakes: 'خطأ شائع: تقلل طول الـ code وتخلص الـ combinations بسرعة.'
          },
          {
            why: 'Need to know how many unique codes to choose short URL length.',
            how: '100M/month × 12 months × 5 years = 6B URLs. Base62 with 7 characters = 62^7 = 3.5 trillion.',
            tradeoffs: 'Longer = more combinations but harder to remember. Shorter = fewer combinations.',
            examples: '7 characters enough for trillions. bit.ly uses 7.',
            mistakes: 'Common mistake: Making code too short and running out of combinations quickly.'
          }
        ),
        item(
          'قدّرت الـ storage: ~500GB للـ mappings، زائد analytics events',
          'Estimated storage: ~500GB for mappings, plus analytics events',
          {
            why: 'الـ storage للـ URL mappings صغير، الـ analytics أكبر بكتير.',
            how: '6B URLs × (7 + 100 bytes avg long URL + metadata) ≈ 700GB. Analytics: 10B events × 200 bytes = 2TB/month.',
            tradeoffs: 'Analytics بتاكل storage. ممكن aggregate أو sample.',
            examples: 'الـ mapping table صغير نسبيًا. الـ analytics هي الـ challenge.',
            mistakes: 'خطأ شائع: تخزن كل analytics event raw من غير aggregation.'
          },
          {
            why: 'Storage for URL mappings is small, analytics is much bigger.',
            how: '6B URLs × (7 + 100 bytes avg long URL + metadata) ≈ 700GB. Analytics: 10B events × 200 bytes = 2TB/month.',
            tradeoffs: 'Analytics consume storage. Can aggregate or sample.',
            examples: 'Mapping table is relatively small. Analytics is the challenge.',
            mistakes: 'Common mistake: Storing every analytics event raw without aggregation.'
          }
        ),
      ],
    },
    {
      id: 'architecture',
      title: { ar: 'الأركيتكتشر العامة', en: 'High-Level Architecture' },
      shortTitle: { ar: 'الأركيتكتشر', en: 'Architecture' },
      prompt: {
        ar: 'اوصف الأركيتكتشر لإنشاء الروابط القصيرة والـ redirect والـ analytics. فصّل المكونات وشرح كل flow.',
        en: 'Describe the architecture for creating short links, redirects, and analytics. Detail the components and explain each flow.'
      },
      level: 'senior',
      items: [
        item(
          '📊 الرسم التخطيطي للأركيتكتشر المقترحة (شوف الرسم أسفل النقط)',
          '📊 Proposed Architecture Diagram (see diagram below the checklist)',
          {
            why: 'الرسم بيوضح الـ create flow والـ redirect flow والـ analytics flow.',
            how: 'Create: Client → API → Key Generator → DB. Redirect: Client → Cache (hit) → 301. Analytics: Redirect → Kafka → Aggregator → Analytics DB.',
            tradeoffs: 'رسم بسيط vs مفصل. الـ 3 flows لازم يكونوا واضحين.',
            examples: 'الـ redirect flow هو الأهم (99% of traffic)، لازم يكون optimized.',
            mistakes: 'خطأ شائع: ترسم flow واحد بس وتنسى الـ analytics.'
          },
          {
            why: 'Diagram shows create flow, redirect flow, and analytics flow.',
            how: 'Create: Client → API → Key Generator → DB. Redirect: Client → Cache (hit) → 301. Analytics: Redirect → Kafka → Aggregator → Analytics DB.',
            tradeoffs: 'Simple vs detailed diagram. The 3 flows must be clear.',
            examples: 'Redirect flow is most important (99% of traffic), must be optimized.',
            mistakes: 'Common mistake: Drawing only one flow and forgetting analytics.'
          }
        ),
        item(
          'Key generation strategy: Base62 counter أو hash أو pre-generated key service',
          'Key generation strategy: Base62 counter or hash or pre-generated key service',
          {
            why: 'كيف تعمل unique short codes هو core الـ system.',
            how: 'Counter: auto-increment → Base62. Hash: MD5(URL) → take first 7. Pre-generated: pool of unused keys.',
            tradeoffs: 'Counter: sequential (predictable). Hash: collisions possible. Pre-generated: needs management.',
            examples: 'bit.ly يستخدم pre-generated keys. Counter أبسط للبداية.',
            mistakes: 'خطأ شائع: تستخدم MD5 من غير collision handling.'
          },
          {
            why: 'How to generate unique short codes is core of the system.',
            how: 'Counter: auto-increment → Base62. Hash: MD5(URL) → take first 7. Pre-generated: pool of unused keys.',
            tradeoffs: 'Counter: sequential (predictable). Hash: collisions possible. Pre-generated: needs management.',
            examples: 'bit.ly uses pre-generated keys. Counter is simpler for start.',
            mistakes: 'Common mistake: Using MD5 without collision handling.'
          }
        ),
        item(
          'الـ redirect path: cache-first architecture للـ low latency',
          'Redirect path: cache-first architecture for low latency',
          {
            why: 'الـ redirect لازم يكون سريع جدًا (< 50ms). DB lookup بياخد وقت.',
            how: 'Redis cache أمام الـ DB. Cache hit → 301 redirect. Cache miss → DB lookup → cache → redirect.',
            tradeoffs: 'Cache size vs hit rate. Hot URLs بتستهلك أقل cache.',
            examples: 'Redis cluster مع 100GB يقدر يخزن billions of mappings.',
            mistakes: 'خطأ شائع: تعمل DB lookup لكل redirect، الـ latency هتبقى عالية.'
          },
          {
            why: 'Redirect must be very fast (< 50ms). DB lookup takes time.',
            how: 'Redis cache in front of DB. Cache hit → 301 redirect. Cache miss → DB lookup → cache → redirect.',
            tradeoffs: 'Cache size vs hit rate. Hot URLs consume less cache.',
            examples: 'Redis cluster with 100GB can store billions of mappings.',
            mistakes: 'Common mistake: Doing DB lookup for every redirect, latency will be high.'
          }
        ),
        item(
          '301 (permanent) vs 302 (temporary) redirect: implications على الـ caching والـ analytics',
          '301 (permanent) vs 302 (temporary) redirect: implications on caching and analytics',
          {
            why: '301 بتتـ cache في الـ browser، 302 لأ. ده بيأثر على الـ analytics.',
            how: '301: browser يتذكر، أقل requests. 302: كل visit بتوصلنا، analytics أدق.',
            tradeoffs: '301: أسرع للـ user بس analytics ناقصة. 302: analytics كاملة بس أكتر load.',
            examples: 'bit.ly بيستخدم 301. لو analytics مهمة، استخدم 302 أو JavaScript redirect.',
            mistakes: 'خطأ شائع: تستخدم 301 وتتوقع analytics دقيقة.'
          },
          {
            why: '301 is cached in browser, 302 is not. This affects analytics.',
            how: '301: browser remembers, fewer requests. 302: every visit reaches us, more accurate analytics.',
            tradeoffs: '301: faster for user but incomplete analytics. 302: complete analytics but more load.',
            examples: 'bit.ly uses 301. If analytics is important, use 302 or JavaScript redirect.',
            mistakes: 'Common mistake: Using 301 and expecting accurate analytics.'
          }
        ),
        item(
          'Analytics pipeline: event streaming (Kafka) → aggregation → time-series DB',
          'Analytics pipeline: event streaming (Kafka) → aggregation → time-series DB',
          {
            why: '10B events/month محتاجة pipeline، مش direct writes.',
            how: 'Redirect service → Kafka → Flink/Spark aggregation → InfluxDB/TimescaleDB.',
            tradeoffs: 'Real-time vs batch. Real-time أعقد بس أسرع insights.',
            examples: 'Kafka → 1 hour aggregation → store (clicks per hour per link).',
            mistakes: 'خطأ شائع: تكتب كل event في الـ main DB، هتغرق.'
          },
          {
            why: '10B events/month need pipeline, not direct writes.',
            how: 'Redirect service → Kafka → Flink/Spark aggregation → InfluxDB/TimescaleDB.',
            tradeoffs: 'Real-time vs batch. Real-time is more complex but faster insights.',
            examples: 'Kafka → 1 hour aggregation → store (clicks per hour per link).',
            mistakes: 'Common mistake: Writing every event to main DB, it will drown.'
          }
        ),
        item(
          'Database choice: NoSQL (DynamoDB/Cassandra) للـ simple key-value، مع read replicas',
          'Database choice: NoSQL (DynamoDB/Cassandra) for simple key-value, with read replicas',
          {
            why: 'الـ access pattern بسيط: get by short_code. NoSQL مثالي لده.',
            how: 'DynamoDB: partition key = short_code. Eventually consistent reads للـ redirects.',
            tradeoffs: 'NoSQL: scales well بس limited queries. SQL: flexible بس harder to scale.',
            examples: 'DynamoDB DAX للـ caching. Cassandra مع multiple datacenters.',
            mistakes: 'خطأ شائع: تستخدم SQL مع complex joins لـ simple lookup.'
          },
          {
            why: 'Access pattern is simple: get by short_code. NoSQL is ideal.',
            how: 'DynamoDB: partition key = short_code. Eventually consistent reads for redirects.',
            tradeoffs: 'NoSQL: scales well but limited queries. SQL: flexible but harder to scale.',
            examples: 'DynamoDB DAX for caching. Cassandra with multiple datacenters.',
            mistakes: 'Common mistake: Using SQL with complex joins for simple lookup.'
          }
        ),
      ],
    },
    {
      id: 'scaling',
      title: { ar: 'الـ Horizontal Scaling', en: 'Horizontal Scaling' },
      shortTitle: { ar: 'الـ Scaling', en: 'Scaling' },
      prompt: {
        ar: 'لو الترافيك زاد 10x، السيستم هيتكبر إزاي؟ اشرح scaling كل component.',
        en: 'If traffic increases 10x, how will the system scale? Explain scaling for each component.'
      },
      level: 'senior',
      items: [
        item(
          'API servers stateless، بيتـ scale horizontally وراء load balancer',
          'API servers are stateless, scale horizontally behind load balancer',
          {
            why: 'الـ redirect service لازم يكون stateless عشان يتكبّر بسهولة.',
            how: 'Auto Scaling Group. Scale على الـ CPU أو requests/sec.',
            tradeoffs: 'أكتر servers = أكتر cost. بس الـ latency بتفضل ثابتة.',
            examples: '10 servers → 100 servers بناءً على الـ traffic.',
            mistakes: 'خطأ شائع: تخزن session على الـ server، ده بيكسر الـ scaling.'
          },
          {
            why: 'Redirect service must be stateless to scale easily.',
            how: 'Auto Scaling Group. Scale on CPU or requests/sec.',
            tradeoffs: 'More servers = more cost. But latency stays stable.',
            examples: '10 servers → 100 servers based on traffic.',
            mistakes: 'Common mistake: Storing session on server, which breaks scaling.'
          }
        ),
        item(
          'Cache layer: Redis Cluster مع sharding على الـ short_code',
          'Cache layer: Redis Cluster with sharding on short_code',
          {
            why: 'Single Redis node ليه limit. Cluster بيوزع الـ load.',
            how: 'Redis Cluster: automatic sharding. 10 nodes × 10GB = 100GB cache.',
            tradeoffs: 'Cluster أعقد في الـ management. بس بيدّي unlimited scale.',
            examples: 'ElastiCache Redis Cluster. أو Memcached لـ simpler use case.',
            mistakes: 'خطأ شائع: single Redis node، لما يقع كل الـ traffic بيروح للـ DB.'
          },
          {
            why: 'Single Redis node has limits. Cluster distributes load.',
            how: 'Redis Cluster: automatic sharding. 10 nodes × 10GB = 100GB cache.',
            tradeoffs: 'Cluster is more complex to manage. But gives unlimited scale.',
            examples: 'ElastiCache Redis Cluster. Or Memcached for simpler use case.',
            mistakes: 'Common mistake: Single Redis node, when it fails all traffic goes to DB.'
          }
        ),
        item(
          'Database: partition/shard على الـ short_code لتوزيع الـ load',
          'Database: partition/shard on short_code to distribute load',
          {
            why: 'الـ DB ممكن تكون bottleneck. Sharding بيحل ده.',
            how: 'DynamoDB auto-shards. Cassandra: partition key = short_code.',
            tradeoffs: 'Sharding بيعقّد الـ queries اللي across shards.',
            examples: '100 partitions كل partition فيه 60M URLs.',
            mistakes: 'خطأ شائع: shard على الـ user_id بدل الـ short_code، الـ redirects مش بتعرف الـ user.'
          },
          {
            why: 'DB can be bottleneck. Sharding solves this.',
            how: 'DynamoDB auto-shards. Cassandra: partition key = short_code.',
            tradeoffs: 'Sharding complicates queries across shards.',
            examples: '100 partitions each with 60M URLs.',
            mistakes: 'Common mistake: Sharding on user_id instead of short_code, redirects do not know user.'
          }
        ),
        item(
          'Key generation service: distributed counter أو pre-allocated ranges',
          'Key generation service: distributed counter or pre-allocated ranges',
          {
            why: 'Key generation بياخد lock لو centralized. محتاج distribution.',
            how: 'Range allocation: كل server ياخد range (1M-2M)، يستخدم locally.',
            tradeoffs: 'Range allocation بيخلي gaps لو server مات. بس أسرع.',
            examples: 'ZooKeeper للـ range allocation. أو Twitter Snowflake-style IDs.',
            mistakes: 'خطأ شائع: single point of failure في الـ key generation.'
          },
          {
            why: 'Key generation takes lock if centralized. Need distribution.',
            how: 'Range allocation: each server gets range (1M-2M), uses locally.',
            tradeoffs: 'Range allocation leaves gaps if server dies. But faster.',
            examples: 'ZooKeeper for range allocation. Or Twitter Snowflake-style IDs.',
            mistakes: 'Common mistake: Single point of failure in key generation.'
          }
        ),
      ],
    },
    {
      id: 'monitoring',
      title: { ar: 'المراقبة والـ Observability', en: 'Monitoring & Observability' },
      shortTitle: { ar: 'المراقبة', en: 'Monitoring' },
      prompt: {
        ar: 'هتراقب إيه عشان تضمن الـ 99.99% availability والـ <50ms latency؟',
        en: 'What will you monitor to ensure 99.99% availability and <50ms latency?'
      },
      level: 'senior',
      items: [
        item(
          'Redirect latency: p50, p99, p999 للـ redirect endpoint',
          'Redirect latency: p50, p99, p999 for redirect endpoint',
          {
            why: 'الـ latency هي أهم metric. 50ms target محتاج monitoring دقيق.',
            how: 'Application metrics → Prometheus → Grafana. Alert لما p99 > 100ms.',
            tradeoffs: 'Detailed percentiles بتاكل storage. بس ضرورية.',
            examples: 'p50 = 10ms، p99 = 50ms، p999 = 200ms. Alert على p99.',
            mistakes: 'خطأ شائع: تتابع average بس، p99 ممكن يكون سيء.'
          },
          {
            why: 'Latency is the most important metric. 50ms target needs careful monitoring.',
            how: 'Application metrics → Prometheus → Grafana. Alert when p99 > 100ms.',
            tradeoffs: 'Detailed percentiles consume storage. But necessary.',
            examples: 'p50 = 10ms, p99 = 50ms, p999 = 200ms. Alert on p99.',
            mistakes: 'Common mistake: Tracking only average, p99 may be bad.'
          }
        ),
        item(
          'Cache hit rate: target > 99% للـ hot URLs',
          'Cache hit rate: target > 99% for hot URLs',
          {
            why: 'Cache miss بيزود الـ latency ويحمّل الـ DB.',
            how: 'Redis metrics: hits vs misses. Alert لما hit rate < 95%.',
            tradeoffs: 'Cache size vs hit rate. أكبر cache = أعلى cost.',
            examples: '99% hit rate يعني 1% بس بيروح للـ DB.',
            mistakes: 'خطأ شائع: متابعش الـ hit rate، الـ cache ممكن يكون مش فعال.'
          },
          {
            why: 'Cache miss increases latency and loads DB.',
            how: 'Redis metrics: hits vs misses. Alert when hit rate < 95%.',
            tradeoffs: 'Cache size vs hit rate. Bigger cache = higher cost.',
            examples: '99% hit rate means only 1% goes to DB.',
            mistakes: 'Common mistake: Not tracking hit rate, cache may be ineffective.'
          }
        ),
        item(
          'Error rates: 4xx (not found) vs 5xx (server errors)',
          'Error rates: 4xx (not found) vs 5xx (server errors)',
          {
            why: '4xx طبيعي (expired links). 5xx مشكلة.',
            how: 'Log aggregation → error rate dashboard. Alert على 5xx > 0.1%.',
            tradeoffs: 'High 4xx ممكن يكون normal (old links). ركز على 5xx.',
            examples: '4xx rate 1% (expired links)، 5xx rate 0.01% target.',
            mistakes: 'خطأ شائع: تعامل 4xx زي 5xx في الـ alerts.'
          },
          {
            why: '4xx is normal (expired links). 5xx is a problem.',
            how: 'Log aggregation → error rate dashboard. Alert on 5xx > 0.1%.',
            tradeoffs: 'High 4xx may be normal (old links). Focus on 5xx.',
            examples: '4xx rate 1% (expired links), 5xx rate 0.01% target.',
            mistakes: 'Common mistake: Treating 4xx like 5xx in alerts.'
          }
        ),
        item(
          'Key generation pool: هل باقي keys كافية',
          'Key generation pool: are remaining keys sufficient',
          {
            why: 'لو الـ keys خلصت، مش هتقدر تعمل URLs جديدة.',
            how: 'Monitor pool size. Alert لما < 10% remaining.',
            tradeoffs: 'Large pool = more memory. Small pool = risk of running out.',
            examples: 'Pool size 10M، alert لما < 1M.',
            mistakes: 'خطأ شائع: متابعش الـ pool، تكتشف إنه خلص في production.'
          },
          {
            why: 'If keys run out, cannot create new URLs.',
            how: 'Monitor pool size. Alert when < 10% remaining.',
            tradeoffs: 'Large pool = more memory. Small pool = risk of running out.',
            examples: 'Pool size 10M, alert when < 1M.',
            mistakes: 'Common mistake: Not monitoring pool, discover it is empty in production.'
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
          'Database reads للـ cold URLs: cache warming و bloom filters',
          'Database reads for cold URLs: cache warming and bloom filters',
          {
            why: 'Cold URLs (نادرة الزيارة) بتسبب cache misses كتير.',
            how: 'Bloom filter: check if URL exists قبل الـ DB. Cache warming لـ popular URLs.',
            tradeoffs: 'Bloom filter بيستهلك memory. بس بيوفر DB lookups.',
            examples: 'Bloom filter: 10GB للـ 10B URLs مع 1% false positive rate.',
            mistakes: 'خطأ شائع: تفترض كل URLs hot، الـ long tail كبير.'
          },
          {
            why: 'Cold URLs (rarely visited) cause many cache misses.',
            how: 'Bloom filter: check if URL exists before DB. Cache warming for popular URLs.',
            tradeoffs: 'Bloom filter consumes memory. But saves DB lookups.',
            examples: 'Bloom filter: 10GB for 10B URLs with 1% false positive rate.',
            mistakes: 'Common mistake: Assuming all URLs are hot, the long tail is big.'
          }
        ),
        item(
          'Key generation contention: distributed counters أو pre-allocation',
          'Key generation contention: distributed counters or pre-allocation',
          {
            why: 'لو كل create request بيطلب key من service واحد، هيكون bottleneck.',
            how: 'Pre-allocate ranges: كل API server ياخد batch من الـ keys مقدمًا.',
            tradeoffs: 'Pre-allocation بتضيع keys لو server مات. بس أسرع.',
            examples: 'كل server ياخد 100K keys، يستخدمهم locally.',
            mistakes: 'خطأ شائع: centralized key generation مع lock على كل request.'
          },
          {
            why: 'If every create request asks key from one service, it becomes bottleneck.',
            how: 'Pre-allocate ranges: each API server gets batch of keys upfront.',
            tradeoffs: 'Pre-allocation wastes keys if server dies. But faster.',
            examples: 'Each server gets 100K keys, uses locally.',
            mistakes: 'Common mistake: Centralized key generation with lock on every request.'
          }
        ),
        item(
          'Analytics writes: بتغرق الـ DB لو synchronous',
          'Analytics writes: will drown DB if synchronous',
          {
            why: '10B events/month = 4000/sec. مينفعش تكتب كل واحد في الـ DB.',
            how: 'Fire-and-forget to Kafka. Async processing. Batch writes.',
            tradeoffs: 'Async = ممكن تضيع events لو Kafka وقع. بس ده acceptable.',
            examples: 'Redirect returns فورًا، analytics event بيتبعت async.',
            mistakes: 'خطأ شائع: synchronous analytics write، الـ redirect بيتأخر.'
          },
          {
            why: '10B events/month = 4000/sec. Cannot write each one to DB.',
            how: 'Fire-and-forget to Kafka. Async processing. Batch writes.',
            tradeoffs: 'Async = may lose events if Kafka fails. But acceptable.',
            examples: 'Redirect returns immediately, analytics event sent async.',
            mistakes: 'Common mistake: Synchronous analytics write, redirect is delayed.'
          }
        ),
        item(
          'Custom alias uniqueness check: race conditions وperformance',
          'Custom alias uniqueness check: race conditions and performance',
          {
            why: 'Two users ممكن يطلبوا نفس الـ custom alias في نفس الوقت.',
            how: 'DB unique constraint. أو atomic check-and-set في Redis.',
            tradeoffs: 'Unique constraint بيرجع error. Need retry logic.',
            examples: 'INSERT ... ON CONFLICT DO NOTHING. Check affected rows.',
            mistakes: 'خطأ شائع: check then insert من غير transaction، race condition.'
          },
          {
            why: 'Two users may request same custom alias at same time.',
            how: 'DB unique constraint. Or atomic check-and-set in Redis.',
            tradeoffs: 'Unique constraint returns error. Need retry logic.',
            examples: 'INSERT ... ON CONFLICT DO NOTHING. Check affected rows.',
            mistakes: 'Common mistake: Check then insert without transaction, race condition.'
          }
        ),
      ],
    },
    {
      id: 'tradeoffs',
      title: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
      shortTitle: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
      prompt: {
        ar: 'إيه القرارات الكبيرة اللي فيها trade-offs، وليه اخترت اللي اخترته؟',
        en: 'What are the major decisions with trade-offs, and why did you choose what you chose?'
      },
      level: 'senior',
      items: [
        item(
          'Key generation: randomness vs predictability vs collision risk',
          'Key generation: randomness vs predictability vs collision risk',
          {
            why: 'Sequential keys predictable (security risk). Random keys risk collision.',
            how: 'Base62(counter + random salt) للـ best of both.',
            tradeoffs: 'Pure random: needs collision check. Sequential: enumerable.',
            examples: 'Counter: abc123 → abc124. Random: x7Kp2m.',
            mistakes: 'خطأ شائع: sequential keys بتسمح للـ attacker يـ enumerate الـ URLs.'
          },
          {
            why: 'Sequential keys predictable (security risk). Random keys risk collision.',
            how: 'Base62(counter + random salt) for best of both.',
            tradeoffs: 'Pure random: needs collision check. Sequential: enumerable.',
            examples: 'Counter: abc123 → abc124. Random: x7Kp2m.',
            mistakes: 'Common mistake: Sequential keys allow attacker to enumerate URLs.'
          }
        ),
        item(
          'Availability vs consistency: redirect يشتغل حتى لو الـ DB وقع',
          'Availability vs consistency: redirect works even if DB is down',
          {
            why: 'الـ redirect أهم من الـ create. لو الـ DB وقع، الـ cached URLs لازم تشتغل.',
            how: 'Cache-first. لو الـ DB وقع، الـ hot URLs بتشتغل من الـ cache.',
            tradeoffs: 'Cold URLs مش هتشتغل لو DB وقع. بس acceptable.',
            examples: '99% من الـ traffic من hot URLs، هيفضلوا شغالين.',
            mistakes: 'خطأ شائع: fail completely لو DB وقع.'
          },
          {
            why: 'Redirect is more important than create. If DB is down, cached URLs must work.',
            how: 'Cache-first. If DB is down, hot URLs work from cache.',
            tradeoffs: 'Cold URLs will not work if DB is down. But acceptable.',
            examples: '99% of traffic from hot URLs, they will keep working.',
            mistakes: 'Common mistake: Failing completely if DB is down.'
          }
        ),
        item(
          'Analytics accuracy vs latency: 302 (accurate) vs 301 (fast)',
          'Analytics accuracy vs latency: 302 (accurate) vs 301 (fast)',
          {
            why: '301 بيتـ cache، analytics ناقصة. 302 أدق بس أبطأ للـ repeat visits.',
            how: 'Default 301 للـ speed. Option للـ 302 للي عايز analytics دقيقة.',
            tradeoffs: 'Product decision. Business users عايزين analytics، regular users عايزين speed.',
            examples: 'bit.ly 301. لو analytics مهمة، JavaScript redirect.',
            mistakes: 'خطأ شائع: 302 لكل حاجة، الـ users بيشتكوا من البطء.'
          },
          {
            why: '301 is cached, analytics incomplete. 302 is more accurate but slower for repeat visits.',
            how: 'Default 301 for speed. Option for 302 for those wanting accurate analytics.',
            tradeoffs: 'Product decision. Business users want analytics, regular users want speed.',
            examples: 'bit.ly uses 301. If analytics is important, JavaScript redirect.',
            mistakes: 'Common mistake: Using 302 for everything, users complain about slowness.'
          }
        ),
      ],
    },
    {
      id: 'followup1',
      title: { ar: 'سؤال متابعة: Link Rot والـ Expiration', en: 'Follow-up: Link Rot & Expiration' },
      shortTitle: { ar: 'الـ Expiration', en: 'Expiration' },
      prompt: {
        ar: 'لو link قديم expired أو الـ original URL بقى 404، هتتعامل إزاي؟ وإزاي تنظف الـ old data؟',
        en: 'If an old link expired or the original URL became 404, how do you handle it? How do you clean up old data?'
      },
      level: 'senior',
      items: [
        item(
          'TTL على الـ records: soft delete أولاً، hard delete بعد grace period',
          'TTL on records: soft delete first, hard delete after grace period',
          {
            why: 'Hard delete فورًا ممكن يزعل users. Grace period بيدّي فرصة للـ recovery.',
            how: 'expiry_date column. Soft delete at expiry. Hard delete after 30 days.',
            tradeoffs: 'Grace period بيستهلك storage. بس بيحمي من mistakes.',
            examples: 'URL expires → 404 page مع message "this link expired".',
            mistakes: 'خطأ شائع: hard delete فورًا، user مش قادر يـ recover.'
          },
          {
            why: 'Hard delete immediately may upset users. Grace period gives chance for recovery.',
            how: 'expiry_date column. Soft delete at expiry. Hard delete after 30 days.',
            tradeoffs: 'Grace period consumes storage. But protects against mistakes.',
            examples: 'URL expires → 404 page with message "this link expired".',
            mistakes: 'Common mistake: Hard delete immediately, user cannot recover.'
          }
        ),
        item(
          'Background job للـ cleanup: batch processing للـ expired URLs',
          'Background job for cleanup: batch processing for expired URLs',
          {
            why: 'ما ينفعش تـ check expiry على كل redirect. Batch cleanup أفضل.',
            how: 'Daily job: SELECT expired URLs → soft delete. Weekly job: hard delete old soft-deleted.',
            tradeoffs: 'Lag بين expiry والـ cleanup. بس acceptable.',
            examples: 'AWS Lambda scheduled job. أو cron job.',
            mistakes: 'خطأ شائع: check expiry synchronously على كل redirect، بيزود latency.'
          },
          {
            why: 'Cannot check expiry on every redirect. Batch cleanup is better.',
            how: 'Daily job: SELECT expired URLs → soft delete. Weekly job: hard delete old soft-deleted.',
            tradeoffs: 'Lag between expiry and cleanup. But acceptable.',
            examples: 'AWS Lambda scheduled job. Or cron job.',
            mistakes: 'Common mistake: Checking expiry synchronously on every redirect, adds latency.'
          }
        ),
        item(
          'Key recycling: هل تعيد استخدام الـ short codes القديمة',
          'Key recycling: whether to reuse old short codes',
          {
            why: 'Short codes غالية (limited space). بس الـ recycling ممكن يسبب confusion.',
            how: 'Option 1: never recycle (simpler). Option 2: recycle after 2 years (saves space).',
            tradeoffs: 'Recycling: code ممكن يوصل لـ URL مختلف. Never recycle: بتستهلك codes أسرع.',
            examples: 'bit.ly لا تعيد استخدام الـ codes.',
            mistakes: 'خطأ شائع: recycle بسرعة، الـ users بيلاقوا links بتوصل لحاجة تانية.'
          },
          {
            why: 'Short codes are valuable (limited space). But recycling may cause confusion.',
            how: 'Option 1: never recycle (simpler). Option 2: recycle after 2 years (saves space).',
            tradeoffs: 'Recycling: code may point to different URL. Never recycle: consume codes faster.',
            examples: 'bit.ly does not recycle codes.',
            mistakes: 'Common mistake: Recycling quickly, users find links pointing to something else.'
          }
        ),
      ],
    },
    // Staff-level stages for URL Shortener
    {
      id: 'staff-cost',
      title: { ar: 'تقدير التكلفة (Staff)', en: 'Cost Estimation (Staff)' },
      shortTitle: { ar: 'التكلفة', en: 'Cost' },
      prompt: {
        ar: 'قدّر التكلفة الشهرية: compute، database، cache، analytics storage. إيه أكبر بند؟',
        en: 'Estimate monthly cost: compute, database, cache, analytics storage. What is the biggest item?'
      },
      level: 'staff',
      items: [
        item(
          'Database: DynamoDB on-demand ~$1.25/million reads، ~$1.25/million writes',
          'Database: DynamoDB on-demand ~$1.25/million reads, ~$1.25/million writes',
          {
            why: 'الـ DB هي core cost للـ URL shortener.',
            how: '4000 reads/sec × 2.6M sec/month = 10B reads = $12.5K/month. Writes: 100M × $1.25 = $125.',
            tradeoffs: 'On-demand: flexible بس أغلى. Provisioned: أرخص بس rigid.',
            examples: 'مع caching 99%، actual DB reads = 100M/month = $125.',
            mistakes: 'خطأ شائع: تحسب بدون caching، التكلفة تبان أعلى بكتير.'
          },
          {
            why: 'DB is core cost for URL shortener.',
            how: '4000 reads/sec × 2.6M sec/month = 10B reads = $12.5K/month. Writes: 100M × $1.25 = $125.',
            tradeoffs: 'On-demand: flexible but expensive. Provisioned: cheaper but rigid.',
            examples: 'With 99% caching, actual DB reads = 100M/month = $125.',
            mistakes: 'Common mistake: Calculating without caching, cost looks much higher.'
          }
        ),
        item(
          'Cache: Redis cluster ~$0.068/GB/hour، 100GB = ~$5K/month',
          'Cache: Redis cluster ~$0.068/GB/hour, 100GB = ~$5K/month',
          {
            why: 'Cache هو اللي بيخلي الـ latency < 50ms.',
            how: '100GB × $0.068 × 730 hours = $5K/month.',
            tradeoffs: 'أكبر cache = أعلى hit rate بس أعلى cost.',
            examples: 'ElastiCache Redis r6g.xlarge cluster.',
            mistakes: 'خطأ شائع: تقلل الـ cache size لتوفر، الـ latency بتعلى.'
          },
          {
            why: 'Cache is what makes latency < 50ms.',
            how: '100GB × $0.068 × 730 hours = $5K/month.',
            tradeoffs: 'Bigger cache = higher hit rate but higher cost.',
            examples: 'ElastiCache Redis r6g.xlarge cluster.',
            mistakes: 'Common mistake: Reducing cache size to save money, latency increases.'
          }
        ),
        item(
          'Analytics storage: time-series data ~2TB/month، aggregated ~100GB',
          'Analytics storage: time-series data ~2TB/month, aggregated ~100GB',
          {
            why: 'Raw events ضخمة. Aggregation بتقلل الـ storage.',
            how: 'Raw: 10B × 200 bytes = 2TB. Aggregated hourly: 100M × 1KB = 100GB.',
            tradeoffs: 'Raw = flexible queries. Aggregated = limited queries بس أرخص.',
            examples: 'InfluxDB أو TimescaleDB للـ aggregated data.',
            mistakes: 'خطأ شائع: تخزن raw events للأبد، التكلفة بتنفجر.'
          },
          {
            why: 'Raw events are huge. Aggregation reduces storage.',
            how: 'Raw: 10B × 200 bytes = 2TB. Aggregated hourly: 100M × 1KB = 100GB.',
            tradeoffs: 'Raw = flexible queries. Aggregated = limited queries but cheaper.',
            examples: 'InfluxDB or TimescaleDB for aggregated data.',
            mistakes: 'Common mistake: Storing raw events forever, cost explodes.'
          }
        ),
      ],
    },
    {
      id: 'staff-security',
      title: { ar: 'الأمان والـ Abuse (Staff)', en: 'Security & Abuse (Staff)' },
      shortTitle: { ar: 'الأمان', en: 'Security' },
      prompt: {
        ar: 'إيه المخاطر الأمنية: malicious URLs، phishing، rate limiting، enumeration attacks؟',
        en: 'What are the security risks: malicious URLs, phishing, rate limiting, enumeration attacks?'
      },
      level: 'staff',
      items: [
        item(
          'Malicious URL detection: Google Safe Browsing API، VirusTotal',
          'Malicious URL detection: Google Safe Browsing API, VirusTotal',
          {
            why: 'Short URLs بتتستخدم للـ phishing. لازم تـ scan.',
            how: 'Check URL against Safe Browsing قبل الـ create. Block أو warn.',
            tradeoffs: 'API calls بتزود latency. بس ضرورية.',
            examples: 'Google Safe Browsing API مجاني لـ non-commercial.',
            mistakes: 'خطأ شائع: متعملش scanning، platform بيتستخدم للـ phishing.'
          },
          {
            why: 'Short URLs are used for phishing. Must scan.',
            how: 'Check URL against Safe Browsing before create. Block or warn.',
            tradeoffs: 'API calls add latency. But necessary.',
            examples: 'Google Safe Browsing API is free for non-commercial.',
            mistakes: 'Common mistake: Not scanning, platform is used for phishing.'
          }
        ),
        item(
          'Rate limiting: per-IP وper-user limits للـ create endpoint',
          'Rate limiting: per-IP and per-user limits for create endpoint',
          {
            why: 'بدون limits، attacker يقدر يستهلك كل الـ keys أو يعمل spam.',
            how: '100 creates/hour/IP. 1000 creates/hour/authenticated user.',
            tradeoffs: 'Aggressive limits بتزعج legitimate users.',
            examples: 'Token bucket algorithm. Redis-based rate limiter.',
            mistakes: 'خطأ شائع: rate limit على IP بس، shared NAT بيأثر على users كتير.'
          },
          {
            why: 'Without limits, attacker can consume all keys or spam.',
            how: '100 creates/hour/IP. 1000 creates/hour/authenticated user.',
            tradeoffs: 'Aggressive limits upset legitimate users.',
            examples: 'Token bucket algorithm. Redis-based rate limiter.',
            mistakes: 'Common mistake: Rate limiting on IP only, shared NAT affects many users.'
          }
        ),
        item(
          'Enumeration protection: non-sequential keys، rate limit على 404s',
          'Enumeration protection: non-sequential keys, rate limit on 404s',
          {
            why: 'Sequential keys بتسمح للـ attacker يـ crawl كل الـ URLs.',
            how: 'Random-looking keys. Rate limit: 10 404s/min/IP → block.',
            tradeoffs: 'Random keys أطول أو harder to remember.',
            examples: 'Base62 random بدل counter.',
            mistakes: 'خطأ شائع: sequential keys، attacker يقدر يشوف URLs الناس كلها.'
          },
          {
            why: 'Sequential keys allow attacker to crawl all URLs.',
            how: 'Random-looking keys. Rate limit: 10 404s/min/IP → block.',
            tradeoffs: 'Random keys are longer or harder to remember.',
            examples: 'Base62 random instead of counter.',
            mistakes: 'Common mistake: Sequential keys, attacker can see everyone\'s URLs.'
          }
        ),
      ],
    },
    {
      id: 'staff-dr',
      title: { ar: 'الـ DR والـ Multi-Region (Staff)', en: 'DR & Multi-Region (Staff)' },
      shortTitle: { ar: 'الـ DR', en: 'DR' },
      prompt: {
        ar: '99.99% availability يعني 52 دقيقة downtime/سنة. إزاي تحقق ده مع DR؟',
        en: '99.99% availability means 52 minutes downtime/year. How do you achieve this with DR?'
      },
      level: 'staff',
      items: [
        item(
          'Active-active multi-region: redirects تشتغل من أقرب region',
          'Active-active multi-region: redirects work from nearest region',
          {
            why: 'Active-passive بيدّي RTO = failover time. Active-active بيدّي RTO ≈ 0.',
            how: 'DynamoDB global tables. Redis في كل region. Route 53 latency-based routing.',
            tradeoffs: 'Active-active أعقد وأغلى. بس بيحقق 99.99%+.',
            examples: '2 regions: us-east-1، eu-west-1. User بيروح لأقرب واحد.',
            mistakes: 'خطأ شائع: active-passive بس، الـ failover بياخد دقايق.'
          },
          {
            why: 'Active-passive gives RTO = failover time. Active-active gives RTO ≈ 0.',
            how: 'DynamoDB global tables. Redis in each region. Route 53 latency-based routing.',
            tradeoffs: 'Active-active is more complex and expensive. But achieves 99.99%+.',
            examples: '2 regions: us-east-1, eu-west-1. User goes to nearest one.',
            mistakes: 'Common mistake: Active-passive only, failover takes minutes.'
          }
        ),
        item(
          'Key generation across regions: range allocation لتجنب collisions',
          'Key generation across regions: range allocation to avoid collisions',
          {
            why: 'لو كل region بيعمل keys، ممكن يحصل collision.',
            how: 'كل region له range مختلف: us = 0-1T، eu = 1T-2T.',
            tradeoffs: 'Range allocation بيخلي coordination أقل. بس محتاج planning.',
            examples: 'ZooKeeper أو etcd لـ range assignment.',
            mistakes: 'خطأ شائع: same counter في كل region، collision.'
          },
          {
            why: 'If every region generates keys, collision may happen.',
            how: 'Each region has different range: us = 0-1T, eu = 1T-2T.',
            tradeoffs: 'Range allocation needs less coordination. But needs planning.',
            examples: 'ZooKeeper or etcd for range assignment.',
            mistakes: 'Common mistake: Same counter in every region, collision.'
          }
        ),
        item(
          'Replication lag handling: eventual consistency acceptable للـ redirects',
          'Replication lag handling: eventual consistency acceptable for redirects',
          {
            why: 'Cross-region replication بياخد milliseconds. ده acceptable.',
            how: 'DynamoDB global tables: ~1 second lag. للـ creates، read-your-writes من same region.',
            tradeoffs: 'Strong consistency أبطأ. Eventually consistent أسرع.',
            examples: 'Create في us، immediate redirect في us. Redirect في eu بعد ~1 sec.',
            mistakes: 'خطأ شائع: تطلب strong consistency للـ redirects، الـ latency بتعلى.'
          },
          {
            why: 'Cross-region replication takes milliseconds. This is acceptable.',
            how: 'DynamoDB global tables: ~1 second lag. For creates, read-your-writes from same region.',
            tradeoffs: 'Strong consistency is slower. Eventually consistent is faster.',
            examples: 'Create in us, immediate redirect in us. Redirect in eu after ~1 sec.',
            mistakes: 'Common mistake: Requiring strong consistency for redirects, latency increases.'
          }
        ),
      ],
    },
  ],
};
