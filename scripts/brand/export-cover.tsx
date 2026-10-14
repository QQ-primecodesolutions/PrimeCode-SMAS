/**
 * Exports the Facebook page cover with the new logo. Writes assets/brand/export/cover-facebook.png.
 *
 * 1640×624 is Facebook's recommended upload. Desktop shows all of it (at 820×312), but phones crop
 * the sides to about 16:9, so everything sits in the centre 1100 px. The profile picture overlaps
 * the bottom-left on desktop, so that corner stays empty.
 *
 *   npx tsx scripts/brand/export-cover.tsx
 */
import { writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { COLORS, FONTS } from "@/brand/tokens";
import { loadSlideAssets } from "@/lib/graphics/assets";

const W = 1640;
const H = 624;
const OUT = "assets/brand/export/cover-facebook.png";

const { fonts, logo } = await loadSlideAssets();

// The Amphitheatre wall from the logo, stretched along the bottom as a faint horizon.
const WALL = "M14 200 L26 178 L32 78 L38 70 L84 66 L90 72 L92 150 L144 150 L146 70 L152 64 L168 62 L174 68 L176 96 L188 96 L190 38 L196 30 L210 30 L216 38 L220 170 L226 200 Z";
const horizon = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 30 212 170" preserveAspectRatio="none"><path d="${WALL}" fill="${COLORS.white}"/></svg>`,
).toString("base64")}`;

const TILE = 104;

const el = (
  <div
    style={{
      display: "flex",
      width: W,
      height: H,
      position: "relative",
      backgroundImage: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.logoNavy} 100%)`,
      fontFamily: FONTS.sans,
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
    <img src={horizon} alt="" width={W} height={260} style={{ position: "absolute", left: 0, bottom: 0, opacity: 0.06 }} />
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: W,
        height: H,
      }}
    >
      <div
        style={{
          display: "flex",
          width: TILE,
          height: TILE,
          borderRadius: 24,
          background: COLORS.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori */}
        <img src={logo.symbol} alt="" width={TILE * 0.8} height={TILE * 0.8} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32 }}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: COLORS.white, lineHeight: 1.08 }}>
          Technology that solves
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: COLORS.white, lineHeight: 1.08 }}>
          real problems.
        </div>
      </div>
      <div style={{ display: "flex", width: 72, height: 6, borderRadius: 3, background: COLORS.accent, marginTop: 28 }} />
      <div style={{ display: "flex", fontSize: 32, fontWeight: 600, color: COLORS.lightMuted, marginTop: 24 }}>
        Websites · Web applications · Custom software · SEO
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: FONTS.mono,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 4,
          color: COLORS.accent,
          marginTop: 16,
        }}
      >
        PHUTHADITJHABA · QWAQWA
      </div>
    </div>
  </div>
);

await writeFile(OUT, Buffer.from(await new ImageResponse(el, { width: W, height: H, fonts }).arrayBuffer()));
console.log(`${OUT} (${W}×${H})`);
