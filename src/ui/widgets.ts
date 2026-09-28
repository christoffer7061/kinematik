// Små genbrugelige UI-byggeklodser til lektionernes widgets.

import { h } from '../core/dom';
import { fmt, unitText } from '../core/numbers';
import { rich } from '../core/tex';

export function slider(opts: { label: string; min: number; max: number; step: number; value: number; unit?: string; digits?: number; onInput: (v: number) => void }): HTMLElement {
  const out = h('output', { class: 'val' });
  const set = (v: number) => (out.textContent = `${fmt(v, opts.digits)} ${unitText(opts.unit ?? '')}`.trim());
  set(opts.value);
  const input = h('input', { type: 'range', min: opts.min, max: opts.max, step: opts.step, value: opts.value }) as HTMLInputElement;
  input.addEventListener('input', () => {
    const v = Number(input.value);
    set(v);
    opts.onInput(v);
  });
  return h('label', { class: 'slider' }, h('span', { class: 'lbl', html: rich(opts.label) }), input, out);
}

export const qspan = (cls: 's' | 'v' | 'a' | 'F' | 'muted', sym: string, val: string) =>
  `<span class="q q-${cls}">${sym ? `<i>${sym}</i> = ` : ''}${val}</span>`;

export function starsHtml(n: number, max = 3): string {
  return `<span class="stars" aria-label="${n} af ${max} stjerner">${Array.from({ length: max }, (_, i) => `<span class="star${i < n ? ' on' : ''}">★</span>`).join('')}</span>`;
}
