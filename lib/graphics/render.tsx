/**
 * Post + slide → PNG bytes: view model → template JSX → `ImageResponse` (Satori + resvg).
 * Deliberately free of `next/cache` and request APIs, so scripts/export.ts can import it directly.
 */
import { createHash } from "node:crypto";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { FONTS } from "@/brand/tokens";
import type { Post, TemplateCode } from "@/lib/post/schema";
import { type SlideAssets, loadMedia, loadSlideAssets } from "./assets";
import type { Media } from "./images";
import {
  bizModel,
  brandModel,
  insightModel,
  type Measures,
  projectModel,
  type SlideModel,
  TYPE,
  techModel,
} from "./model";
import { SLIDE_SIZES, type SlideSize } from "./sizes";
import { SlideCanvas } from "./templates/slide";

export type SlideView = {
  element: ReactElement;
  /** Problems a person should fix in the copy (e.g. text that doesn't fit). */
  warnings: string[];
  /** Asset files the slide needs that don't exist yet (it shows a placeholder). Blocks export. */
  missing: string[];
};

type Template = (post: Post, size: SlideSize, assets: SlideAssets) => Promise<SlideView[]>;

const measures = (a: SlideAssets): Measures => ({
  title: a.measure(`${FONTS.sans}/800`, TYPE.titleTracking),
  body: a.measure(`${FONTS.sans}/400`),
  strong: a.measure(`${FONTS.sans}/600`),
});

const views = (models: SlideModel[], assets: SlideAssets): SlideView[] =>
  models.map((model) => {
    const missing = model.kind === "device" && !model.device.image ? [model.device.asset] : [];
    return {
      element: <SlideCanvas model={model} logo={assets.logo} />,
      warnings: [
        ...(model.overflow ? [`Slide ${model.index + 1}: text doesn't fit at the smallest size; shorten it.`] : []),
        ...missing.map((a) => `Slide ${model.index + 1}: assets/${a} is missing (showing a placeholder).`),
      ],
      missing,
    };
  });

/** Every slide's image, read from assets/ (null where the file doesn't exist yet). */
async function loadSlideMedia(post: Post): Promise<Map<string, Media | null>> {
  const paths = [...new Set(post.slides.flatMap((s) => (s.asset ? [s.asset] : [])))];
  return new Map(await Promise.all(paths.map(async (p) => [p, await loadMedia(p)] as const)));
}

/** Built templates. The rest arrive milestone by milestone (see CLAUDE.md). */
const TEMPLATES: Partial<Record<TemplateCode, Template>> = {
  "INSIGHT-01": async (post, size, assets) => views(insightModel(post, size, measures(assets)), assets),
  "BIZ-01": async (post, size, assets) => views(bizModel(post, size, measures(assets)), assets),
  "BRAND-01": async (post, size, assets) => views(brandModel(post, size, measures(assets)), assets),
  "TECH-01": async (post, size, assets) => views(techModel(post, size, measures(assets)), assets),
  "CODE-01": async (post, size, assets) => views(techModel(post, size, measures(assets)), assets),
  "PROJECT-01": async (post, size, assets) =>
    views(projectModel(post, size, measures(assets), await loadSlideMedia(post)), assets),
};

/** Changes whenever this module (or a template it imports) is reloaded, e.g. after an edit in dev. */
const RENDER_VERSION = Date.now().toString(36);

/** Cache-busting token for preview URLs: changes when the post or the rendering code changes. */
export function renderToken(post: Post): string {
  return createHash("sha256").update(JSON.stringify(post)).update(RENDER_VERSION).digest("hex").slice(0, 12);
}

export const isTemplateBuilt = (code: TemplateCode) => code in TEMPLATES;

export class TemplateNotBuiltError extends Error {
  override name = "TemplateNotBuiltError";
  constructor(code: TemplateCode) {
    super(`Template ${code} isn't built yet`);
  }
}

/** Every slide's JSX for a post at one size. */
export async function slideViews(post: Post, size: SlideSize): Promise<SlideView[]> {
  const template = TEMPLATES[post.visualTemplate];
  if (!template) throw new TemplateNotBuiltError(post.visualTemplate);
  return template(post, size, await loadSlideAssets());
}

export async function toPng(element: ReactElement, size: SlideSize): Promise<Uint8Array> {
  const { fonts } = await loadSlideAssets();
  const res = new ImageResponse(element, { ...SLIDE_SIZES[size], fonts });
  return new Uint8Array(await res.arrayBuffer());
}

/** One slide (0-based index) as PNG bytes, or null when the post has no such slide. */
export async function renderSlide(post: Post, index: number, size: SlideSize): Promise<Uint8Array | null> {
  const view = (await slideViews(post, size))[index];
  return view ? toPng(view.element, size) : null;
}
