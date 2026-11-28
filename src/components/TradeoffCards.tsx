import { useState, type CSSProperties } from 'react';
import type { Lang, TradeoffState } from '../types';
import { TRADEOFF_CARDS } from '../interactive/tradeoffData';
import { t, localizedText } from '../i18n';

interface Props {
  scenarioId: string;
  lang: Lang;
  state: TradeoffState;
  onChange: (next: TradeoffState) => void;
}

export function TradeoffCards({ scenarioId, lang, state, onChange }: Props) {
  const cards = TRADEOFF_CARDS[scenarioId] || [];
  const [index, setIndex] = useState(0);
  if (cards.length === 0) return null;

  const card = cards[Math.min(index, cards.length - 1)];
  const answer = state.answers[card.id] || { choice: null, justification: '', revealed: false, scored: false };

  const update = (patch: Partial<typeof answer>) => {
    onChange({
      answers: {
        ...state.answers,
        [card.id]: { ...answer, ...patch },
      },
    });
  };

  const reveal = () => {
    const expectedOk =
      card.expected === 'either' ||
      (answer.choice === 'A' && card.expected === 'A') ||
      (answer.choice === 'B' && card.expected === 'B');
    update({ revealed: true, scored: !!answer.choice && expectedOk });
  };

  return (
    <div style={{ marginTop: 16, marginBottom: 20 }}>
      <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px' }}>{t('tradeoffCards', lang)}</h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
        {t('tradeoffHint', lang)}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
        {t('tradeoffCardOf', lang)} {index + 1} / {cards.length}
      </p>

      <div style={{ padding: 16, borderRadius: 14, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', marginBottom: 12 }}>
        <p style={{ margin: '0 0 14px', fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 }}>
          {localizedText(card.question, lang)}
        </p>

        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          {(['A', 'B'] as const).map(opt => {
            const label = opt === 'A' ? card.optionA : card.optionB;
            const selected = answer.choice === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => !answer.revealed && update({ choice: opt })}
                style={{
                  padding: '12px 14px', borderRadius: 10, textAlign: lang === 'ar' ? 'right' : 'left',
                  border: selected ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                  background: selected ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                  color: 'var(--text-primary)', cursor: answer.revealed ? 'default' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 500, minHeight: 44, touchAction: 'manipulation',
                }}
              >
                {opt}. {localizedText(label, lang)}
              </button>
            );
          })}
        </div>

        <label style={{ display: 'grid', gap: 6, fontSize: '0.8125rem', marginBottom: 12 }}>
          <span>{t('justification', lang)}</span>
          <input
            value={answer.justification}
            disabled={answer.revealed}
            onChange={e => update({ justification: e.target.value })}
            style={{
              padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-default)',
              background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.9375rem',
            }}
          />
        </label>

        {!answer.revealed ? (
          <button type="button" onClick={reveal} disabled={!answer.choice} style={primaryBtn}>
            {t('revealTradeoff', lang)}
          </button>
        ) : (
          <div style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px', color: 'var(--accent)', fontWeight: 600 }}>
              {t('interviewerExpects', lang)}: {card.expected === 'either' ? `${localizedText(card.optionA, lang)} / ${localizedText(card.optionB, lang)}` : localizedText(card.expected === 'A' ? card.optionA : card.optionB, lang)}
            </p>
            <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>{localizedText(card.expectedNote, lang)}</p>

            <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-subtle)' }}>
                <strong>{localizedText(card.optionA, lang)}</strong>
                <p style={{ margin: '6px 0 0' }}><span style={{ color: 'var(--success)' }}>{t('pros', lang)}:</span> {localizedText(card.prosA, lang)}</p>
                <p style={{ margin: '4px 0 0' }}><span style={{ color: 'var(--warning)' }}>{t('cons', lang)}:</span> {localizedText(card.consA, lang)}</p>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-subtle)' }}>
                <strong>{localizedText(card.optionB, lang)}</strong>
                <p style={{ margin: '6px 0 0' }}><span style={{ color: 'var(--success)' }}>{t('pros', lang)}:</span> {localizedText(card.prosB, lang)}</p>
                <p style={{ margin: '4px 0 0' }}><span style={{ color: 'var(--warning)' }}>{t('cons', lang)}:</span> {localizedText(card.consB, lang)}</p>
              </div>
            </div>
            <p style={{ margin: '0 0 10px' }}><strong>{t('whenOtherWins', lang)}:</strong> {localizedText(card.whenOtherWins, lang)}</p>
            <button
              type="button"
              onClick={() => update({ scored: !answer.scored })}
              style={{
                ...primaryBtn,
                background: answer.scored ? 'var(--success)' : 'var(--bg-subtle)',
                color: answer.scored ? '#fff' : 'var(--text-primary)',
                border: answer.scored ? 'none' : '1px solid var(--border-default)',
              }}
            >
              {t('iGotThis', lang)}{answer.scored ? ' ✓' : ''}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 12 }}>
        <button
          type="button"
          disabled={index <= 0}
          onClick={() => setIndex(i => i - 1)}
          style={{
            ...navBtn,
            opacity: index <= 0 ? 0.5 : 1,
            cursor: index <= 0 ? 'not-allowed' : 'pointer',
            color: index <= 0 ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          {t('previous', lang)}
        </button>
        <button
          type="button"
          disabled={index >= cards.length - 1}
          onClick={() => setIndex(i => i + 1)}
          style={{
            ...navBtn,
            opacity: index >= cards.length - 1 ? 0.5 : 1,
            cursor: index >= cards.length - 1 ? 'not-allowed' : 'pointer',
            color: index >= cards.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          {t('next', lang)}
        </button>
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

const navBtn: CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-subtle)',
  color: 'var(--text-primary)',
  fontWeight: 500,
  fontSize: '0.8125rem',
  cursor: 'pointer',
  minHeight: 40,
};
