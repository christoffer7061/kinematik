import { h, icons } from '../core/dom';
import { rich, tex } from '../core/tex';
import { SHEET } from '../content/formulas';
import { LEVEL_ORDER } from '../levels';

function sheet(filterLevel?: string): HTMLElement {
  const sections = filterLevel ? [...SHEET.filter((s) => s.level === filterLevel), ...SHEET.filter((s) => s.level !== filterLevel)] : SHEET;
  return h('div', { class: 'sheet' },
    sections.map((sec) => {
      const lv = LEVEL_ORDER.find((l) => l.id === sec.level);
      return h('section', { class: 'sheet-sec', id: 'f-' + sec.id },
        h('div', { class: 'sheet-head' }, h('h2', null, sec.title), lv ? h('span', { class: 'tag' }, `Bane ${lv.num}`) : null),
        sec.intro ? h('p', { class: 'sheet-intro', html: rich(sec.intro) }) : null,
        h('div', { class: 'sheet-grid' },
          sec.items.map((it) =>
            h('div', { class: 'f-card' },
              h('div', { class: 'f-name' }, it.name),
              h('div', { class: 'f-tex', html: tex(it.tex, true) }),
              h('div', { class: 'f-when', html: `<b>Hvornår:</b> ${rich(it.when)}` }),
              it.symbols ? h('div', { class: 'f-sym', html: rich(it.symbols) }) : null,
              it.pitfall ? h('div', { class: 'f-pit', html: `<b>Pas på:</b> ${rich(it.pitfall)}` }) : null))));
    }));
}

export function formulasPage(view: HTMLElement) {
  view.append(
    h('div', { class: 'wrap' },
      h('header', { class: 'page-head' }, h('h1', null, 'Formelark'), h('p', { class: 'lead' }, 'Alle formler med enheder – og vigtigst: hvornår du bruger dem.')),
      h('nav', { class: 'toc' }, SHEET.map((s) => h('a', { href: '#/formler', onclick: (e: Event) => { e.preventDefault(); document.getElementById('f-' + s.id)?.scrollIntoView({ behavior: 'smooth' }); } }, s.title))),
      sheet()));
}

/** Formelarket som skuffe, der kan åbnes midt i en opgave */
export function openFormulaDrawer(levelId?: string) {
  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 220);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
  const overlay = h('div', { class: 'drawer-overlay', onclick: (e: Event) => e.target === overlay && close() },
    h('aside', { class: 'drawer', role: 'dialog', 'aria-label': 'Formelark' },
      h('div', { class: 'drawer-head' }, h('h2', null, 'Formelark'), h('button', { class: 'icon-btn', 'aria-label': 'Luk', html: icons.close, onclick: close })),
      h('div', { class: 'drawer-body' }, sheet(levelId))));
  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => overlay.classList.add('open'));
}
