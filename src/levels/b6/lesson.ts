// Bane 6 – lektionskort: skråt kast som to uafhængige bevægelser.

import { h } from '../../core/dom';
import { fmt } from '../../core/numbers';
import { C } from '../../viz/colors';
import { Plot, type PlotSpec } from '../../viz/plot';
import { Player, playerControls } from '../../viz/player';
import { Scene, type MotionSpec } from '../../viz/scene';
import type { Widget } from '../../viz/simlab';
import { decompositionWidget } from '../../ui/vectorWidget';
import { slider } from '../../ui/widgets';
import type { LessonCard } from '../types';

const G = 9.82;
const rad = (d: number) => (d * Math.PI) / 180;

export function projectileLab(preset: { v0?: number; th?: number; h0?: number } = {}): Widget {
  const p = { v0: preset.v0 ?? 18, th: preset.th ?? 45, h0: preset.h0 ?? 0 };
  let showVec = true;
  const model = () => {
    const vx = p.v0 * Math.cos(rad(p.th)), vy0 = p.v0 * Math.sin(rad(p.th));
    const tEnd = Math.max(0.05, (vy0 + Math.sqrt(vy0 * vy0 + 2 * G * p.h0)) / G);
    return { vx, vy0, tEnd, x: (t: number) => vx * t, y: (t: number) => p.h0 + vy0 * t - 0.5 * G * t * t, vy: (t: number) => vy0 - G * t };
  };
  let m = model();
  const player = new Player(m.tEnd);
  const spec = (): MotionSpec => ({
    view: 'field',
    obj: 'ball',
    pos: (t) => [m.x(t), m.y(t)],
    vel: (t) => [m.vx, m.vy(t)],
    acc: () => [0, -G],
    tMax: m.tEnd,
    xRange: [0, 80],
    yRange: [0, 50],
    show: { v: showVec, a: showVec, comps: showVec, path: true, strobe: 0.25, shadows: true },
    vMax: 25,
    aMax: G,
  });
  const scene = new Scene(spec());
  const mk = (y: string, yMin: number, yMax: number, yStep: number) => new Plot({ xLabel: 't (s)', yLabel: y, xMax: 6, yMin, yMax, yStep, series: [] });
  const px = mk('x (m)', 0, 80, 20), py = mk('y (m)', 0, 50, 10), pv = mk('v (m/s)', -30, 30, 10);
  const readouts = h('div', { class: 'readouts' });

  const upd = (t: number) => {
    scene.setTime(t);
    const cut = (f: (t: number) => number) => (tt: number) => (tt > m.tEnd + 1e-9 ? NaN : f(tt));
    px.spec = { ...px.spec, series: [{ fn: cut(m.x), color: C.s, live: true, ghost: true }] };
    py.spec = { ...py.spec, series: [{ fn: cut(m.y), color: C.s, live: true, ghost: true }] };
    pv.spec = { ...pv.spec, series: [{ fn: cut(() => m.vx), color: C.v, live: true, ghost: true, dash: [6, 4] }, { fn: cut(m.vy), color: C.v, live: true, ghost: true }] };
    [px, py, pv].forEach((pl) => pl.setReveal(t));
    readouts.innerHTML =
      `<span class="q q-s"><i>x</i> = ${fmt(m.x(t), 1)} m</span><span class="q q-s"><i>y</i> = ${fmt(m.y(t), 1)} m</span>` +
      `<span class="q q-v"><i>v</i><sub>x</sub> = ${fmt(m.vx, 1)} m/s</span><span class="q q-v"><i>v</i><sub>y</sub> = ${fmt(m.vy(t), 1)} m/s</span>` +
      `<span class="q q-muted">kastevidde ${fmt(m.x(m.tEnd), 1)} m · tophøjde ${fmt(p.h0 + (m.vy0 * m.vy0) / (2 * G), 1)} m</span>`;
  };
  player.on(upd);
  const rebuild = () => {
    m = model();
    player.tMax = m.tEnd;
    scene.setSpec(spec());
    player.restart();
  };
  const el = h('div', { class: 'simlab' },
    h('div', { class: 'sim-stage' }, scene.el, playerControls(player, { speed: true }), readouts),
    h('div', { class: 'sim-params' },
      slider({ label: 'Starthastighed $v_0$', min: 5, max: 25, step: 1, value: p.v0, unit: 'm/s', onInput: (x) => ((p.v0 = x), rebuild()) }),
      slider({ label: 'Vinkel $\\theta$', min: 0, max: 90, step: 5, value: p.th, unit: '°', onInput: (x) => ((p.th = x), rebuild()) }),
      slider({ label: 'Starthøjde $y_0$', min: 0, max: 15, step: 1, value: p.h0, unit: 'm', onInput: (x) => ((p.h0 = x), rebuild()) }),
      h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: true, onchange: (e: Event) => ((showVec = (e.target as HTMLInputElement).checked), scene.setSpec(spec())) }), ' Vis vektorpile')),
    h('div', { class: 'graphs g3' }, px.el, py.el, pv.el),
    h('p', { class: 'muted small graph-note', html: 'På v-t-grafen er den stiplede linje <i>v</i><sub>x</sub> (konstant), og den fuldt optrukne er <i>v</i><sub>y</sub> (falder med 9,82 m/s hvert sekund).' }),
  );
  requestAnimationFrame(() => player.play());
  return { el, destroy: () => (player.destroy(), scene.destroy(), [px, py, pv].forEach((x) => x.destroy())) };
}

function rangeWidget(): Widget {
  let v0 = 20, th = 30;
  const R = (a: number) => (v0 * v0 * Math.sin(rad(2 * a))) / G;
  const spec = (): PlotSpec => ({
    xLabel: 'θ (°)', yLabel: 'kastevidde (m)', xMax: 90, xStep: 15, yMin: 0, yMax: 70, yStep: 10,
    series: [{ fn: R, color: C.s }],
    marks: [
      { type: 'point', x: th, y: R(th), color: C.F, label: `${fmt(th)}°: ${fmt(R(th), 1)} m` },
      ...(Math.abs(90 - th - th) > 1 ? [{ type: 'point' as const, x: 90 - th, y: R(90 - th), color: C.v, label: `${fmt(90 - th)}°` }] : []),
      { type: 'point', x: 45, y: R(45), color: C.ink, label: 'maks' },
    ],
  });
  const pl = new Plot(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    pl.setSpec(spec());
    out.innerHTML = `<span class="q q-F">${fmt(th)}° og ${fmt(90 - th)}° giver samme kastevidde: ${fmt(R(th), 1)} m</span><span class="q q-muted">45° giver ${fmt(R(45), 1)} m</span>`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage pad' }, pl.el, out),
      h('div', { class: 'sim-params' },
        slider({ label: 'Vinkel $\\theta$', min: 0, max: 90, step: 5, value: th, unit: '°', onInput: (x) => ((th = x), upd()) }),
        slider({ label: 'Starthastighed $v_0$', min: 5, max: 25, step: 1, value: v0, unit: 'm/s', onInput: (x) => ((v0 = x), upd()) }))),
    destroy: () => pl.destroy(),
  };
}

export const b6Lesson: LessonCard[] = [
  {
    title: 'To bevægelser i én',
    body: `<p>Et skråt kast ser kompliceret ud – men det er bare to bevægelser, du allerede kender, der sker <b>på samme tid</b>:</p>
<ul><li><b>Vandret (x):</b> ingen kraft ⇒ konstant hastighed. Det er bane 1!</li>
<li><b>Lodret (y):</b> tyngden ⇒ et lodret kast med $a = -g$. Det er bane 4!</li></ul>
<p>Se de to "skygger": skyggen på jorden bevæger sig med konstant fart, mens skyggen på y-aksen laver et helt almindeligt lodret kast. Den lilla pil er hastigheden, og de stiplede pile er dens komposanter $v_x$ og $v_y$.</p>`,
    widget: () => projectileLab(),
    aha: 'Den stiplede $v_x$-pil ændrer sig aldrig. Kun $v_y$ ændrer sig – præcis som i et lodret kast.',
  },
  {
    title: 'Del starthastigheden op',
    body: `<p>Første skridt er altid at dele starthastigheden $v_0$ op i en vandret og en lodret komposant – ligesom med kræfter i bane 5:</p>
$$v_{0x} = v_0\\cdot\\cos\\theta\\qquad\\qquad v_{0y} = v_0\\cdot\\sin\\theta$$
<p>Derefter regner du hver retning for sig.</p>`,
    widget: () => decompositionWidget({ sym: 'v', unit: 'm/s', max: 25, mag: 20, angle: 35, color: C.v, magLabel: 'Starthastighed $v_0$' }),
    aha: 'Ved 45° er de to komposanter lige store. Stejlere kast = mere lodret fart = længere tid i luften.',
  },
  {
    title: 'Tiden er bindeleddet',
    body: `<p>De to retninger er uafhængige – men de deler <b>tiden</b>. Metoden:</p>
<ol class="method"><li>Opdel: $v_{0x} = v_0\\cos\\theta$ og $v_{0y} = v_0\\sin\\theta$.</li>
<li><b>Lodret:</b> find tiden (fx tid i luften $t = \\frac{2v_{0y}}{g}$ på flad grund).</li>
<li><b>Vandret:</b> brug tiden: $x = v_{0x}\\cdot t$.</li></ol>
<div class="example"><b>Eksempel:</b> En bold sparkes med 20 m/s i 30°.<br>
$v_{0x} = 20\\cdot\\cos 30^\\circ = 17{,}3\\ \\mathrm{m/s}$ og $v_{0y} = 20\\cdot\\sin 30^\\circ = 10{,}0\\ \\mathrm{m/s}$<br>
Tid i luften: $t = \\frac{2\\cdot 10{,}0}{9{,}82} = 2{,}04\\ \\mathrm{s}$<br>
Kastevidde: $x = 17{,}3\\ \\mathrm{m/s}\\cdot 2{,}04\\ \\mathrm{s} = 35{,}3\\ \\mathrm{m}$</div>`,
    check: {
      q: 'En bold sparkes skråt op. Hvor stor er farten i toppunktet?',
      options: [
        { html: '$v_0\\cos\\theta$ – den vandrette del', correct: true, why: 'I toppunktet er $v_y = 0$, men $v_x$ er uændret.' },
        { html: '0', correct: false, why: 'Det gælder kun lodrette kast. Her bevæger bolden sig stadig fremad.' },
        { html: '$v_0$', correct: false, why: 'Den lodrette del af hastigheden er væk i toppunktet.' },
      ],
    },
  },
  {
    title: 'Vandret kast: den falder som om den blev sluppet',
    body: `<p>Kastes noget helt vandret ($\\theta = 0^\\circ$), er $v_{0y} = 0$. Lodret er det så et helt almindeligt frit fald – præcis som hvis du bare havde sluppet det. Den vandrette fart ændrer <b>ikke</b> faldtiden.</p>
<p>Prøv: starthøjde 15 m og vinkel 0°. Skift farten – faldtiden ændrer sig ikke, kun hvor langt væk den lander.</p>`,
    widget: () => projectileLab({ v0: 10, th: 0, h0: 15 }),
  },
  {
    title: 'Hvilken vinkel kaster længst?',
    body: `<p>På flad grund (og uden luftmodstand) er kastevidden</p>
$$x_{\\max} = \\frac{v_0^2\\cdot\\sin(2\\theta)}{g}$$
<p>Den er størst ved $45^\\circ$. Og to vinkler, der tilsammen giver 90° (fx 30° og 60°), giver den <b>samme</b> kastevidde – den ene flad og hurtig, den anden høj og langsom.</p>`,
    widget: rangeWidget,
    aha: 'I virkeligheden bremser luftmodstanden, så den bedste vinkel for fx en fodbold er lidt under 45°.',
  },
];
