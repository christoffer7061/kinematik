# Kinematik – fysik du kan se

En lille, interaktiv læringsside på dansk om kinematik og kræfter til gymnasiet (1.g/2.g, fysik C/B).
Eleven *ser* fysikken: en bil, bold eller raket bevæger sig, mens s-t-, v-t- og a-t-graferne tegnes live,
og vektorpile viser hastighed, acceleration og kraft. Bagefter øver hun sig med opgaver, der aldrig slipper op.

Ren frontend (Vite + TypeScript, ingen frameworks). Grafer og simuleringer tegnes på canvas, formler med KaTeX.
Fremgang gemmes i `localStorage` – ingen login, ingen server.

## Baner

| Bane | Emne |
|---|---|
| 1 | Grundbegreber og konstant hastighed (position, forskydning, fart/hastighed, km/t ↔ m/s, s-t-grafer) |
| 2 | Acceleration (a = Δv/Δt, opbremsning, v-t-grafens hældning og areal, a-t-grafer) |
| 3 | Konstant acceleration (de fire bevægelsesligninger og strategien for formelvalg) |
| 4 | Frit fald og lodret kast (g = 9,82 m/s², fortegn, symmetri) |
| 5 | Kræfter og F = m·a (vektorer, kraftdiagrammer, komposanter, Newtons love) |
| 6 | Bonus: skråt kast (opdeling i x og y) |

Hver bane har **Lær** (korte kort med simuleringer og små tjek-spørgsmål), **Øv** (10 tilfældigt genererede
opgaver – 80 % låser næste bane op) og en **Legeplads**. Derudover: formelark, oversigt over stærke/svage
færdigheder med forslag til hvad der skal øves, XP, stjerner og dage-i-træk.

## Kom i gang

Kræver [Node.js](https://nodejs.org) 20 eller nyere.

```bash
npm install
npm run dev        # udviklingsserver på http://localhost:5178
npm test           # tester alle opgavegeneratorer (se nedenfor)
npm run build      # bygger den færdige side til mappen dist/
npm run preview    # viser den byggede side lokalt
```

## Udgiv gratis

Siden bygges med relative stier (`base: './'`), så `dist/` kan lægges hvor som helst.

**GitHub Pages**
1. Læg projektet i et GitHub-repository (mappen `kinematik` som rod).
2. Gå til *Settings → Pages* og vælg *Source: GitHub Actions*.
3. Push til `main`. Workflowet i `.github/workflows/deploy.yml` kører testene, bygger og udgiver.

**Netlify**
- Træk mappen `dist/` ind på [app.netlify.com/drop](https://app.netlify.com/drop), eller
- forbind repositoryet – `netlify.toml` fortæller Netlify, hvordan der bygges.

## Sådan er koden bygget op

```
src/
  main.ts                 router (#/, #/bane/b1, #/bane/b1/laer, #/bane/b1/oev, #/traen/<færdighed>, #/formler, #/oversigt)
  core/                   tal og dansk formatering, seedet tilfældighed, localStorage, XP/stjerner/oplåsning
  viz/                    canvas-graf (plot.ts), bevægelsesscene (scene.ts), afspiller, simulator, SVG-kraftdiagrammer
  exercises/              opgavetyper, svar-tjek med fejldiagnose (check.ts), visning (render.ts), runder
  levels/bN/              én mappe pr. bane: generators.ts (opgaver), lesson.ts (lektionskort), index.ts
  levels/index.ts         register over baner
  levels/skills.ts        færdigheder, som opgaverne tagges med
  content/formulas.ts     formelarket
tests/                    egenskabstest af alle generatorer + kernelogik
```

### Opgavetyper
- **numeric** – talsvar med enhed. Accepterer komma/punktum og korrekt afrunding.
- **choice** – multiple choice, også med grafer eller kraftdiagrammer som svarmuligheder.
- **formula** – formelvælgeren: givet/søgt → vælg formel → regn.
- **draw** – eleven trækker i punkter for at tegne en s-t- eller v-t-graf.

Hver opgave har op til 3 hints, en løsning trin for trin og en liste over **typiske fejl**
(fx "ganget med 3,6 i stedet for at dividere", "glemt ½", "forkert fortegn på g").
Rammer elevens svar en typisk fejl, forklares præcis, hvad der gik galt. Ellers bruges generelle
mønstre (faktor 3,6, 60, 1000, fortegn, faktor 2) – og ellers en venlig procentvis vejledning.

### Tilføj en ny opgave
1. Skriv en generator i `src/levels/bN/generators.ts` med `gen({ id, title, skills, difficulty }, (rng) => ({ ... }))`.
   Brug `rng` til alle tilfældige tal, og læg råparametrene i `data`.
2. Tilføj den til bane-listen og til en plads i `round` i `src/levels/bN/index.ts`.
3. Tilføj en **uafhængig genberegning** af facit i `tests/expected.ts` (testene kræver det for talsvar).
4. Kør `npm test`.

### Tilføj en ny bane (fx Newtons 3. lov eller energi)
Kopiér en mappe under `src/levels/`, ret indholdet, og registrér banen i `src/levels/index.ts`
(`LEVEL_ORDER` og `LEVELS`) og i `src/levels/allGenerators.ts`. Nye færdigheder tilføjes i `skills.ts`.

## Hvad testene tjekker

`npm test` kører hver generator med 1500 forskellige seeds og tjekker for hver variant, at
- facit er et endeligt, realistisk tal, som stemmer med en uafhængig genberegning,
- det afrundede facit (og en korrekt afrunding til 2 betydende cifre) godkendes,
- hver typisk fejl giver en forklaring og ikke godkendes som rigtig,
- al tekst bruger decimalkomma og ikke indeholder `NaN`/`undefined`,
- multiple choice har præcis én rigtig mulighed, og alle forkerte har en forklaring,
- formelopgaver har mindst én brugbar formel, og givne størrelser har værdier,
- grafer og bevægelser holder sig inden for akserne, og tegneopgavers mål ligger på gitteret,
- der er reel variation mellem varianterne.

## Konventioner
- Alt indhold er på dansk med dansk fysikterminologi og decimalkomma.
- $g = 9{,}82\ \mathrm{m/s^2}$. Ved lodrette bevægelser er opad positiv.
- Farver: position/forskydning = petrol, hastighed = lilla, acceleration = orange, kraft = pink.
