import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { DrawingState, DrawingBlock, Lang, ComponentType } from '../types';
import { PALETTE, paletteColor, paletteLabel, paletteShort } from '../interactive/palette';
import { DRAWING_EXPECTATIONS } from '../interactive/drawingData';
import { t } from '../i18n';

const BLOCK_W = 88;
const BLOCK_H = 44;
const BOARD_W = 520;
const BOARD_H = 320;

interface Props {
  scenarioId: string;
  lang: Lang;
  state: DrawingState;
  onChange: (next: DrawingState) => void;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DrawingBoard({ scenarioId, lang, state, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const expected = DRAWING_EXPECTATIONS[scenarioId];

  const addBlock = (type: ComponentType) => {
    const block: DrawingBlock = {
      id: uid('b'),
      type,
      x: 40 + (state.blocks.length % 4) * 100,
      y: 40 + Math.floor(state.blocks.length / 4) * 60,
    };
    onChange({ ...state, blocks: [...state.blocks, block], compared: false });
  };

  const deleteBlock = (id: string) => {
    onChange({
      ...state,
      blocks: state.blocks.filter(b => b.id !== id),
      edges: state.edges.filter(e => e.from !== id && e.to !== id),
      compared: false,
    });
    setSelectedId(null);
    setConnectFrom(null);
  };

  const onBlockPointerDown = (e: ReactPointerEvent, block: DrawingBlock) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedId(block.id);
    setDragId(block.id);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const scaleX = BOARD_W / rect.width;
      const scaleY = BOARD_H / rect.height;
      dragOffset.current = {
        x: (e.clientX - rect.left) * scaleX - block.x,
        y: (e.clientY - rect.top) * scaleY - block.y,
      };
    }
    longPressTimer.current = window.setTimeout(() => {
      deleteBlock(block.id);
      setDragId(null);
    }, 700);
  };

  const onBlockPointerMove = (e: ReactPointerEvent) => {
    if (!dragId || !svgRef.current) return;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = BOARD_W / rect.width;
    const scaleY = BOARD_H / rect.height;
    const x = Math.max(0, Math.min(BOARD_W - BLOCK_W, (e.clientX - rect.left) * scaleX - dragOffset.current.x));
    const y = Math.max(0, Math.min(BOARD_H - BLOCK_H, (e.clientY - rect.top) * scaleY - dragOffset.current.y));
    onChange({
      ...state,
      blocks: state.blocks.map(b => (b.id === dragId ? { ...b, x, y } : b)),
      compared: false,
    });
  };

  const onBlockPointerUp = (e: ReactPointerEvent, block: DrawingBlock) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setDragId(null);
    if (connectFrom && connectFrom !== block.id) {
      const exists = state.edges.some(ed => ed.from === connectFrom && ed.to === block.id);
      if (!exists) {
        onChange({
          ...state,
          edges: [...state.edges, { id: uid('e'), from: connectFrom, to: block.id }],
          compared: false,
        });
      }
      setConnectFrom(null);
    } else if (!dragId) {
      setConnectFrom(block.id);
    }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const compare = useCallback(() => {
    if (!expected) return;
    const present = new Set(state.blocks.map(b => b.type));
    const matchedComponents = expected.components.filter(c => present.has(c));
    const missedComponents = expected.components.filter(c => !present.has(c));

    const edgeKey = (from: ComponentType, to: ComponentType) => `${from}->${to}`;
    const userEdges = new Set<string>();
    for (const e of state.edges) {
      const a = state.blocks.find(b => b.id === e.from);
      const b = state.blocks.find(b => b.id === e.to);
      if (a && b) userEdges.add(edgeKey(a.type, b.type));
    }
    const matchedEdges = expected.edges.filter(e => userEdges.has(edgeKey(e.from, e.to))).map(e => edgeKey(e.from, e.to));
    const missedEdges = expected.edges.filter(e => !userEdges.has(edgeKey(e.from, e.to))).map(e => edgeKey(e.from, e.to));

    const compScore = expected.components.length ? matchedComponents.length / expected.components.length : 0;
    const edgeScore = expected.edges.length ? matchedEdges.length / expected.edges.length : 0;
    const score = Math.round((compScore * 0.6 + edgeScore * 0.4) * 100) / 100;

    onChange({
      ...state,
      compared: true,
      matchedComponents,
      missedComponents,
      matchedEdges,
      missedEdges,
      score,
    });
  }, [expected, onChange, state]);

  const blockCenter = (b: DrawingBlock) => ({ x: b.x + BLOCK_W / 2, y: b.y + BLOCK_H / 2 });

  return (
    <div style={{ marginTop: 16, marginBottom: 20 }}>
      <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>{t('drawingBoard', lang)}</h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>{t('drawingHint', lang)}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '100%' }}>{t('palette', lang)}</span>
        {PALETTE.map(p => (
          <button
            key={p.type}
            type="button"
            onClick={() => addBlock(p.type)}
            style={{
              padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600, borderRadius: 8,
              border: 'none', background: p.color, color: '#fff', cursor: 'pointer',
              minHeight: 36, touchAction: 'manipulation',
            }}
          >
            {p.label[lang]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <button type="button" onClick={() => setConnectFrom(selectedId)} style={btnStyle} disabled={!selectedId}>
          {t('connectMode', lang)}{connectFrom ? ' ✓' : ''}
        </button>
        <button type="button" onClick={() => selectedId && deleteBlock(selectedId)} style={btnStyle} disabled={!selectedId}>
          {t('deleteSelected', lang)}
        </button>
        <button type="button" onClick={() => onChange({ ...state, blocks: [], edges: [], compared: false, score: 0, matchedComponents: [], missedComponents: [], matchedEdges: [], missedEdges: [] })} style={btnStyle}>
          {t('clearBoard', lang)}
        </button>
        <button type="button" onClick={compare} style={{ ...btnStyle, background: 'var(--accent)', color: '#fff' }}>
          {t('compareDesign', lang)}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0 0 6px' }}>{t('yourDrawing', lang)}</p>
          <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-subtle)', touchAction: 'none' }}>
            <svg ref={svgRef} viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} width="100%" style={{ display: 'block', minHeight: 220 }}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
                </marker>
              </defs>
              {state.edges.map(edge => {
                const from = state.blocks.find(b => b.id === edge.from);
                const to = state.blocks.find(b => b.id === edge.to);
                if (!from || !to) return null;
                const a = blockCenter(from);
                const b = blockCenter(to);
                return (
                  <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--accent)" strokeWidth={2} markerEnd="url(#arrowhead)" opacity={0.7} />
                );
              })}
              {state.blocks.map(block => (
                <g
                  key={block.id}
                  onPointerDown={(e) => onBlockPointerDown(e, block)}
                  onPointerMove={onBlockPointerMove}
                  onPointerUp={(e) => onBlockPointerUp(e, block)}
                  style={{ cursor: 'grab' }}
                >
                  <rect
                    x={block.x} y={block.y} width={BLOCK_W} height={BLOCK_H} rx={8}
                    fill={paletteColor(block.type)}
                    stroke={selectedId === block.id || connectFrom === block.id ? '#C9A227' : 'transparent'}
                    strokeWidth={3}
                  />
                  <text x={block.x + BLOCK_W / 2} y={block.y + 18} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>
                    {paletteShort(block.type)}
                  </text>
                  <text x={block.x + BLOCK_W / 2} y={block.y + 34} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={8}>
                    {paletteLabel(block.type, lang).slice(0, 12)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {state.compared && expected && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0 0 6px' }}>{t('proposedDesign', lang)}</p>
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-subtle)' }}>
              <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} width="100%" style={{ display: 'block', minHeight: 180 }}>
                {expected.edges.map((edge, i) => {
                  const from = expected.referenceLayout.find(b => b.type === edge.from);
                  const to = expected.referenceLayout.find(b => b.type === edge.to);
                  if (!from || !to) return null;
                  return (
                    <line key={i} x1={from.x + BLOCK_W / 2} y1={from.y + BLOCK_H / 2} x2={to.x + BLOCK_W / 2} y2={to.y + BLOCK_H / 2} stroke="#155E57" strokeWidth={1.5} opacity={0.5} />
                  );
                })}
                {expected.referenceLayout.map(block => (
                  <g key={block.type}>
                    <rect x={block.x} y={block.y} width={BLOCK_W} height={BLOCK_H} rx={8} fill={paletteColor(block.type)} opacity={0.9} />
                    <text x={block.x + BLOCK_W / 2} y={block.y + 26} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600}>
                      {paletteShort(block.type)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.8125rem', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--accent)' }}>
                {t('drawingScore', lang)}: {Math.round(state.score * 100)}%
              </p>
              <p style={{ margin: '0 0 4px', color: 'var(--success)' }}>
                {t('matchedComponents', lang)}: {state.matchedComponents.map(c => paletteLabel(c as ComponentType, lang)).join(', ') || '—'}
              </p>
              <p style={{ margin: '0 0 4px', color: 'var(--warning)' }}>
                {t('missedComponents', lang)}: {state.missedComponents.map(c => paletteLabel(c as ComponentType, lang)).join(', ') || '—'}
              </p>
              <p style={{ margin: '0 0 4px', color: 'var(--success)' }}>
                {t('matchedEdges', lang)}: {state.matchedEdges.length}
              </p>
              <p style={{ margin: 0, color: 'var(--warning)' }}>
                {t('missedEdges', lang)}: {state.missedEdges.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle: CSSProperties = {
  padding: '8px 12px',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  minHeight: 36,
  touchAction: 'manipulation',
};
