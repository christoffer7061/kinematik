// Fælles byggeklodser til opgavegeneratorer: størrelser, formler og graf-specs.

import { niceBound } from '../core/numbers';
import type { Rng } from '../core/rng';
import { C } from '../viz/colors';
import type { PlotSpec } from '../viz/plot';
import type { FormulaOption, Quantity } from './types';

type QKey = 's' | 't' | 'v' | 'v0' | 'a' | 'F' | 'm' | 'h' | 'y';
const QDEF: Record<QKey, Omit<Quantity, 'value'>> = {
  s: { sym: 's', tex: 's', name: 'strækning' },
  t: { sym: 't', tex: 't', name: 'tid' },
  v: { sym: 'v', tex: 'v', name: 'hastighed' },
  v0: { sym: 'v0', tex: 'v_0', name: 'starthastighed' },
  a: { sym: 'a', tex: 'a', name: 'acceleration' },
  F: { sym: 'F', tex: 'F_{\\mathrm{res}}', name: 'resulterende kraft' },
  m: { sym: 'm', tex: 'm', name: 'masse' },
  h: { sym: 'h', tex: 'h', name: 'højde' },
  y: { sym: 'y', tex: 'y', name: 'højde' },
};

/** Størrelse til formelvælgeren. value = TeX-værdien hvis den er givet. */
export function q(key: QKey, value?: string, name?: string): Quantity {
  return { ...QDEF[key], ...(name ? { name } : {}), ...(value !== undefined ? { value } : {}) };
}

const kin = {
  v: 'v = v_0 + a\\cdot t',
  v0: 'v_0 = v - a\\cdot t',
  a: 'a = \\dfrac{v - v_0}{t}',
  t: 't = \\dfrac{v - v_0}{a}',
};

export const F: Record<string, FormulaOption> = {
  vst: { id: 'vst', tex: 'v = \\dfrac{s}{t}', vars: ['v', 's', 't'], solve: { v: 'v = \\dfrac{s}{t}', s: 's = v\\cdot t', t: 't = \\dfrac{s}{v}' } },
  vstWrong1: {
    id: 'vstWrong1',
    tex: 'v = s\\cdot t',
    vars: ['v', 's', 't'],
    wrong: 'Tjek enhederne: $\\mathrm{m}\\cdot\\mathrm{s}$ giver ikke m/s. Hastighed er strækning <b>pr.</b> tid – altså divideret.',
  },
  vstWrong2: {
    id: 'vstWrong2',
    tex: 'v = \\dfrac{t}{s}',
    vars: ['v', 's', 't'],
    wrong: 'Den er vendt om: enheden bliver s/m (sekunder pr. meter). Hastighed er meter pr. sekund.',
  },
  adef: { id: 'adef', tex: 'a = \\dfrac{v - v_0}{t}', vars: ['a', 'v', 'v0', 't'], solve: kin },
  vv0at: { id: 'vv0at', tex: 'v = v_0 + a\\cdot t', vars: ['v', 'v0', 'a', 't'], solve: kin },
  sv0t: {
    id: 'sv0t',
    tex: 's = v_0\\cdot t + \\tfrac12\\, a\\cdot t^2',
    vars: ['s', 'v0', 'a', 't'],
    solve: {
      s: 's = v_0\\cdot t + \\tfrac12\\, a\\cdot t^2',
      a: 'a = \\dfrac{2\\,(s - v_0\\cdot t)}{t^2}',
      v0: 'v_0 = \\dfrac{s - \\frac12 a t^2}{t}',
      t: 't = \\sqrt{\\dfrac{2s}{a}}\\quad(\\text{når } v_0 = 0)',
    },
  },
  v2: {
    id: 'v2',
    tex: 'v^2 = v_0^2 + 2a\\cdot s',
    vars: ['v', 'v0', 'a', 's'],
    solve: {
      v: 'v = \\sqrt{v_0^2 + 2a\\cdot s}',
      v0: 'v_0 = \\sqrt{v^2 - 2a\\cdot s}',
      a: 'a = \\dfrac{v^2 - v_0^2}{2s}',
      s: 's = \\dfrac{v^2 - v_0^2}{2a}',
    },
  },
  savg: {
    id: 'savg',
    tex: 's = \\dfrac{v_0 + v}{2}\\cdot t',
    vars: ['s', 'v0', 'v', 't'],
    solve: { s: 's = \\dfrac{v_0 + v}{2}\\cdot t', t: 't = \\dfrac{2s}{v_0 + v}', v: 'v = \\dfrac{2s}{t} - v_0', v0: 'v_0 = \\dfrac{2s}{t} - v' },
  },
  newton2: {
    id: 'newton2',
    tex: 'F_{\\mathrm{res}} = m\\cdot a',
    vars: ['F', 'm', 'a'],
    solve: { F: 'F_{\\mathrm{res}} = m\\cdot a', m: 'm = \\dfrac{F_{\\mathrm{res}}}{a}', a: 'a = \\dfrac{F_{\\mathrm{res}}}{m}' },
  },
  newton2Wrong: {
    id: 'newton2Wrong',
    tex: 'a = F_{\\mathrm{res}}\\cdot m',
    vars: ['F', 'm', 'a'],
    wrong: 'Tjek med sund fornuft: en tungere genstand ville så få <b>større</b> acceleration af den samme kraft. Det er omvendt – $a = F_{\\mathrm{res}}/m$.',
  },
};

export const formulas = (rng: Rng, ...ids: string[]) => rng.shuffle(ids.map((id) => F[id]));

/** s-t-/v-t-graf ud fra knækpunkter (stykvis lineær) */
export function linePlot(opts: {
  pts: [number, number][];
  xMax: number;
  yLabel: string;
  yMin?: number;
  yMax?: number;
  yStep?: number;
  xStep?: number;
  color?: string;
  compact?: boolean;
  pad?: number;
}): PlotSpec {
  const ys = opts.pts.map((p) => p[1]);
  const step = opts.yStep ?? 10;
  const pad = opts.pad ?? 0;
  return {
    xLabel: 't (s)',
    yLabel: opts.yLabel,
    xMax: opts.xMax,
    xStep: opts.xStep ?? (opts.compact ? undefined : 1),
    yMin: opts.yMin ?? Math.min(0, niceBound(Math.min(...ys) - pad, step, 'down')),
    yMax: opts.yMax ?? Math.max(step, niceBound(Math.max(...ys) + pad, step, 'up')),
    yStep: step,
    series: [{ pts: opts.pts, color: opts.color ?? C.s }],
    compact: opts.compact,
  };
}
