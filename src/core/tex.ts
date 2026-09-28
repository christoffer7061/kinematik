import katex from 'katex';

export function tex(src: string, display = false): string {
  return katex.renderToString(src, { throwOnError: false, displayMode: display, strict: 'ignore' });
}

/** Tekst med $inline$ og $$display$$ matematik -> HTML */
export function rich(s: string): string {
  return s
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m: string) => tex(m, true))
    .replace(/\$([^$]+?)\$/g, (_, m: string) => tex(m));
}
