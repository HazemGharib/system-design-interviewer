import type { CSSProperties } from 'react';
import type { CapacityState, Lang } from '../types';
import { CAPACITY_DATA, verdictFor } from '../interactive/capacityData';
import { t, localizedText } from '../i18n';

interface Props {
  scenarioId: string;
  lang: Lang;
  state: CapacityState;
  onChange: (next: CapacityState) => void;
}

export function CapacityCalculator({ scenarioId, lang, state, onChange }: Props) {
  const data = CAPACITY_DATA[scenarioId];
  if (!data) return null;

  const setHelper = (id: string, value: string) => {
    onChange({ ...state, helpers: { ...state.helpers, [id]: value }, checked: false });
  };
  const setValue = (id: string, value: string) => {
    onChange({ ...state, values: { ...state.values, [id]: value }, checked: false });
  };

  const check = () => {
    const results: CapacityState['results'] = {};
    for (const field of data.fields) {
      const raw = parseFloat((state.values[field.id] || '').replace(/,/g, ''));
      results[field.id] = verdictFor(raw, field.reference);
    }
    onChange({ ...state, checked: true, results });
  };

  const verdictLabel = (v: 'good' | 'ok' | 'off') =>
    v === 'good' ? t('verdictGood', lang) : v === 'ok' ? t('verdictOk', lang) : t('verdictOff', lang);

  const verdictColor = (v: 'good' | 'ok' | 'off') =>
    v === 'good' ? 'var(--success)' : v === 'ok' ? 'var(--accent)' : 'var(--warning)';

  return (
    <div style={{ marginTop: 16, marginBottom: 20 }}>
      <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px' }}>{t('capacityCalculator', lang)}</h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.5 }}>
        {t('capacityHint', lang)}
      </p>

      <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '0 0 8px' }}>{t('helpers', lang)}</p>
      <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        {data.helpers.map(h => (
          <label key={h.id} style={{ display: 'grid', gap: 4, fontSize: '0.8125rem' }}>
            <span>{localizedText(h.label, lang)} ({localizedText(h.unit, lang)})</span>
            <input
              type="number"
              inputMode="decimal"
              value={state.helpers[h.id] || ''}
              onChange={e => setHelper(h.id, e.target.value)}
              placeholder={String(h.reference)}
              style={inputStyle}
            />
          </label>
        ))}
      </div>

      <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '0 0 8px' }}>{t('yourEstimates', lang)}</p>
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {data.fields.map(f => {
          const result = state.results[f.id];
          return (
            <div key={f.id} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'grid', gap: 4, fontSize: '0.8125rem' }}>
                <span>
                  {localizedText(f.label, lang)} ({localizedText(f.unit, lang)})
                  {f.helper && <span style={{ color: 'var(--text-secondary)' }}> — {localizedText(f.helper, lang)}</span>}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={state.values[f.id] || ''}
                  onChange={e => setValue(f.id, e.target.value)}
                  style={inputStyle}
                />
              </label>
              {state.checked && result && (
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: verdictColor(result.verdict) }}>
                  {verdictLabel(result.verdict)} · {t('referenceValue', lang)}: {f.reference.toLocaleString()}
                  {result.ratio > 0 ? ` · ×${result.ratio.toFixed(2)}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={check} style={primaryBtn}>
        {t('checkEstimates', lang)}
      </button>

      {state.checked && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '0 0 8px' }}>{t('workedSteps', lang)}</p>
          {data.steps.map((s, i) => (
            <p key={i} style={{ fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              {localizedText(s, lang)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box',
};

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
  touchAction: 'manipulation',
};
