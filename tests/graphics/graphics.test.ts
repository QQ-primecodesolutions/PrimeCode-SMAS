import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fontMetrics, measurer, type Measure } from "@/lib/graphics/metrics";
import { REVEAL, TYPE, bizModel, brandModel, contentBox, insightModel, type Measures, type SlideModel } from "@/lib/graphics/model";
import { parseSize } from "@/lib/graphics/sizes";
import { smartQuotes, wrapBalanced, wrapGreedy } from "@/lib/graphics/text";
import { basePost } from "../post/fixtures";

/** Every character 0.5em wide: easy arithmetic. */
const half: Measure = (text, size) => [...text].length * 0.5 * size;
const fake: Measures = { title: half, body: half, strong: half };

describe("font metrics", () => {
  const em = fontMetrics(readFileSync("assets/fonts/Inter-ExtraBold.ttf"));

  it("reads advance widths from the font file", () => {
    expect(em("M")).toBeGreaterThan(em("a"));
    expect(em("a")).toBeGreaterThan(em("i"));
    expect(em(" ")).toBe(em(" "));
    expect(fontMetrics(readFileSync("assets/fonts/JetBrainsMono-Regular.ttf"))("W")).toBeCloseTo(0.6, 2);
  });

  it("adds letter-spacing per character", () => {
    const m = measurer(() => 0.5, -0.1);
    expect(m("abcd", 100)).toBeCloseTo(160);
  });
});

describe("wrapping", () => {
  it("breaks between words, never inside one", () => {
    expect(wrapGreedy("aa bb cc", 60, 20, half)).toEqual(["aa bb", "cc"]);
    expect(wrapGreedy("abcdefghijk", 100, 20, half)).toBeNull();
  });

  it("balances lines instead of leaving a lone word", () => {
    expect(wrapGreedy("aaaa bbbb cccc dddd e", 75, 10, half)).toEqual(["aaaa bbbb cccc", "dddd e"]);
    expect(wrapBalanced("aaaa bbbb cccc dddd e", 75, 10, half)).toEqual(["aaaa bbbb", "cccc dddd e"]);
    expect(wrapGreedy("This page has been quiet.", 100, 10, half)).toEqual(["This page has been", "quiet."]);
    expect(wrapBalanced("This page has been quiet.", 100, 10, half)).toEqual(["This page has", "been quiet."]);
  });

  it("uses typographic quotes", () => {
    expect(smartQuotes(`doesn't "app" 'quoted'`)).toBe("doesn’t “app” ‘quoted’");
  });
});

describe("sizes", () => {
  it("defaults to feed and rejects unknown sizes", () => {
    expect(parseSize(null)).toBe("feed");
    expect(parseSize("story")).toBe("story");
    expect(parseSize("poster")).toBeNull();
  });

  it("keeps stories clear of Instagram's top and bottom bars", () => {
    expect(contentBox("story").height).toBeLessThan(1920 - 2 * 250);
  });
});

describe("insightModel", () => {
  const post = basePost({
    visualTemplate: "INSIGHT-01",
    cta: "Follow along.",
    slides: [
      { title: "Short." },
      { title: "A much longer headline that needs several lines to fit", subtitle: "With support." },
      { title: "Last", items: ["One", "Two"] },
    ],
  });

  it("uses one headline size for every slide, fitted to the longest", () => {
    const slides = insightModel(post, "feed", fake);
    const sizes = new Set(slides.map((s) => s.text.title.fontSize));
    expect(sizes.size).toBe(1);
    expect([...sizes][0]).toBeLessThanOrEqual(TYPE.titleMax.feed);
    expect(slides.every((s) => !s.overflow)).toBe(true);
    // Every line fits the content width.
    const { width } = contentBox("feed");
    for (const s of slides) for (const line of s.text.title.lines) expect(half(line, s.text.title.fontSize)).toBeLessThanOrEqual(width);
  });

  it("counts slides and puts the CTA on the last one only", () => {
    const slides = insightModel(post, "square", fake);
    expect(slides.map((s) => s.counter)).toEqual(["1 / 3", "2 / 3", "3 / 3"]);
    expect(slides.map((s) => s.cta?.lines.join(" ") ?? null)).toEqual([null, null, "Follow along."]);
    expect(slides[2]!.text.items.map((b) => b.lines)).toEqual([["One"], ["Two"]]);
  });

  it("drops the counter on a single image", () => {
    const [only] = insightModel(basePost({ format: "Single image", slides: [{ title: "One idea." }] }), "feed", fake);
    expect(only?.counter).toBeNull();
    expect(only?.cta).not.toBeNull();
  });

  it("flags copy too long to fit at the smallest size", () => {
    const long = basePost({ slides: [{ title: "word ".repeat(400) }, { title: "ok" }] });
    const slides = insightModel(long, "square", fake);
    expect(slides[0]!.overflow).toBe(true);
    expect(slides[1]!.overflow).toBe(false);
  });
});

const kinds = (slides: SlideModel[]) => slides.map((s) => s.kind);

describe("bizModel", () => {
  const post = basePost({
    cta: "Is your business in this position?",
    slides: [
      { title: "Not every business needs a website." },
      { title: "1. Customers ask the same questions.", subtitle: "Hours. Prices." },
      { title: "2. People can't find you." },
      { title: "3. You send price lists on WhatsApp.", mark: "cross" },
      { title: "Three or more?" },
    ],
  });
  const slides = bizModel(post, "feed", fake);

  it("makes numbered slides signs and the rest statements", () => {
    expect(kinds(slides)).toEqual(["statement", "sign", "sign", "sign", "statement"]);
    const sign = slides[1]!;
    if (sign.kind !== "sign") throw new Error("expected a sign");
    expect(sign.number).toBe("01");
    // The number is drawn separately, not repeated in the headline.
    expect(sign.text.title.lines.join(" ")).toBe("Customers ask the same questions.");
  });

  it("fills the checklist up to the current sign, with each sign's mark", () => {
    const checklists = slides.flatMap((s) => (s.kind === "sign" ? [s.checklist] : []));
    expect(checklists.map((c) => c.map((x) => x.done))).toEqual([
      [true, false, false],
      [true, true, false],
      [true, true, true],
    ]);
    expect(checklists[0]!.map((x) => x.mark)).toEqual(["tick", "tick", "cross"]);
  });

  it("shares one headline size across statements and signs", () => {
    expect(new Set(slides.map((s) => s.text.title.fontSize)).size).toBe(1);
  });
});

describe("brandModel", () => {
  const post = basePost({
    visualTemplate: "BRAND-01",
    slides: [
      { title: "So what do you actually build?" },
      { title: "WEBSITES", subtitle: "Built for a phone on data." },
      { title: "Web applications", subtitle: "Systems that do something." },
      { title: "Not sure which one you need?" },
    ],
  });
  const slides = brandModel(post, "square", fake);

  it("recognises service slides and uses the service's display name", () => {
    expect(kinds(slides)).toEqual(["statement", "service", "service", "statement"]);
    expect(slides[1]!.text.title.lines.join(" ")).toBe("Websites");
  });

  it("shows the service grid on every slide, lit for the current service", () => {
    expect(slides.map((s) => s.grid?.active ?? null)).toEqual([null, "websites", "web-applications", null]);
    expect(slides.every((s) => s.grid !== null)).toBe(true);
  });

  it("leaves the grid off posts that list no services", () => {
    const plain = brandModel(basePost({ visualTemplate: "BRAND-01" }), "feed", fake);
    expect(plain.every((s) => s.grid === null)).toBe(true);
  });
});

describe("logo-reveal slides", () => {
  const post = basePost({ slides: [{ title: "PrimeCode has a new look." }, { title: "Meet the new logo.", logo: "full" }] });

  it("shows the logo on a panel in any template, sized to the logo's proportions", () => {
    for (const model of [insightModel, bizModel, brandModel]) {
      const slide = model(post, "feed", fake)[1]!;
      expect(slide.kind).toBe("logo");
      if (slide.kind !== "logo") continue;
      expect(slide.reveal.which).toBe("full");
      expect(slide.reveal.height / slide.reveal.width).toBeCloseTo(REVEAL.ratio.full, 2);
      expect(slide.reveal.width).toBeLessThan(slide.panel.width);
    }
  });

  it("uses the logo files' viewBox proportions", () => {
    for (const [which, file] of [["full", "logo.svg"], ["mark", "mark.svg"]] as const) {
      const [, , w, h] = /viewBox="([^"]+)"/.exec(readFileSync(`assets/brand/${file}`, "utf8"))![1]!.split(" ").map(Number);
      expect(REVEAL.ratio[which]).toBeCloseTo(h! / w!, 5);
    }
  });

  it("fits a reveal with a two-line headline and the CTA at every size", () => {
    const last = basePost({
      slides: [post.slides[0]!, { title: "Same PrimeCode. Now it looks like home.", logo: "mark" }],
    });
    for (const size of ["feed", "square", "story"] as const) expect(insightModel(last, size, fake).some((s) => s.overflow)).toBe(false);
  });
});
