// Bane 1: Grundbegreber og konstant hastighed – opgavegeneratorer.
// Hver generator laver en ny variant ud fra et seed (rng), med hints, typiske fejl og løsning.

import { decFor, fmt, round, tn, tq } from '../../core/numbers';
import type { Rng } from '../../core/rng';
import { formulas, linePlot, q } from '../../exercises/build';
import type { ChoiceOption } from '../../exercises/types';
import { C } from '../../viz/colors';
import { gen, type Generator } from '../types';

// ---------- 1. Omregning km/t -> m/s ----------
const kmtScenes = [
  { txt: 'En bil kører gennem byen med farten', min: 30, max: 60, step: 5 },
  { txt: 'En bil kører på landevejen med farten', min: 70, max: 90, step: 5 },
  { txt: 'En bil kører på motorvejen med farten', min: 100, max: 130, step: 5 },
  { txt: 'En cyklist kører med farten', min: 12, max: 32, step: 1 },
  { txt: 'Et IC-tog kører med farten', min: 100, max: 180, step: 10 },
  { txt: 'En løber holder farten', min: 8, max: 18, step: 1 },
];

const kmtToMs = gen({ id: 'b1.kmt-ms', title: 'km/t til m/s', skills: ['enheder'], difficulty: 1 }, (rng) => {
  const sc = rng.pick(kmtScenes);
  const kmt = rng.stepped(sc.min, sc.max, sc.step);
  const ms = kmt / 3.6;
  const d = decFor(ms);
  return {
    kind: 'numeric',
    topic: 'Enheder',
    prompt: `${sc.txt} $${tq(kmt, 'km/t')}$. Hvad er farten i m/s?`,
    label: 'v =',
    answer: ms,
    unit: 'm/s',
    decimals: d,
    mistakes: [
      { value: kmt * 3.6, why: 'Du har ganget med 3,6. Men 1 m/s er <b>mere</b> end 1 km/t (3,6 gange mere), så tallet i m/s skal være <b>mindre</b>. Divider med 3,6.' },
      { value: (kmt * 1000) / 60, why: 'Du har lavet km om til m, men divideret med 60. En time er 60 · 60 = 3600 sekunder.' },
      { value: kmt / 60, why: 'Du har divideret med 60 – men en time er 3600 s, og km skal også laves om til m. Samlet svarer det til at dividere med 3,6.' },
    ],
    hints: [
      'Spørg dig selv: hvor mange <b>meter</b> kører den på ét <b>sekund</b>? 1 km = 1000 m og 1 time = 3600 s.',
      '$1\\ \\mathrm{km/t} = \\frac{1000\\ \\mathrm{m}}{3600\\ \\mathrm{s}} = \\frac{1}{3{,}6}\\ \\mathrm{m/s}$. Du skal altså <b>dividere</b> med 3,6.',
      `$v = \\frac{${tn(kmt)}}{3{,}6}\\ \\mathrm{m/s}$`,
    ],
    solution: [
      { text: 'Én kilometer er 1000 m, og én time er 3600 s:', math: '1\\ \\mathrm{km/t} = \\frac{1000\\ \\mathrm{m}}{3600\\ \\mathrm{s}} = \\frac{1}{3{,}6}\\ \\mathrm{m/s}' },
      { text: 'Derfor dividerer vi med 3,6:', math: `v = \\frac{${tn(kmt)}}{3{,}6}\\ \\mathrm{m/s} = ${tq(ms, 'm/s', d)}` },
      { aha: true, text: `Sund fornuft: på ét sekund kører den ca. ${fmt(ms, 0)} m. Tallet i m/s er altid det <b>mindste</b> af de to.` },
    ],
    data: { kmt },
  };
});

// ---------- 2. Omregning m/s -> km/t ----------
const msScenes = [
  { txt: 'En sprinter løber med topfarten', min: 9, max: 12, step: 0.5 },
  { txt: 'En gepard kan løbe med farten', min: 25, max: 31, step: 1 },
  { txt: 'Under en storm blæser vinden med', min: 20, max: 32, step: 1 },
  { txt: 'Et elløbehjul kører med farten', min: 4, max: 7, step: 0.5 },
  { txt: 'Et passagerfly flyver med farten', min: 220, max: 260, step: 10 },
];

const msToKmt = gen({ id: 'b1.ms-kmt', title: 'm/s til km/t', skills: ['enheder'], difficulty: 1 }, (rng) => {
  const sc = rng.pick(msScenes);
  const ms = rng.stepped(sc.min, sc.max, sc.step);
  const kmt = ms * 3.6;
  const d = decFor(kmt);
  return {
    kind: 'numeric',
    topic: 'Enheder',
    prompt: `${sc.txt} $${tq(ms, 'm/s')}$. Hvad er det i km/t?`,
    label: 'v =',
    answer: kmt,
    unit: 'km/t',
    decimals: d,
    mistakes: [
      { value: ms / 3.6, why: 'Du har divideret med 3,6. Fra m/s til km/t skal tallet blive <b>større</b> (1 m/s er jo mere end 1 km/t), så du skal gange med 3,6.' },
      { value: ms * 60, why: 'Du har ganget med 60 – det giver meter pr. minut. Til km/t: gang med 3600 (sekunder pr. time) og divider med 1000 (meter pr. km). Samlet: · 3,6.' },
      { value: ms * 3600, why: 'Det er meter pr. <b>time</b>. Divider med 1000 for at få kilometer pr. time.' },
    ],
    hints: [
      'På én time (3600 s) kommer den 3600 gange så langt som på ét sekund. Og 1000 m er 1 km.',
      'Fra m/s til km/t: <b>gang</b> med 3,6.',
      `$v = ${tn(ms)} \\cdot 3{,}6\\ \\mathrm{km/t}$`,
    ],
    solution: [
      { text: 'På en time kommer den 3600 gange længere end på et sekund, og det skal deles med 1000 for at blive km:', math: `v = ${tn(ms)}\\ \\mathrm{\\tfrac{m}{s}} \\cdot \\frac{3600}{1000} = ${tn(ms)} \\cdot 3{,}6\\ \\mathrm{km/t}` },
      { math: `v = ${tq(kmt, 'km/t', d)}` },
      { aha: true, text: 'Huskeregel: km/t-tallet er altid det <b>største</b>. Gang med 3,6 den ene vej, divider den anden.' },
    ],
    data: { ms },
  };
});

// ---------- 3. Begreber (multiple choice med tilfældige tal) ----------
type ChoiceItem = { prompt: string; options: Omit<ChoiceOption, 'key'>[]; skills: string[] };

function opts(list: Omit<ChoiceOption, 'key'>[]): ChoiceOption[] {
  return list.map((o, i) => ({ ...o, key: (o.html ?? '') + '#' + i }));
}

const conceptItems: ((rng: Rng) => ChoiceItem)[] = [
  (rng) => {
    const d = rng.stepped(150, 800, 50);
    return {
      skills: ['begreber'],
      prompt: `Du går $${tq(d, 'm')}$ hen til bageren og samme vej hjem igen. Hvad er din <b>forskydning</b> for hele turen?`,
      options: [
        { html: '$0\\ \\mathrm{m}$', correct: true, why: 'Forskydningen er pilen fra start til slut – og du ender samme sted, som du startede.' },
        { html: `$${tq(2 * d, 'm')}$`, correct: false, why: 'Det er <b>strækningen</b> – den vej, du faktisk har gået. Forskydningen måler kun fra start til slut.' },
        { html: `$${tq(d, 'm')}$`, correct: false, why: 'Det er afstanden til bageren. Men du går hjem igen, og forskydningen måler fra start til <b>slut</b>.' },
        { html: `$${tq(-d, 'm')}$`, correct: false, why: 'Hjemturen ophæver udturen præcis: $+' + tn(d) + '\\ \\mathrm{m} + (-' + tn(d) + '\\ \\mathrm{m}) = 0$.' },
      ],
    };
  },
  (rng) => {
    const a = rng.stepped(30, 90, 10);
    const b = rng.stepped(10, a - 10, 10);
    const askDisp = rng.bool();
    const disp = a - b, dist = a + b;
    return {
      skills: ['begreber', 'vektorer'],
      prompt: `En bil kører $${tq(a, 'm')}$ frem (positiv retning) og bakker derefter $${tq(b, 'm')}$ tilbage. Hvad er bilens <b>${askDisp ? 'forskydning' : 'strækning'}</b>?`,
      options: askDisp
        ? [
            { html: `$${tq(disp, 'm')}$`, correct: true, why: `Forskydning = slut − start: $${tn(a)} - ${tn(b)} = ${tn(disp)}$ m. Bilen ender ${tn(disp)} m foran startstedet.` },
            { html: `$${tq(dist, 'm')}$`, correct: false, why: 'Det er strækningen (hvad kilometertælleren viser). Forskydningen tager højde for retningen: tilbagekørslen trækkes fra.' },
            { html: `$${tq(-disp, 'm')}$`, correct: false, why: 'Fortegnet er forkert: bilen ender <b>foran</b> startstedet, altså i positiv retning.' },
            { html: `$${tq(a, 'm')}$`, correct: false, why: 'Det er kun den første del af turen. Bilen bakker bagefter, så den ender tættere på start.' },
          ]
        : [
            { html: `$${tq(dist, 'm')}$`, correct: true, why: `Strækningen er hele den tilbagelagte vej: $${tn(a)} + ${tn(b)} = ${tn(dist)}$ m. Retningen er ligegyldig.` },
            { html: `$${tq(disp, 'm')}$`, correct: false, why: 'Det er forskydningen (slut minus start). Strækningen tæller alle meter, bilen har kørt – også dem baglæns.' },
            { html: `$${tq(-disp, 'm')}$`, correct: false, why: 'Strækning er aldrig negativ – den er som en kilometertæller.' },
            { html: `$${tq(a, 'm')}$`, correct: false, why: 'Du mangler de meter, bilen bakkede. De tæller også med i strækningen.' },
          ],
    };
  },
  (rng) => {
    const v = rng.pick([50, 60, 70, 80, 90, 110]);
    return {
      skills: ['begreber', 'vektorer'],
      prompt: `To biler kører begge $${tq(v, 'km/t')}$ på den samme lige vej, men i hver sin retning. Hvilket udsagn er rigtigt?`,
      options: [
        { html: 'Samme fart, forskellig hastighed', correct: true, why: 'Fart er kun størrelsen. Hastighed er en <b>vektor</b> med retning – her fx $+' + tn(v) + '$ og $-' + tn(v) + '$ km/t.' },
        { html: 'Samme fart og samme hastighed', correct: false, why: 'Hastighed har også en retning. Modsatte retninger giver forskellige hastigheder, selvom farten er ens.' },
        { html: 'Forskellig fart, samme hastighed', correct: false, why: 'Farten er størrelsen uden retning – og den er ens (' + tn(v) + ' km/t).' },
        { html: 'Forskellig fart og forskellig hastighed', correct: false, why: 'Farten er ens – det er kun retningen, der er forskellig.' },
      ],
    };
  },
  (rng) => {
    const v = rng.pick([3, 4, 5, 6, 7, 8, 12]);
    const left = rng.bool();
    return {
      skills: ['vektorer'],
      prompt: `Positiv retning er mod <b>højre</b>. En cyklist kører mod <b>${left ? 'venstre' : 'højre'}</b> med farten $${tq(v, 'm/s')}$. Hvad er cyklistens hastighed $v$?`,
      options: [
        { html: `$v = ${tq(left ? -v : v, 'm/s')}$`, correct: true, why: left ? 'Bevægelsen er mod den negative retning, så hastigheden får et minus.' : 'Bevægelsen er i positiv retning, så hastigheden er positiv.' },
        { html: `$v = ${tq(left ? v : -v, 'm/s')}$`, correct: false, why: `Fortegnet viser retningen. Mod ${left ? 'venstre er negativ' : 'højre er positiv'} retning her.` },
        { html: '$v = 0\\ \\mathrm{m/s}$', correct: false, why: 'Cyklisten bevæger sig – så hastigheden kan ikke være 0.' },
      ],
    };
  },
  () => ({
    skills: ['vektorer', 'begreber'],
    prompt: 'Hvilken af disse størrelser er en <b>vektor</b> – altså har både en størrelse og en retning?',
    options: [
      { html: 'Hastighed', correct: true, why: 'Hastighed fortæller både hvor hurtigt og i hvilken retning. Derfor tegner vi den som en pil.' },
      { html: 'Fart', correct: false, why: 'Fart er kun størrelsen af hastigheden – uden retning.' },
      { html: 'Strækning', correct: false, why: 'Strækning er den samlede vej, uden retning. Dens "vektor-tvilling" er forskydningen.' },
      { html: 'Tid', correct: false, why: 'Tid har ingen retning i rummet – det er et almindeligt tal (en skalar).' },
    ],
  }),
  (rng) => {
    const T = rng.pick([60, 70, 80, 90, 100, 120]);
    return {
      skills: ['begreber'],
      prompt: `Du løber én omgang på en 400 m-atletikbane på $${tq(T, 's')}$ og ender præcis, hvor du startede. Hvad er din gennemsnits<b>hastighed</b>?`,
      options: [
        { html: '$0\\ \\mathrm{m/s}$', correct: true, why: 'Gennemsnitshastighed = forskydning / tid. Forskydningen er 0, fordi du ender, hvor du startede.' },
        { html: `$${tq(400 / T, 'm/s', 2)}$`, correct: false, why: 'Det er din gennemsnits<b>fart</b> (strækning / tid). Hastigheden bruger forskydningen, og den er 0.' },
        { html: `$${tq(T / 400, 'm/s', 2)}$`, correct: false, why: 'Her er der divideret omvendt (tid / strækning) – og hastigheden bruger desuden forskydningen, som er 0.' },
      ],
    };
  },
];

const concepts = gen({ id: 'b1.begreb', title: 'Begreber', skills: ['begreber'], difficulty: 1 }, (rng) => {
  const it = rng.pick(conceptItems)(rng);
  return {
    kind: 'choice',
    topic: 'Begreber',
    skills: it.skills,
    prompt: it.prompt,
    options: rng.shuffle(opts(it.options)),
    hints: [
      'Strækning = hele den tilbagelagte vej. Forskydning = pilen fra start til slut (med fortegn).',
      'Fart = hvor hurtigt. Hastighed = hvor hurtigt <b>og</b> i hvilken retning (fortegnet viser retningen).',
    ],
    solution: [],
  };
});

// ---------- 4. Forskydning på en tallinje ----------
const displacement = gen({ id: 'b1.forskydning', title: 'Forskydning med fortegn', skills: ['begreber', 'vektorer'], difficulty: 1 }, (rng) => {
  let A = 0, B = 0;
  do {
    A = rng.stepped(-40, 40, 5);
    B = rng.stepped(-40, 40, 5);
  } while (Math.abs(B - A) < 15 || (A >= 0 && B >= 0 && rng.bool(0.6)));
  const ds = B - A;
  return {
    kind: 'numeric',
    topic: 'Forskydning',
    prompt: 'En bil kører på en lige vej fra punkt <b>A</b> til punkt <b>B</b>. Positiv retning er mod højre. Hvad er bilens forskydning $\\Delta s$?',
    visual: { type: 'numberline', nl: { min: -50, max: 50, step: 10, points: [{ x: A, label: 'A', color: C.ink }, { x: B, label: 'B', color: C.s }] } },
    label: '\\Delta s =',
    answer: ds,
    unit: 'm',
    decimals: 0,
    mistakes: [
      { value: A - B, why: 'Du har regnet start minus slut. Forskydning er <b>slut minus start</b>: $\\Delta s = s_B - s_A$.' },
      { value: Math.abs(B) - Math.abs(A), why: 'Pas på fortegnene: et punkt til venstre for 0 har en <b>negativ</b> position.' },
      { value: B, why: 'Det er B\'s position. Forskydningen er <b>ændringen</b> i position fra A til B.' },
    ],
    hints: [
      'Aflæs positionerne af A og B på tallinjen – husk minus til venstre for 0.',
      'Forskydning = slut minus start: $\\Delta s = s_B - s_A$.',
      `$\\Delta s = ${tn(B)}\\ \\mathrm{m} - (${tn(A)}\\ \\mathrm{m})$`,
    ],
    solution: [
      { text: `Aflæs: $s_A = ${tq(A, 'm')}$ og $s_B = ${tq(B, 'm')}$.` },
      { text: 'Forskydning er slut minus start:', math: `\\Delta s = s_B - s_A = ${tn(B)}\\ \\mathrm{m} - (${tn(A)}\\ \\mathrm{m}) = ${tq(ds, 'm')}` },
      { aha: true, text: `Fortegnet er retningen: ${ds > 0 ? 'plus betyder mod højre' : 'minus betyder mod venstre'}. Tænk på forskydningen som en pil fra A til B.` },
    ],
    data: { A, B },
  };
});

// ---------- 5. Find v = s/t (formelvælger) ----------
const runs = [
  { who: 'En løber', verb: 'løber', gen: 'løberens', sOpts: [100, 200, 400, 800], vMin: 5, vMax: 8 },
  { who: 'En svømmer', verb: 'svømmer', gen: 'svømmerens', sOpts: [50, 100, 200], vMin: 1.2, vMax: 1.9 },
  { who: 'En cyklist', verb: 'cykler', gen: 'cyklistens', sOpts: [500, 1000, 1500, 2000], vMin: 6, vMax: 11 },
  { who: 'En skildpadde', verb: 'kravler', gen: 'skildpaddens', sOpts: [2, 3, 4, 5], vMin: 0.05, vMax: 0.12 },
];

const findV = gen({ id: 'b1.find-v', title: 'Find hastigheden', skills: ['v-s-t', 'formelvalg'], difficulty: 2 }, (rng) => {
  const sc = rng.pick(runs);
  const s = rng.pick(sc.sOpts);
  const vT = sc.vMin + rng.next() * (sc.vMax - sc.vMin);
  const t = Math.max(2, Math.round(s / vT));
  const v = s / t;
  const d = decFor(v);
  return {
    kind: 'formula',
    topic: 'Konstant hastighed',
    prompt: `${sc.who} ${sc.verb} $${tq(s, 'm')}$ på $${tq(t, 's')}$. Hvad er ${sc.gen} gennemsnitsfart?`,
    quantities: rng.shuffle([q('s', tq(s, 'm')), q('t', tq(t, 's')), q('v', undefined, 'fart / hastighed'), q('a')]),
    given: ['s', 't'],
    sought: 'v',
    formulas: formulas(rng, 'vst', 'vstWrong1', 'vstWrong2'),
    numeric: {
      label: 'v =',
      answer: v,
      unit: 'm/s',
      decimals: d,
      mistakes: [
        { value: t / s, why: 'Du har regnet $t/s$ – sekunder pr. meter. Fart er meter <b>pr.</b> sekund: $v = s/t$.' },
        { value: s * t, why: 'Du har ganget. Fart er strækning <b>divideret</b> med tid – tjek enheden: m/s.' },
      ],
    },
    hints: [
      'Givet: en strækning og en tid. Søgt: en fart.',
      'Fart er meter pr. sekund: $v = \\frac{s}{t}$.',
      `$v = \\frac{${tq(s, 'm')}}{${tq(t, 's')}}$`,
    ],
    solution: [
      { text: `Givet: $s = ${tq(s, 'm')}$ og $t = ${tq(t, 's')}$. Søgt: $v$.` },
      { text: 'Formel for konstant (gennemsnits-)hastighed:', math: 'v = \\frac{s}{t}' },
      { text: 'Indsæt med enheder:', math: `v = \\frac{${tq(s, 'm')}}{${tq(t, 's')}} = ${tq(v, 'm/s', d)}` },
      { aha: true, text: `Enhedstjek: m divideret med s giver m/s. ✔ På ét sekund ${sc.verb} ${sc.who.toLowerCase()} ca. ${fmt(v, d)} m.` },
    ],
    data: { s, t },
  };
});

// ---------- 6. Find s = v·t (med min -> s) ----------
const sScenes = [
  { who: 'Et tog', the: 'toget', vOpts: [20, 25, 30, 35, 40], tUnit: 'min', tOpts: [1.5, 2, 2.5, 3, 4, 5] },
  { who: 'En bil', the: 'bilen', vOpts: [12, 15, 20, 25, 30], tUnit: 's', tOpts: [8, 12, 15, 20, 30, 45] },
  { who: 'En cyklist', the: 'cyklisten', vOpts: [4, 5, 6, 7, 8], tUnit: 'min', tOpts: [5, 10, 15, 20] },
];

const findS = gen({ id: 'b1.find-s', title: 'Find strækningen', skills: ['v-s-t', 'formelvalg'], difficulty: 2 }, (rng) => {
  const sc = rng.pick(sScenes);
  const v = rng.pick(sc.vOpts);
  const tIn = rng.pick(sc.tOpts);
  const tSec = sc.tUnit === 'min' ? tIn * 60 : tIn;
  const s = v * tSec;
  const conv = sc.tUnit === 'min';
  return {
    kind: 'formula',
    topic: 'Konstant hastighed',
    prompt: `${sc.who} kører med den konstante hastighed $${tq(v, 'm/s')}$ i $${tq(tIn, sc.tUnit)}$. Hvor langt kører ${sc.the}?`,
    quantities: rng.shuffle([q('v', tq(v, 'm/s')), q('t', tq(tIn, sc.tUnit)), q('s'), q('a')]),
    given: ['v', 't'],
    sought: 's',
    formulas: formulas(rng, 'vst', 'vstWrong1', 'vstWrong2'),
    numeric: {
      label: 's =',
      answer: s,
      unit: 'm',
      decimals: 0,
      mistakes: [
        ...(conv ? [{ value: v * tIn, why: `Du har ganget med tiden i <b>minutter</b>. Omregn først til sekunder: $t = ${tq(tIn, 'min')} = ${tq(tSec, 's')}$.` }] : []),
        { value: v / tSec, why: 'Du har divideret. Isolér $s$ i $v = s/t$ ved at gange begge sider med $t$: $s = v\\cdot t$.' },
        { value: tSec / v, why: 'Det er $t/v$ – enheden bliver s²/m. Strækning = hastighed gange tid.' },
      ],
    },
    hints: [
      conv ? 'Hastigheden er i m/s, men tiden er i minutter. Omregn tiden til sekunder først.' : 'Givet: hastighed og tid. Søgt: strækning.',
      'Isolér $s$ i $v = \\frac{s}{t}$: gang begge sider med $t$, så $s = v\\cdot t$.',
      `$s = ${tq(v, 'm/s')} \\cdot ${tq(tSec, 's')}$`,
    ],
    solution: [
      ...(conv ? [{ text: 'Omregn tiden til sekunder:', math: `t = ${tq(tIn, 'min')} = ${tn(tIn)}\\cdot 60\\ \\mathrm{s} = ${tq(tSec, 's')}` }] : []),
      { text: 'Isolér $s$ i $v = s/t$:', math: 's = v\\cdot t' },
      { text: 'Indsæt:', math: `s = ${tq(v, 'm/s')} \\cdot ${tq(tSec, 's')} = ${tq(s, 'm')}${s >= 1000 ? ` = ${tq(s / 1000, 'km')}` : ''}` },
      { aha: true, text: 'Enhedstjek: $\\mathrm{\\tfrac{m}{s}}\\cdot\\mathrm{s} = \\mathrm{m}$ – sekunderne går ud med hinanden. ✔' },
    ],
    data: { v, tSec },
  };
});

// ---------- 7. Find t = s/v ----------
const findT = gen({ id: 'b1.find-t', title: 'Find tiden', skills: ['v-s-t', 'formelvalg'], difficulty: 2 }, (rng) => {
  const kind = rng.pick(['torden', 'motorvej', 'løb'] as const);
  if (kind === 'torden') {
    const km = rng.stepped(0.5, 3.5, 0.1);
    const s = km * 1000;
    const t = s / 343;
    const d = decFor(t);
    return {
      kind: 'formula',
      topic: 'Konstant hastighed',
      prompt: `Du ser et lyn, og lidt efter hører du tordenen. Lynet slog ned $${tq(km, 'km')}$ væk, og lyd bevæger sig med $${tq(343, 'm/s')}$. Hvor lang tid går der, før du hører tordenen? (Lyset når frem næsten med det samme.)`,
      quantities: rng.shuffle([q('s', tq(km, 'km')), q('v', tq(343, 'm/s'), 'lydens hastighed'), q('t'), q('a')]),
      given: ['s', 'v'],
      sought: 't',
      formulas: formulas(rng, 'vst', 'vstWrong1', 'vstWrong2'),
      numeric: {
        label: 't =',
        answer: t,
        unit: 's',
        decimals: d,
        mistakes: [
          { value: km / 343, why: `Du har brugt strækningen i km. Omregn først: $${tq(km, 'km')} = ${tq(s, 'm')}$, så enhederne passer med m/s.` },
          { value: 343 / s, why: 'Du har divideret omvendt. Isolér $t$ i $v = s/t$: $t = s/v$.' },
          { value: 343 * s, why: 'Du har ganget. Tid = strækning divideret med hastighed.' },
        ],
      },
      hints: [
        'Omregn strækningen til meter, så den passer med m/s.',
        'Isolér $t$ i $v = \\frac{s}{t}$: $t = \\frac{s}{v}$.',
        `$t = \\frac{${tq(s, 'm')}}{${tq(343, 'm/s')}}$`,
      ],
      solution: [
        { text: 'Omregn til meter:', math: `s = ${tq(km, 'km')} = ${tq(s, 'm')}` },
        { text: 'Isolér $t$:', math: 't = \\frac{s}{v}' },
        { text: 'Indsæt:', math: `t = \\frac{${tq(s, 'm')}}{${tq(343, 'm/s')}} = ${tq(t, 's', d)}` },
        { aha: true, text: 'Tommelfingerregel: ca. 3 sekunder pr. kilometer. Tæl sekunder fra lyn til torden og divider med 3 – så har du afstanden i km.' },
      ],
      data: { case: 'torden', km },
    };
  }
  if (kind === 'motorvej') {
    const kmt = rng.pick([80, 90, 100, 110, 120]);
    const km = rng.pick([20, 30, 40, 45, 60, 75, 90]);
    const tMin = (km / kmt) * 60;
    const d = decFor(tMin);
    return {
      kind: 'formula',
      topic: 'Konstant hastighed',
      prompt: `Du skal køre $${tq(km, 'km')}$ på motorvejen med den konstante fart $${tq(kmt, 'km/t')}$. Hvor mange <b>minutter</b> tager turen?`,
      quantities: rng.shuffle([q('s', tq(km, 'km')), q('v', tq(kmt, 'km/t')), q('t'), q('a')]),
      given: ['s', 'v'],
      sought: 't',
      formulas: formulas(rng, 'vst', 'vstWrong1', 'vstWrong2'),
      numeric: {
        label: 't =',
        answer: tMin,
        unit: 'min',
        decimals: d,
        mistakes: [
          { value: km / kmt, why: `Det er tiden i <b>timer</b> ($${tn(km / kmt, 3)}$ t). Spørgsmålet vil have minutter: gang med 60.` },
          { value: (kmt / km) * 60, why: 'Du har divideret omvendt. Isolér $t$: $t = s/v$.' },
          { value: km / (kmt / 3.6), why: 'Du har omregnet farten til m/s, men beholdt km. Når s er i km og v i km/t, kan du regne direkte – så får du timer.' },
        ],
      },
      hints: [
        'Når strækningen er i km og farten i km/t, giver $t = s/v$ tiden i <b>timer</b>.',
        'Isolér $t$ i $v = \\frac{s}{t}$: $t = \\frac{s}{v}$. Gang bagefter med 60 for at få minutter.',
        `$t = \\frac{${tq(km, 'km')}}{${tq(kmt, 'km/t')}} = ${tn(km / kmt, 3)}\\ \\mathrm{t}$`,
      ],
      solution: [
        { text: 'Isolér $t$:', math: 't = \\frac{s}{v}' },
        { text: 'Med km og km/t får vi timer:', math: `t = \\frac{${tq(km, 'km')}}{${tq(kmt, 'km/t')}} = ${tn(km / kmt, 3)}\\ \\mathrm{t}` },
        { text: 'Omregn til minutter:', math: `t = ${tn(km / kmt, 3)} \\cdot 60\\ \\mathrm{min} = ${tq(tMin, 'min', d)}` },
        { aha: true, text: 'Du behøver ikke altid omregne til SI-enheder – bare enhederne passer sammen (km med km/t giver timer).' },
      ],
      data: { case: 'motorvej', km, kmt },
    };
  }
  const v = rng.pick([2.5, 3, 4, 5, 6]);
  const s = rng.pick([400, 800, 1200, 1500, 3000, 5000]);
  const t = s / v;
  return {
    kind: 'formula',
    topic: 'Konstant hastighed',
    prompt: `En løber holder den konstante fart $${tq(v, 'm/s')}$. Hvor lang tid tager det at løbe $${tq(s, 'm')}$?`,
    quantities: rng.shuffle([q('s', tq(s, 'm')), q('v', tq(v, 'm/s'), 'fart / hastighed'), q('t'), q('a')]),
    given: ['s', 'v'],
    sought: 't',
    formulas: formulas(rng, 'vst', 'vstWrong1', 'vstWrong2'),
    numeric: {
      label: 't =',
      answer: t,
      unit: 's',
      decimals: decFor(t),
      mistakes: [
        { value: v / s, why: 'Du har divideret omvendt. Isolér $t$ i $v = s/t$: $t = s/v$.' },
        { value: v * s, why: 'Du har ganget. Tid = strækning divideret med fart.' },
      ],
    },
    hints: ['Givet: fart og strækning. Søgt: tid.', 'Isolér $t$ i $v = \\frac{s}{t}$: $t = \\frac{s}{v}$.', `$t = \\frac{${tq(s, 'm')}}{${tq(v, 'm/s')}}$`],
    solution: [
      { text: 'Isolér $t$:', math: 't = \\frac{s}{v}' },
      { text: 'Indsæt:', math: `t = \\frac{${tq(s, 'm')}}{${tq(v, 'm/s')}} = ${tq(t, 's', decFor(t))}${t >= 120 ? ` = ${tq(t / 60, 'min', 2)}` : ''}` },
      { aha: true, text: 'Enhedstjek: $\\mathrm{m} / \\mathrm{\\tfrac{m}{s}} = \\mathrm{s}$. ✔' },
    ],
    data: { case: 'løb', s, v },
  };
});

// ---------- 8. Gennemsnitsfart med omregning ----------
const speedConv = gen({ id: 'b1.fart-omregning', title: 'Fart med omregning', skills: ['v-s-t', 'enheder'], difficulty: 3 }, (rng) => {
  const km = rng.stepped(2, 8, 0.5);
  const target = rng.stepped(4, 7, 0.5);
  const min = Math.max(5, Math.round((km * 1000) / target / 60));
  const s = km * 1000, t = min * 60;
  const v = s / t;
  const d = decFor(v);
  const kmt = km / (min / 60);
  return {
    kind: 'numeric',
    topic: 'Fart og enheder',
    prompt: `Du cykler $${tq(km, 'km')}$ til skole på $${tq(min, 'min')}$. Hvad er din gennemsnitsfart i <b>m/s</b>?`,
    label: 'v =',
    answer: v,
    unit: 'm/s',
    decimals: d,
    mistakes: [
      { value: km / min, why: 'Det er km pr. minut. Omregn begge størrelser til SI-enheder først: meter og sekunder.' },
      { value: s / min, why: 'Du har omregnet km til m, men tiden står stadig i minutter. $1\\ \\mathrm{min} = 60\\ \\mathrm{s}$.' },
      { value: km / t, why: 'Tiden er omregnet til sekunder, men strækningen står stadig i km. $1\\ \\mathrm{km} = 1000\\ \\mathrm{m}$.' },
      { value: kmt, why: `Det er farten i <b>km/t</b>. Du skal have m/s – divider med 3,6 (eller regn i m og s fra starten).` },
    ],
    hints: [
      'Omregn til SI-enheder først: strækning i meter, tid i sekunder.',
      `$s = ${tq(km, 'km')} = ${tq(s, 'm')}$ og $t = ${tq(min, 'min')} = ${tq(t, 's')}$.`,
      `$v = \\frac{${tq(s, 'm')}}{${tq(t, 's')}}$`,
    ],
    solution: [
      { text: 'Omregn til meter og sekunder:', math: `s = ${tq(s, 'm')},\\qquad t = ${tn(min)}\\cdot 60\\ \\mathrm{s} = ${tq(t, 's')}` },
      { text: 'Brug $v = s/t$:', math: `v = \\frac{${tq(s, 'm')}}{${tq(t, 's')}} = ${tq(v, 'm/s', d)}` },
      { aha: true, text: `Kontrol: i km/t er det $${tn(v, d)}\\cdot 3{,}6 \\approx ${tn(v * 3.6, 0)}$ km/t – en helt realistisk cykelfart.` },
    ],
    data: { km, min },
  };
});

// ---------- 9. Aflæs hastighed som hældning ----------
const who = ['en løber', 'en cyklist', 'en hund', 'et legetøjstog', 'en rulleskøjteløber'];

const stSlope = gen({ id: 'b1.st-haeldning', title: 'Hældning på s-t-graf', skills: ['st-graf'], difficulty: 2 }, (rng) => {
  let T = 0, ds = 0, v = 0;
  do {
    T = rng.pick([4, 5, 8, 10]);
    ds = rng.stepped(20, 80, 10) * (rng.bool(0.3) ? -1 : 1);
    v = ds / T;
  } while (round(v, 2) !== v || Math.abs(v) > 12);
  const s0 = ds > 0 ? rng.stepped(0, 40, 10) : rng.stepped(-ds, -ds + 30, 10);
  const s1 = s0 + ds;
  const w = rng.pick(who);
  const d = decFor(v);
  const mistakes = [
    { value: T / ds, why: 'Du har divideret omvendt. Hældning = <b>op</b> divideret med <b>hen</b>: $\\frac{\\Delta s}{\\Delta t}$.' },
    { value: ds, why: 'Det er $\\Delta s$ – hvor langt den flytter sig. Du skal også dividere med $\\Delta t$ for at få meter pr. sekund.' },
  ];
  if (s0 !== 0) mistakes.unshift({ value: s1 / T, why: 'Du har brugt slutpositionen divideret med tiden. Men grafen starter ikke i 0 – brug <b>ændringen</b>: $\\Delta s = s_{slut} - s_{start}$.' });
  return {
    kind: 'numeric',
    topic: 's-t-graf',
    prompt: `Grafen viser positionen $s$ af ${w} som funktion af tiden $t$. Hvad er hastigheden $v$? (Husk fortegn, hvis grafen går nedad.)`,
    visual: { type: 'plot', plot: linePlot({ pts: [[0, s0], [T, s1]], xMax: T, yLabel: 's (m)', yStep: 10, yMax: Math.max(s0, s1) + 10 }) },
    label: 'v =',
    answer: v,
    unit: 'm/s',
    decimals: d,
    mistakes,
    hints: [
      'På en s-t-graf er hastigheden lig med <b>hældningen</b>.',
      'Hældning = $\\frac{\\Delta s}{\\Delta t}$. Aflæs start- og slutpunktet på linjen.',
      `$\\Delta s = ${tn(s1)}\\ \\mathrm{m} - ${tn(s0)}\\ \\mathrm{m}$ og $\\Delta t = ${tq(T, 's')}$.`,
    ],
    solution: [
      { text: `Aflæs to punkter: $(0\\ \\mathrm{s},\\ ${tq(s0, 'm')})$ og $(${tq(T, 's')},\\ ${tq(s1, 'm')})$.` },
      { text: 'Hældningen er hastigheden:', math: `v = \\frac{\\Delta s}{\\Delta t} = \\frac{${tn(s1)}\\ \\mathrm{m} - ${tn(s0)}\\ \\mathrm{m}}{${tq(T, 's')}} = \\frac{${tq(ds, 'm')}}{${tq(T, 's')}} = ${tq(v, 'm/s', d)}` },
      { aha: true, text: v < 0 ? 'Grafen går nedad, så positionen bliver mindre: bevægelsen er i negativ retning, og hastigheden er negativ.' : 'Jo stejlere s-t-graf, jo større hastighed. En vandret graf betyder stilstand.' },
    ],
    data: { s0, s1, T },
  };
});

// ---------- 10. Aflæs bevægelse på stykvis s-t-graf ----------
const segRead = gen({ id: 'b1.graf-aflaes', title: 'Læs en s-t-graf', skills: ['st-graf'], difficulty: 2 }, (rng) => {
  const qType = rng.pick(['stille', 'hurtigst', 'tilbage'] as const);
  const dur = [rng.pick([2, 3, 4]), rng.pick([2, 3, 4]), rng.pick([2, 3, 4])];
  let vs: number[];
  if (qType === 'stille') vs = rng.shuffle([0, rng.pick([2, 3]), rng.pick([4, 5])]);
  else if (qType === 'tilbage') vs = rng.shuffle([rng.pick([-3, -2, -4]), rng.pick([0, 2]), rng.pick([4, 5])]);
  else {
    const mags = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 3);
    vs = mags.map((m) => (rng.bool(0.25) ? -m : m));
  }
  const times = [0, dur[0], dur[0] + dur[1], dur[0] + dur[1] + dur[2]];
  const cum = [0];
  vs.forEach((v, i) => cum.push(cum[i] + v * dur[i]));
  const s0 = Math.ceil(Math.max(0, -Math.min(...cum)) / 5) * 5 + rng.pick([0, 5, 10]);
  const pts = times.map((t, i) => [t, s0 + cum[i]] as [number, number]);
  const labels = [0, 1, 2].map((i) => `$${tn(times[i])}$–$${tn(times[i + 1])}\\ \\mathrm{s}$`);
  const w = rng.pick(['en hund', 'en person på gåtur', 'en fjernstyret bil', 'en cyklist']);
  const best = qType === 'stille' ? vs.indexOf(0) : qType === 'tilbage' ? vs.findIndex((v) => v < 0) : vs.map(Math.abs).indexOf(Math.max(...vs.map(Math.abs)));
  const question = {
    stille: `I hvilket tidsrum står ${w} <b>stille</b>?`,
    tilbage: `I hvilket tidsrum bevæger ${w} sig i <b>negativ</b> retning (tilbage)?`,
    hurtigst: `I hvilket tidsrum bevæger ${w} sig <b>hurtigst</b>?`,
  }[qType];
  const why = (i: number) => {
    const v = vs[i];
    if (i === best) {
      if (qType === 'stille') return 'Grafen er vandret: positionen ændrer sig ikke, så hastigheden er 0.';
      if (qType === 'tilbage') return `Grafen går nedad – positionen bliver mindre. Hastigheden er ${fmt(v)} m/s.`;
      return `Det er den stejleste del af grafen: farten er ${fmt(Math.abs(v))} m/s.`;
    }
    if (qType === 'stille') return `Her hælder grafen – hastigheden er ${fmt(v)} m/s. Stilstand ses som en <b>vandret</b> graf.`;
    if (qType === 'tilbage') return v === 0 ? 'Her er grafen vandret – der står den stille.' : 'Her går grafen <b>opad</b> – positionen bliver større, så bevægelsen er i positiv retning.';
    return `Her er farten kun ${fmt(Math.abs(v))} m/s. Kig efter den <b>stejleste</b> del – uanset om grafen går op eller ned.`;
  };
  return {
    kind: 'choice',
    topic: 's-t-graf',
    prompt: `Grafen viser positionen af ${w}. ${question}`,
    visual: { type: 'plot', plot: linePlot({ pts, xMax: times[3], yLabel: 's (m)', yStep: 5, pad: 5 }) },
    options: [0, 1, 2].map((i) => ({ html: labels[i], correct: i === best, why: why(i), key: 'i' + i })),
    hints: ['Hældningen af en s-t-graf er hastigheden.', 'Vandret = stille. Opad = positiv retning. Nedad = negativ retning. Stejlere = hurtigere.'],
    solution: [
      { text: `Hastighederne (hældningerne) i de tre tidsrum er: ${vs.map((v, i) => `${labels[i]}: $${tq(v, 'm/s')}$`).join(', ')}.` },
    ],
    data: { qType, best },
  };
});

// ---------- 11. Match bevægelse og graf ----------
const motionMatch = gen({ id: 'b1.graf-match', title: 'Match bevægelse og graf', skills: ['st-graf'], difficulty: 2 }, (rng) => {
  const T = 8;
  const v = rng.pick([2, 3, 4, 5, 6, 8]) * (rng.bool(0.4) ? -1 : 1);
  if (rng.bool(0.55)) {
    // Variant A: bevægelse -> s-t-graf
    const s0 = v > 0 ? rng.stepped(0, Math.max(0, 100 - 8 * v), 10) : rng.stepped(Math.ceil((-8 * v) / 10) * 10, 100, 10);
    const alt = s0 === 0 ? 40 : 0;
    const plot = (pts: [number, number][]) => linePlot({ pts, xMax: T, yLabel: 's (m)', yMin: 0, yMax: 100, yStep: 25, compact: true });
    const dirTxt = v > 0 ? 'positiv retning (mod højre)' : 'negativ retning (mod venstre)';
    return {
      kind: 'choice',
      topic: 'Graf og bevægelse',
      prompt: `Bilen starter ved $s = ${tq(s0, 'm')}$ og kører med konstant hastighed i ${dirTxt}. Hvilken s-t-graf passer?`,
      visual: {
        type: 'motion',
        motion: { view: 'track', obj: 'car', pos: (t) => [s0 + v * t, 0], vel: () => [v, 0], tMax: T, xRange: [0, 100], show: { v: true, strobe: 1 }, vMax: 8 },
      },
      grid: true,
      options: rng.shuffle([
        { plot: plot([[0, s0], [T, s0 + v * T]]), correct: true, why: `Ret linje fra ${fmt(s0)} m, der går ${v > 0 ? 'opad' : 'nedad'}: konstant hastighed i ${v > 0 ? 'positiv' : 'negativ'} retning.`, key: 'ok' },
        { plot: plot([[0, s0], [T, s0 - v * T]]), correct: false, why: `Denne graf går den forkerte vej. Når bilen kører i ${dirTxt}, bliver positionen ${v > 0 ? 'større – grafen skal gå <b>opad</b>' : 'mindre – grafen skal gå <b>nedad</b>'}.`, key: 'flip' },
        { plot: plot([[0, s0], [T, s0]]), correct: false, why: 'En vandret s-t-graf betyder, at positionen ikke ændrer sig – en bil, der holder stille.', key: 'flat' },
        { plot: plot([[0, alt], [T, alt + v * T]]), correct: false, why: `Hældningen passer, men grafen starter i ${fmt(alt)} m. Bilen starter ved ${fmt(s0)} m.`, key: 'alt' },
      ]),
      hints: ['Se først på startpunktet: hvor er bilen ved $t = 0$?', 'Kører bilen mod højre, bliver $s$ større (grafen går op). Mod venstre bliver $s$ mindre (grafen går ned).'],
      solution: [{ text: `Grafen skal starte i $s = ${tq(s0, 'm')}$ og være en ret linje med hældningen $v = ${tq(v, 'm/s')}$ – altså ${v > 0 ? 'opad' : 'nedad'}.` }],
      data: { variant: 'A', s0, v },
    };
  }
  // Variant B: s-t-graf -> v-t-graf
  const s0 = v > 0 ? rng.stepped(0, 30, 10) : Math.ceil((-8 * v) / 10) * 10 + rng.stepped(0, 20, 10);
  const vplot = (pts: [number, number][]) => linePlot({ pts, xMax: T, yLabel: 'v (m/s)', yMin: -10, yMax: 10, yStep: 5, color: C.v, compact: true });
  const sgn = Math.sign(v);
  return {
    kind: 'choice',
    topic: 'Graf og bevægelse',
    prompt: 'Grafen viser $s$ som funktion af $t$ for en bil. Hvilken v-t-graf hører til den samme bevægelse?',
    visual: { type: 'plot', plot: linePlot({ pts: [[0, s0], [T, s0 + v * T]], xMax: T, yLabel: 's (m)', yStep: 10 }) },
    grid: true,
    options: rng.shuffle([
      { plot: vplot([[0, v], [T, v]]), correct: true, why: `s-t-grafen er en ret linje med hældningen ${fmt(v)} m/s, så hastigheden er konstant ${fmt(v)} m/s.`, key: 'ok' },
      { plot: vplot([[0, -v], [T, -v]]), correct: false, why: `Fortegnet er forkert: s-t-grafen går ${v > 0 ? 'opad, så hastigheden er positiv' : 'nedad, så hastigheden er negativ'}.`, key: 'neg' },
      { plot: vplot([[0, 0], [T, 0]]), correct: false, why: 'v = 0 ville betyde, at s-t-grafen var vandret (stilstand).', key: 'zero' },
      { plot: vplot([[0, 0], [T, 8 * sgn]]), correct: false, why: 'Denne v-t-graf ændrer sig – så ville bilen accelerere. En <b>ret</b> s-t-graf betyder konstant hastighed: vandret v-t-graf.', key: 'copy' },
    ]),
    hints: ['v-t-grafen viser <b>hældningen</b> af s-t-grafen – ikke selve positionen.', `Beregn hældningen: $v = \\frac{\\Delta s}{\\Delta t}$.`],
    solution: [
      { text: 'Hældningen af s-t-grafen:', math: `v = \\frac{\\Delta s}{\\Delta t} = \\frac{${tn(v * T)}\\ \\mathrm{m}}{${tq(T, 's')}} = ${tq(v, 'm/s')}` },
      { text: 'Hastigheden er konstant, så v-t-grafen er en vandret linje i den højde.' },
    ],
    data: { variant: 'B', s0, v },
  };
});

// ---------- 12. Tegn s-t-grafen ----------
const drawSt = gen({ id: 'b1.tegn-st', title: 'Tegn en s-t-graf', skills: ['st-graf'], difficulty: 3 }, (rng) => {
  const variant = rng.pick(['konstant', 'stille-først', 'stille-sidst'] as const);
  const w = rng.pick(['en cyklist', 'en løber', 'en fjernstyret bil', 'en hund']);
  let xs: number[], target: number[], prompt: string, steps: { text?: string; math?: string }[];
  if (variant === 'konstant') {
    const T = 5;
    const v = rng.pick([1, 2, 3, 4, 5, 6, -1, -2, -3, -4]);
    const s0 = v > 0 ? rng.stepped(0, 20, 5) : rng.stepped(-v * T, 40, 5);
    xs = [0, T];
    target = [s0, s0 + v * T];
    prompt = `Tegn s-t-grafen for ${w}, der starter ved $s = ${tq(s0, 'm')}$ og bevæger sig med den konstante hastighed $v = ${tq(v, 'm/s')}$ i $${tq(T, 's')}$.`;
    steps = [
      { text: `Startpunkt: ved $t = 0$ er $s = ${tq(s0, 'm')}$.` },
      { text: 'Slutpunkt:', math: `s = s_0 + v\\cdot t = ${tn(s0)}\\ \\mathrm{m} + (${tq(v, 'm/s')})\\cdot ${tq(T, 's')} = ${tq(target[1], 'm')}` },
      { text: 'Konstant hastighed giver en ret linje mellem de to punkter.' },
    ];
  } else {
    const t1 = rng.pick([2, 3, 4]);
    const T = t1 + 5;
    const v = rng.pick([1, 2, 3, 4, -1, -2, -3]);
    const moveFirst = variant === 'stille-sidst';
    const s0 = v > 0 ? rng.stepped(0, 15, 5) : rng.stepped(-v * 5, 35, 5);
    xs = moveFirst ? [0, 5, T] : [0, t1, T];
    target = moveFirst ? [s0, s0 + v * 5, s0 + v * 5] : [s0, s0, s0 + v * 5];
    prompt = moveFirst
      ? `${w[0].toUpperCase() + w.slice(1)} starter ved $s = ${tq(s0, 'm')}$ og bevæger sig med $v = ${tq(v, 'm/s')}$ i 5 s. Derefter står den stille indtil $t = ${tq(T, 's')}$. Tegn s-t-grafen.`
      : `${w[0].toUpperCase() + w.slice(1)} står stille ved $s = ${tq(s0, 'm')}$ i $${tq(t1, 's')}$. Derefter bevæger den sig med $v = ${tq(v, 'm/s')}$ indtil $t = ${tq(T, 's')}$. Tegn s-t-grafen.`;
    steps = [
      { text: `Start i $s = ${tq(s0, 'm')}$.` },
      moveFirst
        ? { text: `Første 5 s: hældning ${fmt(v)} m/s, så $s$ ændres med $${tn(v)}\\cdot 5 = ${tn(v * 5)}$ m til $${tq(target[1], 'm')}$.` }
        : { text: `Til $t = ${tq(t1, 's')}$: stilstand = vandret linje i $${tq(s0, 'm')}$.` },
      moveFirst
        ? { text: 'Derefter stilstand: vandret linje resten af tiden.' }
        : { text: `Sidste 5 s: hældning ${fmt(v)} m/s, så $s$ ændres med $${tn(v * 5)}$ m til $${tq(target[2], 'm')}$.` },
    ];
  }
  const yMax = Math.max(40, Math.ceil((Math.max(...target) + 5) / 10) * 10);
  return {
    kind: 'draw',
    topic: 'Tegn grafen',
    prompt,
    plot: { xLabel: 't (s)', yLabel: 's (m)', xMax: xs[xs.length - 1], xStep: 1, yMin: 0, yMax, yStep: 5, series: [] },
    handleXs: xs,
    startYs: xs.map(() => Math.round(yMax / 2 / 5) * 5),
    target,
    snap: 5,
    yName: 'positionen',
    yUnit: 'm',
    slopeName: 'hastigheden',
    slopeUnit: 'm/s',
    hints: [
      'Start med punktet ved $t = 0$: hvor er den til at begynde med?',
      'Hældningen er hastigheden: med $v$ m/s ændrer $s$ sig $v$ meter hvert sekund. Stilstand = vandret.',
      `Punkterne skal ligge i: ${xs.map((x, i) => `$(${tn(x)},\\ ${tn(target[i])})$`).join(', ')}.`,
    ],
    solution: steps,
    data: { variant },
  };
});

export const b1Generators: Generator[] = [kmtToMs, msToKmt, concepts, displacement, findV, findS, findT, speedConv, stSlope, segRead, motionMatch, drawSt];
