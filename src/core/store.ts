// Al fremgang gemmes lokalt i browseren (localStorage). Ingen login, ingen server.

export interface SkillStat {
  /** De seneste forsøg (1 = rigtigt, 0 = forkert), nyeste sidst, maks 10 */
  recent: number[];
  attempts: number;
  correct: number;
}
export interface LevelStat {
  stars: number;
  best: number; // bedste resultat 0–1
  rounds: number;
  lessonDone: boolean;
  lessonPos: number;
}
export interface State {
  v: 1;
  xp: number;
  day: { streak: number; last: string | null };
  levels: Record<string, LevelStat>;
  skills: Record<string, SkillStat>;
  unlockAll: boolean;
}

const KEY = 'kinematik.v1';

export const emptyState = (): State => ({
  v: 1,
  xp: 0,
  day: { streak: 0, last: null },
  levels: {},
  skills: {},
  unlockAll: false,
});

export const emptyLevel = (): LevelStat => ({ stars: 0, best: 0, rounds: 0, lessonDone: false, lessonPos: 0 });

function load(): State {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return emptyState();
    const s = JSON.parse(raw) as State;
    if (s?.v !== 1) return emptyState();
    return { ...emptyState(), ...s };
  } catch {
    return emptyState();
  }
}

let state: State = load();
const subs = new Set<(s: State) => void>();

export const getState = () => state;

export function update(fn: (s: State) => void): void {
  fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* privat vindue e.l. – fremgang gemmes bare ikke */
  }
  subs.forEach((f) => f(state));
}

export function subscribe(fn: (s: State) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function resetAll(): void {
  update((s) => Object.assign(s, emptyState()));
}

export function levelStat(s: State, id: string): LevelStat {
  return (s.levels[id] ??= emptyLevel());
}
