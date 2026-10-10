/**
 * Parses primecode-first-4-posts.md: the four posts written in full (slides, Instagram caption,
 * CTA, hashtags, Facebook variant, visual brief). Where it disagrees with the workbook, the md wins.
 */
import type { Slide } from "@/lib/post/schema";

export type FullPost = {
  contentId: string;
  slides: Slide[];
  caption: string;
  cta: string;
  hashtags: string[];
  /** The md's Facebook instruction and the paragraph it adds. */
  fbInstruction: string;
  fbAddition: string;
  visualBrief: string;
};

/** Removes markdown emphasis; Instagram and the slides show plain text. */
export const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");

/** The text under `### heading`, up to the next heading or rule. */
function section(block: string, heading: string): string {
  const m = new RegExp(`^### ${heading}\\s*\\n([\\s\\S]*?)(?=^###? |^---|$(?![\\s\\S]))`, "m").exec(block);
  if (!m) throw new Error(`Missing "### ${heading}"`);
  return m[1]!.trim();
}

const quoted = (s: string) =>
  s
    .split("\n")
    .filter((l) => l.startsWith(">"))
    .map((l) => l.replace(/^>\s?/, "").trim());

/** Slide lines → fields: line 1 is the title, a second line the subtitle, three or more lines a list. */
export function slideFromLines(lines: string[]): Slide {
  const [title, ...rest] = lines.map(plain).filter((l) => l && !/^\[.*\]$/.test(l));
  if (!title) throw new Error("Empty slide");
  if (rest.length === 0) return { title };
  if (rest.length === 1) return { title, subtitle: rest[0]! };
  return { title, items: rest };
}

export function parseFirstFour(md: string): FullPost[] {
  return md
    .split(/^## (?=PC-\d{4}-\d{3})/m)
    .slice(1)
    .map((block) => {
      const contentId = /^PC-\d{4}-\d{3}/.exec(block)![0];
      try {
        const slides = section(block, "Carousel slides")
          .split(/^\*\*Slide \d+\*\*\s*$/m)
          .slice(1)
          .map((s) => slideFromLines(quoted(s)));

        const ig = section(block, "Instagram caption");
        const cta = /^\*\*CTA:\*\*\s*(.+)$/m.exec(ig)?.[1];
        const tags = /^\*\*Hashtags:\*\*\s*(.+)$/m.exec(ig)?.[1];
        if (!cta || !tags) throw new Error("Instagram caption needs **CTA:** and **Hashtags:** lines");
        const caption = plain(ig.slice(0, ig.indexOf("**CTA:**")).trim());

        const fb = section(block, "Facebook variant");
        const fbInstruction = fb
          .split("\n")
          .filter((l) => l.trim() && !l.startsWith(">"))
          .join(" ")
          .trim();

        return {
          contentId,
          slides,
          caption,
          cta: plain(cta.trim()),
          hashtags: tags.trim().split(/\s+/),
          fbInstruction,
          fbAddition: plain(quoted(fb).join(" ")),
          visualBrief: section(block, "Visual brief").replace(/\s*\n\s*/g, " "),
        };
      } catch (e) {
        throw new Error(`${contentId}: ${(e as Error).message}`);
      }
    });
}

/** Caption paragraphs (separated by blank lines). */
export const paragraphs = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/**
 * The full Facebook caption, following the md's instruction for each post: the extra paragraph goes
 * before the sign-off (the last paragraph), or opens the post.
 */
export function facebookCaption(caption: string, addition: string, place: "beforeLast" | "first"): string {
  const ps = paragraphs(caption);
  if (place === "first") return [addition, ...ps].join("\n\n");
  return [...ps.slice(0, -1), addition, ...ps.slice(-1)].join("\n\n");
}
