// Formelarket: formler, enheder og "hvornår bruger jeg den?".

export interface SheetFormula {
  tex: string;
  name: string;
  when: string;
  symbols?: string;
  pitfall?: string;
}
export interface SheetSection {
  id: string;
  level: string;
  title: string;
  intro?: string;
  items: SheetFormula[];
}

export const SHEET: SheetSection[] = [
  {
    id: 'enheder',
    level: 'b1',
    title: 'Enheder og omregning',
    intro: 'Regn i SI-enheder – meter (m), sekunder (s), kilogram (kg) – så passer formlerne altid sammen.',
    items: [
      { tex: '1\\ \\mathrm{km/t} = \\frac{1}{3{,}6}\\ \\mathrm{m/s}', name: 'km/t ↔ m/s', when: 'km/t → m/s: divider med 3,6. m/s → km/t: gang med 3,6.', pitfall: 'Tallet i m/s er altid det mindste. 36 km/t = 10 m/s.' },
      { tex: '1\\ \\mathrm{min} = 60\\ \\mathrm{s},\\quad 1\\ \\mathrm{t} = 3600\\ \\mathrm{s}', name: 'Tid', when: 'Omregn til sekunder, før du sætter ind i en formel med m/s.' },
      { tex: '1\\ \\mathrm{km} = 1000\\ \\mathrm{m},\\quad 1\\ \\mathrm{cm} = 0{,}01\\ \\mathrm{m}', name: 'Længde', when: 'Omregn til meter.' },
    ],
  },
  {
    id: 'konstant-v',
    level: 'b1',
    title: 'Konstant hastighed',
    items: [
      { tex: '\\Delta s = s_{\\text{slut}} - s_{\\text{start}}', name: 'Forskydning', when: 'Ændringen i position (en vektor – fortegnet er retningen).', pitfall: 'Strækning er den samlede vej og er aldrig negativ. Forskydning kan være 0 eller negativ.' },
      { tex: 'v = \\frac{\\Delta s}{\\Delta t}', name: 'Hastighed', when: 'Når hastigheden er konstant – eller når du vil finde gennemsnitshastigheden.', symbols: '$v$ i m/s, $s$ i m, $t$ i s', pitfall: 'Isolér rigtigt: $s = v\\cdot t$ og $t = s/v$.' },
      { tex: 's = s_0 + v\\cdot t', name: 'Stedfunktion', when: 'Position til tiden $t$, når man starter i $s_0$.' },
    ],
  },
  {
    id: 'grafer',
    level: 'b2',
    title: 'Grafer: hældning og areal',
    intro: 'Tre grafer, to regler. Hældningen af én graf er den næste graf. Arealet under én graf er ændringen i den forrige.',
    items: [
      { tex: '\\text{hældning}(s\\text{-}t) = v', name: 's-t-graf', when: 'Ret linje = konstant hastighed. Krum = acceleration. Vandret = stilstand.' },
      { tex: '\\text{hældning}(v\\text{-}t) = a,\\quad \\text{areal}(v\\text{-}t) = \\Delta s', name: 'v-t-graf', when: 'Aflæs accelerationen som hældning og strækningen som arealet under grafen.' },
      { tex: '\\text{areal}(a\\text{-}t) = \\Delta v', name: 'a-t-graf', when: 'Konstant acceleration giver en vandret a-t-graf.' },
    ],
  },
  {
    id: 'acc',
    level: 'b2',
    title: 'Acceleration',
    items: [
      { tex: 'a = \\frac{\\Delta v}{\\Delta t} = \\frac{v - v_0}{t}', name: 'Acceleration', when: 'Hvor meget hastigheden ændres pr. sekund.', symbols: '$a$ i m/s² ("m/s pr. sekund")', pitfall: 'Opbremsning: $v$ bliver mindre, så $a$ har modsat fortegn af $v$.' },
    ],
  },
  {
    id: 'bev',
    level: 'b3',
    title: 'Konstant acceleration – de fire bevægelsesligninger',
    intro: 'Hver formel mangler præcis én af størrelserne $s, v_0, v, a, t$. Find den størrelse, der hverken er givet eller søgt – og vælg formlen, der mangler netop den.',
    items: [
      { tex: 'v = v_0 + a\\cdot t', name: 'Mangler s', when: 'Når strækningen hverken er givet eller søgt.' },
      { tex: 's = v_0\\cdot t + \\tfrac12\\, a\\cdot t^2', name: 'Mangler v', when: 'Når sluthastigheden hverken er givet eller søgt.', pitfall: 'Husk ½ og at $t$ skal i anden.' },
      { tex: 'v^2 = v_0^2 + 2a\\cdot s', name: 'Mangler t', when: 'Når tiden hverken er givet eller søgt – fx bremselængder.', pitfall: 'Husk kvadratroden, når du finder $v$.' },
      { tex: 's = \\frac{v_0 + v}{2}\\cdot t', name: 'Mangler a', when: 'Når accelerationen hverken er givet eller søgt.' },
      { tex: 's = s_0 + v_0 t + \\tfrac12 a t^2', name: 'Stedfunktion', when: 'Positionen til tiden $t$, når man starter i $s_0$.' },
    ],
  },
  {
    id: 'fald',
    level: 'b4',
    title: 'Frit fald og lodret kast',
    intro: 'Vælg opad som positiv retning. Så er accelerationen altid $a = -g$ – både på vej op, i toppunktet og på vej ned.',
    items: [
      { tex: 'g = 9{,}82\\ \\mathrm{m/s^2}', name: 'Tyngdeaccelerationen', when: 'I Danmark. Vi ser bort fra luftmodstand.' },
      { tex: 'v = v_0 - g\\cdot t', name: 'Hastighed', when: 'Hastigheden (med fortegn) til tiden $t$.' },
      { tex: 'y = y_0 + v_0 t - \\tfrac12 g t^2', name: 'Højde', when: 'Højden til tiden $t$.' },
      { tex: 'v^2 = v_0^2 - 2g\\,(y - y_0)', name: 'Uden tid', when: 'Fart i en bestemt højde.' },
      { tex: 't_{\\text{top}} = \\frac{v_0}{g},\\qquad h_{\\max} = \\frac{v_0^2}{2g}', name: 'Toppunktet', when: 'I toppunktet er $v = 0$, men $a = -g$ stadig.' },
      { tex: 't = \\sqrt{\\frac{2h}{g}},\\qquad v = \\sqrt{2gh}', name: 'Sluppet fra hvile', when: 'Faldtid og slutfart når noget slippes fra højden $h$.' },
    ],
  },
  {
    id: 'kraft',
    level: 'b5',
    title: 'Kræfter og Newtons love',
    intro: 'Kræfter er vektorer. Læg dem sammen med fortegn (1D) eller i komposanter (2D) for at få den resulterende kraft.',
    items: [
      { tex: 'F_{\\mathrm{res}} = m\\cdot a', name: 'Newtons 2. lov', when: 'Forbinder kræfter og bevægelse. $F_{\\mathrm{res}}$ og $a$ peger samme vej.', symbols: '$F$ i newton (N), $m$ i kg, $a$ i m/s²', pitfall: '$1\\ \\mathrm{N} = 1\\ \\mathrm{kg\\cdot m/s^2}$. Brug den <b>resulterende</b> kraft – ikke bare én af kræfterne.' },
      { tex: 'F_{\\mathrm{res}} = 0 \\;\\Leftrightarrow\\; v \\text{ konstant}', name: 'Newtons 1. lov', when: 'Står stille eller bevæger sig med konstant hastighed ⇔ kræfterne ophæver hinanden.' },
      { tex: 'F_t = m\\cdot g', name: 'Tyngdekraft', when: 'Peger altid lodret nedad.' },
      { tex: 'F_{\\mathrm{res}} = F_1 + F_2 + \\dots', name: 'Resulterende kraft (1D)', when: 'Læg kræfterne sammen med fortegn (fx højre positiv).' },
      { tex: 'F_x = F\\cos\\theta,\\quad F_y = F\\sin\\theta', name: 'Komposanter', when: 'Del en skrå vektor op i x- og y-retning. $\\theta$ måles fra vandret.', pitfall: 'Lommeregneren skal stå i grader (DEG).' },
    ],
  },
  {
    id: 'skraat',
    level: 'b6',
    title: 'Skråt kast',
    intro: 'To uafhængige bevægelser: konstant hastighed vandret, lodret kast lodret. Tiden er den samme i begge.',
    items: [
      { tex: 'v_{0x} = v_0\\cos\\theta,\\quad v_{0y} = v_0\\sin\\theta', name: 'Starthastighed opdelt', when: 'Første skridt i alle skrå kast.' },
      { tex: 'x = v_{0x}\\cdot t', name: 'Vandret', when: 'Ingen acceleration vandret (uden luftmodstand).' },
      { tex: 'y = y_0 + v_{0y} t - \\tfrac12 g t^2', name: 'Lodret', when: 'Præcis som et lodret kast.' },
      { tex: 't_{\\text{top}} = \\frac{v_{0y}}{g},\\qquad x_{\\max} = \\frac{v_0^2 \\sin(2\\theta)}{g}', name: 'Toppunkt og kastevidde', when: 'Kastevidden gælder kun, når man lander i samme højde som man kaster fra.' },
    ],
  },
];
