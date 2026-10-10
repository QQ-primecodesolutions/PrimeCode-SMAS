/**
 * Glyph advance widths read straight from a TrueType/OpenType file (cmap + hmtx), so slide text can
 * be wrapped before Satori sees it. Kerning is ignored, which only over-estimates (Inter's kerning
 * pairs are almost all negative), so a measured line never overflows.
 */

export type Measure = (text: string, fontSize: number) => number;

type Table = { offset: number; length: number };

function tables(font: DataView): Map<string, Table> {
  const out = new Map<string, Table>();
  const count = font.getUint16(4);
  for (let i = 0; i < count; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(...[0, 1, 2, 3].map((k) => font.getUint8(rec + k)));
    out.set(tag, { offset: font.getUint32(rec + 8), length: font.getUint32(rec + 12) });
  }
  return out;
}

/** Character code → glyph id, from a cmap format 4 (BMP) or 12 (full Unicode) subtable. */
function cmapLookup(font: DataView, cmap: number): (code: number) => number {
  const count = font.getUint16(cmap + 2);
  let best: { offset: number; format: number } | null = null;
  for (let i = 0; i < count; i++) {
    const rec = cmap + 4 + i * 8;
    const platform = font.getUint16(rec);
    const encoding = font.getUint16(rec + 2);
    const offset = cmap + font.getUint32(rec + 4);
    const format = font.getUint16(offset);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode || (format !== 4 && format !== 12)) continue;
    if (!best || (format === 12 && best.format === 4)) best = { offset, format };
  }
  if (!best) throw new Error("Font has no Unicode cmap (format 4 or 12)");
  const t = best.offset;

  if (best.format === 12) {
    const groups = font.getUint32(t + 12);
    return (code) => {
      for (let g = 0; g < groups; g++) {
        const p = t + 16 + g * 12;
        const start = font.getUint32(p);
        if (code < start) return 0;
        if (code <= font.getUint32(p + 4)) return font.getUint32(p + 8) + (code - start);
      }
      return 0;
    };
  }

  const segs = font.getUint16(t + 6) / 2;
  const ends = t + 14;
  const starts = ends + segs * 2 + 2;
  const deltas = starts + segs * 2;
  const ranges = deltas + segs * 2;
  return (code) => {
    if (code > 0xffff) return 0;
    for (let s = 0; s < segs; s++) {
      if (code > font.getUint16(ends + s * 2)) continue;
      const start = font.getUint16(starts + s * 2);
      if (code < start) return 0;
      const delta = font.getInt16(deltas + s * 2);
      const range = font.getUint16(ranges + s * 2);
      if (range === 0) return (code + delta) & 0xffff;
      const glyph = font.getUint16(ranges + s * 2 + range + (code - start) * 2);
      return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
  };
}

/** Advance width of each character in em, from a font file. */
export function fontMetrics(data: Uint8Array): (char: string) => number {
  const font = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const t = tables(font);
  const need = (tag: string) => {
    const table = t.get(tag);
    if (!table) throw new Error(`Font has no ${tag} table`);
    return table.offset;
  };
  const unitsPerEm = font.getUint16(need("head") + 18);
  const hMetrics = font.getUint16(need("hhea") + 34);
  const hmtx = need("hmtx");
  const glyphOf = cmapLookup(font, need("cmap"));
  const cache = new Map<string, number>();
  return (char) => {
    let em = cache.get(char);
    if (em === undefined) {
      const glyph = glyphOf(char.codePointAt(0)!);
      // Glyphs past numberOfHMetrics share the last advance width.
      em = font.getUint16(hmtx + Math.min(glyph, hMetrics - 1) * 4) / unitsPerEm;
      cache.set(char, em);
    }
    return em;
  };
}

/** Width of `text` in px at `fontSize`, with `letterSpacing` in em added after every character. */
export function measurer(em: (char: string) => number, letterSpacing = 0): Measure {
  return (text, fontSize) => {
    let w = 0;
    for (const ch of text) w += em(ch) + letterSpacing;
    return w * fontSize;
  };
}
