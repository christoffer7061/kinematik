// Bane 2 – lektionskort: acceleration, fortegn, v-t-grafens hældning og areal.

import { h } from '../../core/dom';
import { fmt } from '../../core/numbers';
import { alpha, C } from '../../viz/colors';
import { Plot, type PlotSpec } from '../../viz/plot';
import { simLab, type Widget } from '../../viz/simlab';
import { slider } from '../../ui/widgets';
import type { LessonCard } from '../types';

export const accLab = () =>
  simLab({
    view: 'track',
    obj: 'car',
    tMax: 8,
    params: [
      { key: 'v0', label: 'Starthastighed $v_0$', unit: 'm/s', min: 0, max: 12, step: 1, value: 2 },
      { key: 'a', label: 'Acceleration $a$', unit: 'm/s^2', min: -2, max: 3, step: 0.5, value: 2 },
    ],
    model: (p) => ({ s: (t) => p.v0 * t + 0.5 * p.a * t * t, v: (t) => p.v0 + p.a * t, a: () => p.a }),
    graphs: ['s', 'v', 'a'],
    axes: { s: [-70, 200], v: [-20, 40], a: [-4, 4] },
    range: [-70, 200],
    vectors: { v: true, a: true },
    vectorToggle: true,
    strobe: 1,
    slope: true,
    vMax: 36,
    aMax: 3,
  });

const brakeLab = () =>
  simLab({
    view: 'track',
    obj: 'car',
    tMax: 8,
    params: [
      { key: 'v0', label: 'Fart før opbremsning $v_0$', unit: 'm/s', min: 6, max: 24, step: 2, value: 16 },
      { key: 'a', label: 'Acceleration $a$', unit: 'm/s^2', min: -8, max: -1, step: 0.5, value: -4 },
    ],
    model: (p) => {
      const ts = -p.v0 / p.a;
      const sStop = p.v0 * ts + 0.5 * p.a * ts * ts;
      return {
        s: (t) => (t < ts ? p.v0 * t + 0.5 * p.a * t * t : sStop),
        v: (t) => (t < ts ? p.v0 + p.a * t : 0),
        a: (t) => (t < ts ? p.a : 0),
      };
    },
    graphs: ['v', 'a'],
    axes: { v: [0, 26], a: [-9, 2] },
    range: [0, 150],
    vectors: { v: true, a: true },
    readouts: ['v', 'a', 's'],
    extra: (p) => `<span class="q q-muted">bremselængde = ${fmt(-(p.v0 * p.v0) / (2 * p.a), 1)} m</span>`,
    vMax: 24,
    aMax: 8,
  });

function vtSlopeWidget(): Widget {
  let a = 1.5;
  const v0 = 4;
  const spec = (): PlotSpec => {
    const fn = (t: number) => v0 + a * t;
    return {
      xLabel: 't (s)', yLabel: 'v (m/s)', xMax: 8, xStep: 1, yMin: -12, yMax: 20, yStep: 4,
      series: [{ fn, color: C.v }],
      marks: [{ type: 'slope', x1: 2, x2: 6, fn, color: C.ink, dxLabel: 'Δt = 4 s', dyLabel: `Δv = ${fmt(4 * a)} m/s` }],
    };
  };
  const pl = new Plot(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    pl.setSpec(spec());
    out.innerHTML = `<span class="q q-a">hældning = Δv / Δt = ${fmt(4 * a)} m/s / 4 s = <b>${fmt(a)} m/s²</b></span>`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' }, h('div', { class: 'sim-stage pad' }, pl.el, out), h('div', { class: 'sim-params' }, slider({ label: 'Acceleration $a$', min: -3, max: 3, step: 0.5, value: a, unit: 'm/s^2', onInput: (x) => ((a = x), upd()) }))),
    destroy: () => pl.destroy(),
  };
}

export function areaSplitWidget(): Widget {
  let v0 = 4, a = 2, t = 5;
  const spec = (): PlotSpec => ({
    xLabel: 't (s)', yLabel: 'v (m/s)', xMax: 8, xStep: 1, yMin: 0, yMax: 30, yStep: 5,
    series: [
      { fn: () => v0, color: alpha(C.s, 0.6), width: 1.5, dash: [4, 4], live: true, fill: alpha(C.s, 0.22) },
      { fn: (x) => v0 + a * x, color: C.v, live: true, ghost: true, fill: alpha(C.a, 0.32), fillBase: () => v0 },
    ],
  });
  const pl = new Plot(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    pl.spec = spec();
    pl.setReveal(t);
    const rect = v0 * t, tri = 0.5 * a * t * t;
    out.innerHTML =
      `<span class="q q-s">rektangel: v₀·t = ${fmt(rect, 1)} m</span>` +
      `<span class="q q-a">trekant: ½·a·t² = ${fmt(tri, 1)} m</span>` +
      `<span class="q q-muted"><b>s = ${fmt(rect + tri, 1)} m</b></span>`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage pad' }, pl.el, out),
      h('div', { class: 'sim-params' },
        slider({ label: 'Starthastighed $v_0$', min: 0, max: 10, step: 1, value: v0, unit: 'm/s', onInput: (x) => ((v0 = x), upd()) }),
        slider({ label: 'Acceleration $a$', min: 0, max: 3, step: 0.5, value: a, unit: 'm/s^2', onInput: (x) => ((a = x), upd()) }),
        slider({ label: 'Tid $t$', min: 0, max: 8, step: 0.5, value: t, unit: 's', onInput: (x) => ((t = x), upd()) }))),
    destroy: () => pl.destroy(),
  };
}

export const b2Lesson: LessonCard[] = [
  {
    title: 'Hvad er acceleration?',
    body: `<p>Du kører ud på motorvejen. På tilkørselsrampen træder du speederen ned, og speedometret stiger: 50 … 60 … 70 km/t. <b>Acceleration</b> er, hvor hurtigt hastigheden ændrer sig:</p>
$$a = \\frac{\\Delta v}{\\Delta t} = \\frac{v - v_0}{t}$$
<p>Enheden er m/s² – læs det som "m/s <b>pr. sekund</b>". Med $a = 2\\ \\mathrm{m/s^2}$ vokser hastigheden 2 m/s hvert sekund: 0, 2, 4, 6, 8 m/s …</p>
<p>Se prikkerne på vejen: de sættes hvert sekund, og nu bliver afstanden mellem dem <b>større og større</b>. Den stiplede tangent på s-t-grafen viser hastigheden lige nu.</p>`,
    widget: accLab,
    aha: 'Den <span class="c-v">lilla</span> pil er hastigheden, den <span style="color:#b45309;font-weight:600">orange</span> er accelerationen. Når de peger samme vej, stiger farten.',
  },
  {
    title: 'Opbremsning: accelerationen peger bagud',
    body: `<p>Når en bil bremser, falder farten. Så peger accelerationen <b>modsat</b> hastigheden. Er kørselsretningen positiv, bliver $a$ negativ:</p>
$$a = \\frac{0 - 20\\ \\mathrm{m/s}}{4\\ \\mathrm{s}} = -5\\ \\mathrm{m/s^2}$$
<p>Leg med opbremsningen. Læg mærke til, at <b>bremselængden</b> vokser voldsomt, når farten stiger – det vender vi tilbage til i bane 3.</p>`,
    widget: brakeLab,
    check: {
      q: 'En bil kører mod højre og bremser. Hvilken vej peger accelerationen?',
      options: [
        { html: 'Mod venstre', correct: true, why: 'Farten falder, så $a$ peger modsat $v$ – altså mod venstre.' },
        { html: 'Mod højre', correct: false, why: 'Hvis $a$ pegede samme vej som $v$, ville farten stige.' },
        { html: 'Den er 0', correct: false, why: 'Hastigheden ændrer sig, så der er en acceleration.' },
      ],
    },
  },
  {
    title: 'v-t-grafen: hældning = acceleration',
    body: `<p>Ligesom hastigheden er hældningen af s-t-grafen, er accelerationen <b>hældningen af v-t-grafen</b>:</p>
$$a = \\frac{\\Delta v}{\\Delta t}$$
<p>Stigende v-t-graf = speeder op. Faldende = bremser. Vandret = konstant hastighed ($a = 0$).</p>`,
    widget: vtSlopeWidget,
  },
  {
    title: 'Arealet under v-t-grafen = strækningen',
    body: `<p>I bane 1 så du, at arealet under v-t-grafen er strækningen. Det gælder stadig! Ved konstant acceleration kan arealet deles i et <b>rektangel</b> og en <b>trekant</b>:</p>
$$s = \\underbrace{v_0\\cdot t}_{\\text{rektangel}} + \\underbrace{\\tfrac12\\, a\\cdot t^2}_{\\text{trekant}}$$
<p>Trekanten har grundlinjen $t$ og højden $a\\cdot t$, så dens areal er $\\tfrac12\\cdot t\\cdot a t$. Det er en af formlerne i næste bane – nu ved du, hvor den kommer fra.</p>`,
    widget: areaSplitWidget,
    aha: 'Formlen $s = v_0 t + \\tfrac12 a t^2$ er bare "rektangel + trekant" under v-t-grafen.',
  },
  {
    title: 'Tre grafer – én bevægelse',
    body: `<p>Du har nu tre grafer, der hænger sammen:</p>
<div class="rule"><div><b>s-t:</b> hældningen er $v$</div><div><b>v-t:</b> hældningen er $a$, arealet er $\\Delta s$</div><div><b>a-t:</b> arealet er $\\Delta v$</div></div>
<p>Ved konstant acceleration er a-t-grafen vandret, v-t-grafen en ret linje – og s-t-grafen <b>krummer</b> (en parabel). Prøv at sætte $a$ negativ og $v_0$ positiv: bilen bremser, vender og kører baglæns.</p>`,
    widget: accLab,
    check: {
      q: 'En v-t-graf er en ret linje, der stiger. Hvordan ser a-t-grafen ud?',
      options: [
        { html: 'En vandret linje over t-aksen', correct: true, why: 'Konstant hældning på v-t-grafen = konstant, positiv acceleration.' },
        { html: 'En stigende ret linje', correct: false, why: 'Det er v-t-grafen igen. a-t-grafen viser dens <b>hældning</b>, og den er konstant.' },
        { html: 'En vandret linje på 0', correct: false, why: 'Så ville hastigheden være konstant – men den stiger.' },
      ],
    },
  },
];
