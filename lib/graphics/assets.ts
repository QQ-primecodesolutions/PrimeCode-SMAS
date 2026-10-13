/**
 * Fonts and the logo, read from disk once per process (as the football platform's
 * lib/graphics/assets.ts does). A failed load clears the cache so the next call retries.
 */
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { FONTS } from "@/brand/tokens";
import { imageSize, type Media } from "./images";
import { fontMetrics, measurer, type Measure } from "./metrics";

type Weight = 400 | 600 | 700 | 800;
type FontOption = { name: string; data: Buffer; weight: Weight; style: "normal" };

const FILES = [
  [FONTS.sans, "Inter-Regular", 400],
  [FONTS.sans, "Inter-SemiBold", 600],
  [FONTS.sans, "Inter-Bold", 700],
  [FONTS.sans, "Inter-ExtraBold", 800],
  [FONTS.mono, "JetBrainsMono-Regular", 400],
  [FONTS.mono, "JetBrainsMono-SemiBold", 600],
] as const;

export type FontKey = `${(typeof FILES)[number][0]}/${(typeof FILES)[number][2]}`;

export type SlideLogo = { symbol: string; reversed: string };

export type SlideAssets = {
  fonts: FontOption[];
  /** Width measurer for a font, with letter-spacing in em. */
  measure: (font: FontKey, letterSpacing?: number) => Measure;
  /** The logo symbol as data URIs: full colour, and reversed for the navy tile. */
  logo: SlideLogo;
};

let assets: Promise<SlideAssets> | null = null;

// Paths are spelled out under assets/ so the build traces only those folders, not the whole project.

export function loadSlideAssets(): Promise<SlideAssets> {
  assets ??= (async (): Promise<SlideAssets> => {
    const fonts = await Promise.all(
      FILES.map(async ([name, file, weight]) => ({
        name,
        data: await readFile(join(process.cwd(), "assets", "fonts", `${file}.ttf`)),
        weight,
        style: "normal" as const,
      })),
    );
    const metrics = new Map(fonts.map((f) => [`${f.name}/${f.weight}`, fontMetrics(f.data)]));
    const svg = (data: Buffer) => `data:image/svg+xml;base64,${data.toString("base64")}`;
    const logo = {
      symbol: svg(await readFile(join(process.cwd(), "assets", "brand", "symbol.svg"))),
      reversed: svg(await readFile(join(process.cwd(), "assets", "brand", "symbol-reversed.svg"))),
    };
    return {
      fonts,
      logo,
      measure: (font, letterSpacing = 0) => {
        const em = metrics.get(font);
        if (!em) throw new Error(`No font loaded for ${font}`);
        return measurer(em, letterSpacing);
      },
    };
  })().catch((e: unknown) => {
    assets = null;
    throw e;
  });
  return assets;
}

const ASSETS = resolve(process.cwd(), "assets");
const MAX_BYTES = 8_000_000;

/**
 * A slide's `asset` (a path under assets/, e.g. "shots/bz-home.png") as a data URI with its size.
 * Null when the file is missing; throws on anything that isn't a PNG or JPEG under assets/. Not
 * cached, so a newly added screenshot shows up on the next render.
 */
export async function loadMedia(asset: string): Promise<Media | null> {
  const path = resolve(ASSETS, asset);
  if (!path.startsWith(ASSETS + sep)) throw new Error(`Asset ${asset} is outside assets/`);
  let data: Buffer;
  try {
    data = await readFile(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
  if (data.length > MAX_BYTES) throw new Error(`Asset ${asset} is over ${MAX_BYTES / 1e6} MB; resize it`);
  const size = imageSize(data);
  if (!size) throw new Error(`Asset ${asset} isn't a PNG or JPEG`);
  return { src: `data:image/${size.type};base64,${data.toString("base64")}`, width: size.width, height: size.height };
}
