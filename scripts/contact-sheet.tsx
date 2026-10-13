/**
 * A contact sheet for reviewing the colour themes: each theme's slide 1 and an inner slide, in the
 * feed size, plus the two logo treatments on light themes. Writes out/contact-sheet.png.
 *
 *   pnpm contact-sheet
 *
 * Renders drafts too (it's a review aid, not an export), so nothing here is publish-ready.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { THEMES, type ThemeName } from "@/brand/tokens";
import { loadSlideAssets } from "@/lib/graphics/assets";
import { renderSlide } from "@/lib/graphics/render";
import { loadPost } from "@/lib/post/load";

type Tile = { theme: ThemeName; post: string; slide: number; note?: string; logoTile?: "white" | "navy" | "none" };

const ROWS: { title: string; tiles: Tile[] }[] = [
  {
    title: "navy · Behind the Code, Journey, PC-001  |  sky · PrimeCode Explains",
    tiles: [
      { theme: "navy", post: "PC-2026-001", slide: 1 },
      { theme: "navy", post: "PC-2026-001", slide: 5 },
      { theme: "sky", post: "PC-2026-007", slide: 1 },
      { theme: "sky", post: "PC-2026-007", slide: 2 },
    ],
  },
  {
    title: "paper · Tech for Business  |  blue · Build With PrimeCode, Services",
    tiles: [
      { theme: "paper", post: "PC-2026-003", slide: 1 },
      { theme: "paper", post: "PC-2026-003", slide: 4 },
      { theme: "blue", post: "PC-2026-002", slide: 1 },
      { theme: "blue", post: "PC-2026-002", slide: 3 },
    ],
  },
  {
    title: "violet · PrimeCode Insight  |  teal · seasonal greetings",
    tiles: [
      { theme: "violet", post: "PC-2026-005", slide: 1 },
      { theme: "violet", post: "PC-2026-010", slide: 6, note: "a flow on violet" },
      { theme: "teal", post: "PC-2026-025", slide: 1 },
      { theme: "teal", post: "PC-2026-026", slide: 1 },
    ],
  },
  {
    title: "sandstone · Digital Transformation in Qwaqwa  |  blue · PROJECT-01 device stage",
    tiles: [
      { theme: "sandstone", post: "PC-2026-011", slide: 2 },
      { theme: "sandstone", post: "PC-2026-011", slide: 3 },
      { theme: "blue", post: "PC-2026-012", slide: 1, note: "placeholder shot" },
      { theme: "blue", post: "PC-2026-012", slide: 4, note: "placeholder shot" },
    ],
  },
  {
    title: "Logo on light themes: navy tile (current) vs bare",
    tiles: [
      { theme: "sky", post: "PC-2026-007", slide: 1, note: "navy tile" },
      { theme: "sky", post: "PC-2026-007", slide: 1, logoTile: "none", note: "bare" },
      { theme: "sandstone", post: "PC-2026-011", slide: 2, note: "navy tile" },
      { theme: "sandstone", post: "PC-2026-011", slide: 2, logoTile: "none", note: "bare" },
    ],
  },
];

const TILE_W = 300;
const TILE_H = 375;
const GAP = 24;
const PAD = 40;
const ROW_TITLE = 56;

async function tile(t: Tile): Promise<string> {
  const post = await loadPost(t.post);
  if (!post) throw new Error(`No post ${t.post}`);
  const theme = THEMES[t.theme] as { logoTile: "white" | "navy" | "none" };
  const original = theme.logoTile;
  // Review only: try the other logo treatment on this theme for one render.
  if (t.logoTile) theme.logoTile = t.logoTile;
  try {
    const png = await renderSlide({ ...post, theme: t.theme }, t.slide - 1, "feed");
    if (!png) throw new Error(`${t.post} has no slide ${t.slide}`);
    return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
  } finally {
    theme.logoTile = original;
  }
}

const rows = [];
// One at a time: `tile` briefly changes a theme's logo treatment, so renders mustn't overlap.
for (const row of ROWS) {
  const images: string[] = [];
  for (const t of row.tiles) images.push(await tile(t));
  rows.push({ ...row, images });
}

const width = PAD * 2 + 4 * TILE_W + 3 * GAP;
const height = PAD * 2 + 70 + rows.length * (ROW_TITLE + TILE_H + 40 + GAP);
const { fonts } = await loadSlideAssets();

const sheet = (
  <div style={{ display: "flex", flexDirection: "column", width, height, padding: PAD, background: "#ffffff", fontFamily: "Inter", color: "#0f172a" }}>
    <div style={{ display: "flex", fontSize: 34, fontWeight: 800, height: 70 }}>PrimeCode Studio · colour themes (feed 1080×1350)</div>
    {rows.map((row, r) => (
      <div key={r} style={{ display: "flex", flexDirection: "column", marginBottom: GAP }}>
        <div style={{ display: "flex", height: ROW_TITLE, alignItems: "flex-end", paddingBottom: 12, fontSize: 22, fontWeight: 600 }}>
          {row.title}
        </div>
        <div style={{ display: "flex" }}>
          {row.images.map((src, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", marginLeft: i === 0 ? 0 : GAP }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
              <img src={src} alt="" width={TILE_W} height={TILE_H} style={{ borderRadius: 10 }} />
              <div style={{ display: "flex", width: TILE_W, height: 40, alignItems: "center", overflow: "hidden", fontSize: 17, color: "#475569" }}>
                {`${row.tiles[i]!.theme} · ${row.tiles[i]!.post.slice(-3)}/${row.tiles[i]!.slide}${row.tiles[i]!.note ? ` · ${row.tiles[i]!.note}` : ""}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

await mkdir("out", { recursive: true });
const png = Buffer.from(await new ImageResponse(sheet, { width, height, fonts }).arrayBuffer());
await writeFile("out/contact-sheet.png", png);
console.log(`out/contact-sheet.png (${width}×${height})`);
