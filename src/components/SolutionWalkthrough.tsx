import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Lang } from '../types';
import { getScenarioJson } from '../content/loadContent';
import { localizedText, t } from '../i18n';
import {
  GAP,
  ICON,
  LABEL_SIZE,
  PAD_X,
  PAD_Y,
  SUB_SIZE,
  edgePoint,
  fittedBlockSize,
  midpoint,
} from '../interactive/drawingGeom';
import { paletteColor, paletteIconUrl } from '../interactive/palette';
import {
  flowsForScenario,
  layoutToWalkthroughGraph,
  normalizeFlowStep,
  parseEdgeKey,
  resolveContainerLabel,
} from '../interactive/solutionFlows';

interface Props {
  scenarioId: string;
  lang: Lang;
}

const SPEEDS = [0.5, 1, 1.5, 2] as const;
const DEFAULT_STEP_MS = 2400;
/** Keep labels ~readable (≥ ~10–11px on screen). */
const MIN_FIT_SCALE = 0.78;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);
  return reduced;
}

function useIsNarrow(breakpoint = 720) {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : true,
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return narrow;
}

export function SolutionWalkthrough({ scenarioId, lang }: Props) {
  const scenario = getScenarioJson(scenarioId);
  const drawing = scenario?.drawing;
  const rtl = lang === 'ar';
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useIsNarrow(900);

  const flows = useMemo(() => flowsForScenario(scenario), [scenario]);
  const [flowId, setFlowId] = useState(flows[0]?.id || '');
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<typeof SPEEDS[number]>(1);
  const [packetT, setPacketT] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 16, y: 16 });
  const [viewport, setViewport] = useState({ w: 640, h: 360 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const panDrag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    setFlowId(flows[0]?.id || '');
    setStepIndex(0);
    setPlaying(false);
    setPacketT(0);
  }, [scenarioId, flows]);

  const flow = flows.find(f => f.id === flowId) || flows[0];
  const steps = flow?.steps || [];
  const step = steps[stepIndex] ? normalizeFlowStep(steps[stepIndex]) : null;

  const graph = useMemo(() => {
    if (!drawing) return null;
    return layoutToWalkthroughGraph(
      drawing,
      narrow ? 'vertical' : 'horizontal',
      (type) => {
        const fit = fittedBlockSize(type, lang);
        return { w: fit.w, h: fit.h };
      },
    );
  }, [drawing, lang, narrow]);

  const activeEdgeKeys = useMemo(() => new Set(step?.edgeKeys || []), [step]);
  const activeNodes = useMemo(() => new Set(step?.nodes || []), [step]);

  const blockById = useMemo(() => {
    const m = new Map<string, { id: string; type: string; x: number; y: number; w: number; h: number }>();
    if (!graph) return m;
    for (const b of graph.blocks) m.set(b.id, b);
    return m;
  }, [graph]);

  const worldBounds = useMemo(() => {
    if (!graph) return null;
    const boxes = [
      ...graph.blocks.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h })),
      ...graph.containers.map(c => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
    ];
    if (!boxes.length) return null;
    const minX = Math.min(...boxes.map(b => b.x)) - 20;
    const minY = Math.min(...boxes.map(b => b.y)) - 20;
    const maxX = Math.max(...boxes.map(b => b.x + b.w)) + 20;
    const maxY = Math.max(...boxes.map(b => b.y + b.h)) + 20;
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }, [graph]);

  const activeNodesRef = useRef(activeNodes);
  activeNodesRef.current = activeNodes;

  const fitView = useCallback((opts?: { focusActive?: boolean }) => {
    if (!worldBounds || !wrapRef.current || !graph) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const vw = Math.max(200, rect.width || viewport.w);
    const vh = Math.max(220, rect.height || viewport.h);
    const ideal = Math.min((vw - 24) / worldBounds.w, (vh - 24) / worldBounds.h);

    let focus = worldBounds;
    let nextScale = Math.min(1.35, Math.max(0.55, ideal));

    // Fit button: prefer readable scale, center on the active step when the full graph is too wide.
    if (opts?.focusActive) {
      nextScale = Math.min(1.35, Math.max(MIN_FIT_SCALE, ideal));
      if (ideal < MIN_FIT_SCALE) {
        const focusBlocks = graph.blocks.filter(b => activeNodesRef.current.has(b.type));
        if (focusBlocks.length) {
          const minX = Math.min(...focusBlocks.map(b => b.x)) - 48;
          const minY = Math.min(...focusBlocks.map(b => b.y)) - 48;
          const maxX = Math.max(...focusBlocks.map(b => b.x + b.w)) + 48;
          const maxY = Math.max(...focusBlocks.map(b => b.y + b.h)) + 48;
          focus = { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
        }
      }
    }

    setScale(nextScale);
    setPan({
      x: (vw - focus.w * nextScale) / 2 - focus.minX * nextScale,
      y: (vh - focus.h * nextScale) / 2 - focus.minY * nextScale,
    });
    setViewport({ w: vw, h: vh });
  }, [graph, viewport.h, viewport.w, worldBounds]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setViewport({ w: Math.max(200, cr.width), h: Math.max(220, cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => fitView());
    return () => cancelAnimationFrame(id);
  }, [fitView, scenarioId, narrow, lang]);

  // Autoplay
  useEffect(() => {
    if (!playing || !steps.length) return;
    const ms = (steps[stepIndex]?.durationMs || DEFAULT_STEP_MS) / speed;
    const timer = window.setTimeout(() => {
      setStepIndex(i => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
      setPacketT(0);
    }, ms);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, steps, speed]);

  // Packet motion — always when a packet exists (unless reduced motion)
  useEffect(() => {
    if (reducedMotion || !step?.packet) {
      setPacketT(0);
      return;
    }
    lastTs.current = 0;
    const loop = (ts: number) => {
      if (!lastTs.current) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      setPacketT(prev => {
        const rate = playing ? 0.7 * speed : 0.45 * speed;
        const next = prev + dt * rate;
        return next >= 1 ? next - Math.floor(next) : next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, reducedMotion, step, speed, stepIndex]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), scale };
      panDrag.current = null;
      return;
    }
    panDrag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointers.current.size === 2 && pinch.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinch.current.dist || 1);
      setScale(Math.max(MIN_FIT_SCALE, Math.min(2.2, pinch.current.scale * ratio)));
      return;
    }
    if (panDrag.current && pointers.current.size === 1) {
      const dx = e.clientX - panDrag.current.x;
      const dy = e.clientY - panDrag.current.y;
      setPan({ x: panDrag.current.panX + dx, y: panDrag.current.panY + dy });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) panDrag.current = null;
  };

  if (!drawing || !graph) {
    return (
      <div className="walkthrough walkthrough--empty" dir={rtl ? 'rtl' : 'ltr'}>
        <p>{t('walkthroughNoDrawing', lang)}</p>
      </div>
    );
  }

  const packetEdge = (() => {
    if (!step?.packet || reducedMotion) return null;
    const fromType = step.packet.from;
    const toType = step.packet.to;
    const edge =
      graph.edges.find(e => e.fromType === fromType && e.toType === toType) ||
      graph.edges.find(e => activeEdgeKeys.has(e.key));
    if (!edge) return null;
    const ba = blockById.get(edge.fromId);
    const bb = blockById.get(edge.toId);
    if (!ba || !bb) return null;
    const ca = { x: ba.x + ba.w / 2, y: ba.y + ba.h / 2 };
    const cb = { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 };
    const p1 = edgePoint(ba, cb);
    const p2 = edgePoint(bb, ca);
    return {
      x: p1.x + (p2.x - p1.x) * packetT,
      y: p1.y + (p2.y - p1.y) * packetT,
    };
  })();

  const goPrev = () => {
    setPlaying(false);
    setStepIndex(i => Math.max(0, i - 1));
    setPacketT(0);
  };
  const goNext = () => {
    setPlaying(false);
    setStepIndex(i => Math.min(steps.length - 1, i + 1));
    setPacketT(0);
  };

  const maxStep = Math.max(0, steps.length - 1);

  return (
    <div className="walkthrough" dir={rtl ? 'rtl' : 'ltr'}>
      <div
        ref={wrapRef}
        className="walkthrough__canvas-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg
          className="walkthrough__svg"
          viewBox={`0 0 ${viewport.w} ${viewport.h}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          role="img"
          aria-label={t('architectureDiagram', lang)}
        >
          <defs>
            <marker id="wt-arrow-fwd" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
            </marker>
            <marker id="wt-arrow-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--color-gold)" />
            </marker>
          </defs>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
            {[...graph.containers].sort((a, b) => b.w * b.h - a.w * a.h).map(c => (
              <g key={c.id} className="walkthrough-container">
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  rx={10}
                  fill="var(--accent-soft)"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  opacity={0.55}
                />
                <text
                  x={c.x + 12}
                  y={c.y + 18}
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--text-primary)"
                  style={{ pointerEvents: 'none' }}
                >
                  {resolveContainerLabel(c.label, lang)}
                </text>
              </g>
            ))}

            {graph.edges.map(edge => {
              const ba = blockById.get(edge.fromId);
              const bb = blockById.get(edge.toId);
              if (!ba || !bb) return null;
              const ca = { x: ba.x + ba.w / 2, y: ba.y + ba.h / 2 };
              const cb = { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 };
              const p1 = edgePoint(ba, cb);
              const p2 = edgePoint(bb, ca);
              const mid = midpoint(p1, p2);
              const active = activeEdgeKeys.has(edge.key)
                || (step?.packet && edge.fromType === step.packet.from && edge.toType === step.packet.to);
              return (
                <g key={edge.id}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={active ? 'var(--color-gold)' : 'var(--accent)'}
                    strokeWidth={active ? 3.5 : 2}
                    opacity={active ? 1 : 0.22}
                    markerEnd={active ? 'url(#wt-arrow-active)' : 'url(#wt-arrow-fwd)'}
                  />
                  {edge.label && active && (
                    <text
                      x={mid.x}
                      y={mid.y - 10}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={600}
                      fill="var(--text-secondary)"
                    >
                      {localizedText(edge.label, lang)}
                    </text>
                  )}
                </g>
              );
            })}

            {graph.blocks.map(block => {
              const fit = fittedBlockSize(block.type, lang);
              const active = !step || activeNodes.has(block.type);
              const highlighted = activeNodes.has(block.type);
              const icon = paletteIconUrl(block.type);
              const textX = block.x + PAD_X + ICON + GAP;
              const lineY0 = block.y + PAD_Y + LABEL_SIZE;
              return (
                <g
                  key={block.id}
                  className={highlighted ? 'walkthrough-node is-active' : 'walkthrough-node'}
                  opacity={active ? 1 : 0.28}
                >
                  <rect
                    x={block.x}
                    y={block.y}
                    width={block.w}
                    height={block.h}
                    rx={10}
                    fill={paletteColor(block.type)}
                    stroke={highlighted ? 'var(--color-gold)' : 'transparent'}
                    strokeWidth={highlighted ? 3 : 0}
                  />
                  {icon && (
                    <>
                      <rect
                        x={block.x + PAD_X - 2}
                        y={block.y + (block.h - ICON) / 2 - 2}
                        width={ICON + 4}
                        height={ICON + 4}
                        rx={4}
                        fill="#ffffff"
                      />
                      <image
                        href={icon}
                        x={block.x + PAD_X}
                        y={block.y + (block.h - ICON) / 2}
                        width={ICON}
                        height={ICON}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </>
                  )}
                  {fit.lines.map((line, i) => (
                    <text
                      key={i}
                      x={textX}
                      y={lineY0 + i * (LABEL_SIZE + 3)}
                      fill="#fff"
                      fontSize={LABEL_SIZE}
                      fontWeight={700}
                      style={{ pointerEvents: 'none' }}
                    >
                      {line}
                    </text>
                  ))}
                  <text
                    x={textX}
                    y={lineY0 + fit.lines.length * (LABEL_SIZE + 3) + 2}
                    fill="rgba(255,255,255,0.9)"
                    fontSize={SUB_SIZE}
                    style={{ pointerEvents: 'none' }}
                  >
                    {fit.sub}
                  </text>
                </g>
              );
            })}

            {packetEdge && (
              <g className="walkthrough-packet" style={{ pointerEvents: 'none' }}>
                <circle
                  cx={packetEdge.x}
                  cy={packetEdge.y}
                  r={10}
                  fill="var(--color-gold)"
                  opacity={0.35}
                />
                <circle
                  cx={packetEdge.x}
                  cy={packetEdge.y}
                  r={6}
                  fill="var(--color-gold)"
                  stroke="#fff"
                  strokeWidth={2.5}
                />
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="walkthrough__panel">
        <p className="walkthrough__step-meta">
          {t('walkthroughStep', lang)}{' '}
          {steps.length ? stepIndex + 1 : 0} / {steps.length}
          {flow ? ` · ${localizedText(flow.title, lang)}` : ''}
        </p>
        <p className="walkthrough__caption">
          {step ? localizedText(step.caption, lang) : '—'}
        </p>

        <div className="walkthrough__panel-row walkthrough__panel-row--controls" role="group" aria-label={t('walkthroughControls', lang)}>
          <button type="button" className="walkthrough__btn" onClick={goPrev} aria-label={t('walkthroughPrev', lang)} disabled={stepIndex <= 0}>
            {rtl ? '▶' : '◀'}
          </button>
          <button
            type="button"
            className="walkthrough__btn walkthrough__btn--primary"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? t('walkthroughPause', lang) : t('walkthroughPlay', lang)}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <button type="button" className="walkthrough__btn" onClick={goNext} aria-label={t('walkthroughNext', lang)} disabled={stepIndex >= maxStep}>
            {rtl ? '◀' : '▶'}
          </button>
          <button
            type="button"
            className="walkthrough__btn"
            onClick={() => fitView({ focusActive: true })}
            aria-label={t('toolFit', lang)}
          >
            {t('toolFit', lang)}
          </button>
        </div>

        <div className="walkthrough__panel-row walkthrough__panel-row--selects">
          <label className="walkthrough__flow">
            <span>{t('walkthroughFlow', lang)}</span>
            <select
              value={flow?.id || ''}
              onChange={e => {
                setFlowId(e.target.value);
                setStepIndex(0);
                setPlaying(false);
                setPacketT(0);
              }}
              aria-label={t('walkthroughFlow', lang)}
            >
              {flows.map(f => (
                <option key={f.id} value={f.id}>{localizedText(f.title, lang)}</option>
              ))}
            </select>
          </label>
          <label className="walkthrough__speed">
            <span>{t('walkthroughSpeed', lang)}</span>
            <select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value) as typeof SPEEDS[number])}
              aria-label={t('walkthroughSpeed', lang)}
            >
              {SPEEDS.map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </label>
        </div>

        {/* Force LTR so value 0 is at the visual start (left), matching step index */}
        <label className="walkthrough__scrubber" dir="ltr">
          <span className="visually-hidden">{t('walkthroughScrubber', lang)}</span>
          <input
            type="range"
            min={0}
            max={maxStep}
            step={1}
            value={stepIndex}
            onChange={e => {
              setPlaying(false);
              setStepIndex(Number(e.target.value));
              setPacketT(0);
            }}
            aria-valuemin={0}
            aria-valuemax={maxStep}
            aria-valuenow={stepIndex}
            aria-label={t('walkthroughScrubber', lang)}
          />
        </label>
      </div>
    </div>
  );
}

export { parseEdgeKey };
