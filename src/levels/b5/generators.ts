// Bane 5: Kræfter, vektorer og Newtons 2. lov (F_res = m·a).

import { decFor, tn, tq } from '../../core/numbers';
import type { Rng } from '../../core/rng';
import { formulas, q } from '../../exercises/build';
import type { ChoiceOption } from '../../exercises/types';
import { C } from '../../viz/colors';
import type { FbdSpec, Force } from '../../viz/svgviz';
import { gen, type Generator } from '../types';

const G = 9.82;
export const FC = { t: C.g, N: '#0f766e', motor: C.F, gnid: '#b91c1c', luft: '#0369a1', res: C.ink };
const Ft = (mag: number): Force => ({ angle: 270, mag, label: 'F_t', color: FC.t });
const FN = (mag: number): Force => ({ angle: 90, mag, label: 'F_N', color: FC.N });

// ---------- 1. Tyngdekraft ----------
const weight = gen({ id: 'b5.tyngdekraft', title: 'Tyngdekraft', skills: ['newton2'], difficulty: 1 }, (rng) => {
  const sc = rng.pick([
    { who: 'en elev', m: [45, 80, 1] },
    { who: 'en skoletaske', m: [3, 9, 0.5] },
    { who: 'en bil', m: [900, 1800, 50] },
    { who: 'en kat', m: [3, 6, 0.5] },
  ]);
  const m = rng.stepped(sc.m[0], sc.m[1], sc.m[2]);
  const F = m * G;
  const d = decFor(F);
  return {
    kind: 'numeric',
    topic: 'Tyngdekraft',
    prompt: `Hvor stor er tyngdekraften på ${sc.who} med massen $${tq(m, 'kg')}$?`,
    label: 'F_t =',
    answer: F,
    unit: 'N',
    decimals: d,
    mistakes: [
      { value: m, why: 'Det er massen i kg. Tyngdekraften er en <b>kraft</b> og måles i newton: $F_t = m\\cdot g$.' },
      { value: m / G, why: 'Du har divideret med $g$. Tyngdekraften er massen <b>gange</b> tyngdeaccelerationen.' },
    ],
    hints: ['Masse (kg) og tyngdekraft (N) er to forskellige ting.', 'Brug $F_t = m\\cdot g$ med $g = 9{,}82\\ \\mathrm{m/s^2}$.', `$F_t = ${tq(m, 'kg')}\\cdot 9{,}82\\ \\mathrm{m/s^2}$`],
    solution: [
      { text: 'Tyngdekraften er massen gange tyngdeaccelerationen:', math: `F_t = m\\cdot g = ${tq(m, 'kg')}\\cdot 9{,}82\\ \\mathrm{m/s^2} = ${tq(F, 'N', d)}` },
      { aha: true, text: 'Enheden: $\\mathrm{kg\\cdot m/s^2} = \\mathrm{N}$. På Månen ville massen være den samme, men tyngdekraften kun ca. 1/6.' },
    ],
    data: { m },
  };
});

// ---------- 2. Resulterende kraft (1D, med kraftdiagram) ----------
const resultant = gen({ id: 'b5.resultant', title: 'Resulterende kraft', skills: ['resultant', 'kraftdiagram', 'vektorer'], difficulty: 1 }, (rng) => {
  const three = rng.bool(0.4);
  const mags = three ? [rng.stepped(100, 300, 10), rng.stepped(50, 200, 10), rng.stepped(20, 120, 10)] : [rng.stepped(80, 400, 10), rng.stepped(40, 350, 10)];
  const dirs = three ? rng.shuffle([1, 1, -1]) : [1, -1];
  if (mags.reduce((a, m, i) => a + m * dirs[i], 0) === 0) mags[0] += 30;
  const Fres = mags.reduce((a, m, i) => a + m * dirs[i], 0);
  const names = three ? ['F_1', 'F_2', 'F_3'] : ['F_1', 'F_2'];
  const forces: Force[] = mags.map((m, i) => ({ angle: dirs[i] > 0 ? 0 : 180, mag: m, label: names[i], color: [FC.motor, FC.gnid, FC.luft][i] }));
  const list = mags.map((m, i) => `$${names[i].replace('_', '_{')}} = ${tq(m, 'N')}$ mod ${dirs[i] > 0 ? 'højre' : 'venstre'}`).join(', ');
  const sum = mags.map((m, i) => `${i && dirs[i] > 0 ? '+' : ''}${dirs[i] < 0 ? '-' : ''}${tn(m)}`).join(' ');
  return {
    kind: 'numeric',
    topic: 'Resulterende kraft',
    prompt: `En kasse på et glat gulv påvirkes af de vandrette kræfter ${list}. Hvad er den resulterende kraft? Højre er positiv.`,
    visual: { type: 'fbd', fbd: { body: 'box', forces, showValues: true } },
    label: 'F_{\\mathrm{res}} =',
    answer: Fres,
    unit: 'N',
    decimals: 0,
    mistakes: [
      { value: mags.reduce((a, b) => a + b, 0), why: 'Du har lagt alle kræfterne sammen. Men de peger ikke samme vej – kræfter mod venstre skal <b>trækkes fra</b> (de er negative).' },
      { value: -Fres, why: 'Størrelsen er rigtig, men fortegnet er forkert. Peger den resulterende kraft mod højre (positiv) eller mod venstre?' },
    ],
    hints: [
      'Kræfter er vektorer: giv dem fortegn efter retningen. Højre = +, venstre = −.',
      'Læg kræfterne sammen med fortegn: $F_{\\mathrm{res}} = F_1 + F_2 + \\dots$',
      `$F_{\\mathrm{res}} = ${sum}$ N`,
    ],
    solution: [
      { text: 'Giv hver kraft fortegn efter retningen (højre positiv) og læg sammen:', math: `F_{\\mathrm{res}} = ${sum}\\ \\mathrm{N} = ${tq(Fres, 'N')}` },
      { text: 'De lodrette kræfter (tyngdekraft og normalkraft) ophæver hinanden, så de er ikke med.' },
      { aha: true, text: Fres > 0 ? 'Den resulterende kraft peger mod højre – så kassen accelererer mod højre.' : 'Den resulterende kraft peger mod venstre – så kassen accelererer mod venstre.' },
    ],
    data: Object.fromEntries(mags.flatMap((m, i) => [[`m${i}`, m], [`d${i}`, dirs[i]]])),
  };
});

// ---------- 3. Find a = F/m ----------
const aScenes = [
  { who: 'En bil', m: [900, 1600, 100], F: [1500, 5000, 250] },
  { who: 'En cyklist med cykel', m: [60, 100, 5], F: [40, 200, 10] },
  { who: 'En ishockeypuck', m: [0.17, 0.17, 1], F: [5, 30, 1] },
  { who: 'En slæde med barn', m: [25, 50, 5], F: [30, 150, 10] },
];

const findA = gen({ id: 'b5.find-a', title: 'Acceleration fra kraft', skills: ['newton2', 'formelvalg'], difficulty: 1 }, (rng) => {
  const sc = rng.pick(aScenes);
  const m = rng.stepped(sc.m[0], sc.m[1], sc.m[2]);
  const F = rng.stepped(sc.F[0], sc.F[1], sc.F[2]);
  const a = F / m;
  const d = decFor(a);
  return {
    kind: 'formula',
    topic: 'Newtons 2. lov',
    prompt: `${sc.who} har massen $${tq(m, 'kg')}$ og påvirkes af en resulterende kraft på $${tq(F, 'N')}$. Hvor stor er accelerationen?`,
    quantities: rng.shuffle([q('F', tq(F, 'N')), q('m', tq(m, 'kg')), q('a'), q('v'), q('t')]),
    given: ['F', 'm'],
    sought: 'a',
    formulas: formulas(rng, 'newton2', 'newton2Wrong', 'vst'),
    numeric: {
      label: 'a =',
      answer: a,
      unit: 'm/s^2',
      decimals: d,
      mistakes: [
        { value: F * m, why: 'Du har ganget. Isolér $a$ i $F_{\\mathrm{res}} = m\\cdot a$ ved at <b>dividere</b> med $m$.' },
        { value: m / F, why: 'Du har divideret omvendt. $a = F_{\\mathrm{res}}/m$ – tjek enheden: N/kg = m/s².' },
      ],
    },
    hints: ['Kraft og masse er givet – accelerationen søges.', 'Newtons 2. lov: $F_{\\mathrm{res}} = m\\cdot a$. Isolér $a$.', `$a = \\frac{${tq(F, 'N')}}{${tq(m, 'kg')}}$`],
    solution: [
      { text: 'Isolér $a$ i Newtons 2. lov:', math: 'a = \\frac{F_{\\mathrm{res}}}{m}' },
      { text: 'Indsæt:', math: `a = \\frac{${tq(F, 'N')}}{${tq(m, 'kg')}} = ${tq(a, 'm/s^2', d)}` },
      { aha: true, text: 'Enhedstjek: $\\mathrm{N/kg} = \\mathrm{\\tfrac{kg\\cdot m/s^2}{kg}} = \\mathrm{m/s^2}$. ✔' },
    ],
    data: { F, m },
  };
});

// ---------- 4. Find F = m·a ----------
const findF = gen({ id: 'b5.find-F', title: 'Kraft fra acceleration', skills: ['newton2', 'formelvalg'], difficulty: 1 }, (rng) => {
  const sc = rng.pick([
    { who: 'En sprinter', m: [55, 90, 1], a: [2, 5, 0.5] },
    { who: 'En bil', m: [900, 1800, 100], a: [1, 4, 0.5] },
    { who: 'En elevator med passagerer', m: [600, 1200, 50], a: [0.5, 1.5, 0.1] },
    { who: 'Et tog', m: [80000, 200000, 10000], a: [0.2, 0.8, 0.1] },
  ]);
  const m = rng.stepped(sc.m[0], sc.m[1], sc.m[2]);
  const a = rng.stepped(sc.a[0], sc.a[1], sc.a[2]);
  const F = m * a;
  const d = decFor(F);
  return {
    kind: 'formula',
    topic: 'Newtons 2. lov',
    prompt: `${sc.who} med massen $${tq(m, 'kg')}$ accelererer med $${tq(a, 'm/s^2')}$. Hvor stor er den resulterende kraft?`,
    quantities: rng.shuffle([q('F'), q('m', tq(m, 'kg')), q('a', tq(a, 'm/s^2')), q('v'), q('t')]),
    given: ['m', 'a'],
    sought: 'F',
    formulas: formulas(rng, 'newton2', 'newton2Wrong', 'vst'),
    numeric: {
      label: 'F_{\\mathrm{res}} =',
      answer: F,
      unit: 'N',
      decimals: d,
      mistakes: [
        { value: m / a, why: 'Du har divideret. Kraften er masse <b>gange</b> acceleration.' },
        { value: m * G, why: 'Det er tyngdekraften ($m\\cdot g$). Her spørges om den kraft, der giver accelerationen $a$.' },
      ],
    },
    hints: ['Masse og acceleration er givet.', 'Newtons 2. lov: $F_{\\mathrm{res}} = m\\cdot a$.', `$F_{\\mathrm{res}} = ${tq(m, 'kg')}\\cdot ${tq(a, 'm/s^2')}$`],
    solution: [{ text: 'Newtons 2. lov:', math: `F_{\\mathrm{res}} = m\\cdot a = ${tq(m, 'kg')}\\cdot ${tq(a, 'm/s^2')} = ${tq(F, 'N', d)}${F >= 10000 ? ` = ${tq(F / 1000, 'kN', decFor(F / 1000))}` : ''}` }],
    data: { m, a },
  };
});

// ---------- 5. Flere kræfter -> acceleration ----------
const forcesToA = gen({ id: 'b5.kraefter-til-a', title: 'Fra kraftdiagram til acceleration', skills: ['newton2', 'resultant', 'kraftdiagram'], difficulty: 2 }, (rng) => {
  const m = rng.stepped(800, 1600, 100);
  const Ff = rng.stepped(1500, 5000, 100);
  const Fb = rng.stepped(300, Ff - 400, 100);
  const Fres = Ff - Fb;
  const a = Fres / m;
  const d = decFor(a);
  const scale = Math.max(Ff, m * G * 0.35);
  return {
    kind: 'numeric',
    topic: 'Kraftdiagram',
    prompt: `Kraftdiagrammet viser kræfterne på en bil med massen $${tq(m, 'kg')}$. Motoren skubber bilen frem med $${tq(Ff, 'N')}$, og luftmodstand og gnidning virker bagud med i alt $${tq(Fb, 'N')}$. Hvor stor er bilens acceleration?`,
    visual: { type: 'fbd', fbd: { body: 'car', forces: [{ angle: 0, mag: Ff, label: 'F_motor', color: FC.motor }, { angle: 180, mag: Fb, label: 'F_modstand', color: FC.gnid }, { ...Ft(scale * 0.8), label: 'F_t' }, { ...FN(scale * 0.8), label: 'F_N' }], showValues: false, maxMag: scale } },
    label: 'a =',
    answer: a,
    unit: 'm/s^2',
    decimals: d,
    mistakes: [
      { value: Ff / m, why: 'Du har kun brugt motorkraften. Newtons 2. lov bruger den <b>resulterende</b> kraft: $F_{\\mathrm{res}} = F_{\\mathrm{motor}} - F_{\\mathrm{modstand}}$.' },
      { value: (Ff + Fb) / m, why: 'Modstanden peger bagud, så den skal <b>trækkes fra</b> – ikke lægges til.' },
      { value: Fres, why: `Det er den resulterende kraft i N. Divider med massen for at få accelerationen.` },
    ],
    hints: [
      'De lodrette kræfter ($F_t$ og $F_N$) ophæver hinanden. Se kun på de vandrette.',
      'Find først $F_{\\mathrm{res}} = F_{\\mathrm{motor}} - F_{\\mathrm{modstand}}$, og brug så $a = F_{\\mathrm{res}}/m$.',
      `$F_{\\mathrm{res}} = ${tn(Ff)} - ${tn(Fb)} = ${tq(Fres, 'N')}$`,
    ],
    solution: [
      { text: 'Resulterende kraft (frem er positiv):', math: `F_{\\mathrm{res}} = ${tq(Ff, 'N')} - ${tq(Fb, 'N')} = ${tq(Fres, 'N')}` },
      { text: 'Newtons 2. lov:', math: `a = \\frac{F_{\\mathrm{res}}}{m} = \\frac{${tq(Fres, 'N')}}{${tq(m, 'kg')}} = ${tq(a, 'm/s^2', d)}` },
      { aha: true, text: 'Hvis motorkraften var lige så stor som modstanden, ville $F_{\\mathrm{res}} = 0$ – og bilen ville køre med konstant fart (Newtons 1. lov).' },
    ],
    data: { m, Ff, Fb },
  };
});

// ---------- 6. Lodret: raket eller elevator ----------
const vertical = gen({ id: 'b5.lodret', title: 'Kræfter lodret', skills: ['newton2', 'resultant', 'kraftdiagram'], difficulty: 3 }, (rng) => {
  const rocket = rng.bool();
  let m: number, F: number;
  do {
    m = rocket ? rng.stepped(0.2, 1, 0.1) : rng.stepped(500, 1000, 50);
    F = rocket ? rng.stepped(4, 20, 1) : rng.stepped(5500, 12000, 250);
  } while ((F - m * G) / m < 0.3 || (!rocket && (F - m * G) / m > 2.5));
  const Fres = F - m * G;
  const a = Fres / m;
  const d = decFor(a);
  const label = rocket ? 'F_motor' : 'F_kabel';
  return {
    kind: 'numeric',
    topic: 'Kræfter lodret',
    prompt: rocket
      ? `En modelraket med massen $${tq(m, 'kg')}$ affyres lodret. Motoren giver en kraft på $${tq(F, 'N')}$ opad. Hvor stor er raketten acceleration lige efter affyringen? (Se bort fra luftmodstand. Opad er positiv.)`
      : `En elevator med passagerer har massen $${tq(m, 'kg')}$. Kablet trækker opad med $${tq(F, 'N')}$. Hvor stor er elevatorens acceleration? (Opad er positiv.)`,
    visual: { type: 'fbd', fbd: { body: rocket ? 'ball' : 'box', forces: [{ angle: 90, mag: F, label, color: FC.motor }, Ft(m * G)], showValues: true } },
    label: 'a =',
    answer: a,
    unit: 'm/s^2',
    decimals: d,
    mistakes: [
      { value: F / m, why: 'Du har glemt tyngdekraften. Den trækker nedad hele tiden: $F_{\\mathrm{res}} = F - m\\cdot g$.' },
      { value: (F + m * G) / m, why: 'Tyngdekraften peger <b>nedad</b>, så den skal trækkes fra, når opad er positiv.' },
    ],
    hints: [
      'To kræfter virker: ' + (rocket ? 'motorkraften' : 'kabelkraften') + ' opad og tyngdekraften $F_t = m\\cdot g$ nedad.',
      '$F_{\\mathrm{res}} = F - m\\cdot g$, og derefter $a = F_{\\mathrm{res}}/m$.',
      `$F_t = ${tq(m, 'kg')}\\cdot 9{,}82\\ \\mathrm{m/s^2} = ${tq(m * G, 'N', decFor(m * G))}$`,
    ],
    solution: [
      { text: 'Tyngdekraften:', math: `F_t = m\\cdot g = ${tq(m, 'kg')}\\cdot 9{,}82\\ \\mathrm{m/s^2} = ${tq(m * G, 'N', decFor(m * G))}` },
      { text: 'Resulterende kraft (opad positiv):', math: `F_{\\mathrm{res}} = ${tq(F, 'N')} - ${tq(m * G, 'N', decFor(m * G))} = ${tq(Fres, 'N', decFor(Fres))}` },
      { text: 'Newtons 2. lov:', math: `a = \\frac{F_{\\mathrm{res}}}{m} = ${tq(a, 'm/s^2', d)}` },
    ],
    data: { m, F },
  };
});

// ---------- 7. Kraft og kinematik kombineret ----------
const forceKin = gen({ id: 'b5.kraft-kinematik', title: 'Kraft og bevægelse', skills: ['newton2', 'acc'], difficulty: 3 }, (rng) => {
  const findForce = rng.bool();
  const m = rng.stepped(900, 1600, 100);
  if (findForce) {
    let kmt = 0, t = 0;
    do {
      kmt = rng.pick([36, 54, 72, 90, 100]);
      t = rng.pick([5, 6, 8, 10, 12]);
    } while (kmt / 3.6 / t > 4); // almindelig bil, ikke sportsvogn
    const v = kmt / 3.6;
    const a = v / t;
    const F = m * a;
    return {
      kind: 'numeric',
      topic: 'Kraft og bevægelse',
      prompt: `En bil med massen $${tq(m, 'kg')}$ accelererer jævnt fra 0 til $${tq(kmt, 'km/t')}$ på $${tq(t, 's')}$. Hvor stor er den resulterende kraft på bilen?`,
      label: 'F_{\\mathrm{res}} =',
      answer: F,
      unit: 'N',
      decimals: decFor(F),
      mistakes: [
        { value: (m * kmt) / t, why: 'Du har regnet med km/t. Omregn til m/s først (divider med 3,6).' },
        { value: m * v, why: 'Du mangler accelerationen: find først $a = \\Delta v/\\Delta t$, og brug så $F = m\\cdot a$.' },
        { value: a, why: 'Det er accelerationen. Gang med massen for at få kraften.' },
      ],
      hints: ['To trin: find accelerationen fra bevægelsen, og brug så Newtons 2. lov.', `$a = \\frac{\\Delta v}{\\Delta t}$ med $v$ i m/s: $${tq(kmt, 'km/t')} = ${tq(v, 'm/s', 2)}$.`, `$F_{\\mathrm{res}} = m\\cdot a = ${tq(m, 'kg')}\\cdot ${tq(a, 'm/s^2', 3)}$`],
      solution: [
        { text: 'Omregn:', math: `v = \\frac{${tn(kmt)}}{3{,}6}\\ \\mathrm{m/s} = ${tq(v, 'm/s', 2)}` },
        { text: 'Acceleration:', math: `a = \\frac{${tq(v, 'm/s', 2)} - 0}{${tq(t, 's')}} = ${tq(a, 'm/s^2', decFor(a))}` },
        { text: 'Newtons 2. lov:', math: `F_{\\mathrm{res}} = m\\cdot a = ${tq(m, 'kg')}\\cdot ${tq(a, 'm/s^2', decFor(a))} = ${tq(F, 'N', decFor(F))}` },
        { aha: true, text: 'Newtons 2. lov er broen mellem kræfter og bevægelse: kender du den ene, kan du finde den anden.' },
      ],
      data: { case: 'F', m, kmt, t },
    };
  }
  const F = rng.stepped(1000, 4000, 250);
  const t = rng.pick([3, 4, 5, 6, 8]);
  const a = F / m;
  const v = a * t;
  return {
    kind: 'numeric',
    topic: 'Kraft og bevægelse',
    prompt: `En bil med massen $${tq(m, 'kg')}$ holder stille. Den påvirkes nu af en konstant resulterende kraft på $${tq(F, 'N')}$ i $${tq(t, 's')}$. Hvor stor er farten derefter?`,
    label: 'v =',
    answer: v,
    unit: 'm/s',
    decimals: decFor(v),
    mistakes: [
      { value: a, why: 'Det er accelerationen. Hastigheden efter $t$ sekunder er $v = a\\cdot t$.' },
      { value: F * t, why: 'Du mangler at dividere med massen: $a = F/m$ først.' },
    ],
    hints: ['To trin: Newtons 2. lov giver accelerationen, og så bruger du kinematik.', `$a = \\frac{F_{\\mathrm{res}}}{m} = \\frac{${tq(F, 'N')}}{${tq(m, 'kg')}}$`, 'Fra hvile: $v = a\\cdot t$.'],
    solution: [
      { text: 'Newtons 2. lov:', math: `a = \\frac{F_{\\mathrm{res}}}{m} = \\frac{${tq(F, 'N')}}{${tq(m, 'kg')}} = ${tq(a, 'm/s^2', decFor(a))}` },
      { text: 'Fra hvile:', math: `v = a\\cdot t = ${tq(a, 'm/s^2', decFor(a))}\\cdot ${tq(t, 's')} = ${tq(v, 'm/s', decFor(v))}` },
    ],
    data: { case: 'v', m, F, t },
  };
});

// ---------- 8. Komposanter ----------
const components = gen({ id: 'b5.komposanter', title: 'Kraft på skrå', skills: ['komposanter', 'vektorer'], difficulty: 2 }, (rng) => {
  const F = rng.stepped(50, 300, 10);
  const th = rng.pick([15, 20, 25, 30, 35, 40, 45, 50, 60]);
  const askX = rng.bool(0.6);
  const rad = (th * Math.PI) / 180;
  const Fx = F * Math.cos(rad), Fy = F * Math.sin(rad);
  const ans = askX ? Fx : Fy;
  const d = decFor(ans);
  const who = rng.pick(['Du trækker en slæde', 'En hund trækker en kælk', 'Du trækker en kuffert']);
  return {
    kind: 'numeric',
    topic: 'Komposanter',
    prompt: `${who} med en snor, der danner vinklen $${th}^\\circ$ med vandret. Kraften i snoren er $${tq(F, 'N')}$. Hvor stor er den <b>${askX ? 'vandrette' : 'lodrette'}</b> komposant af kraften?`,
    visual: {
      type: 'fbd',
      fbd: {
        body: 'box',
        ground: true,
        forces: [
          { angle: th, mag: F, label: 'F', color: FC.motor },
          { angle: 0, mag: Fx, label: 'F_x', color: FC.motor, dashed: true },
          { angle: 90, mag: Fy, label: 'F_y', color: FC.motor, dashed: true },
        ],
      },
    },
    label: askX ? 'F_x =' : 'F_y =',
    answer: ans,
    unit: 'N',
    decimals: d,
    mistakes: [
      { value: askX ? Fy : Fx, why: askX ? 'Du har brugt sinus. Den vandrette komposant ligger <b>ved siden af</b> vinklen (hosliggende katete): $F_x = F\\cos\\theta$.' : 'Du har brugt cosinus. Den lodrette komposant ligger <b>over for</b> vinklen (modstående katete): $F_y = F\\sin\\theta$.' },
      { value: F * (askX ? Math.cos(th) : Math.sin(th)), why: 'Din lommeregner står vist i <b>radianer</b>. Skift til grader (DEG) og regn igen.' },
      { value: F, why: 'Det er hele kraften. Komposanten er altid mindre end kraften selv, når kraften er på skrå.' },
    ],
    hints: [
      'Tegn en retvinklet trekant: kraften er hypotenusen, komposanterne er kateterne.',
      askX ? 'Den vandrette komposant ligger op ad vinklen: $F_x = F\\cdot\\cos\\theta$.' : 'Den lodrette komposant ligger over for vinklen: $F_y = F\\cdot\\sin\\theta$.',
      `$${askX ? 'F_x' : 'F_y'} = ${tq(F, 'N')}\\cdot ${askX ? '\\cos' : '\\sin'}(${th}^\\circ)$ – lommeregneren i grader!`,
    ],
    solution: [
      { text: 'Kraften er hypotenusen i en retvinklet trekant med komposanterne som kateter:', math: askX ? `F_x = F\\cos\\theta = ${tq(F, 'N')}\\cdot\\cos(${th}^\\circ) = ${tq(Fx, 'N', d)}` : `F_y = F\\sin\\theta = ${tq(F, 'N')}\\cdot\\sin(${th}^\\circ) = ${tq(Fy, 'N', d)}` },
      { aha: true, text: `Tjek: $F_x^2 + F_y^2 = F^2$ (Pythagoras): $${tn(Fx, 1)}^2 + ${tn(Fy, 1)}^2 \\approx ${tn(F)}^2$. ✔` },
    ],
    data: { F, th, askX },
  };
});

// ---------- 9. Vælg det rigtige kraftdiagram ----------
type Scenario = { text: string; body: FbdSpec['body']; options: { forces: Force[]; correct: boolean; why: string; key: string }[] };
const W = 60; // tyngdekraftens længde (vilkårlig skala)
const scenarios: Scenario[] = [
  {
    text: 'En bog ligger stille på et bord.',
    body: 'box',
    options: [
      { key: 'ok', correct: true, forces: [Ft(W), FN(W)], why: 'Tyngdekraften trækker nedad, og bordet skubber op med en lige så stor normalkraft. $F_{\\mathrm{res}} = 0$, så bogen bliver liggende.' },
      { key: 'kunFt', correct: false, forces: [Ft(W)], why: 'Hvis kun tyngdekraften virkede, ville bogen falde. Bordet skubber tilbage med en normalkraft.' },
      { key: 'FNstor', correct: false, forces: [Ft(W), FN(W * 1.6)], why: 'Er normalkraften større end tyngdekraften, bliver $F_{\\mathrm{res}}$ rettet opad – så ville bogen lette.' },
      { key: 'vandret', correct: false, forces: [Ft(W), FN(W), { angle: 0, mag: W * 0.7, label: 'F', color: FC.motor }], why: 'Der er intet, der skubber bogen til siden. En vandret kraft ville få den til at accelerere.' },
    ],
  },
  {
    text: 'En bold er på vej <b>op</b> efter et lodret kast. Se bort fra luftmodstand.',
    body: 'ball',
    options: [
      { key: 'ok', correct: true, forces: [Ft(W)], why: 'Når bolden har forladt hånden, virker kun tyngdekraften. Den bevæger sig op på grund af sin <b>fart</b> – ikke på grund af en kraft.' },
      { key: 'kast', correct: false, forces: [Ft(W), { angle: 90, mag: W * 1.3, label: 'F_kast', color: FC.motor }], why: 'Den klassiske fælde! Kastekraften virker kun, mens bolden er i hånden. Bagefter er der ingen kraft opad.' },
      { key: 'op', correct: false, forces: [{ angle: 90, mag: W, label: 'F', color: FC.motor }], why: 'Tyngdekraften forsvinder ikke – og der er ingen kraft opad efter kastet.' },
      { key: 'lige', correct: false, forces: [Ft(W), { angle: 90, mag: W, label: 'F_kast', color: FC.motor }], why: 'Hvis kræfterne ophævede hinanden, ville bolden fortsætte op med konstant fart for evigt.' },
    ],
  },
  {
    text: 'En bil kører med <b>konstant fart</b> ligeud på en vandret vej.',
    body: 'car',
    options: [
      { key: 'ok', correct: true, forces: [Ft(W), FN(W), { angle: 0, mag: W * 0.8, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 0.8, label: 'F_mod', color: FC.gnid }], why: 'Konstant fart betyder $a = 0$, så $F_{\\mathrm{res}} = 0$: motorkraften er præcis lige så stor som modstanden.' },
      { key: 'motorstor', correct: false, forces: [Ft(W), FN(W), { angle: 0, mag: W * 1.3, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 0.6, label: 'F_mod', color: FC.gnid }], why: 'Er motorkraften størst, er der en resulterende kraft fremad – så accelererer bilen.' },
      { key: 'kunmotor', correct: false, forces: [Ft(W), FN(W), { angle: 0, mag: W * 0.8, label: 'F_motor', color: FC.motor }], why: 'Luftmodstand og gnidning mangler. Uden dem ville bilen accelerere hele tiden.' },
      { key: 'modstor', correct: false, forces: [Ft(W), FN(W), { angle: 0, mag: W * 0.5, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 1.1, label: 'F_mod', color: FC.gnid }], why: 'Er modstanden størst, peger $F_{\\mathrm{res}}$ bagud – så bremser bilen.' },
    ],
  },
  {
    text: 'En faldskærmsudspringer (med udfoldet skærm) falder med <b>konstant fart</b>.',
    body: 'person',
    options: [
      { key: 'ok', correct: true, forces: [Ft(W), { angle: 90, mag: W, label: 'F_luft', color: FC.luft }], why: 'Konstant fart = $F_{\\mathrm{res}} = 0$. Luftmodstanden opad er lige så stor som tyngdekraften.' },
      { key: 'Ftstor', correct: false, forces: [Ft(W * 1.4), { angle: 90, mag: W * 0.6, label: 'F_luft', color: FC.luft }], why: 'Så ville der være en resulterende kraft nedad, og faldet ville gå hurtigere og hurtigere.' },
      { key: 'kunFt', correct: false, forces: [Ft(W)], why: 'Det er et frit fald uden skærm. Skærmen giver en stor luftmodstand opad.' },
      { key: 'luftstor', correct: false, forces: [Ft(W * 0.6), { angle: 90, mag: W * 1.4, label: 'F_luft', color: FC.luft }], why: 'Så ville $F_{\\mathrm{res}}$ pege opad, og faldet ville blive langsommere.' },
    ],
  },
  {
    text: 'En bil <b>speeder op</b> fra et lyskryds på en vandret vej.',
    body: 'car',
    options: [
      { key: 'ok', correct: true, forces: [Ft(W), FN(W), { angle: 0, mag: W * 1.3, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 0.4, label: 'F_mod', color: FC.gnid }], why: 'Bilen accelererer fremad, så $F_{\\mathrm{res}}$ skal pege fremad: motorkraften er størst.' },
      { key: 'lige', correct: false, forces: [Ft(W), FN(W), { angle: 0, mag: W * 0.8, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 0.8, label: 'F_mod', color: FC.gnid }], why: 'Lige store kræfter giver $F_{\\mathrm{res}} = 0$ – det er konstant fart, ikke acceleration.' },
      { key: 'modstor', correct: false, forces: [Ft(W), FN(W), { angle: 0, mag: W * 0.5, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 1.1, label: 'F_mod', color: FC.gnid }], why: 'Her peger $F_{\\mathrm{res}}$ bagud – så ville bilen bremse.' },
      { key: 'ingenFN', correct: false, forces: [Ft(W), { angle: 0, mag: W * 1.3, label: 'F_motor', color: FC.motor }, { angle: 180, mag: W * 0.4, label: 'F_mod', color: FC.gnid }], why: 'Normalkraften fra vejen mangler. Uden den ville tyngdekraften trække bilen ned gennem vejen.' },
    ],
  },
];

const pickFbd = gen({ id: 'b5.kraftdiagram', title: 'Vælg kraftdiagrammet', skills: ['kraftdiagram'], difficulty: 2 }, (rng) => {
  const sc = rng.pick(scenarios);
  return {
    kind: 'choice',
    topic: 'Kraftdiagram',
    prompt: `${sc.text} Hvilket kraftdiagram er rigtigt?`,
    grid: true,
    options: rng.shuffle(sc.options.map((o) => ({ fbd: { body: sc.body, forces: o.forces, maxMag: W * 1.6 }, correct: o.correct, why: o.why, key: o.key }))),
    hints: ['Spørg først: accelererer genstanden, eller er farten konstant (evt. 0)?', 'Konstant fart eller hvile ⇒ kræfterne ophæver hinanden ($F_{\\mathrm{res}} = 0$). Acceleration ⇒ $F_{\\mathrm{res}}$ peger i accelerationens retning.'],
    solution: [{ text: 'Newtons 1. og 2. lov: $F_{\\mathrm{res}} = m\\cdot a$. Ingen acceleration ⇒ ingen resulterende kraft.' }],
    data: { scenario: sc.text.slice(0, 20) },
  };
});

// ---------- 10. Begreber ----------
type Item = { prompt: string; options: Omit<ChoiceOption, 'key'>[]; skills: string[] };
const items: ((rng: Rng) => Item)[] = [
  () => ({
    skills: ['newton2', 'vektorer'],
    prompt: 'Den resulterende kraft på en genstand peger altid i samme retning som …',
    options: [
      { html: '… accelerationen', correct: true, why: '$F_{\\mathrm{res}} = m\\cdot a$ – og $m$ er positiv, så de to vektorer peger samme vej.' },
      { html: '… hastigheden', correct: false, why: 'Ikke nødvendigvis! En bil, der bremser, kører fremad, men den resulterende kraft peger bagud.' },
      { html: '… bevægelsen', correct: false, why: 'En bold på vej op bevæger sig opad, men kraften (tyngden) peger nedad.' },
      { html: '… tyngdekraften', correct: false, why: 'Kun hvis tyngdekraften er den eneste kraft (frit fald).' },
    ],
  }),
  (rng) => {
    const k = rng.pick([2, 3]);
    return {
      skills: ['newton2'],
      prompt: `Du skubber med den samme kraft på to kasser. Den ene har ${k === 2 ? 'dobbelt' : 'tre gange'} så stor masse som den anden. Hvordan er dens acceleration?`,
      options: [
        { html: k === 2 ? 'Halvt så stor' : 'En tredjedel så stor', correct: true, why: `$a = F/m$: ${k} gange så stor masse giver 1/${k} af accelerationen.` },
        { html: k === 2 ? 'Dobbelt så stor' : 'Tre gange så stor', correct: false, why: 'Større masse er sværere at sætte i gang – accelerationen bliver mindre, ikke større.' },
        { html: 'Den samme', correct: false, why: 'Samme kraft på større masse giver mindre acceleration: $a = F/m$.' },
      ],
    };
  },
  () => ({
    skills: ['newton2'],
    prompt: 'En bil kører med konstant 90 km/t ligeud. Hvad er den resulterende kraft på bilen?',
    options: [
      { html: '$0\\ \\mathrm{N}$', correct: true, why: 'Konstant hastighed ⇒ $a = 0$ ⇒ $F_{\\mathrm{res}} = 0$ (Newtons 1. lov). Motorkraften ophæver modstanden.' },
      { html: 'Den peger fremad', correct: false, why: 'Så ville bilen accelerere. Der skal ingen resulterende kraft til for at holde en konstant fart.' },
      { html: 'Den er lig med motorkraften', correct: false, why: 'Motorkraften er én af kræfterne – luftmodstand og gnidning peger bagud og er lige så store.' },
    ],
  }),
  () => ({
    skills: ['newton2'],
    prompt: 'Hvad er $1\\ \\mathrm{N}$ (én newton)?',
    options: [
      { html: '$1\\ \\mathrm{kg\\cdot m/s^2}$', correct: true, why: 'Fra $F = m\\cdot a$: den kraft, der giver 1 kg en acceleration på 1 m/s².' },
      { html: '$1\\ \\mathrm{kg}$', correct: false, why: 'Kilogram er en enhed for masse, ikke kraft.' },
      { html: '$1\\ \\mathrm{kg\\cdot m/s}$', correct: false, why: 'Det er enheden for bevægelsesmængde. Kraft har s² i nævneren.' },
      { html: '$9{,}82\\ \\mathrm{kg}$', correct: false, why: 'Masse og kraft er forskellige størrelser – de kan ikke være lig hinanden.' },
    ],
  }),
  () => ({
    skills: ['newton2'],
    prompt: 'En astronaut har massen 70 kg på Jorden. Hvad sker der med massen og tyngdekraften på Månen?',
    options: [
      { html: 'Massen er stadig 70 kg, men tyngdekraften er mindre', correct: true, why: 'Massen (mængden af stof) ændrer sig ikke. Tyngdekraften $m\\cdot g$ er mindre, fordi $g$ er ca. 1,6 m/s² på Månen.' },
      { html: 'Både massen og tyngdekraften bliver mindre', correct: false, why: 'Astronauten består af det samme stof – massen er uændret.' },
      { html: 'Massen bliver mindre, tyngdekraften er den samme', correct: false, why: 'Det er omvendt: $g$ ændrer sig, massen gør ikke.' },
    ],
  }),
];

const concepts = gen({ id: 'b5.begreb', title: 'Begreber om kræfter', skills: ['newton2'], difficulty: 1 }, (rng) => {
  const it = rng.pick(items)(rng);
  return {
    kind: 'choice',
    topic: 'Begreber',
    skills: it.skills,
    prompt: it.prompt,
    options: rng.shuffle(it.options.map((o, i) => ({ ...o, key: 'o' + i }))),
    hints: ['Newtons 2. lov: $F_{\\mathrm{res}} = m\\cdot a$.', 'Ingen acceleration (konstant fart eller hvile) ⇔ $F_{\\mathrm{res}} = 0$.'],
    solution: [],
  };
});

export const b5Generators: Generator[] = [weight, resultant, findA, findF, forcesToA, vertical, forceKin, components, pickFbd, concepts];
