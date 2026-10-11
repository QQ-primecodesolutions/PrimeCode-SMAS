/**
 * One post = one file in content/posts/<contentId>.json. Field names match the workbook's Content
 * Calendar columns (camelCased), plus `slides`, `captionFB` and `clientPermission`.
 */
import { z } from "zod";
import { clientsNamedIn } from "./clients";
import { futureServicesIn } from "./services";
import { STATUSES, isApprovedOrLater, isEarly } from "./status";

export const TEMPLATES = [
  "TECH-01",
  "BIZ-01",
  "CODE-01",
  "PROJECT-01",
  "INSIGHT-01",
  "BRAND-01",
  "JOURNEY-01",
  "LOCAL-01",
] as const;
export type TemplateCode = (typeof TEMPLATES)[number];

export const SERIES = [
  "PrimeCode Explains",
  "Tech for Business",
  "Behind the Code",
  "Build With PrimeCode",
  "PrimeCode Insight",
  "PrimeCode Journey",
  "Digital Transformation in Qwaqwa",
  "PrimeCode Services",
] as const;

export const PILLARS = [
  "Founder / Brand",
  "Services",
  "Business Problems",
  "Projects",
  "Authority",
  "Education",
  "Community",
  "Behind the Code",
] as const;

/** Instagram's carousel limit. */
export const MAX_SLIDES = 20;

const text = z.string().trim().min(1);

/** A real calendar date, "YYYY-MM-DD" (dates are Africa/Johannesburg; no time part). */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((s) => new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), "Not a real date");

export const slideSchema = z.strictObject({
  title: text,
  subtitle: text.optional(),
  body: text.optional(),
  items: z.array(text).min(1).optional(),
  /** File under assets/ (e.g. "shots/thiboloha-home.png"), for photo and project templates. */
  asset: text.optional(),
  assetAlt: text.optional(),
  /** BIZ-01 numbered slides: a tick (a sign, a good practice) or a cross (a mistake). Default tick. */
  mark: z.enum(["tick", "cross"]).optional(),
});
export type Slide = z.infer<typeof slideSchema>;

/**
 * Written permission to name a client or show their site. "pending" lets the post be drafted and
 * previewed, but it can't be approved or exported until it's "given".
 */
export const clientPermissionSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("pending"), client: text }),
  z.strictObject({
    status: z.literal("given"),
    client: text,
    /** Who gave it: a name and role at the client. */
    givenBy: text,
    date: isoDate,
    /** Written permission only (Brand Brain: "written permission before naming a client"). */
    method: z.enum(["email", "WhatsApp", "letter", "signed form"]),
    /** Where the message or document is kept. */
    reference: text.optional(),
  }),
]);
export type ClientPermission = z.infer<typeof clientPermissionSchema>;

export const postSchema = z
  .strictObject({
    contentId: z.string().regex(/^PC-\d{4}-\d{3}$/, "Use PC-YYYY-NNN"),
    week: z.int().min(1),
    publishDate: isoDate,
    series: z.enum(SERIES),
    pillar: z.enum(PILLARS),
    topic: text,
    audience: text,
    objective: text,
    format: z.enum(["Carousel", "Single image"]),
    platform: z.enum(["IG + FB", "IG", "FB"]),
    hook: text,
    /** Instagram caption. Empty until drafted. */
    caption: z.string(),
    /** Full Facebook caption, when it differs from the Instagram one. */
    captionFB: text.optional(),
    cta: text,
    visualTemplate: z.enum(TEMPLATES),
    visualBrief: text,
    hashtags: z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u, "Hashtags look like #Word")).max(30),
    status: z.enum(STATUSES),
    notes: text.optional(),
    slides: z.array(slideSchema).min(1).max(MAX_SLIDES),
    clientPermission: clientPermissionSchema.optional(),
  })
  .superRefine((post, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

    if (post.format === "Single image" && post.slides.length !== 1)
      issue(["slides"], "A single-image post has exactly one slide");
    if (post.format === "Carousel" && post.slides.length < 2 && !isEarly(post.status))
      issue(["slides"], "A carousel needs at least two slides once it's past SELECTED");

    const named = clientsNamedIn(postTexts(post));
    const perm = post.clientPermission;
    if (!perm && post.visualTemplate === "PROJECT-01")
      issue(["clientPermission"], "PROJECT-01 shows a client's work: record clientPermission (pending or given)");
    if (!perm && named.length > 0)
      issue(["clientPermission"], `Names ${named.join(", ")}: record clientPermission (pending or given)`);
    if (post.visualTemplate === "BRAND-01") {
      const future = futureServicesIn(postTexts(post));
      if (future.length)
        issue(["slides"], `BRAND-01 lists only the four services we sell; remove ${future.join(", ")}`);
    }
    if (isApprovedOrLater(post.status) && placeholdersIn(post).length)
      issue(["status"], `Can't be ${post.status} with unconfirmed facts: ${placeholdersIn(post).join(" ")}`);
    if (perm?.status === "pending" && isApprovedOrLater(post.status))
      issue(["status"], `Can't be ${post.status} until written permission from ${perm.client} is recorded`);
  });

export type Post = z.infer<typeof postSchema>;

/**
 * Facts still to confirm, written as "[CONFIRM: …]" in drafts. A post with any can be previewed,
 * but not approved or exported.
 */
export function placeholdersIn(post: Pick<Post, "topic" | "hook" | "caption" | "captionFB" | "cta" | "slides">): string[] {
  return postTexts(post).flatMap((t) => t.match(/\[CONFIRM[^\]]*\]/g) ?? []);
}

/** Every piece of text a reader can see, for client-name checks. */
export function postTexts(post: Pick<Post, "topic" | "hook" | "caption" | "captionFB" | "cta" | "slides">): string[] {
  return [
    post.topic,
    post.hook,
    post.caption,
    post.captionFB ?? "",
    post.cta,
    ...post.slides.flatMap((s) => [s.title, s.subtitle ?? "", s.body ?? "", ...(s.items ?? []), s.assetAlt ?? ""]),
  ];
}
