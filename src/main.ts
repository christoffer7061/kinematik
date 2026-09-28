import 'katex/dist/katex.min.css';
import './styles.css';
import { h, icons, type Cleanup } from './core/dom';
import { getState, subscribe } from './core/store';
import { formulasPage } from './pages/formulas';
import { homePage } from './pages/home';
import { lessonPage } from './pages/lesson';
import { levelPage } from './pages/level';
import { overviewPage } from './pages/overview';
import { practicePage } from './pages/practice';

type Route =
  | { page: 'home' }
  | { page: 'level'; id: string }
  | { page: 'lesson'; id: string }
  | { page: 'practice'; id: string }
  | { page: 'train'; skill: string }
  | { page: 'formler' }
  | { page: 'oversigt' };

function parse(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (p[0] === 'bane' && p[1]) {
    if (p[2] === 'laer') return { page: 'lesson', id: p[1] };
    if (p[2] === 'oev') return { page: 'practice', id: p[1] };
    return { page: 'level', id: p[1] };
  }
  if (p[0] === 'traen' && p[1]) return { page: 'train', skill: p[1] };
  if (p[0] === 'formler') return { page: 'formler' };
  if (p[0] === 'oversigt') return { page: 'oversigt' };
  return { page: 'home' };
}

const navItems = [
  { href: '#/', label: 'Baner', match: ['home', 'level', 'lesson', 'practice'] },
  { href: '#/formler', label: 'Formelark', match: ['formler'] },
  { href: '#/oversigt', label: 'Oversigt', match: ['oversigt', 'train'] },
];

const xpPill = h('span', { class: 'pill xp' });
const streakPill = h('span', { class: 'pill streak' });
const topNav = h('nav', { class: 'top-nav' }, navItems.map((n) => h('a', { href: n.href }, n.label)));
const bottomNav = h('nav', { class: 'bottom-nav' }, navItems.map((n) => h('a', { href: n.href }, n.label)));
const view = h('main', { id: 'view' });

const app = document.getElementById('app')!;
app.append(
  h('header', { class: 'topbar' },
    h('div', { class: 'topbar-in' },
      h('a', { class: 'brand', href: '#/' }, h('img', { src: 'favicon.svg', alt: '', width: 28, height: 28 }), h('span', null, 'Kinematik')),
      topNav,
      h('div', { class: 'pills' }, streakPill, xpPill))),
  view,
  bottomNav,
);

function updatePills() {
  const s = getState();
  xpPill.textContent = `${s.xp} XP`;
  streakPill.innerHTML = `${icons.flame}${s.day.streak}`;
  streakPill.title = `${s.day.streak} ${s.day.streak === 1 ? 'dag' : 'dage'} i træk`;
  streakPill.style.display = s.day.streak > 0 ? '' : 'none';
}
subscribe(updatePills);
updatePills();

let cleanup: Cleanup | void;
function render() {
  if (cleanup) cleanup();
  cleanup = undefined;
  view.replaceChildren();
  const r = parse(location.hash);
  const focus = r.page === 'lesson' || r.page === 'practice' || r.page === 'train';
  document.body.classList.toggle('focus-mode', focus);
  for (const nav of [topNav, bottomNav])
    [...nav.children].forEach((a, i) => a.classList.toggle('active', navItems[i].match.includes(r.page)));
  switch (r.page) {
    case 'home':
      homePage(view);
      break;
    case 'level':
      cleanup = levelPage(view, r.id);
      break;
    case 'lesson':
      cleanup = lessonPage(view, r.id);
      break;
    case 'practice':
      cleanup = practicePage(view, { levelId: r.id });
      break;
    case 'train':
      cleanup = practicePage(view, { skill: r.skill });
      break;
    case 'formler':
      formulasPage(view);
      break;
    case 'oversigt':
      overviewPage(view);
      break;
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
