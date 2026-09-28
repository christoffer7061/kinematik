import type { Rng } from '../core/rng';
import type { Exercise } from '../exercises/types';
import type { Widget } from '../viz/simlab';

type DOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** Det en generator returnerer – genId og skills udfyldes automatisk */
export type ExBody = DOmit<Exercise, 'genId' | 'skills'> & { skills?: string[] };

export interface Generator {
  id: string;
  title: string;
  skills: string[];
  /** 1 = let, 3 = svær – bestemmer rækkefølgen i en runde */
  difficulty: number;
  make(rng: Rng): Exercise;
}

export function gen(meta: Omit<Generator, 'make'>, make: (rng: Rng) => ExBody): Generator {
  return { ...meta, make: (rng) => ({ skills: meta.skills, ...make(rng), genId: meta.id }) as Exercise };
}

export interface LessonCheck {
  q: string;
  options: { html: string; correct: boolean; why: string }[];
}

export interface LessonCard {
  title: string;
  body: string;
  widget?: () => Widget;
  check?: LessonCheck;
  aha?: string;
}

export interface LevelDef {
  id: string;
  num: number;
  title: string;
  short: string;
  blurb: string;
  lesson: LessonCard[];
  generators: Generator[];
  /** Hver plads i en runde vælger én tilfældig generator fra listen */
  round: string[][];
  playground?: () => Widget;
  bonus?: boolean;
}
