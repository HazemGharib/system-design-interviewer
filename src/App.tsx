import { useEffect, useMemo, useState, useCallback, type ReactNode, type ChangeEvent } from 'react';
import type { Lang, Level, Scenario, Stage, SavedScenarioState, GlobalState, ChecklistItem } from './types';
import { SCENARIOS, getScenarioById } from './scenarios';
import { t, localizedText } from './i18n';
import { ArchitectureDiagram } from './diagrams/ArchitectureDiagram';

const TOTAL_SECONDS = 45 * 60;
const STORAGE_KEY = 'sysdesign-interview-v3';

function getDefaultScenarioState(scenario: Scenario, level: Level): SavedScenarioState {
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
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 100px', minHeight: '100vh' }}>
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
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: small ? '8px 14px' : '12px 20px', fontSize: small ? '0.8125rem' : '0.9375rem', fontWeight: 500,
        borderRadius: 'var(--radius-lg)', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.15s ease', width: fullWidth ? '100%' : 'auto',
        background: isPrimary ? 'var(--accent)' : 'var(--bg-subtle)', color: isPrimary ? '#fff' : 'var(--text-primary)',
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
      dir={lang === 'ar' ? 'rtl' : lang === 'en' ? 'ltr' : undefined}
      style={{
        width: '100%', boxSizing: 'border-box', background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)', padding: 'clamp(20px, 5vw, 32px)', marginBottom: 24,
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

function Hero({ lang }: { lang: Lang }) {
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
      <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(246,241,232,0.86)', margin: 0 }}>{t('appDescription', lang)}</p>
    </div>
  );
}

function LangToggle({ lang, onToggle }: { lang: Lang; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed', top: 16, [lang === 'ar' ? 'left' : 'right']: 16, zIndex: 200,
        padding: '8px 14px', fontSize: '0.8125rem', fontWeight: 600, borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--accent)',
        cursor: 'pointer', boxShadow: 'var(--shadow-card)',
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

function ScenarioCard({ scenario, lang, onStart }: { scenario: Scenario; lang: Lang; onStart: () => void }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
      padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-card)',
    }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        {localizedText(scenario.title, lang)}
      </h3>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
        {localizedText(scenario.description, lang)}
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <strong>{t('difficulty', lang)}:</strong> {localizedText(scenario.difficulty, lang)}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <strong>{t('estimatedTime', lang)}:</strong> {localizedText(scenario.estimatedTime, lang)}
        </span>
      </div>
      <Button label={t('startScenario', lang)} variant="primary" onClick={onStart} />
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
        boxShadow: focused ? '0 0 0 3px var(--accent-soft)' : 'none', marginBottom: 20,
      }}
    />
  );
}

function ExpandableDetail({ item, expanded, onToggle, lang }: { item: ChecklistItem; expanded: boolean; onToggle: () => void; lang: Lang }) {
  const detail = item.detail[lang];
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
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--accent)' }}>{t('whyItMatters', lang)}:</strong> {detail.why}</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--accent)' }}>{t('howItWorks', lang)}:</strong> {detail.how}</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--warning)' }}>{t('tradeoffs', lang)}:</strong> {detail.tradeoffs}</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--success)' }}>{t('examples', lang)}:</strong> {detail.examples}</p>
          <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-secondary)' }}>{t('commonMistakes', lang)}:</strong> {detail.mistakes}</p>
        </div>
      )}
    </div>
  );
}

function ScoreTicks({ stage, items, values, expanded, onToggle, onToggleExpand, lang }: {
  stage: Stage;
  items: ChecklistItem[];
  values: boolean[];
  expanded: Record<number, boolean>;
  onToggle: (i: number) => void;
  onToggleExpand: (i: number) => void;
  lang: Lang;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 20 }}>
      {items.map((item, i) => {
        const checked = Boolean(values[i]);
        const isDiagram = localizedText(item.text, lang).includes('📊');
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
            {isDiagram && (
              <div style={{ marginTop: 16 }}>
                <ArchitectureDiagram scenarioId={stage.id.includes('architecture') ? stage.id.replace('-architecture', '').replace('architecture', '') : ''} lang={lang} />
              </div>
            )}
            <ExpandableDetail item={item} expanded={!!expanded[i]} onToggle={() => onToggleExpand(i)} lang={lang} />
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
  
  const scenario = currentScenario ? getScenarioById(currentScenario) : null;
  const scenarioState = scenario ? (globalState.scenarios[scenario.id] || getDefaultScenarioState(scenario, 'senior')) : null;
  
  const [confirmReset, setConfirmReset] = useState(false);

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
      const current = prev.scenarios[scenario.id] || getDefaultScenarioState(scenario, 'senior');
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

  const startScenario = (id: string) => {
    const sc = getScenarioById(id);
    if (!sc) return;
    const existing = globalState.scenarios[id];
    updateGlobalState({
      currentScenario: id,
      scenarios: {
        ...globalState.scenarios,
        [id]: existing || getDefaultScenarioState(sc, 'senior'),
      },
    });
  };

  const backToScenarios = () => {
    updateGlobalState({ currentScenario: null });
    setConfirmReset(false);
  };

  const changeLevel = (newLevel: Level) => {
    if (!scenario || !scenarioState) return;
    const newState = getDefaultScenarioState(scenario, newLevel);
    newState.answers = scenarioState.answers;
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

  if (!scenario || !scenarioState) {
    // Scenario picker
    return (
      <PageContainer lang={lang}>
        <LangToggle lang={lang} onToggle={toggleLang} />
        <Hero lang={lang} />
        <SoftCard lang={lang}>
          <CardHeader title={t('chooseScenario', lang)} caption={t('chooseScenarioDesc', lang)} />
          {SCENARIOS.map(sc => (
            <ScenarioCard key={sc.id} scenario={sc} lang={lang} onStart={() => startScenario(sc.id)} />
          ))}
        </SoftCard>
      </PageContainer>
    );
  }

  const stages = getFilteredStages(scenario, scenarioState.level);
  const viewOptions = [...stages.map(s => ({ value: s.id, label: localizedText(s.shortTitle, lang) })), { value: 'results', label: t('results', lang) }];
  const isResults = scenarioState.view === 'results';
  const stageIndex = stages.findIndex(s => s.id === scenarioState.view);
  const stage = !isResults && stageIndex >= 0 ? stages[stageIndex] : null;
  const expired = scenarioState.remaining === 0;

  const totals = useMemo(() => {
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
  }, [stages, scenarioState.ticks, scenarioState.answers]);

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

  return (
    <PageContainer lang={lang}>
      <LangToggle lang={lang} onToggle={toggleLang} />
      <Hero lang={lang} />

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Button
              label={scenarioState.revealed[stage.id] ? t('hidePoints', lang) : t('revealPoints', lang)}
              variant={scenarioState.revealed[stage.id] ? undefined : 'primary'}
              onClick={() => updateScenarioState({ revealed: { ...scenarioState.revealed, [stage.id]: !scenarioState.revealed[stage.id] } })}
            />
          </div>
          {scenarioState.revealed[stage.id] && (
            <>
              <div style={{ height: 16 }} />
              <BodyText muted>{t('checklistInstruction', lang)}</BodyText>
              {stage.id === 'architecture' && (
                <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>{t('architectureDiagram', lang)}</p>
                  <ArchitectureDiagram scenarioId={scenario.id} lang={lang} />
                </div>
              )}
              <ScoreTicks
                stage={stage}
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
              />
              <ScoreBadge done={(scenarioState.ticks[stage.id] || []).filter(Boolean).length} total={stage.items.length} lang={lang} />
            </>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Button label={t('previous', lang)} onClick={goPrev} disabled={stageIndex <= 0} />
            <Button label={stageIndex === stages.length - 1 ? t('viewResults', lang) : t('next', lang)} variant="primary" onClick={goNext} />
          </div>
        </SoftCard>
      )}

      {isResults && (
        <SoftCard lang={lang}>
          <CardHeader title={t('yourAssessment', lang)} actions={stageSelect} />
          <BodyText>{summaryText}</BodyText>
          <Metrics metrics={[
            { value: `${totals.done} / ${totals.total}`, label: t('total', lang), detail: t('strongAnswerPoints', lang), tone: scoreTone(totals.done, totals.total) },
            { value: `${percent}%`, label: t('percentage', lang), tone: scoreTone(totals.done, totals.total) },
            { value: `${totals.markedStages} / ${stages.length}`, label: t('markedStages', lang) },
            { value: `${totals.writtenStages} / ${stages.length}`, label: t('writtenStages', lang) },
          ]} />
          <Bars bars={totals.perStage.map(r => ({ label: localizedText(r.stage.shortTitle, lang), value: r.total === 0 ? 0 : Math.round((r.done / r.total) * 100), display: `${r.done} / ${r.total}` }))} />
          <ResultsTable rows={totals.perStage.map(r => ({ stage: localizedText(r.stage.title, lang), done: r.done, total: r.total }))} lang={lang} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
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
