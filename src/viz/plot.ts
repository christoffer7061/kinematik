// Let canvas-graf skræddersyet til fysik: live-tegning (reveal), spøgelseskurve,
// areal under grafen, hældningstrekant, tangent og trækbare punkter (til "tegn grafen").

import { C, alpha } from './colors';
import { fmt, niceStep } from '../core/numbers';

export type Fn = (x: number) => number;

export interface Series {
  fn?: Fn;
  pts?: [number, number][];
  color?: string;
  width?: number;
  dash?: number[];
  /** Fyld arealet mellem kurven og y = 0 (med denne farve) */
  fill?: string;
  /** Fyld i stedet ned til denne kurve (fx trekanten oven på et rektangel) */
  fillBase?: Fn;
  /** Tegnes kun op til reveal-tiden; resten vises som svag spøgelseskurve hvis ghost */
  live?: boolean;
  ghost?: boolean;
}

export type Mark =
  | { type: 'slope'; x1: number; x2: number; fn: Fn; color?: string; dxLabel?: string; dyLabel?: string }
  | { type: 'point'; x: number; y: number; color?: string; label?: string }
  | { type: 'tangent'; x: number; fn: Fn; color?: string; half?: number }
  | { type: 'hline'; y: number; color?: string; label?: string };

export interface PlotSpec {
  xLabel: string;
  yLabel: string;
  xMin?: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xStep?: number;
  yStep?: number;
  series: Series[];
  marks?: Mark[];
  height?: number;
  compact?: boolean;
}

function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e9) / 1e9);
  return out;
}
const decOfStep = (step: number) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));

export class Plot {
  readonly el: HTMLDivElement;
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ro: ResizeObserver;
  private w = 0;
  private hh = 0;
  spec: PlotSpec;
  reveal: number | null = null;
  overlay: [number, number][] | null = null;
  private handles: { xs: number[]; ys: number[]; snap: number; active: number; locked: boolean; onChange: (ys: number[]) => void } | null = null;

  constructor(spec: PlotSpec) {
    this.spec = spec;
    this.el = document.createElement('div');
    this.el.className = 'plot' + (spec.compact ? ' compact' : '');
    this.cv = document.createElement('canvas');
    this.el.append(this.cv);
    this.ctx = this.cv.getContext('2d')!;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
  }

  private get pad() {
    return this.spec.compact ? { l: 30, r: 8, t: 18, b: 20 } : { l: 48, r: 14, t: 24, b: 30 };
  }

  setSpec(spec: PlotSpec) {
    const hChanged = spec.height !== this.spec.height;
    this.spec = spec;
    if (hChanged) this.resize();
    else this.draw();
  }
  setReveal(x: number | null) {
    this.reveal = x;
    this.draw();
  }

  resize() {
    const w = this.el.clientWidth;
    if (!w) return;
    const s = this.spec;
    const h = s.height ?? (s.compact ? Math.round(Math.max(110, Math.min(150, w * 0.62))) : Math.round(Math.max(190, Math.min(300, w * 0.6))));
    const dpr = window.devicePixelRatio || 1;
    this.w = w;
    this.hh = h;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    this.cv.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  X(x: number) {
    const { l, r } = this.pad;
    const xMin = this.spec.xMin ?? 0;
    return l + ((x - xMin) / (this.spec.xMax - xMin)) * (this.w - l - r);
  }
  Y(y: number) {
    const { t, b } = this.pad;
    return t + ((this.spec.yMax - y) / (this.spec.yMax - this.spec.yMin)) * (this.hh - t - b);
  }
  invY(py: number) {
    const { t, b } = this.pad;
    return this.spec.yMax - ((py - t) / (this.hh - t - b)) * (this.spec.yMax - this.spec.yMin);
  }

  draw() {
    if (!this.w) return;
    const { ctx, spec: s } = this;
    const { l, r, t, b } = this.pad;
    const W = this.w, H = this.hh;
    const xMin = s.xMin ?? 0;
    const compact = !!s.compact;
    ctx.clearRect(0, 0, W, H);

    const xStep = s.xStep ?? niceStep(s.xMax - xMin, compact ? 4 : Math.max(4, (W - l - r) / 60));
    const yStep = s.yStep ?? niceStep(s.yMax - s.yMin, compact ? 3 : Math.max(3, (H - t - b) / 40));
    const xt = ticks(xMin, s.xMax, xStep);
    const yt = ticks(s.yMin, s.yMax, yStep);

    // gitter
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    for (const x of xt) { const px = Math.round(this.X(x)) + 0.5; ctx.moveTo(px, t); ctx.lineTo(px, H - b); }
    for (const y of yt) { const py = Math.round(this.Y(y)) + 0.5; ctx.moveTo(l, py); ctx.lineTo(W - r, py); }
    ctx.stroke();

    // akser
    const y0 = s.yMin <= 0 && s.yMax >= 0 ? 0 : s.yMin;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(l, Math.round(this.Y(y0)) + 0.5);
    ctx.lineTo(W - r, Math.round(this.Y(y0)) + 0.5);
    ctx.moveTo(Math.round(this.X(xMin)) + 0.5, t);
    ctx.lineTo(Math.round(this.X(xMin)) + 0.5, H - b);
    ctx.stroke();

    // talværdier
    ctx.fillStyle = C.muted;
    ctx.font = `${compact ? 10 : 12}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xd = decOfStep(xStep), yd = decOfStep(yStep);
    const xEvery = compact ? Math.ceil(xt.length / 4) : 1;
    xt.forEach((x, i) => { if (i % xEvery === 0 || compact === false) ctx.fillText(fmt(x, xd), this.X(x), H - b + 5); });
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const y of yt) ctx.fillText(fmt(y, yd), l - 5, this.Y(y));

    // aksetitler
    ctx.fillStyle = C.ink;
    ctx.font = `600 ${compact ? 11 : 13}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(s.yLabel, l - (compact ? 26 : 40), t - 6);
    ctx.textAlign = 'right';
    ctx.fillText(s.xLabel, W - r, this.Y(y0) - 4);

    // indhold klippes til plotområdet
    ctx.save();
    ctx.beginPath();
    ctx.rect(l, t - 2, W - l - r, H - t - b + 4);
    ctx.clip();

    for (const ser of s.series) this.drawSeries(ser);
    if (this.overlay) {
      ctx.setLineDash([7, 5]);
      this.polyline(this.overlay, C.good, 3);
      ctx.setLineDash([]);
    }
    for (const m of s.marks ?? []) this.drawMark(m);
    ctx.restore();

    // markør ved reveal
    if (this.reveal != null) {
      for (const ser of s.series) {
        if (!ser.live) continue;
        const y = this.valueAt(ser, this.reveal);
        if (y == null) continue;
        ctx.fillStyle = ser.color ?? C.s;
        ctx.beginPath();
        ctx.arc(this.X(this.reveal), this.Y(y), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    if (this.handles) this.drawHandles();
  }

  private valueAt(ser: Series, x: number): number | null {
    if (ser.fn) return ser.fn(x);
    const p = ser.pts;
    if (!p || !p.length) return null;
    for (let i = 1; i < p.length; i++) {
      if (x <= p[i][0] + 1e-9) {
        const [x0, y0] = p[i - 1], [x1, y1] = p[i];
        return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return p[p.length - 1][1];
  }

  private samples(ser: Series, from: number, to: number): [number, number][] {
    if (ser.pts) {
      const out: [number, number][] = [];
      for (const pt of ser.pts) if (pt[0] >= from - 1e-9 && pt[0] <= to + 1e-9) out.push(pt);
      const vTo = this.valueAt(ser, to);
      if (vTo != null && (!out.length || out[out.length - 1][0] < to - 1e-9)) out.push([to, vTo]);
      const vFrom = this.valueAt(ser, from);
      if (vFrom != null && (!out.length || out[0][0] > from + 1e-9)) out.unshift([from, vFrom]);
      return out;
    }
    const n = Math.max(2, Math.ceil(((to - from) / (this.spec.xMax - (this.spec.xMin ?? 0))) * this.w / 2));
    const out: [number, number][] = [];
    const span = this.spec.yMax - this.spec.yMin;
    for (let i = 0; i <= n; i++) {
      const x = from + ((to - from) * i) / n;
      let y = ser.fn!(x);
      if (!isFinite(y)) continue;
      y = Math.max(this.spec.yMin - 3 * span, Math.min(this.spec.yMax + 3 * span, y));
      out.push([x, y]);
    }
    return out;
  }

  private polyline(pts: [number, number][], color: string, width: number) {
    const { ctx } = this;
    if (pts.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(this.X(x), this.Y(y)) : ctx.moveTo(this.X(x), this.Y(y))));
    ctx.stroke();
  }

  private drawSeries(ser: Series) {
    const { ctx } = this;
    const xMin = this.spec.xMin ?? 0;
    const color = ser.color ?? C.s;
    const end = ser.live && this.reveal != null ? Math.min(this.reveal, this.spec.xMax) : this.spec.xMax;
    if (ser.ghost) {
      ctx.setLineDash([5, 5]);
      this.polyline(this.samples(ser, xMin, this.spec.xMax), alpha(color, 0.35), 2);
      ctx.setLineDash([]);
    }
    if (end <= xMin) return;
    const pts = this.samples(ser, xMin, end);
    if (ser.fill) {
      const zero = Math.max(this.spec.yMin, Math.min(this.spec.yMax, 0));
      ctx.fillStyle = ser.fill;
      ctx.beginPath();
      const base = ser.fillBase;
      ctx.moveTo(this.X(pts[0][0]), this.Y(base ? base(pts[0][0]) : zero));
      for (const [x, y] of pts) ctx.lineTo(this.X(x), this.Y(y));
      if (base) for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(this.X(pts[i][0]), this.Y(base(pts[i][0])));
      else ctx.lineTo(this.X(pts[pts.length - 1][0]), this.Y(zero));
      ctx.closePath();
      ctx.fill();
    }
    if (ser.dash) ctx.setLineDash(ser.dash);
    this.polyline(pts, color, ser.width ?? (this.spec.compact ? 2.5 : 3));
    ctx.setLineDash([]);
  }

  private label(text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left', base: CanvasTextBaseline = 'middle') {
    const { ctx } = this;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  private drawMark(m: Mark) {
    const { ctx } = this;
    if (m.type === 'slope') {
      const c = m.color ?? C.ink;
      const x1 = this.X(m.x1), x2 = this.X(m.x2), y1 = this.Y(m.fn(m.x1)), y2 = this.Y(m.fn(m.x2));
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (m.dxLabel) this.label(m.dxLabel, (x1 + x2) / 2, y1 + (y2 < y1 ? 12 : -12), c, 'center');
      if (m.dyLabel) this.label(m.dyLabel, x2 + 6, (y1 + y2) / 2, c, 'left');
    } else if (m.type === 'point') {
      const c = m.color ?? C.ink;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(this.X(m.x), this.Y(m.y), 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (m.label) this.label(m.label, this.X(m.x) + 8, this.Y(m.y) - 10, c);
    } else if (m.type === 'tangent') {
      const hsz = m.half ?? (this.spec.xMax - (this.spec.xMin ?? 0)) * 0.18;
      const e = 1e-4;
      const k = (m.fn(m.x + e) - m.fn(m.x - e)) / (2 * e);
      const y = m.fn(m.x);
      ctx.strokeStyle = m.color ?? C.v;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(this.X(m.x - hsz), this.Y(y - k * hsz));
      ctx.lineTo(this.X(m.x + hsz), this.Y(y + k * hsz));
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (m.type === 'hline') {
      ctx.strokeStyle = m.color ?? C.muted;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.pad.l, this.Y(m.y));
      ctx.lineTo(this.w - this.pad.r, this.Y(m.y));
      ctx.stroke();
      ctx.setLineDash([]);
      if (m.label) this.label(m.label, this.w - this.pad.r - 4, this.Y(m.y) - 10, m.color ?? C.muted, 'right');
    }
  }

  // ---------- trækbare punkter ----------
  enableHandles(xs: number[], ys: number[], snap: number, onChange: (ys: number[]) => void) {
    this.handles = { xs, ys: [...ys], snap, active: -1, locked: false, onChange };
    this.cv.style.touchAction = 'none';
    this.el.classList.add('drawable');
    this.cv.addEventListener('pointerdown', this.onDown);
    this.cv.addEventListener('pointermove', this.onMove);
    this.cv.addEventListener('pointerup', this.onUp);
    this.cv.addEventListener('pointercancel', this.onUp);
    this.draw();
  }
  lockHandles() {
    if (!this.handles) return;
    this.handles.locked = true;
    this.handles.active = -1;
    this.el.classList.remove('drawable');
    this.draw();
  }
  private onDown = (e: PointerEvent) => {
    const hd = this.handles;
    if (!hd || hd.locked) return;
    const r = this.cv.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = -1, bd = Infinity;
    hd.xs.forEach((x, i) => {
      const d = Math.abs(this.X(x) - px);
      if (d < bd) { bd = d; best = i; }
    });
    if (bd > 48) return;
    hd.active = best;
    this.cv.setPointerCapture(e.pointerId);
    this.moveTo(e.clientY - r.top);
    e.preventDefault();
  };
  private onMove = (e: PointerEvent) => {
    if (!this.handles || this.handles.active < 0) return;
    this.moveTo(e.clientY - this.cv.getBoundingClientRect().top);
  };
  private onUp = () => {
    if (!this.handles) return;
    this.handles.active = -1;
    this.draw();
  };
  private moveTo(py: number) {
    const hd = this.handles!;
    let y = Math.round(this.invY(py) / hd.snap) * hd.snap;
    y = Math.round(Math.max(this.spec.yMin, Math.min(this.spec.yMax, y)) * 1e9) / 1e9;
    if (hd.ys[hd.active] !== y) {
      hd.ys[hd.active] = y;
      hd.onChange([...hd.ys]);
    }
    this.draw();
  }
  private drawHandles() {
    const { ctx } = this;
    const hd = this.handles!;
    const pts = hd.xs.map((x, i) => [x, hd.ys[i]] as [number, number]);
    this.polyline(pts, C.s, 3.5);
    pts.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc(this.X(x), this.Y(y), hd.active === i ? 12 : 9, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = hd.locked ? C.muted : C.s;
      ctx.stroke();
    });
  }

  destroy() {
    this.ro.disconnect();
  }
}
