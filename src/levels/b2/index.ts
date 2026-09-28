import type { LevelDef } from '../types';
import { b2Generators } from './generators';
import { accLab, b2Lesson } from './lesson';

export const b2: LevelDef = {
  id: 'b2',
  num: 2,
  title: 'Acceleration',
  short: 'a = Δv/Δt, v-t-grafer: hældning og areal',
  blurb: 'Hvad sker der, når hastigheden ændrer sig? Du lærer at regne med acceleration, forstå hvorfor en opbremsning giver negativ acceleration, og aflæse både hældning og areal på en v-t-graf.',
  lesson: b2Lesson,
  generators: b2Generators,
  round: [
    ['b2.a-def'],
    ['b2.opbremsning'],
    ['b2.find-v'],
    ['b2.begreb'],
    ['b2.graf-match'],
    ['b2.vt-haeldning'],
    ['b2.vt-areal'],
    ['b2.vt-areal', 'b2.vt-haeldning'],
    ['b2.at-match'],
    ['b2.tegn-vt'],
  ],
  playground: accLab,
};
