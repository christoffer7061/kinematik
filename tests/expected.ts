// Uafhængige genberegninger af facit ud fra opgavens råparametre (ex.data),
// plus et realistisk interval for svaret. Skrevet separat fra generatorerne med vilje.

type Data = Record<string, number | string | boolean | undefined>;
const n = (d: Data, k: string) => d[k] as number;

export const EXPECTED: Record<string, { calc: (d: Data) => number; range: [number, number] }> = {
  // ---- bane 1 ----
  'b1.kmt-ms': { calc: (d) => (n(d, 'kmt') * 1000) / 3600, range: [2, 55] },
  'b1.ms-kmt': { calc: (d) => (n(d, 'ms') * 3600) / 1000, range: [10, 1000] },
  'b1.forskydning': { calc: (d) => n(d, 'B') - n(d, 'A'), range: [-80, 80] },
  'b1.find-v': { calc: (d) => n(d, 's') / n(d, 't'), range: [0.03, 15] },
  'b1.find-s': { calc: (d) => n(d, 'v') * n(d, 'tSec'), range: [50, 15000] },
  'b1.find-t': {
    calc: (d) => (d.case === 'torden' ? (n(d, 'km') * 1000) / 343 : d.case === 'motorvej' ? (n(d, 'km') / n(d, 'kmt')) * 60 : n(d, 's') / n(d, 'v')),
    range: [1, 2500],
  },
  'b1.fart-omregning': { calc: (d) => (n(d, 'km') * 1000) / (n(d, 'min') * 60), range: [2, 12] },
  'b1.st-haeldning': { calc: (d) => (n(d, 's1') - n(d, 's0')) / n(d, 'T'), range: [-20, 20] },

  // ---- bane 2 ----
  'b2.a-def': { calc: (d) => ((n(d, 'v') - n(d, 'v0')) * (d.unit === 'km/t' ? 1000 / 3600 : 1)) / n(d, 't'), range: [0.1, 6] },
  'b2.opbremsning': { calc: (d) => (-n(d, 'v0') * (d.unit === 'km/t' ? 1000 / 3600 : 1)) / n(d, 't'), range: [-16, -1] },
  'b2.find-v': { calc: (d) => n(d, 'v0') + n(d, 'a') * n(d, 't'), range: [3, 160] },
  'b2.vt-haeldning': { calc: (d) => (n(d, 'v1') - n(d, 'v0')) / n(d, 'T'), range: [-10, 10] },
  'b2.vt-areal': {
    // arealet beregnes numerisk (trapezmetoden) ud fra grafens knækpunkter
    calc: (d) => {
      const V = n(d, 'V'), t1 = n(d, 't1'), T = n(d, 'T');
      const pts: [number, number][] = d.variant === 'op' ? [[0, 0], [t1, V], [T, V]] : d.variant === 'ned' ? [[0, V], [t1, V], [T, 0]] : [[0, n(d, 'v0')], [T, n(d, 'v1')]];
      let s = 0;
      for (let i = 1; i < pts.length; i++) s += ((pts[i][1] + pts[i - 1][1]) / 2) * (pts[i][0] - pts[i - 1][0]);
      return s;
    },
    range: [5, 300],
  },

  // ---- bane 3 ----
  'b3.v-fra-t': { calc: (d) => n(d, 'v0') + n(d, 'a') * n(d, 't'), range: [1, 60] },
  'b3.s-fra-t': { calc: (d) => n(d, 'v0') * n(d, 't') + (n(d, 'a') * n(d, 't') ** 2) / 2, range: [5, 400] },
  'b3.v-fra-s': { calc: (d) => Math.sqrt(n(d, 'v0') ** 2 + 2 * n(d, 'a') * n(d, 's')), range: [5, 40] },
  'b3.a-fra-s': { calc: (d) => (n(d, 'v') ** 2 - n(d, 'v0') ** 2) / (2 * n(d, 's')), range: [-9, 9] },
  'b3.t-fra-v': { calc: (d) => (n(d, 'v') - n(d, 'v0')) / n(d, 'a'), range: [1, 10] },
  'b3.s-avg': { calc: (d) => ((n(d, 'v0') + n(d, 'v')) * n(d, 't')) / 2, range: [100, 2000] },
  'b3.bremse': { calc: (d) => (n(d, 'kmt') * 1000 / 3600) ** 2 / (2 * Math.abs(n(d, 'a'))), range: [3, 100] },

  // ---- bane 4 (g = 9,82 m/s², opad positiv) ----
  'b4.fald-tid': { calc: (d) => Math.sqrt((2 * n(d, 'h')) / 9.82), range: [0.4, 3] },
  'b4.fald-fart': { calc: (d) => Math.sqrt(2 * 9.82 * n(d, 'h')), range: [4, 28] },
  'b4.fald-efter-t': { calc: (d) => (d.ask === 's' ? 4.91 * n(d, 't') ** 2 : 9.82 * n(d, 't')), range: [1, 50] },
  'b4.kast-hoejde': { calc: (d) => n(d, 'v0') ** 2 / 19.64, range: [1, 33] },
  'b4.kast-tid': { calc: (d) => ((d.total ? 2 : 1) * n(d, 'v0')) / 9.82, range: [0.3, 6] },
  'b4.kast-v-efter-t': { calc: (d) => n(d, 'v0') - 9.82 * n(d, 't'), range: [-22, 16] },
  'b4.hoejde-efter-t': { calc: (d) => n(d, 'y0') + n(d, 'v0') * n(d, 't') - 4.91 * n(d, 't') ** 2, range: [1, 40] },

  // ---- bane 5 ----
  'b5.tyngdekraft': { calc: (d) => n(d, 'm') * 9.82, range: [25, 18000] },
  'b5.resultant': { calc: (d) => [0, 1, 2].reduce((acc, i) => acc + (d[`m${i}`] === undefined ? 0 : n(d, `m${i}`) * n(d, `d${i}`)), 0), range: [-400, 600] },
  'b5.find-a': { calc: (d) => n(d, 'F') / n(d, 'm'), range: [0.3, 180] },
  'b5.find-F': { calc: (d) => n(d, 'm') * n(d, 'a'), range: [20, 160000] },
  'b5.kraefter-til-a': { calc: (d) => (n(d, 'Ff') - n(d, 'Fb')) / n(d, 'm'), range: [0.2, 6] },
  'b5.lodret': { calc: (d) => n(d, 'F') / n(d, 'm') - 9.82, range: [0.3, 95] },
  'b5.kraft-kinematik': {
    calc: (d) => (d.case === 'F' ? (n(d, 'm') * (n(d, 'kmt') / 3.6)) / n(d, 't') : (n(d, 'F') / n(d, 'm')) * n(d, 't')),
    range: [1, 8000],
  },
  // ---- bane 6 ----
  'b6.komposanter': { calc: (d) => n(d, 'v0') * (d.askX ? Math.cos((n(d, 'th') * Math.PI) / 180) : Math.sin((n(d, 'th') * Math.PI) / 180)), range: [2, 29] },
  'b6.flyvetid': { calc: (d) => (2 * n(d, 'v0') * Math.sin((n(d, 'th') * Math.PI) / 180)) / 9.82, range: [0.5, 6] },
  'b6.maks-hoejde': { calc: (d) => (n(d, 'v0') * Math.sin((n(d, 'th') * Math.PI) / 180)) ** 2 / 19.64, range: [0.3, 41] },
  'b6.kastevidde': { calc: (d) => (n(d, 'v0') ** 2 * Math.sin((2 * n(d, 'th') * Math.PI) / 180)) / 9.82, range: [3, 92] },
  'b6.vandret-kast': { calc: (d) => n(d, 'v0') * Math.sqrt((2 * n(d, 'h')) / 9.82), range: [0.3, 45] },
  'b6.fart-i-top': { calc: (d) => n(d, 'v0') * Math.cos((n(d, 'th') * Math.PI) / 180), range: [2, 29] },

  'b5.komposanter': { calc: (d) => n(d, 'F') * (d.askX ? Math.cos((n(d, 'th') * Math.PI) / 180) : Math.sin((n(d, 'th') * Math.PI) / 180)), range: [10, 300] },
};
