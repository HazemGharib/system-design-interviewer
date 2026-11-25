import { useEffect, useMemo, useState, type CSSProperties, type ReactNode, type ChangeEvent } from 'react';

const TOTAL_SECONDS = 45 * 60;
const STORAGE_KEY = "hazem-sysdesign-interview-v1";

type Stage = {
  id: string;
  title: string;
  shortTitle: string;
  prompt: string;
  items: string[];
};

type SavedState = {
  answers: Record<string, string>;
  ticks: Record<string, boolean[]>;
  revealed: Record<string, boolean>;
  view: string;
  remaining: number;
  running: boolean;
  deadline: number | null;
};

const STAGES: Stage[] = [
  {
    id: "clarify",
    title: "الأسئلة التوضيحية والحسبة",
    shortTitle: "الحسبة والأسئلة",
    prompt:
      "قبل ما تصمم، اسأل الأسئلة التوضيحية اللي محتاجها، واعمل حسبة سريعة للأرقام. اكتب تقديراتك لعدد الرفع في الثانية، وحجم التخزين في اليوم وفي السنة، وحجم الـ bandwidth.",
    items: [
      "سألت أسئلة توضيحية قبل التصميم، زي الـ constraints، وحد حجم الصورة، وصيغ الملفات، ومستوى التوافق المطلوب",
      "قدّرت عدد الرفع في الثانية: حوالي 23 upload/sec متوسط، وحوالي 46 في الذروة",
      "قدّرت حجم التخزين في اليوم: حوالي 6 TB للصور الأصلية، بالإضافة للـ thumbnails",
      "قدّرت حجم التخزين في السنة: حوالي 2.2 PB للصور الأصلية",
      "قدّرت الـ bandwidth للكتابة والقراءة، ولاحظت إن القراءة أكبر بكتير وغالبًا هتكون على thumbnails من خلال الـ CDN",
    ],
  },
  {
    id: "architecture",
    title: "الأركيتكتشر العامة",
    shortTitle: "الأركيتكتشر",
    prompt:
      "اوصف الأركيتكتشر من لحظة ما اليوزر يرفع الصورة لحد ما اليوزرز التانيين يقدروا يشوفوها. فصّل المكونات وشرح طريق الرفع وطريق القراءة.",
    items: [
      "فصلت الرفع عن المعالجة: طريق الـ upload غير طريق الـ resize",
      "اليوزر بيرفع على طول لـ object storage زي S3 بـ presigned URL، من غير ما الملف يعدي على الـ API server",
      "بعد الرفع يتبعت job في queue",
      "workers منفصلين بيعملوا الـ resize للتلات مقاسات: small وmedium وlarge",
      "الـ metadata في database: معرّف الصورة، المالك، حالة المعالجة، وروابط المقاسات",
      "القراءة بتعدي على CDN وcache",
    ],
  },
  {
    id: "scaling",
    title: "الـ Horizontal scaling",
    shortTitle: "الـ Scaling",
    prompt:
      "لو الترافيك زاد أو اتضاعف في أوقات الذروة، السيستم هيكبر إزاي من غير ما يقع؟ اشرح السكيل الأفقي لكل جزء مهم.",
    items: [
      "سيرفرات الـ API تكون stateless ووراها load balancer",
      "الـ workers يزيدوا بـ autoscaling",
      "سكيل الـ workers مربوط بطول الـ queue، مش بس باستهلاك الـ CPU",
      "الـ object storage والـ CDN يشيلوا القراءة العالية",
      "الـ database تقدر تكبر في القراءة بـ read replicas، ومع الوقت بـ sharding لو لزم",
    ],
  },
  {
    id: "monitoring",
    title: "المراقبة والـ Observability",
    shortTitle: "المراقبة",
    prompt:
      "هتراقب إيه، وهتعرف منين إن في مشكلة، وهتنبّه الفريق إزاي؟ اتكلم عن الـ metrics والـ logs والـ tracing والـ alerts.",
    items: [
      "Metrics أساسية: latency وerror rate وthroughput",
      "طول الـ queue وعمر أقدم رسالة فيها",
      "استهلاك CPU وmemory في الـ workers",
      "نسبة الـ cache hit في الـ CDN",
      "Logs وdistributed tracing بيربطوا الـ request من الرفع لحد ما الـ thumbnail يجهز",
      "Alerts مبنية على أهداف واضحة (SLOs)، زي رد الرفع أقل من ثانيتين وجهوزية الـ thumbnails خلال 10 ثواني",
    ],
  },
  {
    id: "bottlenecks",
    title: "الاختناقات",
    shortTitle: "الاختناقات",
    prompt:
      "إيه الأماكن اللي متوقع تبقى عنق زجاجة: CPU، وmemory، وI/O، وnetwork، وdatabase، وتراكم الـ queue؟ وهتحل كل واحدة إزاي؟",
    items: [
      "الـ resize بياكل CPU وmemory، خصوصًا الصور الكبيرة: حد أقصى لحجم الصورة، وlimit لعدد الـ jobs المتزامنة على كل worker",
      "الرفع تقيل على الـ network وI/O: الحل إن الرفع يبقى direct بـ presigned URL",
      "الـ database ممكن تتعب في القراءة: cache، وread replicas، وsharding لو كبرت قوي",
      "تراكم الـ queue: autoscaling للـ workers، وretry بـ backoff، وdead letter queue للجوبز اللي بتفشل",
    ],
  },
  {
    id: "tradeoffs",
    title: "الـ Trade-offs",
    shortTitle: "الـ Trade-offs",
    prompt:
      "إيه القرارات اللي فيها تنازل، وليه اخترت اللي اخترته؟ اشرح وجه كل اختيار والبديل بتاعه.",
    items: [
      "المعالجة مقدّمًا ولا وقت الطلب: eager thumbnails قصاد on-demand",
      "الـ consistency: إيه اللي يحصل لو اليوزر طلب الصورة قبل ما الـ thumbnail يجهز",
      "التكلفة مقابل السرعة في التخزين والـ CDN",
      "السكيل على الـ CPU مقابل السكيل على طول الـ queue",
    ],
  },
  {
    id: "followup1",
    title: "سؤال متابعة: تراكم الـ Queue",
    shortTitle: "تراكم الـ Queue",
    prompt:
      "لو فجأة طول الـ queue بقى بيزيد بسرعة، ووقت تجهيز الـ thumbnails وصل خمس دقايق، هتعمل إيه خطوة بخطوة عشان تعرف السبب وتحله؟",
    items: [
      "بتبدأ بالـ metrics: طول الـ queue، عمر أقدم رسالة، معدل دخول الجوبز مقابل معدل خروجها، وCPU/memory للـ workers، والـ error rate",
      "بتفرّق: هل الدخل زاد (زيادة ترافيك) ولا الـ workers بقوا أبطأ أو واقعين",
      "لو العمال مش كفاية: بتزوّد workers وبتراجع سياسة السكيل علشان تبقى مربوطة بطول الـ queue",
      "لو في أخطاء أو شغل بيتكرر: بتراجع الـ retries، وبتعزل الجوبز الفاشلة في DLQ",
      "لو صور معينة بتاكل وقت زيادة: بتحط حد للحجم وبتقلل الـ concurrency على الـ worker",
      "بتتابع لحد ما الـ latency ترجع تحت هدف الـ 10 ثواني",
    ],
  },
  {
    id: "followup2",
    title: "سؤال متابعة: البوست المشهور",
    shortTitle: "البوست المشهور",
    prompt:
      "لو واحد مشهور نزل صورة، واتفتحت ملايين المرات في دقايق، السيستم هيتصرّف إزاي، وإيه اللي ممكن يقع الأول؟",
    items: [
      "القراءة المفروض تتبلّع عند الـ CDN والـ cache، مش توصل كلها للأصل",
      "اللي ممكن يقع الأول: الـ origin أو الـ database لو الـ cache miss عالي، أو لو الـ metadata بتتقري من غير cache في كل طلب",
      "الحلول: CDN بـ cache طويل للمحتوى الثابت، وcache للـ metadata، وحماية للـ origin زي request coalescing",
      "الرفع والمعالجة مش المفروض يقعوا لو القراءة مفصولة كويس",
      "لو الـ thumbnail لسه مش جاهز، الطلبات المتكررة متزوّدش شغل على الـ workers",
    ],
  },
  {
    id: "followup3",
    title: "سؤال متابعة: الـ Workers والـ OOM",
    shortTitle: "الـ OOM",
    prompt:
      "لو الـ workers بقت بتقع لأن الـ memory بتخلص (OOM)، تعرف ده منين، وتحله إزاي من غير ما تخسر jobs؟",
    items: [
      "الكشف: alerts على استهلاك الـ memory، وإعادة تشغيل الـ workers، وOOM kill في الـ logs، وارتباطها بصور كبيرة أو concurrency عالي",
      "الجوب اللي كانت بتشتغل ترجع للـ queue (التأكيد بعد النجاح فقط، أو retry) عشان متتخسرش",
      "الحل: تقلل عدد الجوبز المتزامنة على الـ worker، وتحط حد أقصى لحجم أو أبعاد الصورة قبل المعالجة",
      "معالجة بذاكرة أقل أو streaming، وفصل الـ workers حسب حجم الجوب لو لزم",
      "DLQ للجوبز اللي بتفضل تقع بعد عدة محاولات، من غير ما تسد الـ queue",
    ],
  },
];

const VIEW_OPTIONS = [
  ...STAGES.map((stage) => ({ value: stage.id, label: stage.shortTitle })),
  { value: "results", label: "النتيجة" },
];

const FACTS: { label: string; value: string }[] = [
  { label: "اليوزرز النشطين في اليوم", value: "حوالي 10 مليون" },
  { label: "الصور المرفوعة في اليوم", value: "حوالي 2 مليون" },
  { label: "القراءة للكتابة", value: "حوالي 100 إلى 1" },
  { label: "متوسط حجم الصورة", value: "حوالي 3 MB" },
  { label: "هدف رد الرفع", value: "أقل من ثانيتين" },
  { label: "جهوزية الـ thumbnails", value: "خلال 10 ثواني" },
  { label: "أوقات الذروة", value: "الترافيك ممكن يتضاعف" },
];

function emptyTicks(): Record<string, boolean[]> {
  const ticks: Record<string, boolean[]> = {};
  for (const stage of STAGES) {
    ticks[stage.id] = stage.items.map(() => false);
  }
  return ticks;
}

function normalizeTicks(raw: Record<string, boolean[]> | undefined): Record<string, boolean[]> {
  const next = emptyTicks();
  if (!raw) return next;
  for (const stage of STAGES) {
    const saved = raw[stage.id];
    if (!saved) continue;
    next[stage.id] = stage.items.map((_, i) => Boolean(saved[i]));
  }
  return next;
}

function readSaved(): SavedState | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    return {
      answers: parsed.answers ?? {},
      ticks: parsed.ticks ?? {},
      revealed: parsed.revealed ?? {},
      view: typeof parsed.view === "string" ? parsed.view : STAGES[0].id,
      remaining: typeof parsed.remaining === "number" ? parsed.remaining : TOTAL_SECONDS,
      running: Boolean(parsed.running),
      deadline: typeof parsed.deadline === "number" ? parsed.deadline : null,
    };
  } catch {
    return null;
  }
}

function hydrate(): SavedState {
  const saved = readSaved();
  if (!saved) {
    return {
      answers: {},
      ticks: emptyTicks(),
      revealed: {},
      view: STAGES[0].id,
      remaining: TOTAL_SECONDS,
      running: false,
      deadline: null,
    };
  }
  saved.ticks = normalizeTicks(saved.ticks);
  const known = VIEW_OPTIONS.some((option) => option.value === saved.view);
  if (!known) saved.view = STAGES[0].id;
  if (saved.remaining < 0) saved.remaining = 0;
  if (saved.remaining > TOTAL_SECONDS) saved.remaining = TOTAL_SECONDS;
  if (saved.running && saved.deadline != null) {
    const left = Math.max(0, Math.ceil((saved.deadline - Date.now()) / 1000));
    saved.remaining = left;
    if (left === 0) {
      saved.running = false;
      saved.deadline = null;
    }
  } else {
    saved.running = false;
    saved.deadline = null;
  }
  return saved;
}

function formatTime(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const mm = minutes < 10 ? `0${minutes}` : String(minutes);
  const ss = seconds < 10 ? `0${seconds}` : String(seconds);
  return `${mm}:${ss}`;
}

function scoreStage(
  stage: Stage,
  ticks: Record<string, boolean[]>,
): { done: number; total: number } {
  const values = ticks[stage.id] ?? [];
  const done = stage.items.reduce((count, _, index) => count + (values[index] ? 1 : 0), 0);
  return { done, total: stage.items.length };
}

function scoreTone(done: number, total: number): "success" | "warning" | undefined {
  if (total === 0) return undefined;
  const ratio = done / total;
  if (ratio >= 0.8) return "success";
  if (ratio < 0.5) return "warning";
  return undefined;
}

// UI Components

function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div
      className="page-container"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 16px 100px',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  );
}

function Button({
  label,
  onClick,
  variant,
  disabled,
  fullWidth,
}: {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'default';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    lineHeight: 1.4,
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    width: fullWidth ? '100%' : 'auto',
    minWidth: 44,
    background: isPrimary ? 'var(--accent)' : 'var(--bg-subtle)',
    color: isPrimary ? '#fff' : 'var(--text-primary)',
  };
  
  return (
    <button style={baseStyle} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const style: CSSProperties = {
    padding: '10px 14px',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.4,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    minWidth: 140,
    direction: 'rtl',
  };
  
  return (
    <select
      aria-label={label}
      style={style}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ActionRow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        width: '100%',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

function SoftCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        padding: 'clamp(20px, 5vw, 32px)',
        marginBottom: 24,
      }}
      dir="rtl"
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  caption,
  actions,
}: {
  title: string;
  caption?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        width: '100%',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}
    >
      <div style={{ flex: '1 1 200px' }}>
        <h2
          style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            lineHeight: 1.3,
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {caption && (
          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              margin: '6px 0 0',
            }}
          >
            {caption}
          </p>
        )}
        <div
          style={{
            width: 40,
            height: 3,
            borderRadius: 99,
            background: 'var(--accent)',
            marginTop: 12,
          }}
        />
      </div>
      {actions && <div style={{ flex: '0 1 auto' }}>{actions}</div>}
    </div>
  );
}

function BodyText({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <p
      style={{
        fontSize: '1rem',
        lineHeight: 1.7,
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
        margin: '0 0 20px',
      }}
    >
      {children}
    </p>
  );
}

function Hero() {
  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(24px, 6vw, 36px) clamp(20px, 5vw, 28px)',
        marginBottom: 24,
        background: 'linear-gradient(125deg, #0C2E36 0%, #155E57 52%, #1A7A6D 100%)',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
      }}
      dir="rtl"
    >
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.08)',
          top: -80,
          left: -40,
          pointerEvents: 'none',
        }}
      />
      <p
        style={{
          fontSize: '0.75rem',
          lineHeight: 1.5,
          letterSpacing: '0.04em',
          color: 'rgba(246,241,232,0.86)',
          margin: '0 0 10px',
        }}
      >
        تمرين مقابلات لمهندسين ومبرمجين
      </p>
      <h1
        style={{
          fontSize: 'clamp(1.5rem, 6vw, 2rem)',
          lineHeight: 1.2,
          fontWeight: 600,
          color: '#F6F1E8',
          margin: '0 0 14px',
        }}
      >
        System Design
      </h1>
      <div
        style={{
          width: 48,
          height: 3,
          borderRadius: 99,
          background: 'var(--color-gold)',
          marginBottom: 16,
        }}
      />
      <p
        style={{
          fontSize: '1rem',
          lineHeight: 1.6,
          color: 'rgba(246,241,232,0.86)',
          margin: 0,
        }}
      >
        اتدرّب على تصميم الأنظمة خطوة بخطوة، واكشف النقط بعد ما تجاوب، وقيّم مستواك في الآخر.
      </p>
    </div>
  );
}

function TipBanner({ lead, children }: { lead: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--accent-soft)',
        border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
        borderInlineStart: '3px solid var(--accent)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        marginBottom: 20,
      }}
    >
      <p
        style={{
          fontSize: '0.875rem',
          lineHeight: 1.5,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 6px',
        }}
      >
        {lead}
      </p>
      <p
        style={{
          fontSize: '0.875rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

function FactList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      {items.map((item, index) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px 0',
            borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              flex: '1 1 140px',
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontSize: '1rem',
              lineHeight: 1.5,
              fontWeight: 500,
              color: 'var(--text-primary)',
              flex: '1 1 120px',
              textAlign: 'end',
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function TimerReadout({ seconds, expired }: { seconds: number; expired: boolean }) {
  return (
    <p
      style={{
        fontSize: 'clamp(1.5rem, 5vw, 2rem)',
        lineHeight: 1.2,
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
        color: expired ? 'var(--warning)' : 'var(--accent)',
        background: 'var(--accent-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 16px',
        margin: 0,
      }}
    >
      {formatTime(seconds)}
    </p>
  );
}

function TimerTrack({ remaining }: { remaining: number }) {
  const ratio = Math.max(0, Math.min(1, remaining / TOTAL_SECONDS));
  return (
    <div
      style={{
        width: '100%',
        height: 8,
        borderRadius: 99,
        background: 'var(--bg-subtle)',
        marginTop: 20,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${ratio * 100}%`,
          height: '100%',
          borderRadius: 99,
          background: remaining === 0 ? 'var(--warning)' : 'var(--accent)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

function AnswerArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const style: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 180,
    resize: 'vertical',
    padding: 16,
    border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    lineHeight: 1.7,
    direction: 'rtl',
    outline: 'none',
    boxShadow: focused ? '0 0 0 3px var(--accent-soft)' : 'none',
    marginBottom: 20,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };
  return (
    <textarea
      value={value}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="اكتب إجابتك هنا…"
      aria-label={label}
      dir="rtl"
      rows={8}
      style={style}
    />
  );
}

function ScoreTicks({
  items,
  values,
  onToggle,
}: {
  items: string[];
  values: boolean[];
  onToggle: (index: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        marginBottom: 20,
      }}
      dir="rtl"
    >
      {items.map((item, index) => {
        const checked = Boolean(values[index]);
        const box: CSSProperties = {
          width: 20,
          height: 20,
          flexShrink: 0,
          marginTop: 2,
          boxSizing: 'border-box',
          border: checked ? 'none' : '1.5px solid var(--accent)',
          borderRadius: 'var(--radius-sm)',
          background: checked ? 'var(--accent)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        };
        const row: CSSProperties = {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 14px',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          background: checked ? 'var(--accent-soft)' : 'transparent',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          textAlign: 'start',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        };
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(index)}
            aria-pressed={checked}
            style={row}
          >
            <span style={box} aria-hidden="true">
              {checked && (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M2 6.2 L4.8 9 L10 3"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span style={{ flex: '1 1 200px' }}>{item}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScoreBadge({ done, total }: { done: number; total: number }) {
  const tone = scoreTone(done, total);
  const background =
    tone === 'success'
      ? 'var(--success-bg)'
      : tone === 'warning'
        ? 'var(--warning-bg)'
        : 'var(--accent-soft)';
  const color =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'warning'
        ? 'var(--warning)'
        : 'var(--accent)';
  return (
    <p
      style={{
        fontSize: '0.875rem',
        lineHeight: 1.5,
        fontWeight: 500,
        color,
        background,
        borderRadius: 'var(--radius-lg)',
        padding: '10px 16px',
        margin: '0 0 20px',
        display: 'inline-block',
      }}
    >
      {`غطّيت ${done} من ${total} نقط في المرحلة دي.`}
    </p>
  );
}

function Metrics({
  metrics,
}: {
  metrics: { value: string; label: string; detail?: string; tone?: 'success' | 'warning' }[];
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 16,
        width: '100%',
        marginBottom: 24,
      }}
    >
      {metrics.map((m) => {
        const tone = m.tone;
        const color =
          tone === 'success'
            ? 'var(--success)'
            : tone === 'warning'
              ? 'var(--warning)'
              : 'var(--accent)';
        return (
          <div
            key={m.label}
            style={{
              padding: 16,
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                fontWeight: 600,
                color,
                margin: '0 0 4px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {m.value}
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {m.label}
            </p>
            {m.detail && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  margin: '4px 0 0',
                }}
              >
                {m.detail}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Bars({
  bars,
}: {
  bars: { label: string; value: number; display: string }[];
}) {
  return (
    <div style={{ width: '100%', marginBottom: 24 }}>
      {bars.map((bar) => (
        <div key={bar.label} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {bar.label}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {bar.display}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 99,
              background: 'var(--bg-subtle)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${bar.value}%`,
                height: '100%',
                borderRadius: 99,
                background: bar.value >= 80 ? 'var(--success)' : bar.value < 50 ? 'var(--warning)' : 'var(--accent)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsTable({
  rows,
}: {
  rows: { stage: string; done: number; total: number }[];
}) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', marginBottom: 24 }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'start', padding: '12px 8px', borderBottom: '1px solid var(--border-default)', fontWeight: 600 }}>
              المرحلة
            </th>
            <th style={{ textAlign: 'end', padding: '12px 8px', borderBottom: '1px solid var(--border-default)', fontWeight: 600 }}>
              النقط
            </th>
            <th style={{ textAlign: 'end', padding: '12px 8px', borderBottom: '1px solid var(--border-default)', fontWeight: 600 }}>
              النسبة
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const percent = row.total === 0 ? 0 : Math.round((row.done / row.total) * 100);
            const tone = scoreTone(row.done, row.total);
            const color =
              tone === 'success'
                ? 'var(--success)'
                : tone === 'warning'
                  ? 'var(--warning)'
                  : 'var(--text-primary)';
            return (
              <tr key={row.stage}>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  {row.stage}
                </td>
                <td style={{ textAlign: 'end', padding: '12px 8px', borderBottom: '1px solid var(--border-subtle)', color }}>
                  {row.done} من {row.total}
                </td>
                <td style={{ textAlign: 'end', padding: '12px 8px', borderBottom: '1px solid var(--border-subtle)', color }}>
                  {percent}٪
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FloatingBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="floating-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        padding: '16px 20px',
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        zIndex: 100,
      }}
    >
      {children}
    </div>
  );
}

function BackToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <button
      onClick={scrollToTop}
      aria-label="رجوع لفوق"
      style={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-lg)',
        border: 'none',
        background: 'var(--bg-subtle)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}

export default function App() {
  const [boot] = useState(hydrate);
  const [answers, setAnswers] = useState<Record<string, string>>(boot.answers);
  const [ticks, setTicks] = useState<Record<string, boolean[]>>(boot.ticks);
  const [revealed, setRevealed] = useState<Record<string, boolean>>(boot.revealed);
  const [view, setView] = useState(boot.view);
  const [remaining, setRemaining] = useState(boot.remaining);
  const [running, setRunning] = useState(boot.running);
  const [deadline, setDeadline] = useState<number | null>(boot.deadline);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    try {
      if (typeof localStorage === "undefined") return;
      const payload: SavedState = {
        answers,
        ticks,
        revealed,
        view,
        remaining,
        running,
        deadline,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Persistence is best-effort
    }
  }, [answers, ticks, revealed, view, remaining, running, deadline]);

  useEffect(() => {
    if (!running || deadline == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        setDeadline(null);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, deadline]);

  const expired = remaining === 0;
  const isResults = view === "results";
  const stageIndex = STAGES.findIndex((stage) => stage.id === view);
  const stage = !isResults && stageIndex >= 0 ? STAGES[stageIndex] : null;

  const totals = useMemo(() => {
    let done = 0;
    let total = 0;
    let markedStages = 0;
    let writtenStages = 0;
    const perStage = STAGES.map((item) => {
      const score = scoreStage(item, ticks);
      done += score.done;
      total += score.total;
      if (score.done > 0) markedStages += 1;
      const text = (answers[item.id] ?? "").trim();
      if (text.length > 0) writtenStages += 1;
      return { stage: item, ...score };
    });
    return { done, total, markedStages, writtenStages, perStage };
  }, [answers, ticks]);

  const startTimer = () => {
    if (remaining <= 0) return;
    setDeadline(Date.now() + remaining * 1000);
    setRunning(true);
  };

  const pauseTimer = () => {
    if (deadline != null) {
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }
    setRunning(false);
    setDeadline(null);
  };

  const resetTimer = () => {
    setRunning(false);
    setDeadline(null);
    setRemaining(TOTAL_SECONDS);
  };

  const goPrev = () => {
    setConfirmReset(false);
    if (isResults) {
      setView(STAGES[STAGES.length - 1].id);
      return;
    }
    if (stageIndex > 0) setView(STAGES[stageIndex - 1].id);
  };

  const goNext = () => {
    setConfirmReset(false);
    if (isResults) return;
    if (stageIndex < STAGES.length - 1) setView(STAGES[stageIndex + 1].id);
    else setView("results");
  };

  const resetAll = () => {
    setAnswers({});
    setTicks(emptyTicks());
    setRevealed({});
    setView(STAGES[0].id);
    setRunning(false);
    setDeadline(null);
    setRemaining(TOTAL_SECONDS);
    setConfirmReset(false);
  };

  const summaryText = (() => {
    if (totals.done === 0) {
      return "لسه معلّمتش نقط. اكشف النقط في كل مرحلة وعلّم اللي غطّيته، وبعدين ارجع هنا.";
    }
    const ratio = totals.done / totals.total;
    if (ratio >= 0.8) {
      return "تقييم قوي. غطّيت معظم النقط اللي الإنترفيور بيكون مستنّيها.";
    }
    if (ratio >= 0.5) {
      return "بداية كويسة. راجع المراحل اللي نسبتها أقل، وحاول تكمّل النقط الناقصة.";
    }
    return "كمّل التمرين وارجع للمراحل الناقصة. التقييم بيتحسّن كل ما تعلّم نقط أكتر بعد ما تجاوب.";
  })();

  const percent = totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 100);
  const stageSelect = (
    <Select
      label="انتقل بين المراحل"
      options={VIEW_OPTIONS}
      value={view}
      onChange={(value: string) => {
        setConfirmReset(false);
        setView(value);
      }}
    />
  );

  return (
    <PageContainer>
      <Hero />

      <SoftCard>
        <CardHeader title="المسألة" />
        <TipBanner lead="جاوب الأول">
          اكتب إجابتك في كل مرحلة قبل ما تكشف النقط. بعد الكشف، علّم اللي غطّيته عشان تقيّم نفسك. الإجابات بتتحفظ في المتصفح. الميقات اختياري: 45 دقيقة للمقابلة كلها، ابدأه لما تكون جاهز.
        </TipBanner>
        <BodyText>
          عايزينك تصمم خدمة رفع صور لأبلكيشن سوشيال ميديا. اليوزر بيرفع صورة، والسيستم لازم يخزنها، ويعمل منها تلات مقاسات مصغرة: صغير ووسط وكبير. وبعد كده اليوزرز التانيين يقدروا يشوفوها بسرعة.
        </BodyText>
        <FactList items={FACTS} />
        <BodyText>
          صمم الأركيتكتشر، واشرح هتعمل scale إزاي، وهتراقب السيستم إزاي، وإيه أماكن الاختناق اللي متوقع تظهر وهتحلها إزاي.
        </BodyText>
      </SoftCard>

      <SoftCard>
        <CardHeader title="الميقات" caption="اختياري، 45 دقيقة للمقابلة كلها" />
        <ActionRow>
          <TimerReadout seconds={remaining} expired={expired} />
          {running ? (
            <Button label="وقّف" onClick={pauseTimer} />
          ) : (
            <Button
              label={remaining === TOTAL_SECONDS ? "ابدأ الميقات" : "كمّل"}
              variant="primary"
              onClick={startTimer}
              disabled={remaining <= 0}
            />
          )}
          <Button label="صفّر الميقات" onClick={resetTimer} />
        </ActionRow>
        <TimerTrack remaining={remaining} />
      </SoftCard>

      {stage && (
        <SoftCard>
          <CardHeader
            title={stage.title}
            caption={`المرحلة ${stageIndex + 1} من ${STAGES.length}`}
            actions={stageSelect}
          />
          <BodyText>{stage.prompt}</BodyText>
          <AnswerArea
            label={`إجابة ${stage.title}`}
            value={answers[stage.id] ?? ""}
            onChange={(value: string) => {
              setAnswers((prev) => ({ ...prev, [stage.id]: value }));
            }}
          />
          <ActionRow>
            <Button
              label={revealed[stage.id] ? "خبّي النقط" : "اكشف نقط الإجابة القوية"}
              variant={revealed[stage.id] ? undefined : "primary"}
              onClick={() => {
                setRevealed((prev) => ({ ...prev, [stage.id]: !prev[stage.id] }));
              }}
            />
          </ActionRow>
          {revealed[stage.id] && (
            <>
              <div style={{ height: 16 }} />
              <BodyText muted>
                علّم كل نقطة غطّيتها في كلامك. القائمة دي مرجعية، مش لازم تبقى زي الإجابة حرف بحرف.
              </BodyText>
              <ScoreTicks
                items={stage.items}
                values={ticks[stage.id] ?? stage.items.map(() => false)}
                onToggle={(index: number) => {
                  setTicks((prev) => {
                    const current = prev[stage.id] ?? stage.items.map(() => false);
                    return {
                      ...prev,
                      [stage.id]: current.map((value, itemIndex) =>
                        itemIndex === index ? !value : value,
                      ),
                    };
                  });
                }}
              />
              <ScoreBadge
                done={scoreStage(stage, ticks).done}
                total={scoreStage(stage, ticks).total}
              />
            </>
          )}
          <ActionRow>
            <Button label="السابق" onClick={goPrev} disabled={stageIndex <= 0} />
            <Button
              label={stageIndex === STAGES.length - 1 ? "شوف النتيجة" : "اللي بعده"}
              variant="primary"
              onClick={goNext}
            />
          </ActionRow>
        </SoftCard>
      )}

      {isResults && (
        <SoftCard>
          <CardHeader title="تقييمك" actions={stageSelect} />
          <BodyText>{summaryText}</BodyText>
          <Metrics
            metrics={[
              {
                value: `${totals.done} من ${totals.total}`,
                label: "المجموع",
                detail: "نقط الإجابة القوية",
                tone: scoreTone(totals.done, totals.total),
              },
              {
                value: `${percent}٪`,
                label: "النسبة",
                tone: scoreTone(totals.done, totals.total),
              },
              {
                value: `${totals.markedStages} من ${STAGES.length}`,
                label: "مراحل معلّمة",
              },
              {
                value: `${totals.writtenStages} من ${STAGES.length}`,
                label: "مراحل مكتوبة",
              },
            ]}
          />
          <Bars
            bars={totals.perStage.map((row) => ({
              label: row.stage.shortTitle,
              value: row.total === 0 ? 0 : Math.round((row.done / row.total) * 100),
              display: `${row.done} / ${row.total}`,
            }))}
          />
          <ResultsTable
            rows={totals.perStage.map((row) => ({
              stage: row.stage.title,
              done: row.done,
              total: row.total,
            }))}
          />
          <ActionRow>
            <Button label="ارجع لآخر مرحلة" onClick={goPrev} />
            {confirmReset ? (
              <Button label="أيوه، امسح كل حاجة" variant="primary" onClick={resetAll} />
            ) : (
              <Button label="ابدأ من جديد" onClick={() => setConfirmReset(true)} />
            )}
            {confirmReset && (
              <Button label="إلغاء" onClick={() => setConfirmReset(false)} />
            )}
          </ActionRow>
          {confirmReset && (
            <>
              <div style={{ height: 12 }} />
              <BodyText muted>
                هتمسح الإجابات والعلامات والميقات، ومش هتقدر ترجّعهم بعد كده.
              </BodyText>
            </>
          )}
        </SoftCard>
      )}

      <div style={{ height: 88 }} aria-hidden="true" />

      <FloatingBar>
        <Button label="السابق" onClick={goPrev} disabled={!isResults && stageIndex <= 0} />
        <Button
          label={isResults || stageIndex === STAGES.length - 1 ? "النتيجة" : "اللي بعده"}
          variant="primary"
          onClick={() => {
            if (isResults) return;
            goNext();
          }}
          disabled={isResults}
        />
        <BackToTop />
      </FloatingBar>
    </PageContainer>
  );
}
