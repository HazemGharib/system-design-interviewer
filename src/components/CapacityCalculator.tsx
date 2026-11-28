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
    <div className="capacity-calc" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h3 className="capacity-calc__title">{t('capacityCalculator', lang)}</h3>
      <p className="capacity-calc__hint">{t('capacityHint', lang)}</p>

      <p className="capacity-calc__section-label">{t('helpers', lang)}</p>
      <div className="capacity-calc__helpers">
        {data.helpers.map(h => (
          <label key={h.id} className="capacity-calc__field">
            <span className="capacity-calc__label">
              {localizedText(h.label, lang)}
              <span className="capacity-calc__unit"> ({localizedText(h.unit, lang)})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={state.helpers[h.id] || ''}
              onChange={e => setHelper(h.id, e.target.value)}
              placeholder={String(h.reference)}
              className="capacity-calc__input"
              style={inputStyle}
            />
          </label>
        ))}
      </div>

      <p className="capacity-calc__section-label">{t('yourEstimates', lang)}</p>
      <div className="capacity-calc__estimates">
        {data.fields.map(f => {
          const result = state.results[f.id];
          return (
            <div key={f.id} className="capacity-calc__estimate">
              <label className="capacity-calc__field">
                <span className="capacity-calc__label">
                  {localizedText(f.label, lang)}
                  <span className="capacity-calc__unit"> ({localizedText(f.unit, lang)})</span>
                </span>
                {f.helper && (
                  <span className="capacity-calc__formula">{localizedText(f.helper, lang)}</span>
                )}
                <input
                  type="number"
                  inputMode="decimal"
                  value={state.values[f.id] || ''}
                  onChange={e => setValue(f.id, e.target.value)}
                  className="capacity-calc__input"
                  style={inputStyle}
                />
              </label>
              {state.checked && result && (
                <p className="capacity-calc__verdict" style={{ color: verdictColor(result.verdict) }}>
                  {verdictLabel(result.verdict)} · {t('referenceValue', lang)}: {f.reference.toLocaleString()}
                  {result.ratio > 0 ? ` · ×${result.ratio.toFixed(2)}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="capacity-calc__actions">
        <button type="button" onClick={check} style={primaryBtn}>
          {t('checkEstimates', lang)}
        </button>
      </div>

      {state.checked && (
        <div className="capacity-calc__steps">
          <p className="capacity-calc__section-label">{t('workedSteps', lang)}</p>
          {data.steps.map((s, i) => (
            <p key={i} className="capacity-calc__step">
              {localizedText(s, lang)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1.5px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: '16px', // avoid iOS zoom
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 36,
  height: 36,
  lineHeight: 1.2,
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
