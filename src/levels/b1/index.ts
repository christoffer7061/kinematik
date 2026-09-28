import type { LevelDef } from '../types';
import { b1Generators } from './generators';
import { b1Lesson, constVelLab } from './lesson';

export const b1: LevelDef = {
  id: 'b1',
  num: 1,
  title: 'Grundbegreber og konstant hastighed',
  short: 'Position, fart, enheder og s-t-grafer',
  blurb: 'Hvad er forskellen på strækning og forskydning – og på fart og hastighed? Du lærer at omregne km/t til m/s, bruge v = s/t og aflæse hastigheden som hældningen på en s-t-graf.',
  lesson: b1Lesson,
  generators: b1Generators,
  round: [
    ['b1.kmt-ms', 'b1.ms-kmt'],
    ['b1.begreb'],
    ['b1.forskydning'],
    ['b1.find-v'],
    ['b1.find-s', 'b1.find-t'],
    ['b1.fart-omregning'],
    ['b1.st-haeldning'],
    ['b1.graf-aflaes'],
    ['b1.graf-match'],
    ['b1.tegn-st'],
  ],
  playground: constVelLab,
};
