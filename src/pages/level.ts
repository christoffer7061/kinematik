import { h, icons, type Cleanup } from '../core/dom';
import { isUnlocked, PASS, skillStrength } from '../core/progress';
import { getState } from '../core/store';
import { LEVEL_IDS, LEVEL_ORDER, getLevel } from '../levels';
import { SKILLS } from '../levels/skills';
import { starsHtml } from '../ui/widgets';

export function skillBar(id: string): HTMLElement {
  const st = skillStrength(getState(), id);
  const pct = st == null ? 0 : Math.round(st * 100);
  const cls = st == null ? 'none' : st >= 0.8 ? 'strong' : st >= 0.5 ? 'mid' : 'weak';
  return h('div', { class: 'skill-row' },
    h('div', { class: 'skill-name' }, SKILLS[id]?.name ?? id),
    h('div', { class: 'skill-bar ' + cls }, h('div', { style: `width:${st == null ? 0 : Math.max(4, pct)}%` })),
    h('div', { class: 'skill-pct' }, st == null ? 'ikke øvet' : `${pct} %`));
}

export function levelPage(view: HTMLElement, id: string): Cleanup | void {
  const lv = getLevel(id);
  const meta = LEVEL_ORDER.find((l) => l.id === id);
  if (!lv || !meta) {
    view.append(h('div', { class: 'wrap' }, h('p', null, 'Den bane findes ikke (endnu).'), h('a', { href: '#/' }, '← Til forsiden')));
    return;
  }
  const s = getState();
  if (!isUnlocked(s, LEVEL_IDS, id)) {
    const prev = LEVEL_ORDER[LEVEL_ORDER.indexOf(meta) - 1];
    view.append(h('div', { class: 'wrap narrow' }, h('div', { class: 'card center' },
      h('div', { class: 'big-icon', html: icons.lock }),
      h('h2', null, `Bane ${meta.num} er låst`),
      h('p', null, `Få mindst ${PASS * 100} % i en øverunde i bane ${prev?.num} for at låse den op.`),
      h('a', { class: 'btn btn-primary', href: `#/bane/${prev?.id}` }, `Gå til bane ${prev?.num}`))));
    return;
  }
  const st = s.levels[id];
  const nextMeta = LEVEL_ORDER[LEVEL_ORDER.indexOf(meta) + 1];
  const skills = [...new Set(lv.generators.flatMap((g) => g.skills))].filter((k) => SKILLS[k]);
  const pg = lv.playground?.();

  const lessonState = st?.lessonDone ? 'Gennemgået ✓ – læs igen når som helst' : st?.lessonPos ? `Fortsæt ved kort ${st.lessonPos + 1} af ${lv.lesson.length}` : `${lv.lesson.length} korte kort med simuleringer`;
  view.append(
    h('div', { class: 'wrap' },
      h('a', { class: 'back', href: '#/', html: `${icons.arrowLeft} Alle baner` }),
      h('header', { class: 'level-head' },
        h('div', { class: 'tag' }, meta.bonus ? 'Bonusbane' : `Bane ${meta.num}`),
        h('h1', null, lv.title),
        h('p', { class: 'lead' }, lv.blurb),
        h('div', { class: 'level-score', html: starsHtml(st?.stars ?? 0) + (st?.best ? ` <span class="best">Bedste runde: ${Math.round(st.best * 100)} %</span>` : '') })),
      h('div', { class: 'action-cards' },
        h('a', { class: 'action-card', href: `#/bane/${id}/laer` },
          h('div', { class: 'ac-step' }, '1'),
          h('div', null, h('h3', null, 'Lær'), h('p', null, lessonState))),
        h('a', { class: 'action-card primary', href: `#/bane/${id}/oev` },
          h('div', { class: 'ac-step' }, '2'),
          h('div', null, h('h3', null, 'Øv'), h('p', null, `${lv.round.length} opgaver · ${PASS * 100} % ${nextMeta ? `låser bane ${nextMeta.num} op` : 'giver en stjerne'}`)))),
      pg ? h('section', { class: 'playground' }, h('h2', { class: 'section-title' }, 'Legeplads'), h('p', { class: 'muted' }, 'Leg frit med simuleringen – der er ingen rigtige eller forkerte svar her.'), pg.el) : null,
      skills.length ? h('section', null, h('h2', { class: 'section-title' }, 'Dine færdigheder i denne bane'), h('div', { class: 'card skills' }, skills.map(skillBar))) : null));
  return () => pg?.destroy();
}
