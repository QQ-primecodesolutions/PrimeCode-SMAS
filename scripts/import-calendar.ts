/**
 * One-off seed: primecode-content-calendar.xlsx + primecode-first-4-posts.md → content/posts/*.json.
 * After this, the post files are the source of truth; the xlsx stays as the archive.
 *
 *   pnpm import-calendar           # writes files that don't exist yet
 *   pnpm import-calendar --force    # overwrites existing post files
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { clientsNamedIn } from "@/lib/post/clients";
import { POSTS_DIR, writePostFile } from "@/lib/post/load";
import { type Post, postTexts } from "@/lib/post/schema";
import { facebookCaption, parseFirstFour } from "./lib/first-four";
import { readWorkbook, serialToIsoDate } from "./lib/xlsx";

const HEADERS = [
  "Content ID",
  "Week",
  "Publish Date",
  "Day",
  "Series",
  "Pillar",
  "Topic",
  "Audience",
  "Objective",
  "Format",
  "Platform",
  "Hook",
  "Caption",
  "CTA",
  "Visual Template",
  "Visual Brief",
  "Hashtags",
  "Status",
  "Published URL",
  "Notes",
] as const;

/**
 * Per-post decisions for the four posts written in full, where the md leaves something to judgement.
 * - fb: where the md's Facebook paragraph goes ("before the sign-off" → beforeLast; "Open with" → first).
 * - template/hook: PC-001 uses the typographic INSIGHT-01 design (its brief: dark background, one bold
 *   sentence per slide, no photo); its workbook hook contradicts the md slides, which win.
 */
const FIRST_FOUR: Record<
  string,
  { fb: "beforeLast" | "first"; template?: Post["visualTemplate"]; hook?: string; notes?: string }
> = {
  "PC-2026-001": {
    fb: "beforeLast",
    template: "INSIGHT-01",
    hook: "This page has been quiet. That wasn't neglect. We were building.",
    notes:
      "Rendered with INSIGHT-01 (typographic), not the photo-led JOURNEY-01. Verify before approving: 'most of them right here in Qwaqwa and the wider Free State'.",
  },
  "PC-2026-002": { fb: "beforeLast" },
  "PC-2026-003": {
    fb: "first",
    notes:
      "Facebook caption opens with the question, then the full Instagram caption (md: 'Open with ... Then the list').",
  },
  "PC-2026-004": {
    fb: "beforeLast",
    notes:
      "Needs written permission from Thiboloha Special School. On Facebook, tag the school's page if it has one. Verify before approving: 'Built and maintained by PrimeCode Solutions' (still maintaining?).",
  },
};

/** Claims flagged for checking on posts that are still ideas. */
const EXTRA_NOTES: Record<string, string> = {
  "PC-2026-011": "Illustrative only: must not read as BZ Fitness or any real client unless one has agreed.",
  "PC-2026-012": "Verify before approving: the business is in Tseki.",
  "PC-2026-020": "Use only performance figures that can be verified.",
};

async function main() {
  const force = process.argv.includes("--force");
  const sheets = readWorkbook(readFileSync("primecode-content-calendar.xlsx"));
  const sheet = sheets.find((s) => s.name === "Content Calendar");
  if (!sheet) throw new Error("No 'Content Calendar' sheet");

  const headerRow = [...sheet.rows].find(([, cells]) => cells[0] === "Content ID");
  if (!headerRow) throw new Error("No header row starting 'Content ID'");
  const [headerAt, header] = headerRow;
  HEADERS.forEach((h, i) => {
    if (header[i] !== h) throw new Error(`Column ${i + 1} is '${header[i]}', expected '${h}'`);
  });
  const col = (cells: string[], h: (typeof HEADERS)[number]) => (cells[HEADERS.indexOf(h)] ?? "").trim();

  const full = new Map(parseFirstFour(readFileSync("primecode-first-4-posts.md", "utf8")).map((p) => [p.contentId, p]));

  mkdirSync(POSTS_DIR, { recursive: true });
  let written = 0;
  let skipped = 0;
  const rows = [...sheet.rows].filter(([n, cells]) => n > headerAt && /^PC-\d{4}-\d{3}$/.test(cells[0] ?? ""));
  for (const [, cells] of rows) {
    const contentId = col(cells, "Content ID");
    const md = full.get(contentId);
    const decide = FIRST_FOUR[contentId];
    if (md && !decide) throw new Error(`${contentId} is written in full but has no FIRST_FOUR entry`);

    const post: Post = {
      contentId,
      week: Number(col(cells, "Week")),
      publishDate: serialToIsoDate(Number(col(cells, "Publish Date"))),
      series: col(cells, "Series") as Post["series"],
      pillar: col(cells, "Pillar") as Post["pillar"],
      topic: col(cells, "Topic"),
      audience: col(cells, "Audience"),
      objective: col(cells, "Objective"),
      format: col(cells, "Format") as Post["format"],
      platform: col(cells, "Platform") as Post["platform"],
      hook: decide?.hook ?? col(cells, "Hook"),
      caption: md?.caption ?? col(cells, "Caption"),
      ...(md && decide ? { captionFB: facebookCaption(md.caption, md.fbAddition, decide.fb) } : {}),
      cta: md?.cta ?? col(cells, "CTA"),
      visualTemplate: decide?.template ?? (col(cells, "Visual Template") as Post["visualTemplate"]),
      visualBrief: md?.visualBrief ?? col(cells, "Visual Brief"),
      hashtags: md?.hashtags ?? col(cells, "Hashtags").split(/\s+/).filter(Boolean),
      status: col(cells, "Status") as Post["status"],
      ...((): Pick<Post, "notes"> => {
        const notes = [col(cells, "Notes"), decide?.notes, EXTRA_NOTES[contentId]].filter(Boolean).join(" ");
        return notes ? { notes } : {};
      })(),
      // Until drafted, a post's only slide is its hook.
      slides: md?.slides ?? [{ title: col(cells, "Hook") }],
    };

    const named = clientsNamedIn(postTexts(post));
    if (post.visualTemplate === "PROJECT-01" && named.length === 0)
      throw new Error(`${contentId} is PROJECT-01 but names no known client; add it to lib/post/clients.ts`);
    if (named.length > 1) throw new Error(`${contentId} names several clients: ${named.join(", ")}`);
    if (named[0]) post.clientPermission = { status: "pending", client: named[0] };

    const file = join(POSTS_DIR, `${contentId}.json`);
    if (existsSync(file) && !force) {
      skipped++;
      continue;
    }
    await writePostFile(post);
    written++;
  }
  console.log(`${rows.length} posts in the calendar: ${written} written, ${skipped} already existed${skipped ? " (--force to overwrite)" : ""}.`);
}

await main();
