import type { LevelDef } from '../types';
import { b3Generators } from './generators';
import { b3Lesson, formulaChooserWidget } from './lesson';

export const b3: LevelDef = {
  id: 'b3',
  num: 3,
  title: 'Konstant acceleration',
  short: 'De fire bevægelsesligninger og formelvalg',
  blurb: 'Fem størrelser, fire formler – og én strategi, der altid virker: find den størrelse, der hverken er givet eller søgt. Du regner bremselængder, startbaner og motorvejsramper.',
  lesson: b3Lesson,
  generators: b3Generators,
  round: [
    ['b3.formelvalg'],
    ['b3.v-fra-t'],
    ['b3.t-fra-v'],
    ['b3.s-fra-t'],
    ['b3.s-avg'],
    ['b3.formelvalg'],
    ['b3.v-fra-s', 'b3.a-fra-s'],
    ['b3.bremse'],
    ['b3.begreb'],
    ['b3.st-match'],
  ],
  playground: formulaChooserWidget,
};
