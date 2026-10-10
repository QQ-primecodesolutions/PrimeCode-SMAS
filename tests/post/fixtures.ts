import type { Post } from "@/lib/post/schema";

/** A valid post to vary in tests. */
export const basePost = (over: Partial<Post> = {}): Post => ({
  contentId: "PC-2026-099",
  week: 1,
  publishDate: "2026-10-20",
  series: "Tech for Business",
  pillar: "Business Problems",
  topic: "A topic",
  audience: "Local SMEs",
  objective: "Teach something",
  format: "Carousel",
  platform: "IG + FB",
  hook: "A hook.",
  caption: "",
  cta: "Save this for later.",
  visualTemplate: "BIZ-01",
  visualBrief: "A brief.",
  hashtags: ["#PrimeCodeSolutions"],
  status: "DRAFT",
  slides: [{ title: "One" }, { title: "Two" }],
  ...over,
});
