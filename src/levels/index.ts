// Register over alle baner. Ny bane = ny mappe + én linje her.

import { b1 } from './b1';
import { b2 } from './b2';
import { b3 } from './b3';
import { b4 } from './b4';
import { b5 } from './b5';
import { b6 } from './b6';
import type { LevelDef } from './types';

export interface LevelMeta {
  id: string;
  num: number;
  title: string;
  short: string;
  bonus?: boolean;
}

/** Den faste rækkefølge – også for baner, der ikke er bygget endnu */
export const LEVEL_ORDER: LevelMeta[] = [
  { id: 'b1', num: 1, title: 'Grundbegreber og konstant hastighed', short: 'Position, fart, enheder og s-t-grafer' },
  { id: 'b2', num: 2, title: 'Acceleration', short: 'a = Δv/Δt, v-t-grafer: hældning og areal' },
  { id: 'b3', num: 3, title: 'Konstant acceleration', short: 'De fire bevægelsesligninger og formelvalg' },
  { id: 'b4', num: 4, title: 'Frit fald og lodret kast', short: 'g = 9,82 m/s², fortegn og retning' },
  { id: 'b5', num: 5, title: 'Kræfter og F = m·a', short: 'Vektorer, kraftdiagrammer og Newtons 2. lov' },
  { id: 'b6', num: 6, title: 'Bonus: Skråt kast', short: 'Opdeling i x- og y-retning', bonus: true },
];

export const LEVELS: Record<string, LevelDef> = { b1, b2, b3, b4, b5, b6 };

export const LEVEL_IDS = LEVEL_ORDER.map((l) => l.id);
export const getLevel = (id: string): LevelDef | undefined => LEVELS[id];
