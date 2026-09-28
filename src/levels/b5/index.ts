import type { LevelDef } from '../types';
import { b5Generators } from './generators';
import { b5Lesson, forceLab } from './lesson';

export const b5: LevelDef = {
  id: 'b5',
  num: 5,
  title: 'Kræfter og F = m·a',
  short: 'Vektorer, kraftdiagrammer og Newtons 2. lov',
  blurb: 'Hvorfor accelererer ting? Du lærer at tegne kraftdiagrammer, lægge kræfter sammen som vektorer, dele en skrå kraft op i komposanter – og bruge F = m·a til at forbinde kræfter med bevægelse.',
  lesson: b5Lesson,
  generators: b5Generators,
  round: [
    ['b5.tyngdekraft'],
    ['b5.begreb'],
    ['b5.resultant'],
    ['b5.kraftdiagram'],
    ['b5.find-a'],
    ['b5.find-F'],
    ['b5.kraefter-til-a'],
    ['b5.komposanter'],
    ['b5.lodret'],
    ['b5.kraft-kinematik'],
  ],
  playground: forceLab,
};
