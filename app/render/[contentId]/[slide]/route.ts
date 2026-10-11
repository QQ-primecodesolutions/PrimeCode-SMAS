import type { NextRequest } from "next/server";
import { isSignedIn } from "@/lib/auth";
import { renderSlide, TemplateNotBuiltError } from "@/lib/graphics/render";
import { parseSize } from "@/lib/graphics/sizes";
import { loadPost } from "@/lib/post/load";

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

/** GET /render/PC-2026-001/1.png?size=feed|square|story: one slide as a PNG, never cached. */
export async function GET(req: NextRequest, ctx: RouteContext<"/render/[contentId]/[slide]">) {
  if (!(await isSignedIn())) return text(401, "Sign in first.");
  const { contentId, slide } = await ctx.params;
  const size = parseSize(req.nextUrl.searchParams.get("size"));
  const n = /^(\d{1,2})\.png$/.exec(slide)?.[1];
  if (!size || !n) return text(400, "Use /render/<contentId>/<n>.png?size=feed|square|story");

  const post = await loadPost(contentId);
  if (!post) return text(404, `No post ${contentId}`);
  try {
    const png = await renderSlide(post, Number(n) - 1, size);
    if (!png) return text(404, `${contentId} has no slide ${n}`);
    return new Response(png as BodyInit, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    if (e instanceof TemplateNotBuiltError) return text(501, e.message);
    throw e;
  }
}
