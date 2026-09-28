// Tidsstyring for simuleringer: afspil/pause, spol, hastighed, evt. gentagelse.

import { h, icons } from '../core/dom';
import { fmt } from '../core/numbers';

export class Player {
  t = 0;
  playing = false;
  speed = 1;
  private raf = 0;
  private last = 0;
  private hold = 0;
  private subs = new Set<(t: number) => void>();
  private stateSubs = new Set<(playing: boolean) => void>();

  constructor(public tMax: number, public loop = false) {}

  on(fn: (t: number) => void) {
    this.subs.add(fn);
    fn(this.t);
    return () => this.subs.delete(fn);
  }
  onState(fn: (playing: boolean) => void) {
    this.stateSubs.add(fn);
    fn(this.playing);
  }
  private emit() {
    this.subs.forEach((f) => f(this.t));
  }
  private setPlaying(p: boolean) {
    this.playing = p;
    this.stateSubs.forEach((f) => f(p));
  }

  play() {
    if (this.t >= this.tMax - 1e-6) this.t = 0;
    cancelAnimationFrame(this.raf);
    this.last = performance.now();
    this.setPlaying(true);
    this.raf = requestAnimationFrame(this.tick);
  }
  pause() {
    cancelAnimationFrame(this.raf);
    this.setPlaying(false);
  }
  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }
  seek(t: number) {
    this.t = Math.max(0, Math.min(this.tMax, t));
    this.emit();
  }
  restart() {
    this.seek(0);
    this.play();
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.hold > 0) {
      this.hold -= dt;
      if (this.hold <= 0) this.t = 0;
    } else {
      this.t += dt * this.speed;
      if (this.t >= this.tMax) {
        this.t = this.tMax;
        if (this.loop) this.hold = 1;
        else {
          this.emit();
          this.setPlaying(false);
          return;
        }
      }
    }
    this.emit();
    this.raf = requestAnimationFrame(this.tick);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    this.subs.clear();
    this.stateSubs.clear();
  }
}

/** Knapper: afspil/pause, forfra, tidslinje og hastighed */
export function playerControls(p: Player, opts: { scrub?: boolean; speed?: boolean } = {}): HTMLElement {
  const playBtn = h('button', { class: 'icon-btn primary', 'aria-label': 'Afspil', onclick: () => p.toggle() });
  const restart = h('button', { class: 'icon-btn', 'aria-label': 'Forfra', html: icons.restart, onclick: () => p.restart() });
  const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, class: 'scrub', 'aria-label': 'Tid' }) as HTMLInputElement;
  const time = h('span', { class: 'time' });
  range.addEventListener('input', () => {
    p.pause();
    p.seek((Number(range.value) / 1000) * p.tMax);
  });
  p.on((t) => {
    range.value = String(Math.round((t / (p.tMax || 1)) * 1000));
    time.textContent = `t = ${fmt(t, 1)} s`;
  });
  p.onState((pl) => {
    playBtn.innerHTML = pl ? icons.pause : icons.play;
    playBtn.setAttribute('aria-label', pl ? 'Pause' : 'Afspil');
  });
  const speeds = [0.5, 1, 2];
  const speedBtn = opts.speed
    ? h('button', {
        class: 'chip-btn',
        onclick: (e: Event) => {
          p.speed = speeds[(speeds.indexOf(p.speed) + 1) % speeds.length];
          (e.currentTarget as HTMLElement).textContent = `${fmt(p.speed)}×`;
        },
      }, '1×')
    : null;
  return h('div', { class: 'player' }, playBtn, restart, opts.scrub === false ? null : range, time, speedBtn);
}
