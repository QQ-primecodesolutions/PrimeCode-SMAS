/**
 * Line breaking for slides. Satori kerns unevenly across ordinary spaces and wraps on its own
 * estimate, so we break lines here (between words, never inside one) and render each line with
 * no-break spaces.
 */
import type { Measure } from "./metrics";

export const NBSP = "\u00A0";

/** Ordinary spaces → no-break spaces, so Satori neither wraps nor mis-kerns the line. */
export const nbsp = (s: string) => s.replace(/ /g, NBSP);

/** Upper-case for labels, with no-break spaces. */
export const upper = (s: string) => nbsp(s.toLocaleUpperCase("en-ZA"));

/**
 * Straight quotes → typographic ones: ' → ’ (apostrophes, closing) or ‘ (opening); " → “ or ”.
 * Inter's straight quote also spaces badly at display sizes ("doesn ' t").
 */
export function smartQuotes(s: string): string {
  return s
    .replace(/(^|[\s([{\u2014-])'/g, "$1\u2018")
    .replace(/'/g, "\u2019")
    .replace(/(^|[\s([{\u2014-])"/g, "$1\u201C")
    .replace(/"/g, "\u201D");
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** Greedy wrap to `width` px. Null when a single word is wider than `width`. */
export function wrapGreedy(text: string, width: number, fontSize: number, measure: Measure): string[] | null {
  const lines: string[] = [];
  for (const word of words(text)) {
    if (measure(word, fontSize) > width) return null;
    const last = lines.at(-1);
    const joined = last === undefined ? word : `${last} ${word}`;
    if (last !== undefined && measure(joined, fontSize) <= width) lines[lines.length - 1] = joined;
    else lines.push(word);
  }
  return lines;
}

/**
 * Wrap to `width` px with lines as even as possible: the fewest lines greedy wrapping needs, then
 * the narrowest width that still gives that many, so a headline doesn't end on a lone word.
 */
export function wrapBalanced(text: string, width: number, fontSize: number, measure: Measure): string[] | null {
  const greedy = wrapGreedy(text, width, fontSize, measure);
  if (!greedy || greedy.length <= 1) return greedy;
  let lo = Math.max(...words(text).map((w) => measure(w, fontSize)));
  let hi = width;
  let best = greedy;
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2;
    const lines = wrapGreedy(text, mid, fontSize, measure);
    if (lines && lines.length === greedy.length) {
      best = lines;
      hi = mid;
    } else lo = mid;
  }
  return best;
}

/** Greedy wrap that never fails: a word wider than `width` gets a line of its own. Last resort only. */
export function wrapLoose(text: string, width: number, fontSize: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const word of words(text)) {
    const last = lines.at(-1);
    if (last !== undefined && measure(`${last} ${word}`, fontSize) <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}
