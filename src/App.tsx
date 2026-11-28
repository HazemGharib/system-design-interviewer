import { useEffect, useMemo, useState, useCallback, type ReactNode, type ChangeEvent, type CSSProperties } from 'react';
import type { Lang, Level, Scenario, Stage, SavedScenarioState, GlobalState, ChecklistItem } from './types';
import { SCENARIOS, getScenarioById } from './scenarios';
import { t, localizedText } from './i18n';
import { DrawingBoard } from './components/DrawingBoard';
import { SolutionWalkthrough } from './components/SolutionWalkthrough';
import { CapacityCalculator } from './components/CapacityCalculator';
import { ChaosToggle, ChaosIncidentCard } from './components/ChaosMode';
import { TradeoffCards } from './components/TradeoffCards';
import { RadarChart } from './components/RadarChart';
import { CheatSheet } from './components/CheatSheet';
import { Glossary } from './components/Glossary';
import { LinkedText } from './components/TermLink';
import { GLOSSARY } from './content/loadContent';
import { emptyDrawing } from './interactive/drawingData';
import { emptyCapacity } from './interactive/capacityData';
import { emptyChaos } from './interactive/chaosData';
import { emptyTradeoffs } from './interactive/tradeoffData';
import { computeRadarScores, overallFromRadar } from './interactive/radar';

const ALL_TERM_IDS = GLOSSARY.terms.map(term => term.id);

const TOTAL_SECONDS = 45 * 60;
const STORAGE_KEY = 'sysdesign-interview-v5';

type AppRoute =
  | { name: 'home' }
  | { name: 'cheatsheet' }
  | { name: 'glossary'; termId?: string };

function parseHash(): AppRoute {
  const hash = typeof location !== 'undefined' ? location.hash : '';
  if (hash === '#/cheatsheet') return { name: 'cheatsheet' };
  const gloss = hash.match(/^#\/glossary(?:\/([^/?#]+))?$/);
  if (gloss) return { name: 'glossary', termId: gloss[1] ? decodeURIComponent(gloss[1]) : undefined };
  return { name: 'home' };
}

function getDefaultScenarioState(scenario: Scenario, level: Level, chaosEnabled = false): SavedScenarioState {
  const ticks: Record<string, boolean[]> = {};
  const expanded: Record<string, Record<number, boolean>> = {};
  for (const stage of scenario.stages) {
    if (level === 'senior' && stage.level === 'staff') continue;
    ticks[stage.id] = stage.items.map(() => false);
    expanded[stage.id] = {};
  }
  return {
    answers: {},
    ticks,
    revealed: {},
    expanded,
    view: scenario.stages.filter(s => level === 'staff' || s.level === 'senior')[0]?.id || '',
    remaining: TOTAL_SECONDS,
    running: false,
    deadline: null,
    level,
    drawing: emptyDrawing(),
    capacity: emptyCapacity(scenario.id),
    chaos: emptyChaos(chaosEnabled),
    tradeoffs: emptyTradeoffs(scenario.id),
    history: [],
  };
}

function normalizeScenarioState(scenario: Scenario, raw: Partial<SavedScenarioState> | undefined, level: Level = 'senior'): SavedScenarioState {
  const base = getDefaultScenarioState(scenario, raw?.level || level, raw?.chaos?.enabled);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    drawing: {
      ...base.drawing,
      ...(raw.drawing || {}),
      blocks: raw.drawing?.blocks || base.drawing.blocks,
      containers: raw.drawing?.containers || base.drawing.containers || [],
      edges: raw.drawing?.edges || base.drawing.edges,
    },
    capacity: {
      ...base.capacity,
      ...(raw.capacity || {}),
      variables: {
        ...base.capacity.variables,
        ...(raw.capacity?.helpers || {}),
        ...(raw.capacity?.variables || {}),
      },
      values: { ...base.capacity.values, ...(raw.capacity?.values || {}) },
      results: raw.capacity?.results || {},
      checked: !!raw.capacity?.checked,
      autoChecked: !!raw.capacity?.autoChecked,
      autoResults: raw.capacity?.autoResults || {},
    },
    chaos: { ...base.chaos, ...(raw.chaos || {}), responses: raw.chaos?.responses || {}, triggered: raw.chaos?.triggered || [] },
    tradeoffs: { answers: { ...base.tradeoffs.answers, ...(raw.tradeoffs?.answers || {}) } },
    history: raw.history || [],
  };
}

function readGlobalState(): GlobalState {
  try {
    if (typeof localStorage === 'undefined') return { lang: 'ar', currentScenario: null, scenarios: {} };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lang: 'ar', currentScenario: null, scenarios: {} };
    const parsed = JSON.parse(raw);
    return {
      lang: parsed.lang === 'en' ? 'en' : 'ar',
      currentScenario: parsed.currentScenario ?? null,
      scenarios: parsed.scenarios ?? {},
    };
  } catch {
    return { lang: 'ar', currentScenario: null, scenarios: {} };
  }
}

function saveGlobalState(state: GlobalState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch { /* ignore */ }
}

function getFilteredStages(scenario: Scenario, level: Level): Stage[] {
  return scenario.stages.filter(s => level === 'staff' || s.level === 'senior');
}

function formatTime(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function scoreTone(done: number, total: number): 'success' | 'warning' | undefined {
  if (total === 0) return undefined;
  const ratio = done / total;
  if (ratio >= 0.8) return 'success';
  if (ratio < 0.5) return 'warning';
  return undefined;
}

// UI Components
function PageContainer({ children, lang }: { children: ReactNode; lang: Lang }) {
  return (
    <div
      className="page-container"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ maxWidth: 760, margin: '0 auto', padding: '56px 16px 100px', minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}

function Button({ label, onClick, variant, disabled, fullWidth, small }: {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'default';
  disabled?: boolean;
  fullWidth?: boolean;
  small?: boolean;
}) {
  const isPrimary = variant === 'primary';
  return (
    <button
      className={`app-btn${disabled ? ' app-btn--disabled' : ''}${isPrimary ? ' app-btn--primary' : ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: small ? '8px 14px' : '12px 20px', fontSize: small ? '0.8125rem' : '0.9375rem', fontWeight: 500,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.15s ease',
        width: fullWidth ? '100%' : 'auto',
        background: isPrimary && !disabled ? 'var(--accent)' : 'var(--bg-subtle)',
        color: disabled ? 'var(--text-secondary)' : isPrimary ? '#fff' : 'var(--text-primary)',
        touchAction: 'manipulation',
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function Select({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      style={{
        padding: '10px 14px', fontSize: '0.875rem', fontWeight: 500, borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)',
        cursor: 'pointer', minWidth: 140,
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function SoftCard({ children, lang }: { children: ReactNode; lang?: Lang }) {
  return (
    <div
      className="soft-card"
      dir={lang === 'ar' ? 'rtl' : lang === 'en' ? 'ltr' : undefined}
      style={{
        width: '100%', boxSizing: 'border-box', background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)', padding: 'clamp(20px, 5vw, 32px)', marginBottom: 24,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, caption, actions }: { title: string; caption?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ flex: '1 1 200px' }}>
        <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', lineHeight: 1.3, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
        {caption && <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: '6px 0 0' }}>{caption}</p>}
        <div style={{ width: 40, height: 3, borderRadius: 99, background: 'var(--accent)', marginTop: 12 }} />
      </div>
      {actions && <div style={{ flex: '0 1 auto' }}>{actions}</div>}
    </div>
  );
}

function BodyText({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <p style={{ fontSize: '1rem', lineHeight: 1.7, color: muted ? 'var(--text-secondary)' : 'var(--text-primary)', margin: '0 0 20px' }}>{children}</p>;
}

function Hero({ lang, onOpenCheatsheet, onOpenGlossary }: { lang: Lang; onOpenCheatsheet?: () => void; onOpenGlossary?: () => void }) {
  const linkBtn: CSSProperties = {
    padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(246,241,232,0.35)',
    background: 'rgba(255,255,255,0.12)', color: '#F6F1E8', fontWeight: 600, fontSize: '0.8125rem',
    cursor: 'pointer', minHeight: 40, touchAction: 'manipulation',
  };
  return (
    <div style={{
      width: '100%', borderRadius: 'var(--radius-xl)', padding: 'clamp(24px, 6vw, 36px) clamp(20px, 5vw, 28px)',
      marginBottom: 24, background: 'linear-gradient(125deg, #0C2E36 0%, #155E57 52%, #1A7A6D 100%)',
      boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', top: -80, left: lang === 'ar' ? undefined : -40, right: lang === 'ar' ? -40 : undefined }} />
      <p style={{ fontSize: '0.75rem', letterSpacing: '0.04em', color: 'rgba(246,241,232,0.86)', margin: '0 0 10px' }}>{t('appTagline', lang)}</p>
      <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 600, color: '#F6F1E8', margin: '0 0 14px' }}>System Design</h1>
      <div style={{ width: 48, height: 3, borderRadius: 99, background: 'var(--color-gold)', marginBottom: 16 }} />
      <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(246,241,232,0.86)', margin: '0 0 14px' }}>{t('appDescription', lang)}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {onOpenCheatsheet && (
          <button type="button" onClick={onOpenCheatsheet} style={linkBtn}>
            {lang === 'ar' ? 'مرجع الأنماط' : 'Cheat Sheet'}
          </button>
        )}
        {onOpenGlossary && (
          <button type="button" onClick={onOpenGlossary} style={linkBtn}>
            {lang === 'ar' ? 'القاموس' : 'Glossary'}
          </button>
        )}
      </div>
    </div>
  );
}

function LangToggle({ lang, onToggle }: { lang: Lang; onToggle: () => void }) {
  return (
    <button
      className="lang-toggle"
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top))',
        [lang === 'ar' ? 'left' : 'right']: 12,
        zIndex: 200,
        padding: '8px 14px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-elevated)',
        color: 'var(--accent)',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {lang === 'ar' ? 'English' : 'عربي'}
    </button>
  );
}

function LevelToggle({ level, onChange, lang }: { level: Level; onChange: (l: Level) => void; lang: Lang }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('level', lang)}:</span>
      <button
        onClick={() => onChange('senior')}
        style={{
          padding: '6px 12px', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none',
          background: level === 'senior' ? 'var(--accent)' : 'var(--bg-subtle)',
          color: level === 'senior' ? '#fff' : 'var(--text-primary)', cursor: 'pointer',
        }}
      >
        {t('senior', lang)}
      </button>
      <button
        onClick={() => onChange('staff')}
        style={{
          padding: '6px 12px', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none',
          background: level === 'staff' ? 'var(--accent)' : 'var(--bg-subtle)',
          color: level === 'staff' ? '#fff' : 'var(--text-primary)', cursor: 'pointer',
        }}
      >
        {t('staff', lang)}
      </button>
    </div>
  );
}

type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';

function difficultyTone(en: string): 'easy' | 'medium' | 'hard' | 'other' {
  const v = en.toLowerCase();
  if (v === 'easy') return 'easy';
  if (v === 'medium') return 'medium';
  if (v === 'hard') return 'hard';
  return 'other';
}

function ScenarioCard({ scenario, lang, onStart }: { scenario: Scenario; lang: Lang; onStart: () => void }) {
  const tone = difficultyTone(scenario.difficulty.en);
  return (
    <div className="scenario-card">
      <div className="scenario-card__top">
        <h3 className="scenario-card__title">{localizedText(scenario.title, lang)}</h3>
        <span className={`scenario-card__badge scenario-card__badge--${tone}`}>
          {localizedText(scenario.difficulty, lang)}
        </span>
      </div>
      <p className="scenario-card__desc">{localizedText(scenario.description, lang)}</p>
      <div className="scenario-card__meta">
        <span>
          <strong>{t('estimatedTime', lang)}:</strong> {localizedText(scenario.estimatedTime, lang)}
        </span>
      </div>
      <Button label={t('startScenario', lang)} variant="primary" onClick={onStart} />
    </div>
  );
}

function ScenarioPicker({
  scenarios,
  lang,
  onStart,
}: {
  scenarios: Scenario[];
  lang: Lang;
  onStart: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter(sc => {
      if (difficulty !== 'all' && sc.difficulty.en !== difficulty) return false;
      if (!q) return true;
      const hay = `${localizedText(sc.title, lang)} ${localizedText(sc.description, lang)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [scenarios, query, difficulty, lang]);

  const chips: { id: DifficultyFilter; label: string }[] = [
    { id: 'all', label: t('filterAll', lang) },
    { id: 'Easy', label: t('filterEasy', lang) },
    { id: 'Medium', label: t('filterMedium', lang) },
    { id: 'Hard', label: t('filterHard', lang) },
  ];

  return (
    <div className="scenario-picker">
      <input
        className="scenario-picker__search"
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('searchScenarios', lang)}
        aria-label={t('searchScenarios', lang)}
      />
      <div className="scenario-picker__filters" role="group" aria-label={t('difficulty', lang)}>
        {chips.map(chip => (
          <button
            key={chip.id}
            type="button"
            className={`scenario-picker__chip${difficulty === chip.id ? ' is-active' : ''}`}
            onClick={() => setDifficulty(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="scenario-picker__empty">{t('noScenariosMatch', lang)}</p>
      ) : (
        <div className="scenario-picker__grid">
          {filtered.map(sc => (
            <ScenarioCard key={sc.id} scenario={sc} lang={lang} onStart={() => onStart(sc.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FactList({ items, lang }: { items: Scenario['facts']; lang: Lang }) {
  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', flex: '1 1 140px' }}>{localizedText(item.label, lang)}</span>
          <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', flex: '1 1 120px', textAlign: lang === 'ar' ? 'start' : 'end' }}>{localizedText(item.value, lang)}</span>
        </div>
      ))}
    </div>
  );
}

function TimerReadout({ seconds, expired }: { seconds: number; expired: boolean }) {
  return (
    <p style={{
      fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 500, fontVariantNumeric: 'tabular-nums',
      color: expired ? 'var(--warning)' : 'var(--accent)', background: 'var(--accent-soft)',
      borderRadius: 'var(--radius-lg)', padding: '10px 16px', margin: 0,
    }}>
      {formatTime(seconds)}
    </p>
  );
}

function TimerTrack({ remaining }: { remaining: number }) {
  const ratio = Math.max(0, Math.min(1, remaining / TOTAL_SECONDS));
  return (
    <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'var(--bg-subtle)', marginTop: 20, overflow: 'hidden' }}>
      <div style={{ width: `${ratio * 100}%`, height: '100%', borderRadius: 99, background: remaining === 0 ? 'var(--warning)' : 'var(--accent)', transition: 'width 0.3s ease' }} />
    </div>
  );
}

function AnswerArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      aria-label={label}
      rows={8}
      style={{
        width: '100%', boxSizing: 'border-box', minHeight: 180, resize: 'vertical', padding: 16,
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.7, outline: 'none',
        boxShadow: focused ? '0 0 0 3px var(--accent-soft)' : 'none', marginBottom: 0,
      }}
    />
  );
}

function ExpandableDetail({ item, expanded, onToggle, lang, onOpenTerm }: {
  item: ChecklistItem; expanded: boolean; onToggle: () => void; lang: Lang; onOpenTerm: (id: string) => void;
}) {
  const detail = item.detail[lang];
  const link = (text: string) => (
    <LinkedText text={text} lang={lang} termIds={ALL_TERM_IDS} onOpenTerm={onOpenTerm} />
  );
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={onToggle}
        style={{
          fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 8px', borderRadius: 'var(--radius-sm)', textDecoration: 'underline',
        }}
      >
        {expanded ? t('collapseDetails', lang) : t('expandDetails', lang)}
      </button>
      {expanded && (
        <div style={{ marginTop: 12, padding: 16, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--accent)' }}>{t('whyItMatters', lang)}:</strong> {link(detail.why)}</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--accent)' }}>{t('howItWorks', lang)}:</strong> {link(detail.how)}</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--warning)' }}>{t('tradeoffs', lang)}:</strong> {link(detail.tradeoffs)}</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--success)' }}>{t('examples', lang)}:</strong> {link(detail.examples)}</p>
          <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-secondary)' }}>{t('commonMistakes', lang)}:</strong> {link(detail.mistakes)}</p>
        </div>
      )}
    </div>
  );
}

function ScoreTicks({ items, values, expanded, onToggle, onToggleExpand, lang, onOpenTerm }: {
  items: ChecklistItem[];
  values: boolean[];
  expanded: Record<number, boolean>;
  onToggle: (i: number) => void;
  onToggleExpand: (i: number) => void;
  lang: Lang;
  onOpenTerm: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 0 }}>
      {items.map((item, i) => {
        const checked = Boolean(values[i]);
        return (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: checked ? 'var(--accent-soft)' : 'transparent' }}>
            <button
              type="button"
              onClick={() => onToggle(i)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', border: 'none', background: 'none',
                color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.6, textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', padding: 0,
              }}
            >
              <span style={{
                width: 20, height: 20, flexShrink: 0, marginTop: 2, border: checked ? 'none' : '1.5px solid var(--accent)',
                borderRadius: 'var(--radius-sm)', background: checked ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {checked && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.2 L4.8 9 L10 3" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>
              <span style={{ flex: 1 }}>{localizedText(item.text, lang)}</span>
            </button>
            <ExpandableDetail item={item} expanded={!!expanded[i]} onToggle={() => onToggleExpand(i)} lang={lang} onOpenTerm={onOpenTerm} />
          </div>
        );
      })}
    </div>
  );
}

function ScoreBadge({ done, total, lang }: { done: number; total: number; lang: Lang }) {
  const tone = scoreTone(done, total);
  const bg = tone === 'success' ? 'var(--success-bg)' : tone === 'warning' ? 'var(--warning-bg)' : 'var(--accent-soft)';
  const color = tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : 'var(--accent)';
  return (
    <p style={{ fontSize: '0.875rem', fontWeight: 500, color, background: bg, borderRadius: 'var(--radius-lg)', padding: '10px 16px', margin: '0 0 20px', display: 'inline-block' }}>
      {t('coveredPoints', lang)} {done} {lang === 'ar' ? 'من' : 'of'} {total} {t('pointsInStage', lang)}.
    </p>
  );
}

function Metrics({ metrics }: { metrics: { value: string; label: string; detail?: string; tone?: 'success' | 'warning' }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, width: '100%', marginBottom: 24 }}>
      {metrics.map((m) => {
        const color = m.tone === 'success' ? 'var(--success)' : m.tone === 'warning' ? 'var(--warning)' : 'var(--accent)';
        return (
          <div key={m.label} style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <p style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600, color, margin: '0 0 4px', fontVariantNumeric: 'tabular-nums' }}>{m.value}</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{m.label}</p>
            {m.detail && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{m.detail}</p>}
          </div>
        );
      })}
    </div>
  );
}

function Bars({ bars }: { bars: { label: string; value: number; display: string }[] }) {
  return (
    <div style={{ width: '100%', marginBottom: 24 }}>
      {bars.map((bar) => (
        <div key={bar.label} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{bar.label}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{bar.display}</span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
            <div style={{ width: `${bar.value}%`, height: '100%', borderRadius: 99, background: bar.value >= 80 ? 'var(--success)' : bar.value < 50 ? 'var(--warning)' : 'var(--accent)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsTable({ rows, lang }: { rows: { stage: string; done: number; total: number }[]; lang: Lang }) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', marginBottom: 24 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '12px 8px', borderBottom: '1px solid var(--border-default)', fontWeight: 600 }}>{t('stage', lang)}</th>
            <th style={{ textAlign: lang === 'ar' ? 'left' : 'right', padding: '12px 8px', borderBottom: '1px solid var(--border-default)', fontWeight: 600 }}>{t('points', lang)}</th>
            <th style={{ textAlign: lang === 'ar' ? 'left' : 'right', padding: '12px 8px', borderBottom: '1px solid var(--border-default)', fontWeight: 600 }}>{t('ratio', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const percent = row.total === 0 ? 0 : Math.round((row.done / row.total) * 100);
            const tone = scoreTone(row.done, row.total);
            const color = tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : 'var(--text-primary)';
            return (
              <tr key={row.stage}>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--border-subtle)' }}>{row.stage}</td>
                <td style={{ textAlign: lang === 'ar' ? 'left' : 'right', padding: '12px 8px', borderBottom: '1px solid var(--border-subtle)', color }}>{row.done} {lang === 'ar' ? 'من' : 'of'} {row.total}</td>
                <td style={{ textAlign: lang === 'ar' ? 'left' : 'right', padding: '12px 8px', borderBottom: '1px solid var(--border-subtle)', color }}>{percent}%</td>
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
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12,
      padding: '16px 20px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 100,
    }}>
      {children}
    </div>
  );
}

function BackToTop() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Go to top"
      style={{
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', cursor: 'pointer',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}

export default function App() {
  const [globalState, setGlobalState] = useState<GlobalState>(readGlobalState);
  const { lang, currentScenario } = globalState;
  const [confirmReset, setConfirmReset] = useState(false);
  const [chaosPref, setChaosPref] = useState(false);
  const [route, setRoute] = useState<AppRoute>(() => parseHash());
  const [routeReturn, setRouteReturn] = useState<string>('');

  const scenario = currentScenario ? getScenarioById(currentScenario) : null;
  const scenarioState = scenario
    ? normalizeScenarioState(scenario, globalState.scenarios[scenario.id], globalState.scenarios[scenario.id]?.level || 'senior')
    : null;

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const updateGlobalState = useCallback((updates: Partial<GlobalState>) => {
    setGlobalState(prev => {
      const next = { ...prev, ...updates };
      saveGlobalState(next);
      return next;
    });
  }, []);

  const updateScenarioState = useCallback((updates: Partial<SavedScenarioState>) => {
    if (!scenario) return;
    setGlobalState(prev => {
      const current = normalizeScenarioState(scenario, prev.scenarios[scenario.id]);
      const next = {
        ...prev,
        scenarios: {
          ...prev.scenarios,
          [scenario.id]: { ...current, ...updates },
        },
      };
      saveGlobalState(next);
      return next;
    });
  }, [scenario]);

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    updateGlobalState({ lang: newLang });
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const rememberReturn = () => {
    setRouteReturn(location.hash || '');
  };
  const openCheatsheet = () => {
    rememberReturn();
    location.hash = '#/cheatsheet';
    setRoute({ name: 'cheatsheet' });
  };
  const openGlossary = (termId?: string) => {
    rememberReturn();
    location.hash = termId ? `#/glossary/${termId}` : '#/glossary';
    setRoute({ name: 'glossary', termId });
  };
  const goBackFromContent = () => {
    if (routeReturn && routeReturn !== location.hash) {
      location.hash = routeReturn;
      setRoute(parseHash());
      return;
    }
    location.hash = '';
    setRoute({ name: 'home' });
  };

  const startScenario = (id: string) => {
    const sc = getScenarioById(id);
    if (!sc) return;
    const existing = globalState.scenarios[id]
      ? normalizeScenarioState(sc, globalState.scenarios[id])
      : getDefaultScenarioState(sc, 'senior', chaosPref);
    if (!globalState.scenarios[id]) {
      existing.chaos.enabled = chaosPref;
    } else {
      existing.chaos = { ...existing.chaos, enabled: chaosPref, activeIncidentId: null, deadline: null };
    }
    updateGlobalState({
      currentScenario: id,
      scenarios: {
        ...globalState.scenarios,
        [id]: existing,
      },
    });
  };

  const backToScenarios = () => {
    updateGlobalState({ currentScenario: null });
    setConfirmReset(false);
  };

  const changeLevel = (newLevel: Level) => {
    if (!scenario || !scenarioState) return;
    const newState = getDefaultScenarioState(scenario, newLevel, scenarioState.chaos.enabled);
    newState.answers = scenarioState.answers;
    newState.drawing = scenarioState.drawing;
    newState.capacity = scenarioState.capacity;
    newState.chaos = scenarioState.chaos;
    newState.tradeoffs = scenarioState.tradeoffs;
    newState.history = scenarioState.history;
    updateScenarioState(newState);
  };

  // Timer effect
  useEffect(() => {
    if (!scenarioState?.running || scenarioState.deadline == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((scenarioState.deadline! - Date.now()) / 1000));
      if (left !== scenarioState.remaining) {
        updateScenarioState({ remaining: left, running: left > 0, deadline: left > 0 ? scenarioState.deadline : null });
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [scenarioState?.running, scenarioState?.deadline, scenarioState?.remaining, updateScenarioState]);

  // Set document lang/dir on mount
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Calculate stages and totals - must be before early return to maintain hooks order
  const stages = scenario && scenarioState ? getFilteredStages(scenario, scenarioState.level) : [];
  
  const totals = useMemo(() => {
    if (!scenarioState) return { done: 0, total: 0, markedStages: 0, writtenStages: 0, perStage: [] };
    let done = 0, total = 0, markedStages = 0, writtenStages = 0;
    const perStage = stages.map(s => {
      const vals = scenarioState.ticks[s.id] || [];
      const d = s.items.reduce((c, _, i) => c + (vals[i] ? 1 : 0), 0);
      const t = s.items.length;
      done += d; total += t;
      if (d > 0) markedStages++;
      if ((scenarioState.answers[s.id] || '').trim()) writtenStages++;
      return { stage: s, done: d, total: t };
    });
    return { done, total, markedStages, writtenStages, perStage };
  }, [stages, scenarioState]);

  if (route.name === 'cheatsheet') {
    return (
      <CheatSheet
        lang={lang}
        onBack={goBackFromContent}
        onToggleLang={toggleLang}
        onOpenTerm={(id) => openGlossary(id)}
        onOpenGlossary={() => openGlossary()}
      />
    );
  }

  if (route.name === 'glossary') {
    return (
      <Glossary
        lang={lang}
        termId={route.termId}
        onBack={goBackFromContent}
        onToggleLang={toggleLang}
        onOpenTerm={(id) => openGlossary(id)}
        onOpenCheatsheet={openCheatsheet}
      />
    );
  }

  if (!scenario || !scenarioState) {
    return (
      <PageContainer lang={lang}>
        <LangToggle lang={lang} onToggle={toggleLang} />
        <Hero lang={lang} onOpenCheatsheet={openCheatsheet} onOpenGlossary={() => openGlossary()} />
        <SoftCard lang={lang}>
          <ChaosToggle lang={lang} enabled={chaosPref} onToggle={() => setChaosPref(v => !v)} />
          <CardHeader title={t('chooseScenario', lang)} caption={t('chooseScenarioDesc', lang)} />
          <ScenarioPicker scenarios={SCENARIOS} lang={lang} onStart={startScenario} />
        </SoftCard>
      </PageContainer>
    );
  }

  const viewOptions = [...stages.map(s => ({ value: s.id, label: localizedText(s.shortTitle, lang) })), { value: 'results', label: t('results', lang) }];
  const isResults = scenarioState.view === 'results';
  const stageIndex = stages.findIndex(s => s.id === scenarioState.view);
  const stage = !isResults && stageIndex >= 0 ? stages[stageIndex] : null;
  const expired = scenarioState.remaining === 0;

  const percent = totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 100);

  const startTimer = () => {
    if (scenarioState.remaining <= 0) return;
    updateScenarioState({ deadline: Date.now() + scenarioState.remaining * 1000, running: true });
  };
  const pauseTimer = () => {
    if (scenarioState.deadline != null) {
      updateScenarioState({ remaining: Math.max(0, Math.ceil((scenarioState.deadline - Date.now()) / 1000)), running: false, deadline: null });
    }
  };
  const resetTimer = () => updateScenarioState({ running: false, deadline: null, remaining: TOTAL_SECONDS });

  const goPrev = () => {
    setConfirmReset(false);
    if (isResults) { updateScenarioState({ view: stages[stages.length - 1].id }); return; }
    if (stageIndex > 0) updateScenarioState({ view: stages[stageIndex - 1].id });
  };
  const goNext = () => {
    setConfirmReset(false);
    if (isResults) return;
    if (stageIndex < stages.length - 1) updateScenarioState({ view: stages[stageIndex + 1].id });
    else updateScenarioState({ view: 'results' });
  };
  const resetAll = () => {
    updateScenarioState(getDefaultScenarioState(scenario, scenarioState.level));
    setConfirmReset(false);
  };

  const summaryText = (() => {
    if (totals.done === 0) return t('noPointsMarked', lang);
    const ratio = totals.done / totals.total;
    if (ratio >= 0.8) return t('strongAssessment', lang);
    if (ratio >= 0.5) return t('goodStart', lang);
    return t('keepGoing', lang);
  })();

  const stageSelect = (
    <Select label={t('jumpToStage', lang)} options={viewOptions} value={scenarioState.view} onChange={(v) => { setConfirmReset(false); updateScenarioState({ view: v }); }} />
  );

  const radarScores = computeRadarScores(scenarioState, stages);
  const radarOverall = overallFromRadar(radarScores);

  return (
    <PageContainer lang={lang}>
      <LangToggle lang={lang} onToggle={toggleLang} />
      <Hero lang={lang} onOpenCheatsheet={openCheatsheet} onOpenGlossary={() => openGlossary()} />

      {scenarioState.chaos.enabled && (
        <ChaosIncidentCard
          scenarioId={scenario.id}
          lang={lang}
          currentStageId={scenarioState.view}
          state={scenarioState.chaos}
          onChange={(chaos) => updateScenarioState({ chaos })}
        />
      )}

      <SoftCard lang={lang}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Button label={t('backToScenarios', lang)} onClick={backToScenarios} small />
          <LevelToggle level={scenarioState.level} onChange={changeLevel} lang={lang} />
        </div>
        <CardHeader title={localizedText(scenario.title, lang)} />
        {scenarioState.level === 'staff' && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            ⭐ {t('staffDescription', lang)}
          </p>
        )}
        <BodyText>{localizedText(scenario.problemStatement, lang)}</BodyText>
        <FactList items={scenario.facts} lang={lang} />
        <ChaosToggle
          lang={lang}
          enabled={scenarioState.chaos.enabled}
          onToggle={() => updateScenarioState({
            chaos: {
              ...scenarioState.chaos,
              enabled: !scenarioState.chaos.enabled,
              activeIncidentId: null,
              deadline: null,
            },
          })}
        />
      </SoftCard>

      <SoftCard lang={lang}>
        <CardHeader title={t('timer', lang)} caption={t('timerOptional', lang)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <TimerReadout seconds={scenarioState.remaining} expired={expired} />
          {scenarioState.running ? (
            <Button label={t('pauseTimer', lang)} onClick={pauseTimer} />
          ) : (
            <Button label={scenarioState.remaining === TOTAL_SECONDS ? t('startTimer', lang) : t('resumeTimer', lang)} variant="primary" onClick={startTimer} disabled={scenarioState.remaining <= 0} />
          )}
          <Button label={t('resetTimer', lang)} onClick={resetTimer} />
        </div>
        <TimerTrack remaining={scenarioState.remaining} />
      </SoftCard>

      {stage && (
        <SoftCard lang={lang}>
          <CardHeader title={localizedText(stage.title, lang)} caption={`${t('stageOf', lang)} ${stageIndex + 1} ${t('of', lang)} ${stages.length}`} actions={stageSelect} />
          {stage.level === 'staff' && <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: 12 }}>⭐ Staff Level</p>}
          <BodyText>{localizedText(stage.prompt, lang)}</BodyText>
          <AnswerArea
            label={localizedText(stage.title, lang)}
            value={scenarioState.answers[stage.id] || ''}
            onChange={(v) => updateScenarioState({ answers: { ...scenarioState.answers, [stage.id]: v } })}
            placeholder={t('writeAnswerPlaceholder', lang)}
          />

          {stage.id === 'clarify' && (
            <CapacityCalculator
              scenarioId={scenario.id}
              lang={lang}
              state={scenarioState.capacity}
              onChange={(capacity) => updateScenarioState({ capacity })}
            />
          )}

          {stage.id === 'architecture' && (
            <DrawingBoard
              scenarioId={scenario.id}
              lang={lang}
              state={scenarioState.drawing}
              onChange={(drawing) => updateScenarioState({ drawing })}
            />
          )}

          {stage.id === 'tradeoffs' && (
            <TradeoffCards
              scenarioId={scenario.id}
              lang={lang}
              state={scenarioState.tradeoffs}
              onChange={(tradeoffs) => updateScenarioState({ tradeoffs })}
            />
          )}

          <div className="stage-actions" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <Button
                label={scenarioState.revealed[stage.id] ? t('hidePoints', lang) : t('revealPoints', lang)}
                variant={scenarioState.revealed[stage.id] ? undefined : 'primary'}
                onClick={() => updateScenarioState({ revealed: { ...scenarioState.revealed, [stage.id]: !scenarioState.revealed[stage.id] } })}
              />
            </div>
            {scenarioState.revealed[stage.id] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <BodyText muted>{t('checklistInstruction', lang)}</BodyText>
                {stage.id === 'architecture' && (
                  <div className="architecture-reveal">
                    <p className="architecture-reveal__title">{t('architectureDiagram', lang)}</p>
                    <SolutionWalkthrough scenarioId={scenario.id} lang={lang} />
                  </div>
                )}
                <ScoreTicks
                  items={stage.items}
                  values={scenarioState.ticks[stage.id] || []}
                  expanded={scenarioState.expanded[stage.id] || {}}
                  onToggle={(i) => {
                    const current = scenarioState.ticks[stage.id] || stage.items.map(() => false);
                    updateScenarioState({ ticks: { ...scenarioState.ticks, [stage.id]: current.map((v, idx) => idx === i ? !v : v) } });
                  }}
                  onToggleExpand={(i) => {
                    const current = scenarioState.expanded[stage.id] || {};
                    updateScenarioState({ expanded: { ...scenarioState.expanded, [stage.id]: { ...current, [i]: !current[i] } } });
                  }}
                  lang={lang}
                  onOpenTerm={(id) => openGlossary(id)}
                />
                <ScoreBadge done={(scenarioState.ticks[stage.id] || []).filter(Boolean).length} total={stage.items.length} lang={lang} />
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <Button label={t('previous', lang)} onClick={goPrev} disabled={stageIndex <= 0} />
              <Button label={stageIndex === stages.length - 1 ? t('viewResults', lang) : t('next', lang)} variant="primary" onClick={goNext} />
            </div>
          </div>
        </SoftCard>
      )}

      {isResults && (
        <SoftCard lang={lang}>
          <CardHeader title={t('yourAssessment', lang)} actions={stageSelect} />
          <BodyText>{summaryText}</BodyText>
          <RadarChart
            lang={lang}
            scores={radarScores}
            overall={radarOverall}
            history={scenarioState.history}
            onSave={() => {
              updateScenarioState({
                history: [
                  ...scenarioState.history,
                  {
                    timestamp: Date.now(),
                    scores: radarScores,
                    overall: radarOverall,
                    level: scenarioState.level,
                  },
                ],
              });
            }}
          />
          <Metrics metrics={[
            { value: `${totals.done} / ${totals.total}`, label: t('total', lang), detail: t('strongAnswerPoints', lang), tone: scoreTone(totals.done, totals.total) },
            { value: `${percent}%`, label: t('percentage', lang), tone: scoreTone(totals.done, totals.total) },
            { value: `${totals.markedStages} / ${stages.length}`, label: t('markedStages', lang) },
            { value: `${totals.writtenStages} / ${stages.length}`, label: t('writtenStages', lang) },
          ]} />
          <Bars bars={totals.perStage.map(r => ({ label: localizedText(r.stage.shortTitle, lang), value: r.total === 0 ? 0 : Math.round((r.done / r.total) * 100), display: `${r.done} / ${r.total}` }))} />
          <ResultsTable rows={totals.perStage.map(r => ({ stage: localizedText(r.stage.title, lang), done: r.done, total: r.total }))} lang={lang} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 4 }}>
            <Button label={t('backToLastStage', lang)} onClick={goPrev} />
            {confirmReset ? (
              <Button label={t('confirmReset', lang)} variant="primary" onClick={resetAll} />
            ) : (
              <Button label={t('startOver', lang)} onClick={() => setConfirmReset(true)} />
            )}
            {confirmReset && <Button label={t('cancel', lang)} onClick={() => setConfirmReset(false)} />}
          </div>
          {confirmReset && <><div style={{ height: 12 }} /><BodyText muted>{t('resetWarning', lang)}</BodyText></>}
        </SoftCard>
      )}

      <div style={{ height: 88 }} />
      <FloatingBar>
        <Button label={t('previous', lang)} onClick={goPrev} disabled={!isResults && stageIndex <= 0} />
        <Button label={isResults || stageIndex === stages.length - 1 ? t('results', lang) : t('next', lang)} variant="primary" onClick={() => { if (!isResults) goNext(); }} disabled={isResults} />
        <BackToTop />
      </FloatingBar>
    </PageContainer>
  );
}
