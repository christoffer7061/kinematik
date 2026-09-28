import { h, icons, type Cleanup } from '../core/dom';
import { isUnlocked } from '../core/progress';
import { getState, levelStat, update } from '../core/store';
import { rich } from '../core/tex';
import { LEVEL_IDS, getLevel } from '../levels';
import type { LessonCheck } from '../levels/types';
import type { Widget } from '../viz/simlab';

function quickCheck(c: LessonCheck): HTMLElement {
  const fb = h('div', { class: 'qc-fb' });
  const btns = c.options.map((o) => {
    const b = h('button', { class: 'option small', html: `<div class="opt-content">${rich(o.html)}</div>` }) as HTMLButtonElement;
    b.addEventListener('click', () => {
      if (o.correct) {
        b.classList.add('correct');
        btns.forEach((x) => (x.disabled = true));
        fb.className = 'qc-fb good';
      } else {
        b.classList.add('wrong');
        b.disabled = true;
        fb.className = 'qc-fb bad';
      }
      fb.innerHTML = rich(o.why);
    });
    return b;
  });
  return h('div', { class: 'quick-check' }, h('div', { class: 'qc-label' }, 'Tjek dig selv'), h('p', { class: 'qc-q', html: rich(c.q) }), h('div', { class: 'options' }, btns), fb);
}

export function lessonPage(view: HTMLElement, id: string): Cleanup | void {
  const lv = getLevel(id);
  if (!lv || !isUnlocked(getState(), LEVEL_IDS, id)) {
    location.hash = `#/bane/${id}`;
    return;
  }
  let i = Math.min(getState().levels[id]?.lessonPos ?? 0, lv.lesson.length - 1);
  if (getState().levels[id]?.lessonDone) i = 0;
  let widget: Widget | null = null;

  const dots = h('div', { class: 'lesson-dots' });
  const holder = h('div', { class: 'lesson-holder' });
  const prev = h('button', { class: 'btn btn-ghost', onclick: () => go(i - 1) }, '← Forrige') as HTMLButtonElement;
  const next = h('button', { class: 'btn btn-primary' }) as HTMLButtonElement;
  const counter = h('span', { class: 'counter' });

  const go = (n: number) => {
    i = Math.max(0, Math.min(lv.lesson.length - 1, n));
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const render = () => {
    widget?.destroy();
    widget = null;
    const card = lv.lesson[i];
    update((s) => {
      const st = levelStat(s, id);
      st.lessonPos = i;
      if (i === lv.lesson.length - 1) st.lessonDone = true;
    });
    dots.replaceChildren(...lv.lesson.map((c, k) => h('button', { class: 'dot' + (k === i ? ' on' : k < i ? ' done' : ''), 'aria-label': `Kort ${k + 1}: ${c.title}`, onclick: () => go(k) })));
    counter.textContent = `${i + 1} / ${lv.lesson.length}`;
    const wEl = h('div', { class: 'lesson-widget' });
    if (card.widget) {
      widget = card.widget();
      wEl.append(widget.el);
    }
    holder.replaceChildren(
      h('article', { class: 'card lesson-card' },
        h('h2', null, card.title),
        h('div', { class: 'lesson-body', html: rich(card.body) }),
        card.widget ? wEl : null,
        card.aha ? h('div', { class: 'aha', html: `<b>Aha:</b> ${rich(card.aha)}` }) : null,
        card.check ? quickCheck(card.check) : null));
    prev.disabled = i === 0;
    const last = i === lv.lesson.length - 1;
    next.textContent = last ? 'Start øverunden →' : 'Næste →';
    next.onclick = () => (last ? (location.hash = `#/bane/${id}/oev`) : go(i + 1));
  };

  view.append(
    h('div', { class: 'wrap lesson' },
      h('div', { class: 'focus-bar' },
        h('a', { class: 'back', href: `#/bane/${id}`, html: `${icons.arrowLeft} Bane ${lv.num}` }),
        h('span', { class: 'focus-title' }, 'Lær'),
        counter),
      dots,
      holder,
      h('div', { class: 'lesson-nav' }, prev, next)));
  render();
  return () => widget?.destroy();
}
