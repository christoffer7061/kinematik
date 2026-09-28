import { describe, expect, it } from 'vitest';
import { fmt, parseNumber, round, tn, decFor } from '../src/core/numbers';
import { finishRound, isUnlocked, recordAnswer, starsFor, touchDay } from '../src/core/progress';
import { makeRng } from '../src/core/rng';
import { emptyState } from '../src/core/store';
import { checkNumeric, formulaValidity, genericDiagnosis } from '../src/exercises/check';
import { F, q } from '../src/exercises/build';
import { buildRound } from '../src/exercises/round';
import { LEVELS } from '../src/levels';

describe('tal og formatering', () => {
  it('runder symmetrisk og robust', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(-2.5, 0)).toBe(-3);
    expect(round(19.4444, 1)).toBe(19.4);
  });
  it('formaterer dansk', () => {
    expect(fmt(12.5)).toBe('12,5');
    expect(fmt(-3)).toBe('−3');
    expect(fmt(20, 1)).toBe('20');
    expect(fmt(12000)).toBe('12 000');
    expect(fmt(1234)).toBe('1234');
    expect(tn(0.25)).toBe('0{,}25');
  });
  it('vælger ca. 3 betydende cifre', () => {
    expect(decFor(19.444)).toBe(1);
    expect(decFor(5.5556)).toBe(2);
    expect(decFor(20)).toBe(0);
    expect(decFor(0.0873)).toBe(3);
  });
  it('læser elevens input tolerant', () => {
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber(' 12.5 ')).toBe(12.5);
    expect(parseNumber('−3')).toBe(-3);
    expect(parseNumber('20 m/s')).toBe(20);
    expect(parseNumber('1 200')).toBe(1200);
    expect(parseNumber(',5')).toBe(0.5);
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1.234,5')).toBeNull();
  });
});

describe('fejldiagnose', () => {
  it('genkender typiske fejl', () => {
    expect(genericDiagnosis(-20, 20)).toMatch(/fortegnet/);
    expect(genericDiagnosis(72, 20)).toMatch(/3,6/);
    expect(genericDiagnosis(20000, 20)).toMatch(/1000/);
    expect(genericDiagnosis(40, 20)).toMatch(/dobbelt/);
    expect(genericDiagnosis(23.7, 20)).toBeNull();
  });
  it('specifikke fejl går forud for generelle', () => {
    const r = checkNumeric({ answer: 20, unit: 'm/s', decimals: 0, mistakes: [{ value: 72, why: 'SPECIFIK' }] }, 72);
    expect(r.why).toBe('SPECIFIK');
  });
  it('accepterer afrunding inden for tolerancen', () => {
    expect(checkNumeric({ answer: 5.5556, unit: 'm/s', decimals: 2 }, 5.6).ok).toBe(true);
    expect(checkNumeric({ answer: 5.5556, unit: 'm/s', decimals: 2 }, 5.2).ok).toBe(false);
    expect(checkNumeric({ answer: 0, unit: 'm', decimals: 0 }, 0).ok).toBe(true);
  });
  it('forklarer hvorfor en formel ikke kan bruges', () => {
    const qs = [q('s'), q('t'), q('v'), q('a'), q('v0')];
    expect(formulaValidity(F.vst, ['s', 't'], 'v', qs).ok).toBe(true);
    expect(formulaValidity(F.vstWrong1, ['s', 't'], 'v', qs).ok).toBe(false);
    expect(formulaValidity(F.v2, ['v0', 'v', 's'], 't', qs).why).toMatch(/indeholder slet ikke/);
    expect(formulaValidity(F.sv0t, ['v0', 't'], 's', qs).why).toMatch(/ubekendte/);
  });
});

describe('progression', () => {
  it('giver stjerner efter procent og hints', () => {
    expect(starsFor(1, false)).toBe(3);
    expect(starsFor(1, true)).toBe(2);
    expect(starsFor(0.9, false)).toBe(2);
    expect(starsFor(0.8, false)).toBe(1);
    expect(starsFor(0.75, false)).toBe(0);
  });
  it('låser næste bane op ved 80 %', () => {
    const s = emptyState();
    const ids = ['b1', 'b2', 'b3'];
    expect(isUnlocked(s, ids, 'b1')).toBe(true);
    expect(isUnlocked(s, ids, 'b2')).toBe(false);
    const o = finishRound(s, 'b1', 7, 10, false);
    expect(o.unlockedNext).toBe(false);
    expect(isUnlocked(s, ids, 'b2')).toBe(false);
    const o2 = finishRound(s, 'b1', 8, 10, true);
    expect(o2.unlockedNext).toBe(true);
    expect(isUnlocked(s, ids, 'b2')).toBe(true);
    expect(isUnlocked(s, ids, 'b3')).toBe(false);
  });
  it('tæller dage i træk', () => {
    const s = emptyState();
    touchDay(s, new Date(2026, 0, 1));
    touchDay(s, new Date(2026, 0, 2));
    touchDay(s, new Date(2026, 0, 2));
    expect(s.day.streak).toBe(2);
    touchDay(s, new Date(2026, 0, 5));
    expect(s.day.streak).toBe(1);
  });
  it('registrerer færdigheder og XP', () => {
    const s = emptyState();
    const xp = recordAnswer(s, { skillResults: { enheder: true }, points: 1, hints: 1 });
    expect(xp).toBe(8);
    expect(s.skills.enheder.recent).toEqual([1]);
  });
});

describe('runder', () => {
  it('bygger en fuld runde for hver bane', () => {
    for (const lv of Object.values(LEVELS)) {
      const ids = new Set(lv.generators.map((g) => g.id));
      for (const slot of lv.round) for (const id of slot) expect(ids.has(id), `${lv.id}: ukendt generator ${id}`).toBe(true);
      for (let seed = 1; seed < 50; seed++) {
        const r = buildRound(lv, makeRng(seed));
        expect(r.length).toBe(lv.round.length);
      }
    }
  });
});
