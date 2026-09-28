// Bane 6 (bonus): Skråt kast – opdeling i x- og y-retning. g = 9,82 m/s², opad positiv.

import { decFor, tn, tq } from '../../core/numbers';
import type { Rng } from '../../core/rng';
import type { ChoiceOption } from '../../exercises/types';
import { gen, type Generator } from '../types';

const G = 9.82;
const gT = '9{,}82\\ \\mathrm{m/s^2}';
const rad = (d: number) => (d * Math.PI) / 180;
const ANGLES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
const who = ['En fodbold sparkes', 'En kugle kastes', 'En golfbold slås', 'En vandstråle sprøjtes', 'En basketball kastes'];

function throwParams(rng: Rng) {
  const v0 = rng.stepped(8, 30, 1);
  const th = rng.pick(ANGLES);
  return { v0, th, v0x: v0 * Math.cos(rad(th)), v0y: v0 * Math.sin(rad(th)), w: rng.pick(who) };
}
const intro = (w: string, v0: number, th: number) => `${w} af fra jorden med farten $${tq(v0, 'm/s')}$ i vinklen $${th}^\\circ$ over vandret.`;
const splitStep = (v0: number, th: number) => ({
  text: 'Del starthastigheden op:',
  math: `v_{0x} = ${tn(v0)}\\cdot\\cos(${th}^\\circ) = ${tq(v0 * Math.cos(rad(th)), 'm/s', 2)},\\qquad v_{0y} = ${tn(v0)}\\cdot\\sin(${th}^\\circ) = ${tq(v0 * Math.sin(rad(th)), 'm/s', 2)}`,
});

// ---------- 1. Komposanter ----------
const comps = gen({ id: 'b6.komposanter', title: 'Opdel starthastigheden', skills: ['komposanter'], difficulty: 1 }, (rng) => {
  const { v0, th, v0x, v0y, w } = throwParams(rng);
  const askX = rng.bool();
  const ans = askX ? v0x : v0y;
  const d = decFor(ans);
  return {
    kind: 'numeric',
    topic: 'Komposanter',
    prompt: `${intro(w, v0, th)} Hvor stor er den <b>${askX ? 'vandrette' : 'lodrette'}</b> komposant af starthastigheden?`,
    label: askX ? 'v_{0x} =' : 'v_{0y} =',
    answer: ans,
    unit: 'm/s',
    decimals: d,
    mistakes: [
      { value: askX ? v0y : v0x, why: askX ? 'Du har brugt sinus. Den vandrette komposant ligger op ad vinklen: $v_{0x} = v_0\\cos\\theta$.' : 'Du har brugt cosinus. Den lodrette komposant ligger over for vinklen: $v_{0y} = v_0\\sin\\theta$.' },
      { value: v0 * (askX ? Math.cos(th) : Math.sin(th)), why: 'Lommeregneren står i <b>radianer</b>. Skift til grader (DEG).' },
    ],
    hints: ['Starthastigheden er hypotenusen i en retvinklet trekant.', askX ? '$v_{0x} = v_0\\cdot\\cos\\theta$' : '$v_{0y} = v_0\\cdot\\sin\\theta$', `$${askX ? 'v_{0x}' : 'v_{0y}'} = ${tq(v0, 'm/s')}\\cdot ${askX ? '\\cos' : '\\sin'}(${th}^\\circ)$`],
    solution: [
      { math: askX ? `v_{0x} = v_0\\cos\\theta = ${tq(v0, 'm/s')}\\cdot\\cos(${th}^\\circ) = ${tq(ans, 'm/s', d)}` : `v_{0y} = v_0\\sin\\theta = ${tq(v0, 'm/s')}\\cdot\\sin(${th}^\\circ) = ${tq(ans, 'm/s', d)}` },
      { aha: true, text: 'Tjek: jo stejlere kast, jo større lodret komposant. Ved 45° er de to komposanter lige store.' },
    ],
    data: { v0, th, askX },
  };
});

// ---------- 2. Flyvetid ----------
const flight = gen({ id: 'b6.flyvetid', title: 'Tid i luften', skills: ['skraat-kast'], difficulty: 2 }, (rng) => {
  const { v0, th, v0y, w } = throwParams(rng);
  const t = (2 * v0y) / G;
  const d = decFor(t);
  return {
    kind: 'numeric',
    topic: 'Skråt kast',
    prompt: `${intro(w, v0, th)} Hvor lang tid er den i luften, før den lander på jorden igen? (Uden luftmodstand.)`,
    label: 't =',
    answer: t,
    unit: 's',
    decimals: d,
    mistakes: [
      { value: v0y / G, why: 'Det er kun tiden <b>op</b> til toppunktet. Turen ned tager lige så lang tid.' },
      { value: (2 * v0) / G, why: 'Du har brugt hele $v_0$. Kun den <b>lodrette</b> komposant $v_{0y} = v_0\\sin\\theta$ bestemmer, hvor længe den er i luften.' },
      { value: (2 * v0 * Math.cos(rad(th))) / G, why: 'Du har brugt den vandrette komposant. Tiden i luften afhænger af den lodrette: $v_0\\sin\\theta$.' },
    ],
    hints: ['Tiden i luften bestemmes af den <b>lodrette</b> bevægelse – et lodret kast.', 'Find $v_{0y} = v_0\\sin\\theta$. Tiden op er $v_{0y}/g$ – og tiden ned lige så lang.', `$t = \\frac{2\\cdot ${tq(v0y, 'm/s', 2)}}{${gT}}$`],
    solution: [
      splitStep(v0, th),
      { text: 'Lodret er det et lodret kast. Tiden op og ned:', math: `t = \\frac{2\\,v_{0y}}{g} = \\frac{2\\cdot ${tq(v0y, 'm/s', 2)}}{${gT}} = ${tq(t, 's', d)}` },
    ],
    data: { v0, th },
  };
});

// ---------- 3. Maksimal højde ----------
const maxH = gen({ id: 'b6.maks-hoejde', title: 'Maksimal højde', skills: ['skraat-kast'], difficulty: 2 }, (rng) => {
  const { v0, th, v0y, w } = throwParams(rng);
  const hm = (v0y * v0y) / (2 * G);
  const d = decFor(hm);
  return {
    kind: 'numeric',
    topic: 'Skråt kast',
    prompt: `${intro(w, v0, th)} Hvor højt kommer den op? (Uden luftmodstand.)`,
    label: 'h =',
    answer: hm,
    unit: 'm',
    decimals: d,
    mistakes: [
      { value: (v0 * v0) / (2 * G), why: 'Du har brugt hele $v_0$ – som om den blev kastet lodret op. Kun den lodrette komposant $v_{0y}$ løfter den.' },
      { value: (v0y * v0y) / G, why: 'Du mangler 2-tallet: $h = \\frac{v_{0y}^2}{2g}$.' },
      { value: v0y / G, why: 'Det er tiden op til toppunktet (i sekunder), ikke højden.' },
    ],
    hints: ['Højden bestemmes kun af den lodrette bevægelse.', 'I toppunktet er den lodrette hastighed 0: $h = \\frac{v_{0y}^2}{2g}$ med $v_{0y} = v_0\\sin\\theta$.', `$h = \\frac{(${tq(v0y, 'm/s', 2)})^2}{2\\cdot ${gT}}$`],
    solution: [splitStep(v0, th), { text: 'Lodret kast op til toppunktet:', math: `h = \\frac{v_{0y}^2}{2g} = \\frac{(${tq(v0y, 'm/s', 2)})^2}{2\\cdot ${gT}} = ${tq(hm, 'm', d)}` }],
    data: { v0, th },
  };
});

// ---------- 4. Kastevidde ----------
const range = gen({ id: 'b6.kastevidde', title: 'Kastevidde', skills: ['skraat-kast', 'komposanter'], difficulty: 3 }, (rng) => {
  const { v0, th, v0x, v0y, w } = throwParams(rng);
  const t = (2 * v0y) / G;
  const x = v0x * t;
  const d = decFor(x);
  return {
    kind: 'numeric',
    topic: 'Skråt kast',
    prompt: `${intro(w, v0, th)} Hvor langt væk lander den? (Flad grund, uden luftmodstand.)`,
    label: 'x =',
    answer: x,
    unit: 'm',
    decimals: d,
    mistakes: [
      { value: v0 * t, why: 'Du har ganget tiden med hele $v_0$. Vandret bevæger den sig kun med $v_{0x} = v_0\\cos\\theta$.' },
      { value: v0x * (v0y / G), why: 'Du har brugt tiden op til toppunktet. Den lander først efter den dobbelte tid.' },
      { value: v0x * ((2 * v0) / G), why: 'Tiden i luften skal regnes med den lodrette komposant $v_{0y}$, ikke hele $v_0$.' },
    ],
    hints: ['Tre trin: opdel $v_0$ → find tiden i luften fra den lodrette bevægelse → brug den vandrette.', `Tiden i luften: $t = \\frac{2 v_{0y}}{g} = ${tq(t, 's', 3)}$.`, `Vandret er farten konstant: $x = v_{0x}\\cdot t = ${tq(v0x, 'm/s', 2)}\\cdot ${tq(t, 's', 3)}$`],
    solution: [
      splitStep(v0, th),
      { text: 'Tid i luften (lodret kast):', math: `t = \\frac{2 v_{0y}}{g} = ${tq(t, 's', 3)}` },
      { text: 'Vandret: konstant hastighed:', math: `x = v_{0x}\\cdot t = ${tq(v0x, 'm/s', 2)}\\cdot ${tq(t, 's', 3)} = ${tq(x, 'm', d)}` },
      { aha: true, text: 'Tiden er "limen" mellem de to retninger: du finder den lodret og bruger den vandret.' },
    ],
    data: { v0, th },
  };
});

// ---------- 5. Vandret kast ----------
const horizontal = gen({ id: 'b6.vandret-kast', title: 'Vandret kast', skills: ['skraat-kast'], difficulty: 2 }, (rng) => {
  const table = rng.bool();
  const hgt = table ? rng.stepped(0.7, 1.2, 0.05) : rng.stepped(10, 40, 1);
  const v0 = table ? rng.stepped(1, 4, 0.5) : rng.stepped(5, 15, 1);
  const t = Math.sqrt((2 * hgt) / G);
  const x = v0 * t;
  const d = decFor(x);
  return {
    kind: 'numeric',
    topic: 'Vandret kast',
    prompt: table
      ? `En kugle ruller ud over kanten af et bord, der er $${tq(hgt, 'm')}$ højt, med farten $${tq(v0, 'm/s')}$. Hvor langt fra bordkanten rammer den gulvet? (Uden luftmodstand.)`
      : `En sten kastes vandret ud fra en klippe, der er $${tq(hgt, 'm')}$ høj, med farten $${tq(v0, 'm/s')}$. Hvor langt fra klippens fod rammer den? (Uden luftmodstand.)`,
    label: 'x =',
    answer: x,
    unit: 'm',
    decimals: d,
    mistakes: [
      { value: (v0 * 2 * hgt) / G, why: 'Du har glemt kvadratroden i faldtiden: $t = \\sqrt{2h/g}$.' },
      { value: v0 * Math.sqrt(hgt / G), why: 'Du mangler 2-tallet i faldtiden: $t = \\sqrt{2h/g}$.' },
      { value: t, why: 'Det er faldtiden i sekunder. Gang med den vandrette fart for at få afstanden.' },
    ],
    hints: ['Lodret er det et frit fald fra hvile (den vandrette fart påvirker ikke faldet).', `Faldtid: $t = \\sqrt{\\frac{2h}{g}} = ${tq(t, 's', 3)}$.`, `Vandret: $x = v_0\\cdot t = ${tq(v0, 'm/s')}\\cdot ${tq(t, 's', 3)}$`],
    solution: [
      { text: 'Lodret: frit fald fra hvile.', math: `t = \\sqrt{\\frac{2h}{g}} = \\sqrt{\\frac{2\\cdot ${tq(hgt, 'm')}}{${gT}}} = ${tq(t, 's', 3)}` },
      { text: 'Vandret: konstant fart.', math: `x = v_0\\cdot t = ${tq(v0, 'm/s')}\\cdot ${tq(t, 's', 3)} = ${tq(x, 'm', d)}` },
      { aha: true, text: 'Den falder præcis lige så hurtigt, som hvis den var blevet sluppet lodret ned. Den vandrette bevægelse ændrer ikke faldet.' },
    ],
    data: { h: hgt, v0 },
  };
});

// ---------- 6. Fart i toppunktet ----------
const topSpeed = gen({ id: 'b6.fart-i-top', title: 'Fart i toppunktet', skills: ['skraat-kast', 'komposanter'], difficulty: 2 }, (rng) => {
  const { v0, th, v0x, w } = throwParams(rng);
  const d = decFor(v0x);
  return {
    kind: 'numeric',
    topic: 'Skråt kast',
    prompt: `${intro(w, v0, th)} Hvor stor er farten i kastets <b>toppunkt</b>? (Uden luftmodstand.)`,
    label: 'v_{\\text{top}} =',
    answer: v0x,
    unit: 'm/s',
    decimals: d,
    mistakes: [
      { value: v0 * Math.sin(rad(th)), why: 'Det er den <b>lodrette</b> starthastighed. I toppunktet er den lodrette hastighed netop 0 – tilbage er kun den vandrette.' },
      { value: v0, why: 'Farten er mindre i toppunktet: den lodrette del af hastigheden er "brugt op". Kun $v_{0x}$ er tilbage.' },
    ],
    hints: ['Hvad sker der med den lodrette og den vandrette hastighed undervejs?', 'I toppunktet er $v_y = 0$. Den vandrette hastighed er konstant hele vejen: $v_x = v_0\\cos\\theta$.', `$v = ${tq(v0, 'm/s')}\\cdot\\cos(${th}^\\circ)$`],
    solution: [
      { text: 'I toppunktet er den lodrette hastighed 0, og den vandrette er uændret:', math: `v_{\\text{top}} = v_{0x} = v_0\\cos\\theta = ${tq(v0, 'm/s')}\\cdot\\cos(${th}^\\circ) = ${tq(v0x, 'm/s', d)}` },
      { aha: true, text: 'Farten i toppunktet er <b>ikke</b> 0 – det gælder kun for et lodret kast.' },
    ],
    data: { v0, th },
  };
});

// ---------- 7. Begreber ----------
type Item = { prompt: string; options: Omit<ChoiceOption, 'key'>[]; skills: string[] };
const items: ((rng: Rng) => Item)[] = [
  () => ({
    skills: ['skraat-kast'],
    prompt: 'Hvordan er hastigheden i toppunktet af et skråt kast? (Uden luftmodstand.)',
    options: [
      { html: 'Vandret og lig med $v_0\\cos\\theta$', correct: true, why: 'Den lodrette komposant er 0 i toppunktet, den vandrette er uændret.' },
      { html: 'Lig med 0', correct: false, why: 'Kun den lodrette del er 0. Bolden bevæger sig stadig fremad.' },
      { html: 'Lodret nedad', correct: false, why: 'I toppunktet skifter den lodrette hastighed fortegn – den er netop 0 dér.' },
      { html: 'Lig med $v_0$', correct: false, why: 'Farten er mindst i toppunktet, fordi den lodrette del er væk.' },
    ],
  }),
  () => ({
    skills: ['skraat-kast'],
    prompt: 'Hvilken kastevinkel giver det længste kast på flad grund? (Samme fart, uden luftmodstand.)',
    options: [
      { html: '$45^\\circ$', correct: true, why: 'Kastevidden er $\\frac{v_0^2\\sin(2\\theta)}{g}$, og $\\sin(2\\theta)$ er størst, når $2\\theta = 90^\\circ$.' },
      { html: '$30^\\circ$', correct: false, why: 'For lav – bolden når ikke at være længe nok i luften.' },
      { html: '$60^\\circ$', correct: false, why: 'For stejl – den er længe i luften, men bevæger sig langsomt vandret. 30° og 60° giver faktisk samme kastevidde.' },
      { html: '$90^\\circ$', correct: false, why: 'Lodret op – så lander den samme sted, som den blev kastet fra.' },
    ],
  }),
  () => ({
    skills: ['skraat-kast'],
    prompt: 'Fra samme højde slipper du én kugle og skyder samtidig en anden kugle vandret ud. Hvilken rammer gulvet først? (Uden luftmodstand.)',
    options: [
      { html: 'De rammer samtidig', correct: true, why: 'Lodret laver begge det samme frie fald. Den vandrette fart påvirker ikke faldet.' },
      { html: 'Den der blev sluppet', correct: false, why: 'Den vandrette bevægelse er uafhængig af den lodrette – begge falder lige hurtigt.' },
      { html: 'Den der blev skudt ud', correct: false, why: 'Den kommer længere væk, men den er ikke længere om at falde.' },
    ],
  }),
  () => ({
    skills: ['skraat-kast', 'komposanter'],
    prompt: 'Hvilken størrelse er <b>konstant</b> under et skråt kast uden luftmodstand?',
    options: [
      { html: 'Den vandrette hastighed $v_x$', correct: true, why: 'Der virker ingen vandret kraft, så $a_x = 0$ og $v_x$ er konstant.' },
      { html: 'Den lodrette hastighed $v_y$', correct: false, why: 'Tyngden ændrer $v_y$ med 9,82 m/s hvert sekund.' },
      { html: 'Farten', correct: false, why: 'Farten er mindst i toppunktet og størst ved start og landing.' },
      { html: 'Højden', correct: false, why: 'Højden ændrer sig hele tiden – op og ned.' },
    ],
  }),
  () => ({
    skills: ['skraat-kast', 'vektorer'],
    prompt: 'Hvilken retning har accelerationen under et skråt kast (uden luftmodstand)?',
    options: [
      { html: 'Lodret nedad hele tiden', correct: true, why: 'Den eneste kraft er tyngdekraften, så $a = g$ lodret nedad – fra start til landing.' },
      { html: 'Langs banekurven', correct: false, why: 'Det er hastigheden, der følger banekurven. Accelerationen peger altid lodret nedad.' },
      { html: 'Skråt opad i starten, nedad til sidst', correct: false, why: 'Tyngdekraften skifter ikke retning – accelerationen er den samme hele vejen.' },
      { html: 'Den er 0 i toppunktet', correct: false, why: 'Tyngden virker også i toppunktet, så $a = g$ dér.' },
    ],
  }),
];

const concepts = gen({ id: 'b6.begreb', title: 'Begreber om skråt kast', skills: ['skraat-kast'], difficulty: 1 }, (rng) => {
  const it = rng.pick(items)(rng);
  return {
    kind: 'choice',
    topic: 'Begreber',
    skills: it.skills,
    prompt: it.prompt,
    options: rng.shuffle(it.options.map((o, i) => ({ ...o, key: 'o' + i }))),
    hints: ['Vandret: ingen kraft ⇒ konstant hastighed. Lodret: tyngden ⇒ lodret kast.', 'De to retninger er uafhængige – kun tiden er fælles.'],
    solution: [],
  };
});

export const b6Generators: Generator[] = [comps, flight, maxH, range, horizontal, topSpeed, concepts];
