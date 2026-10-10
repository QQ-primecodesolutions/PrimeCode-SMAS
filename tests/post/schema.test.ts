import { describe, expect, it } from "vitest";
import { postSchema } from "@/lib/post/schema";
import { basePost } from "./fixtures";

const errors = (post: unknown) => {
  const r = postSchema.safeParse(post);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("postSchema", () => {
  it("accepts a valid post", () => {
    expect(errors(basePost())).toEqual([]);
  });

  it("rejects unknown fields, bad ids, dates and hashtags", () => {
    expect(errors({ ...basePost(), extra: 1 })).not.toEqual([]);
    expect(errors(basePost({ contentId: "PC-26-1" }))).toEqual([expect.stringMatching(/^contentId/)]);
    expect(errors(basePost({ publishDate: "2026-02-30" }))).toEqual([expect.stringMatching(/^publishDate/)]);
    expect(errors(basePost({ hashtags: ["PrimeCode"] }))).toEqual([expect.stringMatching(/^hashtags/)]);
  });

  it("checks slide counts against the format", () => {
    expect(errors(basePost({ format: "Single image" }))).toEqual([expect.stringMatching(/exactly one slide/)]);
    expect(errors(basePost({ format: "Single image", slides: [{ title: "One" }] }))).toEqual([]);
    expect(errors(basePost({ slides: [{ title: "One" }] }))).toEqual([expect.stringMatching(/at least two slides/)]);
    // An idea's only slide is its hook.
    expect(errors(basePost({ status: "IDEA", slides: [{ title: "One" }] }))).toEqual([]);
    expect(errors(basePost({ slides: Array.from({ length: 21 }, () => ({ title: "x" })) }))).not.toEqual([]);
  });

  it("refuses a post that names a client without clientPermission", () => {
    for (const topic of ["Behind the Build: Thiboloha Special School", "Built for bz fitness", "Deliwe's new site"]) {
      expect(errors(basePost({ topic }))).toEqual([expect.stringMatching(/^clientPermission: Names/)]);
    }
    const slides = [{ title: "One" }, { title: "Two", items: ["Borotho Tafoleng"] }];
    expect(errors(basePost({ slides }))).toEqual([expect.stringMatching(/Borotho Tafoleng/)]);
  });

  it("refuses PROJECT-01 without clientPermission, even if no client is named", () => {
    expect(errors(basePost({ visualTemplate: "PROJECT-01" }))).toEqual([
      expect.stringMatching(/^clientPermission: PROJECT-01/),
    ]);
  });

  it("lets a pending permission be drafted but not approved", () => {
    const pending = {
      topic: "Thiboloha",
      clientPermission: { status: "pending", client: "Thiboloha Special School" },
    } as const;
    expect(errors(basePost({ ...pending, status: "HUMAN_REVIEW" }))).toEqual([]);
    for (const status of ["APPROVED", "SCHEDULED", "PUBLISHED"] as const)
      expect(errors(basePost({ ...pending, status }))).toEqual([expect.stringMatching(/^status: Can.t be/)]);
  });

  it("approves a client post once written permission is recorded", () => {
    const given = {
      status: "given",
      client: "Thiboloha Special School",
      givenBy: "The principal",
      date: "2026-10-12",
      method: "email",
    } as const;
    expect(errors(basePost({ topic: "Thiboloha", status: "APPROVED", clientPermission: given }))).toEqual([]);
    // Spoken permission isn't written permission.
    const spoken = { ...given, method: "phone" as never };
    expect(errors(basePost({ topic: "Thiboloha", clientPermission: spoken }))).not.toEqual([]);
  });
});
