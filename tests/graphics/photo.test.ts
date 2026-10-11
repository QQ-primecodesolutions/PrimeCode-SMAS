import { describe, expect, it } from "vitest";
import type { Measure } from "@/lib/graphics/metrics";
import { ILLUSTRATIVE, type Measures, PHOTO, coverPhoto, journeyModel, localModel } from "@/lib/graphics/model";
import { slideViews } from "@/lib/graphics/render";
import { postSchema } from "@/lib/post/schema";
import { basePost } from "../post/fixtures";

const half: Measure = (text, size) => [...text].length * 0.5 * size;
const fake: Measures = { title: half, body: half, strong: half };
const photo = { src: "data:", width: 1600, height: 2000 };

describe("coverPhoto", () => {
  it("covers the slide and centres the crop", () => {
    const p = coverPhoto(photo, 1080, 1920);
    expect(p.height).toBe(1920);
    expect(p.width).toBeGreaterThanOrEqual(1080);
    expect(p.left).toBe(Math.round((1080 - p.width) / 2));
    expect(p.top).toBe(0);
  });
});

describe("journeyModel", () => {
  const post = basePost({
    visualTemplate: "JOURNEY-01",
    format: "Single image",
    slides: [{ title: "The hardest part of this work has never been the code.", asset: "photos/a.jpg" }],
  });

  it("puts the photo behind the text, with a smaller headline so the photo shows", () => {
    const [slide] = journeyModel(post, "feed", fake, new Map([["photos/a.jpg", photo]]));
    if (slide?.kind !== "photo") throw new Error("expected a photo slide");
    expect(slide.photo).not.toBeNull();
    expect(slide.text.title.fontSize).toBeLessThanOrEqual(PHOTO.titleMax.feed);
    expect(slide.cta).not.toBeNull();
  });

  it("shows a placeholder for a missing photo, and the export is blocked", async () => {
    const [slide] = journeyModel(post, "feed", fake, new Map());
    expect(slide?.kind === "photo" && slide.photo).toBeNull();
    const views = await slideViews(post, "feed");
    expect(views[0]!.missing).toEqual(["photos/a.jpg"]);
  });
});

describe("localModel", () => {
  const post = basePost({
    visualTemplate: "LOCAL-01",
    series: "Digital Transformation in Qwaqwa",
    slides: [
      { title: "What if your local gym had online membership?", asset: "photos/street.jpg" },
      { title: "1. Bookings by WhatsApp" },
      {
        title: "Before and after",
        diagram: {
          type: "columns",
          columns: [
            { heading: "Today", items: ["Paper"] },
            { heading: "What if", items: ["Phones"] },
          ],
        },
      },
      { title: "Which business next?" },
    ],
  });

  it("badges every slide as an illustrative concept", () => {
    const slides = localModel(post, "feed", fake, new Map([["photos/street.jpg", photo]]));
    expect(slides.map((s) => s.kind)).toEqual(["photo", "sign", "diagram", "statement"]);
    expect(slides.every((s) => s.badge === ILLUSTRATIVE)).toBe(true);
  });

  it("refuses a LOCAL-01 post that names or features a real client", () => {
    expect(postSchema.safeParse(post).success).toBe(true);
    const named = { ...post, slides: [{ title: "BZ Fitness, reimagined" }, { title: "Two" }] };
    expect(postSchema.safeParse(named).success).toBe(false);
    const featured = { ...post, clientPermission: { status: "pending", client: "Someone" } };
    expect(postSchema.safeParse(featured).success).toBe(false);
  });
});
