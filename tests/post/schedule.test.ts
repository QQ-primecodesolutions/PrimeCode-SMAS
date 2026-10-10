import { describe, expect, it } from "vitest";
import { formatDate, reschedule, weekday } from "@/lib/post/schedule";

const TUE = 2;
const FRI = 5;

describe("reschedule", () => {
  // Alternating Tuesday/Friday posts, as in the calendar.
  const posts = Array.from({ length: 24 }, (_, i) => ({
    contentId: `PC-2026-${String(i + 1).padStart(3, "0")}`,
    publishDate: i % 2 === 0 ? "2026-08-25" : "2026-08-28",
  }));

  it("keeps the order and each post's weekday", () => {
    const plan = reschedule(posts, "2026-10-20");
    expect(plan.map((p) => p.contentId)).toEqual(posts.map((p) => p.contentId));
    plan.forEach((p, i) => expect(weekday(p.publishDate)).toBe(i % 2 === 0 ? TUE : FRI));
    expect(plan.slice(0, 3).map((p) => [p.publishDate, p.week])).toEqual([
      ["2026-10-20", 1],
      ["2026-10-23", 1],
      ["2026-10-27", 2],
    ]);
  });

  it("skips a holiday range without breaking the Tuesday/Friday pattern", () => {
    const plan = reschedule(posts, "2026-10-20", [{ from: "2026-12-22", to: "2027-01-04" }]);
    const dates = plan.map((p) => p.publishDate);
    expect(dates.filter((d) => d >= "2026-12-22" && d <= "2027-01-04")).toEqual([]);
    expect(dates.slice(17, 19)).toEqual(["2026-12-18", "2027-01-05"]);
    expect(dates.at(-1)).toBe("2027-01-22");
    plan.forEach((p, i) => expect(weekday(p.publishDate)).toBe(i % 2 === 0 ? TUE : FRI));
  });

  it("moves a Friday post to the next Friday when the calendar starts on a Tuesday", () => {
    const [p] = reschedule([{ contentId: "PC-2026-002", publishDate: "2026-08-28" }], "2026-10-20");
    expect(p?.publishDate).toBe("2026-10-23");
  });
});

describe("formatDate", () => {
  it("formats in Africa/Johannesburg", () => {
    expect(formatDate("2026-10-20")).toMatch(/Tuesday,? 20 October 2026/);
  });
});
