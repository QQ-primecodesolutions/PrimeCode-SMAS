/** Output sizes. Every slide of a carousel is rendered at the same size (Instagram rejects mixed sizes). */
export const SLIDE_SIZES = {
  feed: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
} as const;

export type SlideSize = keyof typeof SLIDE_SIZES;

export const DEFAULT_SIZE: SlideSize = "feed";

export const SIZE_LABELS: Record<SlideSize, string> = {
  feed: "Feed 4:5",
  square: "Square 1:1",
  story: "Story 9:16",
};

export const isSlideSize = (s: unknown): s is SlideSize => typeof s === "string" && Object.hasOwn(SLIDE_SIZES, s);

/** `?size=` → a size; missing → the default; anything else → null. */
export function parseSize(value: string | null | undefined): SlideSize | null {
  if (value === null || value === undefined || value === "") return DEFAULT_SIZE;
  return isSlideSize(value) ? value : null;
}
