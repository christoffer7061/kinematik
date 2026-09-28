// Interaktiv opdeling af en vektor i x- og y-komposanter (bruges til kræfter og til skråt kast).

import { h, svg } from '../core/dom';
import { fmt, unitText } from '../core/numbers';
import type { Widget } from '../viz/simlab';
import { arrowPath, label } from '../viz/svgviz';
import { C } from '../viz/colors';
import { slider } from './widgets';

export function decompositionWidget(o: { sym: string; unit: string; max: number; mag: number; angle: number; color?: string; magLabel: string }): Widget {
  let mag = o.mag, th = o.angle;
  const col = o.color ?? C.F;
  const box = h('div');
  const out = h('div', { class: 'readouts' });
  const W = 360, H = 250, ox = 50, oy = 215;
  const render = () => {
    const L = (mag / o.max) * 250;
    const r = (th * Math.PI) / 180;
    const tx = ox + L * Math.cos(r), ty = oy - L * Math.sin(r);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'vec-svg', role: 'img' });
    root.append(
      svg('line', { x1: 20, y1: oy, x2: W - 10, y2: oy, stroke: C.axis, 'stroke-width': 1.5 }),
      svg('line', { x1: ox, y1: oy + 15, x2: ox, y2: 10, stroke: C.axis, 'stroke-width': 1.5 }),
    );
    const arcR = 38;
    if (th > 0) root.append(svg('path', { d: `M${ox + arcR} ${oy} A${arcR} ${arcR} 0 0 0 ${ox + arcR * Math.cos(r)} ${oy - arcR * Math.sin(r)}`, fill: 'none', stroke: C.muted, 'stroke-width': 1.5 }));
    const tt = svg('text', { x: ox + arcR + 8, y: oy - 10, 'font-size': 15, fill: C.muted, 'font-style': 'italic' });
    tt.append(`θ = ${fmt(th)}°`);
    root.append(tt);
    root.append(arrowPath(ox, oy, tx - ox, 0, col, 2.6, true));
    root.append(arrowPath(tx, oy, 0, ty - oy, col, 2.6, true));
    root.append(arrowPath(ox, oy, tx - ox, ty - oy, col, 4));
    root.append(label(`${o.sym}_x`, (ox + tx) / 2, oy + 20, col));
    root.append(label(`${o.sym}_y`, tx + 22, (oy + ty) / 2, col));
    root.append(label(o.sym, (ox + tx) / 2 - 16 * Math.sin(r), (oy + ty) / 2 - 16 * Math.cos(r) - 4, col));
    box.replaceChildren(root);
    const u = unitText(o.unit);
    out.innerHTML =
      `<span class="q q-F"><i>${o.sym}</i><sub>x</sub> = <i>${o.sym}</i>·cos θ = ${fmt(mag * Math.cos(r), 1)} ${u}</span>` +
      `<span class="q q-F"><i>${o.sym}</i><sub>y</sub> = <i>${o.sym}</i>·sin θ = ${fmt(mag * Math.sin(r), 1)} ${u}</span>`;
  };
  render();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage pad' }, box, out),
      h('div', { class: 'sim-params' },
        slider({ label: o.magLabel, min: 0, max: o.max, step: o.max / 40, value: mag, unit: o.unit, onInput: (x) => ((mag = x), render()) }),
        slider({ label: 'Vinkel $\\theta$', min: 0, max: 90, step: 5, value: th, unit: '°', onInput: (x) => ((th = x), render()) }))),
    destroy: () => {},
  };
}
