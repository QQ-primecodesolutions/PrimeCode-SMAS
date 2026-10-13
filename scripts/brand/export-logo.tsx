/**
 * Exports PNGs of the logo for places that can't take SVG (social profiles, documents, favicons).
 * Rendered from the SVGs in assets/brand/ through Satori + resvg. Writes assets/brand/export/.
 *
 *   npx tsx scripts/brand/export-logo.tsx
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { COLORS } from "@/brand/tokens";

const OUT = "assets/brand/export";

async function svg(name: string): Promise<{ src: string; ratio: number }> {
  const text = await readFile(`assets/brand/${name}`, "utf8");
  const [, , w, h] = /viewBox="([^"]+)"/.exec(text)![1]!.split(" ").map(Number);
  return { src: `data:image/svg+xml;base64,${Buffer.from(text).toString("base64")}`, ratio: h! / w! };
}

/** `name` rendered `width` px wide (height from its proportions), on `bg` or transparent. */
async function exportPng(file: string, name: string, width: number, opts: { bg?: string; pad?: number; radius?: number } = {}) {
  const { src, ratio } = await svg(name);
  const pad = Math.round(width * (opts.pad ?? 0));
  const inner = width - 2 * pad;
  const height = Math.round(inner * ratio) + 2 * pad;
  const el = (
    <div
      style={{
        display: "flex",
        width,
        height,
        padding: pad,
        ...(opts.bg ? { background: opts.bg } : {}),
        ...(opts.radius ? { borderRadius: Math.round(width * opts.radius) } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
      <img src={src} alt="" width={inner} height={Math.round(inner * ratio)} />
    </div>
  );
  await writeFile(`${OUT}/${file}`, Buffer.from(await new ImageResponse(el, { width, height }).arrayBuffer()));
  console.log(`${OUT}/${file} (${width}×${height})`);
}

await mkdir(OUT, { recursive: true });
// The full logo and the mark, transparent and on white.
await exportPng("logo-1024.png", "logo.svg", 1024);
await exportPng("logo-1024-white.png", "logo.svg", 1024, { bg: COLORS.white, pad: 0.06 });
await exportPng("mark-512.png", "mark.svg", 512);
// Square profile pictures (Facebook, Instagram crop them to circles: keep a generous margin).
await exportPng("profile-1080.png", "mark.svg", 1080, { bg: COLORS.white, pad: 0.12 });
await exportPng("profile-1080-navy.png", "symbol-reversed.svg", 1080, { bg: COLORS.logoNavy, pad: 0.2 });
// The compact symbol, and favicons / app icons.
await exportPng("symbol-512.png", "symbol.svg", 512);
await exportPng("favicon-32.png", "symbol.svg", 32, { bg: COLORS.white, pad: 0.04 });
await exportPng("apple-touch-icon-180.png", "symbol.svg", 180, { bg: COLORS.white, pad: 0.1 });
await exportPng("icon-512.png", "symbol.svg", 512, { bg: COLORS.white, pad: 0.1 });
