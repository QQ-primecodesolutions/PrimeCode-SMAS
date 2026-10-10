import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { facebookCaption, parseFirstFour, slideFromLines } from "@/scripts/lib/first-four";
import { cellRef, readWorkbook, serialToIsoDate } from "@/scripts/lib/xlsx";

describe("xlsx reader", () => {
  it("converts Excel serial dates", () => {
    expect(serialToIsoDate(46259)).toBe("2026-08-25");
    expect(serialToIsoDate(45658)).toBe("2025-01-01");
  });

  it("parses cell references", () => {
    expect(cellRef("A1")).toEqual({ col: 0, row: 1 });
    expect(cellRef("T29")).toEqual({ col: 19, row: 29 });
    expect(cellRef("AA3")).toEqual({ col: 26, row: 3 });
  });

  it("reads the calendar workbook", () => {
    const sheets = readWorkbook(readFileSync("primecode-content-calendar.xlsx"));
    expect(sheets.map((s) => s.name)).toEqual([
      "Content Calendar",
      "Ideas Backlog",
      "Analytics",
      "Brand Knowledge",
      "Reference",
    ]);
    const cal = sheets[0]!.rows;
    expect(cal.get(5)?.slice(0, 3)).toEqual(["Content ID", "Week", "Publish Date"]);
    expect(cal.get(29)?.[0]).toBe("PC-2026-024");
  });
});

describe("first four posts", () => {
  const posts = parseFirstFour(readFileSync("primecode-first-4-posts.md", "utf8"));

  it("parses all four with their slides", () => {
    expect(posts.map((p) => [p.contentId, p.slides.length])).toEqual([
      ["PC-2026-001", 6],
      ["PC-2026-002", 6],
      ["PC-2026-003", 7],
      ["PC-2026-004", 6],
    ]);
    expect(posts[0]!.cta).toBe("Follow along. We post every Tuesday and Friday.");
    expect(posts[1]!.caption).not.toContain("**");
    expect(posts[1]!.slides[2]).toEqual({
      title: "WEB APPLICATIONS",
      subtitle: "Systems that do something. Bookings. Registrations. Dashboards.",
    });
  });

  it("maps slide lines to title, subtitle and items, dropping placeholders", () => {
    expect(slideFromLines(["Technology that solves real problems.", "[PrimeCode logo]"])).toEqual({
      title: "Technology that solves real problems.",
    });
    expect(slideFromLines(["From now on:", "Tuesdays", "Fridays"])).toEqual({
      title: "From now on:",
      items: ["Tuesdays", "Fridays"],
    });
  });

  it("puts the Facebook paragraph before the sign-off, or first", () => {
    expect(facebookCaption("A\n\nB\n\nSign off.", "Extra.", "beforeLast")).toBe("A\n\nB\n\nExtra.\n\nSign off.");
    expect(facebookCaption("A\n\nB", "Question?", "first")).toBe("Question?\n\nA\n\nB");
  });
});
