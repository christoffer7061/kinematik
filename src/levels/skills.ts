// Færdigheder som opgaverne tagges med. Oversigtssiden bruger dem til at vise stærke/svage emner.

export const SKILLS: Record<string, { name: string; level: string }> = {
  begreber: { name: 'Position, forskydning, fart og hastighed', level: 'b1' },
  enheder: { name: 'Enheder og omregning (km/t ↔ m/s)', level: 'b1' },
  vektorer: { name: 'Vektorer, retning og fortegn', level: 'b1' },
  'v-s-t': { name: 'Konstant hastighed: v = s/t', level: 'b1' },
  formelvalg: { name: 'Givet/søgt og valg af formel', level: 'b1' },
  'st-graf': { name: 's-t-grafer (hældning = hastighed)', level: 'b1' },

  acc: { name: 'Acceleration: a = Δv/Δt', level: 'b2' },
  'vt-graf': { name: 'v-t-grafer (hældning og areal)', level: 'b2' },
  'at-graf': { name: 'a-t-grafer', level: 'b2' },

  'bev-lign': { name: 'Bevægelsesligningerne', level: 'b3' },
  'st-parabel': { name: 'Grafer ved konstant acceleration', level: 'b3' },

  'frit-fald': { name: 'Frit fald', level: 'b4' },
  'lodret-kast': { name: 'Lodret kast', level: 'b4' },

  kraftdiagram: { name: 'Kraftdiagrammer', level: 'b5' },
  resultant: { name: 'Resulterende kraft (vektorsum)', level: 'b5' },
  newton2: { name: 'Newtons 2. lov: F = m·a', level: 'b5' },

  komposanter: { name: 'Opdeling af vektorer i x og y', level: 'b6' },
  'skraat-kast': { name: 'Skråt kast', level: 'b6' },
};
