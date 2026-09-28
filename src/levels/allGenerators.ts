// Alle generatorer uden lektioner/DOM – bruges af testene og af træning pr. færdighed.
import { b1Generators } from './b1/generators';
import { b2Generators } from './b2/generators';
import { b3Generators } from './b3/generators';
import { b4Generators } from './b4/generators';
import { b5Generators } from './b5/generators';
import { b6Generators } from './b6/generators';
import type { Generator } from './types';

export const GENERATORS_BY_LEVEL: Record<string, Generator[]> = {
  b1: b1Generators,
  b2: b2Generators,
  b3: b3Generators,
  b4: b4Generators,
  b5: b5Generators,
  b6: b6Generators,
};

export const ALL_GENERATORS: Generator[] = Object.values(GENERATORS_BY_LEVEL).flat();
