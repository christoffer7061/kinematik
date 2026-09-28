import { h } from '../core/dom';
import { isUnlocked, skillStrength } from '../core/progress';
import { getState, resetAll, update } from '../core/store';
import { LEVEL_IDS, LEVEL_ORDER, LEVELS } from '../levels';
import { GENERATORS_BY_LEVEL } from '../levels/allGenerators';
import { SKILLS } from '../levels/skills';
import { levelList, nextLevelId } from './home';
import { skillBar } from './level';

interface Suggestion {
  text: string;
  href: string;
  label: string;
}

function suggestions(): Suggestion[] {
  const s = getState();
  const open = LEVEL_ORDER.filter((l) => LEVELS[l.id] && isUnlocked(s, LEVEL_IDS, l.id)).map((l) => l.id);
  const trainable = new Set(open.flatMap((id) => (GENERATORS_BY_LEVEL[id] ?? []).flatMap((g) => g.skills)));
  const weak = Object.keys(SKILLS)
    .filter((k) => trainable.has(k))
    .map((k) => ({ k, st: skillStrength(s, k), r: s.skills[k]?.recent ?? [] }))
    .filter((x) => x.st != null && x.st < 0.7)
    .sort((a, b) => a.st! - b.st!)
    .slice(0, 3);
  const out: Suggestion[] = weak.map((w) => ({
    text: `<b>${SKILLS[w.k].name}</b> – ${w.r.reduce((a, b) => a + b, 0)} af de seneste ${w.r.length} rigtige.`,
    href: `#/traen/${w.k}`,
    label: 'Øv nu',
  }));
  const next = nextLevelId();
  const nm = LEVEL_ORDER.find((l) => l.id === next)!;
  if (!(s.levels[next]?.stars > 0)) out.push({ text: `Fortsæt med <b>bane ${nm.num}: ${nm.title}</b>.`, href: `#/bane/${next}`, label: 'Gå til banen' });
  if (!out.length) out.push({ text: 'Alt ser stærkt ud! Tag en runde i en bane, du klarede for et stykke tid siden, så det bliver siddende.', href: '#/', label: 'Vælg bane' });
  return out;
}

export function overviewPage(view: HTMLElement) {
  const s = getState();
  const built = LEVEL_ORDER.filter((l) => LEVELS[l.id]);
  const maxStars = built.length * 3;
  const stars = Object.values(s.levels).reduce((a, l) => a + l.stars, 0);
  const rounds = Object.values(s.levels).reduce((a, l) => a + l.rounds, 0);
  const settings = h('div', { class: 'card settings' },
    h('label', { class: 'toggle' },
      h('input', { type: 'checkbox', checked: s.unlockAll || undefined, onchange: (e: Event) => update((st) => (st.unlockAll = (e.target as HTMLInputElement).checked)) }),
      ' Lås alle baner op (fx for lærere, forældre eller repetition)'),
    h('button', {
      class: 'btn btn-ghost danger',
      onclick: () => {
        if (confirm('Vil du slette al fremgang (XP, stjerner og statistik)? Det kan ikke fortrydes.')) {
          resetAll();
          location.hash = '#/';
        }
      },
    }, 'Nulstil al fremgang'));

  view.append(
    h('div', { class: 'wrap' },
      h('header', { class: 'page-head' }, h('h1', null, 'Din oversigt'), h('p', { class: 'lead' }, 'Her kan du se, hvad du er stærk i, og hvad der er værd at øve igen.')),
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat card' }, h('b', null, String(s.xp)), h('span', null, 'XP i alt')),
        h('div', { class: 'stat card' }, h('b', null, String(s.day.streak)), h('span', null, 'dage i træk')),
        h('div', { class: 'stat card' }, h('b', null, `${stars}/${maxStars}`), h('span', null, 'stjerner')),
        h('div', { class: 'stat card' }, h('b', null, String(rounds)), h('span', null, 'øverunder'))),
      h('h2', { class: 'section-title' }, 'Forslag til dig'),
      h('div', { class: 'suggestions' }, suggestions().map((sg) => h('div', { class: 'card suggestion' }, h('p', { html: sg.text }), h('a', { class: 'btn btn-primary btn-sm', href: sg.href }, sg.label)))),
      h('h2', { class: 'section-title' }, 'Færdigheder'),
      h('p', { class: 'muted' }, 'Baseret på dine seneste 10 forsøg pr. færdighed (rigtigt i første forsøg).'),
      built
        .filter((l) => isUnlocked(s, LEVEL_IDS, l.id))
        .map((l) => {
          const keys = Object.keys(SKILLS).filter((k) => SKILLS[k].level === l.id);
          return h('div', { class: 'card skills' }, h('h3', null, `Bane ${l.num}: ${l.title}`), keys.map((k) => h('div', { class: 'skill-line' }, skillBar(k), skillStrength(s, k) != null ? h('a', { class: 'mini-link', href: `#/traen/${k}` }, 'Øv') : null)));
        }),
      h('h2', { class: 'section-title' }, 'Baner'),
      levelList(),
      h('h2', { class: 'section-title' }, 'Indstillinger'),
      settings));
}
