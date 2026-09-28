import type { LevelDef } from '../types';
import { b4Generators } from './generators';
import { b4Lesson, throwLab } from './lesson';

export const b4: LevelDef = {
  id: 'b4',
  num: 4,
  title: 'Frit fald og lodret kast',
  short: 'g = 9,82 m/s², fortegn og retning',
  blurb: 'Alt falder med den samme acceleration. Du lærer at holde styr på fortegn, når ting kastes op og falder ned – og hvorfor accelerationen ikke er 0 i toppunktet.',
  lesson: b4Lesson,
  generators: b4Generators,
  round: [
    ['b4.fald-tid'],
    ['b4.fald-efter-t'],
    ['b4.begreb'],
    ['b4.fald-fart'],
    ['b4.kast-hoejde'],
    ['b4.kast-tid'],
    ['b4.vt-match'],
    ['b4.kast-v-efter-t'],
    ['b4.hoejde-efter-t'],
    ['b4.begreb'],
  ],
  playground: throwLab,
};
