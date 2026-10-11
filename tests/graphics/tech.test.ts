import { describe, expect, it } from "vitest";
import { highlightLines, tokenize } from "@/lib/graphics/code";
import type { Measure } from "@/lib/graphics/metrics";
import { CODE, DIAGRAM, type Measures, type SlideModel, techModel } from "@/lib/graphics/model";
import { postSchema } from "@/lib/post/schema";
import { basePost } from "../post/fixtures";

const half: Measure = (text, size) => [...text].length * 0.5 * size;
const fake: Measures = { title: half, body: half, strong: half };

/** Non-whitespace tokens as "kind:text". */
const kinds = (source: string, language: Parameters<typeof tokenize>[1]) =>
  tokenize(source, language)
    .filter((t) => t.text.trim())
    .map((t) => `${t.kind}:${t.text.trim()}`);

describe("tokenize", () => {
  it("colours HTML tags, attributes and values, including bare attributes", () => {
    expect(kinds('<input type="email" required>', "html")).toEqual([
      "tag:<input",
      "attr:type",
      "punct:=",
      'string:"email"',
      "attr:required",
      "tag:>",
    ]);
    expect(kinds("<p>Hello there</p>", "html")).toEqual(["tag:<p", "tag:>", "plain:Hello there", "tag:</p", "tag:>"]);
  });

  it("colours JS/TS keywords, strings, calls and comments", () => {
    expect(kinds('const x = get("a"); // note', "ts")).toEqual([
      "keyword:const",
      "plain:x",
      "punct:=",
      "function:get",
      "punct:(",
      'string:"a"',
      "punct:);",
      "comment:// note",
    ]);
    // A keyword inside a longer name is just a name.
    expect(kinds("constant", "js")).toEqual(["plain:constant"]);
  });

  it("colours SQL keywords case-insensitively and parameters as values", () => {
    expect(kinds("insert INTO t VALUES ($1)", "sql")).toEqual([
      "keyword:insert",
      "keyword:INTO",
      "plain:t",
      "keyword:VALUES",
      "punct:(",
      "number:$1",
      "punct:)",
    ]);
  });

  it("tells JSON keys from string values", () => {
    expect(kinds('{"a": "b", "n": 1}', "json")).toEqual([
      "punct:{",
      'attr:"a"',
      "punct::",
      'string:"b"',
      "punct:,",
      'attr:"n"',
      "punct::",
      "number:1",
      "punct:}",
    ]);
  });

  it("splits into lines, keeps indentation and merges neighbours", () => {
    const lines = highlightLines("/* a\n b */\n\tx", "js");
    expect(lines.map((l) => l.map((t) => [t.kind, t.text]))).toEqual([
      [["comment", "/* a"]],
      [["comment", " b */"]],
      [["plain", "  x"]],
    ]);
  });
});

const kindOf = (slides: SlideModel[]) => slides.map((s) => s.kind);

describe("techModel", () => {
  const post = basePost({
    visualTemplate: "TECH-01",
    slides: [
      { title: "What is an API?" },
      {
        title: "Two systems",
        diagram: { type: "flow", steps: [{ label: "Your website", via: "API" }, { label: "Payments" }] },
      },
      {
        title: "A flow",
        diagram: { type: "flow", steps: [{ label: "A" }, { label: "B" }, { label: "C" }, { label: "D" }] },
      },
      {
        title: "Compared",
        diagram: {
          type: "columns",
          columns: [
            { heading: "Website", items: ["Tells people about you"] },
            { heading: "Web app", items: ["Runs part of your business", "Bookings, logins"] },
          ],
        },
      },
      { title: "Some code", code: { language: "ts", source: "const a = 1;" } },
    ],
  });
  const slides = techModel(post, "feed", fake);

  it("gives each slide the kind its visual asks for, with the logo bottom-right on TECH-01", () => {
    expect(kindOf(slides)).toEqual(["statement", "diagram", "diagram", "diagram", "code"]);
    expect(slides.every((s) => s.logo === "bottom")).toBe(true);
    expect(techModel({ ...post, visualTemplate: "CODE-01" }, "feed", fake)[0]!.logo).toBe("top");
  });

  it("lays short flows out in a row and longer ones in a column", () => {
    const [, two, four] = slides;
    if (two?.kind !== "diagram" || four?.kind !== "diagram") throw new Error("expected diagrams");
    expect(two.diagram.type === "flow" && two.diagram.direction).toBe("row");
    expect(four.diagram.type === "flow" && four.diagram.direction).toBe("column");
    // A labelled arrow is at least as wide as its label.
    expect(two.diagram.type === "flow" && two.diagram.arrow).toBeGreaterThanOrEqual(DIAGRAM.arrow);
  });

  it("gives comparison columns equal heights", () => {
    const cols = slides[3]!;
    if (cols.kind !== "diagram" || cols.diagram.type !== "columns") throw new Error("expected columns");
    expect(new Set(cols.diagram.columns.map((c) => c.height)).size).toBe(1);
  });

  it("sizes code to fit the panel, never below the minimum", () => {
    const code = slides[4]!;
    if (code.kind !== "code") throw new Error("expected code");
    expect(code.code.fontSize).toBe(CODE.max);
    const long = basePost({
      visualTemplate: "CODE-01",
      slides: [{ title: "x" }, { title: "Long", code: { language: "text", source: "x".repeat(120) } }],
    });
    const [, wide] = techModel(long, "feed", fake);
    expect(wide!.overflow).toBe(true);
    expect(wide!.kind === "code" && wide!.code.fontSize).toBe(CODE.min);
  });
});

describe("slide visuals", () => {
  it("allows one visual per slide", () => {
    const slide = {
      title: "Both",
      asset: "shots/x.png",
      code: { language: "text" as const, source: "x" },
    };
    expect(postSchema.safeParse(basePost({ slides: [slide, { title: "B" }] })).success).toBe(false);
  });

  it("keeps diagrams small enough to read", () => {
    const steps = Array.from({ length: 7 }, (_, i) => ({ label: `Step ${i}` }));
    const slides = [{ title: "A", diagram: { type: "flow" as const, steps } }, { title: "B" }];
    expect(postSchema.safeParse(basePost({ slides })).success).toBe(false);
  });
});
