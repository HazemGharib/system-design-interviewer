import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { CapacityMode, CapacityState, Lang } from '../types';
import { getCapacityModel, readCapacityMode, verdictFor, writeCapacityMode } from '../interactive/capacityData';
import {
  assumptionVariables,
  computeCapacity,
  emptyVariableMap,
  formatExact,
  formatMetricValue,
  formulaReady,
  gradeAssumptionValue,
  gradeInputValue,
  inputVariables,
  parseNum,
  practiceMetrics,
  symbolForPart,
  type AutoVarVerdict,
  type CapacityMetric,
  type CapacityVariable,
} from '../interactive/capacityEngine';
import { t, tf, localizedText } from '../i18n';

interface Props {
  scenarioId: string;
  lang: Lang;
  state: CapacityState;
  onChange: (next: CapacityState) => void;
}

export function CapacityCalculator({ scenarioId, lang, state, onChange }: Props) {
  const model = getCapacityModel(scenarioId);
  const [mode, setMode] = useState<CapacityMode>(() => readCapacityMode());

  useEffect(() => {
    writeCapacityMode(mode);
  }, [mode]);

  const variables = state.variables || {};

  const { env, metrics, ready } = useMemo(() => {
    if (!model) return { env: {}, metrics: {}, ready: {} };
    return computeCapacity(model, variables, { fillDefaults: false });
  }, [model, variables]);

  // Practice grading references: fill missing vars with defaults so Check still works
  const practiceRefs = useMemo(() => {
    if (!model) return {};
    return computeCapacity(model, variables, { fillDefaults: true }).metrics;
  }, [model, variables]);

  if (!model) return null;

  const setVar = (id: string, value: string) => {
    onChange({
      ...state,
      variables: { ...variables, [id]: value },
      checked: false,
      results: {},
      autoChecked: false,
      autoResults: {},
    });
  };

  const setEstimate = (id: string, value: string) => {
    onChange({
      ...state,
      values: { ...state.values, [id]: value },
      checked: false,
    });
  };

  const clearAll = () => {
    const clearedValues: Record<string, string> = {};
    for (const m of practiceMetrics(model)) clearedValues[m.id] = '';
    onChange({
      variables: emptyVariableMap(model),
      values: clearedValues,
      checked: false,
      results: {},
      autoChecked: false,
      autoResults: {},
    });
  };

  const checkPractice = () => {
    const results: CapacityState['results'] = {};
    for (const m of practiceMetrics(model)) {
      const raw = parseNum(state.values[m.id]);
      const reference = practiceRefs[m.id];
      results[m.id] = verdictFor(raw, reference);
    }
    onChange({ ...state, checked: true, results });
  };

  const checkAuto = () => {
    const autoResults: NonNullable<CapacityState['autoResults']> = {};
    for (const v of model.variables) {
      const raw = (variables[v.id] || '').trim();
      if (raw === '') {
        autoResults[v.id] = { verdict: 'missing', kind: v.role };
        continue;
      }
      const n = parseNum(raw);
      if (v.role === 'input') {
        autoResults[v.id] = { verdict: gradeInputValue(n, v.default), kind: 'input' };
      } else if (v.range) {
        autoResults[v.id] = { verdict: gradeAssumptionValue(n, v.range), kind: 'assumption' };
      } else {
        autoResults[v.id] = { verdict: gradeInputValue(n, v.default), kind: 'assumption' };
      }
    }
    onChange({ ...state, autoChecked: true, autoResults });
  };

  const verdictLabel = (v: 'good' | 'ok' | 'off') =>
    v === 'good' ? t('verdictGood', lang) : v === 'ok' ? t('verdictOk', lang) : t('verdictOff', lang);

  const verdictColor = (v: AutoVarVerdict) =>
    v === 'good' ? 'var(--success)' : v === 'ok' ? 'var(--accent)' : 'var(--warning)';

  const inputs = inputVariables(model);
  const assumptions = assumptionVariables(model);
  const autoResults = state.autoResults || {};
  const autoChecked = !!state.autoChecked;

  const autoSummary = (() => {
    if (!autoChecked) return null;
    let inputsOk = 0;
    let assumptionsOk = 0;
    for (const v of inputs) {
      const r = autoResults[v.id];
      if (r && (r.verdict === 'good' || r.verdict === 'ok')) inputsOk += 1;
    }
    for (const v of assumptions) {
      const r = autoResults[v.id];
      if (r && (r.verdict === 'good' || r.verdict === 'ok')) assumptionsOk += 1;
    }
    return tf('capacityAutoSummary', lang, {
      inputsOk,
      inputsTotal: inputs.length,
      assumptionsOk,
      assumptionsTotal: assumptions.length,
    });
  })();

  return (
    <div className="capacity-calc" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="capacity-calc__header">
        <h3 className="capacity-calc__title">{t('capacityCalculator', lang)}</h3>
        <div className="capacity-calc__mode" role="group" aria-label={t('capacityMode', lang)}>
          <button
            type="button"
            className={`capacity-calc__mode-btn${mode === 'auto' ? ' is-active' : ''}`}
            onClick={() => setMode('auto')}
          >
            {t('capacityModeAuto', lang)}
          </button>
          <button
            type="button"
            className={`capacity-calc__mode-btn${mode === 'practice' ? ' is-active' : ''}`}
            onClick={() => setMode('practice')}
          >
            {t('capacityModePractice', lang)}
          </button>
        </div>
      </div>

      <p className="capacity-calc__hint">
        {mode === 'auto' ? t('capacityHintAuto', lang) : t('capacityHintPractice', lang)}
      </p>

      <p className="capacity-calc__section-label">{t('capacityVariables', lang)}</p>
      <div className="capacity-calc__helpers">
        {inputs.map(v => (
          <VarInput
            key={v.id}
            v={v}
            lang={lang}
            value={variables[v.id] || ''}
            onChange={val => setVar(v.id, val)}
            feedback={autoChecked ? autoResults[v.id] : undefined}
          />
        ))}
      </div>

      {assumptions.length > 0 && (
        <>
          <p className="capacity-calc__section-label">{t('capacityAssumptions', lang)}</p>
          <div className="capacity-calc__helpers">
            {assumptions.map(v => (
              <VarInput
                key={v.id}
                v={v}
                lang={lang}
                value={variables[v.id] || ''}
                onChange={val => setVar(v.id, val)}
                feedback={autoChecked ? autoResults[v.id] : undefined}
              />
            ))}
          </div>
        </>
      )}

      {mode === 'auto' ? (
        <>
          <p className="capacity-calc__section-label">{t('capacityDerived', lang)}</p>
          <div className="capacity-calc__estimates">
            {model.metrics.map(m => {
              const isReady = ready[m.id] && formulaReady(m, env);
              return (
                <div key={m.id} className="capacity-calc__estimate">
                  <div className="capacity-calc__field">
                    <span className="capacity-calc__label">
                      {localizedText(m.label, lang)}
                      <span className="capacity-calc__unit"> ({localizedText(m.unit, lang)})</span>
                    </span>
                    <FormulaRow
                      metric={m}
                      model={model}
                      lang={lang}
                      env={env}
                      substituted={isReady}
                      variables={variables}
                      onEditVar={setVar}
                    />
                    <p className="capacity-calc__result" aria-live="polite">
                      {isReady
                        ? `${formatMetricValue(metrics[m.id], m.format)} ${localizedText(m.unit, lang)}`
                        : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="capacity-calc__section-label">{t('yourEstimates', lang)}</p>
          <div className="capacity-calc__estimates">
            {practiceMetrics(model).map(m => {
              const result = state.results[m.id];
              const isReady = ready[m.id] && formulaReady(m, env);
              return (
                <div key={m.id} className="capacity-calc__estimate">
                  <label className="capacity-calc__field">
                    <span className="capacity-calc__label">
                      {localizedText(m.label, lang)}
                      <span className="capacity-calc__unit"> ({localizedText(m.unit, lang)})</span>
                    </span>
                    <FormulaRow
                      metric={m}
                      model={model}
                      lang={lang}
                      env={env}
                      substituted={isReady}
                      variables={variables}
                      onEditVar={setVar}
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={state.values[m.id] || ''}
                      onChange={e => setEstimate(m.id, e.target.value)}
                      className="capacity-calc__input"
                      placeholder={localizedText(m.unit, lang)}
                      style={inputStyle}
                    />
                  </label>
                  {state.checked && result && (
                    <p className="capacity-calc__verdict" style={{ color: verdictColor(result.verdict) }}>
                      {verdictLabel(result.verdict)}
                      {Number.isFinite(practiceRefs[m.id]) && (
                        <> · {t('referenceValue', lang)}: {formatMetricValue(practiceRefs[m.id], m.format)}</>
                      )}
                      {result.ratio > 0 ? ` · ×${result.ratio.toFixed(2)}` : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="capacity-calc__actions">
        {mode === 'auto' && (
          <button type="button" onClick={checkAuto} style={primaryBtn}>
            {t('capacityCheckInputs', lang)}
          </button>
        )}
        {mode === 'practice' && (
          <button type="button" onClick={checkPractice} style={primaryBtn}>
            {t('checkEstimates', lang)}
          </button>
        )}
        <button type="button" onClick={clearAll} style={secondaryBtn}>
          {t('capacityClear', lang)}
        </button>
      </div>

      {mode === 'auto' && autoChecked && autoSummary && (
        <p className="capacity-calc__auto-summary" aria-live="polite">
          {autoSummary}
        </p>
      )}

      {mode === 'practice' && state.checked && (
        <div className="capacity-calc__steps">
          <p className="capacity-calc__section-label">{t('workedSteps', lang)}</p>
          {model.steps.map((s, i) => (
            <p key={i} className="capacity-calc__step">
              {localizedText(s, lang)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function VarInput({
  v,
  lang,
  value,
  onChange,
  feedback,
}: {
  v: CapacityVariable;
  lang: Lang;
  value: string;
  onChange: (v: string) => void;
  feedback?: { verdict: AutoVarVerdict; kind: 'input' | 'assumption' };
}) {
  const unit = localizedText(v.unit, lang);
  let feedbackText: string | null = null;
  if (feedback) {
    if (feedback.verdict === 'missing') {
      feedbackText = t('capacityFeedbackMissing', lang);
    } else if (feedback.kind === 'input') {
      if (feedback.verdict === 'good') feedbackText = t('capacityFeedbackGood', lang);
      else if (feedback.verdict === 'ok') feedbackText = t('capacityFeedbackOk', lang);
      else feedbackText = tf('capacityFeedbackInputOff', lang, { unit: unit || localizedText(v.label, lang) });
    } else {
      const base =
        feedback.verdict === 'good'
          ? t('capacityFeedbackGood', lang)
          : feedback.verdict === 'ok'
            ? t('capacityFeedbackOk', lang)
            : t('capacityFeedbackAssumptionOff', lang);
      feedbackText = v.rangeHint ? `${base} — ${localizedText(v.rangeHint, lang)}` : base;
    }
  }

  const color =
    feedback?.verdict === 'good'
      ? 'var(--success)'
      : feedback?.verdict === 'ok'
        ? 'var(--accent)'
        : feedback
          ? 'var(--warning)'
          : undefined;

  return (
    <label className="capacity-calc__field">
      <span className="capacity-calc__label">
        {localizedText(v.label, lang)}
        <span className="capacity-calc__unit"> ({unit})</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="capacity-calc__input"
        placeholder={unit || localizedText(v.label, lang)}
        style={inputStyle}
        aria-invalid={feedback ? feedback.verdict === 'off' || feedback.verdict === 'missing' : undefined}
      />
      {feedbackText && (
        <p className="capacity-calc__feedback" style={{ color }} aria-live="polite">
          {feedbackText}
        </p>
      )}
    </label>
  );
}

function FormulaRow({
  metric,
  model,
  lang,
  env,
  substituted,
  variables,
  onEditVar,
}: {
  metric: CapacityMetric;
  model: NonNullable<ReturnType<typeof getCapacityModel>>;
  lang: Lang;
  env: Record<string, number>;
  substituted: boolean;
  variables: Record<string, string>;
  onEditVar: (id: string, value: string) => void;
}) {
  return (
    <div className="capacity-calc__formula-row">
      {metric.display.map((part, i) => {
        if ('text' in part) {
          return <span key={i} className="capacity-calc__formula-text">{part.text}</span>;
        }
        if ('const' in part) {
          return <span key={i} className="capacity-calc__formula-const">{part.const.toLocaleString('en-US')}</span>;
        }
        if ('var' in part) {
          const v = model.variables.find(x => x.id === part.var);
          const unit = v ? localizedText(v.unit, lang) : '';
          return (
            <input
              key={i}
              type="number"
              inputMode="decimal"
              className="capacity-calc__inline-input"
              value={variables[part.var] || ''}
              placeholder={unit || part.var}
              aria-label={v ? localizedText(v.label, lang) : part.var}
              onChange={e => onEditVar(part.var, e.target.value)}
            />
          );
        }
        if ('ref' in part) {
          if (substituted && Number.isFinite(env[part.ref])) {
            return <span key={i} className="capacity-calc__formula-value">{formatExact(env[part.ref])}</span>;
          }
          return <span key={i} className="capacity-calc__formula-symbol">{symbolForPart(part, model, lang)}</span>;
        }
        return null;
      })}
      {substituted && Number.isFinite(env[metric.id]) && (
        <>
          <span className="capacity-calc__formula-text"> = </span>
          <span className="capacity-calc__formula-value">{formatExact(env[metric.id])}</span>
        </>
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
  fontSize: '16px',
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

const secondaryBtn: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 10,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-subtle)',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
  minHeight: 44,
  touchAction: 'manipulation',
};
