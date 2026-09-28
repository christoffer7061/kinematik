// Bane 3 – lektionskort: de fire bevægelsesligninger og strategien for formelvalg.

import { h } from '../../core/dom';
import { fmt } from '../../core/numbers';
import { rich, tex } from '../../core/tex';
import { F } from '../../exercises/build';
import { C } from '../../viz/colors';
import { Plot, type PlotSpec } from '../../viz/plot';
import type { Widget } from '../../viz/simlab';
import { slider } from '../../ui/widgets';
import { accLab, areaSplitWidget } from '../b2/lesson';
import type { LessonCard } from '../types';
import { SYM_NAME, SYM_TEX, type Sym } from './generators';

type Status = 'ukendt' | 'givet' | 'søgt';
const FORMS = ['vv0at', 'sv0t', 'v2', 'savg'];
const LACKS: Record<string, Sym> = { vv0at: 's', sv0t: 'v', v2: 't', savg: 'a' };

export function formulaChooserWidget(): Widget {
  const syms: Sym[] = ['v0', 'v', 'a', 't', 's'];
  const st: Record<Sym, Status> = { v0: 'givet', v: 'søgt', a: 'givet', t: 'ukendt', s: 'givet' };
  const chipBox = h('div', { class: 'fc-chips' });
  const cards = h('div', { class: 'fc-cards' });
  const msg = h('div', { class: 'fc-msg' });

  const render = () => {
    chipBox.replaceChildren(
      ...syms.map((s) =>
        h('button', {
          class: `fc-chip ${st[s]}`,
          onclick: () => {
            const next: Status = st[s] === 'ukendt' ? 'givet' : st[s] === 'givet' ? 'søgt' : 'ukendt';
            if (next === 'søgt') syms.forEach((x) => st[x] === 'søgt' && (st[x] = 'ukendt'));
            st[s] = next;
            render();
          },
        },
        h('span', { class: 'fc-sym', html: tex(SYM_TEX[s]) }),
        h('span', { class: 'fc-name' }, SYM_NAME[s]),
        h('span', { class: 'fc-status' }, st[s])),
      ),
    );
    const sought = syms.find((s) => st[s] === 'søgt');
    const given = syms.filter((s) => st[s] === 'givet');
    const valid = (id: string) => !!sought && F[id].vars.includes(sought) && F[id].vars.every((v) => v === sought || given.includes(v as Sym));
    cards.replaceChildren(
      ...FORMS.map((id) =>
        h('div', { class: 'fc-card' + (sought && given.length >= 3 ? (valid(id) ? ' ok' : ' no') : '') },
          h('div', { html: tex(F[id].tex) }),
          h('div', { class: 'fc-lacks', html: `mangler ${tex(SYM_TEX[LACKS[id]])}` }))),
    );
    let m: string;
    if (!sought) m = 'Markér hvad du <b>søger</b> (tryk på en størrelse, til der står "søgt").';
    else if (given.length < 3) m = `Du kender ${given.length} størrelse${given.length === 1 ? '' : 'r'}. Ved konstant acceleration skal du kende <b>tre</b> af de fem for at kunne finde resten.`;
    else {
      const ok = FORMS.filter(valid);
      if (given.length === 3) {
        const miss = syms.find((s) => st[s] === 'ukendt')!;
        m = `Hverken givet eller søgt: $${SYM_TEX[miss]}$ (${SYM_NAME[miss]}). Brug formlen, der mangler netop den: $${F[ok[0]].tex}$`;
      } else m = `Du kender mere end nødvendigt – ${ok.length} af formlerne virker. Vælg den, der er lettest at isolere $${SYM_TEX[sought]}$ i.`;
    }
    msg.innerHTML = rich(m);
  };
  render();
  return { el: h('div', { class: 'simlab fc' }, h('div', { class: 'sim-stage pad' }, h('p', { class: 'muted small' }, 'Tryk på størrelserne for at skifte mellem ukendt → givet → søgt.'), chipBox, msg, cards)), destroy: () => {} };
}

function brakeDistanceWidget(): Widget {
  let v = 50, a = -7;
  const sOf = (kmt: number) => (kmt / 3.6) ** 2 / (2 * -a);
  const spec = (): PlotSpec => ({
    xLabel: 'v₀ (km/t)', yLabel: 's (m)', xMax: 130, xStep: 10, yMin: 0, yMax: 140, yStep: 20,
    series: [{ fn: sOf, color: C.s }],
    marks: [
      { type: 'point', x: v, y: sOf(v), color: C.s, label: `${fmt(sOf(v), 1)} m` },
      ...(2 * v <= 130 ? [{ type: 'point' as const, x: 2 * v, y: sOf(2 * v), color: C.bad, label: `${fmt(sOf(2 * v), 1)} m` }] : []),
    ],
  });
  const pl = new Plot(spec());
  const out = h('div', { class: 'readouts' });
  const upd = () => {
    pl.setSpec(spec());
    out.innerHTML =
      `<span class="q q-s">${fmt(v)} km/t → ${fmt(sOf(v), 1)} m</span>` +
      (2 * v <= 130 ? `<span class="q" style="color:${C.bad};background:#fcefee">${fmt(2 * v)} km/t → ${fmt(sOf(2 * v), 1)} m (4 ×)</span>` : '');
  };
  upd();
  return {
    el: h('div', { class: 'simlab' },
      h('div', { class: 'sim-stage pad' }, pl.el, out),
      h('div', { class: 'sim-params' },
        slider({ label: 'Fart før opbremsning', min: 20, max: 130, step: 5, value: v, unit: 'km/t', onInput: (x) => ((v = x), upd()) }),
        slider({ label: 'Opbremsning $a$', min: -9, max: -4, step: 0.5, value: a, unit: 'm/s^2', onInput: (x) => ((a = x), upd()) }))),
    destroy: () => pl.destroy(),
  };
}

export const b3Lesson: LessonCard[] = [
  {
    title: 'Fire formler – og hvordan du vælger',
    body: `<p>Ved konstant acceleration hænger fem størrelser sammen: $v_0$, $v$, $a$, $t$ og $s$. Der er fire formler, og <b>hver formel mangler præcis én</b> af de fem:</p>
<div class="rule"><div>$v = v_0 + a\\cdot t$ &nbsp;<span class="muted">mangler $s$</span></div><div>$s = v_0\\cdot t + \\tfrac12 a\\cdot t^2$ &nbsp;<span class="muted">mangler $v$</span></div><div>$v^2 = v_0^2 + 2a\\cdot s$ &nbsp;<span class="muted">mangler $t$</span></div><div>$s = \\frac{v_0 + v}{2}\\cdot t$ &nbsp;<span class="muted">mangler $a$</span></div></div>
<p><b>Strategien:</b> skriv op, hvad der er givet og søgt. Find den størrelse, der hverken er givet eller søgt – og vælg formlen, der mangler netop den. Prøv selv:</p>`,
    widget: formulaChooserWidget,
    aha: 'Du skal ikke huske, hvornår hver formel bruges. Du skal bare finde den størrelse, der mangler.',
  },
  {
    title: 'Hvor kommer formlerne fra?',
    body: `<p>Formlerne er ikke magi – de kommer fra det, du allerede kan:</p>
<ul><li>$v = v_0 + a\\cdot t$: accelerationen lægger $a$ til hastigheden hvert sekund.</li>
<li>$s = v_0 t + \\tfrac12 a t^2$: arealet under v-t-grafen = rektangel + trekant (se grafen).</li>
<li>$s = \\frac{v_0 + v}{2}\\cdot t$: samme areal, set som et trapez: gennemsnitsfart gange tid.</li>
<li>$v^2 = v_0^2 + 2as$: fås ved at fjerne $t$ fra de to første (sæt $t = \\frac{v - v_0}{a}$ ind).</li></ul>`,
    widget: areaSplitWidget,
  },
  {
    title: 's-t-grafen krummer',
    body: `<p>Ved konstant acceleration er s-t-grafen en <b>parabel</b>, fordi $t$ står i anden. Hastigheden aflæses stadig som hældning – men nu som hældningen af <b>tangenten</b> (den stiplede lilla linje) i det øjeblik, du kigger på.</p>
<p>Læg mærke til prikkerne på vejen: de sættes hvert sekund, og afstanden vokser, når bilen accelererer.</p>`,
    widget: accLab,
    check: {
      q: 'En bil starter fra hvile og accelererer jævnt. Efter 1 s har den kørt 2 m. Hvor langt har den kørt efter 2 s?',
      options: [
        { html: '8 m', correct: true, why: 'Fra hvile er $s = \\tfrac12 a t^2$. Dobbelt tid giver $2^2 = 4$ gange så langt: 8 m.' },
        { html: '4 m', correct: false, why: 'Det gælder ved konstant hastighed. Her accelererer bilen og kører længere i andet sekund.' },
        { html: '6 m', correct: false, why: 'Tæt på tanken – men strækningen vokser med $t^2$: $2\\cdot 4 = 8$ m.' },
      ],
    },
  },
  {
    title: 'Et gennemregnet eksempel',
    body: `<p><b>Opgave:</b> En bil kører ud på motorvejen og øger jævnt farten fra 15 m/s til 30 m/s over 150 m. Hvad er accelerationen?</p>
<ol class="method"><li><b>Givet:</b> $v_0 = 15\\ \\mathrm{m/s}$, $v = 30\\ \\mathrm{m/s}$, $s = 150\\ \\mathrm{m}$. <b>Søgt:</b> $a$.</li>
<li><b>Mangler:</b> tiden $t$ nævnes ikke. Brug formlen uden $t$: $v^2 = v_0^2 + 2a\\cdot s$.</li>
<li><b>Isolér $a$:</b> $a = \\frac{v^2 - v_0^2}{2s}$</li>
<li><b>Indsæt:</b> $a = \\frac{(30\\ \\mathrm{m/s})^2 - (15\\ \\mathrm{m/s})^2}{2\\cdot 150\\ \\mathrm{m}} = \\frac{900 - 225}{300}\\ \\mathrm{m/s^2} = 2{,}25\\ \\mathrm{m/s^2}$</li>
<li><b>Tjek:</b> en almindelig bil kan accelerere med 2–4 m/s². ✔</li></ol>`,
    check: {
      q: 'En bil bremser fra 20 m/s til stilstand med $a = -5\\ \\mathrm{m/s^2}$. Du skal finde bremselængden. Hvilken størrelse er hverken givet eller søgt?',
      options: [
        { html: 'Tiden $t$', correct: true, why: 'Givet: $v_0$, $v = 0$ og $a$. Søgt: $s$. Tiden mangler – brug $v^2 = v_0^2 + 2as$.' },
        { html: 'Sluthastigheden $v$', correct: false, why: '"Til stilstand" betyder, at $v = 0$ – den er givet!' },
        { html: 'Strækningen $s$', correct: false, why: 'Bremselængden er strækningen – det er den, du søger.' },
      ],
    },
  },
  {
    title: 'Bremselængde: dobbelt fart, fire gange så langt',
    body: `<p>Fra $v^2 = v_0^2 + 2as$ med $v = 0$ får du bremselængden:</p>
$$s = \\frac{v_0^2}{2\\,|a|}$$
<p>Farten står i <b>anden</b>. Kører du dobbelt så hurtigt, bliver bremselængden <b>fire</b> gange så lang. Det er grunden til, at få km/t ekstra betyder så meget i trafikken.</p>`,
    widget: brakeDistanceWidget,
  },
  {
    title: 'Tjek dit svar med sund fornuft',
    body: `<p>Når du har regnet, så spørg: er tallet realistisk? Nogle pejlemærker:</p>
<ul><li>Bil der speeder op: $a \\approx 2$–$4\\ \\mathrm{m/s^2}$</li>
<li>Nødbremsning på tør vej: $a \\approx -7$ til $-9\\ \\mathrm{m/s^2}$</li>
<li>Frit fald: $a = 9{,}82\\ \\mathrm{m/s^2}$ (næste bane)</li>
<li>Byfart 50 km/t ≈ 14 m/s, motorvej 130 km/t ≈ 36 m/s</li></ul>
<p>Får du en bil med $a = 150\\ \\mathrm{m/s^2}$ eller en bremselængde på 2 km, er der sikkert en enhed, der ikke er omregnet.</p>`,
    check: {
      q: 'Du regner bremselængden for en bil i 90 km/t og får 578 m. Hvad er den mest sandsynlige fejl?',
      options: [
        { html: 'Farten er ikke omregnet fra km/t til m/s', correct: true, why: 'Med km/t bliver $v_0^2$ $3{,}6^2 \\approx 13$ gange for stor. Korrekt svar er ca. 45 m.' },
        { html: 'Bilen har bare dårlige bremser', correct: false, why: '578 m er næsten en halv kilometer – det er urealistisk selv med dårlige bremser.' },
        { html: 'Der mangler et minus', correct: false, why: 'Et fortegn ændrer ikke størrelsen. Her er tallet alt for stort.' },
      ],
    },
  },
];
