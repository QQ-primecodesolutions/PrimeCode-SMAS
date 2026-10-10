/**
 * Fonts and the logo, read from disk once per process (as the football platform's
 * lib/graphics/assets.ts does). A failed load clears the cache so the next call retries.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FONTS, LOGO } from "@/brand/tokens";
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

export type SlideAssets = {
  fonts: FontOption[];
  /** Width measurer for a font, with letter-spacing in em. */
  measure: (font: FontKey, letterSpacing?: number) => Measure;
  /** The full logo as a data URI. */
  logo: string;
};

let assets: Promise<SlideAssets> | null = null;

const read = (path: string) => readFile(join(process.cwd(), path));

export function loadSlideAssets(): Promise<SlideAssets> {
  assets ??= (async (): Promise<SlideAssets> => {
    const fonts = await Promise.all(
      FILES.map(async ([name, file, weight]) => ({
        name,
        data: await read(`assets/fonts/${file}.ttf`),
        weight,
        style: "normal" as const,
      })),
    );
    const metrics = new Map(fonts.map((f) => [`${f.name}/${f.weight}`, fontMetrics(f.data)]));
    const logo = `data:image/png;base64,${(await read(LOGO.path)).toString("base64")}`;
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
