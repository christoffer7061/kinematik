// Seedet tilfældighedsgenerator (mulberry32), så en opgave kan genskabes ud fra sit seed
// og testene kan køre tusindvis af varianter deterministisk.

export interface Rng {
  next(): number;
  /** Heltal i [min, max] inkl. */
  int(min: number, max: number): number;
  /** Tal i [min, max] i trin af `step` (fx 0,5). Resultatet er renset for floating-point-støj. */
  stepped(min: number, max: number, step: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  bool(p?: number): boolean;
  sign(): 1 | -1;
}

export const clean = (x: number) => Math.round(x * 1e9) / 1e9;

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    stepped: (min, max, step) => clean(min + int(0, Math.max(0, Math.floor((max - min) / step + 1e-9))) * step),
    pick: (arr) => arr[int(0, arr.length - 1)],
    shuffle: (arr) => {
      const c = [...arr];
      for (let i = c.length - 1; i > 0; i--) {
        const j = int(0, i);
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    },
    bool: (p = 0.5) => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
  };
}

export const randomSeed = () => (Math.random() * 2 ** 32) >>> 0;
