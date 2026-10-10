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
} as const;

/** The website's brand gradient (`--gradient-primary`). */
export const GRADIENT_PRIMARY = `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`;
export const GRADIENT_DARK = `linear-gradient(160deg, ${COLORS.bg} 0%, ${COLORS.bg2} 100%)`;

/** Font family names as registered with Satori (lib/graphics/assets.ts). SIL OFL, assets/fonts. */
export const FONTS = {
  sans: "Inter",
  mono: "JetBrains Mono",
} as const;

/**
 * The full logo (mark above the "PrimeCode / SOLUTIONS" wordmark), a transparent PNG copied from
 * PrimeCode/Web/img/logo.png. The navy wordmark doesn't read on dark slides, so those show only the
 * mark, cropped from the top of the image, on a white tile.
 */
export const LOGO = {
  path: "assets/brand/logo.png",
  width: 1024,
  height: 928,
  /** Square crop around the mark (same as the website's favicon, lib/iconGraphic.tsx). */
  markCrop: { x: 202, y: 0, size: 620 },
} as const;
