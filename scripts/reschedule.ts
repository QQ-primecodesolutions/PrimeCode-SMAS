/**
 * Proposes new publish dates for the posts in content/posts/, in order, keeping each post's
 * Tuesday/Friday slot. Prints the plan; writes it only with --write.
 *
 *   pnpm reschedule --from 2026-10-20 --skip 2026-12-22..2027-01-04 [--write]
 */
import { listPosts, writePostFile } from "@/lib/post/load";
import { formatDate, reschedule } from "@/lib/post/schedule";
import { isApprovedOrLater } from "@/lib/post/status";

function arg(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === `--${name}` && process.argv[i + 1]) out.push(process.argv[i + 1]!);
  });
  return out;
}

const from = arg("from")[0];
if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new Error("Pass --from YYYY-MM-DD");
const skip = arg("skip").map((s) => {
  const m = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/.exec(s);
  if (!m) throw new Error(`--skip ${s}: use YYYY-MM-DD..YYYY-MM-DD`);
  return { from: m[1]!, to: m[2]! };
});

const posts = await listPosts();
const done = posts.filter((p) => isApprovedOrLater(p.status) && p.status !== "APPROVED");
if (done.length) throw new Error(`Already scheduled or published: ${done.map((p) => p.contentId).join(", ")}`);

const plan = reschedule(posts, from, skip);
for (const [i, p] of plan.entries()) {
  const post = posts[i]!;
  console.log(
    `${p.contentId}  wk ${String(p.week).padStart(2)}  ${formatDate(p.publishDate).padEnd(28)} (was ${post.publishDate})  ${post.visualTemplate.padEnd(10)} ${post.topic}`,
  );
}

if (process.argv.includes("--write")) {
  for (const [i, p] of plan.entries()) await writePostFile({ ...posts[i]!, publishDate: p.publishDate, week: p.week });
  console.log(`\nWrote ${plan.length} post files.`);
} else console.log("\nDry run. Add --write to save these dates.");
