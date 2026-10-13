/**
 * Pure view models: post + size → what each slide draws (slide kind, wrapped lines, font sizes,
 * counter, CTA).
 * No file or font access; text widths come in through `measure`, so this is unit-tested with a fake.
 */
import { SERIES_THEME, type ThemeName } from "@/brand/tokens";
import type { Code, Diagram, Post, Slide, TemplateCode } from "@/lib/post/schema";
import { SERVICES, type ServiceKey, serviceOf } from "@/lib/post/services";
import { highlightLines, type Token } from "./code";
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
  /** Where the logo tile sits. TECH-01 puts it bottom-right (Reference sheet); the rest top-left. */
  logo: "top" | "bottom";
  /** Colour theme (brand/tokens.ts THEMES): the post's override, else its series' theme. */
  theme: ThemeName;
};

/** A post's colour theme: its own `theme`, else its series' (SERIES_THEME). */
export const themeFor = (post: Pick<Post, "theme" | "series">): ThemeName => post.theme ?? SERIES_THEME[post.series];

/** Templates whose design direction puts the logo bottom-right. */
const LOGO_BOTTOM: readonly TemplateCode[] = ["TECH-01"];

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
    logo: LOGO_BOTTOM.includes(post.visualTemplate) ? "bottom" : "top",
    theme: themeFor(post),
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

/** Logo-reveal slides (`"logo": "full" | "mark"`): the logo on a white panel above the text. */
export const REVEAL = {
  /** Height of the panel, per output size. */
  height: { feed: 520, square: 280, story: 760 } satisfies Record<SlideSize, number>,
  pad: 56,
  radius: 32,
  /** Height / width of assets/brand/logo.svg and mark.svg, from their viewBoxes. */
  ratio: { full: 701 / 720, mark: 1 },
} as const;

/** Photo-led slides (JOURNEY-01, LOCAL-01): a full-bleed photo with the text low on the slide. */
export const PHOTO = {
  /** The text may take at most this share of the content area, so the photo shows. */
  textShare: 0.5,
  /** Headline cap on photo slides (the photo is the hero), per output size. */
  titleMax: { feed: 80, square: 68, story: 88 } satisfies Record<SlideSize, number>,
} as const;

/** A badge at the top of the content area ("ILLUSTRATIVE CONCEPT" on LOCAL-01). */
export const BADGE = { height: 46, gap: 28, size: 22 } as const;

/** A section label above a headline ("THE PROBLEM"), set in mono. */
export const LABEL = { size: 30, lineHeight: 1.2, height: 36 } as const;

/** Diagrams (TECH-01, CODE-01): boxes, arrows, labels, comparison columns. */
export const DIAGRAM = {
  /** Box label size: this fraction of the headline, within [min, max]. */
  labelRatio: 0.36,
  labelMin: 28,
  labelMax: 40,
  lineHeight: 1.25,
  /** Notes and column items, as a fraction of the label size. */
  noteRatio: 0.8,
  noteMin: 24,
  pad: 26,
  radius: 22,
  /** Space between a box's label and its note. */
  noteGap: 8,
  /** Arrow length between boxes (row) or between rows (column). */
  arrow: 72,
  arrowColumn: 44,
  /** Vertical padding of boxes in a column flow, kept tight so long flows stay short. */
  padColumn: 16,
  /** Arrow labels ("API"), in mono. */
  viaSize: 24,
  columnGap: 28,
  itemGap: 14,
  /** Column item marker column. */
  itemIndent: 28,
} as const;

/** Code panels (CODE-01): an editor window with a tab, line numbers and highlighted code. */
export const CODE = {
  max: 34,
  /** Smallest code size that still reads on a phone; longer lines mean the snippet must shrink. */
  min: 22,
  lineHeight: 1.55,
  tab: 64,
  padX: 32,
  padY: 26,
  /** Mono advance width in em (JetBrains Mono: every glyph is 0.6 em). */
  charEm: 0.6,
} as const;

export type FlowBox = {
  label: Block;
  note: Block | null;
  via: string | null;
  width: number;
  height: number;
  /** Vertical padding. */
  padY: number;
};
export type DiagramModel =
  | { type: "flow"; direction: "row" | "column"; boxes: FlowBox[]; arrow: number; width: number; height: number }
  | {
      type: "columns";
      columns: { heading: Block; items: Block[]; width: number; height: number }[];
      width: number;
      height: number;
    };

export type CodeModel = {
  filename: string | null;
  lines: Token[][];
  /** 1-based lines to highlight. */
  highlight: number[];
  fontSize: number;
  /** Width of the line-number gutter in characters. */
  gutter: number;
  width: number;
  height: number;
};

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
  /** Fixed badge above the content (LOCAL-01: "Illustrative concept"). */
  badge: string | null;
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
export type DiagramSlide = SlideFrame & Common & { kind: "diagram"; diagram: DiagramModel; text: Text };
export type CodeSlide = SlideFrame & Common & { kind: "code"; code: CodeModel; text: Text };
/** A full-bleed photo covering the slide (centre-cropped); null when the file is missing. */
export type Photo = { src: string; width: number; height: number; left: number; top: number };
export type PhotoSlide = SlideFrame & Common & { kind: "photo"; photo: Photo | null; asset: string; text: Text };
export type LogoWhich = keyof typeof REVEAL.ratio;
export type LogoSlide = SlideFrame &
  Common & { kind: "logo"; reveal: { which: LogoWhich; width: number; height: number }; panel: Box; text: Text };
export type SlideModel =
  | StatementSlide
  | SignSlide
  | ServiceSlide
  | DeviceSlide
  | DiagramSlide
  | CodeSlide
  | PhotoSlide
  | LogoSlide;

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
  | { kind: "device"; asset: string; media: Media | null; label?: string; title?: string; supporting?: string }
  | { kind: "diagram"; diagram: Diagram }
  | { kind: "code"; code: Code }
  | { kind: "photo"; asset: string; media: Media | null }
  | { kind: "logo"; which: LogoWhich };

/** Scales `media` to cover a `width` x `height` slide, centred. */
export function coverPhoto(media: Media, width: number, height: number): Photo {
  const scale = Math.max(width / media.width, height / media.height);
  const w = Math.round(media.width * scale);
  const h = Math.round(media.height * scale);
  return { src: media.src, width: w, height: h, left: Math.round((width - w) / 2), top: Math.round((height - h) / 2) };
}

const clamp = (v: number, lo: number, hi: number) => Math.round(Math.min(hi, Math.max(lo, v)));

/** Lays out a flow or comparison at the given headline size; null if a word won't fit a box. */
function layoutDiagram(ctx: Ctx, diagram: Diagram, width: number): DiagramModel | null {
  const L = clamp(ctx.titleSize * DIAGRAM.labelRatio, DIAGRAM.labelMin, DIAGRAM.labelMax);
  const N = Math.max(DIAGRAM.noteMin, Math.round(L * DIAGRAM.noteRatio));
  const inner = (w: number) => w - 2 * DIAGRAM.pad;

  if (diagram.type === "columns") {
    const n = diagram.columns.length;
    const w = Math.floor((width - (n - 1) * DIAGRAM.columnGap) / n);
    const columns = [];
    for (const c of diagram.columns) {
      const heading = block(ctx, c.heading, inner(w), L, DIAGRAM.lineHeight, ctx.m.title);
      if (!heading) return null;
      const items: Block[] = [];
      for (const item of c.items) {
        const b = block(ctx, item, inner(w) - DIAGRAM.itemIndent, N, DIAGRAM.lineHeight, ctx.m.body);
        if (!b) return null;
        items.push(b);
      }
      const h =
        2 * DIAGRAM.pad +
        blockHeight(heading) +
        DIAGRAM.itemGap * 1.5 +
        items.reduce((sum, b) => sum + blockHeight(b), 0) +
        (items.length - 1) * DIAGRAM.itemGap;
      columns.push({ heading, items, width: w, height: Math.ceil(h) });
    }
    const height = Math.max(...columns.map((c) => c.height));
    return { type: "columns", columns: columns.map((c) => ({ ...c, height })), width, height };
  }

  const n = diagram.steps.length;
  const direction = diagram.direction ?? (n <= 3 ? "row" : "column");
  const viaWidth = Math.max(0, ...diagram.steps.map((s) => (s.via ? s.via.length * DIAGRAM.viaSize * CODE.charEm : 0)));
  const arrow = direction === "row" ? Math.max(DIAGRAM.arrow, Math.ceil(viaWidth + 24)) : DIAGRAM.arrowColumn;
  const w = direction === "row" ? Math.floor((width - (n - 1) * arrow) / n) : width;
  const boxes: FlowBox[] = [];
  for (const step of diagram.steps) {
    const label = block(ctx, step.label, inner(w), L, DIAGRAM.lineHeight, ctx.m.strong);
    if (!label) return null;
    const note = step.note ? block(ctx, step.note, inner(w), N, DIAGRAM.lineHeight, ctx.m.body) : null;
    if (step.note && !note) return null;
    const padY = direction === "row" ? DIAGRAM.pad : DIAGRAM.padColumn;
    const h = 2 * padY + blockHeight(label) + (note ? DIAGRAM.noteGap + blockHeight(note) : 0);
    boxes.push({ label, note, via: step.via ?? null, width: w, height: Math.ceil(h), padY });
  }
  if (direction === "row") {
    const height = Math.max(...boxes.map((b) => b.height));
    return { type: "flow", direction, boxes: boxes.map((b) => ({ ...b, height })), arrow, width, height };
  }
  const height = boxes.reduce((sum, b) => sum + b.height, 0) + (n - 1) * arrow;
  return { type: "flow", direction, boxes, arrow, width, height };
}

/** Sizes the code to fit the panel width; null if it would have to go below `CODE.min`. */
function layoutCode(ctx: Ctx, code: Code, width: number): CodeModel | null {
  const lines = highlightLines(code.source, code.language);
  const longest = Math.max(1, ...lines.map((l) => l.reduce((n, t) => n + t.text.length, 0)));
  const gutter = String(lines.length).length + 2;
  const fit = Math.floor((width - 2 * CODE.padX) / ((longest + gutter) * CODE.charEm));
  const fontSize = Math.min(CODE.max, fit);
  if (fontSize < CODE.min && !ctx.lenient) return null;
  const size = Math.max(fontSize, ctx.lenient ? CODE.min : fontSize);
  const height = CODE.tab + 2 * CODE.padY + lines.length * size * CODE.lineHeight;
  return {
    filename: code.filename ?? null,
    lines,
    highlight: code.highlight ?? [],
    fontSize: size,
    gutter,
    width,
    height: Math.ceil(height),
  };
}

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
type Chrome = { height: number; grid: Common["grid"]; badge: string | null };

function layoutSlide(ctx: Ctx, kind: Kind, bottom: Chrome): Laid | null {
  const { post, index, size, titleSize } = ctx;
  const slide = post.slides[index]!;
  const frame = slideFrame(post, index, size);
  const box = contentBox(size);
  const gap = titleSize * TYPE.gap;

  const cta = frame.isLast
    ? block(ctx, post.cta, box.width - TYPE.ctaIndent, TYPE.ctaSize, TYPE.ctaLineHeight, ctx.m.strong)
    : null;
  if (frame.isLast && !cta) return null;
  const reserved =
    (cta ? TYPE.ctaGap + blockHeight(cta) : 0) + bottom.height + (bottom.badge ? BADGE.height + BADGE.gap : 0);
  const fits = (height: number) => ctx.lenient || height + reserved <= box.height;
  const common = { cta, grid: bottom.grid, badge: bottom.badge };

  if (kind.kind === "photo") {
    const capped = { ...ctx, titleSize: Math.min(titleSize, PHOTO.titleMax[size]) };
    const text = layoutText(capped, slide.title, supportingOf(slide), slide.items ?? []);
    if (!text) return null;
    const h = textHeight(text);
    if (!ctx.lenient && (h > box.height * PHOTO.textShare || !fits(h))) return null;
    const photo = kind.media ? coverPhoto(kind.media, frame.width, frame.height) : null;
    // Photo text sits on a dark scrim over the photo, whatever the series' theme.
    return { ...frame, ...common, theme: "navy", kind: "photo", photo, asset: kind.asset, text };
  }

  if (kind.kind === "logo") {
    const text = layoutText(ctx, slide.title, supportingOf(slide), slide.items ?? []);
    const h = REVEAL.height[size];
    if (!text || !fits(h + gap + textHeight(text))) return null;
    const ratio = REVEAL.ratio[kind.which];
    const width = Math.min(Math.round((h - 2 * REVEAL.pad) / ratio), box.width - 2 * REVEAL.pad);
    const reveal = { which: kind.which, width, height: Math.round(width * ratio) };
    return { ...frame, ...common, kind: "logo", reveal, panel: { width: box.width, height: h }, text };
  }

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

  if (kind.kind === "diagram" || kind.kind === "code") {
    const text = layoutText(ctx, slide.title, supportingOf(slide), slide.items ?? []);
    if (!text) return null;
    if (kind.kind === "diagram") {
      const diagram = layoutDiagram(ctx, kind.diagram, box.width);
      if (!diagram || !fits(textHeight(text) + gap + diagram.height)) return null;
      return { ...frame, ...common, kind: "diagram", diagram, text };
    }
    const code = layoutCode(ctx, kind.code, box.width);
    if (!code || !fits(textHeight(text) + gap + code.height)) return null;
    return { ...frame, ...common, kind: "code", code, text };
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
 * overflow are drawn anyway and flagged. A slide with `logo` is a logo reveal in every template.
 */
function fitCarousel(
  post: Post,
  size: SlideSize,
  m: Measures,
  kindOf: (slide: Slide) => Kind,
  bottom: (slide: Slide) => Chrome,
): SlideModel[] {
  const at = (titleSize: number, i: number, lenient = false) =>
    layoutSlide({ post, index: i, size, titleSize, m, lenient }, kindFor(post.slides[i]!), bottom(post.slides[i]!));
  const kindFor = (slide: Slide): Kind => (slide.logo ? { kind: "logo", which: slide.logo } : kindOf(slide));
  for (let t = TYPE.titleMax[size]; t >= TYPE.titleMin; t -= 2) {
    const slides = post.slides.map((_, i) => at(t, i));
    if (slides.every((s) => s !== null)) return slides.map((s) => ({ ...s!, overflow: false }) as SlideModel);
  }
  return post.slides.map((_, i) => {
    const fit = at(TYPE.titleMin, i);
    return { ...(fit ?? at(TYPE.titleMin, i, true)!), overflow: !fit } as SlideModel;
  });
}

const noBottom = (): Chrome => ({ height: 0, grid: null, badge: null });

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
    listsServices
      ? { height: BRAND.gridGap + BRAND.gridHeight, grid: { active: serviceOf(slide.title) }, badge: null }
      : noBottom(),
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

// TECH-01 and CODE-01: a question headline, diagrams from box/arrow/label primitives, code as text.

/** Slides with a `diagram` or `code` show it; the rest are statements. */
export function visualKind(slide: Slide): Kind {
  if (slide.diagram) return { kind: "diagram", diagram: slide.diagram };
  if (slide.code) return { kind: "code", code: slide.code };
  return { kind: "statement" };
}

export function techModel(post: Post, size: SlideSize, m: Measures): SlideModel[] {
  return fitCarousel(post, size, m, visualKind, noBottom);
}

// JOURNEY-01 and LOCAL-01: photo-led, a light text overlay on a gradient. -------------------------

/** JOURNEY-01: a real photo (assets/photos/) behind the text; without an `asset`, a statement. */
export function journeyModel(
  post: Post,
  size: SlideSize,
  m: Measures,
  media: ReadonlyMap<string, Media | null>,
): SlideModel[] {
  return fitCarousel(
    post,
    size,
    m,
    (slide) => (slide.asset ? { kind: "photo", asset: slide.asset, media: media.get(slide.asset) ?? null } : { kind: "statement" }),
    noBottom,
  );
}

/** Shown on every LOCAL-01 slide: these are "What if…" concepts, never a real client. */
export const ILLUSTRATIVE = "Illustrative concept";

/**
 * LOCAL-01: "What if…" framing. Photo slides, before/after frames (a `columns` diagram), numbered
 * ideas (BIZ-01's sign layout) and statements, every one badged as an illustrative concept.
 */
export function localModel(
  post: Post,
  size: SlideSize,
  m: Measures,
  media: ReadonlyMap<string, Media | null>,
): SlideModel[] {
  return fitCarousel(
    post,
    size,
    m,
    (slide) => {
      if (slide.asset) return { kind: "photo", asset: slide.asset, media: media.get(slide.asset) ?? null };
      if (slide.diagram || slide.code) return visualKind(slide);
      return bizKind(slide);
    },
    () => ({ height: 0, grid: null, badge: ILLUSTRATIVE }),
  );
}
