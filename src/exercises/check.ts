// Ren logik til at vurdere svar og forklare fejl. Ingen DOM – testes direkte.

import { defaultTol, fmt, isClose, roundSig, unitText } from '../core/numbers';
import type { DrawEx, FormulaEx, FormulaOption, NumericPart, Quantity } from './types';

export const tolOf = (p: NumericPart) => p.tol ?? defaultTol(p.decimals);

export interface CheckResult {
  ok: boolean;
  why?: string;
}

const near = (r: number, k: number) => Math.abs(r - k) / k < 0.02;

/** Generelle mønstre i forkerte svar: fortegn, faktor 3,6, glemt omregning, faktor 2 osv. */
export function genericDiagnosis(input: number, answer: number, tol = defaultTol(2)): string | null {
  if (answer !== 0 && isClose(-input, answer, tol))
    return 'Størrelsen er rigtig, men <b>fortegnet</b> er forkert. Tjek hvilken retning der er positiv, og hvilken vej bevægelsen (eller kraften) peger.';
  if (answer === 0 || input === 0) return null;
  const r = input / answer;
  if (r < 0) return null;
  if (near(r, 3.6)) return 'Dit svar er præcis 3,6 gange for stort. Har du ganget med 3,6, hvor du skulle dividere? (km/t → m/s: divider med 3,6.)';
  if (near(r, 1 / 3.6)) return 'Dit svar er præcis 3,6 gange for lille. Har du divideret med 3,6, hvor du skulle gange? (m/s → km/t: gang med 3,6.)';
  const factors: [number, string][] = [
    [1000, 'Det tyder på, at km ikke er omregnet til m (eller omvendt): 1 km = 1000 m.'],
    [60, 'Det tyder på, at minutter ikke er omregnet til sekunder: 1 min = 60 s.'],
    [3600, 'Det tyder på, at timer ikke er omregnet til sekunder: 1 t = 3600 s.'],
    [100, 'Det tyder på en fejl i en enhedsomregning (fx cm og m).'],
  ];
  for (const [k, msg] of factors) {
    if (near(r, k)) return `Dit svar er ${fmt(k)} gange for stort. ${msg}`;
    if (near(r, 1 / k)) return `Dit svar er ${fmt(k)} gange for lille. ${msg}`;
  }
  if (near(r, 2)) return 'Dit svar er præcis dobbelt så stort som det rigtige. Mangler der en faktor ½ – eller har du ganget med 2 et sted?';
  if (near(r, 0.5)) return 'Dit svar er præcis halvt så stort som det rigtige. Har du brugt ½ et sted, hvor den ikke hører til – eller glemt en faktor 2?';
  if (near(r, 9.82) || near(r, 1 / 9.82)) return `Dit svar er ${r > 1 ? '9,82 gange for stort' : '9,82 gange for lille'}. Tjek om du har ganget eller divideret med g ét sted for meget.`;
  return null;
}

/** Er input facit korrekt afrundet til 2–4 betydende cifre? (fx 1,5 for 1,46) */
function isRoundedAnswer(input: number, answer: number): boolean {
  return [2, 3, 4].some((sig) => Math.abs(roundSig(answer, sig) - input) <= 1e-9 * Math.max(1, Math.abs(input)));
}

export function checkNumeric(p: NumericPart, input: number): CheckResult {
  const tol = tolOf(p);
  if (isClose(input, p.answer, tol)) return { ok: true };
  // En kendt fejl går forud for "grov afrunding" – rammer eleven præcis en typisk fejl, forklares den.
  for (const m of p.mistakes ?? []) {
    if (!isFinite(m.value) || isClose(m.value, p.answer, tol)) continue;
    if (isClose(input, m.value, tol)) return { ok: false, why: m.why };
  }
  if (isRoundedAnswer(input, p.answer)) return { ok: true };
  const g = genericDiagnosis(input, p.answer, tol);
  if (g) return { ok: false, why: g };
  const pct = Math.round(Math.abs(input / p.answer - 1) * 100);
  const dir = Math.abs(input) > Math.abs(p.answer) ? 'for stort' : 'for lille';
  if (p.answer !== 0 && isFinite(pct) && pct < 400)
    return { ok: false, why: `Dit svar er ca. ${pct} % ${dir}. Gå trinene igennem én ad gangen – især indsættelse af tal og enheder. Et hint kan hjælpe dig videre.` };
  return { ok: false, why: 'Det svar ligger langt fra. Start med at skrive op, hvad der er givet, og hvad du skal finde – et hint kan hjælpe.' };
}

/** Er formlen brugbar givet hvad eleven kender og søger? Forklarer hvorfor ikke. */
export function formulaValidity(f: FormulaOption, given: string[], sought: string, q: Quantity[]): CheckResult {
  const texOf = (s: string) => `$${q.find((x) => x.sym === s)?.tex ?? s}$`;
  if (f.wrong) return { ok: false, why: f.wrong };
  if (!f.vars.includes(sought)) return { ok: false, why: `Formlen indeholder slet ikke ${texOf(sought)}, som er det, du skal finde.` };
  const unknown = f.vars.filter((v) => v !== sought && !given.includes(v));
  if (unknown.length) {
    const list = unknown.map(texOf).join(' og ');
    return { ok: false, why: `Formlen indeholder ${list}, som du hverken kender eller søger. Så har du ${unknown.length + 1} ubekendte i én ligning – det kan ikke løses.` };
  }
  return { ok: true };
}

export interface GivenCheck {
  ok: boolean;
  items: { sym: string; ok: boolean; msg: string }[];
}

export function checkGivenSought(ex: FormulaEx, givenSel: string[], soughtSel: string | null): GivenCheck {
  const items: GivenCheck['items'] = [];
  for (const q of ex.quantities) {
    const isGiven = ex.given.includes(q.sym);
    const marked = givenSel.includes(q.sym);
    if (isGiven && !marked) items.push({ sym: q.sym, ok: false, msg: `${cap(q.name)} er givet: $${q.tex} = ${q.value}$.` });
    else if (!isGiven && marked) {
      if (q.sym === ex.sought) items.push({ sym: q.sym, ok: false, msg: `${cap(q.name)} er ikke givet – det er den, du skal finde.` });
      else items.push({ sym: q.sym, ok: false, msg: `${cap(q.name)} ($${q.tex}$) står ikke i opgaven, så den er ikke givet.` });
    }
  }
  if (soughtSel !== ex.sought) {
    const q = ex.quantities.find((x) => x.sym === ex.sought)!;
    items.push({ sym: ex.sought, ok: false, msg: `Det søgte er ${q.name} ($${q.tex}$) – læs spørgsmålet i opgavens sidste sætning.` });
  }
  return { ok: items.length === 0, items };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Vurderer en tegnet graf punkt for punkt og forklarer den første fejl. */
export function checkDraw(ex: DrawEx, ys: number[]): CheckResult {
  const eq = (a: number, b: number) => Math.abs(a - b) < ex.snap * 0.01 + 1e-9;
  if (ys.every((y, i) => eq(y, ex.target[i]))) return { ok: true };
  const xs = ex.handleXs;
  const u = unitText(ex.yUnit), su = unitText(ex.slopeUnit);
  const slope = (arr: number[], i: number) => (arr[i + 1] - arr[i]) / (xs[i + 1] - xs[i]);
  const slopesOk = xs.slice(0, -1).every((_, i) => Math.abs(slope(ys, i) - slope(ex.target, i)) < 1e-6);
  if (!eq(ys[0], ex.target[0])) {
    if (slopesOk) return { ok: false, why: `Hældningen er rigtig hele vejen – flot! Men grafen er forskudt: ved $t = ${fmt(xs[0])}$ s skal ${ex.yName} være ${fmt(ex.target[0])} ${u}, ikke ${fmt(ys[0])} ${u}.` };
    return { ok: false, why: `Start med startpunktet: ved $t = ${fmt(xs[0])}$ s skal ${ex.yName} være ${fmt(ex.target[0])} ${u}. Du har ${fmt(ys[0])} ${u}.` };
  }
  for (let i = 0; i < xs.length - 1; i++) {
    const have = slope(ys, i), want = slope(ex.target, i);
    if (Math.abs(have - want) > 1e-6) {
      let why = `Startpunktet er rigtigt. Men mellem $t = ${fmt(xs[i])}$ s og $t = ${fmt(xs[i + 1])}$ s har din graf hældningen ${fmt(have, 2)} ${su}, og den skal være ${fmt(want, 2)} ${su} (${ex.slopeName}).`;
      if (Math.sign(have) !== Math.sign(want) && want !== 0 && have !== 0) why += ' Bemærk fortegnet: grafen skal gå den anden vej.';
      if (want === 0) why += ' Når hældningen er 0, er grafen vandret.';
      return { ok: false, why };
    }
  }
  return { ok: false, why: 'Tjek punkterne igen.' };
}
