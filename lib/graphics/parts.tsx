/**
 * Shared Satori pieces. Satori supports only part of CSS: every element with more than one child
 * needs `display: flex`, text is a single string child, and there's no z-index (later siblings
 * paint on top). Colours come only from the slide's theme (brand/tokens.ts THEMES) or the fixed
 * device and code-panel colours; never hard-code one here.
 */
import type { CSSProperties, ReactNode } from "react";
import { CODE_COLORS, CODE_PANEL, COLORS, DEVICE_COLORS, FONTS, LOGO, THEMES, type Theme } from "@/brand/tokens";
import {
  BADGE,
  type Block,
  CODE,
  type CodeModel,
  type Device,
  DIAGRAM,
  type DiagramModel,
  type FlowBox,
  FRAME,
  LABEL,
  type SlideFrame,
  TYPE,
  type Text,
} from "./model";
import type { SlideLogo } from "./assets";
import { nbsp, upper } from "./text";

/** The site the logo links people to (PrimeCode/Web CNAME). */
export const WEBSITE = "primecodesolutions.co.za";

/** The slide's theme. */
export const themeOf = (frame: Pick<SlideFrame, "theme">): Theme => THEMES[frame.theme];

/**
 * The logo symbol (assets/brand/symbol.svg) on a rounded tile: white on dark themes, the logo navy
 * with the reversed symbol on light themes, so every slide carries the same app-icon shape.
 */
export function LogoTile({ logo, size, t }: { logo: SlideLogo; size: number; t: Theme }) {
  const inset = Math.round(size * LOGO.tileInset);
  const inner = size - 2 * inset;
  const tile = t.logoTile === "white" ? COLORS.white : t.logoTile === "navy" ? COLORS.logoNavy : null;
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        padding: inset,
        ...(tile ? { background: tile } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
      <img src={t.logoTile === "navy" ? logo.reversed : logo.symbol} alt="" width={inner} height={inner} />
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
 * The slide frame: themed background, logo and series label on top, website and counter at the
 * bottom. `children` fill the content area (see `contentBox`).
 */
export function DarkFrame({
  frame,
  logo,
  backdrop,
  children,
}: {
  frame: SlideFrame;
  logo: SlideLogo;
  /** A full-bleed layer (e.g. a photo) drawn first, under everything else. */
  backdrop?: ReactNode;
  children: ReactNode;
}) {
  const t = themeOf(frame);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        flexDirection: "column",
        width: frame.width,
        height: frame.height,
        padding: `${FRAME.padY[frame.size]}px ${FRAME.pad}px`,
        backgroundColor: t.bg[0],
        backgroundImage: `radial-gradient(circle at 100% 100%, ${t.glow} 0%, rgba(0, 0, 0, 0) 55%), linear-gradient(160deg, ${t.bg[0]} 0%, ${t.bg[1]} 100%)`,
        fontFamily: FONTS.sans,
        color: t.headline,
      }}
    >
      {/* No z-index in Satori: the backdrop comes first so the frame paints over it. */}
      {backdrop ? (
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: frame.width, height: frame.height }}>
          {backdrop}
        </div>
      ) : null}
      {frame.logo === "top" ? (
        <div style={{ display: "flex", height: FRAME.top, alignItems: "center", justifyContent: "space-between" }}>
          <LogoTile logo={logo} size={FRAME.top} t={t} />
          <div
            style={{
              ...label,
              display: "flex",
              color: t.label,
              // On a photo, sit the label on a dark pill so it reads over bright areas.
              ...(backdrop ? { padding: "8px 18px", borderRadius: 30, background: t.badgeFill } : {}),
            }}
          >
            {upper(frame.series)}
          </div>
        </div>
      ) : (
        // Logo bottom-right: the series and counter move up into a slim top bar.
        <div style={{ ...label, display: "flex", height: FRAME.foot, alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", color: t.label }}>{upper(frame.series)}</div>
          {frame.counter ? (
            <div style={{ display: "flex", color: t.muted, fontWeight: 400, letterSpacing: "0.04em" }}>
              {nbsp(frame.counter)}
            </div>
          ) : null}
        </div>
      )}
      {/* Clips rather than pushing the footer off the slide if copy overflows (the export warns). */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
          marginTop: FRAME.gap,
          marginBottom: FRAME.gap,
        }}
      >
        {children}
      </div>
      <div
        style={{
          ...label,
          display: "flex",
          height: frame.logo === "top" ? FRAME.foot : FRAME.top,
          alignItems: "flex-end",
          justifyContent: "space-between",
          color: t.muted,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        <div style={{ display: "flex" }}>{WEBSITE}</div>
        {frame.logo === "bottom" ? (
          <LogoTile logo={logo} size={FRAME.top} t={t} />
        ) : frame.counter ? (
          <div style={{ display: "flex" }}>{nbsp(frame.counter)}</div>
        ) : null}
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
export function TextBody({ text, t }: { text: Text; t: Theme }) {
  const gap = text.title.fontSize * TYPE.gap;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {text.label ? (
        <div
          style={{
            ...label,
            display: "flex",
            height: LABEL.height,
            alignItems: "center",
            fontSize: LABEL.size,
            color: t.label,
            marginBottom: gap,
          }}
        >
          {upper(text.label)}
        </div>
      ) : null}
      <Lines block={text.title} style={{ fontWeight: 800, letterSpacing: `${TYPE.titleTracking}em`, color: t.headline }} />
      {text.subtitle ? <Lines block={text.subtitle} style={{ marginTop: gap, color: t.body }} /> : null}
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
                <div style={{ display: "flex", width: item.fontSize * 0.55, height: 8, borderRadius: 4, background: t.accent }} />
              </div>
              <Lines block={item} style={{ fontWeight: 600, color: t.headline }} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The call to action, behind an accent rule. */
export function Cta({ block, t }: { block: Block; t: Theme }) {
  return (
    <div
      style={{
        display: "flex",
        marginTop: TYPE.ctaGap,
        borderLeft: `6px solid ${t.accent}`,
        paddingLeft: TYPE.ctaIndent - 6,
      }}
    >
      <Lines block={block} style={{ fontWeight: 600, color: t.headline }} />
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

/** The screen: the screenshot (top-aligned, cropped), or a labelled placeholder if it's missing. */
function Screen({ device }: { device: Device }) {
  const { screen, image } = device;
  const name = device.asset.split("/").pop() ?? device.asset;
  const nameSize = Math.min(20, Math.floor((screen.width * 0.86) / (name.length * 0.6)));
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: screen.width,
        height: screen.height,
        borderRadius: screen.radius,
        overflow: "hidden",
        background: DEVICE_COLORS.screen,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM
        <img
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          style={{ position: "absolute", top: 0, left: image.left }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONTS.mono }}>
          <div style={{ display: "flex", fontWeight: 600, fontSize: 22, color: DEVICE_COLORS.placeholder }}>
            {upper("Screenshot")}
          </div>
          <div style={{ display: "flex", fontWeight: 600, fontSize: 22, color: DEVICE_COLORS.placeholder, marginBottom: 12 }}>
            {upper("needed")}
          </div>
          <div style={{ display: "flex", fontSize: nameSize, color: DEVICE_COLORS.placeholderText }}>{name}</div>
        </div>
      )}
      {device.type === "phone" ? (
        // The camera notch, painted over the screenshot (later siblings paint on top).
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: Math.round(device.bezel * 0.6),
            left: Math.round(screen.width * 0.36),
            width: Math.round(screen.width * 0.28),
            height: Math.round(device.bezel * 1.1),
            borderRadius: device.bezel,
            background: DEVICE_COLORS.bezel,
          }}
        />
      ) : null}
    </div>
  );
}

/** A phone or laptop drawn with divs, holding a screenshot. Sizes come from `deviceGeometry`. */
export function DeviceFrame({ device }: { device: Device }) {
  if (device.type === "phone") {
    return (
      <div
        style={{
          display: "flex",
          width: device.width,
          height: device.height,
          padding: device.bezel,
          borderRadius: device.screen.radius + device.bezel,
          background: DEVICE_COLORS.bezel,
          boxShadow: DEVICE_COLORS.outline,
        }}
      >
        <Screen device={device} />
      </div>
    );
  }
  const lid = device.lid!;
  const base = device.base!;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: device.width, height: device.height }}>
      <div
        style={{
          display: "flex",
          width: lid.width,
          height: lid.height,
          padding: device.bezel,
          borderRadius: `${device.bezel * 1.4}px ${device.bezel * 1.4}px 4px 4px`,
          background: DEVICE_COLORS.bezel,
          boxShadow: DEVICE_COLORS.outline,
        }}
      >
        <Screen device={device} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: base.width,
          height: base.height,
          borderRadius: `2px 2px ${base.height}px ${base.height}px`,
          backgroundImage: DEVICE_COLORS.base,
        }}
      >
        <div
          style={{
            display: "flex",
            width: Math.round(base.width * 0.16),
            height: Math.round(base.height * 0.4),
            borderRadius: `0 0 ${base.height}px ${base.height}px`,
            background: DEVICE_COLORS.hinge,
          }}
        />
      </div>
    </div>
  );
}

// Diagram primitives: box, arrow, label. ----------------------------------------------------------

/** A rounded box holding a label and an optional note. */
export function Box({ box, t }: { box: FlowBox; t: Theme }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: box.width,
        height: box.height,
        padding: `${box.padY}px ${DIAGRAM.pad}px`,
        borderRadius: DIAGRAM.radius,
        background: t.boxFill,
        border: `2px solid ${t.boxEdge}`,
      }}
    >
      <Lines block={box.label} style={{ fontWeight: 600, color: t.headline }} />
      {box.note ? <Lines block={box.note} style={{ marginTop: DIAGRAM.noteGap, color: t.body }} /> : null}
    </div>
  );
}

/** An arrow pointing right (row) or down (column), with an optional mono label. */
export function Arrow({
  length,
  direction,
  via,
  t,
}: {
  length: number;
  direction: "row" | "column";
  via: string | null;
  t: Theme;
}) {
  const head = 12;
  const svg =
    direction === "row" ? (
      <svg width={length} height={24} viewBox={`0 0 ${length} 24`} fill="none" stroke={t.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M6 12H${length - 6}`} />
        <path d={`M${length - 6 - head} ${12 - head * 0.7}L${length - 6} 12L${length - 6 - head} ${12 + head * 0.7}`} />
      </svg>
    ) : (
      <svg width={24} height={length} viewBox={`0 0 24 ${length}`} fill="none" stroke={t.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M12 6V${length - 6}`} />
        <path d={`M${12 - head * 0.7} ${length - 6 - head}L12 ${length - 6}L${12 + head * 0.7} ${length - 6 - head}`} />
      </svg>
    );
  const viaLabel = via ? (
    <div style={{ display: "flex", fontFamily: FONTS.mono, fontWeight: 600, fontSize: DIAGRAM.viaSize, color: t.label }}>
      {upper(via)}
    </div>
  ) : null;
  return direction === "row" ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: length }}>
      {viaLabel}
      {svg}
    </div>
  ) : (
    <div style={{ display: "flex", alignItems: "center", height: length, paddingLeft: 40 }}>
      {svg}
      {viaLabel ? <div style={{ display: "flex", marginLeft: 16 }}>{viaLabel}</div> : null}
    </div>
  );
}

/** A diagram: boxes joined by arrows, or comparison columns. */
export function DiagramView({ diagram, t }: { diagram: DiagramModel; t: Theme }) {
  if (diagram.type === "columns") {
    return (
      <div style={{ display: "flex", width: diagram.width, height: diagram.height }}>
        {diagram.columns.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              width: c.width,
              height: c.height,
              marginLeft: i === 0 ? 0 : DIAGRAM.columnGap,
              padding: DIAGRAM.pad,
              borderRadius: DIAGRAM.radius,
              background: t.panelFill,
              border: `2px solid ${t.panelEdge}`,
            }}
          >
            <Lines block={c.heading} style={{ fontWeight: 800, color: t.label, marginBottom: DIAGRAM.itemGap * 1.5 }} />
            {c.items.map((item, j) => (
              <div key={j} style={{ display: "flex", marginTop: j === 0 ? 0 : DIAGRAM.itemGap }}>
                <div style={{ display: "flex", width: DIAGRAM.itemIndent, paddingTop: (item.fontSize * item.lineHeight) / 2 - 5 }}>
                  <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, background: t.accent }} />
                </div>
                <Lines block={item} style={{ color: t.body }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  const row = diagram.direction === "row";
  return (
    <div style={{ display: "flex", flexDirection: row ? "row" : "column", width: diagram.width, height: diagram.height }}>
      {diagram.boxes.map((box, i) => (
        <div key={i} style={{ display: "flex", flexDirection: row ? "row" : "column" }}>
          {i > 0 ? <Arrow length={diagram.arrow} direction={diagram.direction} via={diagram.boxes[i - 1]!.via} t={t} /> : null}
          <Box box={box} t={t} />
        </div>
      ))}
    </div>
  );
}

// Code panel. -------------------------------------------------------------------------------------

/** Code as text in an editor window: tab with filename, line numbers, syntax colours. Always dark. */
export function CodePanel({ code }: { code: CodeModel }) {
  const lineHeight = code.fontSize * CODE.lineHeight;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: code.width,
        height: code.height,
        borderRadius: 24,
        background: CODE_PANEL.bg,
        border: CODE_PANEL.edge,
        fontFamily: FONTS.mono,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: CODE.tab, padding: `0 ${CODE.padX}px`, background: CODE_PANEL.tab }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", width: 14, height: 14, borderRadius: 7, marginRight: 10, background: CODE_PANEL.dot }} />
        ))}
        {code.filename ? (
          <div style={{ display: "flex", marginLeft: 18, fontSize: 22, color: CODE_PANEL.filename }}>{code.filename}</div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: `${CODE.padY}px 0` }}>
        {code.lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              height: lineHeight,
              alignItems: "center",
              padding: `0 ${CODE.padX}px`,
              fontSize: code.fontSize,
              background: code.highlight.includes(i + 1) ? CODE_PANEL.highlight : "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: (code.gutter - 1) * code.fontSize * CODE.charEm,
                marginRight: code.fontSize * CODE.charEm,
                color: CODE_PANEL.gutter,
              }}
            >
              {String(i + 1)}
            </div>
            {line.map((tok, j) => (
              <div key={j} style={{ display: "flex", color: CODE_COLORS[tok.kind] }}>
                {nbsp(tok.text)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A pill at the top of the content area, e.g. LOCAL-01's "Illustrative concept". */
export function Badge({ text, t }: { text: string; t: Theme }) {
  return (
    <div style={{ display: "flex", height: BADGE.height, marginBottom: BADGE.gap }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: BADGE.height,
          padding: "0 20px",
          borderRadius: BADGE.height / 2,
          border: `2px solid ${t.label}`,
          background: t.badgeFill,
          fontFamily: FONTS.mono,
          fontWeight: 600,
          fontSize: BADGE.size,
          letterSpacing: "0.1em",
          color: t.label,
        }}
      >
        {upper(text)}
      </div>
    </div>
  );
}
