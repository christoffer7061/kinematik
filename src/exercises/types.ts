import type { Tol } from '../core/numbers';
import type { PlotSpec } from '../viz/plot';
import type { MotionSpec } from '../viz/scene';
import type { FbdSpec, NumberLineSpec } from '../viz/svgviz';

/** Et trin i løsningen: tekst (med $TeX$) og/eller en formel vist som display. */
export interface Step {
  text?: string;
  math?: string;
  /** "Aha"-bemærkning vist fremhævet */
  aha?: boolean;
}

export interface Mistake {
  value: number;
  why: string;
}

export interface NumericPart {
  answer: number;
  unit: string;
  decimals: number;
  tol?: Tol;
  /** Typiske fejl: hvis elevens svar rammer en af disse, forklares præcis hvad der gik galt */
  mistakes?: Mistake[];
  /** TeX foran inputfeltet, fx 'v =' */
  label?: string;
}

export type Visual =
  | { type: 'plot'; plot: PlotSpec }
  | { type: 'motion'; motion: MotionSpec }
  | { type: 'numberline'; nl: NumberLineSpec }
  | { type: 'fbd'; fbd: FbdSpec };

interface Base {
  genId: string;
  skills: string[];
  topic: string;
  prompt: string;
  visual?: Visual;
  hints: string[];
  solution: Step[];
  /** Råparametre – bruges af testene til at genberegne svaret uafhængigt */
  data?: Record<string, number | string | boolean | undefined>;
}

export interface NumericEx extends Base, NumericPart {
  kind: 'numeric';
}

export interface ChoiceOption {
  html?: string;
  plot?: PlotSpec;
  fbd?: FbdSpec;
  correct: boolean;
  /** Hvorfor denne mulighed er forkert (eller en kort bekræftelse hvis rigtig) */
  why: string;
  /** Unik nøgle til test af at mulighederne er forskellige */
  key: string;
}

export interface ChoiceEx extends Base {
  kind: 'choice';
  options: ChoiceOption[];
  /** Vis mulighederne i et gitter (fx grafer) */
  grid?: boolean;
}

export interface Quantity {
  sym: string; // intern nøgle, fx 'v0'
  tex: string; // fx 'v_0'
  name: string; // fx 'starthastighed'
  /** TeX-værdi hvis størrelsen er givet i opgaven, fx '2{,}0\\ \\mathrm{min}' */
  value?: string;
}

export interface FormulaOption {
  id: string;
  tex: string;
  vars: string[];
  /** Hvis formlen er forkert skrevet (fx v = s·t) – forklaring */
  wrong?: string;
  /** Formlen isoleret for hver variabel (TeX) */
  solve?: Record<string, string>;
}

export interface FormulaEx extends Base {
  kind: 'formula';
  quantities: Quantity[];
  given: string[];
  sought: string;
  formulas: FormulaOption[];
  numeric: NumericPart;
}

export interface DrawEx extends Base {
  kind: 'draw';
  plot: PlotSpec;
  handleXs: number[];
  startYs: number[];
  target: number[];
  snap: number;
  /** Til forklaringer: hvad y-aksen og hældningen hedder */
  yName: string;
  yUnit: string;
  slopeName: string;
  slopeUnit: string;
}

export type Exercise = NumericEx | ChoiceEx | FormulaEx | DrawEx;
