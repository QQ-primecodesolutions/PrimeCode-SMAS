/**
 * Shared Satori pieces. Satori supports only part of CSS: every element with more than one child
 * needs `display: flex`, text is a single string child, and there's no z-index (later siblings
 * paint on top).
 */
import type { CSSProperties, ReactNode } from "react";
import { COLORS, FONTS, GRADIENT_DARK, LOGO } from "@/brand/tokens";
import { type Block, FRAME, type SlideFrame } from "./model";
import { nbsp, upper } from "./text";

/** The site the logo links people to (PrimeCode/Web CNAME). */
export const WEBSITE = "primecodesolutions.co.za";

/** The helmet-and-monitor mark, cropped from the full logo, on a white rounded tile. */
export function LogoTile({ logo, size }: { logo: string; size: number }) {
  const inset = Math.round(size * 0.1);
  const inner = size - 2 * inset;
  const scale = inner / LOGO.markCrop.size;
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: COLORS.white,
        padding: inset,
      }}
    >
      <div style={{ display: "flex", width: inner, height: inner, overflow: "hidden", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
        <img
          src={logo}
          alt=""
          width={LOGO.width * scale}
          height={LOGO.height * scale}
          style={{ position: "absolute", left: -LOGO.markCrop.x * scale, top: -LOGO.markCrop.y * scale }}
        />
      </div>
    </div>
  );
}

const label: CSSProperties = {
  fontFamily: FONTS.mono,
  fontSize: 26,
  fontWeight: 600,
  letterSpacing: "0.12em",
};

/**
 * Dark slide: brand gradient background, logo tile and series label on top, website and counter at
 * the bottom. `children` fill the content area (see `contentBox`).
 */
export function DarkFrame({ frame, logo, children }: { frame: SlideFrame; logo: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: frame.width,
        height: frame.height,
        padding: `${FRAME.padY[frame.size]}px ${FRAME.pad}px`,
        backgroundColor: COLORS.bg,
        backgroundImage: `radial-gradient(circle at 100% 100%, rgba(37, 99, 235, 0.32) 0%, rgba(37, 99, 235, 0) 55%), ${GRADIENT_DARK}`,
        fontFamily: FONTS.sans,
        color: COLORS.white,
      }}
    >
      <div style={{ display: "flex", height: FRAME.top, alignItems: "center", justifyContent: "space-between" }}>
        <LogoTile logo={logo} size={FRAME.top} />
        <div style={{ ...label, display: "flex", color: COLORS.accent }}>{upper(frame.series)}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, marginTop: FRAME.gap, marginBottom: FRAME.gap }}>
        {children}
      </div>
      <div
        style={{
          ...label,
          display: "flex",
          height: FRAME.foot,
          alignItems: "flex-end",
          justifyContent: "space-between",
          color: COLORS.lightMuted,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        <div style={{ display: "flex" }}>{WEBSITE}</div>
        {frame.counter ? <div style={{ display: "flex" }}>{nbsp(frame.counter)}</div> : null}
      </div>
    </div>
  );
}

/** Pre-wrapped lines, one div each, with no-break spaces (see lib/graphics/text.ts). */
export function Lines({ block, style }: { block: Block; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontSize: block.fontSize,
        lineHeight: block.lineHeight,
        ...style,
      }}
    >
      {block.lines.map((line, i) => (
        <div key={i} style={{ display: "flex" }}>
          {nbsp(line)}
        </div>
      ))}
    </div>
  );
}
