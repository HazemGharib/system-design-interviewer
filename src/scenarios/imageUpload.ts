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

export const imageUploadScenario: Scenario = {
  id: 'image-upload',
  title: { ar: 'خدمة رفع الصور', en: 'Image Upload Service' },
  description: {
    ar: 'صمم خدمة رفع صور لأبلكيشن سوشيال ميديا مع thumbnails',
    en: 'Design an image upload service for a social media app with thumbnails'
  },
  difficulty: { ar: 'متوسط', en: 'Medium' },
  estimatedTime: { ar: '45 دقيقة', en: '45 minutes' },
  problemStatement: {
    ar: 'عايزينك تصمم خدمة رفع صور لأبلكيشن سوشيال ميديا. اليوزر بيرفع صورة، والسيستم لازم يخزنها، ويعمل منها تلات مقاسات مصغرة: صغير ووسط وكبير. وبعد كده اليوزرز التانيين يقدروا يشوفوها بسرعة. صمم الأركيتكتشر، واشرح هتعمل scale إزاي، وهتراقب السيستم إزاي، وإيه أماكن الاختناق اللي متوقع تظهر وهتحلها إزاي.',
    en: 'Design an image upload service for a social media application. Users upload images, and the system must store them and generate three thumbnail sizes: small, medium, and large. Other users should be able to view them quickly. Design the architecture, explain how you will scale, how you will monitor the system, and what bottlenecks you expect and how you will solve them.'
  },
  facts: [
    { label: { ar: 'اليوزرز النشطين في اليوم', en: 'Daily Active Users' }, value: { ar: 'حوالي 10 مليون', en: '~10 million' } },
    { label: { ar: 'الصور المرفوعة في اليوم', en: 'Daily Uploads' }, value: { ar: 'حوالي 2 مليون', en: '~2 million' } },
    { label: { ar: 'القراءة للكتابة', en: 'Read/Write Ratio' }, value: { ar: 'حوالي 100 إلى 1', en: '~100:1' } },
    { label: { ar: 'متوسط حجم الصورة', en: 'Avg Image Size' }, value: { ar: 'حوالي 3 MB', en: '~3 MB' } },
    { label: { ar: 'هدف رد الرفع', en: 'Upload Response Target' }, value: { ar: 'أقل من ثانيتين', en: '< 2 seconds' } },
    { label: { ar: 'جهوزية الـ thumbnails', en: 'Thumbnail Readiness' }, value: { ar: 'خلال 10 ثواني', en: 'Within 10 seconds' } },
    { label: { ar: 'أوقات الذروة', en: 'Peak Times' }, value: { ar: 'الترافيك ممكن يتضاعف', en: 'Traffic may double' } },
  ],
  stages: [
    {
      id: 'clarify',
      title: { ar: 'الأسئلة التوضيحية والحسبة', en: 'Clarifying Questions & Estimation' },
      shortTitle: { ar: 'الحسبة والأسئلة', en: 'Estimation' },
      prompt: {
        ar: 'قبل ما تصمم، اسأل الأسئلة التوضيحية اللي محتاجها، واعمل حسبة سريعة للأرقام. اكتب تقديراتك لعدد الرفع في الثانية، وحجم التخزين في اليوم وفي السنة، وحجم الـ bandwidth.',
        en: 'Before designing, ask clarifying questions you need and do a quick estimation. Write your estimates for uploads per second, daily/yearly storage, and bandwidth.'
      },
      level: 'senior',
      items: [
        item(
          'سألت أسئلة توضيحية قبل التصميم، زي الـ constraints، وحد حجم الصورة، وصيغ الملفات، ومستوى التوافق المطلوب',
          'Asked clarifying questions before designing: constraints, max image size, file formats, required availability',
          {
            why: 'الأسئلة التوضيحية بتوضح الـ scope وبتجنبك تصمم حاجة مش مطلوبة. الإنترفيور بيقيّم قدرتك على فهم المتطلبات.',
            how: 'اسأل عن: حجم الصور المسموح، الصيغ المدعومة (JPEG/PNG/HEIC)، هل في تعديل أو فلاتر، الـ availability target (99.9%?)، الـ consistency requirements.',
            tradeoffs: 'أسئلة كتير ممكن تضيع وقت، أسئلة قليلة ممكن تخليك تصمم غلط. Balance بين الاتنين.',
            examples: 'أمثلة: "هل اليوزر يقدر يعدّل الصورة بعد الرفع؟" "هل لازم ندعم HEIC من الـ iPhone؟" "إيه الـ SLA المطلوب؟"',
            mistakes: 'خطأ شائع: تبدأ ترسم من غير ما تسأل، أو تفترض إن كل الصور JPEG بس.'
          },
          {
            why: 'Clarifying questions define scope and prevent over-engineering. Interviewers evaluate your ability to understand requirements.',
            how: 'Ask about: allowed image sizes, supported formats (JPEG/PNG/HEIC), editing/filters, availability target (99.9%?), consistency requirements.',
            tradeoffs: 'Too many questions wastes time; too few may lead to wrong design. Balance is key.',
            examples: 'Examples: "Can users edit images after upload?" "Do we support HEIC from iPhones?" "What SLA is required?"',
            mistakes: 'Common mistake: Starting to draw without asking, or assuming all images are JPEG only.'
          }
        ),
        item(
          'قدّرت عدد الرفع في الثانية: حوالي 23 upload/sec متوسط، وحوالي 46 في الذروة',
          'Estimated uploads per second: ~23 avg, ~46 at peak',
          {
            why: 'الرقم ده بيحدد حجم الـ API servers والـ queue وعدد الـ workers اللي محتاجهم.',
            how: '2M uploads/day ÷ 86400 sec ≈ 23/sec. في الذروة (2x) ≈ 46/sec. ده معقول لـ social media متوسط.',
            tradeoffs: 'لو قللت التقدير، السيستم هيقع في الذروة. لو زودت، هتدفع فلوس زيادة على infra مش محتاجها.',
            examples: 'Instagram بيستقبل أكتر من 1000 صورة/ثانية. 23/sec ده تطبيق متوسط الحجم.',
            mistakes: 'خطأ شائع: تنسى تضرب في 2 للذروة، أو تحسب على 24 ساعة متساوية (الترافيك مش موزع بالتساوي).'
          },
          {
            why: 'This number determines API server capacity, queue size, and worker count needed.',
            how: '2M uploads/day ÷ 86400 sec ≈ 23/sec. At peak (2x) ≈ 46/sec. This is reasonable for a mid-size social media app.',
            tradeoffs: 'Underestimate and the system crashes at peak. Overestimate and you overpay for unused infra.',
            examples: 'Instagram handles 1000+ images/sec. 23/sec is a mid-size app.',
            mistakes: 'Common mistake: Forgetting to multiply by 2 for peak, or assuming even distribution over 24 hours.'
          }
        ),
        item(
          'قدّرت حجم التخزين في اليوم: حوالي 6 TB للصور الأصلية، بالإضافة للـ thumbnails',
          'Estimated daily storage: ~6 TB for originals, plus thumbnails',
          {
            why: 'التخزين هو أكبر تكلفة في السيستم ده، لازم تعرف الحجم عشان تختار الـ storage tier المناسب.',
            how: '2M × 3MB = 6TB/day للأصليات. الـ thumbnails (S+M+L) ≈ 10-15% إضافي = ~7TB total/day.',
            tradeoffs: 'Standard storage أرخص بس أبطأ. لو محتاج سرعة، هتدفع أكتر. ممكن تنقل القديم لـ cold storage.',
            examples: 'S3 Standard ≈ $0.023/GB/month. 6TB/day = 180TB/month ≈ $4,140/month للأصليات بس.',
            mistakes: 'خطأ شائع: تنسى الـ thumbnails أو تفترض إنها مجانية. أو تنسى إن التخزين تراكمي (cumulative).'
          },
          {
            why: 'Storage is the biggest cost in this system. You need to know the volume to choose the right storage tier.',
            how: '2M × 3MB = 6TB/day for originals. Thumbnails (S+M+L) ≈ 10-15% extra = ~7TB total/day.',
            tradeoffs: 'Standard storage is cheaper but slower. If you need speed, you pay more. Can tier old content to cold storage.',
            examples: 'S3 Standard ≈ $0.023/GB/month. 6TB/day = 180TB/month ≈ $4,140/month for originals only.',
            mistakes: 'Common mistake: Forgetting thumbnails or assuming they are free. Or forgetting storage is cumulative.'
          }
        ),
        item(
          'قدّرت حجم التخزين في السنة: حوالي 2.2 PB للصور الأصلية',
          'Estimated yearly storage: ~2.2 PB for originals',
          {
            why: 'السنة بتوريك الـ scale الحقيقي وبتخليك تفكر في data lifecycle و retention policy.',
            how: '6TB × 365 ≈ 2.2 PB/year. لو عايز تقلل، محتاج retention policy أو compression.',
            tradeoffs: 'تخزين كل حاجة للأبد غالي. الحذف بيوفر فلوس بس بيزعل اليوزرز. الحل: tiered storage.',
            examples: '2.2 PB على S3 Standard ≈ $50K/month. على Glacier ≈ $8K/month بس أبطأ في الاسترجاع.',
            mistakes: 'خطأ شائع: تفترض إن الصور هتتمسح، أو تنسى إن السنة الجاية هيكون عندك 4.4 PB.'
          },
          {
            why: 'Yearly numbers show real scale and make you think about data lifecycle and retention policy.',
            how: '6TB × 365 ≈ 2.2 PB/year. To reduce, you need retention policy or compression.',
            tradeoffs: 'Storing everything forever is expensive. Deletion saves money but upsets users. Solution: tiered storage.',
            examples: '2.2 PB on S3 Standard ≈ $50K/month. On Glacier ≈ $8K/month but slower retrieval.',
            mistakes: 'Common mistake: Assuming images will be deleted, or forgetting next year you will have 4.4 PB.'
          }
        ),
        item(
          'قدّرت الـ bandwidth للكتابة والقراءة، ولاحظت إن القراءة أكبر بكتير وغالبًا هتكون على thumbnails من خلال الـ CDN',
          'Estimated read/write bandwidth, noted reads are much higher and mostly thumbnails via CDN',
          {
            why: 'الـ bandwidth بيحدد تكلفة الـ egress وحجم الـ CDN اللي محتاجه.',
            how: 'Write: 23/sec × 3MB ≈ 69 MB/sec ≈ 550 Mbps. Read: 100x = 55 Gbps لو من الـ origin، بس الـ CDN بيمتص 95%+.',
            tradeoffs: 'CDN أغلى بس بيقلل الـ load على الـ origin وبيحسن الـ latency للـ users.',
            examples: 'CloudFront egress ≈ $0.085/GB. لو 95% cache hit، الـ origin egress بيقل 20x.',
            mistakes: 'خطأ شائع: تحسب الـ read bandwidth من غير CDN، أو تنسى إن الـ thumbnails أصغر من الأصليات.'
          },
          {
            why: 'Bandwidth determines egress cost and CDN sizing.',
            how: 'Write: 23/sec × 3MB ≈ 69 MB/sec ≈ 550 Mbps. Read: 100x = 55 Gbps from origin, but CDN absorbs 95%+.',
            tradeoffs: 'CDN costs more but reduces origin load and improves user latency.',
            examples: 'CloudFront egress ≈ $0.085/GB. With 95% cache hit, origin egress drops 20x.',
            mistakes: 'Common mistake: Calculating read bandwidth without CDN, or forgetting thumbnails are smaller than originals.'
          }
        ),
      ],
    },
    {
      id: 'architecture',
      title: { ar: 'الأركيتكتشر العامة', en: 'High-Level Architecture' },
      shortTitle: { ar: 'الأركيتكتشر', en: 'Architecture' },
      prompt: {
        ar: 'اوصف الأركيتكتشر من لحظة ما اليوزر يرفع الصورة لحد ما اليوزرز التانيين يقدروا يشوفوها. فصّل المكونات وشرح طريق الرفع وطريق القراءة.',
        en: 'Describe the architecture from when a user uploads an image until other users can view it. Detail the components and explain the upload and read paths.'
      },
      level: 'senior',
      items: [
        item(
          '📊 الرسم التخطيطي للأركيتكتشر المقترحة (شوف الرسم أسفل النقط)',
          '📊 Proposed Architecture Diagram (see diagram below the checklist)',
          {
            why: 'الرسم بيوضح الـ flow كامل ويساعد الإنترفيور يفهم تصميمك بسرعة.',
            how: 'User → LB → API (presigned URL) → User uploads to S3 → S3 event → Queue → Workers → Thumbnails → CDN → Viewers',
            tradeoffs: 'رسم مفصل بياخد وقت، رسم بسيط ممكن يفوّت تفاصيل مهمة. اعمل balance.',
            examples: 'الرسم لازم يوضح: الـ upload path، الـ processing path، والـ read path منفصلين.',
            mistakes: 'خطأ شائع: ترسم كل حاجة في خط واحد من غير ما تفصل الـ paths.'
          },
          {
            why: 'The diagram shows the complete flow and helps the interviewer understand your design quickly.',
            how: 'User → LB → API (presigned URL) → User uploads to S3 → S3 event → Queue → Workers → Thumbnails → CDN → Viewers',
            tradeoffs: 'Detailed diagram takes time; simple diagram may miss important details. Find balance.',
            examples: 'Diagram should show: upload path, processing path, and read path separately.',
            mistakes: 'Common mistake: Drawing everything in one line without separating paths.'
          }
        ),
        item(
          'فصلت الرفع عن المعالجة: طريق الـ upload غير طريق الـ resize',
          'Separated upload from processing: upload path is different from resize path',
          {
            why: 'الفصل بيخلي كل جزء يتكبّر لوحده، والـ user مش مستني الـ resize يخلص عشان يشوف رد.',
            how: 'الـ upload بيرجع success فورًا بعد ما الصورة توصل S3. الـ resize بيحصل async في الـ background.',
            tradeoffs: 'الـ user ممكن يشوف placeholder لحد ما الـ thumbnails تجهز. ده acceptable لـ social media.',
            examples: 'Instagram وTwitter بيعملوا كده: الصورة ترفع، وتشوف spinner لثواني، وبعدين الـ thumbnails تظهر.',
            mistakes: 'خطأ شائع: تخلي الـ API تعمل resize synchronously، ده بيبطّئ الـ upload ويضغط على الـ API servers.'
          },
          {
            why: 'Separation allows each part to scale independently, and users do not wait for resize to get a response.',
            how: 'Upload returns success immediately after image reaches S3. Resize happens async in background.',
            tradeoffs: 'User may see placeholder until thumbnails are ready. This is acceptable for social media.',
            examples: 'Instagram and Twitter do this: image uploads, you see a spinner for seconds, then thumbnails appear.',
            mistakes: 'Common mistake: Making API resize synchronously, which slows uploads and stresses API servers.'
          }
        ),
        item(
          'اليوزر بيرفع على طول لـ object storage زي S3 بـ presigned URL، من غير ما الملف يعدي على الـ API server',
          'User uploads directly to object storage like S3 using presigned URL, file does not pass through API server',
          {
            why: 'الـ direct upload بيقلل الـ load على الـ API servers ويوفر bandwidth وcompute.',
            how: 'API بتعمل presigned URL صالح لدقايق، اليوزر بيرفع مباشرة لـ S3، S3 بيبعت event بعد الرفع.',
            tradeoffs: 'محتاج تتأكد إن الـ presigned URL آمن ومحدود الصلاحية. ومحتاج تـ validate الصورة بعد الرفع.',
            examples: 'AWS S3 presigned URLs، GCS signed URLs، Azure SAS tokens. كلهم بيدعموا ده.',
            mistakes: 'خطأ شائع: تخلي الصورة تعدي على الـ API server (proxy)، ده بياكل CPU وmemory وbandwidth.'
          },
          {
            why: 'Direct upload reduces load on API servers and saves bandwidth and compute.',
            how: 'API creates presigned URL valid for minutes, user uploads directly to S3, S3 sends event after upload.',
            tradeoffs: 'Need to ensure presigned URL is secure and time-limited. Need to validate image after upload.',
            examples: 'AWS S3 presigned URLs, GCS signed URLs, Azure SAS tokens. All support this.',
            mistakes: 'Common mistake: Proxying image through API server, which consumes CPU, memory, and bandwidth.'
          }
        ),
        item(
          'بعد الرفع يتبعت job في queue',
          'After upload, a job is sent to a queue',
          {
            why: 'الـ queue بتفصل الـ upload عن الـ processing وبتسمح بـ retry وتوزيع الشغل على workers.',
            how: 'S3 event notification → SQS/Kafka → Workers بتاخد jobs من الـ queue وتعمل resize.',
            tradeoffs: 'Queue بتضيف latency بسيط (milliseconds)، بس بتدّي reliability وdecoupling.',
            examples: 'SQS Standard queue، أو Kafka topic. الاتنين بيشتغلوا كويس هنا.',
            mistakes: 'خطأ شائع: تنسى الـ dead letter queue للـ jobs اللي بتفشل، أو تحط الـ job في الـ queue قبل ما الصورة توصل S3.'
          },
          {
            why: 'Queue decouples upload from processing and allows retry and work distribution across workers.',
            how: 'S3 event notification → SQS/Kafka → Workers take jobs from queue and resize.',
            tradeoffs: 'Queue adds slight latency (milliseconds), but provides reliability and decoupling.',
            examples: 'SQS Standard queue, or Kafka topic. Both work well here.',
            mistakes: 'Common mistake: Forgetting dead letter queue for failed jobs, or putting job in queue before image reaches S3.'
          }
        ),
        item(
          'workers منفصلين بيعملوا الـ resize للتلات مقاسات: small وmedium وlarge',
          'Separate workers do the resize for three sizes: small, medium, and large',
          {
            why: 'الـ workers المنفصلين بيتكبّروا بناءً على الـ queue depth، مش مربوطين بالـ API.',
            how: 'كل worker بياخد job، يحمّل الصورة من S3، يعمل resize لتلات مقاسات، ويرفعهم لـ thumbnails bucket.',
            tradeoffs: 'ممكن تعمل الـ 3 مقاسات في job واحد أو 3 jobs منفصلة. الـ job الواحد أبسط بس أقل parallelism.',
            examples: 'مقاسات نموذجية: 150×150 (small), 600×600 (medium), 1200×1200 (large). ImageMagick أو Sharp للـ resize.',
            mistakes: 'خطأ شائع: تعمل resize في memory من غير limit، ده بيسبب OOM على الصور الكبيرة.'
          },
          {
            why: 'Separate workers scale based on queue depth, not tied to API.',
            how: 'Each worker takes a job, downloads image from S3, resizes to three sizes, uploads to thumbnails bucket.',
            tradeoffs: 'Can do 3 sizes in one job or 3 separate jobs. Single job is simpler but less parallelism.',
            examples: 'Typical sizes: 150×150 (small), 600×600 (medium), 1200×1200 (large). Use ImageMagick or Sharp for resize.',
            mistakes: 'Common mistake: Resizing in memory without limit, causing OOM on large images.'
          }
        ),
        item(
          'الـ metadata في database: معرّف الصورة، المالك، حالة المعالجة، وروابط المقاسات',
          'Metadata in database: image ID, owner, processing status, and thumbnail URLs',
          {
            why: 'الـ metadata بتسمح بالبحث والفلترة وتتبع حالة الصورة.',
            how: 'جدول images: id, user_id, original_url, status (pending/processing/ready/failed), created_at, plus thumbnail_urls JSON.',
            tradeoffs: 'SQL أسهل للـ queries بس أصعب في الـ scale. NoSQL أسهل في الـ scale بس أصعب في الـ queries.',
            examples: 'PostgreSQL مع read replicas، أو DynamoDB لو محتاج scale أكبر.',
            mistakes: 'خطأ شائع: تخزن الـ URLs في columns منفصلة بدل JSON، أو تنسى تحدّث الـ status بعد الـ resize.'
          },
          {
            why: 'Metadata allows search, filtering, and tracking image status.',
            how: 'images table: id, user_id, original_url, status (pending/processing/ready/failed), created_at, plus thumbnail_urls JSON.',
            tradeoffs: 'SQL easier for queries but harder to scale. NoSQL easier to scale but harder for queries.',
            examples: 'PostgreSQL with read replicas, or DynamoDB if you need larger scale.',
            mistakes: 'Common mistake: Storing URLs in separate columns instead of JSON, or forgetting to update status after resize.'
          }
        ),
        item(
          'القراءة بتعدي على CDN وcache',
          'Reads go through CDN and cache',
          {
            why: 'الـ CDN بيقلل الـ latency للـ users ويقلل الـ load على الـ origin.',
            how: 'CloudFront/CloudFlare أمام الـ thumbnails bucket. الـ metadata ممكن تتـ cache في Redis.',
            tradeoffs: 'CDN cache invalidation ممكن تكون بطيئة. لو الصورة اتعدّلت، اليوزر ممكن يشوف القديمة لشوية.',
            examples: 'CloudFront مع TTL ساعة للـ thumbnails. Redis cache للـ metadata بـ TTL 5 دقايق.',
            mistakes: 'خطأ شائع: تنسى تحط CDN، أو تحط TTL طويل قوي فتفقد القدرة على التحديث.'
          },
          {
            why: 'CDN reduces latency for users and reduces load on origin.',
            how: 'CloudFront/CloudFlare in front of thumbnails bucket. Metadata can be cached in Redis.',
            tradeoffs: 'CDN cache invalidation can be slow. If image is updated, user may see old version briefly.',
            examples: 'CloudFront with 1-hour TTL for thumbnails. Redis cache for metadata with 5-min TTL.',
            mistakes: 'Common mistake: Forgetting CDN, or setting TTL too long and losing ability to update.'
          }
        ),
      ],
    },
    {
      id: 'scaling',
      title: { ar: 'الـ Horizontal Scaling', en: 'Horizontal Scaling' },
      shortTitle: { ar: 'الـ Scaling', en: 'Scaling' },
      prompt: {
        ar: 'لو الترافيك زاد أو اتضاعف في أوقات الذروة، السيستم هيكبر إزاي من غير ما يقع؟ اشرح السكيل الأفقي لكل جزء مهم.',
        en: 'If traffic increases or doubles at peak times, how will the system scale without crashing? Explain horizontal scaling for each important component.'
      },
      level: 'senior',
      items: [
        item(
          'سيرفرات الـ API تكون stateless ووراها load balancer',
          'API servers are stateless with load balancer in front',
          {
            why: 'Stateless servers بتسمح بإضافة servers جديدة بسهولة من غير migration أو session management.',
            how: 'كل الـ state في الـ database وS3. الـ API server بيعمل authentication ويرجع presigned URL بس.',
            tradeoffs: 'Stateless أبسط بس محتاج external state store (Redis/DB). Stateful أسرع بس أصعب في الـ scaling.',
            examples: 'ALB على AWS، أو Nginx/HAProxy. Auto Scaling Group بيزوّد servers لما الـ CPU > 70%.',
            mistakes: 'خطأ شائع: تخزن session في memory على الـ server، ده بيكسر الـ scaling.'
          },
          {
            why: 'Stateless servers allow adding new servers easily without migration or session management.',
            how: 'All state is in database and S3. API server just does authentication and returns presigned URL.',
            tradeoffs: 'Stateless is simpler but needs external state store (Redis/DB). Stateful is faster but harder to scale.',
            examples: 'ALB on AWS, or Nginx/HAProxy. Auto Scaling Group adds servers when CPU > 70%.',
            mistakes: 'Common mistake: Storing session in memory on server, which breaks scaling.'
          }
        ),
        item(
          'الـ workers يزيدوا بـ autoscaling',
          'Workers increase with autoscaling',
          {
            why: 'الـ workers هي أكتر حاجة بتاكل compute، لازم تزيد وتقل حسب الـ load.',
            how: 'Auto Scaling Group أو Kubernetes HPA. بتتابع الـ queue depth والـ CPU.',
            tradeoffs: 'Autoscaling بياخد وقت (1-2 دقيقة). لو الـ spike سريع، محتاج buffer أو provisioned capacity.',
            examples: 'AWS Auto Scaling، K8s HPA. ممكن تستخدم Lambda أو Fargate للـ workers.',
            mistakes: 'خطأ شائع: تعتمد على CPU scaling بس من غير queue depth، ده مش بيتفاعل سريع.'
          },
          {
            why: 'Workers consume the most compute, they need to increase and decrease based on load.',
            how: 'Auto Scaling Group or Kubernetes HPA. Monitor queue depth and CPU.',
            tradeoffs: 'Autoscaling takes time (1-2 min). If spike is fast, need buffer or provisioned capacity.',
            examples: 'AWS Auto Scaling, K8s HPA. Can use Lambda or Fargate for workers.',
            mistakes: 'Common mistake: Relying on CPU scaling only without queue depth, which does not react quickly.'
          }
        ),
        item(
          'سكيل الـ workers مربوط بطول الـ queue، مش بس باستهلاك الـ CPU',
          'Worker scaling is tied to queue length, not just CPU usage',
          {
            why: 'الـ queue length بيوريك الـ backlog. الـ CPU ممكن يكون عالي والـ queue فاضية، أو العكس.',
            how: 'Custom metric: ApproximateNumberOfMessages من SQS → CloudWatch → Auto Scaling.',
            tradeoffs: 'Queue-based scaling أسرع في الاستجابة بس محتاج setup أكتر.',
            examples: 'Scale up لما الـ queue > 1000. Scale down لما < 100 لمدة 5 دقايق.',
            mistakes: 'خطأ شائع: تـ scale على الـ CPU بس، الـ workers ممكن تكون idle بس الـ queue متراكمة.'
          },
          {
            why: 'Queue length shows backlog. CPU may be high with empty queue, or vice versa.',
            how: 'Custom metric: ApproximateNumberOfMessages from SQS → CloudWatch → Auto Scaling.',
            tradeoffs: 'Queue-based scaling is faster to respond but needs more setup.',
            examples: 'Scale up when queue > 1000. Scale down when < 100 for 5 minutes.',
            mistakes: 'Common mistake: Scaling on CPU only, workers may be idle but queue is backing up.'
          }
        ),
        item(
          'الـ object storage والـ CDN يشيلوا القراءة العالية',
          'Object storage and CDN handle high read load',
          {
            why: 'S3 والـ CDN مصممين للـ high throughput، مش محتاج تـ scale بنفسك.',
            how: 'S3 بيستحمل آلاف الـ requests/sec. الـ CDN بيمتص 95%+ من القراءة.',
            tradeoffs: 'الـ CDN بيكلّف على الـ egress، بس بيوفر على الـ origin.',
            examples: 'S3: 3500 PUT/sec + 5500 GET/sec per prefix. CloudFront: practically unlimited.',
            mistakes: 'خطأ شائع: تحط كل الصور في prefix واحد، ده ممكن يعمل throttling على S3.'
          },
          {
            why: 'S3 and CDN are designed for high throughput, you do not need to scale them yourself.',
            how: 'S3 handles thousands of requests/sec. CDN absorbs 95%+ of reads.',
            tradeoffs: 'CDN costs on egress, but saves on origin.',
            examples: 'S3: 3500 PUT/sec + 5500 GET/sec per prefix. CloudFront: practically unlimited.',
            mistakes: 'Common mistake: Putting all images in one prefix, which can throttle S3.'
          }
        ),
        item(
          'الـ database تقدر تكبر في القراءة بـ read replicas، ومع الوقت بـ sharding لو لزم',
          'Database can scale reads with read replicas, and later with sharding if needed',
          {
            why: 'الـ metadata queries محتاجة database، لازم تـ scale معاها.',
            how: 'Read replicas للقراءة، الـ primary للكتابة. لو كبرت قوي، shard بالـ user_id.',
            tradeoffs: 'Replicas بتضيف replication lag (ms to sec). Sharding معقد ومحتاج careful planning.',
            examples: 'Aurora read replicas، أو DynamoDB global tables للـ multi-region.',
            mistakes: 'خطأ شائع: تبدأ بـ sharding من الأول، ده over-engineering. الـ replicas كافية في البداية.'
          },
          {
            why: 'Metadata queries need database, must scale with it.',
            how: 'Read replicas for reads, primary for writes. If it grows too much, shard by user_id.',
            tradeoffs: 'Replicas add replication lag (ms to sec). Sharding is complex and needs careful planning.',
            examples: 'Aurora read replicas, or DynamoDB global tables for multi-region.',
            mistakes: 'Common mistake: Starting with sharding from the beginning, which is over-engineering. Replicas are enough initially.'
          }
        ),
      ],
    },
    {
      id: 'monitoring',
      title: { ar: 'المراقبة والـ Observability', en: 'Monitoring & Observability' },
      shortTitle: { ar: 'المراقبة', en: 'Monitoring' },
      prompt: {
        ar: 'هتراقب إيه، وهتعرف منين إن في مشكلة، وهتنبّه الفريق إزاي؟ اتكلم عن الـ metrics والـ logs والـ tracing والـ alerts.',
        en: 'What will you monitor, how will you know there is a problem, and how will you alert the team? Talk about metrics, logs, tracing, and alerts.'
      },
      level: 'senior',
      items: [
        item(
          'Metrics أساسية: latency وerror rate وthroughput',
          'Core metrics: latency, error rate, and throughput',
          {
            why: 'دي الـ golden signals اللي بتوريك صحة السيستم. أي مشكلة هتظهر في واحدة منهم.',
            how: 'Prometheus + Grafana، أو CloudWatch. بتجمع metrics من كل service.',
            tradeoffs: 'Metrics كتير بتاكل storage وبتصعّب الـ debugging. ركّز على اللي بيهمك.',
            examples: 'API latency p50/p99، error rate %، uploads/sec، thumbnails generated/sec.',
            mistakes: 'خطأ شائع: تتابع averages بس من غير percentiles، الـ p99 ممكن يكون سيء والـ average كويس.'
          },
          {
            why: 'These are golden signals showing system health. Any problem will show in one of them.',
            how: 'Prometheus + Grafana, or CloudWatch. Collect metrics from every service.',
            tradeoffs: 'Too many metrics consume storage and complicate debugging. Focus on what matters.',
            examples: 'API latency p50/p99, error rate %, uploads/sec, thumbnails generated/sec.',
            mistakes: 'Common mistake: Tracking only averages without percentiles, p99 may be bad while average is good.'
          }
        ),
        item(
          'طول الـ queue وعمر أقدم رسالة فيها',
          'Queue length and age of oldest message',
          {
            why: 'الـ queue هي المؤشر الأول على تراكم الشغل. لو بتكبر، محتاج workers أكتر.',
            how: 'SQS metrics: ApproximateNumberOfMessages, ApproximateAgeOfOldestMessage.',
            tradeoffs: 'Queue طويلة مؤقتًا مش مشكلة (spike). المشكلة لو بتفضل تكبر.',
            examples: 'Alert لما عمر أقدم رسالة > 5 دقايق، أو الـ queue > 10K messages.',
            mistakes: 'خطأ شائع: تتابع الـ queue length بس من غير عمر الرسالة، ممكن الـ queue صغيرة بس الرسايل قاعدة من زمان.'
          },
          {
            why: 'Queue is first indicator of backlog. If growing, need more workers.',
            how: 'SQS metrics: ApproximateNumberOfMessages, ApproximateAgeOfOldestMessage.',
            tradeoffs: 'Temporarily long queue is not a problem (spike). Problem is if it keeps growing.',
            examples: 'Alert when oldest message age > 5 min, or queue > 10K messages.',
            mistakes: 'Common mistake: Tracking queue length only without message age, queue may be small but messages are old.'
          }
        ),
        item(
          'استهلاك CPU وmemory في الـ workers',
          'CPU and memory usage in workers',
          {
            why: 'الـ resize بياكل CPU وmemory. لو وصلوا limits، الـ workers هتبطّئ أو تقع.',
            how: 'Container metrics، أو CloudWatch agent. بتجمعهم per worker وper fleet.',
            tradeoffs: 'High CPU usage = good utilization. High memory usage = risk of OOM.',
            examples: 'Alert لما memory > 80% sustained، أو CPU > 90% ومفيش scaling.',
            mistakes: 'خطأ شائع: تتابع averages across fleet بس، worker واحد ممكن يكون بيموت والباقي كويس.'
          },
          {
            why: 'Resize consumes CPU and memory. If they hit limits, workers will slow down or crash.',
            how: 'Container metrics, or CloudWatch agent. Collect per worker and per fleet.',
            tradeoffs: 'High CPU usage = good utilization. High memory usage = risk of OOM.',
            examples: 'Alert when memory > 80% sustained, or CPU > 90% and no scaling.',
            mistakes: 'Common mistake: Tracking only averages across fleet, one worker may be dying while others are fine.'
          }
        ),
        item(
          'نسبة الـ cache hit في الـ CDN',
          'CDN cache hit ratio',
          {
            why: 'Cache hit ratio عالي = latency أقل وcost أقل. لو بينزل، في مشكلة.',
            how: 'CloudFront access logs، أو realtime metrics. بتجمعهم per distribution.',
            tradeoffs: 'High cache hit = good. Low cache hit for new content is expected.',
            examples: 'Target: > 95% cache hit. Alert لما ينزل < 80% لفترة.',
            mistakes: 'خطأ شائع: تعتبر أي cache miss مشكلة، بعض الـ content جديد وطبيعي يكون miss.'
          },
          {
            why: 'High cache hit ratio = lower latency and cost. If dropping, there is a problem.',
            how: 'CloudFront access logs, or realtime metrics. Collect per distribution.',
            tradeoffs: 'High cache hit = good. Low cache hit for new content is expected.',
            examples: 'Target: > 95% cache hit. Alert when < 80% for a period.',
            mistakes: 'Common mistake: Treating any cache miss as a problem, some content is new and miss is expected.'
          }
        ),
        item(
          'Logs وdistributed tracing بيربطوا الـ request من الرفع لحد ما الـ thumbnail يجهز',
          'Logs and distributed tracing link request from upload to thumbnail ready',
          {
            why: 'لو حصلت مشكلة، محتاج تتبع الـ request كله عبر services مختلفة.',
            how: 'Correlation ID بيتبعت مع كل request وكل job. X-Ray أو Jaeger للـ tracing.',
            tradeoffs: 'Full tracing بياكل storage. Sample 1-10% للـ production.',
            examples: 'Upload ID = trace ID. كل log entry فيها الـ ID ده.',
            mistakes: 'خطأ شائع: logs من غير correlation ID، مش هتقدر تربط الـ upload بالـ resize بالـ result.'
          },
          {
            why: 'If problem occurs, need to trace whole request across different services.',
            how: 'Correlation ID sent with every request and job. X-Ray or Jaeger for tracing.',
            tradeoffs: 'Full tracing consumes storage. Sample 1-10% for production.',
            examples: 'Upload ID = trace ID. Every log entry includes this ID.',
            mistakes: 'Common mistake: Logs without correlation ID, cannot link upload to resize to result.'
          }
        ),
        item(
          'Alerts مبنية على أهداف واضحة (SLOs)، زي رد الرفع أقل من ثانيتين وجهوزية الـ thumbnails خلال 10 ثواني',
          'Alerts based on clear SLOs, like upload response < 2s and thumbnail ready within 10s',
          {
            why: 'SLOs بتحدد "إيه معنى السيستم شغال كويس". الـ alerts بتتبنى عليها.',
            how: 'SLO: 99.9% uploads respond < 2s. SLO: 99% thumbnails ready < 10s. Alert عند breach.',
            tradeoffs: 'SLOs صارمة = alerts كتير. SLOs مرنة = ممكن تفوّت مشاكل حقيقية.',
            examples: 'Error budget: 0.1% errors/month. لو استهلكته، stop deployments.',
            mistakes: 'خطأ شائع: alerts على كل error من غير SLO، هتتعب من alert fatigue.'
          },
          {
            why: 'SLOs define "what does system working well mean". Alerts are built on them.',
            how: 'SLO: 99.9% uploads respond < 2s. SLO: 99% thumbnails ready < 10s. Alert on breach.',
            tradeoffs: 'Strict SLOs = many alerts. Loose SLOs = may miss real problems.',
            examples: 'Error budget: 0.1% errors/month. If consumed, stop deployments.',
            mistakes: 'Common mistake: Alerting on every error without SLO, you will suffer from alert fatigue.'
          }
        ),
      ],
    },
    {
      id: 'bottlenecks',
      title: { ar: 'الاختناقات', en: 'Bottlenecks' },
      shortTitle: { ar: 'الاختناقات', en: 'Bottlenecks' },
      prompt: {
        ar: 'إيه الأماكن اللي متوقع تبقى عنق زجاجة: CPU، وmemory، وI/O، وnetwork، وdatabase، وتراكم الـ queue؟ وهتحل كل واحدة إزاي؟',
        en: 'What are the expected bottlenecks: CPU, memory, I/O, network, database, and queue backlog? How will you solve each one?'
      },
      level: 'senior',
      items: [
        item(
          'الـ resize بياكل CPU وmemory، خصوصًا الصور الكبيرة: حد أقصى لحجم الصورة، وlimit لعدد الـ jobs المتزامنة على كل worker',
          'Resize consumes CPU and memory, especially large images: max image size limit, and limit concurrent jobs per worker',
          {
            why: 'الصور الكبيرة (10MB+) ممكن تاكل gigabytes من الـ memory أثناء الـ decode والـ resize.',
            how: 'Limit: 20MB max upload، 10K×10K max dimensions. Max 2 concurrent jobs per worker.',
            tradeoffs: 'Limits بتحمي السيستم بس بتزعل users اللي عايزين يرفعوا صور ضخمة.',
            examples: 'Instagram max 30MB، Twitter max 5MB per image.',
            mistakes: 'خطأ شائع: مفيش limit، user يرفع صورة 100MB وتقع كل الـ workers.'
          },
          {
            why: 'Large images (10MB+) can consume gigabytes of memory during decode and resize.',
            how: 'Limit: 20MB max upload, 10K×10K max dimensions. Max 2 concurrent jobs per worker.',
            tradeoffs: 'Limits protect system but upset users wanting to upload huge images.',
            examples: 'Instagram max 30MB, Twitter max 5MB per image.',
            mistakes: 'Common mistake: No limit, user uploads 100MB image and all workers crash.'
          }
        ),
        item(
          'الرفع تقيل على الـ network وI/O: الحل إن الرفع يبقى direct بـ presigned URL',
          'Upload is heavy on network and I/O: solution is direct upload with presigned URL',
          {
            why: 'لو الصور تعدي على الـ API، كل 3MB upload هيشغل connection وbandwidth.',
            how: 'API بترجع presigned URL بس (~100 bytes)، الـ upload بيروح direct لـ S3.',
            tradeoffs: 'Direct upload محتاج client-side logic أكتر، بس بيوفر server resources.',
            examples: 'AWS SDK for JS، أو simple fetch() للـ PUT على الـ presigned URL.',
            mistakes: 'خطأ شائع: proxy الـ upload من خلال الـ API، ده بيقتل الـ throughput.'
          },
          {
            why: 'If images pass through API, each 3MB upload occupies connection and bandwidth.',
            how: 'API returns only presigned URL (~100 bytes), upload goes directly to S3.',
            tradeoffs: 'Direct upload needs more client-side logic, but saves server resources.',
            examples: 'AWS SDK for JS, or simple fetch() for PUT on presigned URL.',
            mistakes: 'Common mistake: Proxying upload through API, which kills throughput.'
          }
        ),
        item(
          'الـ database ممكن تتعب في القراءة: cache، وread replicas، وsharding لو كبرت قوي',
          'Database may struggle with reads: cache, read replicas, and sharding if it grows too much',
          {
            why: 'كل page view بيحتاج metadata query. 100:1 read ratio = ملايين queries/day.',
            how: 'Redis cache للـ hot metadata (TTL 5 min). Read replicas للباقي. Shard لو > 1TB data.',
            tradeoffs: 'Cache بيضيف complexity (invalidation). Replicas بتضيف lag. Sharding معقد.',
            examples: 'ElastiCache Redis، Aurora read replicas. DynamoDB auto-shards.',
            mistakes: 'خطأ شائع: تقرا كل metadata من الـ primary، ده بيحمّل الـ database فوق طاقتها.'
          },
          {
            why: 'Every page view needs metadata query. 100:1 read ratio = millions of queries/day.',
            how: 'Redis cache for hot metadata (TTL 5 min). Read replicas for the rest. Shard if > 1TB data.',
            tradeoffs: 'Cache adds complexity (invalidation). Replicas add lag. Sharding is complex.',
            examples: 'ElastiCache Redis, Aurora read replicas. DynamoDB auto-shards.',
            mistakes: 'Common mistake: Reading all metadata from primary, overloading the database.'
          }
        ),
        item(
          'تراكم الـ queue: autoscaling للـ workers، وretry بـ backoff، وdead letter queue للجوبز اللي بتفشل',
          'Queue backlog: autoscaling for workers, retry with backoff, and dead letter queue for failing jobs',
          {
            why: 'الـ queue بتتراكم لو الـ workers مش كفاية، أو لو الـ jobs بتفشل وتترجع كتير.',
            how: 'Autoscale on queue depth. Exponential backoff (1s, 2s, 4s, 8s). DLQ after 5 failures.',
            tradeoffs: 'Aggressive retry بتاكل resources. DLQ بتفقد jobs، محتاج manual intervention.',
            examples: 'SQS retry policy + DLQ. Lambda automatic retry.',
            mistakes: 'خطأ شائع: immediate retry بدون backoff، ده بيزود الـ load على system متعب أصلاً.'
          },
          {
            why: 'Queue backs up if workers are not enough, or if jobs fail and retry too much.',
            how: 'Autoscale on queue depth. Exponential backoff (1s, 2s, 4s, 8s). DLQ after 5 failures.',
            tradeoffs: 'Aggressive retry consumes resources. DLQ loses jobs, needs manual intervention.',
            examples: 'SQS retry policy + DLQ. Lambda automatic retry.',
            mistakes: 'Common mistake: Immediate retry without backoff, adding load to already stressed system.'
          }
        ),
      ],
    },
    {
      id: 'tradeoffs',
      title: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
      shortTitle: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
      prompt: {
        ar: 'إيه القرارات اللي فيها تنازل، وليه اخترت اللي اخترته؟ اشرح وجه كل اختيار والبديل بتاعه.',
        en: 'What decisions involve trade-offs, and why did you choose what you chose? Explain each choice and its alternative.'
      },
      level: 'senior',
      items: [
        item(
          'المعالجة مقدّمًا ولا وقت الطلب: eager thumbnails قصاد on-demand',
          'Processing upfront vs on-demand: eager thumbnails vs on-demand',
          {
            why: 'ده أهم trade-off في السيستم. بيحدد الـ latency والـ cost والـ complexity.',
            how: 'Eager: resize كل الصور فورًا. On-demand: resize أول ما حد يطلب.',
            tradeoffs: 'Eager: cost أعلى (تخزين 3 sizes)، latency أقل في القراءة. On-demand: cost أقل، latency أعلى أول مرة.',
            examples: 'Instagram uses eager. Some image services use on-demand + cache (imgix).',
            mistakes: 'خطأ شائع: تقول "الاتنين كويسين" من غير ما تختار وتبرر.'
          },
          {
            why: 'This is the most important trade-off. Determines latency, cost, and complexity.',
            how: 'Eager: resize all images immediately. On-demand: resize when someone requests.',
            tradeoffs: 'Eager: higher cost (store 3 sizes), lower read latency. On-demand: lower cost, higher latency first time.',
            examples: 'Instagram uses eager. Some image services use on-demand + cache (imgix).',
            mistakes: 'Common mistake: Saying "both are good" without choosing and justifying.'
          }
        ),
        item(
          'الـ consistency: إيه اللي يحصل لو اليوزر طلب الصورة قبل ما الـ thumbnail يجهز',
          'Consistency: what happens if user requests image before thumbnail is ready',
          {
            why: 'في window صغيرة بين الـ upload والـ thumbnail ready. اليوزر ممكن يشوف الصفحة في الوقت ده.',
            how: 'خيارات: 404، placeholder، الصورة الأصلية، أو polling حتى تجهز.',
            tradeoffs: '404 بتزعج. Placeholder أحسن UX. Original بتاكل bandwidth.',
            examples: 'Instagram بيوري spinner، Twitter بيوري placeholder رمادي.',
            mistakes: 'خطأ شائع: ترجع 500 error، ده بيخلي اليوزر يفتكر السيستم واقع.'
          },
          {
            why: 'There is a small window between upload and thumbnail ready. User may view page then.',
            how: 'Options: 404, placeholder, original image, or polling until ready.',
            tradeoffs: '404 is annoying. Placeholder is better UX. Original consumes bandwidth.',
            examples: 'Instagram shows spinner, Twitter shows gray placeholder.',
            mistakes: 'Common mistake: Returning 500 error, making user think system is down.'
          }
        ),
        item(
          'التكلفة مقابل السرعة في التخزين والـ CDN',
          'Cost vs speed in storage and CDN',
          {
            why: 'ممكن توفر فلوس بـ cold storage أو أقل CDN، بس هتخسر performance.',
            how: 'Hot storage للصور الجديدة (< 30 days)، cold للقديمة. CDN للـ popular content.',
            tradeoffs: 'S3 Standard vs Glacier: 10x cost difference، بس Glacier بياخد ساعات للـ retrieval.',
            examples: 'صورة عمرها سنة وطلبات < 1/month → Glacier. صورة viral → S3 + CloudFront.',
            mistakes: 'خطأ شائع: تحط كل حاجة على أرخص storage، الـ users بيشتكوا من البطء.'
          },
          {
            why: 'Can save money with cold storage or less CDN, but lose performance.',
            how: 'Hot storage for new images (< 30 days), cold for old. CDN for popular content.',
            tradeoffs: 'S3 Standard vs Glacier: 10x cost difference, but Glacier takes hours for retrieval.',
            examples: 'Image 1 year old with < 1 request/month → Glacier. Viral image → S3 + CloudFront.',
            mistakes: 'Common mistake: Putting everything on cheapest storage, users complain about slowness.'
          }
        ),
        item(
          'السكيل على الـ CPU مقابل السكيل على طول الـ queue',
          'Scaling on CPU vs scaling on queue length',
          {
            why: 'الـ scaling trigger بيحدد قد إيه السيستم بيستجيب سريع للـ load.',
            how: 'CPU scaling: بيزود workers لما CPU > 70%. Queue scaling: بيزود لما queue > 1000.',
            tradeoffs: 'CPU scaling أبسط بس أبطأ. Queue scaling أسرع بس محتاج custom metrics.',
            examples: 'الأفضل: combine الاتنين. Scale up على queue depth، scale down على CPU.',
            mistakes: 'خطأ شائع: تعتمد على واحد بس. CPU ممكن يكون 20% والـ queue متراكمة.'
          },
          {
            why: 'Scaling trigger determines how fast system responds to load.',
            how: 'CPU scaling: adds workers when CPU > 70%. Queue scaling: adds when queue > 1000.',
            tradeoffs: 'CPU scaling is simpler but slower. Queue scaling is faster but needs custom metrics.',
            examples: 'Best: combine both. Scale up on queue depth, scale down on CPU.',
            mistakes: 'Common mistake: Relying on only one. CPU may be 20% while queue is backing up.'
          }
        ),
      ],
    },
    {
      id: 'followup1',
      title: { ar: 'سؤال متابعة: تراكم الـ Queue', en: 'Follow-up: Queue Backlog' },
      shortTitle: { ar: 'تراكم الـ Queue', en: 'Queue Backlog' },
      prompt: {
        ar: 'لو فجأة طول الـ queue بقى بيزيد بسرعة، ووقت تجهيز الـ thumbnails وصل خمس دقايق، هتعمل إيه خطوة بخطوة عشان تعرف السبب وتحله؟',
        en: 'If suddenly the queue length is increasing rapidly and thumbnail processing time reached five minutes, what would you do step by step to find the cause and fix it?'
      },
      level: 'senior',
      items: [
        item(
          'بتبدأ بالـ metrics: طول الـ queue، عمر أقدم رسالة، معدل دخول الجوبز مقابل معدل خروجها، وCPU/memory للـ workers، والـ error rate',
          'Start with metrics: queue length, oldest message age, job in-rate vs out-rate, worker CPU/memory, and error rate',
          {
            why: 'الـ metrics بتوريك مكان المشكلة بالظبط: هل الدخل زاد، ولا الخروج قل، ولا في errors.',
            how: 'Dashboard فيه: queue depth chart، jobs/sec in vs out، worker CPU/memory، error count.',
            tradeoffs: 'Metrics كتير بتشتت. ركّز على الـ key indicators الأول.',
            examples: 'CloudWatch dashboard، Grafana، Datadog. Alert على الـ anomalies.',
            mistakes: 'خطأ شائع: تبدأ تغيّر config من غير ما تشوف الـ metrics الأول.'
          },
          {
            why: 'Metrics show exactly where the problem is: is input increasing, output decreasing, or errors.',
            how: 'Dashboard with: queue depth chart, jobs/sec in vs out, worker CPU/memory, error count.',
            tradeoffs: 'Too many metrics are distracting. Focus on key indicators first.',
            examples: 'CloudWatch dashboard, Grafana, Datadog. Alert on anomalies.',
            mistakes: 'Common mistake: Starting to change config without looking at metrics first.'
          }
        ),
        item(
          'بتفرّق: هل الدخل زاد (زيادة ترافيك) ولا الـ workers بقوا أبطأ أو واقعين',
          'Differentiate: did input increase (traffic spike) or workers became slower or crashed',
          {
            why: 'السبب بيحدد الحل. لو الدخل زاد، محتاج workers أكتر. لو الـ workers بطيئين، محتاج تعرف ليه.',
            how: 'قارن jobs/sec in (من SQS) بـ jobs/sec out (من workers). شوف worker health.',
            tradeoffs: 'الـ diagnosis بياخد وقت، بس أحسن من إنك تحل المشكلة الغلط.',
            examples: 'Traffic spike: in-rate 2x normal. Worker issue: out-rate 50% normal, errors up.',
            mistakes: 'خطأ شائع: تفترض إن الترافيك زاد من غير ما تتأكد.'
          },
          {
            why: 'Cause determines solution. If input increased, need more workers. If workers are slow, need to know why.',
            how: 'Compare jobs/sec in (from SQS) to jobs/sec out (from workers). Check worker health.',
            tradeoffs: 'Diagnosis takes time, but better than solving wrong problem.',
            examples: 'Traffic spike: in-rate 2x normal. Worker issue: out-rate 50% normal, errors up.',
            mistakes: 'Common mistake: Assuming traffic increased without verifying.'
          }
        ),
        item(
          'لو العمال مش كفاية: بتزوّد workers وبتراجع سياسة السكيل علشان تبقى مربوطة بطول الـ queue',
          'If workers are not enough: add workers and review scaling policy to tie to queue length',
          {
            why: 'لو الـ autoscaling مش بيستجيب سريع، محتاج تتدخل يدوي وتعدّل الـ policy.',
            how: 'Manual scale up فورًا. بعدين عدّل الـ scaling policy: lower threshold أو faster cooldown.',
            tradeoffs: 'Aggressive scaling = higher cost في الـ normal times. Conservative = slow response.',
            examples: 'Scale up at queue > 500 بدل 1000. Cooldown 60 sec بدل 5 min.',
            mistakes: 'خطأ شائع: تزود workers manually بس من غير ما تعدل الـ policy، المشكلة هترجع.'
          },
          {
            why: 'If autoscaling is not responding fast, need manual intervention and policy adjustment.',
            how: 'Manual scale up immediately. Then adjust scaling policy: lower threshold or faster cooldown.',
            tradeoffs: 'Aggressive scaling = higher cost in normal times. Conservative = slow response.',
            examples: 'Scale up at queue > 500 instead of 1000. Cooldown 60 sec instead of 5 min.',
            mistakes: 'Common mistake: Adding workers manually without adjusting policy, problem will return.'
          }
        ),
        item(
          'لو في أخطاء أو شغل بيتكرر: بتراجع الـ retries، وبتعزل الجوبز الفاشلة في DLQ',
          'If there are errors or repeated work: review retries and isolate failing jobs in DLQ',
          {
            why: 'Job بتفشل وترجع كتير بتاكل resources وبتزود الـ queue. DLQ بتعزلها.',
            how: 'شوف الـ DLQ size. لو كبيرة، في pattern من failures. Investigate الـ failed jobs.',
            tradeoffs: 'DLQ بتفقد jobs (temporarily). بس أحسن من إنها تسد الـ queue.',
            examples: 'Corrupt image بتفشل في الـ decode → DLQ. Investigate وfix later.',
            mistakes: 'خطأ شائع: infinite retries من غير DLQ، الـ job الواحدة بتبقى بتلف للأبد.'
          },
          {
            why: 'Job failing and retrying repeatedly consumes resources and grows queue. DLQ isolates it.',
            how: 'Check DLQ size. If large, there is a pattern of failures. Investigate failed jobs.',
            tradeoffs: 'DLQ loses jobs (temporarily). But better than clogging the queue.',
            examples: 'Corrupt image fails decode → DLQ. Investigate and fix later.',
            mistakes: 'Common mistake: Infinite retries without DLQ, one job spins forever.'
          }
        ),
        item(
          'لو صور معينة بتاكل وقت زيادة: بتحط حد للحجم وبتقلل الـ concurrency على الـ worker',
          'If certain images take too long: add size limit and reduce concurrency per worker',
          {
            why: 'صور ضخمة ممكن تبطّئ worker واحد، وده بيأثر على throughput الكلي.',
            how: 'Limit image size (20MB). Limit concurrent jobs per worker (2). Reject oversized at upload.',
            tradeoffs: 'Limits بتزعج power users. بس بتحمي السيستم.',
            examples: 'Worker بـ 4GB RAM يعمل 2 jobs concurrent max. أكتر من كده = OOM risk.',
            mistakes: 'خطأ شائع: تسمح بصور unlimited size، واحد يرفع 500MB ويقع السيستم.'
          },
          {
            why: 'Huge images can slow one worker, affecting overall throughput.',
            how: 'Limit image size (20MB). Limit concurrent jobs per worker (2). Reject oversized at upload.',
            tradeoffs: 'Limits upset power users. But protect the system.',
            examples: 'Worker with 4GB RAM does max 2 concurrent jobs. More = OOM risk.',
            mistakes: 'Common mistake: Allowing unlimited size images, someone uploads 500MB and crashes system.'
          }
        ),
        item(
          'بتتابع لحد ما الـ latency ترجع تحت هدف الـ 10 ثواني',
          'Monitor until latency returns below 10 second target',
          {
            why: 'المشكلة مش محلولة لحد ما الـ SLO يتحقق. بتفضل تتابع وتعدّل.',
            how: 'Dashboard مفتوح، بتشوف الـ queue بتنزل والـ latency بترجع normal.',
            tradeoffs: 'Rushing to close the incident = ممكن المشكلة ترجع. Patience is key.',
            examples: 'Queue drain time = queue size ÷ processing rate. Estimate when it clears.',
            mistakes: 'خطأ شائع: تعتبر المشكلة اتحلت لمجرد إنك غيّرت config، محتاج تشوف النتيجة.'
          },
          {
            why: 'Problem is not solved until SLO is met. Keep monitoring and adjusting.',
            how: 'Dashboard open, watch queue draining and latency returning to normal.',
            tradeoffs: 'Rushing to close incident = problem may return. Patience is key.',
            examples: 'Queue drain time = queue size ÷ processing rate. Estimate when it clears.',
            mistakes: 'Common mistake: Considering problem solved just because you changed config, need to see results.'
          }
        ),
      ],
    },
    {
      id: 'followup2',
      title: { ar: 'سؤال متابعة: البوست المشهور', en: 'Follow-up: Viral Post' },
      shortTitle: { ar: 'البوست المشهور', en: 'Viral Post' },
      prompt: {
        ar: 'لو واحد مشهور نزل صورة، واتفتحت ملايين المرات في دقايق، السيستم هيتصرّف إزاي، وإيه اللي ممكن يقع الأول؟',
        en: 'If a celebrity posts an image that gets millions of views in minutes, how will the system behave, and what might fail first?'
      },
      level: 'senior',
      items: [
        item(
          'القراءة المفروض تتبلّع عند الـ CDN والـ cache، مش توصل كلها للأصل',
          'Reads should be absorbed by CDN and cache, not all reaching origin',
          {
            why: 'الـ CDN مصمم للـ hot content. لو الصورة popular، هتتـ cache قريب من الـ users.',
            how: 'First request → origin → CDN cache. الباقي (99%+) من الـ cache.',
            tradeoffs: 'CDN cache TTL: طويل = stale content، قصير = أكتر origin hits.',
            examples: 'صورة viral: 1M views، 99% cache hit = 10K origin requests بس.',
            mistakes: 'خطأ شائع: تفترض إن كل request هيوصل الـ origin.'
          },
          {
            why: 'CDN is designed for hot content. If image is popular, it caches close to users.',
            how: 'First request → origin → CDN cache. Rest (99%+) from cache.',
            tradeoffs: 'CDN cache TTL: long = stale content, short = more origin hits.',
            examples: 'Viral image: 1M views, 99% cache hit = only 10K origin requests.',
            mistakes: 'Common mistake: Assuming every request hits origin.'
          }
        ),
        item(
          'اللي ممكن يقع الأول: الـ origin أو الـ database لو الـ cache miss عالي، أو لو الـ metadata بتتقري من غير cache في كل طلب',
          'What might fail first: origin or database if cache miss is high, or if metadata is read without cache on every request',
          {
            why: 'الـ CDN بتحمي الـ thumbnails، بس الـ metadata API ممكن تتعب.',
            how: 'كل page view بيطلب الـ metadata. لو مفيش Redis cache، الـ DB هتتعب.',
            tradeoffs: 'Redis cache للـ metadata بيضيف latency بسيط بس بيحمي الـ DB.',
            examples: 'Metadata endpoint: 10K RPS → DB overloaded. مع Redis cache → DB sees 100 RPS.',
            mistakes: 'خطأ شائع: تـ cache الصور بس وتنسى الـ metadata.'
          },
          {
            why: 'CDN protects thumbnails, but metadata API may struggle.',
            how: 'Every page view requests metadata. Without Redis cache, DB will struggle.',
            tradeoffs: 'Redis cache for metadata adds slight latency but protects DB.',
            examples: 'Metadata endpoint: 10K RPS → DB overloaded. With Redis cache → DB sees 100 RPS.',
            mistakes: 'Common mistake: Caching images only and forgetting metadata.'
          }
        ),
        item(
          'الحلول: CDN بـ cache طويل للمحتوى الثابت، وcache للـ metadata، وحماية للـ origin زي request coalescing',
          'Solutions: CDN with long cache for static content, cache for metadata, and origin protection like request coalescing',
          {
            why: 'Multi-layer protection: CDN → Redis → DB. كل layer بتمتص جزء من الـ load.',
            how: 'Request coalescing: لو 100 request لنفس الـ resource، واحد بس يروح للـ origin.',
            tradeoffs: 'Request coalescing بيزود الـ latency للـ first request، بس بيحمي الـ origin.',
            examples: 'Nginx proxy_cache_lock، Varnish grace mode، CloudFront origin shield.',
            mistakes: 'خطأ شائع: تعتمد على layer واحدة بس (CDN بس أو cache بس).'
          },
          {
            why: 'Multi-layer protection: CDN → Redis → DB. Each layer absorbs part of load.',
            how: 'Request coalescing: if 100 requests for same resource, only one goes to origin.',
            tradeoffs: 'Request coalescing increases latency for first request, but protects origin.',
            examples: 'Nginx proxy_cache_lock, Varnish grace mode, CloudFront origin shield.',
            mistakes: 'Common mistake: Relying on only one layer (CDN only or cache only).'
          }
        ),
        item(
          'الرفع والمعالجة مش المفروض يقعوا لو القراءة مفصولة كويس',
          'Upload and processing should not fail if reads are well separated',
          {
            why: 'الـ upload path منفصل عن الـ read path. Viral reads مش المفروض تأثر على uploads.',
            how: 'Different endpoints، different servers، different scaling policies.',
            tradeoffs: 'Separation بتزود complexity، بس بتدّي isolation.',
            examples: 'api.example.com/upload vs cdn.example.com/images. منفصلين تمامًا.',
            mistakes: 'خطأ شائع: نفس الـ servers بتعمل upload وread، الـ viral reads بتأثر على الـ uploads.'
          },
          {
            why: 'Upload path is separate from read path. Viral reads should not affect uploads.',
            how: 'Different endpoints, different servers, different scaling policies.',
            tradeoffs: 'Separation adds complexity, but provides isolation.',
            examples: 'api.example.com/upload vs cdn.example.com/images. Completely separate.',
            mistakes: 'Common mistake: Same servers doing upload and read, viral reads affect uploads.'
          }
        ),
        item(
          'لو الـ thumbnail لسه مش جاهز، الطلبات المتكررة متزوّدش شغل على الـ workers',
          'If thumbnail is not ready yet, repeated requests should not add work to workers',
          {
            why: 'لو 1000 request للـ thumbnail قبل ما يجهز، مش المفروض تعمل 1000 resize job.',
            how: 'Check status before starting job. Return placeholder if still processing.',
            tradeoffs: 'Status check بيضيف roundtrip، بس بيمنع duplicate work.',
            examples: 'GET /status/image123 → "processing". Return placeholder، retry in 2 sec.',
            mistakes: 'خطأ شائع: كل request بتعمل resize job جديدة، الصورة الواحدة بتتعمل 1000 مرة.'
          },
          {
            why: 'If 1000 requests for thumbnail before ready, should not create 1000 resize jobs.',
            how: 'Check status before starting job. Return placeholder if still processing.',
            tradeoffs: 'Status check adds roundtrip, but prevents duplicate work.',
            examples: 'GET /status/image123 → "processing". Return placeholder, retry in 2 sec.',
            mistakes: 'Common mistake: Every request creates new resize job, one image resized 1000 times.'
          }
        ),
      ],
    },
    {
      id: 'followup3',
      title: { ar: 'سؤال متابعة: الـ Workers والـ OOM', en: 'Follow-up: Workers and OOM' },
      shortTitle: { ar: 'الـ OOM', en: 'OOM' },
      prompt: {
        ar: 'لو الـ workers بقت بتقع لأن الـ memory بتخلص (OOM)، تعرف ده منين، وتحله إزاي من غير ما تخسر jobs؟',
        en: 'If workers are crashing because memory is exhausted (OOM), how do you detect this and fix it without losing jobs?'
      },
      level: 'senior',
      items: [
        item(
          'الكشف: alerts على استهلاك الـ memory، وإعادة تشغيل الـ workers، وOOM kill في الـ logs، وارتباطها بصور كبيرة أو concurrency عالي',
          'Detection: alerts on memory usage, worker restarts, OOM kill in logs, correlation with large images or high concurrency',
          {
            why: 'OOM مش دايمًا واضح. الـ container بيموت، محتاج تشوف ليه.',
            how: 'Monitor memory %. Check container restart count. Grep logs for "OOM" or "killed".',
            tradeoffs: 'Detailed logging بياكل storage، بس بيساعد في الـ debugging.',
            examples: 'dmesg | grep -i "killed process"، CloudWatch Container Insights.',
            mistakes: 'خطأ شائع: تفترض إن الـ worker واقع لسبب تاني، وده OOM.'
          },
          {
            why: 'OOM is not always obvious. Container dies, need to see why.',
            how: 'Monitor memory %. Check container restart count. Grep logs for "OOM" or "killed".',
            tradeoffs: 'Detailed logging consumes storage, but helps debugging.',
            examples: 'dmesg | grep -i "killed process", CloudWatch Container Insights.',
            mistakes: 'Common mistake: Assuming worker crashed for another reason, when it is OOM.'
          }
        ),
        item(
          'الجوب اللي كانت بتشتغل ترجع للـ queue (التأكيد بعد النجاح فقط، أو retry) عشان متتخسرش',
          'Job that was running returns to queue (ack only on success, or retry) so it is not lost',
          {
            why: 'لو الـ worker مات أثناء الـ processing، الـ job لازم ترجع للـ queue.',
            how: 'SQS visibility timeout: لو الـ worker ماتـ delete الـ message، بترجع ظاهرة بعد الـ timeout.',
            tradeoffs: 'Longer timeout = slower retry. Shorter timeout = risk of duplicate processing.',
            examples: 'Visibility timeout = 2x expected processing time. Resize takes 30 sec → timeout = 60 sec.',
            mistakes: 'خطأ شائع: acknowledge الـ job أول ما تاخدها، لو الـ worker مات الـ job بتتخسر.'
          },
          {
            why: 'If worker dies during processing, job must return to queue.',
            how: 'SQS visibility timeout: if worker does not delete message, it becomes visible after timeout.',
            tradeoffs: 'Longer timeout = slower retry. Shorter timeout = risk of duplicate processing.',
            examples: 'Visibility timeout = 2x expected processing time. Resize takes 30 sec → timeout = 60 sec.',
            mistakes: 'Common mistake: Acknowledging job as soon as taken, if worker dies job is lost.'
          }
        ),
        item(
          'الحل: تقلل عدد الجوبز المتزامنة على الـ worker، وتحط حد أقصى لحجم أو أبعاد الصورة قبل المعالجة',
          'Solution: reduce concurrent jobs per worker, and set max size or dimensions limit before processing',
          {
            why: 'OOM بيحصل لما الـ memory usage بيفوق الـ limit. قلل الـ concurrent work.',
            how: 'Worker config: max_concurrent_jobs = 2. API validation: max 20MB, max 10K×10K pixels.',
            tradeoffs: 'Lower concurrency = lower throughput per worker. Need more workers.',
            examples: 'Worker with 4GB RAM: 2 concurrent jobs max. Each resize uses ~1.5GB peak.',
            mistakes: 'خطأ شائع: تزود الـ memory بدل ما تقلل الـ concurrency، المشكلة بترجع مع صور أكبر.'
          },
          {
            why: 'OOM happens when memory usage exceeds limit. Reduce concurrent work.',
            how: 'Worker config: max_concurrent_jobs = 2. API validation: max 20MB, max 10K×10K pixels.',
            tradeoffs: 'Lower concurrency = lower throughput per worker. Need more workers.',
            examples: 'Worker with 4GB RAM: 2 concurrent jobs max. Each resize uses ~1.5GB peak.',
            mistakes: 'Common mistake: Increasing memory instead of reducing concurrency, problem returns with larger images.'
          }
        ),
        item(
          'معالجة بذاكرة أقل أو streaming، وفصل الـ workers حسب حجم الجوب لو لزم',
          'Lower memory processing or streaming, and separate workers by job size if needed',
          {
            why: 'بعض الـ resize libraries بتحمّل الصورة كلها في الـ memory. ممكن تعمل streaming.',
            how: 'libvips بتعمل streaming، أقل memory من ImageMagick. أو resize in chunks.',
            tradeoffs: 'Streaming أعقد، بس بيوفر memory. ImageMagick أسهل بس بياكل memory.',
            examples: 'sharp (uses libvips): 10x less memory than ImageMagick for large images.',
            mistakes: 'خطأ شائع: تستخدم ImageMagick على صور كبيرة من غير limits.'
          },
          {
            why: 'Some resize libraries load entire image in memory. Can do streaming.',
            how: 'libvips does streaming, less memory than ImageMagick. Or resize in chunks.',
            tradeoffs: 'Streaming is more complex, but saves memory. ImageMagick is easier but memory hungry.',
            examples: 'sharp (uses libvips): 10x less memory than ImageMagick for large images.',
            mistakes: 'Common mistake: Using ImageMagick on large images without limits.'
          }
        ),
        item(
          'DLQ للجوبز اللي بتفضل تقع بعد عدة محاولات، من غير ما تسد الـ queue',
          'DLQ for jobs that keep failing after multiple attempts, without clogging the queue',
          {
            why: 'بعض الـ jobs هتفشل دايمًا (corrupt image). DLQ بتعزلها.',
            how: 'SQS redrive policy: after 5 receives → move to DLQ. Investigate DLQ separately.',
            tradeoffs: 'DLQ بتفقد jobs temporarily. بس أحسن من إنها تبقى بتلف للأبد.',
            examples: 'DLQ alarm: > 100 messages → investigate. Usually indicates a bug or bad input.',
            mistakes: 'خطأ شائع: مفيش DLQ، الـ job الفاشلة بتفضل ترجع وتاكل resources.'
          },
          {
            why: 'Some jobs will always fail (corrupt image). DLQ isolates them.',
            how: 'SQS redrive policy: after 5 receives → move to DLQ. Investigate DLQ separately.',
            tradeoffs: 'DLQ loses jobs temporarily. But better than them spinning forever.',
            examples: 'DLQ alarm: > 100 messages → investigate. Usually indicates a bug or bad input.',
            mistakes: 'Common mistake: No DLQ, failing job keeps returning and consuming resources.'
          }
        ),
      ],
    },
    // Staff-level stages
    {
      id: 'staff-cost',
      title: { ar: 'تقدير التكلفة (Staff)', en: 'Cost Estimation (Staff)' },
      shortTitle: { ar: 'التكلفة', en: 'Cost' },
      prompt: {
        ar: 'قدّر التكلفة الشهرية للسيستم ده: التخزين، الـ compute، الـ network/CDN، والـ database. إيه أكبر بند، وإزاي تقلله لو لزم؟',
        en: 'Estimate the monthly cost of this system: storage, compute, network/CDN, and database. What is the biggest item, and how would you reduce it if needed?'
      },
      level: 'staff',
      items: [
        item(
          'التخزين هو أكبر بند: ~$4K-5K/month للأصليات، زائد thumbnails وgrowth',
          'Storage is the biggest item: ~$4K-5K/month for originals, plus thumbnails and growth',
          {
            why: 'التخزين cumulative، بيزيد كل شهر. لازم تعرف growth rate.',
            how: '180TB × $0.023 = $4,140/month. مع thumbnails والـ growth = $5-6K/month.',
            tradeoffs: 'S3 Standard vs S3-IA: نص السعر بس retrieval fee. Glacier أرخص بس بطيء.',
            examples: 'بعد سنة: 2.2 PB × $0.023 = $50K/month. محتاج lifecycle policy.',
            mistakes: 'خطأ شائع: تنسى إن التخزين بيتضاعف كل سنة، الميزانية بتنفجر.'
          },
          {
            why: 'Storage is cumulative, grows every month. Need to know growth rate.',
            how: '180TB × $0.023 = $4,140/month. With thumbnails and growth = $5-6K/month.',
            tradeoffs: 'S3 Standard vs S3-IA: half price but retrieval fee. Glacier cheaper but slow.',
            examples: 'After 1 year: 2.2 PB × $0.023 = $50K/month. Need lifecycle policy.',
            mistakes: 'Common mistake: Forgetting storage doubles every year, budget explodes.'
          }
        ),
        item(
          'الـ CDN egress تكلفة كبيرة مع الـ read-heavy workload',
          'CDN egress is significant cost with read-heavy workload',
          {
            why: 'كل view بتاكل bandwidth. 100:1 read ratio = egress أكتر بكتير من ingress.',
            how: 'Assume 500KB avg thumbnail × 200M views/day = 100TB egress/day = $8.5K/day at $0.085/GB.',
            tradeoffs: 'CloudFront pricing tiers: أرخص كل ما volume أكبر. Reserved capacity = more discount.',
            examples: 'CloudFront 10 PB/month = $0.02/GB. أرخص 4x من baseline.',
            mistakes: 'خطأ شائع: تقدّر egress على original size بدل thumbnail size.'
          },
          {
            why: 'Every view consumes bandwidth. 100:1 read ratio = much more egress than ingress.',
            how: 'Assume 500KB avg thumbnail × 200M views/day = 100TB egress/day = $8.5K/day at $0.085/GB.',
            tradeoffs: 'CloudFront pricing tiers: cheaper with higher volume. Reserved capacity = more discount.',
            examples: 'CloudFront 10 PB/month = $0.02/GB. 4x cheaper than baseline.',
            mistakes: 'Common mistake: Estimating egress on original size instead of thumbnail size.'
          }
        ),
        item(
          'الـ compute للـ workers معقول، الـ API servers أقل',
          'Compute for workers is reasonable, API servers are less',
          {
            why: 'Workers بتعمل الشغل التقيل (resize). API servers خفيفين (presigned URLs).',
            how: 'Workers: 10 × c5.xlarge × $0.17/hr = $1.2K/month. API: 5 × t3.medium = $150/month.',
            tradeoffs: 'Spot instances للـ workers: 70% discount بس ممكن يتاخدوا.',
            examples: 'Lambda للـ resize: $0.20/million invocations + duration. مع 2M/day = ~$1.2K/month.',
            mistakes: 'خطأ شائع: تستخدم on-demand كل الوقت، Spot أو Reserved أرخص بكتير.'
          },
          {
            why: 'Workers do heavy lifting (resize). API servers are light (presigned URLs).',
            how: 'Workers: 10 × c5.xlarge × $0.17/hr = $1.2K/month. API: 5 × t3.medium = $150/month.',
            tradeoffs: 'Spot instances for workers: 70% discount but can be taken.',
            examples: 'Lambda for resize: $0.20/million invocations + duration. With 2M/day = ~$1.2K/month.',
            mistakes: 'Common mistake: Using on-demand all the time, Spot or Reserved is much cheaper.'
          }
        ),
        item(
          'Database أرخص نسبيًا لو metadata بس',
          'Database is relatively cheap if metadata only',
          {
            why: 'الـ metadata صغيرة (~1KB/image). الـ DB مش هتكبر زي الـ storage.',
            how: 'Aurora: db.r5.large = $200/month + storage. 2M images/day × 1KB = 2GB/day → $0.10/GB.',
            tradeoffs: 'Aurora Serverless: بيـ scale automatically بس أغلى per query.',
            examples: 'بعد سنة: ~700GB metadata = $70/month storage. الـ instance هو التكلفة الأكبر.',
            mistakes: 'خطأ شائع: تستخدم أكبر instance من الأول "just in case".'
          },
          {
            why: 'Metadata is small (~1KB/image). DB will not grow like storage.',
            how: 'Aurora: db.r5.large = $200/month + storage. 2M images/day × 1KB = 2GB/day → $0.10/GB.',
            tradeoffs: 'Aurora Serverless: scales automatically but more expensive per query.',
            examples: 'After 1 year: ~700GB metadata = $70/month storage. Instance is the bigger cost.',
            mistakes: 'Common mistake: Using largest instance from start "just in case".'
          }
        ),
        item(
          'استراتيجيات تقليل التكلفة: lifecycle policies، compression، reserved capacity، spot',
          'Cost reduction strategies: lifecycle policies, compression, reserved capacity, spot',
          {
            why: 'التكلفة بتكبر مع الـ scale. لازم تكون عندك خطة.',
            how: 'S3 lifecycle: → IA after 30 days, → Glacier after 90. Reserved: 1-year commit = 30% off.',
            tradeoffs: 'Reserved = commitment. لو الـ traffic قل، بتدفع فلوس على capacity مش بتستخدمها.',
            examples: 'WebP/AVIF بدل JPEG: 30-50% smaller. CDN egress بيقل بنفس النسبة.',
            mistakes: 'خطأ شائع: تاخد reserved capacity كبيرة بناءً على projections متفائلة.'
          },
          {
            why: 'Cost grows with scale. Need to have a plan.',
            how: 'S3 lifecycle: → IA after 30 days, → Glacier after 90. Reserved: 1-year commit = 30% off.',
            tradeoffs: 'Reserved = commitment. If traffic drops, paying for unused capacity.',
            examples: 'WebP/AVIF instead of JPEG: 30-50% smaller. CDN egress drops by same amount.',
            mistakes: 'Common mistake: Taking large reserved capacity based on optimistic projections.'
          }
        ),
      ],
    },
    {
      id: 'staff-dr',
      title: { ar: 'الـ DR والـ Multi-Region (Staff)', en: 'DR & Multi-Region (Staff)' },
      shortTitle: { ar: 'الـ DR', en: 'DR' },
      prompt: {
        ar: 'لو منطقة AWS كاملة وقعت، السيستم هيفضل شغال؟ إيه الـ RPO والـ RTO المقبولين، وإزاي تحققهم؟',
        en: 'If an entire AWS region goes down, will the system stay up? What are acceptable RPO and RTO, and how do you achieve them?'
      },
      level: 'staff',
      items: [
        item(
          'RPO (Recovery Point Objective): قد إيه data ممكن تتخسر، RTO: قد إيه وقت للرجوع',
          'RPO (Recovery Point Objective): how much data can be lost, RTO: how long to recover',
          {
            why: 'RPO وRTO بيحددوا الـ architecture. RPO = 0 يعني synchronous replication (غالي).',
            how: 'لـ social media images: RPO = minutes acceptable، RTO = < 1 hour reasonable.',
            tradeoffs: 'Lower RPO/RTO = higher cost and complexity. Balance بالـ business impact.',
            examples: 'Banking: RPO = 0, RTO = minutes. Social media: RPO = 5 min, RTO = 1 hr.',
            mistakes: 'خطأ شائع: تقول "RPO = 0" من غير ما تفهم التكلفة والـ complexity.'
          },
          {
            why: 'RPO and RTO determine architecture. RPO = 0 means synchronous replication (expensive).',
            how: 'For social media images: RPO = minutes acceptable, RTO = < 1 hour reasonable.',
            tradeoffs: 'Lower RPO/RTO = higher cost and complexity. Balance with business impact.',
            examples: 'Banking: RPO = 0, RTO = minutes. Social media: RPO = 5 min, RTO = 1 hr.',
            mistakes: 'Common mistake: Saying "RPO = 0" without understanding cost and complexity.'
          }
        ),
        item(
          'S3 Cross-Region Replication للصور، مع versioning',
          'S3 Cross-Region Replication for images, with versioning',
          {
            why: 'S3 CRR بيـ replicate asynchronously، بيحقق RPO = minutes.',
            how: 'Enable CRR على الـ bucket، choose destination region. Replication time = seconds to minutes.',
            tradeoffs: 'CRR doubles storage cost. بس بيدّي protection ضد regional failure.',
            examples: 'us-east-1 → eu-west-1. لو us-east وقع، الصور موجودة في eu-west.',
            mistakes: 'خطأ شائع: تعتمد على S3 durability (11 nines) كبديل عن CRR، ده مش بيحمي من regional failure.'
          },
          {
            why: 'S3 CRR replicates asynchronously, achieves RPO = minutes.',
            how: 'Enable CRR on bucket, choose destination region. Replication time = seconds to minutes.',
            tradeoffs: 'CRR doubles storage cost. But provides protection against regional failure.',
            examples: 'us-east-1 → eu-west-1. If us-east is down, images exist in eu-west.',
            mistakes: 'Common mistake: Relying on S3 durability (11 nines) as CRR alternative, it does not protect against regional failure.'
          }
        ),
        item(
          'Database: Aurora Global Database أو read replica في region تاني',
          'Database: Aurora Global Database or read replica in another region',
          {
            why: 'DB هي أصعب حاجة في الـ DR. الـ state لازم تكون consistent.',
            how: 'Aurora Global: async replication < 1 sec lag. Failover = promote secondary.',
            tradeoffs: 'Global DB: more expensive، بس failover سريع. Manual replica: أرخص بس manual failover.',
            examples: 'Aurora Global: RPO < 1 sec، RTO < 1 min (automatic). Manual: RPO = backup frequency، RTO = hours.',
            mistakes: 'خطأ شائع: تعتمد على daily backups كـ DR، الـ RPO = 24 hours وده كتير قوي.'
          },
          {
            why: 'DB is hardest part of DR. State must be consistent.',
            how: 'Aurora Global: async replication < 1 sec lag. Failover = promote secondary.',
            tradeoffs: 'Global DB: more expensive, but fast failover. Manual replica: cheaper but manual failover.',
            examples: 'Aurora Global: RPO < 1 sec, RTO < 1 min (automatic). Manual: RPO = backup frequency, RTO = hours.',
            mistakes: 'Common mistake: Relying on daily backups as DR, RPO = 24 hours which is too much.'
          }
        ),
        item(
          'DNS failover مع health checks للـ traffic routing',
          'DNS failover with health checks for traffic routing',
          {
            why: 'لازم الـ traffic يتحوّل للـ region السليم أوتوماتيك.',
            how: 'Route 53 health checks على كل region. Failover routing policy.',
            tradeoffs: 'DNS TTL: قصير = faster failover بس أكتر DNS lookups. طويل = slower failover.',
            examples: 'Route 53 health check كل 10 sec. TTL = 60 sec. Total failover time = ~90 sec.',
            mistakes: 'خطأ شائع: DNS TTL طويل (hours)، الـ failover بياخد وقت طويل.'
          },
          {
            why: 'Traffic must route to healthy region automatically.',
            how: 'Route 53 health checks on each region. Failover routing policy.',
            tradeoffs: 'DNS TTL: short = faster failover but more DNS lookups. Long = slower failover.',
            examples: 'Route 53 health check every 10 sec. TTL = 60 sec. Total failover time = ~90 sec.',
            mistakes: 'Common mistake: Long DNS TTL (hours), failover takes too long.'
          }
        ),
        item(
          'تمرين الـ DR (game day) عشان تتأكد إنه شغال',
          'DR drill (game day) to verify it works',
          {
            why: 'DR plan من غير testing = false sense of security. لازم تجرّب.',
            how: 'Schedule quarterly DR drill. Actually fail over to secondary. Measure RTO.',
            tradeoffs: 'DR drills بتاكل وقت وممكن تعمل issues. بس أحسن من إنك تكتشف مشاكل في emergency.',
            examples: 'Netflix Chaos Monkey بيقتل services randomly. AWS Fault Injection Simulator.',
            mistakes: 'خطأ شائع: تعمل DR plan مرة وتنساها، بعد سنة اكتشفت إنها مش شغالة.'
          },
          {
            why: 'DR plan without testing = false sense of security. Must test.',
            how: 'Schedule quarterly DR drill. Actually fail over to secondary. Measure RTO.',
            tradeoffs: 'DR drills consume time and may cause issues. But better than discovering problems in emergency.',
            examples: 'Netflix Chaos Monkey kills services randomly. AWS Fault Injection Simulator.',
            mistakes: 'Common mistake: Creating DR plan once and forgetting it, after a year discover it does not work.'
          }
        ),
      ],
    },
    {
      id: 'staff-security',
      title: { ar: 'الأمان والـ Abuse (Staff)', en: 'Security & Abuse (Staff)' },
      shortTitle: { ar: 'الأمان', en: 'Security' },
      prompt: {
        ar: 'إيه المخاطر الأمنية للسيستم ده: malicious uploads، الوصول غير المصرح، الـ abuse، والـ privacy؟ وإزاي تحمي منها؟',
        en: 'What are the security risks for this system: malicious uploads, unauthorized access, abuse, and privacy? How do you protect against them?'
      },
      level: 'staff',
      items: [
        item(
          'Malicious uploads: virus scanning، file type validation، sandbox processing',
          'Malicious uploads: virus scanning, file type validation, sandbox processing',
          {
            why: 'Users ممكن يرفعوا malware متخفي كصور، أو exploit image parsing vulnerabilities.',
            how: 'ClamAV scan بعد الـ upload. Magic bytes validation (مش extension بس). Isolated workers.',
            tradeoffs: 'Scanning بيزود latency. بس مهم للـ security.',
            examples: 'ImageTragick vulnerability: crafted image بتـ execute code. Sandbox = container with no network.',
            mistakes: 'خطأ شائع: تثق في الـ file extension، user ممكن يرفع .jpg وهو executable.'
          },
          {
            why: 'Users may upload malware disguised as images, or exploit image parsing vulnerabilities.',
            how: 'ClamAV scan after upload. Magic bytes validation (not just extension). Isolated workers.',
            tradeoffs: 'Scanning adds latency. But important for security.',
            examples: 'ImageTragick vulnerability: crafted image executes code. Sandbox = container with no network.',
            mistakes: 'Common mistake: Trusting file extension, user may upload .jpg that is an executable.'
          }
        ),
        item(
          'Content moderation: AI-based detection للـ NSFW/illegal content',
          'Content moderation: AI-based detection for NSFW/illegal content',
          {
            why: 'Social media platforms مسؤولة قانونيًا عن المحتوى المخالف.',
            how: 'AWS Rekognition أو Google Vision API. Flag للـ human review لو confidence عالي.',
            tradeoffs: 'AI مش perfect، false positives بتزعج users. False negatives = legal risk.',
            examples: 'Rekognition: NSFW detection، face detection، text detection.',
            mistakes: 'خطأ شائع: تعتمد على الـ AI 100% من غير human review، أو تتجاهل المشكلة خالص.'
          },
          {
            why: 'Social media platforms are legally responsible for illegal content.',
            how: 'AWS Rekognition or Google Vision API. Flag for human review if high confidence.',
            tradeoffs: 'AI is not perfect, false positives upset users. False negatives = legal risk.',
            examples: 'Rekognition: NSFW detection, face detection, text detection.',
            mistakes: 'Common mistake: Relying on AI 100% without human review, or ignoring the problem entirely.'
          }
        ),
        item(
          'Rate limiting والـ abuse prevention: per-user limits، CAPTCHA، cost attribution',
          'Rate limiting and abuse prevention: per-user limits, CAPTCHA, cost attribution',
          {
            why: 'بدون rate limiting، attacker يقدر يرفع unlimited files ويكلفك فلوس.',
            how: 'Rate limit: 100 uploads/hour/user. CAPTCHA بعد threshold. Block بعد violations.',
            tradeoffs: 'Aggressive limits بتزعج power users. Loose limits بتسمح بـ abuse.',
            examples: 'API Gateway throttling، WAF rules، Redis-based rate limiter.',
            mistakes: 'خطأ شائع: rate limit على IP بس، shared NAT بيأثر على users كتير.'
          },
          {
            why: 'Without rate limiting, attacker can upload unlimited files and cost you money.',
            how: 'Rate limit: 100 uploads/hour/user. CAPTCHA after threshold. Block after violations.',
            tradeoffs: 'Aggressive limits upset power users. Loose limits allow abuse.',
            examples: 'API Gateway throttling, WAF rules, Redis-based rate limiter.',
            mistakes: 'Common mistake: Rate limiting on IP only, shared NAT affects many users.'
          }
        ),
        item(
          'Access control: presigned URLs limited scope، authentication، private buckets',
          'Access control: presigned URLs with limited scope, authentication, private buckets',
          {
            why: 'الـ presigned URL لازم يكون محدود عشان متديش وصول واسع.',
            how: 'Presigned URL: specific key، short expiry (5 min)، specific action (PUT only). Private bucket.',
            tradeoffs: 'Shorter expiry = more secure بس bad UX لو slow connection.',
            examples: 'URL للـ upload: PUT /bucket/images/user123/uuid.jpg، expires in 5 min.',
            mistakes: 'خطأ شائع: presigned URL بـ wildcard path أو long expiry، attacker ممكن يستخدمه.'
          },
          {
            why: 'Presigned URL must be limited to prevent broad access.',
            how: 'Presigned URL: specific key, short expiry (5 min), specific action (PUT only). Private bucket.',
            tradeoffs: 'Shorter expiry = more secure but bad UX on slow connections.',
            examples: 'URL for upload: PUT /bucket/images/user123/uuid.jpg, expires in 5 min.',
            mistakes: 'Common mistake: Presigned URL with wildcard path or long expiry, attacker can abuse it.'
          }
        ),
        item(
          'Privacy: metadata stripping، access logs، GDPR/deletion',
          'Privacy: metadata stripping, access logs, GDPR/deletion',
          {
            why: 'الصور فيها EXIF metadata ممكن تكشف location وdevice info. GDPR يتطلب deletion.',
            how: 'Strip EXIF بعد upload. Log access for audit. Implement hard delete on request.',
            tradeoffs: 'EXIF stripping بيفقد orientation info أحيانًا. Hard delete = cannot recover.',
            examples: 'exiftool -all= image.jpg. S3 object deletion + DB soft delete → hard delete after 30 days.',
            mistakes: 'خطأ شائع: تسيب الـ GPS coordinates في الصور، privacy violation.'
          },
          {
            why: 'Images contain EXIF metadata that can reveal location and device info. GDPR requires deletion.',
            how: 'Strip EXIF after upload. Log access for audit. Implement hard delete on request.',
            tradeoffs: 'EXIF stripping may lose orientation info. Hard delete = cannot recover.',
            examples: 'exiftool -all= image.jpg. S3 object deletion + DB soft delete → hard delete after 30 days.',
            mistakes: 'Common mistake: Leaving GPS coordinates in images, privacy violation.'
          }
        ),
      ],
    },
    {
      id: 'staff-growth',
      title: { ar: 'نمو 10x وإيه بيقع الأول (Staff)', en: '10x Growth & What Breaks First (Staff)' },
      shortTitle: { ar: 'نمو 10x', en: '10x Growth' },
      prompt: {
        ar: 'لو الـ traffic زاد 10x في 6 شهور، إيه أول حاجة هتقع، وإيه الخطة عشان تستوعب النمو ده؟',
        en: 'If traffic increased 10x in 6 months, what breaks first, and what is the plan to handle that growth?'
      },
      level: 'staff',
      items: [
        item(
          'Database هتقع الأول غالبًا: connections، query throughput، storage',
          'Database will likely break first: connections, query throughput, storage',
          {
            why: 'الـ DB أصعب حاجة في الـ scale. Stateless services سهل تزودها، DB لأ.',
            how: '10x traffic = 10x queries. Single primary DB هتوصل limits بسرعة.',
            tradeoffs: 'Vertical scaling سهل بس في limit. Horizontal (sharding) معقد.',
            examples: 'Aurora max: 128 vCPUs، 1TB RAM. بعدها محتاج sharding.',
            mistakes: 'خطأ شائع: تفترض إن الـ DB هتـ scale زي الـ web servers.'
          },
          {
            why: 'DB is hardest to scale. Stateless services are easy to add, DB is not.',
            how: '10x traffic = 10x queries. Single primary DB will hit limits quickly.',
            tradeoffs: 'Vertical scaling is easy but has limit. Horizontal (sharding) is complex.',
            examples: 'Aurora max: 128 vCPUs, 1TB RAM. After that need sharding.',
            mistakes: 'Common mistake: Assuming DB scales like web servers.'
          }
        ),
        item(
          'Storage cost هتنفجر: محتاج lifecycle policies وcompression وtiering',
          'Storage cost will explode: need lifecycle policies, compression, and tiering',
          {
            why: '10x traffic = 10x uploads = 10x storage growth. التكلفة بتتضاعف.',
            how: 'Lifecycle: S3 → IA → Glacier. WebP compression. Delete old unpopular content.',
            tradeoffs: 'Aggressive tiering يوفر فلوس بس بيبطّئ access للـ old content.',
            examples: '60TB/day بدل 6TB. بعد سنة: 22 PB بدل 2.2 PB. تكلفة $500K/month بدل $50K.',
            mistakes: 'خطأ شائع: تفترض إن الـ storage cheap و"هنتعامل معاه بعدين".'
          },
          {
            why: '10x traffic = 10x uploads = 10x storage growth. Cost doubles.',
            how: 'Lifecycle: S3 → IA → Glacier. WebP compression. Delete old unpopular content.',
            tradeoffs: 'Aggressive tiering saves money but slows access to old content.',
            examples: '60TB/day instead of 6TB. After 1 year: 22 PB instead of 2.2 PB. Cost $500K/month instead of $50K.',
            mistakes: 'Common mistake: Assuming storage is cheap and "we will deal with it later".'
          }
        ),
        item(
          'CDN egress بيكبر linearly، محتاج negotiate pricing أو multi-CDN',
          'CDN egress grows linearly, need to negotiate pricing or multi-CDN',
          {
            why: 'CDN pricing بيقل مع volume. 10x volume = better rates، لو تفاوضت.',
            how: 'Contact CDN sales، negotiate custom contract. أو استخدم multi-CDN.',
            tradeoffs: 'Custom contract = commitment. Multi-CDN = complexity.',
            examples: 'CloudFront: $0.085/GB → $0.02/GB at 10 PB/month. 4x discount.',
            mistakes: 'خطأ شائع: تفضل على pay-as-you-go من غير ما تتفاوض.'
          },
          {
            why: 'CDN pricing decreases with volume. 10x volume = better rates, if you negotiate.',
            how: 'Contact CDN sales, negotiate custom contract. Or use multi-CDN.',
            tradeoffs: 'Custom contract = commitment. Multi-CDN = complexity.',
            examples: 'CloudFront: $0.085/GB → $0.02/GB at 10 PB/month. 4x discount.',
            mistakes: 'Common mistake: Staying on pay-as-you-go without negotiating.'
          }
        ),
        item(
          'Team و processes: on-call، incident response، capacity planning',
          'Team and processes: on-call, incident response, capacity planning',
          {
            why: '10x scale محتاج 10x maturity. العمليات اللي كانت manual مش هتـ scale.',
            how: 'Dedicated on-call rotation. Runbooks لكل incident type. Quarterly capacity review.',
            tradeoffs: 'Process overhead. بس بيمنع fires وburnout.',
            examples: 'PagerDuty rotation، Confluence runbooks، monthly capacity planning meeting.',
            mistakes: 'خطأ شائع: نفس الـ 3 engineers بيعملوا كل حاجة، بيوصلوا burnout.'
          },
          {
            why: '10x scale needs 10x maturity. Manual operations will not scale.',
            how: 'Dedicated on-call rotation. Runbooks for every incident type. Quarterly capacity review.',
            tradeoffs: 'Process overhead. But prevents fires and burnout.',
            examples: 'PagerDuty rotation, Confluence runbooks, monthly capacity planning meeting.',
            mistakes: 'Common mistake: Same 3 engineers doing everything, they reach burnout.'
          }
        ),
        item(
          'Architecture evolution: من monolith لـ services، من single DB لـ sharded',
          'Architecture evolution: from monolith to services, from single DB to sharded',
          {
            why: '10x scale ممكن يحتاج architectural changes. Plan ahead.',
            how: 'Extract services incrementally. Prepare for sharding before you need it.',
            tradeoffs: 'Premature optimization vs scrambling when it breaks.',
            examples: 'Extract upload service، resize service، metadata service. Shard by user_id.',
            mistakes: 'خطأ شائع: تعمل big rewrite مرة واحدة. Incremental migration أفضل.'
          },
          {
            why: '10x scale may need architectural changes. Plan ahead.',
            how: 'Extract services incrementally. Prepare for sharding before you need it.',
            tradeoffs: 'Premature optimization vs scrambling when it breaks.',
            examples: 'Extract upload service, resize service, metadata service. Shard by user_id.',
            mistakes: 'Common mistake: Doing big rewrite at once. Incremental migration is better.'
          }
        ),
      ],
    },
    {
      id: 'staff-ops',
      title: { ar: 'النضج التشغيلي (Staff)', en: 'Operational Maturity (Staff)' },
      shortTitle: { ar: 'العمليات', en: 'Operations' },
      prompt: {
        ar: 'إيه ممارسات الـ operational maturity اللي محتاجها: SLOs/error budgets، deployments، on-call، وrunbooks؟',
        en: 'What operational maturity practices are needed: SLOs/error budgets, deployments, on-call, and runbooks?'
      },
      level: 'staff',
      items: [
        item(
          'SLOs محددة: availability، latency، throughput، freshness',
          'Defined SLOs: availability, latency, throughput, freshness',
          {
            why: 'SLOs بتحدد "إيه معنى السيستم شغال كويس" بشكل measurable.',
            how: 'Availability: 99.9% (8.7 hr downtime/year). Latency: p99 < 2s. Thumbnails: 99% < 10s.',
            tradeoffs: 'Stricter SLOs = more engineering effort. Looser = unhappy users.',
            examples: 'SLO dashboard على Grafana. Alert لما تقترب من breach.',
            mistakes: 'خطأ شائع: SLOs غير قابلة للقياس زي "السيستم لازم يكون سريع".'
          },
          {
            why: 'SLOs define "what does system working well mean" in measurable terms.',
            how: 'Availability: 99.9% (8.7 hr downtime/year). Latency: p99 < 2s. Thumbnails: 99% < 10s.',
            tradeoffs: 'Stricter SLOs = more engineering effort. Looser = unhappy users.',
            examples: 'SLO dashboard on Grafana. Alert when approaching breach.',
            mistakes: 'Common mistake: Unmeasurable SLOs like "system must be fast".'
          }
        ),
        item(
          'Error budgets: قد إيه errors مسموح بيها، ولما تخلص بتوقف deployments',
          'Error budgets: how many errors are allowed, and stop deployments when exhausted',
          {
            why: 'Error budget = 100% - SLO. بيوازن بين velocity والـ reliability.',
            how: '99.9% availability = 0.1% error budget = 43 min/month. لو استهلكته، freeze deployments.',
            tradeoffs: 'Strict enforcement بيبطّئ development. No enforcement = no reliability.',
            examples: 'Google SRE practice: error budget policy. اتفاق مع الـ product team.',
            mistakes: 'خطأ شائع: تعتبر الـ error budget "nice to have" ومتلتزمش بيه.'
          },
          {
            why: 'Error budget = 100% - SLO. Balances velocity and reliability.',
            how: '99.9% availability = 0.1% error budget = 43 min/month. If exhausted, freeze deployments.',
            tradeoffs: 'Strict enforcement slows development. No enforcement = no reliability.',
            examples: 'Google SRE practice: error budget policy. Agreement with product team.',
            mistakes: 'Common mistake: Treating error budget as "nice to have" and not following it.'
          }
        ),
        item(
          'Safe deployments: canary، feature flags، rollback plan',
          'Safe deployments: canary, feature flags, rollback plan',
          {
            why: 'Most outages بتحصل بعد deployment. Safe deployment بتقلل الـ blast radius.',
            how: 'Canary: 5% traffic → monitor → 100%. Feature flags: disable without deploy. Rollback: < 5 min.',
            tradeoffs: 'Slower releases بس أقل outages.',
            examples: 'AWS CodeDeploy canary، LaunchDarkly feature flags، one-click rollback.',
            mistakes: 'خطأ شائع: deploy to all servers at once، لو في bug بيأثر على كل الـ users.'
          },
          {
            why: 'Most outages happen after deployment. Safe deployment reduces blast radius.',
            how: 'Canary: 5% traffic → monitor → 100%. Feature flags: disable without deploy. Rollback: < 5 min.',
            tradeoffs: 'Slower releases but fewer outages.',
            examples: 'AWS CodeDeploy canary, LaunchDarkly feature flags, one-click rollback.',
            mistakes: 'Common mistake: Deploying to all servers at once, if there is a bug it affects all users.'
          }
        ),
        item(
          'On-call rotation مع escalation واضح وcompensation',
          'On-call rotation with clear escalation and compensation',
          {
            why: 'بدون on-call واضح، المشاكل بتتأخر أو بتقع على نفس الناس.',
            how: 'Weekly rotation. Primary + secondary. Escalation path. Compensation (time off أو bonus).',
            tradeoffs: 'On-call بيرهق. بس ضروري لـ reliability.',
            examples: 'PagerDuty schedules، escalation بعد 15 min، manager بعد 30 min.',
            mistakes: 'خطأ شائع: نفس الشخص on-call دايمًا → burnout.'
          },
          {
            why: 'Without clear on-call, problems are delayed or fall on same people.',
            how: 'Weekly rotation. Primary + secondary. Escalation path. Compensation (time off or bonus).',
            tradeoffs: 'On-call is tiring. But necessary for reliability.',
            examples: 'PagerDuty schedules, escalation after 15 min, manager after 30 min.',
            mistakes: 'Common mistake: Same person always on-call → burnout.'
          }
        ),
        item(
          'Runbooks لكل incident type شائع، مع postmortems',
          'Runbooks for every common incident type, with postmortems',
          {
            why: 'Runbooks بتـ reduce MTTR وبتسمح لأي on-call يحل المشكلة.',
            how: 'Confluence/Notion runbooks. Steps للـ diagnosis والـ mitigation. Links للـ dashboards.',
            tradeoffs: 'Runbooks بتـ outdated لو منتش بتحدثها. Schedule regular review.',
            examples: 'Runbook: "Queue backlog > 10K". Steps: check metrics، scale workers، check DLQ.',
            mistakes: 'خطأ شائع: runbooks مكتوبة بس مش موجودة في searchable place.'
          },
          {
            why: 'Runbooks reduce MTTR and allow any on-call to solve the problem.',
            how: 'Confluence/Notion runbooks. Steps for diagnosis and mitigation. Links to dashboards.',
            tradeoffs: 'Runbooks get outdated if not updated. Schedule regular review.',
            examples: 'Runbook: "Queue backlog > 10K". Steps: check metrics, scale workers, check DLQ.',
            mistakes: 'Common mistake: Runbooks written but not in searchable place.'
          }
        ),
      ],
    },
    {
      id: 'staff-org',
      title: { ar: 'الـ Org والـ Build vs Buy (Staff)', en: 'Org & Build vs Buy (Staff)' },
      shortTitle: { ar: 'الـ Org', en: 'Org' },
      prompt: {
        ar: 'مين هيملك السيستم ده، إيه الـ team structure، وإيه الحاجات اللي هتبنيها وإيه اللي هتشتريها؟',
        en: 'Who will own this system, what is the team structure, and what will you build vs buy?'
      },
      level: 'staff',
      items: [
        item(
          'Team ownership واضح: media platform team يملك الـ upload والـ processing',
          'Clear team ownership: media platform team owns upload and processing',
          {
            why: 'بدون ownership واضح، المشاكل بتتسيّب أو يتعامل معاها slowly.',
            how: 'Media Platform Team: owns S3، workers، queue، metadata. Infra Team: owns CDN، DB.',
            tradeoffs: 'Too many teams = coordination overhead. Too few = overload.',
            examples: 'Service catalog: كل service ليه owner team معلن.',
            mistakes: 'خطأ شائع: "shared ownership" = no ownership.'
          },
          {
            why: 'Without clear ownership, problems are neglected or handled slowly.',
            how: 'Media Platform Team: owns S3, workers, queue, metadata. Infra Team: owns CDN, DB.',
            tradeoffs: 'Too many teams = coordination overhead. Too few = overload.',
            examples: 'Service catalog: every service has declared owner team.',
            mistakes: 'Common mistake: "shared ownership" = no ownership.'
          }
        ),
        item(
          'Stakeholder alignment: product، engineering، finance يفهموا الـ trade-offs',
          'Stakeholder alignment: product, engineering, finance understand trade-offs',
          {
            why: 'السيستم ده بيكلف فلوس وبيأثر على الـ UX. الكل لازم يفهم.',
            how: 'Monthly review مع الـ stakeholders. Cost breakdown. SLO status. Upcoming changes.',
            tradeoffs: 'Meetings بتاكل وقت. بس بتمنع surprises.',
            examples: 'Dashboard: storage cost trend، latency trend، upcoming capacity needs.',
            mistakes: 'خطأ شائع: engineering ياخدوا قرارات من غير ما يبلّغوا الـ finance.'
          },
          {
            why: 'This system costs money and affects UX. Everyone must understand.',
            how: 'Monthly review with stakeholders. Cost breakdown. SLO status. Upcoming changes.',
            tradeoffs: 'Meetings consume time. But prevent surprises.',
            examples: 'Dashboard: storage cost trend, latency trend, upcoming capacity needs.',
            mistakes: 'Common mistake: Engineering makes decisions without informing finance.'
          }
        ),
        item(
          'Build vs Buy: managed services للـ infrastructure، build الـ business logic',
          'Build vs Buy: managed services for infrastructure, build business logic',
          {
            why: 'بناء كل حاجة in-house مكلف. Managed services بتوفر time-to-market.',
            how: 'Buy: S3، SQS، CloudFront، Aurora. Build: upload API، resize workers، moderation logic.',
            tradeoffs: 'Managed = vendor lock-in + cost. Build = control + maintenance burden.',
            examples: 'S3 vs self-hosted MinIO: S3 أسهل بكتير. Resize workers: custom لأن الـ logic specific.',
            mistakes: 'خطأ شائع: تبني كل حاجة in-house "لأن أرخص"، الـ engineering time أغلى.'
          },
          {
            why: 'Building everything in-house is expensive. Managed services save time-to-market.',
            how: 'Buy: S3, SQS, CloudFront, Aurora. Build: upload API, resize workers, moderation logic.',
            tradeoffs: 'Managed = vendor lock-in + cost. Build = control + maintenance burden.',
            examples: 'S3 vs self-hosted MinIO: S3 is much easier. Resize workers: custom because logic is specific.',
            mistakes: 'Common mistake: Building everything in-house "because it is cheaper", engineering time is more expensive.'
          }
        ),
        item(
          'Documentation والـ knowledge sharing: architecture decisions، onboarding',
          'Documentation and knowledge sharing: architecture decisions, onboarding',
          {
            why: 'الناس بتيجي وتمشي. الـ knowledge لازم تكون documented.',
            how: 'ADRs (Architecture Decision Records). System diagrams. Onboarding guide.',
            tradeoffs: 'Documentation بتـ outdated. بس أحسن من لا شيء.',
            examples: 'ADR: "لماذا اخترنا presigned URLs بدل proxy". Diagram: system architecture.',
            mistakes: 'خطأ شائع: "الكود هو الـ documentation"، ده مش كفاية للـ newcomers.'
          },
          {
            why: 'People come and go. Knowledge must be documented.',
            how: 'ADRs (Architecture Decision Records). System diagrams. Onboarding guide.',
            tradeoffs: 'Documentation gets outdated. But better than nothing.',
            examples: 'ADR: "Why we chose presigned URLs instead of proxy". Diagram: system architecture.',
            mistakes: 'Common mistake: "Code is the documentation", that is not enough for newcomers.'
          }
        ),
      ],
    },
  ],
};
