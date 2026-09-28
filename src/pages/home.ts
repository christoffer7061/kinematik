import { h, icons } from '../core/dom';
import { isUnlocked, PASS } from '../core/progress';
import { getState } from '../core/store';
import { LEVEL_IDS, LEVEL_ORDER, LEVELS } from '../levels';
import { starsHtml } from '../ui/widgets';

export function nextLevelId(): string {
  const s = getState();
  const open = LEVEL_ORDER.filter((l) => LEVELS[l.id] && isUnlocked(s, LEVEL_IDS, l.id));
  return (open.find((l) => !(s.levels[l.id]?.stars > 0)) ?? open[open.length - 1] ?? LEVEL_ORDER[0]).id;
}

export function levelList(): HTMLElement {
  const s = getState();
  return h('div', { class: 'level-list' },
    LEVEL_ORDER.map((meta, i) => {
      const built = !!LEVELS[meta.id];
      const unlocked = isUnlocked(s, LEVEL_IDS, meta.id);
      const st = s.levels[meta.id];
      const prev = LEVEL_ORDER[i - 1];
      let side: HTMLElement;
      if (!built) side = h('span', { class: 'soon' }, 'Kommer snart');
      else if (!unlocked) side = h('span', { class: 'locked-txt', html: `${icons.lock}` });
      else side = h('span', { html: starsHtml(st?.stars ?? 0) + (st?.best ? `<span class="best">${Math.round(st.best * 100)} %</span>` : '') });
      const clickable = built && unlocked;
      const inner = [
        h('div', { class: 'lv-num' + (meta.bonus ? ' bonus' : '') }, meta.bonus ? '★' : String(meta.num)),
        h('div', { class: 'lv-main' },
          h('div', { class: 'lv-title' }, meta.title),
          h('div', { class: 'lv-short' }, !unlocked && built && prev ? `Lås op: få mindst ${PASS * 100} % i bane ${prev.num}` : meta.short)),
        h('div', { class: 'lv-side' }, side),
      ];
      return clickable
        ? h('a', { class: 'level-card', href: `#/bane/${meta.id}` }, inner)
        : h('div', { class: 'level-card ' + (built ? 'locked' : 'soon-card'), 'aria-disabled': 'true' }, inner);
    }));
}

export function homePage(view: HTMLElement) {
  const s = getState();
  const next = nextLevelId();
  const meta = LEVEL_ORDER.find((l) => l.id === next)!;
  const started = s.xp > 0;
  const totalStars = Object.values(s.levels).reduce((a, l) => a + l.stars, 0);
  view.append(
    h('div', { class: 'wrap' },
      h('section', { class: 'hero' },
        h('div', { class: 'hero-text' },
          h('h1', null, 'Fysik, du kan ', h('span', { class: 'accent' }, 'se')),
          h('p', { class: 'lead' }, 'Træk i sliderne, se bilen køre, og se graferne blive tegnet undervejs. Øv dig bagefter med opgaver, der aldrig slipper op – med hints og forklaringer, når noget driller.'),
          h('div', { class: 'hero-actions' },
            h('a', { class: 'btn btn-primary btn-lg', href: `#/bane/${next}` }, started ? `Fortsæt: Bane ${meta.num}` : 'Start med bane 1'),
            h('a', { class: 'btn btn-ghost btn-lg', href: '#/formler' }, 'Formelark'))),
        started
          ? h('div', { class: 'hero-stats' },
              h('div', { class: 'stat' }, h('b', null, String(s.xp)), h('span', null, 'XP')),
              h('div', { class: 'stat' }, h('b', null, String(s.day.streak)), h('span', null, s.day.streak === 1 ? 'dag i træk' : 'dage i træk')),
              h('div', { class: 'stat' }, h('b', null, String(totalStars)), h('span', null, 'stjerner')))
          : null),
      h('h2', { class: 'section-title' }, 'Baner'),
      levelList(),
      h('p', { class: 'fineprint' }, 'Din fremgang gemmes kun her i browseren. Der er intet login.')));
}
