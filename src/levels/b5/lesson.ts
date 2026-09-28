// Bane 5 – lektionskort: kræfter som vektorer, kraftdiagrammer og Newtons love.

import { h } from '../../core/dom';
import { fmt } from '../../core/numbers';
import { C } from '../../viz/colors';
import { simLab, type Widget } from '../../viz/simlab';
import { forceDiagram, type Force } from '../../viz/svgviz';
import { decompositionWidget } from '../../ui/vectorWidget';
import { slider } from '../../ui/widgets';
import type { LessonCard } from '../types';
import { FC } from './generators';

function forceAdderWidget(): Widget {
  let F1 = 300, F2 = 120;
  const box = h('div', { class: 'fbd-box' });
  const out = h('div', { class: 'readouts' });
  const render = () => {
    const res = F1 - F2;
    const forces: Force[] = [
      { angle: 0, mag: F1, label: 'F_1', color: FC.motor },
      { angle: 180, mag: F2, label: 'F_2', color: FC.gnid },
    ];
    box.replaceChildren(forceDiagram({ body: 'box', forces, showValues: true, maxMag: 500, resultant: res ? { angle: res > 0 ? 0 : 180, mag: Math.abs(res) } : null, ground: true }));
    out.innerHTML =
      `<span class="q q-F"><i>F</i><sub>res</sub> = ${fmt(F1)} N − ${fmt(F2)} N = <b>${fmt(res)} N</b></span>` +
      `<span class="q q-muted">${res > 0 ? 'peger mod højre' : res < 0 ? 'peger mod venstre' : 'kræfterne ophæver hinanden'}</span>`;
  };
  render();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage pad' }, box, out),
      h('div', { class: 'sim-params' },
        slider({ label: '$F_1$ (mod højre)', min: 0, max: 500, step: 10, value: F1, unit: 'N', onInput: (x) => ((F1 = x), render()) }),
        slider({ label: '$F_2$ (mod venstre)', min: 0, max: 500, step: 10, value: F2, unit: 'N', onInput: (x) => ((F2 = x), render()) }))),
    destroy: () => {},
  };
}

export function forceLab(): Widget {
  const aside = h('div');
  return simLab({
    view: 'track',
    obj: 'car',
    tMax: 6,
    params: [
      { key: 'm', label: 'Masse $m$', unit: 'kg', min: 500, max: 2000, step: 100, value: 1000 },
      { key: 'Ff', label: 'Motorkraft (frem)', unit: 'N', min: 0, max: 4000, step: 250, value: 3000 },
      { key: 'Fb', label: 'Modstand (bagud)', unit: 'N', min: 0, max: 4000, step: 250, value: 1000 },
      { key: 'v0', label: 'Starthastighed $v_0$', unit: 'm/s', min: 0, max: 20, step: 2, value: 0 },
    ],
    model: (p) => {
      const a = (p.Ff - p.Fb) / p.m;
      if (a >= 0) return { s: (t) => p.v0 * t + 0.5 * a * t * t, v: (t) => p.v0 + a * t, a: () => a };
      const ts = p.v0 / -a;
      const sStop = p.v0 * ts + 0.5 * a * ts * ts;
      return { s: (t) => (t < ts ? p.v0 * t + 0.5 * a * t * t : sStop), v: (t) => (t < ts ? p.v0 + a * t : 0), a: (t) => (t < ts ? a : 0) };
    },
    graphs: ['v', 'a'],
    axes: { v: [0, 70], a: [-9, 9] },
    range: [0, 270],
    vectors: { v: true, a: true, massKey: 'm' },
    readouts: ['v', 'a'],
    vMax: 60,
    aMax: 8,
    extra: (p) => `<span class="q q-F"><i>F</i><sub>res</sub> = ${fmt(p.Ff - p.Fb)} N → <i>a</i> = ${fmt(p.Ff - p.Fb)} N / ${fmt(p.m)} kg = ${fmt((p.Ff - p.Fb) / p.m, 2)} m/s²</span>`,
    aside,
    onParams: (p) => {
      const res = p.Ff - p.Fb;
      aside.replaceChildren(
        forceDiagram({
          body: 'car',
          forces: [
            { angle: 0, mag: p.Ff, label: 'F_motor', color: FC.motor },
            { angle: 180, mag: p.Fb, label: 'F_mod', color: FC.gnid },
          ],
          maxMag: 4000,
          resultant: res ? { angle: res > 0 ? 0 : 180, mag: Math.abs(res) } : null,
        }),
        h('div', { class: 'cap' }, 'Kraftdiagram (vandrette kræfter). Stiplet: den resulterende kraft.'),
      );
    },
  });
}

function galleryWidget(): Widget {
  const W = 60;
  const fig = (title: string, body: 'box' | 'car' | 'ball', forces: Force[], cap: string) =>
    h('figure', null, forceDiagram({ body, forces, maxMag: W * 1.4 }), h('figcaption', null, h('b', null, title), h('br'), cap));
  const Ft: Force = { angle: 270, mag: W, label: 'F_t', color: FC.t };
  const FN: Force = { angle: 90, mag: W, label: 'F_N', color: FC.N };
  return {
    el: h('div', { class: 'fbd-gallery' },
      fig('Bog på bord', 'box', [Ft, FN], 'Hvile: kræfterne ophæver hinanden.'),
      fig('Bil med konstant fart', 'car', [Ft, FN, { angle: 0, mag: W * 0.8, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 0.8, label: 'F_mod', color: FC.gnid }], 'Konstant fart: også her er F_res = 0.'),
      fig('Bold i luften', 'ball', [Ft], 'Kun tyngdekraften – også på vej op!'),
    ),
    destroy: () => {},
  };
}

export const b5Lesson: LessonCard[] = [
  {
    title: 'Kræfter er vektorer',
    body: `<p>En kraft er et skub eller et træk. Den har en <b>størrelse</b> (målt i newton, N) og en <b>retning</b> – den er altså en vektor, ligesom hastighed. Vi tegner den som en pil.</p>
<p>Virker flere kræfter på den samme genstand, lægger vi dem sammen til den <b>resulterende kraft</b> $F_{\\mathrm{res}}$. På en lige linje gør du det med fortegn:</p>
$$F_{\\mathrm{res}} = F_1 + F_2 + \\dots\\qquad(\\text{højre} = +,\\ \\text{venstre} = -)$$`,
    widget: forceAdderWidget,
    aha: 'Den stiplede sorte pil er den resulterende kraft – "summen" af alle pilene. Det er den, der bestemmer, hvad genstanden gør.',
  },
  {
    title: 'Newtons 2. lov: F = m·a',
    body: `<p>Her er forbindelsen mellem kræfter og bevægelse:</p>
$$F_{\\mathrm{res}} = m\\cdot a$$
<p>Den resulterende kraft giver genstanden en <b>acceleration</b> i kraftens retning. Stor kraft = stor acceleration. Stor masse = lille acceleration.</p>
<p>Prøv at gøre motorkraften og modstanden lige store: så er $F_{\\mathrm{res}} = 0$, og bilen kører videre med <b>konstant</b> fart. Sæt $v_0$ op og modstanden højere end motorkraften: så bremser bilen.</p>`,
    widget: forceLab,
    aha: 'Kraften bestemmer <b>accelerationen</b> – ikke hastigheden. Den <span style="color:#db2777;font-weight:600">lyserøde</span> kraftpil peger altid samme vej som den <span style="color:#b45309;font-weight:600">orange</span> accelerationspil.',
  },
  {
    title: 'Kraftdiagrammer',
    body: `<p>Et kraftdiagram viser <b>alle</b> kræfter på <b>én</b> genstand. Sådan tegner du det:</p>
<ol class="method"><li>Tegn genstanden som en kasse (eller en prik).</li>
<li><b>Tyngdekraften</b> $F_t = m\\cdot g$ peger altid lodret nedad.</li>
<li>Rører genstanden noget? Så tegn <b>kontaktkræfterne</b>: normalkraft $F_N$ (vinkelret på underlaget), gnidning, træk i snore osv.</li>
<li>Bevæger den sig gennem luft/vand? Tegn <b>modstanden</b> modsat bevægelsen.</li>
<li>Tegn <b>ikke</b> "fartkræfter" – noget, der bevæger sig, har ikke brug for en kraft for at fortsætte.</li></ol>`,
    widget: galleryWidget,
    check: {
      q: 'En bold er på vej op efter et kast. Hvilke kræfter virker på den? (Uden luftmodstand.)',
      options: [
        { html: 'Kun tyngdekraften nedad', correct: true, why: 'Kastet er slut, når bolden forlader hånden. Bolden fortsætter op pga. sin fart, men den eneste kraft er tyngden.' },
        { html: 'Tyngdekraften nedad og en kastekraft opad', correct: false, why: 'Kastekraften virker kun, mens hånden rører bolden. Det er den mest almindelige fejl i kraftdiagrammer!' },
        { html: 'Ingen kræfter', correct: false, why: 'Tyngdekraften virker altid – det er derfor, bolden bremser op og vender.' },
      ],
    },
  },
  {
    title: 'Newtons 1. lov: ingen kraft, ingen ændring',
    body: `<p>Hvis den resulterende kraft er 0, sker der <b>ingen ændring</b> i bevægelsen:</p>
$$F_{\\mathrm{res}} = 0 \\quad\\Longleftrightarrow\\quad \\text{hvile eller konstant hastighed}$$
<p>Det virker mærkeligt, fordi tingene i hverdagen stopper af sig selv. Men det skyldes gnidning og luftmodstand – kræfter, der peger bagud. En ishockeypuck på glat is glider næsten uden at stoppe.</p>`,
    check: {
      q: 'En bil kører med konstant 90 km/t ligeud. Hvad er den resulterende kraft på bilen?',
      options: [
        { html: '0 N', correct: true, why: 'Konstant hastighed ⇒ ingen acceleration ⇒ $F_{\\mathrm{res}} = 0$. Motorkraften ophæver præcis modstanden.' },
        { html: 'Den peger fremad', correct: false, why: 'Så ville bilen accelerere. Det kræver ingen resulterende kraft at holde farten.' },
        { html: 'Den er lig med motorkraften', correct: false, why: 'Motorkraften er kun én af kræfterne. Modstanden bagud er lige så stor.' },
      ],
    },
  },
  {
    title: 'Tyngdekraft og masse',
    body: `<p><b>Masse</b> $m$ (kg) er mængden af stof – den er den samme overalt. <b>Tyngdekraften</b> $F_t$ (N) er hvor hårdt Jorden trækker:</p>
$$F_t = m\\cdot g\\qquad g = 9{,}82\\ \\mathrm{m/s^2}$$
<p>Nu kan du se, hvorfor alt falder lige hurtigt (bane 4): uden luftmodstand er tyngdekraften den eneste kraft, så</p>
$$a = \\frac{F_{\\mathrm{res}}}{m} = \\frac{m\\cdot g}{m} = g$$
<p>Massen går ud! En tung sten trækkes hårdere, men er også sværere at sætte i gang.</p>`,
    check: {
      q: 'Hvor stor er tyngdekraften på en taske med massen 5 kg?',
      options: [
        { html: 'ca. 49 N', correct: true, why: '$F_t = 5\\ \\mathrm{kg}\\cdot 9{,}82\\ \\mathrm{m/s^2} = 49{,}1\\ \\mathrm{N}$.' },
        { html: '5 N', correct: false, why: 'Massen er 5 kg – men kraften i newton er $m\\cdot g$.' },
        { html: '0,5 N', correct: false, why: 'Du har divideret med $g$. Det skal ganges.' },
      ],
    },
  },
  {
    title: 'Kræfter på skrå: komposanter',
    body: `<p>Trækker du en slæde med en snor på skrå, virker kraften både fremad og lidt opad. Vi deler den op i to <b>komposanter</b> – en vandret og en lodret – som er kateterne i en retvinklet trekant:</p>
$$F_x = F\\cdot\\cos\\theta\\qquad\\qquad F_y = F\\cdot\\sin\\theta$$
<p>Kun den vandrette komposant trækker slæden fremad. Samme idé bruger du til skråt kast i bonusbanen – dér deler du hastigheden op.</p>`,
    widget: () => decompositionWidget({ sym: 'F', unit: 'N', max: 200, mag: 150, angle: 30, color: C.F, magLabel: 'Kraft $F$' }),
    aha: 'Lommeregneren skal stå i <b>grader</b> (DEG), ikke radianer (RAD). Tjek: $\\cos(60^\\circ)$ skal give 0,5.',
  },
];
