/**
 * Renders the logo SVGs for review through the same engine as the slides (Satori + resvg):
 * the full logo at 512 px, the mark at 128, the compact symbol at a true 32 px (and enlarged ×4), and
 * on the slide tile over navy and light themes, full colour and reversed. Writes out/logo-review.png.
 *
 *   npx tsx scripts/brand/review-logo.tsx
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { loadSlideAssets } from "@/lib/graphics/assets";

const svg = async (name: string) =>
  `data:image/svg+xml;base64,${(await readFile(`assets/brand/${name}`)).toString("base64")}`;
const [logo, mark, symbol, reversed] = (await Promise.all(
  ["logo.svg", "mark.svg", "symbol.svg", "symbol-reversed.svg"].map(svg),
)) as [string, string, string, string];
const favicon = symbol;
const { fonts } = await loadSlideAssets();
// The logo's real proportions, from its viewBox.
const [, , vbW, vbH] = (/viewBox="([^"]+)"/.exec(await readFile("assets/brand/logo.svg", "utf8"))![1]!).split(" ").map(Number);
const logoH = Math.round((512 * vbH!) / vbW!);

async function png(el: React.ReactElement, w: number, h: number): Promise<string> {
  const buf = Buffer.from(await new ImageResponse(el, { width: w, height: h, fonts }).arrayBuffer());
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// A true 32 px render, to show at ×4.
const fav32 = await png(
  // eslint-disable-next-line @next/next/no-img-element -- Satori
  <div style={{ display: "flex", width: 32, height: 32, background: "#ffffff" }}><img src={favicon} alt="" width={32} height={32} /></div>,
  32,
  32,
);

const label = (text: string) => (
  <div style={{ display: "flex", fontSize: 18, color: "#475569", marginTop: 10 }}>{text}</div>
);
const Tile = ({ src, bg, tile }: { src: string; bg: string; tile: string }) => (
  <div style={{ display: "flex", width: 220, height: 180, background: bg, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", width: 112, height: 112, padding: 11, borderRadius: 25, background: tile }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
      <img src={src} alt="" width={90} height={90} />
    </div>
  </div>
);

const W = 1400;
const H = 1000;
const sheet = (
  <div style={{ display: "flex", flexDirection: "column", width: W, height: H, padding: 40, background: "#ffffff", fontFamily: "Inter", color: "#0f172a" }}>
    <div style={{ display: "flex", fontSize: 30, fontWeight: 800, marginBottom: 24 }}>PrimeCode logo · Mont-aux-Sources skyline with the prime, for review</div>
    <div style={{ display: "flex" }}>
      <div style={{ display: "flex", flexDirection: "column", marginRight: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
        <img src={logo} alt="" width={512} height={logoH} style={{ border: "1px solid #e2e8f0" }} />
        {label("logo.svg at 512 px")}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", marginRight: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
            <img src={mark} alt="" width={128} height={128} style={{ border: "1px solid #e2e8f0" }} />
            {label("mark.svg 128")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginRight: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
            <img src={symbol} alt="" width={128} height={128} style={{ border: "1px solid #e2e8f0" }} />
            {label("symbol.svg 128")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginRight: 30 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
            <img src={fav32} alt="" width={32} height={32} style={{ border: "1px solid #e2e8f0" }} />
            {label("favicon 32")}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
            <img src={fav32} alt="" width={128} height={128} style={{ border: "1px solid #e2e8f0" }} />
            {label("the 32 px render ×4")}
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", marginRight: 24 }}>
            <Tile src={symbol} bg="#0f172a" tile="#ffffff" />
            {label("slide tile: white on navy")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginRight: 24 }}>
            <Tile src={reversed} bg="#e0f2fe" tile="#0f3b6e" />
            {label("light themes: navy tile")}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Tile src={symbol} bg="#e0f2fe" tile="rgba(0,0,0,0)" />
            {label("light themes: bare")}
          </div>
        </div>
      </div>
    </div>
  </div>
);

await mkdir("out", { recursive: true });
await writeFile("out/logo-review.png", Buffer.from(await new ImageResponse(sheet, { width: W, height: H, fonts }).arrayBuffer()));
console.log("out/logo-review.png");
