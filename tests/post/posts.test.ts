import { describe, expect, it } from "vitest";
import { listPosts, loadPost } from "@/lib/post/load";

describe("content/posts", () => {
  it("every post file is valid, and ids are unique", async () => {
    const posts = await listPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(new Set(posts.map((p) => p.contentId)).size).toBe(posts.length);
  });

  it("client posts carry clientPermission", async () => {
    for (const id of ["PC-2026-004", "PC-2026-012", "PC-2026-016"]) {
      expect((await loadPost(id))?.clientPermission).toBeDefined();
    }
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await loadPost("PC-2026-999")).toBeNull();
    expect(await loadPost("../package")).toBeNull();
  });
});
