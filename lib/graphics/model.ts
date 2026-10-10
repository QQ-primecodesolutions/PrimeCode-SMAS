/**
 * Pure view models: post + size → what each slide draws (wrapped lines, font sizes, counter, CTA).
 * No file or font access; text widths come in through `measure`, so this is unit-tested with a fake.
 */
import type { Post } from "@/lib/post/schema";
import type { Measure } from "./metrics";
import { SLIDE_SIZES, type SlideSize } from "./sizes";
import { smartQuotes, wrapBalanced } from "./text";

/** The frame every template shares (lib/graphics/parts.tsx draws it). */
export const FRAME = {
  /** Side padding. */
  pad: 88,
  /**
   * Top and bottom padding. Stories keep ~250 px clear at each end, where Instagram draws the
   * profile bar and the reply box.
   */
  padY: { feed: 88, square: 88, story: 250 } satisfies Record<SlideSize, number>,
  /** Top bar: logo tile and series label. */
  top: 112,
  /** Footer: website and counter. */
  foot: 48,
  /** Space between the bars and the content. */
  gap: 56,
} as const;

export type Box = { width: number; height: number };

/** The content area inside the frame. */
export function contentBox(size: SlideSize): Box {
  const { width, height } = SLIDE_SIZES[size];
  return {
    width: width - 2 * FRAME.pad,
    height: height - 2 * FRAME.padY[size] - FRAME.top - FRAME.foot - 2 * FRAME.gap,
  };
}

export type SlideFrame = {
  size: SlideSize;
  width: number;
  height: number;
  /** 0-based. */
  index: number;
  total: number;
  /** "2 / 6" on carousels; null on a single image. */
  counter: string | null;
  isLast: boolean;
  series: string;
};

export function slideFrame(post: Post, index: number, size: SlideSize): SlideFrame {
  const total = post.slides.length;
  return {
    size,
    ...SLIDE_SIZES[size],
    index,
    total,
    counter: total > 1 ? `${index + 1} / ${total}` : null,
    isLast: index === total - 1,
    series: post.series,
  };
}

export type Block = { lines: string[]; fontSize: number; lineHeight: number };

export const blockHeight = (b: Block) => b.lines.length * b.fontSize * b.lineHeight;

export type Measures = {
  /** Headline: Inter ExtraBold with the title's letter-spacing. */
  title: Measure;
  /** Supporting text: Inter Regular. */
  body: Measure;
  /** List items and the CTA: Inter SemiBold. */
  strong: Measure;
};

// INSIGHT-01: typography only; the sentence is the design. --------------------------------------

export const INSIGHT = {
  /** Largest and smallest headline size per output size; one size is used for the whole carousel. */
  titleMax: { feed: 120, square: 104, story: 128 } satisfies Record<SlideSize, number>,
  titleMin: 48,
  titleLineHeight: 1.08,
  /** em; tighter tracking suits Inter at display sizes. */
  titleTracking: -0.025,
  /** Supporting text is this fraction of the headline, within [min, max] px. */
  subRatio: 0.42,
  subMin: 36,
  subMax: 54,
  subLineHeight: 1.35,
  /** Space between headline and supporting text (and above the headline, under the accent rule), as a fraction of the headline size. */
  subGap: 0.45,
  /** Height of the accent rule above the headline. */
  rule: 10,
  itemGap: 0.5,
  /** List marker column, as a fraction of the item size. */
  itemIndent: 1.1,
  ctaSize: 40,
  ctaLineHeight: 1.3,
  /** CTA left rule plus its padding. */
  ctaIndent: 34,
  /** Minimum space between the text and the CTA. */
  ctaGap: 64,
} as const;

export type InsightSlide = SlideFrame & {
  title: Block;
  subtitle: Block | null;
  items: Block[];
  /** The post's call to action, on the final slide only. */
  cta: Block | null;
  /** True when even the smallest headline size didn't fit; the slide needs shorter copy. */
  overflow: boolean;
};

function layoutInsight(
  post: Post,
  index: number,
  size: SlideSize,
  titleSize: number,
  m: Measures,
): Omit<InsightSlide, "overflow"> | null {
  const box = contentBox(size);
  const raw = post.slides[index]!;
  const slide = {
    ...raw,
    title: smartQuotes(raw.title),
    subtitle: raw.subtitle && smartQuotes(raw.subtitle),
    body: raw.body && smartQuotes(raw.body),
    items: raw.items?.map(smartQuotes),
  };
  const frame = slideFrame(post, index, size);
  const sub = Math.round(Math.min(INSIGHT.subMax, Math.max(INSIGHT.subMin, titleSize * INSIGHT.subRatio)));

  const titleLines = wrapBalanced(slide.title, box.width, titleSize, m.title);
  if (!titleLines) return null;
  const title = { lines: titleLines, fontSize: titleSize, lineHeight: INSIGHT.titleLineHeight };

  const supporting = [slide.subtitle, slide.body].filter(Boolean).join(" ");
  let subtitle: Block | null = null;
  if (supporting) {
    const lines = wrapBalanced(supporting, box.width, sub, m.body);
    if (!lines) return null;
    subtitle = { lines, fontSize: sub, lineHeight: INSIGHT.subLineHeight };
  }

  const items: Block[] = [];
  for (const item of slide.items ?? []) {
    const lines = wrapBalanced(item, box.width - sub * INSIGHT.itemIndent, sub, m.strong);
    if (!lines) return null;
    items.push({ lines, fontSize: sub, lineHeight: INSIGHT.subLineHeight });
  }

  let cta: Block | null = null;
  if (frame.isLast) {
    const lines = wrapBalanced(smartQuotes(post.cta), box.width - INSIGHT.ctaIndent, INSIGHT.ctaSize, m.strong);
    if (!lines) return null;
    cta = { lines, fontSize: INSIGHT.ctaSize, lineHeight: INSIGHT.ctaLineHeight };
  }

  const gap = titleSize * INSIGHT.subGap;
  const height =
    INSIGHT.rule +
    gap +
    blockHeight(title) +
    (subtitle ? gap + blockHeight(subtitle) : 0) +
    (items.length ? gap + items.reduce((h, b) => h + blockHeight(b), 0) + (items.length - 1) * sub * INSIGHT.itemGap : 0) +
    (cta ? INSIGHT.ctaGap + blockHeight(cta) : 0);
  if (height > box.height) return null;

  return { ...frame, title, subtitle, items, cta };
}

/**
 * Every slide of an INSIGHT-01 post at one shared headline size: the largest size at which every
 * slide fits, so the set looks consistent when swiped.
 */
export function insightModel(post: Post, size: SlideSize, m: Measures): InsightSlide[] {
  for (let t = INSIGHT.titleMax[size]; t >= INSIGHT.titleMin; t -= 2) {
    const slides = post.slides.map((_, i) => layoutInsight(post, i, size, t, m));
    if (slides.every((s) => s !== null)) return slides.map((s) => ({ ...s!, overflow: false }));
  }
  // Nothing fits: draw at the smallest size, unwrapped where needed, and flag it.
  return post.slides.map((slide, i) => {
    const fit = layoutInsight(post, i, size, INSIGHT.titleMin, m);
    if (fit) return { ...fit, overflow: false };
    const frame = slideFrame(post, i, size);
    const block = (text: string, fontSize: number, lineHeight: number) => ({ lines: [text], fontSize, lineHeight });
    return {
      ...frame,
      title: block(slide.title, INSIGHT.titleMin, INSIGHT.titleLineHeight),
      subtitle: slide.subtitle ? block(slide.subtitle, INSIGHT.subMin, INSIGHT.subLineHeight) : null,
      items: (slide.items ?? []).map((it) => block(it, INSIGHT.subMin, INSIGHT.subLineHeight)),
      cta: frame.isLast ? block(post.cta, INSIGHT.ctaSize, INSIGHT.ctaLineHeight) : null,
      overflow: true,
    };
  });
}
