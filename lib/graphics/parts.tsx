/**
 * Shared Satori pieces. Satori supports only part of CSS: every element with more than one child
 * needs `display: flex`, text is a single string child, and there's no z-index (later siblings
 * paint on top).
 */
import type { CSSProperties, ReactNode } from "react";
import { COLORS, FONTS, GRADIENT_DARK, LOGO } from "@/brand/tokens";
import { type Block, FRAME, type SlideFrame, TYPE, type Text } from "./model";
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

/** Headline, supporting text and list (a slide's `Text`), stacked with the shared gap. */
export function TextBody({ text }: { text: Text }) {
  const gap = text.title.fontSize * TYPE.gap;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines block={text.title} style={{ fontWeight: 800, letterSpacing: `${TYPE.titleTracking}em` }} />
      {text.subtitle ? <Lines block={text.subtitle} style={{ marginTop: gap, color: COLORS.lightMuted }} /> : null}
      {text.items.length ? (
        <div style={{ display: "flex", flexDirection: "column", marginTop: gap }}>
          {text.items.map((item, i) => (
            <div key={i} style={{ display: "flex", marginTop: i === 0 ? 0 : item.fontSize * TYPE.itemGap }}>
              <div
                style={{
                  display: "flex",
                  width: item.fontSize * TYPE.itemIndent,
                  paddingTop: (item.fontSize * item.lineHeight) / 2 - 4,
                }}
              >
                <div style={{ display: "flex", width: item.fontSize * 0.55, height: 8, borderRadius: 4, background: COLORS.accent }} />
              </div>
              <Lines block={item} style={{ fontWeight: 600 }} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The call to action, behind a cyan rule. */
export function Cta({ block }: { block: Block }) {
  return (
    <div
      style={{
        display: "flex",
        marginTop: TYPE.ctaGap,
        borderLeft: `6px solid ${COLORS.accent}`,
        paddingLeft: TYPE.ctaIndent - 6,
      }}
    >
      <Lines block={block} style={{ fontWeight: 600, color: COLORS.white }} />
    </div>
  );
}

/** Line icons on a 24-unit grid, drawn here as SVG (Satori has no icon fonts). */
export const ICONS = {
  tick: ["M5 12.5l4.5 4.5L19 7.5"],
  cross: ["M7 7l10 10", "M17 7L7 17"],
  /** A browser window. */
  websites: ["M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M3 9h18", "M6 6.5h.01", "M9 6.5h.01"],
  /** A dashboard. */
  "web-applications": [
    "M3 4.5A1.5 1.5 0 0 1 4.5 3h5A1.5 1.5 0 0 1 11 4.5v6A1.5 1.5 0 0 1 9.5 12h-5A1.5 1.5 0 0 1 3 10.5z",
    "M13 4.5A1.5 1.5 0 0 1 14.5 3h5A1.5 1.5 0 0 1 21 4.5v2A1.5 1.5 0 0 1 19.5 8h-5A1.5 1.5 0 0 1 13 6.5z",
    "M13 11.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5z",
    "M3 15.5A1.5 1.5 0 0 1 4.5 14h5a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 21h-5A1.5 1.5 0 0 1 3 19.5z",
  ],
  /** Code brackets. */
  "custom-software": ["M8 7l-5 5 5 5", "M16 7l5 5-5 5", "M13.5 4l-3 16"],
  /** A magnifier over a rising line. */
  seo: ["M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z", "M15.5 15.5L21 21", "M7.5 12.5l2-2 1.5 1.5 2.5-3"],
} as const;

export function Icon({ name, size, color, stroke = 2 }: { name: keyof typeof ICONS; size: number; color: string; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
