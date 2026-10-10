/**
 * Calendar dates. Posts go out on Tuesdays (value: education, business problems) and Fridays
 * (PrimeCode: projects, services, story). Dates are plain YYYY-MM-DD in Africa/Johannesburg.
 */

const DAY_MS = 86_400_000;

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** 0 = Sunday … 6 = Saturday. */
export const weekday = (iso: string) => new Date(toMs(iso)).getUTCDay();

export const addDays = (iso: string, days: number) => toIso(toMs(iso) + days * DAY_MS);

export type DateRange = { from: string; to: string };

const inRange = (iso: string, r: DateRange) => iso >= r.from && iso <= r.to;

/**
 * New dates for posts in order. Each post keeps its weekday (a Tuesday post stays on a Tuesday),
 * taking the next free slot on that weekday on or after the previous post's date. Days in `skip`
 * are never used.
 */
export function reschedule(
  posts: readonly { contentId: string; publishDate: string }[],
  from: string,
  skip: readonly DateRange[] = [],
): { contentId: string; publishDate: string; week: number }[] {
  let cursor = from;
  return posts.map((p) => {
    const day = weekday(p.publishDate);
    let d = cursor;
    while (weekday(d) !== day || skip.some((r) => inRange(d, r))) d = addDays(d, 1);
    cursor = addDays(d, 1);
    return { contentId: p.contentId, publishDate: d, week: Math.floor((toMs(d) - toMs(from)) / (7 * DAY_MS)) + 1 };
  });
}

/** "Tuesday 20 October 2026" in Africa/Johannesburg. */
export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "full" }): string {
  return new Intl.DateTimeFormat("en-ZA", { ...opts, timeZone: "Africa/Johannesburg" }).format(
    new Date(`${iso}T12:00:00+02:00`),
  );
}
