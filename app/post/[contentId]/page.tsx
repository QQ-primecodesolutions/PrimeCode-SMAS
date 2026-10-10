import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isTemplateBuilt, renderToken, slideViews } from "@/lib/graphics/render";
import { DEFAULT_SIZE, SIZE_LABELS, SLIDE_SIZES, isSlideSize, type SlideSize } from "@/lib/graphics/sizes";
import { listPosts } from "@/lib/post/load";
import { formatDate } from "@/lib/post/schedule";
import { isCleared } from "@/lib/post/status";
import { StatusBadge } from "../../status-badge";

/** Phone-sized preview width in CSS px. */
const PREVIEW_WIDTH = 300;

export default async function PostPage(props: PageProps<"/post/[contentId]">) {
  await connection();
  const { contentId } = await props.params;
  const query = await props.searchParams;
  const size: SlideSize = isSlideSize(query.size) ? query.size : DEFAULT_SIZE;

  const posts = await listPosts();
  const at = posts.findIndex((p) => p.contentId === contentId);
  const post = posts[at];
  if (!post) notFound();
  const prev = posts[at - 1];
  const next = posts[at + 1];

  const built = isTemplateBuilt(post.visualTemplate);
  const views = built ? await slideViews(post, size) : [];
  const warnings = [
    ...(post.clientPermission?.status === "pending"
      ? [`Written permission from ${post.clientPermission.client} isn't recorded. This post can't be approved or exported.`]
      : []),
    ...(built ? [] : [`Template ${post.visualTemplate} isn't built yet.`]),
    ...views.flatMap((v) => v.warnings),
    ...(post.caption.trim() ? [] : ["The Instagram caption is empty."]),
    ...(isCleared(post.status) ? [] : [`Status is ${post.status}: not cleared for Meta Business Suite until APPROVED.`]),
  ];
  // Changes when the post or the rendering code changes, so the browser refetches the slides.
  const v = renderToken(post);
  const { width, height } = SLIDE_SIZES[size];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <nav className="mb-4 flex justify-between text-sm">
        <Link href="/" className="text-primary hover:underline">
          ← All posts
        </Link>
        <span className="space-x-4">
          {prev ? (
            <Link href={`/post/${prev.contentId}?size=${size}`} className="text-primary hover:underline">
              ← {prev.contentId}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/post/${next.contentId}?size=${size}`} className="text-primary hover:underline">
              {next.contentId} →
            </Link>
          ) : null}
        </span>
      </nav>

      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-bold">{post.contentId}</h1>
          <StatusBadge status={post.status} />
          <span className="text-text-secondary">{formatDate(post.publishDate)}</span>
        </div>
        <p className="mt-1 text-lg font-semibold">{post.topic}</p>
        <p className="text-sm text-text-secondary">
          {post.series} · {post.pillar} · <span className="font-mono">{post.visualTemplate}</span> · {post.format} ·{" "}
          {post.platform}
        </p>
      </header>

      {warnings.length ? (
        <ul className="mb-4 list-disc rounded border border-amber-300 bg-amber-50 py-2 pr-3 pl-8 text-sm text-amber-900">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="mb-3 flex gap-2 text-sm">
        {(Object.keys(SLIDE_SIZES) as SlideSize[]).map((s) => (
          <Link
            key={s}
            href={`/post/${post.contentId}?size=${s}`}
            className={`rounded border px-3 py-1 ${s === size ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary"}`}
          >
            {SIZE_LABELS[s]}
          </Link>
        ))}
      </div>

      {built ? (
        <div className="mb-8 flex gap-4 overflow-x-auto pb-3">
          {views.map((_, i) => (
            <a
              key={i}
              href={`/render/${post.contentId}/${i + 1}.png?size=${size}`}
              target="_blank"
              className="shrink-0"
              title="Open full size"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a dynamic PNG from our own route */}
              <img
                src={`/render/${post.contentId}/${i + 1}.png?size=${size}&v=${v}`}
                alt={`Slide ${i + 1}: ${post.slides[i]?.title ?? ""}`}
                width={PREVIEW_WIDTH}
                height={Math.round((PREVIEW_WIDTH * height) / width)}
                className="rounded-lg shadow-md"
              />
            </a>
          ))}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold">Instagram caption</h2>
          <pre className="rounded border border-border bg-white p-3 font-sans text-sm whitespace-pre-wrap">
            {post.caption || "—"}
          </pre>
        </div>
        <div>
          <h2 className="mb-2 font-semibold">
            Facebook caption {post.captionFB ? null : <span className="text-sm font-normal text-text-secondary">(same as Instagram)</span>}
          </h2>
          <pre className="rounded border border-border bg-white p-3 font-sans text-sm whitespace-pre-wrap">
            {post.captionFB ?? (post.caption || "—")}
          </pre>
        </div>
      </section>

      <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm md:grid-cols-[10rem_1fr]">
        <dt className="font-semibold">Hashtags</dt>
        <dd className="font-mono">{post.hashtags.join(" ")}</dd>
        <dt className="font-semibold">CTA</dt>
        <dd>{post.cta}</dd>
        <dt className="font-semibold">Hook</dt>
        <dd>{post.hook}</dd>
        <dt className="font-semibold">Visual brief</dt>
        <dd>{post.visualBrief}</dd>
        {post.notes ? (
          <>
            <dt className="font-semibold">Notes</dt>
            <dd>{post.notes}</dd>
          </>
        ) : null}
        <dt className="font-semibold">Audience</dt>
        <dd>
          {post.audience}. {post.objective}.
        </dd>
      </dl>
    </main>
  );
}
