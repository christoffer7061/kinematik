// SVG-figurer: tallinje med punkter/pile og kraftdiagrammer (frilegemediagrammer).

import { svg } from '../core/dom';
import { C } from './colors';
import { fmt } from '../core/numbers';

export function label(text: string, x: number, y: number, color: string, anchor: 'start' | 'middle' | 'end' = 'middle', size = 18): SVGTextElement {
  const [main, sub] = text.split('_');
  const t = svg('text', { x, y, fill: color, 'text-anchor': anchor, 'dominant-baseline': 'middle', 'font-size': size, 'font-style': 'italic', 'font-weight': 600, 'font-family': '"Times New Roman", Georgia, serif', 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 4 });
  t.append(main);
  if (sub) {
    const ts = svg('tspan', { 'font-size': Math.round(size * 0.7), dy: 5 });
    ts.append(sub);
    t.append(ts);
  }
  return t;
}

export function arrowPath(x: number, y: number, dx: number, dy: number, color: string, width = 3.5, dashed = false): SVGGElement {
  const g = svg('g');
  const len = Math.hypot(dx, dy);
  if (len < 2) return g;
  const ux = dx / len, uy = dy / len;
  const head = Math.min(14, len * 0.5);
  g.append(
    svg('line', { x1: x, y1: y, x2: x + dx - ux * head * 0.8, y2: y + dy - uy * head * 0.8, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', ...(dashed ? { 'stroke-dasharray': '6 5' } : {}) }),
    svg('polygon', {
      points: `${x + dx},${y + dy} ${x + dx - ux * head - uy * head * 0.5},${y + dy - uy * head + ux * head * 0.5} ${x + dx - ux * head + uy * head * 0.5},${y + dy - uy * head - ux * head * 0.5}`,
      fill: color,
    }),
  );
  return g;
}

// ---------- tallinje ----------
export interface NumberLineSpec {
  min: number;
  max: number;
  step: number;
  unit?: string;
  points?: { x: number; label: string; color?: string }[];
  arrows?: { from: number; to: number; label?: string; color?: string; row?: number }[];
}

export function numberLine(s: NumberLineSpec): SVGSVGElement {
  const rows = Math.max(0, ...(s.arrows ?? []).map((a) => (a.row ?? 0) + 1));
  const top = 20 + rows * 30;
  const H = top + 84;
  const W = 600;
  const X = (x: number) => 30 + ((x - s.min) / (s.max - s.min)) * (W - 60);
  const ay = top + 28;
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'numberline', role: 'img' });
  root.append(svg('line', { x1: 14, y1: ay, x2: W - 14, y2: ay, stroke: C.axis, 'stroke-width': 2 }));
  root.append(svg('polygon', { points: `${W - 6},${ay} ${W - 16},${ay - 5} ${W - 16},${ay + 5}`, fill: C.axis }));
  for (let v = s.min; v <= s.max + 1e-9; v += s.step) {
    const zero = Math.abs(v) < 1e-9;
    root.append(svg('line', { x1: X(v), y1: ay - (zero ? 9 : 6), x2: X(v), y2: ay + (zero ? 9 : 6), stroke: zero ? C.ink : C.axis, 'stroke-width': zero ? 2.5 : 1.5 }));
    const t = svg('text', { x: X(v), y: ay + 26, 'text-anchor': 'middle', 'font-size': 15, fill: zero ? C.ink : C.muted, 'font-weight': zero ? 700 : 400 });
    t.append(fmt(v));
    root.append(t);
  }
  const u = svg('text', { x: W - 8, y: ay + 48, 'text-anchor': 'end', 'font-size': 14, fill: C.muted, 'font-weight': 600 });
  u.append(s.unit ?? 's (m)');
  root.append(u);
  for (const a of s.arrows ?? []) {
    const y = top - (a.row ?? 0) * 30 - 4;
    const col = a.color ?? C.s;
    root.append(arrowPath(X(a.from), y, X(a.to) - X(a.from), 0, col, 3.5));
    if (a.label) root.append(label(a.label, (X(a.from) + X(a.to)) / 2, y - 14, col));
  }
  for (const p of s.points ?? []) {
    const col = p.color ?? C.ink;
    root.append(svg('circle', { cx: X(p.x), cy: ay, r: 7, fill: col, stroke: '#fff', 'stroke-width': 2 }));
    const t = svg('text', { x: X(p.x), y: ay - 16, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: col });
    t.append(p.label);
    root.append(t);
  }
  return root;
}

// ---------- kraftdiagram ----------
export interface Force {
  /** Retning i grader: 0 = højre, 90 = op, 180 = venstre, 270 = ned */
  angle: number;
  mag: number;
  label: string;
  color?: string;
  /** Stiplet (fx komposanter) */
  dashed?: boolean;
}
export interface FbdSpec {
  body?: 'box' | 'ball' | 'car' | 'person';
  forces: Force[];
  unit?: string;
  showValues?: boolean;
  ground?: boolean;
  resultant?: { angle: number; mag: number } | null;
  /** Fast skala (N pr. pixel), så flere diagrammer kan sammenlignes */
  maxMag?: number;
}

export function forceDiagram(s: FbdSpec): SVGSVGElement {
  const W = 320, H = 270, cx = 160, cy = 120;
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fbd', role: 'img' });
  const maxMag = s.maxMag ?? Math.max(1, ...s.forces.map((f) => f.mag), s.resultant?.mag ?? 0);
  const L = (m: number) => (m <= 0 ? 0 : Math.max(28, (m / maxMag) * 108));

  if (s.ground) root.append(svg('line', { x1: 40, y1: cy + 24, x2: W - 40, y2: cy + 24, stroke: C.axis, 'stroke-width': 2 }));
  const body = s.body ?? 'box';
  if (body === 'ball') root.append(svg('circle', { cx, cy, r: 20, fill: '#d9ec8f', stroke: '#8aa62a', 'stroke-width': 2 }));
  else if (body === 'car') {
    root.append(svg('rect', { x: cx - 34, y: cy - 12, width: 68, height: 22, rx: 6, fill: '#c9d5e3', stroke: C.obj, 'stroke-width': 2 }));
    root.append(svg('path', { d: `M${cx - 18} ${cy - 12} L${cx - 10} ${cy - 26} L${cx + 12} ${cy - 26} L${cx + 20} ${cy - 12}Z`, fill: '#c9d5e3', stroke: C.obj, 'stroke-width': 2 }));
    root.append(svg('circle', { cx: cx - 20, cy: cy + 14, r: 8, fill: C.obj }), svg('circle', { cx: cx + 20, cy: cy + 14, r: 8, fill: C.obj }));
  } else if (body === 'person') {
    root.append(svg('circle', { cx, cy: cy - 22, r: 9, fill: '#e2e8f0', stroke: C.obj, 'stroke-width': 2 }));
    root.append(svg('path', { d: `M${cx} ${cy - 13} L${cx} ${cy + 10} M${cx - 14} ${cy - 4} L${cx + 14} ${cy - 4} M${cx} ${cy + 10} L${cx - 10} ${cy + 24} M${cx} ${cy + 10} L${cx + 10} ${cy + 24}`, stroke: C.obj, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
  } else root.append(svg('rect', { x: cx - 22, y: cy - 22, width: 44, height: 44, rx: 5, fill: '#e7d3bd', stroke: '#8a6a48', 'stroke-width': 2 }));

  const put = (f: Force, dashed = false, x0 = cx, y0 = cy) => {
    const rad = (f.angle * Math.PI) / 180;
    const len = L(f.mag);
    const dx = Math.cos(rad) * len, dy = -Math.sin(rad) * len;
    const col = f.color ?? C.F;
    root.append(arrowPath(x0, y0, dx, dy, col, dashed ? 3 : 3.8, dashed));
    const ux = Math.cos(rad), uy = -Math.sin(rad);
    const lx = x0 + dx + ux * 20, ly = y0 + dy + uy * 18;
    const anchor = Math.abs(ux) < 0.4 ? 'middle' : ux > 0 ? 'start' : 'end';
    const lbl = label(f.label, Math.abs(ux) < 0.4 ? lx + 16 : lx - ux * 8, ly, col, anchor as 'start', 22);
    root.append(lbl);
    if (s.showValues && f.mag > 0) {
      const t = svg('text', { x: Math.abs(ux) < 0.4 ? lx + 16 : lx - ux * 8, y: ly + 18, 'text-anchor': anchor, 'font-size': 13, fill: col, 'font-weight': 600, 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 4 });
      t.append(`${fmt(f.mag)} ${s.unit ?? 'N'}`);
      root.append(t);
    }
  };
  s.forces.forEach((f) => put(f, f.dashed));
  if (s.resultant && s.resultant.mag > 0) {
    // den resulterende kraft tegnes forskudt, så den ikke dækker de andre pile
    const horiz = Math.abs(Math.cos((s.resultant.angle * Math.PI) / 180)) > 0.7;
    const len = L(s.resultant.mag) * (horiz ? Math.sign(Math.cos((s.resultant.angle * Math.PI) / 180)) : 0);
    put({ ...s.resultant, label: 'F_res', color: C.ink }, true, horiz ? cx - len / 2 : cx + 95, horiz ? cy + 78 : cy);
  }
  root.append(svg('circle', { cx, cy, r: 3.5, fill: C.ink }));
  return root;
}
