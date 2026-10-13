/**
 * PrimeCode brand tokens for slides. Colours and fonts are the PrimeCode website's
 * (PrimeCode/Web/nextjs-app/src/app/globals.css, layout.tsx); keep them in step with it.
 */

export const COLORS = {
  /** Dark slide background (website `--color-bg-dark`). */
  bg: "#0f172a",
  /** Second stop of the dark gradient (website footer). */
  bg2: "#1e293b",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  /** Cyan: the website's `--color-secondary`. Highlights and rules on dark slides. */
  accent: "#06b6d4",
  violet: "#8b5cf6",
  text: "#1f2937",
  muted: "#6b7280",
  light: "#f8fafc",
  /** Soft text on dark slides (website hero gradient end). */
  lightMuted: "#e2e8f0",
  border: "#e5e7eb",
  white: "#ffffff",
  /** The logo's navy (outlines and wordmark), and the tile behind the reversed symbol. */
  logoNavy: "#0f3b6e",
} as const;

/** Syntax colours for CODE-01 panels: light tints of the brand blue, cyan and violet on navy. */
export const CODE_COLORS = {
  plain: "#e2e8f0",
  keyword: "#c4b5fd",
  string: "#67e8f9",
  comment: "#64748b",
  number: "#a5f3fc",
  function: "#93c5fd",
  tag: "#60a5fa",
  attr: "#c4b5fd",
  punct: "#94a3b8",
} as const;

/** Font family names as registered with Satori (lib/graphics/assets.ts). SIL OFL, assets/fonts. */
export const FONTS = {
  sans: "Inter",
  mono: "JetBrains Mono",
} as const;

/**
 * The logo: the Mont-aux-Sources Amphitheatre on a monitor, with the prime stroke (′) in the notch.
 * Built as SVGs by scripts/brand/build_logo.py into assets/brand/ (logo.svg, mark.svg, and the
 * compact symbol.svg / symbol-reversed.svg that slides use at tile size; read in
 * lib/graphics/assets.ts). PNG exports are in assets/brand/export/. The old helmet logo is in
 * assets/brand/archive/ and must not be used.
 */
export const LOGO = {
  /** Inset of the symbol inside its tile, as a fraction of the tile size. */
  tileInset: 0.1,
} as const;

// Themes ------------------------------------------------------------------------------------------

/**
 * Every colour a slide uses. Templates take colours only from here (via the slide's theme), never
 * hard-coded. tests/graphics/themes.test.ts checks WCAG contrast against both background stops:
 * 4.5:1 for small text (`body`, `muted`, `label`), 3:1 for large text and marks (`headline`,
 * `accent`, `tick`, `cross`).
 */
export type Theme = {
  /** Dark themes take the white logo tile and light text. */
  dark: boolean;
  /** Background gradient, top-left to bottom-right. */
  bg: readonly [string, string];
  /** A soft radial glow in the bottom-right corner (rgba). */
  glow: string;
  /** Headlines, box labels, the CTA. */
  headline: string;
  /** Supporting text, notes, list text. */
  body: string;
  /** Footer, counter, dim labels. */
  muted: string;
  /** Small accent text: the series label, section labels, arrow labels, the badge. */
  label: string;
  /** Large accent marks: the rule, list markers, CTA bar, arrows, column headings. */
  accent: string;
  /** BIZ-01 marks, and the colour drawn inside a filled mark. */
  tick: string;
  cross: string;
  markInk: string;
  /** Diagram boxes and comparison panels (fills may be translucent). */
  boxFill: string;
  boxEdge: string;
  panelFill: string;
  panelEdge: string;
  /** Unlit tiles and empty checklist boxes: outline, and icon colour inside. */
  tileEdge: string;
  tileIcon: string;
  /** A lit service tile: its background (a CSS background-image) and icon colour. */
  tileLit: string;
  tileLitIcon: string;
  /** The panel behind PROJECT-01 devices (a CSS background-image). */
  stage: string;
  /** Behind the LOCAL-01 badge. */
  badgeFill: string;
  /**
   * The logo symbol's tile: white with the full-colour symbol (dark themes), the logo navy with the
   * reversed symbol (light themes), or bare.
   */
  logoTile: "white" | "navy" | "none";
};

const LIGHT_EDGE = "rgba(15, 23, 42, 0.16)";

export const THEMES = {
  /** The original: deep navy with a blue glow. Recognition, the comeback post, code. */
  navy: {
    dark: true,
    bg: [COLORS.bg, COLORS.bg2],
    glow: "rgba(37, 99, 235, 0.32)",
    headline: COLORS.white,
    body: COLORS.lightMuted,
    muted: COLORS.lightMuted,
    label: COLORS.accent,
    accent: COLORS.accent,
    tick: COLORS.accent,
    cross: COLORS.violet,
    markInk: COLORS.bg,
    boxFill: "rgba(37, 99, 235, 0.14)",
    boxEdge: "rgba(6, 182, 212, 0.55)",
    panelFill: "rgba(255, 255, 255, 0.04)",
    panelEdge: "rgba(255, 255, 255, 0.12)",
    tileEdge: "rgba(255, 255, 255, 0.18)",
    tileIcon: "rgba(226, 232, 240, 0.55)",
    tileLit: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
    tileLitIcon: COLORS.white,
    stage: "linear-gradient(160deg, rgba(37, 99, 235, 0.22) 0%, rgba(6, 182, 212, 0.08) 100%)",
    badgeFill: "rgba(15, 23, 42, 0.72)",
    logoTile: "white",
  },
  /** Light blue. PrimeCode Explains. Bright cyan fails on light backgrounds, so cyan-700. */
  sky: {
    dark: false,
    bg: ["#f0f9ff", "#e0f2fe"],
    glow: "rgba(14, 116, 144, 0.10)",
    headline: "#0f172a",
    body: "#334155",
    muted: "#475569",
    label: "#0e7490",
    accent: "#0e7490",
    tick: "#0e7490",
    cross: "#6d28d9",
    markInk: COLORS.white,
    boxFill: "rgba(255, 255, 255, 0.75)",
    boxEdge: "rgba(14, 116, 144, 0.45)",
    panelFill: "rgba(255, 255, 255, 0.65)",
    panelEdge: LIGHT_EDGE,
    tileEdge: LIGHT_EDGE,
    tileIcon: "#64748b",
    tileLit: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
    tileLitIcon: COLORS.white,
    stage: "linear-gradient(160deg, rgba(14, 116, 144, 0.14) 0%, rgba(37, 99, 235, 0.06) 100%)",
    badgeFill: "rgba(255, 255, 255, 0.85)",
    logoTile: "navy",
  },
  /** Near-white. Tech for Business. */
  paper: {
    dark: false,
    bg: [COLORS.light, "#f1f5f9"],
    glow: "rgba(37, 99, 235, 0.08)",
    headline: "#0f172a",
    body: "#475569",
    muted: "#475569",
    label: COLORS.primary,
    accent: COLORS.primary,
    tick: COLORS.primary,
    cross: "#7c3aed",
    markInk: COLORS.white,
    boxFill: COLORS.white,
    boxEdge: "rgba(37, 99, 235, 0.35)",
    panelFill: COLORS.white,
    panelEdge: LIGHT_EDGE,
    tileEdge: LIGHT_EDGE,
    tileIcon: "#64748b",
    tileLit: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
    tileLitIcon: COLORS.white,
    stage: "linear-gradient(160deg, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)",
    badgeFill: "rgba(255, 255, 255, 0.9)",
    logoTile: "navy",
  },
  /** Bold brand blue. Build With PrimeCode and PrimeCode Services. */
  blue: {
    dark: true,
    bg: [COLORS.primaryDark, COLORS.primary],
    glow: "rgba(6, 182, 212, 0.28)",
    headline: COLORS.white,
    body: "#eff6ff",
    muted: "#eff6ff",
    label: "#ecfeff",
    accent: "#a5f3fc",
    tick: "#a5f3fc",
    cross: "#ddd6fe",
    markInk: COLORS.primaryDark,
    boxFill: "rgba(255, 255, 255, 0.12)",
    boxEdge: "rgba(165, 243, 252, 0.6)",
    panelFill: "rgba(255, 255, 255, 0.10)",
    panelEdge: "rgba(255, 255, 255, 0.25)",
    tileEdge: "rgba(255, 255, 255, 0.35)",
    tileIcon: "rgba(239, 246, 255, 0.75)",
    tileLit: `linear-gradient(135deg, ${COLORS.white} 0%, #ecfeff 100%)`,
    tileLitIcon: COLORS.primaryDark,
    stage: "linear-gradient(160deg, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.12) 100%)",
    badgeFill: "rgba(15, 23, 42, 0.35)",
    logoTile: "white",
  },
  /** Deep teal with a warm accent. Seasonal greetings. */
  teal: {
    dark: true,
    bg: ["#0e7490", "#155e75"],
    glow: "rgba(253, 230, 138, 0.14)",
    headline: COLORS.white,
    body: "#cffafe",
    muted: "#ecfeff",
    label: "#fef9c3",
    accent: "#fde68a",
    tick: "#fde68a",
    cross: "#ddd6fe",
    markInk: "#155e75",
    boxFill: "rgba(255, 255, 255, 0.10)",
    boxEdge: "rgba(253, 230, 138, 0.55)",
    panelFill: "rgba(255, 255, 255, 0.08)",
    panelEdge: "rgba(255, 255, 255, 0.22)",
    tileEdge: "rgba(255, 255, 255, 0.3)",
    tileIcon: "rgba(236, 254, 255, 0.75)",
    tileLit: `linear-gradient(135deg, ${COLORS.white} 0%, #ecfeff 100%)`,
    tileLitIcon: "#0e7490",
    stage: "linear-gradient(160deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.1) 100%)",
    badgeFill: "rgba(15, 23, 42, 0.4)",
    logoTile: "white",
  },
  /** Deep violet with bright cyan. PrimeCode Insight. */
  violet: {
    dark: true,
    bg: ["#2e1065", "#4c1d95"],
    glow: "rgba(103, 232, 249, 0.14)",
    headline: COLORS.white,
    body: "#ede9fe",
    muted: "#ddd6fe",
    label: "#67e8f9",
    accent: "#67e8f9",
    tick: "#67e8f9",
    cross: "#f0abfc",
    markInk: "#2e1065",
    boxFill: "rgba(255, 255, 255, 0.08)",
    boxEdge: "rgba(103, 232, 249, 0.5)",
    panelFill: "rgba(255, 255, 255, 0.06)",
    panelEdge: "rgba(255, 255, 255, 0.18)",
    tileEdge: "rgba(255, 255, 255, 0.25)",
    tileIcon: "rgba(237, 233, 254, 0.6)",
    tileLit: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
    tileLitIcon: COLORS.white,
    stage: "linear-gradient(160deg, rgba(103, 232, 249, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%)",
    badgeFill: "rgba(15, 23, 42, 0.5)",
    logoTile: "white",
  },
  /** Warm sand, after QwaQwa's sandstone cliffs. Digital Transformation in Qwaqwa; use sparingly. */
  sandstone: {
    dark: false,
    bg: ["#fdf6ec", "#f5e6d3"],
    glow: "rgba(194, 65, 12, 0.07)",
    headline: "#1e293b",
    body: "#57534e",
    muted: "#57534e",
    // #c2410c is only 4.2:1 on the darker sand: fine for marks, too light for small text.
    label: "#9a3412",
    accent: "#c2410c",
    tick: "#c2410c",
    cross: "#6d28d9",
    markInk: COLORS.white,
    boxFill: "rgba(255, 255, 255, 0.7)",
    boxEdge: "rgba(194, 65, 12, 0.35)",
    panelFill: "rgba(255, 255, 255, 0.6)",
    panelEdge: "rgba(87, 83, 78, 0.18)",
    tileEdge: "rgba(87, 83, 78, 0.22)",
    tileIcon: "#78716c",
    tileLit: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
    tileLitIcon: COLORS.white,
    stage: "linear-gradient(160deg, rgba(194, 65, 12, 0.10) 0%, rgba(37, 99, 235, 0.05) 100%)",
    badgeFill: "rgba(255, 255, 255, 0.85)",
    logoTile: "navy",
  },
} as const satisfies Record<string, Theme>;

export type ThemeName = keyof typeof THEMES;
export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

/**
 * Each series' look in the feed. Posts can override with `theme`. Photo slides always use `navy`
 * for their text (it sits on a dark scrim over the photo).
 */
export const SERIES_THEME = {
  "PrimeCode Explains": "sky",
  "Tech for Business": "paper",
  "Behind the Code": "navy",
  "Build With PrimeCode": "blue",
  "PrimeCode Insight": "violet",
  "PrimeCode Services": "blue",
  "PrimeCode Journey": "navy",
  "Digital Transformation in Qwaqwa": "sandstone",
} as const satisfies Record<string, ThemeName>;

/** Fixed colours that don't change with the theme: device mockups and the code editor panel. */
export const DEVICE_COLORS = {
  bezel: "#0b1220",
  outline: "0 0 0 2px #334155, 0 30px 60px rgba(0, 0, 0, 0.45)",
  screen: COLORS.bg2,
  placeholder: COLORS.accent,
  placeholderText: COLORS.lightMuted,
  base: "linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)",
  hinge: "#64748b",
} as const;

/** Photo slides: the scrim that keeps text readable on any photo, and the missing-photo placeholder. */
export const PHOTO_COLORS = {
  scrim:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.4) 15%, rgba(15, 23, 42, 0.05) 28%, rgba(15, 23, 42, 0.55) 44%, rgba(15, 23, 42, 0.92) 62%, rgba(15, 23, 42, 0.97) 100%)",
  textShadow: "0 2px 18px rgba(0, 0, 0, 0.55)",
  empty: COLORS.bg2,
  placeholder: COLORS.accent,
  placeholderText: COLORS.lightMuted,
} as const;

export const CODE_PANEL = {
  bg: "#0b1220",
  edge: "2px solid #1e293b",
  tab: "#111a2e",
  dot: "#334155",
  filename: COLORS.lightMuted,
  gutter: "#475569",
  highlight: "rgba(6, 182, 212, 0.14)",
} as const;
