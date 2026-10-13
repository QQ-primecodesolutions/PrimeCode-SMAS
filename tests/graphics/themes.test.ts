import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SERIES_THEME, THEMES, THEME_NAMES } from "@/brand/tokens";
import { contrast } from "@/lib/graphics/contrast";
import { themeFor } from "@/lib/graphics/model";
import { SERIES } from "@/lib/post/schema";

describe("theme selection", () => {
  it("gives every series a theme, and lets a post override it", () => {
    for (const series of SERIES) expect(THEME_NAMES).toContain(SERIES_THEME[series]);
    expect(themeFor({ series: "Tech for Business" })).toBe("paper");
    expect(themeFor({ series: "Tech for Business", theme: "teal" })).toBe("teal");
  });
});

describe("no hard-coded colours in templates", () => {
  const files = ["lib/graphics/parts.tsx", ...readdirSync("lib/graphics/templates").map((f) => `lib/graphics/templates/${f}`)];
  for (const file of files) {
    it(`${file} takes its colours from brand/tokens.ts`, () => {
      const source = readFileSync(file, "utf8").replace("rgba(0, 0, 0, 0)", "");
      expect(source.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi) ?? []).toEqual([]);
    });
  }
});

/** WCAG AA: 4.5:1 for small text, 3:1 for large text and graphical marks. */
const SMALL = ["body", "muted", "label"] as const;
const LARGE = ["headline", "accent", "tick", "cross"] as const;

describe("theme contrast", () => {
  it("knows WCAG's reference values", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  for (const name of THEME_NAMES) {
    const t = THEMES[name];
    for (const stop of t.bg) {
      for (const role of SMALL) {
        it(`${name}: ${role} ${t[role]} on ${stop} is at least 4.5:1`, () => {
          expect(contrast(t[role], stop)).toBeGreaterThanOrEqual(4.5);
        });
      }
      for (const role of LARGE) {
        it(`${name}: ${role} ${t[role]} on ${stop} is at least 3:1`, () => {
          expect(contrast(t[role], stop)).toBeGreaterThanOrEqual(3);
        });
      }
    }
    it(`${name}: the mark ink reads inside a filled tick and cross`, () => {
      expect(contrast(t.markInk, t.tick)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.markInk, t.cross)).toBeGreaterThanOrEqual(3);
    });
  }
});
