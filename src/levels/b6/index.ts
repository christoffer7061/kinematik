import type { LevelDef } from '../types';
import { b6Generators } from './generators';
import { b6Lesson, projectileLab } from './lesson';

export const b6: LevelDef = {
  id: 'b6',
  num: 6,
  title: 'Bonus: Skråt kast',
  short: 'Opdeling i x- og y-retning',
  blurb: 'Når noget kastes på skrå, er det to bevægelser på én gang: konstant fart vandret og et lodret kast lodret. Du samler alt fra de andre baner – og vektoropdelingen fra bane 5.',
  lesson: b6Lesson,
  generators: b6Generators,
  round: [
    ['b6.komposanter'],
    ['b6.begreb'],
    ['b6.fart-i-top'],
    ['b6.flyvetid'],
    ['b6.maks-hoejde'],
    ['b6.vandret-kast'],
    ['b6.kastevidde'],
    ['b6.begreb'],
    ['b6.vandret-kast', 'b6.kastevidde'],
    ['b6.flyvetid', 'b6.maks-hoejde', 'b6.komposanter'],
  ],
  playground: () => projectileLab(),
  bonus: true,
};
