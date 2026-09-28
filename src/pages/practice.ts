import { h, icons, type Cleanup } from '../core/dom';
import { finishRound, isUnlocked, PASS, recordAnswer, type RoundOutcome } from '../core/progress';
import { makeRng, randomSeed } from '../core/rng';
import { getState, update } from '../core/store';
import { mountExercise, type ExResult } from '../exercises/render';
import { buildRound, buildSkillRound } from '../exercises/round';
import type { Exercise } from '../exercises/types';
import { LEVEL_IDS, LEVEL_ORDER, getLevel } from '../levels';
import { GENERATORS_BY_LEVEL } from '../levels/allGenerators';
import { SKILLS } from '../levels/skills';
import { starsHtml } from '../ui/widgets';
import { openFormulaDrawer } from './formulas';

function toast(text: string) {
  const t = h('div', { class: 'toast' }, text);
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 1400);
}

interface PracticeOpts {
  levelId?: string;
  skill?: string;
}

export function practicePage(view: HTMLElement, opts: PracticeOpts): Cleanup | void {
  const rng = makeRng(randomSeed());
  let exercises: Exercise[] = [];
  let title = '';
  let backHref = '#/';
  const lv = opts.levelId ? getLevel(opts.levelId) : undefined;
  if (lv) {
    if (!isUnlocked(getState(), LEVEL_IDS, lv.id)) {
      location.hash = `#/bane/${lv.id}`;
      return;
    }
    exercises = buildRound(lv, rng);
    title = `Bane ${lv.num} · Øv`;
    backHref = `#/bane/${lv.id}`;
  } else if (opts.skill) {
    const s = getState();
    const gens = LEVEL_ORDER.filter((l) => isUnlocked(s, LEVEL_IDS, l.id)).flatMap((l) => GENERATORS_BY_LEVEL[l.id] ?? []);
    exercises = buildSkillRound(gens, opts.skill, rng, 6);
    title = `Træning: ${SKILLS[opts.skill]?.name ?? opts.skill}`;
    backHref = '#/oversigt';
  }
  if (!exercises.length) {
    view.append(h('div', { class: 'wrap narrow' }, h('p', null, 'Der er ingen opgaver her endnu.'), h('a', { href: '#/' }, '← Til forsiden')));
    return;
  }

  const results: (ExResult | null)[] = exercises.map(() => null);
  let idx = 0;
  let inARow = 0;
  let xpGained = 0;
  let cleanupEx: Cleanup | null = null;

  const segs = h('div', { class: 'progress-segs' }, exercises.map(() => h('span', { class: 'seg' })));
  const streakChip = h('span', { class: 'streak-chip' });
  const stage = h('div', { class: 'ex-stage' });

  const updateSegs = () => {
    [...segs.children].forEach((el, i) => {
      const r = results[i];
      el.className = 'seg' + (i === idx && !r ? ' current' : '') + (r ? (r.points >= 1 ? ' good' : r.points > 0 ? ' ok' : ' bad') : '');
    });
    streakChip.innerHTML = inARow >= 3 ? `${icons.flame}${inARow} i træk` : '';
    streakChip.classList.toggle('show', inARow >= 3);
  };

  const show = () => {
    cleanupEx?.();
    stage.replaceChildren();
    updateSegs();
    const ex = exercises[idx];
    const isLast = idx === exercises.length - 1;
    if (import.meta.env.DEV) (window as unknown as { __ex: Exercise }).__ex = ex; // til manuel test
    cleanupEx = mountExercise(stage, ex, {
      nextLabel: isLast ? 'Se resultat →' : 'Næste →',
      onResult: (r) => {
        results[idx] = r;
        inARow = r.points >= 1 ? inARow + 1 : 0;
        let xp = 0;
        update((s) => (xp = recordAnswer(s, r)));
        xpGained += xp;
        toast(`+${xp} XP`);
        updateSegs();
      },
      onNext: () => {
        if (isLast) finish();
        else {
          idx++;
          show();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
    });
  };

  const finish = () => {
    cleanupEx?.();
    cleanupEx = null;
    const points = results.reduce((a, r) => a + (r?.points ?? 0), 0);
    const usedHints = results.some((r) => (r?.hints ?? 0) > 0);
    let outcome: RoundOutcome | null = null;
    if (lv) update((s) => (outcome = finishRound(s, lv.id, points, exercises.length, usedHints)));
    const pct = points / exercises.length;
    const o = outcome as RoundOutcome | null;
    if (o) xpGained += o.bonusXp;
    const idxMeta = lv ? LEVEL_ORDER.findIndex((l) => l.id === lv.id) : -1;
    const nextMeta = idxMeta >= 0 ? LEVEL_ORDER[idxMeta + 1] : undefined;
    const nextBuilt = nextMeta && getLevel(nextMeta.id);

    let headline: string, msg: string;
    if (pct >= 0.999) {
      headline = 'Fejlfrit!';
      msg = 'Alle opgaver rigtige. Det her har du styr på.';
    } else if (pct >= PASS) {
      headline = lv ? 'Bane klaret!' : 'Flot træning!';
      msg = 'Godt arbejde. Kig gerne udregningerne igennem for de opgaver, der drillede – så sidder det endnu bedre.';
    } else if (pct >= 0.5) {
      headline = 'Godt på vej';
      msg = `Du mangler lidt for at nå ${PASS * 100} %. Tag en runde mere – opgaverne er nye hver gang, og hver runde gør dig skarpere.`;
    } else {
      headline = 'Det her er svært – og helt normalt';
      msg = 'Gå evt. tilbage til "Lær" og leg med simuleringen igen. Brug hints i næste runde – de er der for at blive brugt.';
    }

    const rows = exercises.map((ex, i) => {
      const r = results[i]!;
      const mark = r.points >= 1 ? '✓' : r.points > 0 ? '½' : '✗';
      const cls = r.points >= 1 ? 'good' : r.points > 0 ? 'ok' : 'bad';
      return h('li', { class: cls }, h('span', { class: 'mark' }, mark), h('span', null, ex.topic), r.hints ? h('span', { class: 'muted small' }, ` · ${r.hints} hint${r.hints > 1 ? 's' : ''}`) : null);
    });

    stage.replaceChildren(
      h('div', { class: 'card result' },
        h('div', { class: 'result-ring', style: `--p:${Math.round(pct * 100)}` }, h('span', null, `${Math.round(pct * 100)} %`)),
        o ? h('div', { class: 'result-stars', html: starsHtml(o.stars) }) : null,
        h('h2', null, headline),
        h('p', null, msg),
        h('div', { class: 'result-xp' }, `+${xpGained} XP i denne runde`),
        o?.unlockedNext && nextMeta ? h('div', { class: 'unlock-banner' }, nextBuilt ? `Bane ${nextMeta.num} er låst op: ${nextMeta.title}` : `Bane ${nextMeta.num} (${nextMeta.title}) låses op, så snart den er klar.`) : null,
        h('ul', { class: 'result-list' }, rows),
        h('div', { class: 'result-actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => window.dispatchEvent(new HashChangeEvent('hashchange')) }, 'Ny runde'),
          lv && pct >= PASS && nextBuilt ? h('a', { class: 'btn btn-primary', href: `#/bane/${nextMeta!.id}` }, `Videre til bane ${nextMeta!.num} →`) : h('a', { class: 'btn btn-primary', href: backHref }, lv ? 'Tilbage til banen' : 'Til oversigten'))));
    segs.remove();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  view.append(
    h('div', { class: 'wrap practice' },
      h('div', { class: 'focus-bar' },
        h('a', { class: 'back', href: backHref, html: `${icons.arrowLeft} Afslut` }),
        h('span', { class: 'focus-title' }, title),
        h('button', { class: 'btn btn-soft btn-sm', html: `${icons.book}<span>Formelark</span>`, onclick: () => openFormulaDrawer(lv?.id) })),
      h('div', { class: 'progress-row' }, segs, streakChip),
      stage));
  show();
  return () => cleanupEx?.();
}
