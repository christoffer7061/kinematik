export type Child = Node | string | number | null | undefined | false | Child[];
export type Cleanup = () => void;

/** Lille hjælper til at bygge DOM: h('div', { class: 'x', onclick }, ...børn) */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Record<string, unknown> | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props)
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'html') el.innerHTML = String(v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  append(el, children);
  return el;
}

export function append(el: Element, children: Child[]): void {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : String(c));
  }
}

const SVGNS = 'http://www.w3.org/2000/svg';
export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  ...children: (SVGElement | string)[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) el.append(c);
  return el;
}

export const icons = {
  play: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
  restart: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" fill="currentColor"/></svg>',
  flame: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2s1 3.5-1.5 6.5C8.7 10.6 7 12.3 7 15a5 5 0 0 0 10 0c0-2.2-1-3.8-2-5 .1 1.6-.6 2.7-1.6 3 .6-3.3-.4-7.6-1.4-11z" fill="currentColor"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 21h6v-1.5H9zm3-19a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" fill="currentColor"/></svg>',
  cross: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z" fill="currentColor"/></svg>',
  book: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 3h11a3 3 0 0 1 3 3v15H7a2 2 0 0 1-2-2zm2 14h10V6a1 1 0 0 0-1-1H7z" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L12 13.4l-6.3 6.3-1.4-1.4L10.6 12 4.3 5.7l1.4-1.4L12 10.6l6.3-6.3z" fill="currentColor"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" fill="currentColor"/></svg>',
};
