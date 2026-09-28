// Spilmekanik: XP, dagsstreak, stjerner, oplåsning og styrke pr. færdighed.
// Funktionerne tager state som parameter, så de kan testes uden browser.

import { levelStat, type State } from './store';

export const PASS = 0.8; // 80 % låser næste bane op

export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function touchDay(s: State, now = new Date()): void {
  const t = today(now);
  if (s.day.last === t) return;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  s.day.streak = s.day.last === today(y) ? s.day.streak + 1 : 1;
  s.day.last = t;
}

export interface AnswerInfo {
  skillResults: Record<string, boolean>;
  points: number; // 1 = rigtigt i første forsøg, 0,5 = i andet, 0 = forkert
  hints: number;
}

export function xpFor(a: AnswerInfo): number {
  if (a.points <= 0) return 2; // også XP for at prøve og læse forklaringen
  const base = a.points >= 1 ? 10 : 6;
  return Math.max(4, base - 2 * a.hints);
}

export function recordAnswer(s: State, a: AnswerInfo): number {
  for (const [id, ok] of Object.entries(a.skillResults)) {
    const st = (s.skills[id] ??= { recent: [], attempts: 0, correct: 0 });
    st.attempts++;
    if (ok) st.correct++;
    st.recent.push(ok ? 1 : 0);
    if (st.recent.length > 10) st.recent.shift();
  }
  const xp = xpFor(a);
  s.xp += xp;
  touchDay(s);
  return xp;
}

export function starsFor(pct: number, usedHints: boolean): number {
  if (pct >= 0.999 && !usedHints) return 3;
  if (pct >= 0.9) return 2;
  if (pct >= PASS) return 1;
  return 0;
}

export interface RoundOutcome {
  pct: number;
  stars: number;
  newBest: boolean;
  unlockedNext: boolean;
  bonusXp: number;
}

export function finishRound(s: State, levelId: string, points: number, total: number, usedHints: boolean): RoundOutcome {
  const pct = total ? points / total : 0;
  const st = levelStat(s, levelId);
  const stars = starsFor(pct, usedHints);
  const unlockedNext = st.stars === 0 && stars > 0;
  const newBest = pct > st.best;
  st.best = Math.max(st.best, pct);
  st.stars = Math.max(st.stars, stars);
  st.rounds++;
  const bonusXp = 15 + 10 * stars;
  s.xp += bonusXp;
  return { pct, stars, newBest, unlockedNext, bonusXp };
}

/** En bane er låst op, hvis den er den første, eller den forrige har mindst én stjerne. */
export function isUnlocked(s: State, levelIds: string[], id: string): boolean {
  if (s.unlockAll) return true;
  const i = levelIds.indexOf(id);
  if (i <= 0) return true;
  return (s.levels[levelIds[i - 1]]?.stars ?? 0) > 0;
}

/** Andel rigtige blandt de seneste forsøg, eller null hvis der er for få data. */
export function skillStrength(s: State, id: string): number | null {
  const r = s.skills[id]?.recent;
  if (!r || r.length < 3) return null;
  return r.reduce((a, b) => a + b, 0) / r.length;
}
