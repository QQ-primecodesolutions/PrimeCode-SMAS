import { describe, expect, it } from "vitest";
import { loadMedia } from "@/lib/graphics/assets";
import { imageSize } from "@/lib/graphics/images";
import type { Measure } from "@/lib/graphics/metrics";
import { DEVICE, type Measures, deviceGeometry, projectKind, projectModel } from "@/lib/graphics/model";
import { postSchema, placeholdersIn } from "@/lib/post/schema";
import { basePost } from "../post/fixtures";

const half: Measure = (text, size) => [...text].length * 0.5 * size;
const fake: Measures = { title: half, body: half, strong: half };

function png(width: number, height: number): Uint8Array {
  const b = new Uint8Array(33);
  const v = new DataView(b.buffer);
  v.setUint32(0, 0x89504e47);
  v.setUint32(4, 0x0d0a1a0a);
  v.setUint32(16, width);
  v.setUint32(20, height);
  return b;
}

function jpeg(width: number, height: number): Uint8Array {
  // SOI, an APP0 segment to skip, then SOF0 with the size.
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
    0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x03, 0, 0, 0, 0, 0, 0,
  ]);
}

describe("imageSize", () => {
  it("reads PNG and JPEG sizes from their headers", () => {
    expect(imageSize(png(1080, 2340))).toEqual({ width: 1080, height: 2340, type: "png" });
    expect(imageSize(jpeg(1920, 1200))).toEqual({ width: 1920, height: 1200, type: "jpeg" });
    expect(imageSize(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});

describe("loadMedia", () => {
  it("returns null for a missing file and refuses paths outside assets/", async () => {
    expect(await loadMedia("shots/does-not-exist.png")).toBeNull();
    await expect(loadMedia("../package.json")).rejects.toThrow(/outside assets/);
  });
});

describe("deviceGeometry", () => {
  const media = { src: "data:", width: 1080, height: 2340 };

  it("fits a phone to the height with phone proportions, covering the screen", () => {
    const d = deviceGeometry("phone", 420, 900, "shots/x.png", media);
    expect(d.height).toBe(420);
    expect(d.screen.width / d.screen.height).toBeCloseTo(DEVICE.phoneScreen, 2);
    expect(d.image!.width).toBeGreaterThanOrEqual(d.screen.width);
    expect(d.image!.height).toBeGreaterThanOrEqual(d.screen.height);
  });

  it("shrinks a laptop to the available width", () => {
    const d = deviceGeometry("laptop", 700, 600, "shots/x.png", null);
    expect(d.width).toBeLessThanOrEqual(600);
    expect(d.lid!.width).toBeLessThan(d.base!.width);
    expect(d.image).toBeNull();
  });
});

describe("projectKind", () => {
  const media = new Map([
    ["shots/a-desktop.png", { src: "data:", width: 1920, height: 1200 }],
    ["shots/b.png", { src: "data:", width: 1080, height: 2340 }],
  ]);

  it("turns a short title over a subtitle into a section label", () => {
    expect(projectKind({ title: "THE PROBLEM", subtitle: "Too much to say." }, media)).toEqual({
      kind: "statement",
      label: "THE PROBLEM",
      title: "Too much to say.",
      supporting: "",
    });
    expect(projectKind({ title: "Programmes. Admissions. News. Achievements. Contact.", subtitle: "x" }, media)).toEqual({
      kind: "statement",
    });
  });

  it("picks a laptop for landscape shots and a phone for portrait ones", () => {
    const model = projectModel(
      basePost({
        visualTemplate: "PROJECT-01",
        clientPermission: { status: "pending", client: "Example" },
        slides: [
          { title: "One", asset: "shots/a-desktop.png" },
          { title: "Two", asset: "shots/b.png" },
          { title: "Three", asset: "shots/missing-phone.png" },
        ],
      }),
      "feed",
      fake,
      media,
    );
    expect(model.map((s) => (s.kind === "device" ? s.device.type : s.kind))).toEqual(["laptop", "phone", "phone"]);
    const missing = model[2]!;
    expect(missing.kind === "device" && missing.device.image).toBe(null);
  });
});

describe("[CONFIRM] placeholders", () => {
  const draft = basePost({ caption: "We built it [CONFIRM: in Tseki?].", slides: [{ title: "A" }, { title: "[CONFIRM: result]" }] });

  it("finds them in captions and slides", () => {
    expect(placeholdersIn(draft)).toEqual(["[CONFIRM: in Tseki?]", "[CONFIRM: result]"]);
  });

  it("allows them in drafts but blocks approval", () => {
    expect(postSchema.safeParse(draft).success).toBe(true);
    expect(postSchema.safeParse({ ...draft, status: "APPROVED" }).success).toBe(false);
  });
});
