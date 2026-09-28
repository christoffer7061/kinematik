// Bane 2: Acceleration – opgavegeneratorer.

import { decFor, fmt, round, tn, tq } from '../../core/numbers';
import type { Rng } from '../../core/rng';
import { formulas, linePlot, q } from '../../exercises/build';
import type { ChoiceOption, Step } from '../../exercises/types';
import { C } from '../../viz/colors';
import type { MotionSpec } from '../../viz/scene';
import { gen, type Generator } from '../types';

const toMs = (x: number, unit: string) => (unit === 'km/t' ? x / 3.6 : x);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// ---------- 1. a = Δv/Δt (formelvælger) ----------
const accScenes = [
  { who: 'en bil på en tilkørselsrampe', unit: 'km/t', v0: [50, 60, 70, 80], dv: [30, 40, 50], t: [4, 5, 6, 8, 10] },
  { who: 'en sprinter', unit: 'm/s', v0: [0], dv: [8, 9, 10], t: [2, 2.5, 3] },
  { who: 'en bybus', unit: 'm/s', v0: [0], dv: [10, 12, 14], t: [8, 10, 12, 15] },
  { who: 'et tog', unit: 'km/t', v0: [0, 36, 72], dv: [36, 54, 72], t: [20, 30, 40, 60] },
  { who: 'en elscooter', unit: 'm/s', v0: [2, 3, 4], dv: [3, 4, 5], t: [2, 3, 4, 5] },
];

const aDef = gen({ id: 'b2.a-def', title: 'Find accelerationen', skills: ['acc', 'formelvalg'], difficulty: 1 }, (rng) => {
  const sc = rng.pick(accScenes);
  const v0 = rng.pick(sc.v0), v = v0 + rng.pick(sc.dv), t = rng.pick(sc.t);
  const kmt = sc.unit === 'km/t';
  const v0ms = toMs(v0, sc.unit), vms = toMs(v, sc.unit);
  const a = (vms - v0ms) / t;
  const d = decFor(a);
  const fromRest = v0 === 0;
  const prompt = fromRest
    ? `${cap(sc.who)} starter fra hvile og når op på $${tq(v, sc.unit)}$ på $${tq(t, 's')}$. Hvad er den gennemsnitlige acceleration?`
    : `${cap(sc.who)} øger farten fra $${tq(v0, sc.unit)}$ til $${tq(v, sc.unit)}$ på $${tq(t, 's')}$. Hvad er den gennemsnitlige acceleration?`;
  const mistakes = [
    { value: (v - v0) / t, why: `Du har regnet med km/t. Acceleration skal i m/s², så omregn først hastighederne til m/s (divider med 3,6).` },
    { value: t / (vms - v0ms), why: 'Du har divideret omvendt. Acceleration er ændring i hastighed <b>pr.</b> tid: $a = \\Delta v/\\Delta t$.' },
  ];
  if (!fromRest) mistakes.push({ value: vms / t, why: 'Du har brugt sluthastigheden alene. Det er <b>ændringen</b> i hastighed, der tæller: $\\Delta v = v - v_0$.' });
  if (!kmt) mistakes.shift();
  return {
    kind: 'formula',
    topic: 'Acceleration',
    prompt,
    quantities: rng.shuffle([q('v0', fromRest ? tq(0, sc.unit) : tq(v0, sc.unit)), q('v', tq(v, sc.unit), 'sluthastighed'), q('t', tq(t, 's')), q('a'), q('s')]),
    given: ['v0', 'v', 't'],
    sought: 'a',
    formulas: formulas(rng, 'adef', 'vst', 'sv0t'),
    numeric: { label: 'a =', answer: a, unit: 'm/s^2', decimals: d, mistakes },
    hints: [
      fromRest ? '"Fra hvile" betyder, at starthastigheden er $v_0 = 0$.' : 'Acceleration handler om, hvor meget hastigheden <b>ændrer</b> sig pr. sekund.',
      kmt ? 'Omregn begge hastigheder til m/s først (divider med 3,6). Brug så $a = \\frac{v - v_0}{t}$.' : 'Brug $a = \\frac{v - v_0}{t}$.',
      `$a = \\frac{${tq(vms, 'm/s', 2)} - ${tq(v0ms, 'm/s', 2)}}{${tq(t, 's')}}$`,
    ],
    solution: [
      ...(kmt ? [{ text: 'Omregn til m/s:', math: `v_0 = \\frac{${tn(v0)}}{3{,}6}\\ \\mathrm{m/s} = ${tq(v0ms, 'm/s', 2)},\\qquad v = \\frac{${tn(v)}}{3{,}6}\\ \\mathrm{m/s} = ${tq(vms, 'm/s', 2)}` }] : []),
      { text: 'Acceleration er ændringen i hastighed pr. tid:', math: `a = \\frac{v - v_0}{t} = \\frac{${tn(vms, 2)}\\ \\mathrm{m/s} - ${tn(v0ms, 2)}\\ \\mathrm{m/s}}{${tq(t, 's')}} = ${tq(a, 'm/s^2', d)}` },
      { aha: true, text: `Det betyder, at hastigheden vokser ca. ${fmt(a, d)} m/s <b>hvert sekund</b>. Enheden m/s² kan læses "m/s pr. sekund".` },
    ],
    data: { v0, v, t, unit: sc.unit },
  };
});

// ---------- 2. Opbremsning: negativ acceleration ----------
const brake = gen({ id: 'b2.opbremsning', title: 'Opbremsning', skills: ['acc', 'vektorer'], difficulty: 2 }, (rng) => {
  const kmt = rng.bool(0.5);
  const v0 = kmt ? rng.pick([36, 54, 72, 90, 108]) : rng.stepped(8, 30, 2);
  const unit = kmt ? 'km/t' : 'm/s';
  const t = rng.stepped(2, 6, 0.5);
  const who = rng.pick(['En bil', 'En bus', 'En motorcykel', 'En lastbil']);
  const v0ms = toMs(v0, unit);
  const a = -v0ms / t;
  const d = decFor(a);
  return {
    kind: 'numeric',
    topic: 'Opbremsning',
    prompt: `${who} kører med $${tq(v0, unit)}$ og bremser jævnt, indtil den holder stille. Opbremsningen tager $${tq(t, 's')}$. Hvad er accelerationen? Positiv retning er kørselsretningen.`,
    label: 'a =',
    answer: a,
    unit: 'm/s^2',
    decimals: d,
    mistakes: [
      { value: -a, why: 'Talværdien er rigtig, men fortegnet mangler. Farten <b>falder</b>, så accelerationen peger modsat bevægelsen: $a$ er negativ.' },
      ...(kmt ? [{ value: -v0 / t, why: 'Du har regnet med km/t. Omregn først til m/s (divider med 3,6), så enheden bliver m/s².' }, { value: v0 / t, why: 'Både enheden og fortegnet driller: omregn km/t til m/s, og husk at en opbremsning giver negativ acceleration.' }] : []),
    ],
    hints: [
      'Sluthastigheden er $v = 0$, fordi den ender med at holde stille.',
      '$a = \\frac{v - v_0}{t}$. Når $v$ er mindre end $v_0$, bliver tælleren negativ.',
      `$a = \\frac{0 - ${tq(v0ms, 'm/s', 2)}}{${tq(t, 's')}}$`,
    ],
    solution: [
      ...(kmt ? [{ text: 'Omregn:', math: `v_0 = \\frac{${tn(v0)}}{3{,}6}\\ \\mathrm{m/s} = ${tq(v0ms, 'm/s', 2)}` }] : []),
      { text: 'Sluthastigheden er 0:', math: `a = \\frac{v - v_0}{t} = \\frac{0 - ${tn(v0ms, 2)}\\ \\mathrm{m/s}}{${tq(t, 's')}} = ${tq(a, 'm/s^2', d)}` },
      { aha: true, text: 'Tænk i pile: $v$ peger fremad, men $a$ peger bagud. Når $a$ og $v$ peger hver sin vej, falder farten.' },
    ],
    data: { v0, unit, t },
  };
});

// ---------- 3. Find v = v0 + a·t ----------
const vScenes = [
  { who: 'En cyklist', the: 'cyklisten', v0: [2, 3, 4, 5, 6], a: [0.5, 0.8, 1, 1.2, 1.5], t: [3, 4, 5, 6, 8] },
  { who: 'Et tog', the: 'toget', v0: [5, 10, 15, 20], a: [0.3, 0.4, 0.5, 0.6], t: [10, 15, 20, 30] },
  { who: 'En raket', the: 'raketten', v0: [0], a: [12, 15, 20, 25], t: [3, 4, 5, 6] },
  { who: 'En bil', the: 'bilen', v0: [10, 12, 15, 20], a: [1.5, 2, 2.5, 3], t: [2, 3, 4, 5] },
];

const findV = gen({ id: 'b2.find-v', title: 'Hastighed efter tid', skills: ['acc', 'formelvalg'], difficulty: 2 }, (rng) => {
  const sc = rng.pick(vScenes);
  const v0 = rng.pick(sc.v0), a = rng.pick(sc.a), t = rng.pick(sc.t);
  const v = v0 + a * t;
  const d = decFor(v);
  const rest = v0 === 0;
  return {
    kind: 'formula',
    topic: 'Acceleration',
    prompt: rest
      ? `${sc.who} starter fra hvile og accelererer med $${tq(a, 'm/s^2')}$ i $${tq(t, 's')}$. Hvor stor er hastigheden derefter?`
      : `${sc.who} kører med $${tq(v0, 'm/s')}$ og accelererer derefter med $${tq(a, 'm/s^2')}$ i $${tq(t, 's')}$. Hvor stor er hastigheden derefter?`,
    quantities: rng.shuffle([q('v0', tq(v0, 'm/s')), q('a', tq(a, 'm/s^2')), q('t', tq(t, 's')), q('v', undefined, 'sluthastighed'), q('s')]),
    given: ['v0', 'a', 't'],
    sought: 'v',
    formulas: formulas(rng, 'vv0at', 'vst', 'sv0t'),
    numeric: {
      label: 'v =',
      answer: v,
      unit: 'm/s',
      decimals: d,
      mistakes: [
        ...(rest ? [] : [{ value: a * t, why: 'Det er kun ændringen i hastighed ($a\\cdot t$). Du skal lægge den til starthastigheden $v_0$.' }]),
        { value: v0 + a, why: 'Du har lagt accelerationen til én gang. Men den virker i alle ' + tn(t) + ' sekunder: $v = v_0 + a\\cdot t$.' },
        { value: v0 * a * t, why: 'Ganget sammen giver det ikke mening – tjek enhederne. Hastigheden vokser med $a\\cdot t$ oven i $v_0$.' },
      ],
    },
    hints: [
      rest ? '"Fra hvile" betyder $v_0 = 0$.' : 'Hvert sekund vokser hastigheden med $a$ m/s.',
      'Brug $v = v_0 + a\\cdot t$.',
      `$v = ${tq(v0, 'm/s')} + ${tq(a, 'm/s^2')}\\cdot ${tq(t, 's')}$`,
    ],
    solution: [
      { text: 'Hastigheden vokser med $a\\cdot t$ oven i starthastigheden:', math: `v = v_0 + a\\cdot t = ${tq(v0, 'm/s')} + ${tq(a, 'm/s^2')}\\cdot ${tq(t, 's')} = ${tq(v, 'm/s', d)}` },
      { aha: true, text: `Sund fornuft: det er ${fmt(v * 3.6, 0)} km/t. ${v * 3.6 > 150 ? 'Hurtigt – men realistisk for en raket.' : 'Et realistisk tal.'}` },
    ],
    data: { v0, a, t },
  };
});

// ---------- 4. Hældning på v-t-graf ----------
const vtSlope = gen({ id: 'b2.vt-haeldning', title: 'Hældning på v-t-graf', skills: ['vt-graf', 'acc'], difficulty: 2 }, (rng) => {
  let T = 0, v0 = 0, dv = 0, a = 0;
  do {
    T = rng.pick([2, 4, 5, 8, 10]);
    v0 = rng.stepped(0, 10, 2);
    dv = rng.stepped(4, 20, 2) * (rng.bool(0.35) ? -1 : 1);
    a = dv / T;
  } while (v0 + dv < 0 || round(a, 2) !== a || v0 + dv > 26);
  const v1 = v0 + dv;
  const d = decFor(a);
  const mistakes = [
    { value: T / dv, why: 'Du har divideret omvendt. Hældning = op/hen $= \\frac{\\Delta v}{\\Delta t}$.' },
    { value: dv, why: 'Det er $\\Delta v$. Divider også med $\\Delta t$ for at få ændringen <b>pr. sekund</b>.' },
  ];
  if (v0 !== 0) mistakes.unshift({ value: v1 / T, why: 'Du har brugt sluthastigheden. Men grafen starter ikke i 0 – brug ændringen $\\Delta v = v_{slut} - v_{start}$.' });
  return {
    kind: 'numeric',
    topic: 'v-t-graf',
    prompt: 'Grafen viser hastigheden af en bil som funktion af tiden. Hvad er bilens acceleration?',
    visual: { type: 'plot', plot: linePlot({ pts: [[0, v0], [T, v1]], xMax: T, yLabel: 'v (m/s)', yStep: 2, yMin: 0, yMax: Math.max(v0, v1) + 4, color: C.v }) },
    label: 'a =',
    answer: a,
    unit: 'm/s^2',
    decimals: d,
    mistakes,
    hints: ['På en v-t-graf er accelerationen lig med <b>hældningen</b>.', 'Aflæs start og slut: $a = \\frac{\\Delta v}{\\Delta t}$.', `$\\Delta v = ${tn(v1)} - ${tn(v0)}$ m/s og $\\Delta t = ${tq(T, 's')}$.`],
    solution: [
      { text: `Aflæs: $(0\\ \\mathrm{s},\\ ${tq(v0, 'm/s')})$ og $(${tq(T, 's')},\\ ${tq(v1, 'm/s')})$.` },
      { math: `a = \\frac{\\Delta v}{\\Delta t} = \\frac{${tn(v1)}\\ \\mathrm{m/s} - ${tn(v0)}\\ \\mathrm{m/s}}{${tq(T, 's')}} = ${tq(a, 'm/s^2', d)}` },
      { aha: true, text: a < 0 ? 'Grafen falder: farten bliver mindre, så accelerationen er negativ (en opbremsning).' : 'Jo stejlere v-t-graf, jo større acceleration.' },
    ],
    data: { v0, v1, T },
  };
});

// ---------- 5. Areal under v-t-graf ----------
const vtArea = gen({ id: 'b2.vt-areal', title: 'Areal under v-t-graf', skills: ['vt-graf'], difficulty: 3 }, (rng) => {
  const variant = rng.pick(['op', 'ned', 'trapez'] as const);
  let pts: [number, number][], s: number, steps: Step[], mistakes: { value: number; why: string }[];
  let V = 0, t1 = 0, T = 0, v0 = 0, v1 = 0;
  if (variant === 'trapez') {
    T = rng.pick([4, 5, 6, 8, 10]);
    v0 = rng.stepped(2, 10, 2);
    v1 = v0 + rng.stepped(2, 12, 2);
    pts = [[0, v0], [T, v1]];
    s = ((v0 + v1) / 2) * T;
    steps = [
      { text: 'Arealet er et trapez (et rektangel plus en trekant):', math: `s = v_0\\cdot t + \\tfrac12 (v - v_0)\\cdot t = ${tn(v0)}\\cdot ${tn(T)} + \\tfrac12\\cdot ${tn(v1 - v0)}\\cdot ${tn(T)} = ${tq(s, 'm')}` },
      { text: 'Eller kortere: gennemsnitshastighed gange tid:', math: `s = \\frac{v_0 + v}{2}\\cdot t = \\frac{${tn(v0)} + ${tn(v1)}}{2}\\cdot ${tn(T)}\\ \\mathrm{m} = ${tq(s, 'm')}` },
    ];
    mistakes = [
      { value: v1 * T, why: 'Du har regnet et rektangel med sluthastigheden som højde. Men grafen starter lavere – arealet er et <b>trapez</b>.' },
      { value: v0 * T, why: 'Du har kun taget rektanglet under starthastigheden med. Trekanten ovenpå hører også til arealet.' },
      { value: ((v1 - v0) * T) / 2, why: 'Du har kun taget trekanten med. Rektanglet under den hører også til.' },
    ];
  } else {
    V = rng.stepped(4, 20, 2);
    t1 = rng.pick([2, 3, 4, 5]);
    T = t1 + rng.pick([2, 3, 4, 5]);
    const tri = (V * (variant === 'op' ? t1 : T - t1)) / 2;
    const rect = V * (variant === 'op' ? T - t1 : t1);
    s = tri + rect;
    pts = variant === 'op' ? [[0, 0], [t1, V], [T, V]] : [[0, V], [t1, V], [T, 0]];
    steps = [
      { text: 'Del arealet op i en trekant og et rektangel.' },
      variant === 'op'
        ? { text: 'Trekant (accelerationen) og rektangel (konstant fart):', math: `s = \\tfrac12\\cdot ${tn(t1)}\\cdot ${tn(V)} + ${tn(T - t1)}\\cdot ${tn(V)} = ${tn(tri)} + ${tn(rect)} = ${tq(s, 'm')}` }
        : { text: 'Rektangel (konstant fart) og trekant (opbremsningen):', math: `s = ${tn(t1)}\\cdot ${tn(V)} + \\tfrac12\\cdot ${tn(T - t1)}\\cdot ${tn(V)} = ${tn(rect)} + ${tn(tri)} = ${tq(s, 'm')}` },
    ];
    mistakes = [
      { value: V * T, why: 'Du har regnet hele rektanglet $v\\cdot t$. Men grafen har en skrå del, og arealet under den er en <b>trekant</b> (halvdelen af et rektangel).' },
      { value: (V * T) / 2, why: 'Du har regnet hele figuren som én trekant. Den består af en trekant <b>og</b> et rektangel.' },
      { value: rect, why: 'Du mangler trekanten under den skrå del af grafen.' },
    ];
  }
  const what = variant === 'op' ? 'en bil, der speeder op og derefter kører med konstant fart' : variant === 'ned' ? 'en bil, der kører med konstant fart og derefter bremser' : 'en bil, der accelererer jævnt';
  return {
    kind: 'numeric',
    topic: 'Areal under v-t-graf',
    prompt: `Grafen viser hastigheden for ${what}. Hvor lang en strækning kører bilen i alt?`,
    visual: { type: 'plot', plot: linePlot({ pts, xMax: T, yLabel: 'v (m/s)', yStep: 2, yMin: 0, yMax: Math.max(...pts.map((p) => p[1])) + 4, color: C.v }) },
    label: 's =',
    answer: s,
    unit: 'm',
    decimals: decFor(s),
    mistakes,
    hints: ['Strækningen er <b>arealet</b> under v-t-grafen.', 'Del figuren op i rektangler og trekanter. Trekantens areal = ½ · grundlinje · højde.', variant === 'trapez' ? `Rektangel: $${tn(v0)}\\cdot ${tn(T)}$. Trekant: $\\tfrac12\\cdot ${tn(T)}\\cdot ${tn(v1 - v0)}$.` : `Trekanten har grundlinjen $${tn(variant === 'op' ? t1 : T - t1)}$ s og højden $${tn(V)}$ m/s.`],
    solution: [...steps, { aha: true, text: 'Enhedstjek: areal = (m/s) · s = m. Derfor er arealet under en v-t-graf en strækning.' }],
    data: { variant, V, t1, T, v0, v1 },
  };
});

// ---------- 6. Beskrivelse -> v-t-graf ----------
const vtShapes = [
  { key: 'op', pts: (V: number): [number, number][] => [[0, 0], [8, V]], means: 'hastigheden vokser jævnt fra 0 – den speeder op', text: 'En bil holder for rødt og speeder jævnt op, da lyset skifter til grønt.', motion: (V: number) => ({ s: (t: number) => (V / 16) * t * t, v: (t: number) => (V / 8) * t, a: () => V / 8 }) },
  { key: 'ned', pts: (V: number): [number, number][] => [[0, V], [8, 0]], means: 'hastigheden falder jævnt til 0 – den bremser', text: 'En cyklist bremser jævnt og stopper ved et fodgængerfelt.', motion: (V: number) => ({ s: (t: number) => V * t - (V / 16) * t * t, v: (t: number) => V - (V / 8) * t, a: () => -V / 8 }) },
  { key: 'konst', pts: (V: number): [number, number][] => [[0, V], [8, V]], means: 'hastigheden er konstant (a = 0)', text: 'Et tog kører med konstant fart på en lige strækning.', motion: (V: number) => ({ s: (t: number) => V * t, v: () => V, a: () => 0 }) },
  { key: 'bak', pts: (V: number): [number, number][] => [[0, 0], [8, -V]], means: 'hastigheden bliver mere og mere negativ – den kører hurtigere og hurtigere baglæns', text: 'En bil bakker ud af en parkeringsplads og kører hurtigere og hurtigere baglæns. Positiv retning er fremad.', motion: (V: number) => ({ s: (t: number) => -(V / 16) * t * t, v: (t: number) => -(V / 8) * t, a: () => -V / 8 }) },
];

const vtMatch = gen({ id: 'b2.graf-match', title: 'Bevægelse til v-t-graf', skills: ['vt-graf'], difficulty: 1 }, (rng) => {
  const V = rng.pick([6, 8, 10]);
  const target = rng.pick(vtShapes);
  const m = target.motion(V);
  const s0 = target.key === 'bak' ? 45 : target.key === 'konst' ? -30 : 0;
  const motion: MotionSpec = {
    view: 'track',
    obj: 'car',
    pos: (t) => [s0 + m.s(t), 0],
    vel: (t) => [m.v(t), 0],
    acc: () => [m.a(), 0],
    tMax: 8,
    xRange: [-40, 50],
    show: { v: true, a: true, strobe: 1 },
    vMax: 10,
    aMax: 1.3,
  };
  return {
    kind: 'choice',
    topic: 'v-t-graf',
    prompt: `${target.text} Hvilken v-t-graf passer?`,
    visual: { type: 'motion', motion },
    grid: true,
    options: rng.shuffle(
      vtShapes.map<ChoiceOption>((sh) => ({
        plot: linePlot({ pts: sh.pts(V), xMax: 8, yLabel: 'v (m/s)', yMin: -12, yMax: 12, yStep: 6, color: C.v, compact: true }),
        correct: sh.key === target.key,
        why: sh.key === target.key ? `Rigtigt: her ${sh.means}.` : `Denne graf viser, at ${sh.means}. Det passer ikke med bevægelsen.`,
        key: sh.key,
      })),
    ),
    hints: ['Spørg: hvad sker der med hastigheden – vokser den, falder den eller er den konstant?', 'Negativ hastighed ligger under t-aksen. Se på pilene i animationen: den lilla er $v$, den orange er $a$.'],
    solution: [{ text: `Bevægelsen: ${target.means}.` }],
    data: { key: target.key, V },
  };
});

// ---------- 7. v-t-graf -> a-t-graf ----------
const atMatch = gen({ id: 'b2.at-match', title: 'Fra v-t til a-t', skills: ['at-graf', 'vt-graf'], difficulty: 3 }, (rng) => {
  let V = 0, d1 = 0, d2 = 0, d3 = 0, a1 = 0, a3 = 0;
  do {
    V = rng.pick([6, 8, 10, 12]);
    d1 = rng.pick([2, 3, 4]);
    d2 = rng.pick([2, 3, 4]);
    d3 = rng.pick([2, 3, 4]);
    a1 = V / d1;
    a3 = -V / d3;
  } while (round(a1, 2) !== a1 || round(a3, 2) !== a3 || a1 === -a3);
  const t1 = d1, t2 = d1 + d2, T = t2 + d3;
  const lim = Math.ceil(Math.max(a1, -a3) + 1);
  const step = (A1: number, A2: number, A3: number): [number, number][] => [[0, A1], [t1, A1], [t1, A2], [t2, A2], [t2, A3], [T, A3]];
  const ap = (pts: [number, number][]) => linePlot({ pts, xMax: T, yLabel: 'a (m/s²)', yMin: -lim, yMax: lim, yStep: lim > 4 ? 2 : 1, color: C.a, compact: true });
  return {
    kind: 'choice',
    topic: 'a-t-graf',
    prompt: 'Grafen viser hastigheden af en bil, der speeder op, kører med konstant fart og til sidst bremser. Hvilken a-t-graf passer?',
    visual: { type: 'plot', plot: linePlot({ pts: [[0, 0], [t1, V], [t2, V], [T, 0]], xMax: T, yLabel: 'v (m/s)', yStep: 2, yMin: 0, yMax: V + 2, color: C.v }) },
    grid: true,
    options: rng.shuffle([
      { plot: ap(step(a1, 0, a3)), correct: true, why: `Hældningerne på v-t-grafen er ${fmt(a1, 2)}, 0 og ${fmt(a3, 2)} m/s² – præcis de tre niveauer.`, key: 'ok' },
      { plot: ap(step(a1, 0, -a3)), correct: false, why: 'Opbremsningen giver <b>negativ</b> acceleration – den sidste del skal ligge under 0.', key: 'sign' },
      { plot: ap(step(a1, a1, a3)), correct: false, why: 'I midten er v-t-grafen vandret, så hastigheden er konstant, og $a = 0$ dér.', key: 'mid' },
      { plot: ap([[0, 0], [t1, lim - 1], [t2, lim - 1], [T, 0]]), correct: false, why: 'Det er v-t-grafens form kopieret. a-t-grafen viser v-t-grafens <b>hældning</b> – og den er konstant i hvert stykke.', key: 'copy' },
    ]),
    hints: ['a-t-grafen viser <b>hældningen</b> af v-t-grafen i hvert tidsrum.', 'Ret linje på v-t-grafen = konstant hældning = vandret stykke på a-t-grafen. Faldende = negativ.'],
    solution: [
      { text: 'Hældninger på v-t-grafen:', math: `a_1 = \\frac{${tn(V)}}{${tn(d1)}} = ${tn(a1, 2)},\\quad a_2 = 0,\\quad a_3 = \\frac{-${tn(V)}}{${tn(d3)}} = ${tn(a3, 2)}\\ \\mathrm{m/s^2}` },
    ],
    data: { V, d1, d2, d3 },
  };
});

// ---------- 8. Begreber ----------
type Item = { prompt: string; options: Omit<ChoiceOption, 'key'>[]; skills: string[] };
const accItems: ((rng: Rng) => Item)[] = [
  (rng) => {
    const a = rng.pick([2, 3, 4, 1.5, 2.5]);
    return {
      skills: ['acc'],
      prompt: `En bil har accelerationen $${tq(a, 'm/s^2')}$. Hvad betyder det?`,
      options: [
        { html: `Hastigheden vokser med ${fmt(a)} m/s hvert sekund`, correct: true, why: 'Præcis: m/s² er "m/s pr. sekund".' },
        { html: `Bilen kører ${fmt(a)} m hvert sekund`, correct: false, why: `Det ville være en <b>hastighed</b> på ${fmt(a)} m/s. Acceleration fortæller, hvor meget hastigheden ændrer sig.` },
        { html: `Bilen kører med ${fmt(a)} m/s`, correct: false, why: 'Det er en hastighed. Accelerationen siger ikke, hvor hurtigt bilen kører – kun hvor hurtigt farten ændrer sig.' },
        { html: `Strækningen vokser med ${fmt(a)} m hvert sekund`, correct: false, why: 'Det ville være konstant hastighed. Ved acceleration vokser strækningen pr. sekund mere og mere.' },
      ],
    };
  },
  () => ({
    skills: ['acc'],
    prompt: 'En genstand har accelerationen $a = 0$. Hvad kan du sige om den?',
    options: [
      { html: 'Hastigheden er konstant – den kan sagtens være forskellig fra 0', correct: true, why: '$a = 0$ betyder bare, at hastigheden ikke ændrer sig.' },
      { html: 'Den står stille', correct: false, why: 'Stilstand giver $a = 0$ – men det gør konstant hastighed også (fx en bil på motorvej med fartpilot).' },
      { html: 'Den bremser', correct: false, why: 'Opbremsning betyder, at hastigheden ændrer sig – så $a \\neq 0$.' },
      { html: 'Den bevæger sig i negativ retning', correct: false, why: 'Retningen afhænger af hastigheden, ikke af om $a$ er 0.' },
    ],
  }),
  () => ({
    skills: ['acc', 'vektorer'],
    prompt: 'Positiv retning er fremad. En bil kører <b>baglæns</b> ($v < 0$) og bremser. Hvilket fortegn har accelerationen?',
    options: [
      { html: 'Positivt', correct: true, why: 'At bremse betyder, at $a$ peger modsat $v$. Hastigheden peger bagud (negativ), så $a$ peger fremad (positiv).' },
      { html: 'Negativt', correct: false, why: 'Bremsning er ikke altid negativ! Den peger modsat hastigheden – og her er hastigheden negativ.' },
      { html: 'Nul', correct: false, why: 'Hastigheden ændrer sig (den bliver mindre), så $a \\neq 0$.' },
    ],
  }),
  () => ({
    skills: ['acc', 'vektorer'],
    prompt: 'En bil kører mod højre og <b>bremser</b>. Hvilke pile viser hastigheden $v$ og accelerationen $a$?',
    options: [
      { html: '<span class="c-v">$v$: →</span> &nbsp; <span style="color:#b45309">$a$: ←</span>', correct: true, why: 'Bilen kører mod højre, men farten falder – så $a$ peger den modsatte vej.' },
      { html: '<span class="c-v">$v$: →</span> &nbsp; <span style="color:#b45309">$a$: →</span>', correct: false, why: 'Når $v$ og $a$ peger samme vej, stiger farten. Her bremser bilen.' },
      { html: '<span class="c-v">$v$: ←</span> &nbsp; <span style="color:#b45309">$a$: →</span>', correct: false, why: 'Hastigheden peger altid i bevægelsens retning – her mod højre.' },
      { html: '<span class="c-v">$v$: →</span> &nbsp; <span style="color:#b45309">$a = 0$</span>', correct: false, why: 'Farten ændrer sig, så der er en acceleration.' },
    ],
  }),
  () => ({
    skills: ['acc'],
    prompt: 'Kan en genstand have hastigheden $v = 0$ og samtidig en acceleration forskellig fra 0?',
    options: [
      { html: 'Ja – fx i det øjeblik en bil starter fra hvile, eller når noget vender', correct: true, why: 'Hastigheden er 0 et kort øjeblik, men den er ved at ændre sig – derfor er $a \\neq 0$.' },
      { html: 'Nej, når $v = 0$, er $a$ også 0', correct: false, why: 'Tænk på en bil, der starter: i starten er $v = 0$, men den accelererer allerede.' },
      { html: 'Kun hvis den bevæger sig baglæns', correct: false, why: 'Retningen er ikke afgørende. Det vigtige er, om hastigheden er ved at ændre sig.' },
    ],
  }),
];

const concepts = gen({ id: 'b2.begreb', title: 'Begreber om acceleration', skills: ['acc'], difficulty: 1 }, (rng) => {
  const it = rng.pick(accItems)(rng);
  return {
    kind: 'choice',
    topic: 'Begreber',
    skills: it.skills,
    prompt: it.prompt,
    options: rng.shuffle(it.options.map((o, i) => ({ ...o, key: 'o' + i }))),
    hints: ['Acceleration = hvor meget hastigheden ændrer sig pr. sekund.', 'Peger $a$ samme vej som $v$, stiger farten. Peger de modsat, falder farten.'],
    solution: [],
  };
});

// ---------- 9. Tegn v-t-grafen ----------
const drawVt = gen({ id: 'b2.tegn-vt', title: 'Tegn en v-t-graf', skills: ['vt-graf', 'acc'], difficulty: 3 }, (rng) => {
  const brakeFirst = rng.bool(0.45);
  let xs: number[], target: number[], prompt: string, steps: Step[];
  if (!brakeFirst) {
    const v0 = rng.pick([0, 2, 4, 6]);
    const a = rng.pick([1, 2, 3]);
    const t1 = rng.pick([2, 3, 4]);
    const T = t1 + rng.pick([3, 4]);
    xs = [0, t1, T];
    target = [v0, v0 + a * t1, v0 + a * t1];
    prompt = `En bil kører med $${tq(v0, 'm/s')}$ og accelererer med $${tq(a, 'm/s^2')}$ i $${tq(t1, 's')}$. Derefter kører den med konstant hastighed indtil $t = ${tq(T, 's')}$. Tegn v-t-grafen.`;
    steps = [
      { text: `Start: $v = ${tq(v0, 'm/s')}$ ved $t = 0$.` },
      { text: `Efter $${tq(t1, 's')}$:`, math: `v = v_0 + a\\cdot t = ${tn(v0)} + ${tn(a)}\\cdot ${tn(t1)} = ${tq(target[1], 'm/s')}` },
      { text: 'Derefter konstant: vandret linje.' },
    ];
  } else {
    const k = rng.pick([2, 3, 4]);
    const dStop = rng.pick([2, 3, 4]);
    const V = k * dStop;
    const t1 = rng.pick([2, 3, 4]);
    xs = [0, t1, t1 + dStop];
    target = [V, V, 0];
    prompt = `En bil kører med den konstante hastighed $${tq(V, 'm/s')}$ i $${tq(t1, 's')}$. Så bremser den med $a = ${tq(-k, 'm/s^2')}$, indtil den holder stille. Tegn v-t-grafen.`;
    steps = [
      { text: `Først konstant $${tq(V, 'm/s')}$: vandret linje til $t = ${tq(t1, 's')}$.` },
      { text: 'Opbremsningen tager', math: `t = \\frac{0 - ${tn(V)}}{${tn(-k)}}\\ \\mathrm{s} = ${tq(dStop, 's')}` },
      { text: `Så grafen går ret ned til 0 ved $t = ${tq(t1 + dStop, 's')}$.` },
    ];
  }
  const yMax = Math.max(12, Math.ceil((Math.max(...target) + 2) / 2) * 2);
  return {
    kind: 'draw',
    topic: 'Tegn grafen',
    prompt,
    plot: { xLabel: 't (s)', yLabel: 'v (m/s)', xMax: xs[xs.length - 1], xStep: 1, yMin: 0, yMax, yStep: 1, series: [] },
    handleXs: xs,
    startYs: xs.map(() => Math.round(yMax / 2)),
    target,
    snap: 1,
    yName: 'hastigheden',
    yUnit: 'm/s',
    slopeName: 'accelerationen',
    slopeUnit: 'm/s^2',
    hints: [
      'Start ved $t = 0$: hvad er hastigheden?',
      'Hældningen på v-t-grafen er accelerationen. Konstant hastighed = vandret. Hvor længe tager en opbremsning? $t = \\Delta v / a$.',
      `Punkterne skal ligge i: ${xs.map((x, i) => `$(${tn(x)},\\ ${tn(target[i])})$`).join(', ')}.`,
    ],
    solution: steps,
    data: { brakeFirst },
  };
});

export const b2Generators: Generator[] = [aDef, brake, findV, vtSlope, vtArea, vtMatch, atMatch, concepts, drawVt];
