import { h, type Cleanup } from '../core/dom';
import type { Visual } from '../exercises/types';
import { Plot } from './plot';
import { Player, playerControls } from './player';
import { Scene } from './scene';
import { forceDiagram, numberLine } from './svgviz';

/** Monterer en opgavefigur i `host` og returnerer oprydning. */
export function mountVisual(host: HTMLElement, v: Visual): Cleanup {
  if (v.type === 'plot') {
    const p = new Plot(v.plot);
    host.append(p.el);
    return () => p.destroy();
  }
  if (v.type === 'motion') {
    const sc = new Scene(v.motion);
    const pl = new Player(v.motion.tMax, true);
    pl.on((t) => sc.setTime(t));
    host.append(h('div', { class: 'motion-box' }, sc.el, playerControls(pl, { scrub: true })));
    requestAnimationFrame(() => pl.play());
    return () => {
      pl.destroy();
      sc.destroy();
    };
  }
  if (v.type === 'numberline') {
    host.append(numberLine(v.nl));
    return () => {};
  }
  host.append(h('div', { class: 'fbd-box' }, forceDiagram(v.fbd)));
  return () => {};
}
