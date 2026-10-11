/**
 * Pure view models: post + size → what each slide draws (slide kind, wrapped lines, font sizes,
 * counter, CTA).
 * No file or font access; text widths come in through `measure`, so this is unit-tested with a fake.
 */
import type { Post, Slide } from "@/lib/post/schema";
import { SERVICES, type ServiceKey, serviceOf } from "@/lib/post/services";
import type { Media } from "./images";
import type { Measure } from "./metrics";
import { SLIDE_SIZES, type SlideSize } from "./sizes";
import { smartQuotes, wrapBalanced, wrapLoose } from "./text";

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

/** Typography shared by every template. */
export const TYPE = {
  /** Largest headline size per output size; one size is used for the whole carousel. */
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
  /** Space between stacked elements (rule, headline, supporting text), as a fraction of the headline size. */
  gap: 0.45,
  /** Height of the accent rule above a statement headline. */
  rule: 10,
  itemGap: 0.5,
  /** List marker column, as a fraction of the item size. */
  itemIndent: 1.1,
  ctaSize: 40,
  ctaLineHeight: 1.3,
  /** CTA left rule plus its padding. */
  ctaIndent: 34,
  /** Minimum space above the CTA. */
  ctaGap: 64,
} as const;

/** BIZ-01: tick/cross badge, sign number and the checklist along the bottom. */
export const BIZ = {
  badge: 96,
  numberSize: 72,
  check: 40,
  checkGap: 14,
  /** Space above the checklist. */
  checklistGap: 56,
} as const;

/** BRAND-01: service icon tile and the four-service grid along the bottom. */
export const BRAND = {
  tile: 136,
  gridTile: 84,
  gridLabel: 20,
  /** Tile + label + the space between them. */
  gridHeight: 84 + 14 + 26,
  /** Space above the grid. */
  gridGap: 56,
} as const;

/** PROJECT-01: device mockups holding real screenshots (assets/shots/). */
export const DEVICE = {
  /** Height of the device on a slide, per output size. */
  height: { feed: 420, square: 270, story: 700 } satisfies Record<SlideSize, number>,
  /** The device sits centred on a full-width stage panel with this padding around it. */
  stagePad: 32,
  /** Phone screen proportions (width / height), a typical modern phone. */
  phoneScreen: 9 / 19.5,
  /** Laptop screen proportions (16:10). */
  laptopScreen: 1.6,
} as const;

/** A section label above a headline ("THE PROBLEM"), set in mono. */
export const LABEL = { size: 30, lineHeight: 1.2, height: 36 } as const;

/** Headline, supporting text and list, already wrapped. */
export type Text = {
  /** Mono label above the headline, in place of the accent rule. */
  label: string | null;
  title: Block;
  subtitle: Block | null;
  items: Block[];
};

/** A device frame and where the screenshot sits in it, in px. */
export type Device = {
  type: "phone" | "laptop";
  width: number;
  height: number;
  /** Bezel thickness. */
  bezel: number;
  screen: { width: number; height: number; radius: number };
  /** Laptop only: the lid (screen + bezel) and the base below it. */
  lid: { width: number; height: number } | null;
  base: { width: number; height: number } | null;
  /** The screenshot scaled to cover the screen, anchored top-centre; null when the file is missing. */
  image: { src: string; width: number; height: number; left: number } | null;
  /** The asset path, shown on the placeholder when the file is missing. */
  asset: string;
};

type Common = {
  /** The post's call to action, on the final slide only. */
  cta: Block | null;
  /** BRAND-01 posts that list services: the grid along the bottom, with this slide's service lit. */
  grid: { active: ServiceKey | null } | null;
  /** True when even the smallest headline size didn't fit; the slide needs shorter copy. */
  overflow: boolean;
};

export type StatementSlide = SlideFrame & Common & { kind: "statement"; text: Text };
export type Mark = "tick" | "cross";
export type SignSlide = SlideFrame &
  Common & {
    kind: "sign";
    number: string;
    mark: Mark;
    /** Every numbered slide's mark, and whether the reader has reached it yet. */
    checklist: { mark: Mark; done: boolean }[];
    text: Text;
  };
export type ServiceSlide = SlideFrame & Common & { kind: "service"; service: ServiceKey; text: Text };
export type DeviceSlide = SlideFrame & Common & { kind: "device"; device: Device; text: Text };
export type SlideModel = StatementSlide | SignSlide | ServiceSlide | DeviceSlide;

/** Omit applied to each member of a union, keeping the members apart. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A slide before the carousel fit decides `overflow`. */
type Laid = DistributiveOmit<SlideModel, "overflow">;

type Ctx = {
  post: Post;
  index: number;
  size: SlideSize;
  titleSize: number;
  m: Measures;
  /** Last resort: wrap even where a word is too wide and skip the height check. */
  lenient: boolean;
};

const subSize = (titleSize: number) => Math.round(Math.min(TYPE.subMax, Math.max(TYPE.subMin, titleSize * TYPE.subRatio)));

function wrap(ctx: Ctx, text: string, width: number, fontSize: number, measure: Measure): string[] | null {
  return wrapBalanced(text, width, fontSize, measure) ?? (ctx.lenient ? wrapLoose(text, width, fontSize, measure) : null);
}

function block(ctx: Ctx, text: string, width: number, fontSize: number, lineHeight: number, measure: Measure): Block | null {
  const lines = wrap(ctx, smartQuotes(text), width, fontSize, measure);
  return lines && { lines, fontSize, lineHeight };
}

/** Headline, supporting text and list items; null if a word is too wide. */
function layoutText(
  ctx: Ctx,
  title: string,
  supporting: string,
  items: readonly string[],
  label: string | null = null,
): Text | null {
  const width = contentBox(ctx.size).width;
  const sub = subSize(ctx.titleSize);
  const t = block(ctx, title, width, ctx.titleSize, TYPE.titleLineHeight, ctx.m.title);
  if (!t) return null;
  let s: Block | null = null;
  if (supporting) {
    s = block(ctx, supporting, width, sub, TYPE.subLineHeight, ctx.m.body);
    if (!s) return null;
  }
  const list: Block[] = [];
  for (const item of items) {
    const b = block(ctx, item, width - sub * TYPE.itemIndent, sub, TYPE.subLineHeight, ctx.m.strong);
    if (!b) return null;
    list.push(b);
  }
  return { label, title: t, subtitle: s, items: list };
}

/** Height of a slide's text, including its label (or, with `rule`, the accent rule) above it. */
export function textHeight(text: Text, rule = false): number {
  const gap = text.title.fontSize * TYPE.gap;
  const { items } = text;
  return (
    (text.label ? LABEL.height + gap : rule ? TYPE.rule + gap : 0) +
    blockHeight(text.title) +
    (text.subtitle ? gap + blockHeight(text.subtitle) : 0) +
    (items.length
      ? gap + items.reduce((h, b) => h + blockHeight(b), 0) + (items.length - 1) * items[0]!.fontSize * TYPE.itemGap
      : 0)
  );
}

const supportingOf = (slide: Slide) => [slide.subtitle, slide.body].filter(Boolean).join(" ");

const SIGN = /^(\d{1,2})[.)]\s+(.+)$/s;

type Kind =
  /** `label`/`title`/`supporting` override the slide's own title and subtitle (PROJECT-01 sections). */
  | { kind: "statement"; label?: string; title?: string; supporting?: string }
  | { kind: "sign"; number: string; title: string }
  | { kind: "service"; service: ServiceKey }
  | { kind: "device"; asset: string; media: Media | null; label?: string; title?: string; supporting?: string };

/** Fits a phone or laptop into `maxHeight` x `maxWidth`, with `media` covering its screen. */
export function deviceGeometry(
  type: Device["type"],
  maxHeight: number,
  maxWidth: number,
  asset: string,
  media: Media | null,
): Device {
  let lid: Device["lid"] = null;
  let base: Device["base"] = null;
  let bezel: number;
  let screen: { width: number; height: number };
  let width: number;
  let height = maxHeight;
  if (type === "phone") {
    bezel = Math.round(height * 0.03);
    screen = { width: Math.round((height - 2 * bezel) * DEVICE.phoneScreen), height: height - 2 * bezel };
    width = screen.width + 2 * bezel;
  } else {
    const layout = (h: number) => {
      const baseH = Math.round(h * 0.055);
      const lidH = h - baseH;
      const b = Math.round(lidH * 0.045);
      const sc = { height: lidH - 2 * b, width: Math.round((lidH - 2 * b) * DEVICE.laptopScreen) };
      const lidW = sc.width + 2 * b;
      return { b, sc, lidW, lidH, baseW: Math.round(lidW * 1.16), baseH };
    };
    let l = layout(height);
    if (l.baseW > maxWidth) {
      height = Math.floor((height * maxWidth) / l.baseW);
      l = layout(height);
      // Rounding can leave it a pixel over.
      while (l.baseW > maxWidth) l = layout(--height);
    }
    bezel = l.b;
    screen = l.sc;
    width = l.baseW;
    lid = { width: l.lidW, height: l.lidH };
    base = { width: l.baseW, height: l.baseH };
  }
  let image: Device["image"] = null;
  if (media) {
    // Cover the screen: fill its width (cropping the bottom), or its height if the shot is wider.
    const scale = Math.max(screen.width / media.width, screen.height / media.height);
    const w = Math.round(media.width * scale);
    image = { src: media.src, width: w, height: Math.round(media.height * scale), left: Math.round((screen.width - w) / 2) };
  }
  const radius = type === "phone" ? Math.round(width * 0.17) - bezel : Math.round(bezel * 0.4);
  return { type, width, height, bezel, screen: { ...screen, radius }, lid, base, image, asset };
}

/**
 * Lays out one slide at a headline size. `kindOf` decides what the slide is; `bottom` is the height
 * of whatever the template draws along the bottom of every slide (BRAND-01's grid).
 */
function layoutSlide(
  ctx: Ctx,
  kind: Kind,
  bottom: { height: number; grid: Common["grid"] },
): Laid | null {
  const { post, index, size, titleSize } = ctx;
  const slide = post.slides[index]!;
  const frame = slideFrame(post, index, size);
  const box = contentBox(size);
  const gap = titleSize * TYPE.gap;

  const cta = frame.isLast
    ? block(ctx, post.cta, box.width - TYPE.ctaIndent, TYPE.ctaSize, TYPE.ctaLineHeight, ctx.m.strong)
    : null;
  if (frame.isLast && !cta) return null;
  const reserved = (cta ? TYPE.ctaGap + blockHeight(cta) : 0) + bottom.height;
  const fits = (height: number) => ctx.lenient || height + reserved <= box.height;
  const common = { cta, grid: bottom.grid };

  if (kind.kind === "sign") {
    const text = layoutText(ctx, kind.title, supportingOf(slide), slide.items ?? []);
    const checklist = BIZ.checklistGap + BIZ.check;
    if (!text || !fits(BIZ.badge + gap + textHeight(text) + checklist)) return null;
    const signs = post.slides.filter((s) => SIGN.test(s.title));
    const at = signs.indexOf(slide);
    return {
      ...frame,
      ...common,
      kind: "sign",
      number: kind.number.padStart(2, "0"),
      mark: slide.mark ?? "tick",
      checklist: signs.map((s, i) => ({ mark: s.mark ?? "tick", done: i <= at })),
      text,
    };
  }

  if (kind.kind === "service") {
    const name = SERVICES.find((s) => s.key === kind.service)!.name;
    const text = layoutText(ctx, name, supportingOf(slide), slide.items ?? []);
    if (!text || !fits(BRAND.tile + gap + textHeight(text))) return null;
    return { ...frame, ...common, kind: "service", service: kind.service, text };
  }

  if (kind.kind === "device") {
    const portrait = kind.media ? kind.media.width / kind.media.height < 0.9 : /phone|mobile/i.test(kind.asset);
    const device = deviceGeometry(
      portrait ? "phone" : "laptop",
      DEVICE.height[size],
      box.width - 2 * DEVICE.stagePad,
      kind.asset,
      kind.media,
    );
    const text = layoutText(
      ctx,
      kind.title ?? slide.title,
      kind.supporting ?? supportingOf(slide),
      slide.items ?? [],
      kind.label,
    );
    if (!text || !fits(DEVICE.height[size] + 2 * DEVICE.stagePad + gap + textHeight(text))) return null;
    return { ...frame, ...common, kind: "device", device, text };
  }

  const text = layoutText(
    ctx,
    kind.title ?? slide.title,
    kind.supporting ?? supportingOf(slide),
    slide.items ?? [],
    kind.label,
  );
  if (!text || !fits(textHeight(text, true))) return null;
  return { ...frame, ...common, kind: "statement", text };
}

/**
 * Every slide of a post at one shared headline size: the largest size at which every slide fits,
 * so the set looks consistent when swiped. If even the smallest size doesn't fit, the slides that
 * overflow are drawn anyway and flagged.
 */
function fitCarousel(
  post: Post,
  size: SlideSize,
  m: Measures,
  kindOf: (slide: Slide) => Kind,
  bottom: (slide: Slide) => { height: number; grid: Common["grid"] },
): SlideModel[] {
  const at = (titleSize: number, i: number, lenient = false) =>
    layoutSlide({ post, index: i, size, titleSize, m, lenient }, kindOf(post.slides[i]!), bottom(post.slides[i]!));
  for (let t = TYPE.titleMax[size]; t >= TYPE.titleMin; t -= 2) {
    const slides = post.slides.map((_, i) => at(t, i));
    if (slides.every((s) => s !== null)) return slides.map((s) => ({ ...s!, overflow: false }) as SlideModel);
  }
  return post.slides.map((_, i) => {
    const fit = at(TYPE.titleMin, i);
    return { ...(fit ?? at(TYPE.titleMin, i, true)!), overflow: !fit } as SlideModel;
  });
}

const noBottom = () => ({ height: 0, grid: null });

// INSIGHT-01: typography only; the sentence is the design. -------------------------------------

export function insightModel(post: Post, size: SlideSize, m: Measures): SlideModel[] {
  return fitCarousel(post, size, m, () => ({ kind: "statement" }), noBottom);
}

// BIZ-01: a problem slide, then numbered signs or solutions with tick/cross marks. --------------

/** Slides titled "1. …" are signs; the rest (the opening problem, the conclusion) are statements. */
export function bizKind(slide: Slide): Kind {
  const m = SIGN.exec(slide.title);
  return m ? { kind: "sign", number: m[1]!, title: m[2]! } : { kind: "statement" };
}

export function bizModel(post: Post, size: SlideSize, m: Measures): SlideModel[] {
  return fitCarousel(post, size, m, bizKind, noBottom);
}

// BRAND-01: services in a consistent grid, an icon plus a short line. ---------------------------

export function brandKind(slide: Slide): Kind {
  const service = serviceOf(slide.title);
  return service ? { kind: "service", service } : { kind: "statement" };
}

export function brandModel(post: Post, size: SlideSize, m: Measures): SlideModel[] {
  const listsServices = post.slides.some((s) => serviceOf(s.title));
  return fitCarousel(post, size, m, brandKind, (slide) =>
    listsServices ? { height: BRAND.gridGap + BRAND.gridHeight, grid: { active: serviceOf(slide.title) } } : noBottom(),
  );
}

// PROJECT-01: problem -> what we built -> why it mattered, with real screenshots in device frames.

/**
 * PROJECT-01 slides: a short title (four words or fewer) over a subtitle is a section label
 * ("THE PROBLEM", "Behind the Build") above the subtitle as headline; a slide with an `asset`
 * shows that screenshot in a phone (portrait shots) or a laptop (landscape).
 */
export function projectKind(slide: Slide, media: ReadonlyMap<string, Media | null>): Kind {
  const section =
    slide.subtitle && slide.title.trim().split(/\s+/).length <= 4
      ? { label: slide.title, title: slide.subtitle, supporting: slide.body ?? "" }
      : {};
  if (slide.asset) return { kind: "device", asset: slide.asset, media: media.get(slide.asset) ?? null, ...section };
  return { kind: "statement", ...section };
}

export function projectModel(
  post: Post,
  size: SlideSize,
  m: Measures,
  media: ReadonlyMap<string, Media | null>,
): SlideModel[] {
  return fitCarousel(post, size, m, (slide) => projectKind(slide, media), noBottom);
}
