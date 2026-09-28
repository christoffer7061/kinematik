// Faste farver pr. fysisk størrelse, så eleven genkender dem på tværs af grafer, pile og tal.
export const C = {
  s: '#0e7490', // position / forskydning (samme som accentfarven)
  v: '#7c3aed', // hastighed
  a: '#d97706', // acceleration
  F: '#db2777', // kraft
  g: '#475569', // tyngde
  ink: '#18212b',
  muted: '#5d6b7a',
  grid: '#e7ecf1',
  axis: '#8c99a6',
  good: '#15803d',
  bad: '#c43d3d',
  obj: '#1f3a5f',
};

export type Qty = 's' | 'v' | 'a' | 'F';

export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
