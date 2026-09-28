// Bane 4 – lektionskort: frit fald, fortegn, lodret kast og symmetri.

import { h } from '../../core/dom';
import { fmt } from '../../core/numbers';
import { alpha, C } from '../../viz/colors';
import { Plot, type PlotSpec } from '../../viz/plot';
import { simLab, type Widget } from '../../viz/simlab';
import { slider } from '../../ui/widgets';
import type { LessonCard } from '../types';
import { G } from './generators';

const dropLab = () =>
  simLab({
    view: 'tower',
    obj: 'ball',
    tMax: 3.2,
    params: [{ key: 'h', label: 'Starthøjde $h$', unit: 'm', min: 5, max: 50, step: 5, value: 20 }],
    model: (p) => {
      const tEnd = Math.sqrt((2 * p.h) / G);
      return { s: (t) => p.h - 0.5 * G * Math.min(t, tEnd) ** 2, v: (t) => -G * Math.min(t, tEnd), a: () => -G, tEnd };
    },
    graphs: ['s', 'v', 'a'],
    axes: { s: [0, 55], v: [-35, 5], a: [-12, 2] },
    range: [0, 55],
    sym: 'y',
    vectors: { v: true, a: true },
    vectorToggle: true,
    strobe: 0.25,
    vMax: 32,
    aMax: G,
  });

export const throwLab = () =>
  simLab({
    view: 'tower',
    obj: 'ball',
    tMax: 5,
    params: [
      { key: 'v0', label: 'Kastefart opad $v_0$', unit: 'm/s', min: 0, max: 20, step: 1, value: 12 },
      { key: 'y0', label: 'Starthøjde $y_0$', unit: 'm', min: 0, max: 20, step: 5, value: 0 },
    ],
    model: (p) => {
      const tEnd = (p.v0 + Math.sqrt(p.v0 * p.v0 + 2 * G * p.y0)) / G || 0.01;
      return { s: (t) => p.y0 + p.v0 * t - 0.5 * G * t * t, v: (t) => p.v0 - G * t, a: () => -G, tEnd };
    },
    graphs: ['s', 'v', 'a'],
    axes: { s: [0, 42], v: [-30, 22], a: [-12, 2] },
    range: [0, 42],
    sym: 'y',
    vectors: { v: true, a: true },
    vectorToggle: true,
    strobe: 0.2,
    vMax: 28,
    aMax: G,
    extra: (p) => `<span class="q q-muted">toppunkt: ${fmt(p.y0 + (p.v0 * p.v0) / (2 * G), 1)} m efter ${fmt(p.v0 / G, 2)} s</span>`,
  });

function symmetryWidget(): Widget {
  let v0 = 12;
  const spec = (): PlotSpec => {
    const T = (2 * v0) / G;
    const v = (t: number) => (t <= T + 1e-9 ? v0 - G * t : NaN);
    return {
      xLabel: 't (s)', yLabel: 'v (m/s)', xMax: 4.2, xStep: 0.5, yMin: -22, yMax: 22, yStep: 5,
      series: [
        { fn: (t) => Math.max(v(t), 0), color: 'rgba(0,0,0,0)', width: 0.01, fill: alpha(C.s, 0.25) },
        { fn: (t) => Math.min(v(t), 0), color: 'rgba(0,0,0,0)', width: 0.01, fill: alpha(C.a, 0.28) },
        { fn: v, color: C.v },
      ],
      marks: [{ type: 'point', x: v0 / G, y: 0, color: C.ink, label: 'toppunkt: v = 0' }],
    };
  };
  const pl = new Plot(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    pl.setSpec(spec());
    const hm = (v0 * v0) / (2 * G);
    out.innerHTML =
      `<span class="q q-s">areal over aksen = ${fmt(hm, 1)} m (turen op)</span>` +
      `<span class="q q-a">areal under aksen = −${fmt(hm, 1)} m (turen ned)</span>` +
      `<span class="q q-muted">tid op = tid ned = ${fmt(v0 / G, 2)} s</span>`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' }, h('div', { class: 'sim-stage pad' }, pl.el, out), h('div', { class: 'sim-params' }, slider({ label: 'Kastefart $v_0$', min: 4, max: 20, step: 1, value: v0, unit: 'm/s', onInput: (x) => ((v0 = x), upd()) }))),
    destroy: () => pl.destroy(),
  };
}

export const b4Lesson: LessonCard[] = [
  {
    title: 'Alt falder lige hurtigt',
    body: `<p>Slip en sten, og den falder med en konstant acceleration: <b>tyngdeaccelerationen</b></p>
$$g = 9{,}82\\ \\mathrm{m/s^2}\\quad(\\text{i Danmark})$$
<p>Det betyder, at farten vokser med ca. 10 m/s hvert sekund. Og det gælder for <b>alt</b> – tungt og let – når luftmodstanden er lille. Astronauten David Scott tabte en hammer og en fjer på Månen i 1971: de ramte jorden samtidig.</p>
<p>Frit fald er bare konstant acceleration – så alt fra bane 3 virker stadig. Se prikkerne: de sættes hvert kvarte sekund og kommer længere og længere fra hinanden.</p>`,
    widget: dropLab,
    aha: 'v-t-grafen er en ret linje med hældningen −9,82 m/s². Hvert sekund bliver hastigheden 9,82 m/s mere negativ.',
  },
  {
    title: 'Fortegn: vælg opad som positiv',
    body: `<p>Når noget bevæger sig lodret, skal du bestemme, hvilken vej der er positiv. Vælg <b>opad</b>. Så gælder:</p>
<ul><li>På vej op er $v$ positiv, på vej ned er $v$ negativ.</li>
<li>Accelerationen er <b>altid</b> $a = -g = -9{,}82\\ \\mathrm{m/s^2}$ – på vej op, i toppunktet og på vej ned.</li></ul>
<p>Kast bolden op, og se pilene: den <span class="c-v">lilla</span> hastighedspil bliver kortere, vender og vokser nedad. Den <span style="color:#b45309;font-weight:600">orange</span> accelerationspil ændrer sig slet ikke.</p>`,
    widget: throwLab,
    check: {
      q: 'Hvad er accelerationen i toppunktet af et lodret kast? (Opad positiv.)',
      options: [
        { html: '$-9{,}82\\ \\mathrm{m/s^2}$', correct: true, why: 'Tyngden holder ikke pause i toppunktet. Hastigheden er 0 et øjeblik, men den er ved at blive negativ.' },
        { html: '$0$', correct: false, why: 'Hvis $a$ var 0 i toppunktet, ville hastigheden blive ved med at være 0 – bolden ville hænge i luften.' },
        { html: '$+9{,}82\\ \\mathrm{m/s^2}$', correct: false, why: 'Tyngden trækker nedad – så $a$ er negativ, når opad er positiv.' },
      ],
    },
  },
  {
    title: 'Toppunktet og symmetrien',
    body: `<p>I toppunktet er hastigheden 0. Det giver to nyttige formler:</p>
$$t_{\\text{top}} = \\frac{v_0}{g}\\qquad\\qquad h_{\\max} = \\frac{v_0^2}{2g}$$
<p>Turen er <b>symmetrisk</b>: det tager lige så lang tid at falde ned, som at stige op, og bolden lander med samme fart, som den blev kastet med. På v-t-grafen kan du se det: arealet over aksen (vejen op) er lige så stort som arealet under aksen (vejen ned).</p>`,
    widget: symmetryWidget,
  },
  {
    title: 'Din værktøjskasse til lodrette bevægelser',
    body: `<p>Med opad positiv og nulpunktet ved jorden:</p>
<div class="rule"><div>$v = v_0 - g\\cdot t$</div><div>$y = y_0 + v_0 t - \\tfrac12 g t^2$</div><div>$v^2 = v_0^2 - 2g\\,(y - y_0)$</div></div>
<p>Sluppet fra hvile i højden $h$: faldtid $t = \\sqrt{2h/g}$ og slutfart $v = \\sqrt{2gh}$.</p>
<p><b>Hvorfor er accelerationen lige netop $g$?</b> Fordi tyngdekraften $F_t = m\\cdot g$ trækker i genstanden, og $a = F/m = g$. Massen går ud – derfor falder alt lige hurtigt. Det er emnet i næste bane.</p>`,
    check: {
      q: 'En sten slippes fra 20 m. Hvilken formel giver faldtiden direkte?',
      options: [
        { html: '$t = \\sqrt{2h/g}$', correct: true, why: 'Fra $h = \\tfrac12 g t^2$ med $v_0 = 0$.' },
        { html: '$t = h/g$', correct: false, why: 'Enheden bliver s², ikke s. Og ½ mangler.' },
        { html: '$t = v_0/g$', correct: false, why: 'Det er stigetiden i et kast opad – her slippes stenen fra hvile.' },
      ],
    },
  },
];
