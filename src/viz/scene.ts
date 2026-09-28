// Canvas-scene der viser selve bevægelsen: bil på vej, bold i et tårn eller et skråt kast,
// med vektorpile (v, a, F, forskydning) og stroboskop-prikker med fast tidsinterval.

import { C, alpha } from './colors';
import { fmt, niceStep } from '../core/numbers';

export type Vec = [number, number];

export interface MotionSpec {
  view: 'track' | 'tower' | 'field';
  obj: 'car' | 'ball' | 'rocket' | 'box';
  pos: (t: number) => Vec;
  vel: (t: number) => Vec;
  acc?: (t: number) => Vec;
  tMax: number;
  xRange?: [number, number];
  yRange?: [number, number];
  show?: {
    v?: boolean;
    a?: boolean;
    disp?: boolean;
    comps?: boolean;
    path?: boolean;
    /** Masse i kg – vis kraftpil F = m·a */
    F?: number;
    /** Stroboskop: prik hvert `strobe` sekund */
    strobe?: number;
    /** Skråt kast: "skygger" på jorden og på y-aksen (viser at x og y er uafhængige) */
    shadows?: boolean;
  };
  vMax?: number;
  aMax?: number;
  height?: number;
  /** Track: hvor nulpunktet på linealen ligger (verdenskoordinat) */
  rulerOffset?: number;
  points?: { x: number; label: string }[];
  axisLabel?: string;
}

// ---------- tegnehjælpere ----------
export function symText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 17, align: 'left' | 'center' | 'right' = 'left') {
  const [main, sub] = text.split('_');
  ctx.font = `italic 600 ${size}px "Times New Roman", Georgia, serif`;
  const mw = ctx.measureText(main).width;
  ctx.font = `italic 600 ${Math.round(size * 0.7)}px "Times New Roman", Georgia, serif`;
  const sw = sub ? ctx.measureText(sub).width : 0;
  const total = mw + sw;
  let x0 = align === 'left' ? x : align === 'center' ? x - total / 2 : x - total;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.fillStyle = color;
  ctx.font = `italic 600 ${size}px "Times New Roman", Georgia, serif`;
  ctx.strokeText(main, x0, y);
  ctx.fillText(main, x0, y);
  if (sub) {
    ctx.font = `italic 600 ${Math.round(size * 0.7)}px "Times New Roman", Georgia, serif`;
    ctx.strokeText(sub, x0 + mw + 1, y + size * 0.3);
    ctx.fillText(sub, x0 + mw + 1, y + size * 0.3);
  }
}

export function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, width = 3.2, label?: string, dashed = false) {
  const len = Math.hypot(dx, dy);
  if (len < 3) return;
  const ux = dx / len, uy = dy / len;
  const head = Math.min(13, len * 0.55);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx - ux * head * 0.8, y + dy - uy * head * 0.8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - ux * head - uy * head * 0.5, y + dy - uy * head + ux * head * 0.5);
  ctx.lineTo(x + dx - ux * head + uy * head * 0.5, y + dy - uy * head - ux * head * 0.5);
  ctx.closePath();
  ctx.fill();
  if (label) {
    const lx = x + dx + ux * 10, ly = y + dy + uy * 10;
    symText(ctx, label, lx, ly, color, 17, Math.abs(ux) > 0.5 ? (ux > 0 ? 'left' : 'right') : 'center');
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCar(ctx: CanvasRenderingContext2D, cx: number, gy: number, dir: number, wheel: number) {
  ctx.save();
  ctx.translate(cx, gy);
  ctx.scale(dir, 1);
  ctx.fillStyle = C.obj;
  roundRect(ctx, -29, -22, 58, 15, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-17, -21);
  ctx.lineTo(-9, -34);
  ctx.lineTo(9, -34);
  ctx.lineTo(18, -21);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d4ecf3';
  ctx.beginPath();
  ctx.moveTo(-13, -22); ctx.lineTo(-7.5, -31); ctx.lineTo(-1, -31); ctx.lineTo(-1, -22); ctx.closePath();
  ctx.moveTo(1.5, -22); ctx.lineTo(1.5, -31); ctx.lineTo(7.5, -31); ctx.lineTo(13.5, -22); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(25, -19, 4, 4);
  for (const wx of [-17, 17]) {
    ctx.fillStyle = '#1b1f24';
    ctx.beginPath();
    ctx.arc(wx, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b9c2cc';
    ctx.beginPath();
    ctx.arc(wx, -6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b9c2cc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wx, -6);
    ctx.lineTo(wx + 6 * Math.cos(wheel), -6 + 6 * Math.sin(wheel));
    ctx.stroke();
  }
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r = 12) {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.2, cx, cy, r);
  g.addColorStop(0, '#e6f59a');
  g.addColorStop(1, '#9dbb2c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx - r * 1.1, cy, r * 0.9, -0.7, 0.7);
  ctx.stroke();
}

function drawRocket(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, thrust: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  if (thrust) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    const f = 12 + Math.random() * 7;
    ctx.moveTo(-20, -5); ctx.lineTo(-20 - f, 0); ctx.lineTo(-20, 5); ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#e2e8f0';
  roundRect(ctx, -20, -7, 32, 14, 4);
  ctx.fill();
  ctx.strokeStyle = C.obj;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(12, -7); ctx.lineTo(24, 0); ctx.lineTo(12, 7); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-20, -7); ctx.lineTo(-26, -13); ctx.lineTo(-13, -7); ctx.closePath();
  ctx.moveTo(-20, 7); ctx.lineTo(-26, 13); ctx.lineTo(-13, 7); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.arc(2, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBox(ctx: CanvasRenderingContext2D, cx: number, gy: number) {
  ctx.fillStyle = '#c8a27a';
  roundRect(ctx, cx - 20, gy - 38, 40, 38, 4);
  ctx.fill();
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  symText(ctx, 'm', cx, gy - 19, '#4a3826', 17, 'center');
}

// ---------- scenen ----------
export class Scene {
  readonly el: HTMLDivElement;
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ro: ResizeObserver;
  private w = 0;
  private hh = 0;
  private dir = 1;
  spec: MotionSpec;
  t = 0;
  private vMax = 1;
  private aMax = 1;

  constructor(spec: MotionSpec) {
    this.spec = spec;
    this.el = document.createElement('div');
    this.el.className = 'scene';
    this.cv = document.createElement('canvas');
    this.el.append(this.cv);
    this.ctx = this.cv.getContext('2d')!;
    this.scales();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
  }

  setSpec(spec: MotionSpec) {
    const rows = (s: MotionSpec) => [s.show?.v, s.show?.a, s.show?.F].filter(Boolean).length;
    const hChanged = spec.height !== this.spec.height || spec.view !== this.spec.view || rows(spec) !== rows(this.spec);
    this.spec = spec;
    this.scales();
    if (hChanged) this.resize();
    else this.draw();
  }
  setTime(t: number) {
    this.t = t;
    this.draw();
  }

  private scales() {
    const s = this.spec;
    let vm = 0, am = 0;
    for (let i = 0; i <= 80; i++) {
      const t = (s.tMax * i) / 80;
      const v = s.vel(t);
      vm = Math.max(vm, Math.hypot(v[0], v[1]));
      if (s.acc) {
        const a = s.acc(t);
        am = Math.max(am, Math.hypot(a[0], a[1]));
      }
    }
    this.vMax = s.vMax ?? Math.max(vm, 1);
    this.aMax = s.aMax ?? Math.max(am, 0.5);
  }

  private resize() {
    const w = this.el.clientWidth;
    if (!w) return;
    const s = this.spec;
    const h =
      s.height ??
      (s.view === 'track' ? 118 + 24 * [s.show?.v, s.show?.a, s.show?.F].filter(Boolean).length : s.view === 'tower' ? Math.round(Math.max(300, Math.min(380, w * 0.8))) : Math.round(Math.max(230, Math.min(380, w * 0.55))));
    const dpr = window.devicePixelRatio || 1;
    this.w = w;
    this.hh = h;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    this.cv.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  draw() {
    if (!this.w) return;
    this.ctx.clearRect(0, 0, this.w, this.hh);
    if (this.spec.view === 'track') this.drawTrack();
    else if (this.spec.view === 'tower') this.drawTower();
    else this.drawField();
  }

  private curDir() {
    const v = this.spec.vel(this.t)[this.spec.view === 'tower' ? 1 : 0];
    if (Math.abs(v) > 1e-6) this.dir = Math.sign(v);
    return this.dir;
  }

  // ---- vandret vej ----
  private drawTrack() {
    const { ctx, spec: s } = this;
    const W = this.w, H = this.hh;
    const [x0, x1] = s.xRange ?? [0, 100];
    const m = 34;
    const X = (x: number) => m + ((x - x0) / (x1 - x0)) * (W - 2 * m);
    const gy = H - 62;

    // vej
    ctx.fillStyle = '#e9edf1';
    ctx.fillRect(0, gy, W, 12);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, gy + 6);
    ctx.lineTo(W, gy + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // lineal
    const off = s.rulerOffset ?? 0;
    const step = niceStep(x1 - x0, Math.max(4, (W - 2 * m) / 70));
    ctx.strokeStyle = C.axis;
    ctx.fillStyle = C.muted;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(m - 10, gy + 14.5);
    ctx.lineTo(W - m + 10, gy + 14.5);
    ctx.stroke();
    for (let v = Math.ceil((x0 - off) / step) * step; v + off <= x1 + 1e-9; v += step) {
      const px = Math.round(X(v + off)) + 0.5;
      const isZero = Math.abs(v) < 1e-9;
      ctx.strokeStyle = isZero ? C.ink : C.axis;
      ctx.lineWidth = isZero ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(px, gy + 14);
      ctx.lineTo(px, gy + (isZero ? 24 : 20));
      ctx.stroke();
      ctx.fillStyle = isZero ? C.ink : C.muted;
      ctx.font = `${isZero ? '700 ' : ''}12px system-ui, sans-serif`;
      ctx.fillText(fmt(v), px, gy + 25);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = C.muted;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(s.axisLabel ?? 's (m)', W - 4, gy + 40);

    for (const p of s.points ?? []) {
      const px = X(p.x);
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(px, gy + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(p.label, px, gy - 4);
    }

    const t = this.t;
    const [x] = s.pos(t);
    const sh = s.show ?? {};

    if (sh.strobe) {
      ctx.fillStyle = alpha(C.s, 0.55);
      for (let k = 0; k * sh.strobe <= t + 1e-9; k++) {
        const px = X(s.pos(k * sh.strobe)[0]);
        ctx.beginPath();
        ctx.arc(px, gy + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (sh.disp) {
      const xs = s.pos(0)[0];
      ctx.strokeStyle = alpha(C.s, 0.5);
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(X(xs), gy - 40);
      ctx.lineTo(X(xs), gy + 12);
      ctx.stroke();
      ctx.setLineDash([]);
      arrow(ctx, X(xs), gy + 52, X(x) - X(xs), 0, C.s, 3, 'Δs');
    }

    const dir = this.curDir();
    if (s.obj === 'car') drawCar(ctx, X(x), gy, dir, (X(x) / 7) * dir);
    else if (s.obj === 'box') drawBox(ctx, X(x), gy);
    else if (s.obj === 'rocket') {
      const a = s.acc?.(t)[0] ?? 0;
      drawRocket(ctx, X(x), gy - 14, dir < 0 ? Math.PI : 0, a * dir > 0.01);
    } else drawBall(ctx, X(x), gy - 12);

    const pxPerV = (0.26 * W) / this.vMax;
    const pxPerA = (0.18 * W) / this.aMax;
    const [vx] = s.vel(t);
    const cx = X(x);
    let row = 0;
    if (sh.v) arrow(ctx, cx, gy - 46 - 24 * row++, vx * pxPerV, 0, C.v, 3.2, 'v');
    if (sh.a && s.acc) arrow(ctx, cx, gy - 46 - 24 * row++, s.acc(t)[0] * pxPerA, 0, C.a, 3.2, 'a');
    if (sh.F && s.acc) arrow(ctx, cx, gy - 46 - 24 * row++, s.acc(t)[0] * pxPerA, 0, C.F, 4, 'F_res');
  }

  // ---- lodret (tårn) ----
  private drawTower() {
    const { ctx, spec: s } = this;
    const W = this.w, H = this.hh;
    const [y0, y1] = s.yRange ?? [0, 50];
    const mt = 22, mb = 30;
    const Y = (y: number) => H - mb - ((y - y0) / (y1 - y0)) * (H - mt - mb);
    const rx = 52;

    // jord
    if (y0 <= 0 && y1 >= 0) {
      ctx.fillStyle = '#e9edf1';
      ctx.fillRect(0, Y(0), W, H - Y(0));
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Y(0));
      ctx.lineTo(W, Y(0));
      ctx.stroke();
    }

    // lineal
    const step = niceStep(y1 - y0, (H - mt - mb) / 42);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 0.5, Y(y0));
    ctx.lineTo(rx + 0.5, Y(y1));
    ctx.stroke();
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) {
      const py = Math.round(Y(v)) + 0.5;
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(rx - 5, py);
      ctx.lineTo(rx + 5, py);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText(fmt(v), rx - 8, py);
    }
    ctx.fillStyle = C.ink;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(s.axisLabel ?? 'y (m)', 6, 4);

    const t = this.t;
    const sh = s.show ?? {};
    const cx = Math.max(rx + 70, W * 0.42);
    if (sh.strobe) {
      ctx.fillStyle = alpha(C.s, 0.5);
      for (let k = 0; k * sh.strobe <= t + 1e-9; k++) {
        ctx.beginPath();
        ctx.arc(cx - 34, Y(s.pos(k * sh.strobe)[1]), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const [, y] = s.pos(t);
    const cy = Y(y);
    if (s.obj === 'rocket') {
      const a = s.acc?.(t)[1] ?? 0;
      drawRocket(ctx, cx, cy - 14, -Math.PI / 2, a > -9);
    } else drawBall(ctx, cx, cy - 12);

    const pxPerV = (0.3 * (H - mt - mb)) / this.vMax;
    const pxPerA = (0.16 * (H - mt - mb)) / this.aMax;
    const [, vy] = s.vel(t);
    if (sh.v) arrow(ctx, cx + 30, cy - 12, 0, -vy * pxPerV, C.v, 3.2, 'v');
    if (sh.a && s.acc) arrow(ctx, cx + 64, cy - 12, 0, -s.acc(t)[1] * pxPerA, C.a, 3.2, 'a');
    if (sh.F && s.acc) arrow(ctx, cx + 98, cy - 12, 0, -s.acc(t)[1] * pxPerA, C.F, 4, 'F_res');
  }

  // ---- skråt kast ----
  private drawField() {
    const { ctx, spec: s } = this;
    const W = this.w, H = this.hh;
    const [x0, x1] = s.xRange ?? [0, 50];
    const [y0, y1] = s.yRange ?? [0, 20];
    const ml = 40, mr = 16, mt = 28, mb = 34;
    const k = Math.min((W - ml - mr) / (x1 - x0), (H - mt - mb) / (y1 - y0));
    const X = (x: number) => ml + (x - x0) * k;
    const Y = (y: number) => H - mb - (y - y0) * k;

    ctx.fillStyle = '#eef5e9';
    ctx.fillRect(0, Y(0), W, H - Y(0));
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, Y(0));
    ctx.lineTo(W, Y(0));
    ctx.stroke();

    const step = niceStep(x1 - x0, (W - ml - mr) / 70);
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = C.muted;
    for (let v = Math.ceil(x0 / step) * step; X(v) <= W - mr + 1; v += step) {
      ctx.fillText(fmt(v), X(v), Y(0) + 6);
    }
    const ystep = niceStep(y1 - y0, (H - mt - mb) / 40);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let v = Math.max(ystep, Math.ceil(y0 / ystep) * ystep); Y(v) >= mt - 1; v += ystep) {
      ctx.beginPath();
      ctx.moveTo(ml, Y(v));
      ctx.lineTo(W - mr, Y(v));
      ctx.stroke();
      ctx.fillText(fmt(v), ml - 6, Y(v));
    }
    ctx.fillStyle = C.ink;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x (m)', W - 4, H - 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('y (m)', 4, 2);

    const sh = s.show ?? {};
    const t = this.t;
    if (sh.path) {
      ctx.strokeStyle = alpha(C.s, 0.35);
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const [px, py] = s.pos((s.tMax * i) / 120);
        if (i) ctx.lineTo(X(px), Y(py));
        else ctx.moveTo(X(px), Y(py));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (sh.strobe) {
      ctx.fillStyle = alpha(C.s, 0.55);
      for (let i = 0; i * sh.strobe <= t + 1e-9; i++) {
        const [px, py] = s.pos(i * sh.strobe);
        ctx.beginPath();
        ctx.arc(X(px), Y(py), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const [x, y] = s.pos(t);
    const cx = X(x), cy = Y(y);
    if (sh.shadows) {
      ctx.fillStyle = alpha(C.s, 0.4);
      ctx.beginPath();
      ctx.arc(cx, Y(0) - 1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ml + 1, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = alpha(C.s, 0.25);
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, Y(0));
      ctx.moveTo(cx, cy);
      ctx.lineTo(ml, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawBall(ctx, cx, cy, 10);
    const pxPerV = (0.22 * Math.min(W, 520)) / this.vMax;
    const [vx, vy] = s.vel(t);
    if (sh.comps) {
      arrow(ctx, cx, cy, vx * pxPerV, 0, alpha(C.v, 0.75), 2.4, 'v_x', true);
      arrow(ctx, cx, cy, 0, -vy * pxPerV, alpha(C.v, 0.75), 2.4, 'v_y', true);
    }
    if (sh.v) arrow(ctx, cx, cy, vx * pxPerV, -vy * pxPerV, C.v, 3.2, 'v');
    if (sh.a && s.acc) {
      const [ax, ay] = s.acc(t);
      const pxPerA = (0.1 * Math.min(W, 520)) / this.aMax;
      // lidt til siden, så den ikke dækker v_y-komposanten
      arrow(ctx, cx + (sh.comps ? 18 : 0), cy + 6, ax * pxPerA, -ay * pxPerA, C.a, 3, 'a');
    }
  }

  destroy() {
    this.ro.disconnect();
  }
}
