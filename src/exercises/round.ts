// Sammensætning af øverunder: én opgave pr. plads, sorteret fra let til svær.

import type { Rng } from '../core/rng';
import type { Generator, LevelDef } from '../levels/types';
import type { Exercise } from './types';

export function buildRound(level: LevelDef, rng: Rng): Exercise[] {
  const byId = new Map(level.generators.map((g) => [g.id, g]));
  const picked = level.round.map((slot) => byId.get(rng.pick(slot))!).filter(Boolean);
  return orderByDifficulty(picked, rng).map((g) => g.make(rng));
}

/** Træning af én færdighed på tværs af de baner, eleven har låst op */
export function buildSkillRound(gens: Generator[], skill: string, rng: Rng, n = 6): Exercise[] {
  const pool = gens.filter((g) => g.skills.includes(skill));
  if (!pool.length) return [];
  const picked: Generator[] = [];
  let bag: Generator[] = [];
  while (picked.length < n) {
    if (!bag.length) bag = rng.shuffle(pool);
    picked.push(bag.pop()!);
  }
  return orderByDifficulty(picked, rng).map((g) => g.make(rng));
}

function orderByDifficulty(gens: Generator[], rng: Rng): Generator[] {
  return gens
    .map((g) => ({ g, k: g.difficulty + rng.next() * 0.9 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.g);
}
