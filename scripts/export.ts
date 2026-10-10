/**
 * Exports posts as publish-ready files for Meta Business Suite:
 *
 *   pnpm export PC-2026-005 [PC-2026-006 ...] [--size feed|square|story]
 *
 * writes out/<id>/ (or out/<id>/<size>/ for non-feed sizes):
 *   01.png … NN.png, caption-instagram.txt, caption-facebook.txt, hashtags.txt
 *
 * Refuses posts whose client permission is pending or whose template isn't built yet, and warns
 * loudly on anything not yet APPROVED.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadPost } from "@/lib/post/load";
import { isTemplateBuilt, slideViews, toPng } from "@/lib/graphics/render";
import { DEFAULT_SIZE, parseSize } from "@/lib/graphics/sizes";
import { isCleared } from "@/lib/post/status";

const RED = "\x1b[41m\x1b[97m\x1b[1m";
const YELLOW = "\x1b[43m\x1b[30m\x1b[1m";
const RESET = "\x1b[0m";
const banner = (colour: string, text: string) => console.log(`\n${colour}  ${text}  ${RESET}`);

const args = process.argv.slice(2);
const sizeAt = args.indexOf("--size");
const size = parseSize(sizeAt >= 0 ? args[sizeAt + 1] : undefined);
if (!size) throw new Error("--size must be feed, square or story");
const ids = args.filter((a, i) => !a.startsWith("--") && (sizeAt < 0 || i !== sizeAt + 1));
if (ids.length === 0) {
  console.error("Usage: pnpm export PC-2026-005 [more ids] [--size feed|square|story]");
  process.exit(1);
}

let failed = false;
for (const id of ids) {
  const post = await loadPost(id);
  if (!post) {
    banner(RED, `${id}: no such post in content/posts/`);
    failed = true;
    continue;
  }
  if (post.clientPermission?.status === "pending") {
    banner(RED, `${id}: NOT EXPORTED. Written permission from ${post.clientPermission.client} isn't recorded yet.`);
    failed = true;
    continue;
  }
  if (!isTemplateBuilt(post.visualTemplate)) {
    banner(RED, `${id}: NOT EXPORTED. Template ${post.visualTemplate} isn't built yet.`);
    failed = true;
    continue;
  }

  const dir = join(process.cwd(), "out", id, ...(size === DEFAULT_SIZE ? [] : [size]));
  await mkdir(dir, { recursive: true });
  // Clear old slides so a shorter carousel doesn't leave stale images behind.
  for (const f of await readdir(dir)) if (/^\d+\.png$/.test(f)) await rm(join(dir, f));

  const views = await slideViews(post, size);
  for (const [i, view] of views.entries()) {
    await writeFile(join(dir, `${String(i + 1).padStart(2, "0")}.png`), await toPng(view.element, size));
  }
  await writeFile(join(dir, "caption-instagram.txt"), `${post.caption}\n`);
  await writeFile(join(dir, "caption-facebook.txt"), `${post.captionFB ?? post.caption}\n`);
  await writeFile(join(dir, "hashtags.txt"), `${post.hashtags.join(" ")}\n`);

  console.log(`\n${id} → ${dir}  (${views.length} slide${views.length === 1 ? "" : "s"}, ${size})`);
  const warnings = [
    ...views.flatMap((v) => v.warnings),
    ...(post.caption.trim() ? [] : ["The Instagram caption is empty."]),
  ];
  for (const w of warnings) console.log(`  ! ${w}`);
  if (!isCleared(post.status))
    banner(YELLOW, `${id} is ${post.status}, not APPROVED. Don't load it into Meta Business Suite yet.`);
}
process.exit(failed ? 1 : 0);
