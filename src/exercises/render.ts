// Visning og interaktion for alle opgavetyper. Én funktion monterer en opgave,
// håndterer forsøg, hints, feedback og viser løsningen trin for trin bagefter.

import { h, icons, type Cleanup } from '../core/dom';
import { parseNumber, tq, unitText } from '../core/numbers';
import { rich, tex } from '../core/tex';
import { Plot } from '../viz/plot';
import { forceDiagram } from '../viz/svgviz';
import { mountVisual } from '../viz/visual';
import { checkDraw, checkGivenSought, checkNumeric, formulaValidity } from './check';
import type { ChoiceEx, DrawEx, Exercise, FormulaEx, NumericPart, Step } from './types';

export interface ExResult {
  points: number;
  hints: number;
  skillResults: Record<string, boolean>;
}

interface Callbacks {
  onResult(r: ExResult): void;
  onNext(): void;
  nextLabel?: string;
}

const PRAISE = ['Rigtigt!', 'Præcis.', 'Flot – det sad.', 'Korrekt!', 'Sådan!', 'Helt rigtigt.'];
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
const finePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;

export function answerTex(p: NumericPart): string {
  return `$${p.label ?? ''} ${tq(p.answer, p.unit, p.decimals)}$`;
}

export function renderSteps(steps: Step[]): HTMLElement {
  const main = steps.filter((s) => !s.aha);
  const ahas = steps.filter((s) => s.aha);
  return h('div', { class: 'steps' },
    h('ol', null, main.map((st) => h('li', null, st.text ? h('div', { html: rich(st.text) }) : null, st.math ? h('div', { class: 'math', html: tex(st.math, true) }) : null))),
    ahas.map((a) => h('div', { class: 'aha', html: rich(a.text ?? '') })),
  );
}

export function mountExercise(host: HTMLElement, ex: Exercise, cb: Callbacks): Cleanup {
  const cleanups: Cleanup[] = [];
  let hintsUsed = 0;
  let done = false;

  const visual = h('div', { class: 'ex-visual' });
  if (ex.visual) cleanups.push(mountVisual(visual, ex.visual));
  const body = h('div', { class: 'ex-body' });
  const hintsBox = h('div', { class: 'ex-hints' });
  const feedback = h('div', { class: 'ex-feedback', 'aria-live': 'polite' });
  const solution = h('div', { class: 'ex-solution' });
  const hintLabel = h('span', null, 'Hint');
  const hintBtn = h('button', { class: 'btn btn-ghost hint-btn' }) as HTMLButtonElement;
  hintBtn.innerHTML = icons.bulb;
  hintBtn.append(hintLabel);
  const primary = h('button', { class: 'btn btn-primary' }) as HTMLButtonElement;
  const card = h('article', { class: 'ex card' },
    h('div', { class: 'ex-topic' }, ex.topic),
    h('div', { class: 'ex-prompt', html: rich(ex.prompt) }),
    ex.visual ? visual : null,
    body, hintsBox, feedback, solution);
  const actions = h('div', { class: 'ex-actions' }, hintBtn, primary);
  host.append(card, actions);

  // ---- hints ----
  const updateHintBtn = () => {
    const left = hintsUsed < ex.hints.length;
    hintLabel.textContent = left ? `Hint ${hintsUsed + 1}/${ex.hints.length}` : 'Ingen flere hints';
    hintBtn.disabled = !left || done;
  };
  hintBtn.addEventListener('click', () => {
    if (hintsUsed >= ex.hints.length || done) return;
    hintsBox.append(h('div', { class: 'hint', html: `<b>Hint ${hintsUsed + 1}.</b> ${rich(ex.hints[hintsUsed])}` }));
    hintsUsed++;
    updateHintBtn();
  });
  updateHintBtn();

  // ---- hovedknap ----
  let action: (() => void) | null = null;
  const setPrimary = (label: string, fn: (() => void) | null, enabled = true) => {
    primary.textContent = label;
    action = fn;
    primary.disabled = !enabled;
  };
  primary.addEventListener('click', () => action?.());

  const fb = (type: 'good' | 'bad' | 'info', title: string, html = '') => {
    feedback.className = `ex-feedback show ${type}`;
    const ic = type === 'good' ? icons.check : type === 'bad' ? icons.cross : icons.bulb;
    feedback.innerHTML = `<div class="fb-title">${ic}<span>${title}</span></div>${html ? `<div class="fb-body">${rich(html)}</div>` : ''}`;
  };

  const finish = (points: number, overrides: Record<string, boolean> = {}) => {
    done = true;
    card.classList.add(points >= 1 ? 'is-good' : points > 0 ? 'is-ok' : 'is-bad');
    const skillResults: Record<string, boolean> = Object.fromEntries(ex.skills.map((s) => [s, points >= 1]));
    Object.assign(skillResults, overrides);
    cb.onResult({ points, hints: hintsUsed, skillResults });
    if (ex.solution.length)
      solution.replaceChildren(h('details', { class: 'solution', open: points < 1 || undefined }, h('summary', null, 'Udregning trin for trin'), renderSteps(ex.solution)));
    updateHintBtn();
    setPrimary(cb.nextLabel ?? 'Næste →', () => cb.onNext());
    requestAnimationFrame(() => primary.focus({ preventScroll: true }));
  };

  // ---- talsvar (bruges også som trin 3 i formelopgaver) ----
  const numericStage = (part: NumericPart, container: HTMLElement, onDone: (points: number) => void) => {
    let tries = 0;
    const input = h('input', { class: 'num-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', placeholder: 'Dit svar', 'aria-label': 'Dit svar' }) as HTMLInputElement;
    container.append(h('div', { class: 'answer-row' }, part.label ? h('span', { class: 'ans-label', html: tex(part.label) }) : null, input, h('span', { class: 'unit' }, unitText(part.unit))));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        primary.click();
      }
    });
    const lock = () => (input.disabled = true);
    setPrimary('Tjek svar', () => {
      const val = parseNumber(input.value);
      if (val == null) {
        fb('info', 'Skriv et tal', 'Skriv dit svar som et tal, fx <b>12,5</b> eller <b>−3</b>. Enheden står allerede efter feltet.');
        input.focus();
        return;
      }
      const r = checkNumeric(part, val);
      if (r.ok) {
        input.classList.remove('bad');
        input.classList.add('ok');
        fb('good', praise(), `${answerTex(part)}`);
        lock();
        onDone(tries === 0 ? 1 : 0.5);
        return;
      }
      tries++;
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake', 'bad');
      if (tries === 1) {
        fb('bad', 'Ikke helt endnu', `${r.why}<div class="fb-next">Ret dit svar og prøv igen – eller tag et hint.</div>`);
        input.select();
      } else {
        fb('bad', 'Her er løsningen', `${r.why}<div class="fb-next">Det rigtige svar er ${answerTex(part)}. Fejl er en del af at lære det – gå udregningen igennem herunder. Den slags opgave kommer igen.</div>`);
        lock();
        onDone(0);
      }
    });
    if (finePointer()) setTimeout(() => input.focus({ preventScroll: true }), 60);
  };

  // ---- multiple choice / graf-match ----
  const choiceStage = (c: ChoiceEx) => {
    let tries = 0;
    const n = c.options.length;
    const btns: HTMLButtonElement[] = [];
    const list = h('div', { class: 'options' + (c.grid ? ' grid' : '') });
    const lockAll = () => btns.forEach((b) => (b.disabled = true));
    c.options.forEach((opt, i) => {
      const why = h('div', { class: 'opt-why' });
      const btn = h('button', { class: 'option' + (opt.plot || opt.fbd ? ' visual' : '') }) as HTMLButtonElement;
      btn.append(h('span', { class: 'opt-letter' }, 'ABCDEF'[i]));
      const content = h('div', { class: 'opt-content' });
      if (opt.html) content.append(h('div', { class: 'opt-html', html: rich(opt.html) }));
      if (opt.plot) {
        const p = new Plot(opt.plot);
        content.append(p.el);
        cleanups.push(() => p.destroy());
      }
      if (opt.fbd) content.append(forceDiagram(opt.fbd));
      content.append(why);
      btn.append(content);
      btn.addEventListener('click', () => {
        if (done || btn.classList.contains('picked')) return;
        btn.classList.add('picked');
        if (opt.correct) {
          btn.classList.add('correct');
          fb('good', praise(), opt.why);
          lockAll();
          finish(tries === 0 ? 1 : n > 2 ? 0.5 : 0);
          return;
        }
        tries++;
        btn.classList.add('wrong');
        why.innerHTML = rich(opt.why);
        if (tries >= 2 || n <= 2) {
          const ci = c.options.findIndex((o) => o.correct);
          btns[ci].classList.add('correct', 'revealed');
          btns[ci].querySelector('.opt-why')!.innerHTML = rich(c.options[ci].why);
          fb('bad', 'Her er det rigtige svar', 'Den rigtige mulighed er markeret med grønt. Læs forklaringen ved dit valg – det er dér, læringen sidder.');
          lockAll();
          finish(0);
        } else fb('bad', 'Ikke helt endnu', 'Læs forklaringen under dit valg, og prøv så igen.');
      });
      btns.push(btn);
      list.append(btn);
    });
    body.append(list);
    setPrimary('Vælg et svar ovenfor', null, false);
  };

  // ---- tegn grafen ----
  const drawStage = (d: DrawEx) => {
    let tries = 0;
    let ys = [...d.startYs];
    const p = new Plot(d.plot);
    cleanups.push(() => p.destroy());
    p.enableHandles(d.handleXs, ys, d.snap, (v) => (ys = v));
    body.append(h('p', { class: 'draw-help' }, 'Træk punkterne op og ned – eller tryk lige over/under et punkt.'), p.el);
    setPrimary('Tjek grafen', () => {
      const r = checkDraw(d, ys);
      if (r.ok) {
        p.lockHandles();
        fb('good', praise(), 'Grafen passer præcis.');
        finish(tries === 0 ? 1 : 0.5);
        return;
      }
      tries++;
      if (tries === 1) fb('bad', 'Ikke helt endnu', `${r.why ?? ''}<div class="fb-next">Justér punkterne og tjek igen.</div>`);
      else {
        p.overlay = d.handleXs.map((x, i) => [x, d.target[i]]);
        p.lockHandles();
        fb('bad', 'Her er løsningen', `${r.why ?? ''}<div class="fb-next">Den grønne stiplede linje er den rigtige graf.</div>`);
        finish(0);
      }
    });
  };

  // ---- formelvælger: givet/søgt → formel → regn ----
  const formulaStage = (f: FormulaEx) => {
    let firstTryAll = true;
    const givenSel = new Set<string>();
    let soughtSel: string | null = null;
    const s1fb = h('div', { class: 'stage-fb' });
    const chip = (q: FormulaEx['quantities'][number], onTap: (b: HTMLButtonElement) => void) => {
      const b = h('button', { class: 'qchip', html: `${tex(q.tex)} <span>${q.name}</span>` }) as HTMLButtonElement;
      b.addEventListener('click', () => onTap(b));
      return b;
    };
    const gChips = f.quantities.map((q) =>
      chip(q, (b) => {
        if (givenSel.has(q.sym)) givenSel.delete(q.sym);
        else givenSel.add(q.sym);
        b.classList.toggle('on', givenSel.has(q.sym));
      }),
    );
    const sChips = f.quantities.map((q) =>
      chip(q, (b) => {
        soughtSel = q.sym;
        sChips.forEach((x) => x.classList.toggle('on', x === b));
      }),
    );
    const s1 = h('section', { class: 'stage' },
      h('h4', null, h('span', { class: 'stage-n' }, '1'), 'Hvad er givet, og hvad søges?'),
      h('div', { class: 'chip-label' }, 'Givet – markér alle størrelser, opgaven oplyser:'),
      h('div', { class: 'chips' }, gChips),
      h('div', { class: 'chip-label' }, 'Søgt – hvad skal du finde?'),
      h('div', { class: 'chips' }, sChips),
      s1fb);
    body.append(s1);

    const stage2 = () => {
      let wrongs = 0;
      const btns: HTMLButtonElement[] = [];
      const s2 = h('section', { class: 'stage' }, h('h4', null, h('span', { class: 'stage-n' }, '2'), 'Vælg en formel, der passer'));
      const hint = h('p', { class: 'stage-help' }, 'Den rigtige formel indeholder det søgte – og ellers kun størrelser, du kender.');
      s2.append(hint);
      const list = h('div', { class: 'formula-list' });
      const iso = h('div', { class: 'stage-fb' });
      f.formulas.forEach((fo) => {
        const why = h('div', { class: 'opt-why' });
        const b = h('button', { class: 'formula-btn' }, h('div', { class: 'f-tex', html: tex(fo.tex) }), why) as HTMLButtonElement;
        b.addEventListener('click', () => {
          if (b.disabled) return;
          const r = formulaValidity(fo, f.given, f.sought, f.quantities);
          if (r.ok) {
            b.classList.add('correct');
            btns.forEach((x) => (x.disabled = true));
            const isoTex = fo.solve?.[f.sought];
            iso.className = 'stage-fb good';
            const soughtTex = f.quantities.find((x) => x.sym === f.sought)?.tex ?? f.sought;
            iso.innerHTML = !isoTex
              ? rich('Godt valg.')
              : isoTex === fo.tex
                ? rich(`Godt valg – $${soughtTex}$ står allerede alene: $$${isoTex}$$`)
                : rich(`Godt valg. Isolér $${soughtTex}$: $$${isoTex}$$`);
            stage3();
          } else {
            wrongs++;
            firstTryAll = false;
            b.classList.add('wrong');
            b.disabled = true;
            why.innerHTML = rich(r.why ?? '');
            if (wrongs >= 2) {
              const good = f.formulas.findIndex((x) => formulaValidity(x, f.given, f.sought, f.quantities).ok);
              if (good >= 0) btns[good].click();
            }
          }
        });
        btns.push(b);
        list.append(b);
      });
      s2.append(list, iso);
      body.append(s2);
      setPrimary('Vælg en formel ovenfor', null, false);
      s2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const stage3 = () => {
      const s3 = h('section', { class: 'stage' }, h('h4', null, h('span', { class: 'stage-n' }, '3'), 'Sæt tal ind og regn'));
      body.append(s3);
      numericStage(f.numeric, s3, (pts) => finish(pts, { formelvalg: firstTryAll }));
      s3.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    setPrimary('Tjek givet og søgt', () => {
      if (!soughtSel) {
        fb('info', 'Vælg det søgte', 'Markér hvilken størrelse du skal finde – nederste række.');
        return;
      }
      feedback.className = 'ex-feedback';
      const r = checkGivenSought(f, [...givenSel], soughtSel);
      if (!r.ok) firstTryAll = false;
      [...gChips, ...sChips].forEach((b) => (b.disabled = true));
      f.quantities.forEach((q, i) => {
        const giv = f.given.includes(q.sym);
        gChips[i].classList.toggle('right', giv);
        gChips[i].classList.toggle('miss', giv && !givenSel.has(q.sym));
        gChips[i].classList.toggle('wrongpick', !giv && givenSel.has(q.sym));
        sChips[i].classList.toggle('right', q.sym === f.sought);
        sChips[i].classList.toggle('wrongpick', q.sym !== f.sought && q.sym === soughtSel);
      });
      const givenTex = f.given.map((g) => {
        const q = f.quantities.find((x) => x.sym === g)!;
        return `$${q.tex} = ${q.value}$`;
      });
      const soughtQ = f.quantities.find((x) => x.sym === f.sought)!;
      const summary = `<div class="given-summary"><b>Givet:</b> ${givenTex.join(', ')} &nbsp;·&nbsp; <b>Søgt:</b> $${soughtQ.tex}$</div>`;
      s1fb.className = 'stage-fb ' + (r.ok ? 'good' : 'bad');
      s1fb.innerHTML = rich((r.ok ? 'Præcis – godt læst.' : r.items.map((it) => `<div>• ${it.msg}</div>`).join('')) + summary);
      stage2();
    });
  };

  switch (ex.kind) {
    case 'numeric':
      numericStage(ex, body, (pts) => finish(pts));
      break;
    case 'choice':
      choiceStage(ex);
      break;
    case 'draw':
      drawStage(ex);
      break;
    case 'formula':
      formulaStage(ex);
      break;
  }

  return () => cleanups.forEach((c) => c());
}
