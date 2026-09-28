// "Simulator": bevægelse + live s-t, v-t og a-t grafer + sliders.
// Graferne har faste akser, så eleven kan se hvordan formen ændrer sig, når en slider flyttes.

import { h } from '../core/dom';
import { fmt, unitText } from '../core/numbers';
import { rich } from '../core/tex';
import { C, alpha } from './colors';
import { Plot, type Fn, type Mark } from './plot';
import { Player, playerControls } from './player';
import { Scene, type MotionSpec } from './scene';

export interface Param {
  key: string;
  label: string; // TeX
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
}
export interface Motion1D {
  s: Fn;
  v: Fn;
  a: Fn;
  /** Tidspunkt hvor bevægelsen stopper (fx bolden rammer jorden) */
  tEnd?: number;
}
export type Readout = 's' | 'v' | 'fart' | 'a' | 'dist' | 'disp';
export interface SimLabConfig {
  view: 'track' | 'tower';
  obj: MotionSpec['obj'];
  tMax: number;
  params: Param[];
  model: (p: Record<string, number>) => Motion1D;
  graphs: ('s' | 'v' | 'a')[];
  axes: { s?: [number, number]; v?: [number, number]; a?: [number, number] };
  range: [number, number];
  vectors?: { v?: boolean; a?: boolean; disp?: boolean; massKey?: string };
  vectorToggle?: boolean;
  strobe?: number;
  area?: boolean;
  slope?: boolean;
  readouts?: Readout[];
  extra?: (p: Record<string, number>, t: number, m: Motion1D) => string;
  sym?: string;
  vMax?: number;
  aMax?: number;
  autoplay?: boolean;
  /** Ekstra element ved siden af scenen (fx et live kraftdiagram) */
  aside?: HTMLElement;
  /** Kaldes når sliderne ændres (og ved start) */
  onParams?: (p: Record<string, number>) => void;
}

export interface Widget {
  el: HTMLElement;
  destroy(): void;
}

const qspan = (cls: string, sym: string, val: string) => `<span class="q q-${cls}"><i>${sym}</i> = ${val}</span>`;

export function simLab(cfg: SimLabConfig): Widget {
  const p: Record<string, number> = Object.fromEntries(cfg.params.map((q) => [q.key, q.value]));
  const sym = cfg.sym ?? 's';
  let m = cfg.model(p);
  let showVec = true;
  const player = new Player(Math.min(cfg.tMax, m.tEnd ?? cfg.tMax));

  const spec = (): MotionSpec => {
    const one = (f: Fn) => (t: number): [number, number] => (cfg.view === 'track' ? [f(t), 0] : [0, f(t)]);
    return {
      view: cfg.view,
      obj: cfg.obj,
      pos: one(m.s),
      vel: one(m.v),
      acc: one(m.a),
      tMax: player.tMax,
      xRange: cfg.view === 'track' ? cfg.range : undefined,
      yRange: cfg.view === 'tower' ? cfg.range : undefined,
      axisLabel: `${sym} (m)`,
      vMax: cfg.vMax,
      aMax: cfg.aMax,
      // fast højde, så scenen ikke hopper når vektorpilene slås til/fra
      height: cfg.view === 'track' ? 118 + 24 * [cfg.vectors?.v, cfg.vectors?.a, cfg.vectors?.massKey].filter(Boolean).length : undefined,
      show: {
        v: showVec && cfg.vectors?.v,
        a: showVec && cfg.vectors?.a,
        disp: cfg.vectors?.disp,
        F: showVec && cfg.vectors?.massKey ? p[cfg.vectors.massKey] : undefined,
        strobe: cfg.strobe,
      },
    };
  };
  const scene = new Scene(spec());

  const plotDefs = {
    s: { y: `${sym} (m)`, color: C.s, fn: () => m.s },
    v: { y: 'v (m/s)', color: C.v, fn: () => m.v },
    a: { y: 'a (m/s²)', color: C.a, fn: () => m.a },
  } as const;
  const plots = cfg.graphs.map((k) => {
    const d = plotDefs[k];
    const [yMin, yMax] = cfg.axes[k] ?? [-10, 10];
    const pl = new Plot({ xLabel: 't (s)', yLabel: d.y, xMax: cfg.tMax, yMin, yMax, series: [] });
    return { k, pl, d, yMin, yMax };
  });
  const updatePlots = () => {
    for (const { k, pl, d, yMin, yMax } of plots) {
      const fn = d.fn();
      const tEnd = player.tMax;
      const clipped: Fn = (t) => fn(Math.min(t, tEnd));
      const marks: Mark[] = [];
      if (k === 's' && cfg.slope) marks.push({ type: 'tangent', x: player.t, fn: clipped, color: C.v });
      pl.spec = {
        xLabel: 't (s)',
        yLabel: d.y,
        xMax: cfg.tMax,
        yMin,
        yMax,
        series: [{ fn: (t) => (t > tEnd + 1e-9 ? NaN : fn(t)), color: d.color, live: true, ghost: true, fill: k === 'v' && cfg.area ? alpha(C.v, 0.16) : undefined }],
        marks,
      };
      pl.setReveal(player.t);
    }
  };

  const readoutEl = h('div', { class: 'readouts' });
  const dist = (t: number) => {
    let acc = 0;
    const n = 200;
    for (let i = 0; i < n; i++) acc += Math.abs(m.v(((i + 0.5) * t) / n)) * (t / n);
    return acc;
  };
  const updateReadouts = (t: number) => {
    const ro = cfg.readouts ?? ['s', 'v', 'a'];
    const parts: string[] = [];
    for (const r of ro) {
      if (r === 's') parts.push(qspan('s', sym, `${fmt(m.s(t), 1)} m`));
      if (r === 'v') parts.push(qspan('v', 'v', `${fmt(m.v(t), 1)} m/s`));
      if (r === 'fart') parts.push(`<span class="q q-v">fart = ${fmt(Math.abs(m.v(t)), 1)} m/s</span>`);
      if (r === 'a') parts.push(qspan('a', 'a', `${fmt(m.a(t), 2)} m/s²`));
      if (r === 'dist') parts.push(`<span class="q q-muted">strækning = ${fmt(dist(t), 1)} m</span>`);
      if (r === 'disp') parts.push(qspan('s', 'Δs', `${fmt(m.s(t) - m.s(0), 1)} m`));
    }
    if (cfg.extra) parts.push(cfg.extra(p, t, m));
    readoutEl.innerHTML = parts.join('');
  };

  player.on((t) => {
    scene.setTime(t);
    updatePlots();
    updateReadouts(t);
  });

  const rebuild = () => {
    cfg.onParams?.(p);
    m = cfg.model(p);
    player.tMax = Math.min(cfg.tMax, m.tEnd ?? cfg.tMax);
    scene.setSpec(spec());
    player.restart();
  };

  const sliders = cfg.params.map((q) => {
    const out = h('output', { class: 'val' });
    const setOut = () => (out.textContent = `${fmt(p[q.key])} ${unitText(q.unit)}`.trim());
    setOut();
    const input = h('input', { type: 'range', min: q.min, max: q.max, step: q.step, value: q.value, 'aria-label': q.key }) as HTMLInputElement;
    input.addEventListener('input', () => {
      p[q.key] = Number(input.value);
      setOut();
      rebuild();
    });
    return h('label', { class: 'slider' }, h('span', { class: 'lbl', html: rich(q.label) }), input, out);
  });

  const toggle = cfg.vectorToggle
    ? h('label', { class: 'toggle' },
        h('input', {
          type: 'checkbox',
          checked: true,
          onchange: (e: Event) => {
            showVec = (e.target as HTMLInputElement).checked;
            scene.setSpec(spec());
          },
        }),
        ' Vis vektorpile')
    : null;

  cfg.onParams?.(p);
  const el = h('div', { class: 'simlab' },
    h('div', { class: 'sim-stage' + (cfg.aside ? ' with-aside' : '') },
      h('div', { class: 'sim-main' }, scene.el, playerControls(player, { speed: true }), readoutEl),
      cfg.aside ? h('div', { class: 'sim-aside' }, cfg.aside) : null),
    sliders.length || toggle ? h('div', { class: 'sim-params' }, sliders, toggle) : null,
    plots.length ? h('div', { class: 'graphs g' + plots.length }, plots.map(({ pl }) => pl.el)) : null,
  );

  if (cfg.autoplay !== false) requestAnimationFrame(() => player.play());

  return {
    el,
    destroy() {
      player.destroy();
      scene.destroy();
      plots.forEach(({ pl }) => pl.destroy());
    },
  };
}
