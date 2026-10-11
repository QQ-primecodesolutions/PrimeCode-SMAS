/**
 * Shared Satori pieces. Satori supports only part of CSS: every element with more than one child
 * needs `display: flex`, text is a single string child, and there's no z-index (later siblings
 * paint on top).
 */
import type { CSSProperties, ReactNode } from "react";
import { CODE_COLORS, COLORS, FONTS, GRADIENT_DARK, LOGO } from "@/brand/tokens";
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
export function DarkFrame({
  frame,
  logo,
  backdrop,
  children,
}: {
  frame: SlideFrame;
  logo: string;
  /** A full-bleed layer (e.g. a photo) drawn first, under everything else. */
  backdrop?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
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
      {/* No z-index in Satori: the backdrop comes first so the frame paints over it. */}
      {backdrop ? (
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: frame.width, height: frame.height }}>
          {backdrop}
        </div>
      ) : null}
      {frame.logo === "top" ? (
        <div style={{ display: "flex", height: FRAME.top, alignItems: "center", justifyContent: "space-between" }}>
          <LogoTile logo={logo} size={FRAME.top} />
          <div
            style={{
              ...label,
              display: "flex",
              color: COLORS.accent,
              // On a photo, sit the label on a dark pill so it reads over bright areas.
              ...(backdrop ? { padding: "8px 18px", borderRadius: 30, background: "rgba(15, 23, 42, 0.72)" } : {}),
            }}
          >
            {upper(frame.series)}
          </div>
        </div>
      ) : (
        // Logo bottom-right: the series and counter move up into a slim top bar.
        <div style={{ ...label, display: "flex", height: FRAME.foot, alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", color: COLORS.accent }}>{upper(frame.series)}</div>
          {frame.counter ? (
            <div style={{ display: "flex", color: COLORS.lightMuted, fontWeight: 400, letterSpacing: "0.04em" }}>
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
          color: COLORS.lightMuted,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        <div style={{ display: "flex" }}>{WEBSITE}</div>
        {frame.logo === "bottom" ? (
          <LogoTile logo={logo} size={FRAME.top} />
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
export function TextBody({ text }: { text: Text }) {
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
            color: COLORS.accent,
            marginBottom: gap,
          }}
        >
          {upper(text.label)}
        </div>
      ) : null}
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

const BEZEL = "#0b1220";
const OUTLINE = "0 0 0 2px #334155, 0 30px 60px rgba(0, 0, 0, 0.45)";

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
        background: COLORS.bg2,
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
          <div style={{ display: "flex", fontWeight: 600, fontSize: 22, color: COLORS.accent }}>{upper("Screenshot")}</div>
          <div style={{ display: "flex", fontWeight: 600, fontSize: 22, color: COLORS.accent, marginBottom: 12 }}>
            {upper("needed")}
          </div>
          <div style={{ display: "flex", fontSize: nameSize, color: COLORS.lightMuted }}>{name}</div>
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
            background: BEZEL,
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
          background: BEZEL,
          boxShadow: OUTLINE,
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
          background: BEZEL,
          boxShadow: OUTLINE,
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
          backgroundImage: "linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: Math.round(base.width * 0.16),
            height: Math.round(base.height * 0.4),
            borderRadius: `0 0 ${base.height}px ${base.height}px`,
            background: "#64748b",
          }}
        />
      </div>
    </div>
  );
}

// Diagram primitives: box, arrow, label. ----------------------------------------------------------

const BOX_FILL = "rgba(37, 99, 235, 0.14)";
const BOX_EDGE = "2px solid rgba(6, 182, 212, 0.55)";

/** A rounded box holding a label and an optional note. */
export function Box({ box }: { box: FlowBox }) {
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
        background: BOX_FILL,
        border: BOX_EDGE,
      }}
    >
      <Lines block={box.label} style={{ fontWeight: 600 }} />
      {box.note ? <Lines block={box.note} style={{ marginTop: DIAGRAM.noteGap, color: COLORS.lightMuted }} /> : null}
    </div>
  );
}

/** An arrow pointing right (row) or down (column), with an optional mono label. */
export function Arrow({ length, direction, via }: { length: number; direction: "row" | "column"; via: string | null }) {
  const head = 12;
  const svg =
    direction === "row" ? (
      <svg width={length} height={24} viewBox={`0 0 ${length} 24`} fill="none" stroke={COLORS.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M6 12H${length - 6}`} />
        <path d={`M${length - 6 - head} ${12 - head * 0.7}L${length - 6} 12L${length - 6 - head} ${12 + head * 0.7}`} />
      </svg>
    ) : (
      <svg width={24} height={length} viewBox={`0 0 24 ${length}`} fill="none" stroke={COLORS.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M12 6V${length - 6}`} />
        <path d={`M${12 - head * 0.7} ${length - 6 - head}L12 ${length - 6}L${12 + head * 0.7} ${length - 6 - head}`} />
      </svg>
    );
  const viaLabel = via ? (
    <div style={{ display: "flex", fontFamily: FONTS.mono, fontWeight: 600, fontSize: DIAGRAM.viaSize, color: COLORS.accent }}>
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
export function DiagramView({ diagram }: { diagram: DiagramModel }) {
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
              background: "rgba(255, 255, 255, 0.04)",
              border: "2px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <Lines block={c.heading} style={{ fontWeight: 800, color: COLORS.accent, marginBottom: DIAGRAM.itemGap * 1.5 }} />
            {c.items.map((item, j) => (
              <div key={j} style={{ display: "flex", marginTop: j === 0 ? 0 : DIAGRAM.itemGap }}>
                <div style={{ display: "flex", width: DIAGRAM.itemIndent, paddingTop: (item.fontSize * item.lineHeight) / 2 - 5 }}>
                  <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, background: COLORS.accent }} />
                </div>
                <Lines block={item} style={{ color: COLORS.lightMuted }} />
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
          {i > 0 ? <Arrow length={diagram.arrow} direction={diagram.direction} via={diagram.boxes[i - 1]!.via} /> : null}
          <Box box={box} />
        </div>
      ))}
    </div>
  );
}

// Code panel. -------------------------------------------------------------------------------------

/** Code as text in an editor window: tab with filename, line numbers, syntax colours. */
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
        background: "#0b1220",
        border: "2px solid #1e293b",
        fontFamily: FONTS.mono,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: CODE.tab, padding: `0 ${CODE.padX}px`, background: "#111a2e" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", width: 14, height: 14, borderRadius: 7, marginRight: 10, background: "#334155" }} />
        ))}
        {code.filename ? (
          <div style={{ display: "flex", marginLeft: 18, fontSize: 22, color: COLORS.lightMuted }}>{code.filename}</div>
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
              background: code.highlight.includes(i + 1) ? "rgba(6, 182, 212, 0.14)" : "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: (code.gutter - 1) * code.fontSize * CODE.charEm,
                marginRight: code.fontSize * CODE.charEm,
                color: "#475569",
              }}
            >
              {String(i + 1)}
            </div>
            {line.map((t, j) => (
              <div key={j} style={{ display: "flex", color: CODE_COLORS[t.kind] }}>
                {nbsp(t.text)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A pill at the top of the content area, e.g. LOCAL-01's "Illustrative concept". */
export function Badge({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", height: BADGE.height, marginBottom: BADGE.gap }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: BADGE.height,
          padding: "0 20px",
          borderRadius: BADGE.height / 2,
          border: `2px solid ${COLORS.accent}`,
          background: "rgba(15, 23, 42, 0.72)",
          fontFamily: FONTS.mono,
          fontWeight: 600,
          fontSize: BADGE.size,
          letterSpacing: "0.1em",
          color: COLORS.accent,
        }}
      >
        {upper(text)}
      </div>
    </div>
  );
}
