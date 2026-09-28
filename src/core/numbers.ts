// Tal: afrunding, dansk formatering (decimalkomma), TeX-formatering og tolerant parsing af input.

export type Tol = { abs?: number; rel?: number };

/** Symmetrisk afrunding til d decimaler, robust over for fx 1,005. */
export function round(x: number, d = 0): number {
  if (!isFinite(x)) return x;
  const s = Math.sign(x);
  const ax = Math.abs(parseFloat(x.toPrecision(12)));
  return s * Number(Math.round(Number(ax + 'e' + d)) + 'e-' + d);
}

/** Afrunding til et antal betydende cifre */
export function roundSig(x: number, sig: number): number {
  if (x === 0 || !isFinite(x)) return x;
  const mag = Math.floor(Math.log10(Math.abs(x)));
  const d = sig - 1 - mag;
  return d >= 0 ? round(x, d) : round(x / 10 ** -d, 0) * 10 ** -d;
}

/** Antal decimaler for ca. 3 betydende cifre (0–3 decimaler). */
export function decFor(x: number, sig = 3): number {
  if (x === 0 || !isFinite(x)) return 0;
  if (Math.abs(x - Math.round(x)) < 1e-9 && Math.abs(x) >= 1) return 0;
  const mag = Math.floor(Math.log10(Math.abs(x)));
  return Math.max(0, Math.min(3, sig - 1 - mag));
}

function group(intPart: string, sep: string): string {
  if (intPart.length <= 4) return intPart;
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

function toParts(x: number, d?: number): { neg: boolean; int: string; frac: string } {
  const dd = d ?? decFor(x);
  const r = round(x, dd);
  const neg = r < 0 && r !== 0;
  let str = Math.abs(r).toFixed(dd);
  if (str.includes('.')) str = str.replace(/0+$/, '').replace(/\.$/, '');
  const [i, f = ''] = str.split('.');
  return { neg, int: i, frac: f };
}

/** Dansk talformat: decimalkomma, rigtigt minus, tynd mellemrum som tusindtalsskille. Nuller i halen fjernes. */
export function fmt(x: number, d?: number): string {
  const p = toParts(x, d);
  return (p.neg ? '−' : '') + group(p.int, ' ') + (p.frac ? ',' + p.frac : '');
}

/** Samme som fmt, men som TeX (komma uden ekstra luft). */
export function tn(x: number, d?: number): string {
  const p = toParts(x, d);
  return (p.neg ? '-' : '') + group(p.int, '\\,') + (p.frac ? '{,}' + p.frac : '');
}

/** TeX for en enhed, fx 'm/s^2' -> \mathrm{m/s^2} */
export const un = (unit: string) => (unit ? `\\mathrm{${unit.replace(/°/g, '^\\circ')}}` : '');

/** TeX for en størrelse med enhed: 12,5 m/s */
export const tq = (x: number, unit: string, d?: number) =>
  unit === '°' ? `${tn(x, d)}^\\circ` : `${tn(x, d)}\\ ${un(unit)}`;

/** Enhed som almindelig tekst: m/s^2 -> m/s² */
export const unitText = (unit: string) => unit.replace('^2', '²').replace('^3', '³');

/** Dansk tal med enhed som ren tekst */
export const fq = (x: number, unit: string, d?: number) =>
  unit === '°' ? `${fmt(x, d)}°` : `${fmt(x, d)} ${unitText(unit)}`;

/**
 * Læser et tal skrevet af en elev. Accepterer komma eller punktum, mellemrum,
 * unicode-minus og en efterfølgende enhed ("12,5 m/s"). Returnerer null ved tvivl.
 */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/[−–]/g, '-').replace(/\s+/g, '');
  const m = s.match(/^([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?)/);
  if (!m) return null;
  const rest = s.slice(m[0].length);
  if (/^[\d.,]/.test(rest)) return null; // fx "1.234,5" – tvetydigt
  const n = Number(m[1].replace(',', '.'));
  return isFinite(n) ? n : null;
}

export function defaultTol(decimals: number): Tol {
  return { rel: 0.02, abs: 0.51 * 10 ** -decimals };
}

export function isClose(input: number, target: number, tol: Tol): boolean {
  const lim = Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(target));
  return Math.abs(input - target) <= lim + 1e-9;
}

export function niceStep(range: number, target: number): number {
  const raw = range / Math.max(1, target);
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  const n = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  return n * p;
}

/** Runder en akse-grænse "pænt" udad */
export function niceBound(x: number, step: number, dir: 'up' | 'down'): number {
  return (dir === 'up' ? Math.ceil(x / step - 1e-9) : Math.floor(x / step + 1e-9)) * step;
}
