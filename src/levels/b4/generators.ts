// Bane 4: Frit fald og lodret kast – opgavegeneratorer. Opad er positiv, g = 9,82 m/s².

import { decFor, fmt, tn, tq } from '../../core/numbers';
import type { Rng } from '../../core/rng';
import { linePlot } from '../../exercises/build';
import type { ChoiceOption } from '../../exercises/types';
import { C } from '../../viz/colors';
import type { MotionSpec } from '../../viz/scene';
import { gen, type Generator } from '../types';

export const G = 9.82;
const gT = '9{,}82\\ \\mathrm{m/s^2}';

const dropScenes = [
  { txt: 'En sten slippes fra en bro', tail: 'over vandet', h: [5, 35, 1] },
  { txt: 'Et æble falder fra en gren', tail: 'over jorden', h: [1.5, 4, 0.5] },
  { txt: 'En nøgle tabes fra en altan', tail: 'over fortovet', h: [4, 18, 1] },
  { txt: 'En vanddråbe falder fra kanten af et tag', tail: 'over jorden', h: [3, 10, 0.5] },
];
const dropH = (rng: Rng, sc: (typeof dropScenes)[number]) => rng.stepped(sc.h[0], sc.h[1], sc.h[2]);

// ---------- 1. Faldtid ----------
const fallTime = gen({ id: 'b4.fald-tid', title: 'Faldtid', skills: ['frit-fald'], difficulty: 1 }, (rng) => {
  const sc = rng.pick(dropScenes);
  const h = dropH(rng, sc);
  const t = Math.sqrt((2 * h) / G);
  const d = decFor(t);
  return {
    kind: 'numeric',
    topic: 'Frit fald',
    prompt: `${sc.txt} $${tq(h, 'm')}$ ${sc.tail}. Hvor lang tid tager faldet? (Se bort fra luftmodstand.)`,
    label: 't =',
    answer: t,
    unit: 's',
    decimals: d,
    mistakes: [
      { value: (2 * h) / G, why: 'Du har fundet $t^2$. Husk at tage <b>kvadratroden</b>: $t = \\sqrt{2h/g}$.' },
      { value: Math.sqrt(h / G), why: 'Du mangler 2-tallet. Fra $h = \\tfrac12 g t^2$ får du $t^2 = \\frac{2h}{g}$.' },
      { value: h / G, why: 'Tjek enheden: m divideret med m/s² giver s², ikke s. Løs $h = \\tfrac12 g t^2$ for $t$.' },
      { value: Math.sqrt(2 * h * G), why: 'Det er faktisk <b>farten</b> ved jorden ($\\sqrt{2gh}$), ikke tiden. Tjek enheden: den giver m/s.' },
    ],
    hints: [
      '"Slippes" betyder, at starthastigheden er 0. Så falder den $h = \\tfrac12 g t^2$ på tiden $t$.',
      'Isolér $t$: $t = \\sqrt{\\frac{2h}{g}}$.',
      `$t = \\sqrt{\\frac{2\\cdot ${tq(h, 'm')}}{${gT}}}$`,
    ],
    solution: [
      { text: 'Fra hvile falder den strækningen $h = \\tfrac12 g t^2$. Isolér $t$:', math: 't = \\sqrt{\\frac{2h}{g}}' },
      { text: 'Indsæt:', math: `t = \\sqrt{\\frac{2\\cdot ${tq(h, 'm')}}{${gT}}} = ${tq(t, 's', d)}` },
      { aha: true, text: 'Faldtiden afhænger ikke af massen – en tung og en let sten falder lige hurtigt (uden luftmodstand).' },
    ],
    data: { h },
  };
});

// ---------- 2. Fart ved jorden ----------
const fallSpeed = gen({ id: 'b4.fald-fart', title: 'Fart ved jorden', skills: ['frit-fald'], difficulty: 2 }, (rng) => {
  const sc = rng.pick(dropScenes);
  const h = dropH(rng, sc);
  const v = Math.sqrt(2 * G * h);
  const d = decFor(v);
  return {
    kind: 'numeric',
    topic: 'Frit fald',
    prompt: `${sc.txt} $${tq(h, 'm')}$ ${sc.tail}. Med hvilken <b>fart</b> rammer den? (Se bort fra luftmodstand.)`,
    label: '|v| =',
    answer: v,
    unit: 'm/s',
    decimals: d,
    mistakes: [
      { value: 2 * G * h, why: 'Du har fundet $v^2$. Tag kvadratroden til sidst.' },
      { value: Math.sqrt(G * h), why: 'Du mangler 2-tallet: $v^2 = v_0^2 + 2gh$.' },
      { value: G * h, why: 'Tjek enheden: m/s² gange m giver m²/s². Du skal bruge $v = \\sqrt{2gh}$.' },
      { value: Math.sqrt((2 * h) / G), why: 'Det er <b>faldtiden</b> i sekunder. Farten får du fra $v^2 = 2gh$.' },
    ],
    hints: [
      'Tiden er hverken givet eller søgt. Brug formlen uden $t$: $v^2 = v_0^2 + 2a\\cdot s$ med $v_0 = 0$.',
      'Med $a = g$ og $s = h$: $v = \\sqrt{2gh}$.',
      `$v = \\sqrt{2\\cdot ${gT}\\cdot ${tq(h, 'm')}}$`,
    ],
    solution: [
      { text: 'Tiden mangler, så brug $v^2 = v_0^2 + 2as$ med $v_0 = 0$, $a = g$ og $s = h$:', math: 'v = \\sqrt{2gh}' },
      { text: 'Indsæt:', math: `v = \\sqrt{2\\cdot ${gT}\\cdot ${tq(h, 'm')}} = ${tq(v, 'm/s', d)}` },
      { aha: true, text: `Det svarer til ${fmt(v * 3.6, 0)} km/t. Farten er positiv her, fordi vi spørger om <b>farten</b>. Hastigheden ville være $${tq(-v, 'm/s', d)}$, når opad er positiv.` },
    ],
    data: { h },
  };
});

// ---------- 3. Efter t sekunders fald ----------
const afterT = gen({ id: 'b4.fald-efter-t', title: 'Fald i t sekunder', skills: ['frit-fald'], difficulty: 1 }, (rng) => {
  const t = rng.pick([0.5, 1, 1.5, 2, 2.5, 3]);
  const askS = rng.bool();
  const what = rng.pick(['En sten', 'En faldskærmsudspringer (før skærmen folder sig ud)', 'En bold']);
  if (askS) {
    const s = 0.5 * G * t * t;
    const d = decFor(s);
    return {
      kind: 'numeric',
      topic: 'Frit fald',
      prompt: `${what} slippes fra hvile. Hvor langt er den faldet efter $${tq(t, 's')}$? (Se bort fra luftmodstand.)`,
      label: 's =',
      answer: s,
      unit: 'm',
      decimals: d,
      mistakes: [
        { value: G * t * t, why: 'Du mangler ½: $s = \\tfrac12 g t^2$.' },
        { value: G * t, why: 'Det er <b>farten</b> efter $t$ sekunder ($g\\cdot t$). Strækningen er $\\tfrac12 g t^2$.' },
        { value: 0.5 * G * t, why: 'Tiden skal i anden: $s = \\tfrac12 g t^2$.' },
      ],
      hints: ['"Slippes fra hvile": $v_0 = 0$.', 'Brug $s = \\tfrac12 g t^2$.', `$s = \\tfrac12\\cdot ${gT}\\cdot (${tq(t, 's')})^2$`],
      solution: [
        { text: 'Med $v_0 = 0$ og $a = g$:', math: `s = \\tfrac12 g t^2 = \\tfrac12\\cdot ${gT}\\cdot (${tq(t, 's')})^2 = ${tq(s, 'm', d)}` },
        { aha: true, text: 'Efter 1 s er den faldet ca. 5 m, efter 2 s ca. 20 m, efter 3 s ca. 44 m. Strækningen vokser med $t^2$.' },
      ],
      data: { t, ask: 's' },
    };
  }
  const v = G * t;
  const d = decFor(v);
  return {
    kind: 'numeric',
    topic: 'Frit fald',
    prompt: `${what} slippes fra hvile. Hvor stor er farten efter $${tq(t, 's')}$? (Se bort fra luftmodstand.)`,
    label: '|v| =',
    answer: v,
    unit: 'm/s',
    decimals: d,
    mistakes: [
      { value: 0.5 * G * t * t, why: 'Det er den <b>strækning</b>, den er faldet. Farten er $v = g\\cdot t$.' },
      { value: G / t, why: 'Du har divideret. Farten vokser med $g$ <b>hvert</b> sekund: $v = g\\cdot t$.' },
    ],
    hints: ['Farten vokser med 9,82 m/s hvert sekund.', 'Brug $v = v_0 + g\\cdot t$ med $v_0 = 0$.', `$v = ${gT}\\cdot ${tq(t, 's')}$`],
    solution: [{ text: 'Med $v_0 = 0$:', math: `v = g\\cdot t = ${gT}\\cdot ${tq(t, 's')} = ${tq(v, 'm/s', d)}` }],
    data: { t, ask: 'v' },
  };
});

// ---------- 4. Maksimal højde ----------
const maxHeight = gen({ id: 'b4.kast-hoejde', title: 'Maksimal højde', skills: ['lodret-kast'], difficulty: 2 }, (rng) => {
  const v0 = rng.stepped(5, 25, 1);
  const hmax = (v0 * v0) / (2 * G);
  const d = decFor(hmax);
  const who = rng.pick(['En bold', 'En sten', 'En tennisbold', 'Et kastet æble']);
  return {
    kind: 'numeric',
    topic: 'Lodret kast',
    prompt: `${who} kastes lodret op med $${tq(v0, 'm/s')}$. Hvor højt kommer den op over udgangspunktet? (Se bort fra luftmodstand.)`,
    label: 'h =',
    answer: hmax,
    unit: 'm',
    decimals: d,
    mistakes: [
      { value: (v0 * v0) / G, why: 'Du mangler 2-tallet: i toppunktet er $0 = v_0^2 - 2g h$, så $h = \\frac{v_0^2}{2g}$.' },
      { value: v0 / G, why: 'Det er <b>tiden</b> op til toppunktet ($v_0/g$) i sekunder – ikke højden.' },
      { value: v0 / (2 * G), why: 'Starthastigheden skal i anden: $h = \\frac{v_0^2}{2g}$.' },
    ],
    hints: [
      'I toppunktet er hastigheden $v = 0$ – et kort øjeblik.',
      'Tiden er hverken givet eller søgt: brug $v^2 = v_0^2 - 2g\\cdot h$ med $v = 0$, så $h = \\frac{v_0^2}{2g}$.',
      `$h = \\frac{(${tq(v0, 'm/s')})^2}{2\\cdot ${gT}}$`,
    ],
    solution: [
      { text: 'I toppunktet er $v = 0$. Med opad positiv er $a = -g$:', math: '0 = v_0^2 - 2g\\cdot h \\quad\\Rightarrow\\quad h = \\frac{v_0^2}{2g}' },
      { text: 'Indsæt:', math: `h = \\frac{(${tq(v0, 'm/s')})^2}{2\\cdot ${gT}} = ${tq(hmax, 'm', d)}` },
      { aha: true, text: 'Dobbelt så stor kastefart giver fire gange så stor højde – ligesom med bremselængder.' },
    ],
    data: { v0 },
  };
});

// ---------- 5. Stigetid / tid i luften ----------
const throwTime = gen({ id: 'b4.kast-tid', title: 'Tid i luften', skills: ['lodret-kast'], difficulty: 2 }, (rng) => {
  const v0 = rng.stepped(4, 25, 1);
  const total = rng.bool();
  const t = ((total ? 2 : 1) * v0) / G;
  const d = decFor(t);
  return {
    kind: 'numeric',
    topic: 'Lodret kast',
    prompt: total
      ? `En bold kastes lodret op med $${tq(v0, 'm/s')}$ og gribes igen i samme højde. Hvor lang tid er bolden i luften?`
      : `En bold kastes lodret op med $${tq(v0, 'm/s')}$. Hvor lang tid går der, før den når toppunktet?`,
    label: 't =',
    answer: t,
    unit: 's',
    decimals: d,
    mistakes: total
      ? [
          { value: v0 / G, why: 'Det er kun tiden <b>op</b> til toppunktet. Turen ned tager lige så lang tid, så den samlede tid er det dobbelte.' },
          { value: v0 * G, why: 'Du har ganget. $t = \\frac{v_0}{g}$ for turen op – tjek enheden: (m/s)/(m/s²) = s.' },
        ]
      : [
          { value: (2 * v0) / G, why: 'Det er tiden for hele turen op <b>og ned</b>. Toppunktet nås halvvejs.' },
          { value: v0 * G, why: 'Du har ganget. Hastigheden falder med $g$ hvert sekund, så $t = \\frac{v_0}{g}$.' },
        ],
    hints: [
      'I toppunktet er $v = 0$. Hastigheden falder med 9,82 m/s hvert sekund.',
      total ? 'Tiden op er $\\frac{v_0}{g}$. Turen ned tager lige så lang tid (symmetri).' : 'Brug $v = v_0 - g\\cdot t$ med $v = 0$: $t = \\frac{v_0}{g}$.',
      total ? `$t = 2\\cdot\\frac{${tq(v0, 'm/s')}}{${gT}}$` : `$t = \\frac{${tq(v0, 'm/s')}}{${gT}}$`,
    ],
    solution: [
      { text: 'I toppunktet er $v = 0$:', math: `0 = v_0 - g\\cdot t_{\\text{top}} \\;\\Rightarrow\\; t_{\\text{top}} = \\frac{v_0}{g} = \\frac{${tq(v0, 'm/s')}}{${gT}} = ${tq(v0 / G, 's', decFor(v0 / G))}` },
      ...(total ? [{ text: 'Turen ned tager lige så lang tid, så i alt:', math: `t = 2\\cdot t_{\\text{top}} = ${tq(t, 's', d)}` }] : []),
      { aha: true, text: 'Et lodret kast er symmetrisk: samme tid op og ned, og bolden lander med samme fart, som den blev kastet med.' },
    ],
    data: { v0, total },
  };
});

// ---------- 6. Hastighed (med fortegn) efter t ----------
const velAfter = gen({ id: 'b4.kast-v-efter-t', title: 'Hastighed med fortegn', skills: ['lodret-kast', 'vektorer'], difficulty: 3 }, (rng) => {
  let v0 = 0, t = 0, v = 0;
  do {
    v0 = rng.stepped(8, 20, 1);
    t = rng.pick([0.5, 1, 1.5, 2, 2.5, 3]);
    v = v0 - G * t;
  } while (Math.abs(v) < 0.8);
  const d = decFor(v);
  return {
    kind: 'numeric',
    topic: 'Lodret kast',
    prompt: `En bold kastes lodret op med $${tq(v0, 'm/s')}$. Hvad er boldens <b>hastighed</b> efter $${tq(t, 's')}$? Opad er positiv – husk fortegnet.`,
    label: 'v =',
    answer: v,
    unit: 'm/s',
    decimals: d,
    mistakes: [
      { value: v0 + G * t, why: 'Tyngdeaccelerationen peger <b>nedad</b>. Med opad positiv er $a = -g$, så $v = v_0 - g\\cdot t$.' },
      { value: -v, why: v < 0 ? 'Bolden er allerede forbi toppunktet og på vej <b>ned</b> – så hastigheden er negativ.' : 'Bolden er stadig på vej op, så hastigheden er positiv.' },
      { value: G * t, why: 'Du mangler starthastigheden: $v = v_0 - g\\cdot t$.' },
    ],
    hints: [
      'Med opad som positiv retning er accelerationen $a = -9{,}82\\ \\mathrm{m/s^2}$ – hele tiden.',
      'Brug $v = v_0 - g\\cdot t$. Et negativt svar betyder, at bolden er på vej ned.',
      `$v = ${tq(v0, 'm/s')} - ${gT}\\cdot ${tq(t, 's')}$`,
    ],
    solution: [
      { text: 'Opad positiv, så $a = -g$:', math: `v = v_0 - g\\cdot t = ${tq(v0, 'm/s')} - ${gT}\\cdot ${tq(t, 's')} = ${tq(v, 'm/s', d)}` },
      { aha: true, text: v < 0 ? `Minus betyder: bolden er på vej <b>ned</b>. Den nåede toppunktet efter $${tn(v0 / G, 2)}$ s.` : 'Plus betyder: bolden er stadig på vej op.' },
    ],
    data: { v0, t },
  };
});

// ---------- 7. Højde efter t (fra altan) ----------
const heightAfter = gen({ id: 'b4.hoejde-efter-t', title: 'Højde efter t', skills: ['lodret-kast'], difficulty: 3 }, (rng) => {
  let y0 = 0, v0 = 0, t = 0, y = 0;
  do {
    y0 = rng.pick([5, 8, 10, 12, 15, 20]);
    v0 = rng.stepped(4, 15, 1);
    t = rng.pick([0.5, 1, 1.5, 2, 2.5]);
    y = y0 + v0 * t - 0.5 * G * t * t;
  } while (y < 1);
  const d = decFor(y);
  return {
    kind: 'numeric',
    topic: 'Lodret kast',
    prompt: `Fra en altan $${tq(y0, 'm')}$ over jorden kaster du en bold lodret op med $${tq(v0, 'm/s')}$. Hvor højt over jorden er bolden efter $${tq(t, 's')}$?`,
    label: 'y =',
    answer: y,
    unit: 'm',
    decimals: d,
    mistakes: [
      { value: v0 * t - 0.5 * G * t * t, why: 'Det er højden over <b>altanen</b>. Spørgsmålet er højden over jorden: læg $y_0$ til.' },
      { value: y0 + v0 * t + 0.5 * G * t * t, why: 'Tyngden trækker nedad: leddet $\\tfrac12 g t^2$ skal <b>trækkes fra</b>, når opad er positiv.' },
      { value: y0 + v0 * t - G * t * t, why: 'Du mangler ½ foran $g t^2$.' },
    ],
    hints: [
      'Sæt nulpunktet ved jorden og opad positiv. Så er $y_0 = ' + tn(y0) + '$ m og $a = -g$.',
      'Brug $y = y_0 + v_0 t - \\tfrac12 g t^2$.',
      `$y = ${tq(y0, 'm')} + ${tq(v0, 'm/s')}\\cdot ${tq(t, 's')} - \\tfrac12\\cdot ${gT}\\cdot (${tq(t, 's')})^2$`,
    ],
    solution: [
      { text: 'Nulpunkt ved jorden, opad positiv:', math: 'y = y_0 + v_0 t - \\tfrac12 g t^2' },
      { text: 'Indsæt:', math: `y = ${tn(y0)} + ${tn(v0)}\\cdot ${tn(t)} - \\tfrac12\\cdot 9{,}82\\cdot ${tn(t)}^2\\ \\mathrm{m} = ${tq(y, 'm', d)}` },
    ],
    data: { y0, v0, t },
  };
});

// ---------- 8. Begreber ----------
type Item = { prompt: string; options: Omit<ChoiceOption, 'key'>[]; skills: string[] };
const items: ((rng: Rng) => Item)[] = [
  () => ({
    skills: ['lodret-kast', 'vektorer'],
    prompt: 'En bold kastes lodret op. Hvad gælder <b>i toppunktet</b>? (Opad er positiv.)',
    options: [
      { html: '$v = 0$ og $a = -9{,}82\\ \\mathrm{m/s^2}$', correct: true, why: 'Hastigheden er 0 et kort øjeblik, men tyngden virker stadig – derfor begynder bolden at falde.' },
      { html: '$v = 0$ og $a = 0$', correct: false, why: 'En klassisk misforståelse! Hvis $a$ var 0, ville bolden blive hængende i luften.' },
      { html: '$v = 0$ og $a = +9{,}82\\ \\mathrm{m/s^2}$', correct: false, why: 'Tyngdeaccelerationen peger altid <b>nedad</b> – også i toppunktet.' },
      { html: '$v$ er størst', correct: false, why: 'Farten er mindst i toppunktet – den er 0.' },
    ],
  }),
  () => ({
    skills: ['frit-fald'],
    prompt: 'En tung og en let metalkugle slippes samtidig fra samme højde. Luftmodstanden er ubetydelig. Hvad sker der?',
    options: [
      { html: 'De rammer jorden samtidig', correct: true, why: 'Alle genstande får den samme tyngdeacceleration $g$ – massen er ligegyldig (uden luftmodstand).' },
      { html: 'Den tunge rammer først', correct: false, why: 'Det troede man før Galilei. Den tunge trækkes hårdere, men er også sværere at sætte i gang – de to effekter ophæver hinanden.' },
      { html: 'Den lette rammer først', correct: false, why: 'Der er ingen grund til, at den lette skulle falde hurtigere.' },
    ],
  }),
  () => ({
    skills: ['lodret-kast', 'vektorer'],
    prompt: 'Opad er positiv. Hvad er accelerationen for en bold, der er på vej <b>op</b> efter et kast?',
    options: [
      { html: '$-9{,}82\\ \\mathrm{m/s^2}$', correct: true, why: 'Tyngden trækker nedad, så $a$ peger nedad – også når bolden er på vej op. Derfor bliver den langsommere.' },
      { html: '$+9{,}82\\ \\mathrm{m/s^2}$', correct: false, why: 'Så ville bolden blive hurtigere og hurtigere på vej op.' },
      { html: '$0$', correct: false, why: 'Farten ændrer sig (den falder), så der er en acceleration.' },
      { html: 'Det afhænger af, hvor hårdt den kastes', correct: false, why: 'Accelerationen er altid $g$ nedad (uden luftmodstand) – uanset kastefarten.' },
    ],
  }),
  (rng) => {
    const v0 = rng.pick([8, 10, 12, 15, 18, 20]);
    return {
      skills: ['lodret-kast'],
      prompt: `En bold kastes lodret op med $${tq(v0, 'm/s')}$ og gribes i samme højde, som den blev kastet fra. Med hvilken <b>fart</b> rammer den hånden? (Uden luftmodstand.)`,
      options: [
        { html: `$${tq(v0, 'm/s')}$`, correct: true, why: 'Bevægelsen er symmetrisk: bolden mister lige så meget fart på vej op, som den får på vej ned.' },
        { html: '$0\\ \\mathrm{m/s}$', correct: false, why: 'Farten er kun 0 i toppunktet. På vej ned bliver den hurtigere igen.' },
        { html: `$${tq(2 * v0, 'm/s')}$`, correct: false, why: 'Der er intet, der giver bolden ekstra fart – den taber og vinder præcis lige meget.' },
        { html: `$${tq(v0 / 2, 'm/s')}$`, correct: false, why: 'Uden luftmodstand går der ingen energi tabt – den lander med samme fart.' },
      ],
    };
  },
  () => ({
    skills: ['lodret-kast', 'vektorer'],
    prompt: 'En bold er på vej <b>ned</b> efter et lodret kast. Hvilke pile viser hastigheden $v$ og accelerationen $a$?',
    options: [
      { html: '<span class="c-v">$v$: ↓</span> &nbsp; <span style="color:#b45309">$a$: ↓</span>', correct: true, why: 'Begge peger nedad – derfor bliver bolden hurtigere på vej ned.' },
      { html: '<span class="c-v">$v$: ↓</span> &nbsp; <span style="color:#b45309">$a$: ↑</span>', correct: false, why: 'Så ville bolden bremse på vej ned. Tyngden peger altid nedad.' },
      { html: '<span class="c-v">$v$: ↑</span> &nbsp; <span style="color:#b45309">$a$: ↓</span>', correct: false, why: 'Sådan er det på vej <b>op</b>. På vej ned peger hastigheden nedad.' },
      { html: '<span class="c-v">$v$: ↓</span> &nbsp; <span style="color:#b45309">$a = 0$</span>', correct: false, why: 'Tyngden virker hele tiden, så $a = -g$ hele vejen.' },
    ],
  }),
];

const concepts = gen({ id: 'b4.begreb', title: 'Begreber', skills: ['lodret-kast'], difficulty: 1 }, (rng) => {
  const it = rng.pick(items)(rng);
  return {
    kind: 'choice',
    topic: 'Begreber',
    skills: it.skills,
    prompt: it.prompt,
    options: rng.shuffle(it.options.map((o, i) => ({ ...o, key: 'o' + i }))),
    hints: ['Tyngdeaccelerationen peger <b>altid</b> nedad – på vej op, i toppunktet og på vej ned.', 'Uden luftmodstand er bevægelsen symmetrisk omkring toppunktet.'],
    solution: [],
  };
});

// ---------- 9. v-t-graf for et lodret kast ----------
const vtThrow = gen({ id: 'b4.vt-match', title: 'v-t-graf for et kast', skills: ['lodret-kast', 'vektorer'], difficulty: 2 }, (rng) => {
  const v0 = rng.pick([10, 12, 14, 15]);
  const T = (2 * v0) / G;
  const Tr = Math.round(T * 100) / 100;
  const motion: MotionSpec = {
    view: 'tower',
    obj: 'ball',
    pos: (t) => [0, v0 * t - 0.5 * G * t * t],
    vel: (t) => [0, v0 - G * t],
    acc: () => [0, -G],
    tMax: T,
    yRange: [0, (v0 * v0) / (2 * G) + 2],
    show: { v: true, a: true, strobe: 0.2 },
    vMax: v0,
    aMax: G,
    height: 260,
  };
  const vp = (pts: [number, number][]) => linePlot({ pts, xMax: Math.ceil(T), yLabel: 'v (m/s)', yMin: -20, yMax: 20, yStep: 10, color: C.v, compact: true });
  return {
    kind: 'choice',
    topic: 'Lodret kast',
    prompt: `En bold kastes lodret op med $${tq(v0, 'm/s')}$ og gribes igen i samme højde. Opad er positiv. Hvilken v-t-graf passer?`,
    visual: { type: 'motion', motion },
    grid: true,
    options: rng.shuffle([
      { plot: vp([[0, v0], [Tr, -v0]]), correct: true, why: `Ret linje med hældningen $-9{,}82\\ \\mathrm{m/s^2}$: hastigheden går fra $+${tn(v0)}$ gennem 0 (toppunktet) til $-${tn(v0)}$ m/s.`, key: 'ok' },
      { plot: vp([[0, v0], [Tr / 2, 0], [Tr, 0]]), correct: false, why: 'Bolden stopper ikke i toppunktet – den falder ned igen og får <b>negativ</b> hastighed.', key: 'stop' },
      { plot: vp([[0, v0], [Tr / 2, 0], [Tr, v0]]), correct: false, why: 'Det er <b>farten</b> (uden fortegn). Hastigheden skifter fortegn, når bolden vender.', key: 'fart' },
      { plot: vp([[0, -v0], [Tr, v0]]), correct: false, why: 'Opad er positiv, og bolden kastes opad – så starthastigheden er <b>positiv</b>.', key: 'flip' },
    ]),
    hints: ['Hvad er fortegnet på hastigheden på vej op? Og på vej ned?', 'Accelerationen er konstant $-g$, så v-t-grafen er en ret linje med negativ hældning.'],
    solution: [{ text: '$v = v_0 - g\\cdot t$ er en ret linje med hældningen $-g$. Den skærer t-aksen i toppunktet og ender i $-v_0$.' }],
    data: { v0 },
  };
});

export const b4Generators: Generator[] = [fallTime, fallSpeed, afterT, maxHeight, throwTime, velAfter, heightAfter, concepts, vtThrow];
