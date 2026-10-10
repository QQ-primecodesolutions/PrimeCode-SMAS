/**
 * Reads post files from content/posts/. Read-only: the web app never writes files (it should be
 * able to move to Vercel unchanged). Scripts write posts with `writePostFile`.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { type Post, postSchema } from "./schema";

export const POSTS_DIR = join(process.cwd(), "content/posts");

const ID = /^PC-\d{4}-\d{3}$/;

export class PostError extends Error {
  override name = "PostError";
}

/** Validates parsed JSON. Errors name the file and every bad field. */
export function parsePost(json: unknown, file: string): Post {
  const result = postSchema.safeParse(json);
  if (result.success) return result.data;
  throw new PostError(`${file} is not a valid post:\n${z.prettifyError(result.error)}`);
}

export async function loadPost(contentId: string, dir = POSTS_DIR): Promise<Post | null> {
  if (!ID.test(contentId)) return null;
  const file = join(dir, `${contentId}.json`);
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
  const post = parsePost(JSON.parse(raw), file);
  if (post.contentId !== contentId) throw new PostError(`${file} has contentId ${post.contentId}`);
  return post;
}

/** Every post, by publish date then id. Throws on the first invalid file. */
export async function listPosts(dir = POSTS_DIR): Promise<Post[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const posts = await Promise.all(
    files.map(async (f) => {
      const post = parsePost(JSON.parse(await readFile(join(dir, f), "utf8")), join(dir, f));
      if (`${post.contentId}.json` !== f) throw new PostError(`${f} has contentId ${post.contentId}`);
      return post;
    }),
  );
  return posts.sort((a, b) => a.publishDate.localeCompare(b.publishDate) || a.contentId.localeCompare(b.contentId));
}

/** Validates, then writes a post file (scripts only). Two-space JSON with a trailing newline. */
export async function writePostFile(post: Post, dir = POSTS_DIR): Promise<string> {
  const valid = parsePost(post, `${post.contentId}.json`);
  const file = join(dir, `${valid.contentId}.json`);
  await writeFile(file, `${JSON.stringify(valid, null, 2)}\n`, "utf8");
  return file;
}
