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
  fittedBlockSize,
  edgePoint,
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
const DEFAULT_STEP_MS = 2200;

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

export function SolutionWalkthrough({ scenarioId, lang }: Props) {
  const scenario = getScenarioJson(scenarioId);
  const drawing = scenario?.drawing;
  const rtl = lang === 'ar';
  const reducedMotion = usePrefersReducedMotion();

  const flows = useMemo(() => flowsForScenario(scenario), [scenario]);
  const [flowId, setFlowId] = useState(flows[0]?.id || '');
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<typeof SPEEDS[number]>(1);
  const [packetT, setPacketT] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const [viewport, setViewport] = useState({ w: 640, h: 360 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number>(0);

  useEffect(() => {
    setFlowId(flows[0]?.id || '');
    setStepIndex(0);
    setPlaying(false);
  }, [scenarioId, flows]);

  const flow = flows.find(f => f.id === flowId) || flows[0];
  const steps = flow?.steps || [];
  const step = steps[stepIndex] ? normalizeFlowStep(steps[stepIndex]) : null;

  const graph = useMemo(
    () => (drawing ? layoutToWalkthroughGraph(drawing) : null),
    [drawing],
  );

  const containers = drawing?.containers || [];

  const activeEdgeKeys = useMemo(() => new Set(step?.edgeKeys || []), [step]);
  const activeNodes = useMemo(() => new Set(step?.nodes || []), [step]);

  const blockById = useMemo(() => {
    const m = new Map<string, { id: string; type: string; x: number; y: number; w: number; h: number }>();
    if (!graph) return m;
    for (const b of graph.blocks) {
      const sz = fittedBlockSize(b.type, lang);
      m.set(b.id, { ...b, w: sz.w, h: sz.h });
    }
    return m;
  }, [graph, lang]);

  const fitView = useCallback(() => {
    if (!graph || !wrapRef.current) return;
    const boxes = [
      ...graph.blocks.map(b => {
        const sz = fittedBlockSize(b.type, lang);
        return { x: b.x, y: b.y, w: sz.w, h: sz.h };
      }),
      ...containers.map(c => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
    ];
    if (!boxes.length) return;
    const minX = Math.min(...boxes.map(b => b.x)) - 20;
    const minY = Math.min(...boxes.map(b => b.y)) - 20;
    const maxX = Math.max(...boxes.map(b => b.x + b.w)) + 20;
    const maxY = Math.max(...boxes.map(b => b.y + b.h)) + 20;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const rect = wrapRef.current.getBoundingClientRect();
    const vw = Math.max(200, rect.width || viewport.w);
    const vh = Math.max(180, rect.height || viewport.h);
    const nextScale = Math.min(1.4, Math.max(0.45, Math.min((vw - 16) / bw, (vh - 16) / bh)));
    setScale(nextScale);
    setPan({
      x: (vw - bw * nextScale) / 2 - minX * nextScale,
      y: (vh - bh * nextScale) / 2 - minY * nextScale,
    });
    setViewport({ w: vw, h: vh });
  }, [containers, graph, lang, viewport.h, viewport.w]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setViewport({ w: Math.max(200, cr.width), h: Math.max(180, cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    fitView();
  }, [fitView, scenarioId, viewport.w]);

  // Autoplay step advance
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

  // Packet motion along active edge
  useEffect(() => {
    if (reducedMotion || !playing || !step?.packet) {
      setPacketT(0);
      return;
    }
    lastTs.current = 0;
    const loop = (ts: number) => {
      if (!lastTs.current) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      setPacketT(prev => {
        const next = prev + dt * 0.55 * speed;
        return next >= 1 ? next - Math.floor(next) : next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, reducedMotion, step, speed, stepIndex]);

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

  return (
    <div className="walkthrough" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="walkthrough__toolbar">
        <label className="walkthrough__flow">
          <span className="walkthrough__flow-label">{t('walkthroughFlow', lang)}</span>
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

        <div className="walkthrough__controls" role="group" aria-label={t('walkthroughControls', lang)}>
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
          <button type="button" className="walkthrough__btn" onClick={goNext} aria-label={t('walkthroughNext', lang)} disabled={stepIndex >= steps.length - 1}>
            {rtl ? '◀' : '▶'}
          </button>
          <button type="button" className="walkthrough__btn" onClick={fitView} aria-label={t('toolFit', lang)}>
            {t('toolFit', lang)}
          </button>
        </div>

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

      <div className="walkthrough__body">
        <div ref={wrapRef} className="walkthrough__canvas-wrap">
          <svg
            className="walkthrough__svg"
            viewBox={`0 0 ${viewport.w} ${viewport.h}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={t('architectureDiagram', lang)}
          >
            <defs>
              <marker id="wt-arrow-fwd" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
              </marker>
            </defs>
            <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
              {[...containers].sort((a, b) => b.w * b.h - a.w * a.h).map(c => (
                <g key={c.id} className="walkthrough-container">
                  <rect
                    x={c.x}
                    y={c.y}
                    width={c.w}
                    height={c.h}
                    rx={10}
                    fill="transparent"
                    stroke="var(--text-secondary)"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    opacity={0.7}
                  />
                  <text
                    x={c.x + 10}
                    y={c.y + 18}
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--text-secondary)"
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
                  <g key={edge.id} className={active ? 'is-active' : undefined}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={active ? 'var(--color-gold)' : 'var(--accent)'}
                      strokeWidth={active ? 3 : 2}
                      opacity={active ? 1 : 0.35}
                      markerEnd="url(#wt-arrow-fwd)"
                    />
                    {edge.label && (
                      <text
                        x={mid.x}
                        y={mid.y - 8}
                        textAnchor="middle"
                        fontSize={10}
                        fill="var(--text-secondary)"
                        opacity={active ? 1 : 0.45}
                      >
                        {localizedText(edge.label, lang)}
                      </text>
                    )}
                  </g>
                );
              })}

              {graph.blocks.map(block => {
                const sz = fittedBlockSize(block.type, lang);
                const active = activeNodes.has(block.type);
                const icon = paletteIconUrl(block.type);
                const textX = block.x + PAD_X + ICON + GAP;
                const lineY0 = block.y + PAD_Y + LABEL_SIZE;
                return (
                  <g key={block.id} className={active ? 'walkthrough-node is-active' : 'walkthrough-node'}>
                    <rect
                      x={block.x}
                      y={block.y}
                      width={sz.w}
                      height={sz.h}
                      rx={10}
                      fill={paletteColor(block.type)}
                      stroke={active ? 'var(--color-gold)' : 'transparent'}
                      strokeWidth={active ? 3 : 0}
                      opacity={active || !step ? 1 : 0.4}
                    />
                    {icon && (
                      <>
                        <rect
                          x={block.x + PAD_X - 2}
                          y={block.y + (sz.h - ICON) / 2 - 2}
                          width={ICON + 4}
                          height={ICON + 4}
                          rx={4}
                          fill="#ffffff"
                        />
                        <image
                          href={icon}
                          x={block.x + PAD_X}
                          y={block.y + (sz.h - ICON) / 2}
                          width={ICON}
                          height={ICON}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </>
                    )}
                    {sz.lines.map((line, i) => (
                      <text
                        key={i}
                        x={textX}
                        y={lineY0 + i * (LABEL_SIZE + 3)}
                        fill="#fff"
                        fontSize={LABEL_SIZE}
                        fontWeight={700}
                      >
                        {line}
                      </text>
                    ))}
                    <text
                      x={textX}
                      y={lineY0 + sz.lines.length * (LABEL_SIZE + 3) + 2}
                      fill="rgba(255,255,255,0.88)"
                      fontSize={SUB_SIZE}
                    >
                      {sz.sub}
                    </text>
                  </g>
                );
              })}

              {packetEdge && (
                <circle
                  className="walkthrough-packet"
                  cx={packetEdge.x}
                  cy={packetEdge.y}
                  r={7}
                  fill="var(--color-gold)"
                  stroke="var(--bg-elevated)"
                  strokeWidth={2}
                />
              )}
            </g>
          </svg>
        </div>

        <div className="walkthrough__caption-panel">
          <p className="walkthrough__step-meta">
            {t('walkthroughStep', lang)} {steps.length ? stepIndex + 1 : 0} / {steps.length}
            {flow ? ` · ${localizedText(flow.title, lang)}` : ''}
          </p>
          <p className="walkthrough__caption">
            {step ? localizedText(step.caption, lang) : '—'}
          </p>
          <label className="walkthrough__scrubber">
            <span className="visually-hidden">{t('walkthroughScrubber', lang)}</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, steps.length - 1)}
              step={1}
              value={stepIndex}
              onChange={e => {
                setPlaying(false);
                setStepIndex(Number(e.target.value));
                setPacketT(0);
              }}
              aria-valuemin={0}
              aria-valuemax={Math.max(0, steps.length - 1)}
              aria-valuenow={stepIndex}
              aria-label={t('walkthroughScrubber', lang)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

/** Exported for tests / debugging edge key parsing. */
export { parseEdgeKey };
