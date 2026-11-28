import type { AttemptHistory, Lang, RadarScores } from '../types';
import { RADAR_DIMS, RADAR_LABELS, strengthsAndWeaknesses } from '../interactive/radar';
import { t } from '../i18n';

interface Props {
  lang: Lang;
  scores: RadarScores;
  overall: number;
  history: AttemptHistory[];
  onSave: () => void;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function polygonPoints(scores: RadarScores, cx: number, cy: number, maxR: number) {
  const n = RADAR_DIMS.length;
  return RADAR_DIMS.map((d, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(100, scores[d])) / 100) * maxR;
    const p = polar(cx, cy, r, angle);
    return `${p.x},${p.y}`;
  }).join(' ');
}

export function RadarChart({ lang, scores, overall, history, onSave }: Props) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const n = RADAR_DIMS.length;
  const { strengths, weaknesses } = strengthsAndWeaknesses(scores, lang);
  const prev = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div style={{ marginTop: 8, marginBottom: 20 }}>
      <h3 style={{ fontSize: '1.15rem', margin: '0 0 8px' }}>{t('radarReport', lang)}</h3>
      <p style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent)' }}>
        {t('overallScore', lang)}: {overall}%
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 340 }}>
          {[0.25, 0.5, 0.75, 1].map(scale => (
            <polygon
              key={scale}
              points={RADAR_DIMS.map((_, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
                const p = polar(cx, cy, maxR * scale, angle);
                return `${p.x},${p.y}`;
              }).join(' ')}
              fill="none"
              stroke="var(--border-default)"
              strokeWidth={1}
            />
          ))}
          {RADAR_DIMS.map((_, i) => {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const p = polar(cx, cy, maxR, angle);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border-subtle)" strokeWidth={1} />;
          })}
          {prev && (
            <polygon
              points={polygonPoints(prev.scores, cx, cy, maxR)}
              fill="rgba(201,162,39,0.15)"
              stroke="#C9A227"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}
          <polygon
            points={polygonPoints(scores, cx, cy, maxR)}
            fill="rgba(26,122,109,0.25)"
            stroke="#1A7A6D"
            strokeWidth={2}
          />
          {RADAR_DIMS.map((d, i) => {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const labelR = maxR + 28;
            const p = polar(cx, cy, labelR, angle);
            return (
              <text key={d} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--text-secondary)">
                {RADAR_LABELS[d][lang]}
              </text>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--success-bg)' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--success)' }}>{t('strengths', lang)}</p>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>{strengths.length ? strengths.join(' · ') : '—'}</p>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--warning-bg)' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--warning)' }}>{t('weaknesses', lang)}</p>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>{weaknesses.length ? weaknesses.join(' · ') : '—'}</p>
        </div>
      </div>

      <button type="button" onClick={onSave} style={{
        padding: '12px 18px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff',
        fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', minHeight: 44, width: '100%', marginBottom: 16,
      }}>
        {t('saveAttempt', lang)}
      </button>

      <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 8px' }}>{t('attemptHistory', lang)}</p>
      {history.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t('noHistory', lang)}</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {[...history].reverse().slice(0, 5).map((h, i) => (
            <div key={h.timestamp} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-subtle)', fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span>{new Date(h.timestamp).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')} · {h.level}</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{h.overall}%{i === 0 && history.length > 1 ? ` · ${t('previousAttempt', lang)}` : ''}</span>
            </div>
          ))}
          {history.length > 1 && (
            <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', gap: 2, padding: 2 }}>
              {history.slice(-8).map(h => (
                <div key={h.timestamp} style={{ flex: 1, height: `${Math.max(12, h.overall)}%`, background: 'var(--accent)', borderRadius: 2 }} title={`${h.overall}%`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
