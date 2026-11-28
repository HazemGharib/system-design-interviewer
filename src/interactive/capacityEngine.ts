import type { Bi } from '../content/types';

export type CapacityVarRole = 'input' | 'assumption';

export interface CapacityVariable {
  id: string;
  label: Bi;
  unit: Bi;
  default: number;
  role: CapacityVarRole;
}

export type FormulaPart =
  | { text: string }
  | { const: number }
  | { ref: string }
  | { var: string };

export interface CapacityMetric {
  id: string;
  label: Bi;
  unit: Bi;
  format: 'count' | 'qps' | 'storage';
  expr: string;
  display: FormulaPart[];
  practice: boolean;
}

export interface CapacityModel {
  variables: CapacityVariable[];
  metrics: CapacityMetric[];
  steps: Bi[];
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  const re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d*\.\d+|\d+|\*\*|[+\-*/()])\s*/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(expr))) {
    if (m.index !== last) throw new Error(`Bad token near "${expr.slice(last)}"`);
    tokens.push(m[1]);
    last = m.index + m[0].length;
  }
  if (last !== expr.length) throw new Error(`Trailing junk in "${expr}"`);
  return tokens;
}

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '**': 3 };

function toRpn(tokens: string[]): string[] {
  const out: string[] = [];
  const ops: string[] = [];
  for (const t of tokens) {
    if (/^[A-Za-z_]/.test(t) || /^\d/.test(t)) {
      out.push(t);
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop()!);
      if (ops.pop() !== '(') throw new Error('Mismatched parentheses');
    } else {
      while (
        ops.length &&
        ops[ops.length - 1] !== '(' &&
        (PRECEDENCE[ops[ops.length - 1]] > PRECEDENCE[t] ||
          (PRECEDENCE[ops[ops.length - 1]] === PRECEDENCE[t] && t !== '**'))
      ) {
        out.push(ops.pop()!);
      }
      ops.push(t);
    }
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op === '(' || op === ')') throw new Error('Mismatched parentheses');
    out.push(op);
  }
  return out;
}

function evalRpn(rpn: string[], env: Record<string, number>): number {
  const stack: number[] = [];
  for (const t of rpn) {
    if (/^[A-Za-z_]/.test(t)) {
      if (!(t in env) || !Number.isFinite(env[t])) throw new Error(`Unknown id ${t}`);
      stack.push(env[t]);
    } else if (/^\d/.test(t)) {
      stack.push(Number(t));
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('Stack underflow');
      switch (t) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(b === 0 ? NaN : a / b); break;
        case '**': stack.push(a ** b); break;
        default: throw new Error(`Unknown op ${t}`);
      }
    }
  }
  if (stack.length !== 1) throw new Error('Bad expression');
  return stack[0];
}

export function evalExpr(expr: string, env: Record<string, number>): number {
  return evalRpn(toRpn(tokenize(expr)), env);
}

/** Ids referenced by an expression (variables or prior metrics). */
export function exprDeps(expr: string): string[] {
  return tokenize(expr).filter(t => /^[A-Za-z_]/.test(t));
}

export function parseNum(raw: string | undefined): number {
  if (raw == null || raw.trim() === '') return NaN;
  return parseFloat(raw.replace(/,/g, ''));
}

export function emptyVariableMap(model: CapacityModel): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of model.variables) out[v.id] = '';
  return out;
}

export function computeCapacity(
  model: CapacityModel,
  variableValues: Record<string, string>,
  opts: { fillDefaults?: boolean } = {},
): { env: Record<string, number>; metrics: Record<string, number>; ready: Record<string, boolean> } {
  const env: Record<string, number> = {};
  for (const v of model.variables) {
    const n = parseNum(variableValues[v.id]);
    if (Number.isFinite(n)) env[v.id] = n;
    else if (opts.fillDefaults) env[v.id] = v.default;
  }
  const metrics: Record<string, number> = {};
  const ready: Record<string, boolean> = {};
  for (const m of model.metrics) {
    const deps = exprDeps(m.expr);
    const depsOk = deps.every(id => Number.isFinite(env[id]));
    if (!depsOk) {
      metrics[m.id] = NaN;
      ready[m.id] = false;
      continue;
    }
    try {
      const val = evalExpr(m.expr, env);
      metrics[m.id] = val;
      env[m.id] = val;
      ready[m.id] = Number.isFinite(val);
    } catch {
      metrics[m.id] = NaN;
      ready[m.id] = false;
    }
  }
  return { env, metrics, ready };
}

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const fmt = (v: number, d: number) => {
    const s = v.toFixed(d);
    return s.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  };
  if (abs >= 1e12) return `${sign}${fmt(abs / 1e12, abs >= 1e13 ? 1 : 2)}T`;
  if (abs >= 1e9) return `${sign}${fmt(abs / 1e9, abs >= 1e10 ? 1 : 2)}B`;
  if (abs >= 1e6) return `${sign}${fmt(abs / 1e6, abs >= 1e7 ? 1 : 2)}M`;
  if (abs >= 1e3) return `${sign}${fmt(abs / 1e3, abs >= 1e4 ? 1 : 2)}K`;
  if (abs >= 100) return `${sign}${Math.round(abs)}`;
  if (abs >= 10) return `${sign}${fmt(abs, 1)}`;
  if (abs >= 1) return `${sign}${fmt(abs, 2)}`;
  if (abs === 0) return '0';
  return `${sign}${fmt(abs, 3)}`;
}

export function formatExact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e6) return formatCompact(n);
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  const rounded = Math.abs(n) >= 100 ? n.toFixed(1) : Math.abs(n) >= 10 ? n.toFixed(2) : n.toFixed(3);
  return Number(rounded).toLocaleString('en-US', { maximumFractionDigits: 3 });
}

export function formatMetricValue(n: number, format: CapacityMetric['format']): string {
  if (!Number.isFinite(n)) return '—';
  if (format === 'qps' || format === 'storage') {
    if (Math.abs(n) >= 1000) return formatCompact(n);
    return formatExact(n);
  }
  return formatCompact(n);
}

export function inputVariables(model: CapacityModel): CapacityVariable[] {
  return model.variables.filter(v => v.role === 'input');
}

export function assumptionVariables(model: CapacityModel): CapacityVariable[] {
  return model.variables.filter(v => v.role === 'assumption');
}

export function practiceMetrics(model: CapacityModel): CapacityMetric[] {
  return model.metrics.filter(m => m.practice);
}

export function symbolForPart(
  part: FormulaPart,
  model: CapacityModel,
  lang: 'ar' | 'en',
): string {
  if ('text' in part) return part.text;
  if ('const' in part) return part.const.toLocaleString('en-US');
  if ('ref' in part) {
    const metric = model.metrics.find(m => m.id === part.ref);
    if (metric) return metric.label[lang];
    const v = model.variables.find(x => x.id === part.ref);
    return v ? v.label[lang] : part.ref;
  }
  if ('var' in part) {
    const v = model.variables.find(x => x.id === part.var);
    return v ? v.label[lang] : part.var;
  }
  return '';
}

export function formulaReady(metric: CapacityMetric, env: Record<string, number>): boolean {
  for (const part of metric.display) {
    if ('ref' in part && !Number.isFinite(env[part.ref])) return false;
    if ('var' in part && !Number.isFinite(env[part.var])) return false;
  }
  return exprDeps(metric.expr).every(id => Number.isFinite(env[id]));
}
