import { useEffect, useState, type CSSProperties } from 'react';
import type { ChaosState, Lang } from '../types';
import { CHAOS_INCIDENTS } from '../interactive/chaosData';
import { t, localizedText } from '../i18n';

interface Props {
  scenarioId: string;
  lang: Lang;
  currentStageId: string;
  state: ChaosState;
  onChange: (next: ChaosState) => void;
}

export function ChaosToggle({ lang, enabled, onToggle }: { lang: Lang; enabled: boolean; onToggle: () => void }) {
  return (
    <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: enabled ? 'var(--accent-soft)' : 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>{t('chaosMode', lang)}</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t('chaosModeDesc', lang)}</p>
        </div>
        <button type="button" onClick={onToggle} style={{
          padding: '10px 14px', borderRadius: 10, border: 'none', minHeight: 40, cursor: 'pointer',
          background: enabled ? 'var(--accent)' : 'var(--bg-elevated)', color: enabled ? '#fff' : 'var(--text-primary)',
          fontWeight: 600, fontSize: '0.8125rem', touchAction: 'manipulation',
        }}>
          {enabled ? t('disableChaos', lang) : t('enableChaos', lang)}
        </button>
      </div>
    </div>
  );
}

export function ChaosIncidentCard({ scenarioId, lang, currentStageId, state, onChange }: Props) {
  const incidents = CHAOS_INCIDENTS[scenarioId] || [];
  const active = state.activeIncidentId ? incidents.find(i => i.id === state.activeIncidentId) : null;
  const [now, setNow] = useState(Date.now());

  // Trigger next incident when reaching a stage
  useEffect(() => {
    if (!state.enabled || state.activeIncidentId) return;
    const next = incidents.find(i => i.afterStage === currentStageId && !state.triggered.includes(i.id));
    if (!next) return;
    onChange({
      ...state,
      activeIncidentId: next.id,
      deadline: Date.now() + next.seconds * 1000,
      triggered: [...state.triggered, next.id],
      responses: {
        ...state.responses,
        [next.id]: state.responses[next.id] || {
          incidentId: next.id,
          answer: '',
          ticks: next.checklist.map(() => false),
          revealed: false,
          timedOut: false,
        },
      },
    });
    // Intentionally key off stage + enabled + active id to avoid re-trigger loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStageId, state.enabled, state.activeIncidentId, state.triggered.join('|')]);

  useEffect(() => {
    if (!state.deadline || !state.activeIncidentId) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.deadline, state.activeIncidentId]);

  if (!active) return null;
  const response = state.responses[active.id];
  if (!response) return null;

  const left = state.deadline ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 0;
  const timedOut = left === 0 && !response.revealed;

  const updateAnswer = (answer: string) => {
    onChange({
      ...state,
      responses: { ...state.responses, [active.id]: { ...response, answer } },
    });
  };

  const submit = () => {
    onChange({
      ...state,
      deadline: null,
      responses: {
        ...state.responses,
        [active.id]: { ...response, revealed: true, timedOut: left === 0 },
      },
    });
  };

  const dismiss = () => {
    onChange({ ...state, activeIncidentId: null, deadline: null });
  };

  const toggleTick = (i: number) => {
    const ticks = response.ticks.map((v, idx) => (idx === i ? !v : v));
    onChange({
      ...state,
      responses: { ...state.responses, [active.id]: { ...response, ticks } },
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(12,46,54,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto',
        background: 'var(--bg-elevated)', borderRadius: 20, padding: 20,
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
      }}>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', letterSpacing: '0.04em' }}>
          {t('chaosIncident', lang)}
        </p>
        <h3 style={{ margin: '8px 0 10px', fontSize: '1.15rem' }}>{localizedText(active.title, lang)}</h3>
        <p style={{ margin: '0 0 14px', fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {localizedText(active.description, lang)}
        </p>

        {!response.revealed && (
          <>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: left <= 15 ? 'var(--warning)' : 'var(--accent)' }}>
              {t('chaosTimeLeft', lang)}: {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
              {timedOut ? ` — ${t('chaosTimedOut', lang)}` : ''}
            </p>
            <textarea
              value={response.answer}
              onChange={e => updateAnswer(e.target.value)}
              placeholder={t('chaosRespond', lang)}
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10,
                border: '1.5px solid var(--border-default)', background: 'var(--bg-subtle)',
                color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: 12,
              }}
            />
            <button type="button" onClick={submit} style={primaryBtn}>{t('chaosSubmit', lang)}</button>
          </>
        )}

        {response.revealed && (
          <>
            <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t('chaosScoreHint', lang)}</p>
            {active.checklist.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleTick(i)}
                style={{
                  display: 'flex', gap: 10, width: '100%', textAlign: lang === 'ar' ? 'right' : 'left',
                  padding: '10px 12px', marginBottom: 8, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: response.ticks[i] ? 'var(--accent-soft)' : 'var(--bg-subtle)', color: 'var(--text-primary)',
                  fontSize: '0.875rem', lineHeight: 1.5,
                }}
              >
                <span style={{
                  width: 18, height: 18, flexShrink: 0, marginTop: 2, borderRadius: 4,
                  border: response.ticks[i] ? 'none' : '1.5px solid var(--accent)',
                  background: response.ticks[i] ? 'var(--accent)' : 'transparent',
                }} />
                <span>{localizedText(item, lang)}</span>
              </button>
            ))}
            <button type="button" onClick={dismiss} style={{ ...primaryBtn, marginTop: 8 }}>{t('next', lang)}</button>
          </>
        )}
      </div>
    </div>
  );
}

const primaryBtn: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
  minHeight: 44,
  width: '100%',
  touchAction: 'manipulation',
};
