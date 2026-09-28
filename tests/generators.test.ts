// Egenskabstest af ALLE opgavegeneratorer: hver generator køres med mange seeds,
// og hver variant tjekkes for korrekthed, fornuftige tal, dansk talformat og pædagogisk struktur.

import { describe, expect, it } from 'vitest';
import { isClose, round, roundSig } from '../src/core/numbers';
import { makeRng } from '../src/core/rng';
import { checkDraw, checkNumeric, formulaValidity, tolOf } from '../src/exercises/check';
import type { Exercise, NumericPart } from '../src/exercises/types';
import { ALL_GENERATORS } from '../src/levels/allGenerators';
import { SKILLS } from '../src/levels/skills';
import { EXPECTED } from './expected';

const SEEDS = 1500;

function texts(ex: Exercise): string[] {
  const out = [ex.prompt, ...ex.hints, ...ex.solution.flatMap((s) => [s.text ?? '', s.math ?? ''])];
  const numeric = ex.kind === 'numeric' ? ex : ex.kind === 'formula' ? ex.numeric : null;
  if (numeric) out.push(...(numeric.mistakes ?? []).map((m) => m.why));
  if (ex.kind === 'choice') out.push(...ex.options.flatMap((o) => [o.html ?? '', o.why]));
  if (ex.kind === 'formula') out.push(...ex.quantities.map((q) => q.value ?? ''), ...ex.formulas.map((f) => f.wrong ?? ''));
  return out;
}

function checkNumericPart(p: NumericPart, where: string) {
  expect(Number.isFinite(p.answer), `${where}: svar er ikke et endeligt tal`).toBe(true);
  expect(Number.isInteger(p.decimals) && p.decimals >= 0 && p.decimals <= 3, `${where}: decimaler`).toBe(true);
  if (p.answer !== 0) {
    expect(Math.abs(p.answer), `${where}: urealistisk stort/lille svar ${p.answer}`).toBeGreaterThan(1e-3);
    expect(Math.abs(p.answer)).toBeLessThan(1e6);
    expect(round(p.answer, p.decimals), `${where}: svaret afrundes til 0`).not.toBe(0);
    // det viste (afrundede) facit må ikke afvige mere end 5 % fra det præcise
    const shown = round(p.answer, p.decimals);
    expect(Math.abs(shown - p.answer) / Math.abs(p.answer), `${where}: afrunding for grov (${p.answer} -> ${shown})`).toBeLessThan(0.05);
  }
  // det afrundede facit (som vist i løsningen) skal godkendes
  expect(checkNumeric(p, round(p.answer, p.decimals)).ok, `${where}: afrundet facit afvises`).toBe(true);
  expect(checkNumeric(p, p.answer).ok).toBe(true);
  // en elev der runder korrekt til 2 betydende cifre skal også godkendes
  const r2 = roundSig(p.answer, 2);
  const clashes = (p.mistakes ?? []).some((m) => !isClose(m.value, p.answer, tolOf(p)) && isClose(r2, m.value, tolOf(p)));
  if (p.answer !== 0 && !clashes) expect(checkNumeric(p, r2).ok, `${where}: afrunding til 2 betydende cifre afvises`).toBe(true);
  for (const m of p.mistakes ?? []) {
    expect(Number.isFinite(m.value), `${where}: typisk fejl er ikke endelig`).toBe(true);
    expect(m.why.length).toBeGreaterThan(10);
    const close = isClose(m.value, p.answer, tolOf(p));
    if (!close) {
      const r = checkNumeric(p, m.value);
      expect(r.ok, `${where}: den typiske fejl ${m.value} godkendes som rigtig`).toBe(false);
      expect(r.why).toBeTruthy();
    }
  }
  // et klart forkert svar skal altid give en forklaring
  const wrong = checkNumeric(p, p.answer * 1.37 + Math.sign(p.answer || 1) * 3);
  expect(wrong.ok).toBe(false);
  expect(wrong.why && wrong.why.length > 10).toBe(true);
}

describe.each(ALL_GENERATORS.map((g) => [g.id, g] as const))('generator %s', (id, g) => {
  it(`giver ${SEEDS} gyldige varianter`, () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const ex = g.make(makeRng(seed * 7919));
      const where = `${id} (seed ${seed * 7919})`;
      seen.add(ex.prompt + JSON.stringify(ex.data ?? {}) + JSON.stringify(ex.kind === 'choice' ? ex.options.map((o) => o.key) : ''));

      // meta
      expect(ex.genId).toBe(id);
      expect(ex.skills.length).toBeGreaterThan(0);
      for (const s of ex.skills) expect(SKILLS[s], `${where}: ukendt færdighed ${s}`).toBeDefined();
      expect(ex.prompt.length).toBeGreaterThan(15);
      expect(ex.hints.length, `${where}: for få hints`).toBeGreaterThanOrEqual(2);
      expect(ex.hints.length).toBeLessThanOrEqual(3);

      // dansk formatering og ingen tekniske fejl i teksten
      for (const t of texts(ex)) {
        expect(t, `${where}: NaN/undefined i tekst`).not.toMatch(/NaN|undefined|Infinity|\[object/);
        expect(t, `${where}: decimalpunktum i "${t}"`).not.toMatch(/\d\.\d/);
      }

      if (ex.kind === 'numeric') {
        checkNumericPart(ex, where);
        expect(ex.solution.length).toBeGreaterThan(0);
      }
      if (ex.kind === 'formula') {
        checkNumericPart(ex.numeric, where);
        const syms = ex.quantities.map((q) => q.sym);
        expect(new Set(syms).size).toBe(syms.length);
        for (const gv of ex.given) {
          expect(syms).toContain(gv);
          expect(ex.quantities.find((q) => q.sym === gv)!.value, `${where}: givet uden værdi`).toBeTruthy();
        }
        expect(syms).toContain(ex.sought);
        expect(ex.given).not.toContain(ex.sought);
        const valid = ex.formulas.filter((f) => formulaValidity(f, ex.given, ex.sought, ex.quantities).ok);
        expect(valid.length, `${where}: ingen gyldig formel`).toBeGreaterThan(0);
        for (const f of valid) expect(f.solve?.[ex.sought], `${where}: mangler isoleret formel`).toBeTruthy();
        for (const f of ex.formulas.filter((x) => !valid.includes(x))) expect(formulaValidity(f, ex.given, ex.sought, ex.quantities).why).toBeTruthy();
        expect(ex.solution.length).toBeGreaterThan(0);
      }
      if (ex.kind === 'choice') {
        expect(ex.options.length).toBeGreaterThanOrEqual(2);
        expect(ex.options.filter((o) => o.correct).length, `${where}: præcis én rigtig`).toBe(1);
        expect(new Set(ex.options.map((o) => o.key)).size, `${where}: dublerede muligheder`).toBe(ex.options.length);
        const htmls = ex.options.filter((o) => o.html).map((o) => o.html);
        expect(new Set(htmls).size, `${where}: to muligheder har samme tekst`).toBe(htmls.length);
        for (const o of ex.options) expect(o.why.length, `${where}: mangler forklaring`).toBeGreaterThan(5);
        // grafmuligheder må ikke være ens
        const plots = ex.options.filter((o) => o.plot).map((o) => JSON.stringify(o.plot!.series.map((s) => s.pts)));
        expect(new Set(plots).size, `${where}: to grafer er ens`).toBe(plots.length);
      }
      if (ex.kind === 'draw') {
        const { handleXs: xs, target, plot, snap } = ex;
        expect(target.length).toBe(xs.length);
        for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
        for (const y of target) {
          expect(Math.abs(y / snap - Math.round(y / snap)), `${where}: målpunkt ikke på gitteret`).toBeLessThan(1e-9);
          expect(y).toBeGreaterThanOrEqual(plot.yMin);
          expect(y).toBeLessThanOrEqual(plot.yMax);
        }
        expect(checkDraw(ex, target).ok).toBe(true);
        expect(checkDraw(ex, ex.startYs).ok, `${where}: startgrafen er allerede rigtig`).toBe(false);
        const off = [...target];
        off[off.length - 1] += snap;
        expect(checkDraw(ex, off).why).toBeTruthy();
      }

      // figurer skal være læsbare: grafens punkter inden for akserne, bevægelsen inden for vejen
      if (ex.visual?.type === 'plot') {
        const p = ex.visual.plot;
        for (const s of p.series) for (const [x, y] of s.pts ?? []) {
          expect(y, `${where}: graf uden for y-akse`).toBeGreaterThanOrEqual(p.yMin - 1e-9);
          expect(y).toBeLessThanOrEqual(p.yMax + 1e-9);
          expect(x).toBeLessThanOrEqual(p.xMax + 1e-9);
        }
      }
      if (ex.visual?.type === 'motion') {
        const m = ex.visual.motion;
        for (let k = 0; k <= 40; k++) {
          const [x, y] = m.pos((m.tMax * k) / 40);
          if (m.xRange) {
            expect(x, `${where}: bevægelse uden for vejen`).toBeGreaterThanOrEqual(m.xRange[0] - 1e-9);
            expect(x, `${where}: bevægelse uden for vejen`).toBeLessThanOrEqual(m.xRange[1] + 1e-9);
          }
          if (m.yRange) {
            expect(y).toBeGreaterThanOrEqual(m.yRange[0] - 1e-6);
            expect(y).toBeLessThanOrEqual(m.yRange[1] + 1e-6);
          }
        }
      }
      if (ex.visual?.type === 'numberline') {
        const nl = ex.visual.nl;
        for (const p of nl.points ?? []) {
          expect(p.x).toBeGreaterThanOrEqual(nl.min);
          expect(p.x).toBeLessThanOrEqual(nl.max);
        }
      }

      // uafhængig genberegning af facit
      const exp = EXPECTED[id];
      if (exp) {
        const part = ex.kind === 'numeric' ? ex : ex.kind === 'formula' ? ex.numeric : null;
        expect(part, `${where}: forventede et talsvar`).not.toBeNull();
        const want = exp.calc(ex.data ?? {});
        expect(Math.abs(part!.answer - want), `${where}: facit ${part!.answer} ≠ genberegnet ${want}`).toBeLessThan(1e-9 * Math.max(1, Math.abs(want)));
        expect(part!.answer, `${where}: urealistisk svar`).toBeGreaterThanOrEqual(exp.range[0]);
        expect(part!.answer, `${where}: urealistisk svar`).toBeLessThanOrEqual(exp.range[1]);
      }
    }
    // der skal være reel variation
    expect(seen.size, `${id}: for få forskellige varianter`).toBeGreaterThan(Math.min(25, SEEDS / 10));
  });
});

it('alle talsvar-generatorer har en uafhængig genberegning', () => {
  for (const g of ALL_GENERATORS) {
    const ex = g.make(makeRng(1));
    if (ex.kind === 'numeric' || ex.kind === 'formula') expect(EXPECTED[g.id], `mangler EXPECTED for ${g.id}`).toBeDefined();
  }
});
