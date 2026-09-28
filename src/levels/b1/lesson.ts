// Bane 1 – lektionskort med interaktive widgets.

import { h } from '../../core/dom';
import { fmt } from '../../core/numbers';
import { alpha, C } from '../../viz/colors';
import { Plot, type PlotSpec } from '../../viz/plot';
import { Scene, type MotionSpec } from '../../viz/scene';
import { simLab, type Widget } from '../../viz/simlab';
import { qspan, slider } from '../../ui/widgets';
import type { LessonCard } from '../types';

function positionWidget(): Widget {
  let x = 20, origin = 0;
  const spec = (): MotionSpec => ({ view: 'track', obj: 'car', pos: () => [x, 0], vel: () => [0, 0], tMax: 1, xRange: [-50, 50], rulerOffset: origin, show: {} });
  const scene = new Scene(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    scene.setSpec(spec());
    out.innerHTML = qspan('s', 's', `${fmt(x - origin)} m`) + `<span class="q q-muted">${x - origin < 0 ? 'til venstre for' : x - origin > 0 ? 'til højre for' : 'præcis i'} nulpunktet</span>`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage' }, scene.el, out),
      h('div', { class: 'sim-params' },
        slider({ label: 'Flyt bilen', min: -45, max: 45, step: 5, value: x, unit: 'm', onInput: (v) => ((x = v), upd()) }),
        slider({ label: 'Flyt nulpunktet', min: -30, max: 30, step: 10, value: origin, unit: 'm', onInput: (v) => ((origin = v), upd()) }))),
    destroy: () => scene.destroy(),
  };
}

const dispWidget = () =>
  simLab({
    view: 'track',
    obj: 'car',
    tMax: 7.5,
    params: [],
    model: () => ({
      s: (t) => (t <= 5 ? 6 * t : 30 - 4 * (Math.min(t, 7.5) - 5)),
      v: (t) => (t < 5 ? 6 : -4),
      a: () => 0,
    }),
    graphs: ['s'],
    axes: { s: [0, 40] },
    range: [-5, 45],
    vectors: { v: true, disp: true },
    readouts: ['dist', 'disp', 'v'],
    vMax: 6,
  });

const velocityWidget = () =>
  simLab({
    view: 'track',
    obj: 'car',
    tMax: 6,
    params: [{ key: 'v', label: 'Hastighed $v$', unit: 'm/s', min: -8, max: 8, step: 1, value: -5 }],
    model: (p) => ({ s: (t) => p.v * t, v: () => p.v, a: () => 0 }),
    graphs: ['v'],
    axes: { v: [-10, 10] },
    range: [-50, 50],
    vectors: { v: true },
    readouts: ['v', 'fart'],
    vMax: 8,
  });

function unitWidget(): Widget {
  let kmt = 72;
  const big = h('div', { class: 'convert-big' });
  const bar = h('div', { class: 'meter-bar' }, h('div', { class: 'meter-fill' }), h('div', { class: 'meter-mark', style: `left:${(12 / 40) * 100}%` }, h('span', null, 'bybus ≈ 12 m')));
  const caption = h('div', { class: 'meter-cap' });
  const upd = () => {
    const ms = kmt / 3.6;
    big.innerHTML = `<span class="q-strong">${fmt(kmt)} km/t</span> <span class="op">÷ 3,6 =</span> <span class="q-strong accent">${fmt(ms, 1)} m/s</span>`;
    (bar.firstChild as HTMLElement).style.width = `${Math.min(100, (ms / 40) * 100)}%`;
    caption.textContent = `På ét sekund kører du ${fmt(ms, 1)} m.`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage pad' }, big, bar, h('div', { class: 'meter-scale' }, h('span', null, '0 m'), h('span', null, '20 m'), h('span', null, '40 m')), caption),
      h('div', { class: 'sim-params' }, slider({ label: 'Speedometer', min: 0, max: 140, step: 1, value: kmt, unit: 'km/t', onInput: (v) => ((kmt = v), upd()) }))),
    destroy: () => {},
  };
}

export const constVelLab = () =>
  simLab({
    view: 'track',
    obj: 'car',
    tMax: 10,
    params: [
      { key: 's0', label: 'Startposition $s_0$', unit: 'm', min: -20, max: 40, step: 5, value: 0 },
      { key: 'v', label: 'Hastighed $v$', unit: 'm/s', min: -6, max: 10, step: 0.5, value: 5 },
    ],
    model: (p) => ({ s: (t) => p.s0 + p.v * t, v: () => p.v, a: () => 0 }),
    graphs: ['s', 'v', 'a'],
    axes: { s: [-80, 140], v: [-10, 10], a: [-2, 2] },
    range: [-80, 140],
    vectors: { v: true },
    vectorToggle: true,
    strobe: 1,
    vMax: 10,
  });

function slopeWidget(): Widget {
  let v = 3;
  const s0 = 10;
  const spec = (): PlotSpec => {
    const fn = (t: number) => s0 + v * t;
    return {
      xLabel: 't (s)',
      yLabel: 's (m)',
      xMax: 8,
      xStep: 1,
      yMin: -30,
      yMax: 50,
      yStep: 10,
      series: [{ fn, color: C.s }],
      marks: [{ type: 'slope', x1: 2, x2: 6, fn, color: C.ink, dxLabel: 'Δt = 4 s', dyLabel: `Δs = ${fmt(4 * v)} m` }],
    };
  };
  const pl = new Plot(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    pl.setSpec(spec());
    out.innerHTML = `<span class="q q-v">hældning = Δs / Δt = ${fmt(4 * v)} m / 4 s = <b>${fmt(v)} m/s</b></span>`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' }, h('div', { class: 'sim-stage pad' }, pl.el, out), h('div', { class: 'sim-params' }, slider({ label: 'Hastighed $v$', min: -5, max: 5, step: 0.5, value: v, unit: 'm/s', onInput: (x) => ((v = x), upd()) }))),
    destroy: () => pl.destroy(),
  };
}

function areaWidget(): Widget {
  let v = 4, t = 5;
  const spec = (): PlotSpec => ({
    xLabel: 't (s)',
    yLabel: 'v (m/s)',
    xMax: 10,
    xStep: 1,
    yMin: 0,
    yMax: 10,
    yStep: 2,
    series: [{ fn: () => v, color: C.v, live: true, ghost: true, fill: alpha(C.v, 0.2) }],
  });
  const pl = new Plot(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    pl.spec = spec();
    pl.setReveal(t);
    out.innerHTML = `<span class="q q-v">areal = ${fmt(v)} m/s · ${fmt(t)} s = <b>${fmt(v * t)} m</b></span><span class="q q-muted">= strækningen</span>`;
  };
  upd();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage pad' }, pl.el, out),
      h('div', { class: 'sim-params' },
        slider({ label: 'Hastighed $v$', min: 1, max: 9, step: 0.5, value: v, unit: 'm/s', onInput: (x) => ((v = x), upd()) }),
        slider({ label: 'Tid $t$', min: 0, max: 10, step: 0.5, value: t, unit: 's', onInput: (x) => ((t = x), upd()) }))),
    destroy: () => pl.destroy(),
  };
}

export const b1Lesson: LessonCard[] = [
  {
    title: 'Hvor er du? – position',
    body: `<p>Før vi kan tale om bevægelse, skal vi kunne sige, <b>hvor</b> noget er. Det gør vi med en <b>position</b> $s$, målt fra et <b>nulpunkt</b>, som du selv vælger – fx en lygtepæl eller startstregen.</p>
<p>Positionen kan godt være negativ. Det betyder bare, at tingen er på den anden side af nulpunktet.</p>`,
    widget: positionWidget,
    aha: 'Flyt nulpunktet: bilens position ændrer sig, selvom bilen holder helt stille. Positionen afhænger af, hvor du måler fra.',
  },
  {
    title: 'Strækning og forskydning',
    body: `<p>Bilen kører 30 m frem og bakker derefter 10 m. Hvor langt har den kørt? Det kommer an på, hvad du mener:</p>
<ul><li><b>Strækning</b> er den samlede vej – det, kilometertælleren viser: 30 m + 10 m = 40 m.</li>
<li><b>Forskydning</b> $\\Delta s$ er pilen fra start til slut: $\\Delta s = s_{\\text{slut}} - s_{\\text{start}} = +20$ m.</li></ul>
<p>Forskydningen er en <b>vektor</b>: den har både en størrelse og en retning (fortegnet).</p>`,
    widget: dispWidget,
    aha: 'Strækningen kan kun vokse. Forskydningen kan blive mindre – og endda negativ – når man kører tilbage.',
    check: {
      q: 'Du går 200 m ud ad en vej og 200 m samme vej tilbage. Hvad er din forskydning?',
      options: [
        { html: '0 m', correct: true, why: 'Du ender, hvor du startede – pilen fra start til slut har længden 0.' },
        { html: '400 m', correct: false, why: 'Det er strækningen. Forskydningen måler kun fra start til slut.' },
        { html: '200 m', correct: false, why: 'Det er, hvor langt væk du var på det fjerneste sted – men du gik tilbage igen.' },
      ],
    },
  },
  {
    title: 'Fart og hastighed',
    body: `<p><b>Fart</b> er, hvor hurtigt noget bevæger sig – altid et positivt tal. <b>Hastighed</b> $v$ er farten <b>plus retningen</b>. På en lige vej viser fortegnet retningen:</p>
<ul><li>$v = +5\\ \\mathrm{m/s}$: 5 m/s i positiv retning (her mod højre)</li>
<li>$v = -5\\ \\mathrm{m/s}$: 5 m/s i negativ retning (mod venstre)</li></ul>
<p>Vi tegner hastigheden som en <span class="c-v">lilla pil</span>: pilens længde er farten, og den peger i bevægelsens retning.</p>`,
    widget: velocityWidget,
    check: {
      q: 'Positiv retning er mod højre. En bil kører mod venstre med farten 12 m/s. Hvad er bilens hastighed?',
      options: [
        { html: '$v = -12\\ \\mathrm{m/s}$', correct: true, why: 'Farten er 12 m/s, og minus viser, at den kører i negativ retning.' },
        { html: '$v = 12\\ \\mathrm{m/s}$', correct: false, why: 'Det er farten. Hastigheden skal også vise retningen – her negativ.' },
        { html: '$v = 0\\ \\mathrm{m/s}$', correct: false, why: 'Bilen bevæger sig, så hastigheden er ikke 0.' },
      ],
    },
  },
  {
    title: 'Enheder: km/t og m/s',
    body: `<p>I fysik regner vi i SI-enheder: meter (m) og sekunder (s) – og derfor m/s. Men speedometret viser km/t. Omregningen:</p>
$$1\\ \\mathrm{km/t} = \\frac{1000\\ \\mathrm{m}}{3600\\ \\mathrm{s}} = \\frac{1}{3{,}6}\\ \\mathrm{m/s}$$
<div class="rule"><div><b>km/t → m/s:</b> divider med 3,6</div><div><b>m/s → km/t:</b> gang med 3,6</div></div>`,
    widget: unitWidget,
    aha: 'Tænk: "Hvor mange meter på ét sekund?" Ved 36 km/t kører du 10 m hvert sekund – næsten en bybus lang.',
  },
  {
    title: 'Konstant hastighed',
    body: `<p>Konstant hastighed betyder, at du tilbagelægger <b>lige langt hvert sekund</b>. Så gælder</p>
$$v = \\frac{\\Delta s}{\\Delta t}\\qquad\\text{eller kort}\\qquad v = \\frac{s}{t}$$
<p>Prikkerne på vejen sættes <b>hvert sekund</b> – læg mærke til, at der er lige langt mellem dem. Flyt på $s_0$ og $v$, og se hvad der sker med de tre grafer.</p>`,
    widget: constVelLab,
    aha: 'Konstant hastighed: s-t-grafen er en ret linje, v-t-grafen er vandret, og a-t-grafen ligger på 0.',
  },
  {
    title: 'Hældning = hastighed',
    body: `<p>På en s-t-graf kan du <b>se</b> hastigheden: den er grafens <b>hældning</b>.</p>
$$v = \\frac{\\Delta s}{\\Delta t} = \\frac{\\text{op}}{\\text{hen}}$$
<p>Stejl graf = hurtigt. Vandret graf = står stille. Graf der går nedad = bevægelse i negativ retning.</p>`,
    widget: slopeWidget,
    check: {
      q: 'En ret s-t-graf går fra $(0\\ \\mathrm{s},\\ 10\\ \\mathrm{m})$ til $(4\\ \\mathrm{s},\\ 30\\ \\mathrm{m})$. Hvad er hastigheden?',
      options: [
        { html: '$5\\ \\mathrm{m/s}$', correct: true, why: '$\\Delta s = 30 - 10 = 20$ m og $\\Delta t = 4$ s, så $v = 20/4 = 5$ m/s.' },
        { html: '$7{,}5\\ \\mathrm{m/s}$', correct: false, why: 'Det er slutpositionen divideret med tiden. Brug <b>ændringen</b> i position: 30 − 10 = 20 m.' },
        { html: '$0{,}2\\ \\mathrm{m/s}$', correct: false, why: 'Det er $\\Delta t/\\Delta s$ – omvendt. Hældning er op/hen.' },
      ],
    },
  },
  {
    title: 'Arealet under v-t-grafen',
    body: `<p>Du kan også gå den anden vej: på en <b>v-t-graf</b> er <b>arealet under grafen</b> lig med strækningen. Ved konstant hastighed er arealet et rektangel:</p>
$$s = v\\cdot t = \\text{højde}\\cdot\\text{bredde}$$
<p>Det gælder også, når hastigheden ikke er konstant – det bruger du i bane 2.</p>`,
    widget: areaWidget,
  },
  {
    title: 'Metoden: sådan løser du en opgave',
    body: `<p>Gør det samme hver gang – så bliver selv svære opgaver overskuelige:</p>
<ol class="method"><li><b>Givet:</b> skriv alle tal op med enheder.</li>
<li><b>Søgt:</b> hvad spørges der om?</li>
<li><b>Omregn</b> til enheder, der passer sammen (typisk m, s og m/s).</li>
<li><b>Vælg formel:</b> den skal indeholde det søgte og ellers kun kendte størrelser. Isolér det søgte.</li>
<li><b>Regn og tjek:</b> passer enheden? Er tallet realistisk?</li></ol>
<div class="example"><b>Eksempel:</b> Et tog kører 108 km/t i 5,0 min. Hvor langt kommer det?<br>
Givet: $v = 108\\ \\mathrm{km/t} = 30\\ \\mathrm{m/s}$ og $t = 5{,}0\\ \\mathrm{min} = 300\\ \\mathrm{s}$. Søgt: $s$.<br>
$s = v\\cdot t = 30\\ \\mathrm{m/s}\\cdot 300\\ \\mathrm{s} = 9000\\ \\mathrm{m} = 9{,}0\\ \\mathrm{km}$</div>
<p>I øverunden træner du netop dette: først givet og søgt, så formlen, og til sidst udregningen.</p>`,
  },
];
