// Bane 3: Konstant acceleration – de fire bevægelsesligninger og formelvalg.
// Et fælles scenariebibliotek bruges både til regneopgaver og til "vælg formlen"-opgaver.

import { decFor, fmt, round, tn, tq } from '../../core/numbers';
import type { Rng } from '../../core/rng';
import { F, formulas, q } from '../../exercises/build';
import type { ChoiceOption, Mistake, NumericPart, Step } from '../../exercises/types';
import type { MotionSpec } from '../../viz/scene';
import { C } from '../../viz/colors';
import { gen, type Generator } from '../types';

export type Sym = 'v0' | 'v' | 'a' | 't' | 's';
export const SYM_TEX: Record<Sym, string> = { v0: 'v_0', v: 'v', a: 'a', t: 't', s: 's' };
export const SYM_NAME: Record<Sym, string> = { v0: 'starthastigheden', v: 'sluthastigheden', a: 'accelerationen', t: 'tiden', s: 'strækningen' };
/** Formlen der IKKE indeholder den manglende størrelse */
export const FORMULA_FOR_MISSING: Record<Sym, string> = { s: 'vv0at', v: 'sv0t', t: 'v2', a: 'savg', v0: '' };
const ALL: Sym[] = ['v0', 'v', 'a', 't', 's'];

interface KinCase {
  prompt: string;
  given: Sym[];
  sought: Sym;
  values: Partial<Record<Sym, string>>;
  numeric: NumericPart;
  insert: string; // TeX: formlen med tal sat ind
  pre?: Step[]; // fx omregninger
  aha?: string;
  data: Record<string, number | string>;
}

const missingOf = (c: KinCase) => ALL.find((x) => x !== c.sought && !c.given.includes(x))!;

// ---------- scenariebyggere ----------
const accCtx = [
  { who: 'En bil', v0: [0, 5, 10, 15], a: [1.5, 2, 2.5, 3], t: [3, 4, 5, 6, 8] },
  { who: 'En cyklist', v0: [2, 3, 4], a: [0.4, 0.5, 0.8, 1], t: [4, 5, 6, 8, 10] },
  { who: 'En skiløber', v0: [0, 1, 2], a: [1.2, 1.5, 2, 2.4], t: [5, 8, 10] },
];

const startTxt = (v0: number) => (v0 === 0 ? 'starter fra hvile' : `kører med $${tq(v0, 'm/s')}$`);

const builders: Record<string, (rng: Rng) => KinCase> = {
  'v-fra-t': (rng) => {
    const c = rng.pick(accCtx);
    const v0 = rng.pick(c.v0), a = rng.pick(c.a), t = rng.pick(c.t);
    const v = v0 + a * t;
    const mistakes: Mistake[] = [{ value: v0 + a, why: `Accelerationen virker i alle ${fmt(t)} sekunder – gang med $t$.` }];
    if (v0) mistakes.push({ value: a * t, why: 'Det er kun <b>ændringen</b> i hastighed. Læg starthastigheden $v_0$ til.' });
    return {
      prompt: `${c.who} ${startTxt(v0)} og accelererer derefter jævnt med $${tq(a, 'm/s^2')}$ i $${tq(t, 's')}$. Hvor stor er hastigheden til sidst?`,
      given: ['v0', 'a', 't'],
      sought: 'v',
      values: { v0: tq(v0, 'm/s'), a: tq(a, 'm/s^2'), t: tq(t, 's') },
      numeric: { label: 'v =', answer: v, unit: 'm/s', decimals: decFor(v), mistakes },
      insert: `v = ${tq(v0, 'm/s')} + ${tq(a, 'm/s^2')}\\cdot ${tq(t, 's')} = ${tq(v, 'm/s', decFor(v))}`,
      data: { type: 'v-fra-t', v0, a, t },
    };
  },
  's-fra-t': (rng) => {
    const c = rng.pick(accCtx);
    const v0 = rng.pick(c.v0), a = rng.pick(c.a), t = rng.pick(c.t);
    const s = v0 * t + 0.5 * a * t * t;
    const mistakes: Mistake[] = [
      { value: v0 * t + a * t * t, why: 'Du har glemt faktoren ½ foran $a\\cdot t^2$. Den kommer fra, at trekanten under v-t-grafen er et <b>halvt</b> rektangel.' },
      { value: v0 * t + 0.5 * a * t, why: 'Tiden skal i <b>anden</b> i sidste led: $\\tfrac12 a\\cdot t^2$.' },
    ];
    if (v0) mistakes.push({ value: v0 * t, why: 'Du har kun medtaget $v_0\\cdot t$. Men bilen accelererer, så den kører længere: læg $\\tfrac12 a t^2$ til.' });
    if (v0) mistakes.push({ value: 0.5 * a * t * t, why: 'Du har glemt $v_0\\cdot t$ – den strækning, den ville have kørt alene med starthastigheden.' });
    return {
      prompt: `${c.who} ${startTxt(v0)} og accelererer derefter jævnt med $${tq(a, 'm/s^2')}$ i $${tq(t, 's')}$. Hvor lang en strækning tilbagelægger den i den tid?`,
      given: ['v0', 'a', 't'],
      sought: 's',
      values: { v0: tq(v0, 'm/s'), a: tq(a, 'm/s^2'), t: tq(t, 's') },
      numeric: { label: 's =', answer: s, unit: 'm', decimals: decFor(s), mistakes },
      insert: `s = ${tq(v0, 'm/s')}\\cdot ${tq(t, 's')} + \\tfrac12\\cdot ${tq(a, 'm/s^2')}\\cdot (${tq(t, 's')})^2 = ${tq(s, 'm', decFor(s))}`,
      data: { type: 's-fra-t', v0, a, t },
    };
  },
  'v-fra-s': (rng) => {
    const v0 = rng.pick([0, 10, 12, 15, 20]), a = rng.pick([1.5, 2, 2.5, 3]), s = rng.pick([50, 75, 100, 150]);
    const v = Math.sqrt(v0 * v0 + 2 * a * s);
    const mistakes: Mistake[] = [{ value: v * v, why: 'Du har fundet $v^2$. Husk at tage <b>kvadratroden</b> til sidst.' }];
    if (v0) {
      mistakes.push({ value: Math.sqrt(2 * a * s), why: 'Du har glemt $v_0^2$ under kvadratroden. Bilen havde jo fart i forvejen.' });
      mistakes.push({ value: v0 + Math.sqrt(2 * a * s), why: 'Man må ikke tage kvadratroden af hvert led for sig: $\\sqrt{v_0^2 + 2as} \\neq v_0 + \\sqrt{2as}$.' });
    }
    return {
      prompt: `En bil ${startTxt(v0)} og accelererer jævnt med $${tq(a, 'm/s^2')}$ over en strækning på $${tq(s, 'm')}$. Hvor stor er farten ved strækningens slutning?`,
      given: ['v0', 'a', 's'],
      sought: 'v',
      values: { v0: tq(v0, 'm/s'), a: tq(a, 'm/s^2'), s: tq(s, 'm') },
      numeric: { label: 'v =', answer: v, unit: 'm/s', decimals: decFor(v), mistakes },
      insert: `v = \\sqrt{(${tq(v0, 'm/s')})^2 + 2\\cdot ${tq(a, 'm/s^2')}\\cdot ${tq(s, 'm')}} = ${tq(v, 'm/s', decFor(v))}`,
      data: { type: 'v-fra-s', v0, a, s },
    };
  },
  'a-fra-s': (rng) => {
    const brake = rng.bool(0.5);
    let v0 = 0, v = 0, s = 0, a = 0;
    do {
      v0 = brake ? rng.pick([10, 15, 20, 25]) : rng.pick([10, 15, 20]);
      v = brake ? 0 : v0 + rng.pick([5, 10, 15]);
      s = brake ? rng.pick([20, 25, 30, 40, 50]) : rng.pick([100, 150, 200, 250]);
      a = (v * v - v0 * v0) / (2 * s);
    } while (Math.abs(a) > 9 || Math.abs(a) < 0.3);
    const mistakes: Mistake[] = [
      { value: (v * v - v0 * v0) / s, why: 'Du mangler 2-tallet: $a = \\frac{v^2 - v_0^2}{2s}$.' },
      { value: ((v - v0) * (v - v0)) / (2 * s), why: 'Du har kvadreret forskellen $(v - v_0)^2$. Det er hver hastighed for sig, der skal i anden: $v^2 - v_0^2$.' },
    ];
    if (brake) mistakes.push({ value: -a, why: 'Talværdien er rigtig, men fortegnet mangler: farten falder, så accelerationen er <b>negativ</b>.' });
    return {
      prompt: brake
        ? `En bil kører med $${tq(v0, 'm/s')}$ og bremser jævnt, så den holder stille efter $${tq(s, 'm')}$. Hvad er accelerationen? (Positiv retning er kørselsretningen.)`
        : `En bil kører ud på motorvejen og øger jævnt farten fra $${tq(v0, 'm/s')}$ til $${tq(v, 'm/s')}$ på en strækning af $${tq(s, 'm')}$. Hvad er accelerationen?`,
      given: ['v0', 'v', 's'],
      sought: 'a',
      values: { v0: tq(v0, 'm/s'), v: tq(v, 'm/s'), s: tq(s, 'm') },
      numeric: { label: 'a =', answer: a, unit: 'm/s^2', decimals: decFor(a), mistakes },
      insert: `a = \\frac{(${tq(v, 'm/s')})^2 - (${tq(v0, 'm/s')})^2}{2\\cdot ${tq(s, 'm')}} = ${tq(a, 'm/s^2', decFor(a))}`,
      aha: brake ? 'Negativ acceleration = accelerationen peger modsat bevægelsen. Det er en opbremsning.' : undefined,
      data: { type: 'a-fra-s', v0, v, s },
    };
  },
  't-fra-v': (rng) => {
    const v0 = rng.pick([0, 5, 10]), a = rng.pick([1, 1.5, 2, 2.5, 4]), t = rng.pick([2, 3, 4, 5, 6, 8]);
    const v = v0 + a * t;
    const mistakes: Mistake[] = [
      { value: a / (v - v0), why: 'Du har divideret omvendt. Isolér $t$: $t = \\frac{v - v_0}{a}$.' },
      { value: (v - v0) * a, why: 'Du har ganget med $a$. Isolér $t$ ved at <b>dividere</b> med $a$.' },
    ];
    if (v0) mistakes.push({ value: v / a, why: 'Du har brugt sluthastigheden alene. Det er <b>ændringen</b> $v - v_0$, der tager tid.' });
    return {
      prompt: `Hvor lang tid tager det en bil at øge farten fra $${tq(v0, 'm/s')}$ til $${tq(v, 'm/s')}$, når accelerationen er $${tq(a, 'm/s^2')}$?`,
      given: ['v0', 'v', 'a'],
      sought: 't',
      values: { v0: tq(v0, 'm/s'), v: tq(v, 'm/s'), a: tq(a, 'm/s^2') },
      numeric: { label: 't =', answer: t, unit: 's', decimals: decFor(t), mistakes },
      insert: `t = \\frac{${tq(v, 'm/s')} - ${tq(v0, 'm/s')}}{${tq(a, 'm/s^2')}} = ${tq(t, 's')}`,
      data: { type: 't-fra-v', v0, v, a },
    };
  },
  's-avg': (rng) => {
    const plane = rng.bool(0.5);
    const v0 = plane ? 0 : rng.pick([20, 25, 30]);
    const v = plane ? rng.pick([60, 65, 70, 75, 80]) : 0;
    const t = plane ? rng.pick([25, 30, 35, 40]) : rng.pick([20, 30, 40]);
    const s = ((v0 + v) / 2) * t;
    return {
      prompt: plane
        ? `Et fly accelererer jævnt på startbanen fra hvile til $${tq(v, 'm/s')}$ på $${tq(t, 's')}$. Hvor lang en strækning bruger det på startbanen?`
        : `Et tog kører med $${tq(v0, 'm/s')}$ og bremser jævnt til stilstand på $${tq(t, 's')}$. Hvor langt kører toget under opbremsningen?`,
      given: ['v0', 'v', 't'],
      sought: 's',
      values: { v0: tq(v0, 'm/s'), v: tq(v, 'm/s'), t: tq(t, 's') },
      numeric: {
        label: 's =',
        answer: s,
        unit: 'm',
        decimals: decFor(s),
        mistakes: [
          { value: Math.max(v0, v) * t, why: 'Du har ganget den største hastighed med tiden – som om farten var konstant hele vejen. Brug <b>gennemsnitsfarten</b> $\\frac{v_0 + v}{2}$.' },
          { value: (v0 + v) * t, why: 'Du har glemt at dividere med 2. Gennemsnittet af to hastigheder er $\\frac{v_0 + v}{2}$.' },
        ],
      },
      insert: `s = \\frac{${tq(v0, 'm/s')} + ${tq(v, 'm/s')}}{2}\\cdot ${tq(t, 's')} = ${tq(s, 'm', decFor(s))}`,
      aha: 'Ved konstant acceleration er gennemsnitsfarten præcis midt mellem start- og slutfarten.',
      data: { type: 's-avg', v0, v, t },
    };
  },
  bremse: (rng) => {
    const kmt = rng.pick([30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
    const a = rng.pick([-6, -7, -8]);
    const v0 = kmt / 3.6;
    const s = -(v0 * v0) / (2 * a);
    return {
      prompt: `En bil kører $${tq(kmt, 'km/t')}$ og laver en nødbremsning med accelerationen $${tq(a, 'm/s^2')}$, indtil den holder stille. Hvor lang er bremselængden?`,
      given: ['v0', 'v', 'a'],
      sought: 's',
      values: { v0: tq(kmt, 'km/t'), v: tq(0, 'm/s'), a: tq(a, 'm/s^2') },
      numeric: {
        label: 's =',
        answer: s,
        unit: 'm',
        decimals: decFor(s),
        mistakes: [
          { value: -(kmt * kmt) / (2 * a), why: 'Du har regnet med km/t. Omregn først til m/s (divider med 3,6) – ellers passer enhederne ikke med m/s².' },
          { value: -(v0 * v0) / a, why: 'Du mangler 2-tallet i nævneren: $s = \\frac{v^2 - v_0^2}{2a}$.' },
          { value: -s, why: 'En bremselængde kan ikke være negativ. Husk, at $a$ er negativ: $\\frac{0 - v_0^2}{2\\cdot(' + tn(a) + ')}$ bliver positiv.' },
        ],
      },
      pre: [{ text: 'Omregn til m/s:', math: `v_0 = \\frac{${tn(kmt)}}{3{,}6}\\ \\mathrm{m/s} = ${tq(v0, 'm/s', 2)}` }],
      insert: `s = \\frac{0^2 - (${tq(v0, 'm/s', 2)})^2}{2\\cdot (${tq(a, 'm/s^2')})} = ${tq(s, 'm', decFor(s))}`,
      aha: 'Bremselængden afhænger af farten i <b>anden</b>. Dobbelt så stor fart giver fire gange så lang bremselængde.',
      data: { type: 'bremse', kmt, a },
    };
  },
};

function kinQuantities(rng: Rng, c: KinCase) {
  return rng.shuffle(ALL.map((s) => q(s, c.values[s], s === 'v' ? 'sluthastighed' : undefined)));
}

function kinHints(c: KinCase): string[] {
  const m = missingOf(c);
  const f = F[FORMULA_FOR_MISSING[m]];
  return [
    `Skriv de fem størrelser op: $v_0, v, a, t, s$. Hvilken er hverken givet eller søgt?`,
    `${SYM_NAME[m][0].toUpperCase() + SYM_NAME[m].slice(1)} ($${SYM_TEX[m]}$) mangler. Brug formlen uden $${SYM_TEX[m]}$: $${f.tex}$`,
    `Isolér og indsæt: $${f.solve![c.sought]}$`,
  ];
}

function kinSolution(c: KinCase): Step[] {
  const m = missingOf(c);
  const f = F[FORMULA_FOR_MISSING[m]];
  const givenTxt = c.given.map((g) => `$${SYM_TEX[g]} = ${c.values[g]}$`).join(', ');
  const steps: Step[] = [
    { text: `Givet: ${givenTxt}. Søgt: $${SYM_TEX[c.sought]}$. Hverken givet eller søgt: $${SYM_TEX[m]}$ (${SYM_NAME[m]}).` },
    { text: `Vælg formlen uden $${SYM_TEX[m]}$ og isolér $${SYM_TEX[c.sought]}$:`, math: f.solve![c.sought] },
    ...(c.pre ?? []),
    { text: 'Indsæt med enheder:', math: c.insert },
  ];
  if (c.aha) steps.push({ aha: true, text: c.aha });
  return steps;
}

function kinGen(id: string, title: string, type: string, difficulty: number): Generator {
  return gen({ id, title, skills: ['bev-lign', 'formelvalg'], difficulty }, (rng) => {
    const c = builders[type](rng);
    return {
      kind: 'formula',
      topic: 'Konstant acceleration',
      prompt: c.prompt,
      quantities: kinQuantities(rng, c),
      given: c.given,
      sought: c.sought,
      formulas: formulas(rng, 'vv0at', 'sv0t', 'v2', 'savg'),
      numeric: c.numeric,
      hints: kinHints(c),
      solution: kinSolution(c),
      data: c.data,
    };
  });
}

// ---------- "Vælg formlen" (uden at regne) ----------
const pickFormula = gen({ id: 'b3.formelvalg', title: 'Vælg den rigtige formel', skills: ['formelvalg'], difficulty: 1 }, (rng) => {
  const type = rng.pick(Object.keys(builders));
  const c = builders[type](rng);
  const m = missingOf(c);
  const options: ChoiceOption[] = ['vv0at', 'sv0t', 'v2', 'savg'].map((id) => {
    const f = F[id];
    const correct = id === FORMULA_FOR_MISSING[m];
    let why: string;
    if (correct) why = `Den indeholder ikke $${SYM_TEX[m]}$ (${SYM_NAME[m]}), som hverken er givet eller søgt – så alt andet i formlen kender du, bortset fra det søgte.`;
    else if (!f.vars.includes(c.sought)) why = `Formlen indeholder slet ikke $${SYM_TEX[c.sought]}$, som er det, du skal finde.`;
    else {
      const unk = f.vars.filter((x) => x !== c.sought && !c.given.includes(x as Sym)) as Sym[];
      why = `Formlen indeholder $${unk.map((u) => SYM_TEX[u]).join(', ')}$ (${unk.map((u) => SYM_NAME[u]).join(', ')}), som hverken er givet eller søgt. Så har du to ubekendte.`;
    }
    return { html: `$${f.tex}$`, correct, why, key: id };
  });
  return {
    kind: 'choice',
    topic: 'Formelvalg',
    prompt: `${c.prompt}<div class="ask">Du skal ikke regne. <b>Hvilken formel kan du bruge direkte?</b></div>`,
    options: rng.shuffle(options),
    hints: ['Find den af de fem størrelser ($v_0, v, a, t, s$), der hverken er givet eller søgt.', 'Hver formel mangler præcis én af de fem. Vælg den, der mangler netop "din" manglende størrelse.'],
    solution: [
      { text: `Givet: ${c.given.map((g) => `$${SYM_TEX[g]}$`).join(', ')}. Søgt: $${SYM_TEX[c.sought]}$. Mangler: $${SYM_TEX[m]}$.` },
      { text: 'Formlen uden den manglende størrelse:', math: F[FORMULA_FOR_MISSING[m]].tex },
    ],
    data: { type, missing: m },
  };
});

// ---------- Begreber ----------
type Item = { prompt: string; options: Omit<ChoiceOption, 'key'>[]; skills: string[] };
const items: ((rng: Rng) => Item)[] = [
  () => ({
    skills: ['bev-lign'],
    prompt: 'En bil bremser med den samme acceleration fra to forskellige farter. Den ene gang kører den <b>dobbelt så hurtigt</b>. Hvad sker der med bremselængden?',
    options: [
      { html: 'Den bliver 4 gange så lang', correct: true, why: '$s = \\frac{v_0^2}{2|a|}$: farten indgår i anden, så dobbelt fart giver $2^2 = 4$ gange bremselængden.' },
      { html: 'Den bliver dobbelt så lang', correct: false, why: 'Det ville gælde, hvis bremselængden var proportional med farten. Men farten indgår i <b>anden</b>.' },
      { html: 'Den er den samme', correct: false, why: 'Med mere fart skal der mere til at bremse ned – bremselængden vokser.' },
      { html: 'Den bliver halvt så lang', correct: false, why: 'Større fart giver længere bremselængde, ikke kortere.' },
    ],
  }),
  () => ({
    skills: ['st-parabel'],
    prompt: 'Hvordan ser s-t-grafen ud for en bevægelse med konstant acceleration (forskellig fra 0)?',
    options: [
      { html: 'En krum graf (en parabel)', correct: true, why: '$s = v_0 t + \\tfrac12 a t^2$ er et andengradspolynomium i $t$ – dens graf er en parabel.' },
      { html: 'En ret, skrå linje', correct: false, why: 'En ret s-t-graf betyder konstant hastighed – dvs. $a = 0$.' },
      { html: 'En vandret linje', correct: false, why: 'Vandret s-t-graf betyder stilstand.' },
      { html: 'En ret linje gennem (0,0)', correct: false, why: 'Det er stadig konstant hastighed. Med acceleration ændres hældningen hele tiden.' },
    ],
  }),
  () => ({
    skills: ['st-parabel'],
    prompt: 'Du tegner en tangent til s-t-grafen i et bestemt tidspunkt. Hvad fortæller tangentens hældning?',
    options: [
      { html: 'Hastigheden i det øjeblik', correct: true, why: 'Hældningen af s-t-grafen er hastigheden – og tangenten giver hældningen netop dér.' },
      { html: 'Accelerationen i det øjeblik', correct: false, why: 'Accelerationen er hældningen af <b>v-t</b>-grafen.' },
      { html: 'Den samlede strækning', correct: false, why: 'Strækningen aflæser du på s-aksen – eller som areal under v-t-grafen.' },
      { html: 'Gennemsnitshastigheden fra start', correct: false, why: 'Det ville være hældningen af en linje fra startpunktet (en sekant), ikke tangenten.' },
    ],
  }),
  (rng) => {
    const d = rng.pick([1, 1.5, 2, 2.5, 3]);
    return {
      skills: ['bev-lign', 'st-parabel'],
      prompt: `En bil starter fra hvile med konstant acceleration. Efter 1 s har den kørt $${tq(d, 'm')}$. Hvor langt har den kørt efter 2 s?`,
      options: [
        { html: `$${tq(4 * d, 'm')}$`, correct: true, why: `Fra hvile er $s = \\tfrac12 a t^2$, så strækningen vokser med $t^2$: dobbelt tid giver 4 gange så langt.` },
        { html: `$${tq(2 * d, 'm')}$`, correct: false, why: 'Det ville gælde ved konstant hastighed. Her accelererer bilen, så den kører længere i andet sekund end i første.' },
        { html: `$${tq(3 * d, 'm')}$`, correct: false, why: `I andet sekund alene kører den $${tn(3 * d)}$ m. Men spørgsmålet er den samlede strækning.` },
        { html: `$${tq(8 * d, 'm')}$`, correct: false, why: 'Strækningen vokser med $t^2$, ikke $t^3$. Dobbelt tid giver $2^2 = 4$ gange så langt.' },
      ],
    };
  },
  () => ({
    skills: ['formelvalg'],
    prompt: 'Hvilken størrelse indgår <b>ikke</b> i formlen $v^2 = v_0^2 + 2a\\cdot s$?',
    options: [
      { html: 'Tiden $t$', correct: true, why: 'Derfor er den perfekt, når tiden hverken er givet eller søgt – fx ved bremselængder.' },
      { html: 'Strækningen $s$', correct: false, why: '$s$ står i sidste led: $2a\\cdot s$.' },
      { html: 'Accelerationen $a$', correct: false, why: '$a$ står i sidste led: $2a\\cdot s$.' },
      { html: 'Starthastigheden $v_0$', correct: false, why: '$v_0$ står som $v_0^2$.' },
    ],
  }),
];

const concepts = gen({ id: 'b3.begreb', title: 'Begreber', skills: ['bev-lign'], difficulty: 2 }, (rng) => {
  const it = rng.pick(items)(rng);
  return {
    kind: 'choice',
    topic: 'Begreber',
    skills: it.skills,
    prompt: it.prompt,
    options: rng.shuffle(it.options.map((o, i) => ({ ...o, key: 'o' + i }))),
    hints: ['Tænk på formlen $s = v_0 t + \\tfrac12 a t^2$ – hvad står i anden?', 'Hældningen af s-t er $v$. Hældningen af v-t er $a$.'],
    solution: [],
  };
});

// ---------- s-t-graf match ----------
const stShapes = [
  { key: 'op', f: (t: number) => t * t, text: 'En bil starter fra hvile og accelererer jævnt.', means: 'grafen krummer opad og bliver stejlere – hastigheden vokser fra 0' },
  { key: 'brems', f: (t: number) => 16 * t - t * t, text: 'En bil kører og bremser jævnt, indtil den holder stille.', means: 'grafen bliver fladere og fladere og ender vandret – farten falder til 0' },
  { key: 'konst', f: (t: number) => 8 * t, text: 'Et tog kører med konstant fart.', means: 'en ret linje – konstant hastighed' },
  { key: 'bak', f: (t: number) => 64 - t * t, text: 'En bil bakker og kører hurtigere og hurtigere baglæns. Positiv retning er fremad.', means: 'grafen går nedad og bliver stejlere – voksende fart i negativ retning' },
];
const sample = (f: (t: number) => number): [number, number][] => Array.from({ length: 17 }, (_, i) => [i / 2, round(f(i / 2), 6)]);
const deriv = (f: (t: number) => number) => (t: number) => (f(t + 1e-4) - f(t - 1e-4)) / 2e-4;

const stMatch = gen({ id: 'b3.st-match', title: 'Bevægelse til s-t-graf', skills: ['st-parabel'], difficulty: 2 }, (rng) => {
  const target = rng.pick(stShapes);
  const fv = deriv(target.f);
  const motion: MotionSpec = {
    view: 'track',
    obj: 'car',
    pos: (t) => [target.f(t), 0],
    vel: (t) => [fv(t), 0],
    acc: (t) => [(fv(t + 1e-3) - fv(t - 1e-3)) / 2e-3, 0],
    tMax: 8,
    xRange: [-5, 70],
    show: { v: true, a: true, strobe: 1 },
    vMax: 16,
    aMax: 2,
  };
  return {
    kind: 'choice',
    topic: 's-t-graf',
    prompt: `${target.text} Hvilken s-t-graf passer?`,
    visual: { type: 'motion', motion },
    grid: true,
    options: rng.shuffle(
      stShapes.map<ChoiceOption>((sh) => ({
        plot: { xLabel: 't (s)', yLabel: 's (m)', xMax: 8, yMin: 0, yMax: 70, yStep: 20, series: [{ pts: sample(sh.f), color: C.s }], compact: true },
        correct: sh.key === target.key,
        why: sh.key === target.key ? `Rigtigt: ${sh.means}.` : `Her er ${sh.means}. Det passer ikke med bevægelsen.`,
        key: sh.key,
      })),
    ),
    hints: ['Hældningen af s-t-grafen er hastigheden. Hvad sker der med farten undervejs?', 'Voksende fart = stejlere og stejlere. Aftagende fart = fladere og fladere.'],
    solution: [{ text: `Bevægelsen: ${target.means}.` }],
    data: { key: target.key },
  };
});

export const b3Generators: Generator[] = [
  kinGen('b3.v-fra-t', 'Sluthastighed', 'v-fra-t', 1),
  kinGen('b3.s-fra-t', 'Strækning', 's-fra-t', 2),
  kinGen('b3.v-fra-s', 'Fart efter en strækning', 'v-fra-s', 3),
  kinGen('b3.a-fra-s', 'Acceleration fra strækning', 'a-fra-s', 3),
  kinGen('b3.t-fra-v', 'Hvor lang tid?', 't-fra-v', 2),
  kinGen('b3.s-avg', 'Strækning med gennemsnitsfart', 's-avg', 2),
  kinGen('b3.bremse', 'Bremselængde', 'bremse', 3),
  pickFormula,
  concepts,
  stMatch,
];
