import Link from "next/link";
import { connection } from "next/server";
import { isTemplateBuilt } from "@/lib/graphics/render";
import { listPosts } from "@/lib/post/load";
import { formatDate } from "@/lib/post/schedule";
import { StatusBadge } from "./status-badge";

export default async function Home() {
  await connection();
  const posts = await listPosts();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">PrimeCode Studio</h1>
      <p className="mb-6 text-text-secondary">
        {posts.length} posts. Dates are Africa/Johannesburg. Export with <code>pnpm export PC-2026-NNN</code>.
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-secondary">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Post</th>
            <th className="py-2 pr-3">Topic</th>
            <th className="py-2 pr-3">Template</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.contentId} className="border-b border-border align-top hover:bg-white">
              <td className="py-2 pr-3 whitespace-nowrap">
                {formatDate(p.publishDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="py-2 pr-3 font-mono whitespace-nowrap">
                <Link href={`/post/${p.contentId}`} className="text-primary hover:underline">
                  {p.contentId}
                </Link>
              </td>
              <td className="py-2 pr-3">
                <div>{p.topic}</div>
                <div className="text-xs text-text-secondary">
                  {p.series} · {p.format === "Carousel" ? `${p.slides.length} slides` : "Single image"}
                  {p.clientPermission?.status === "pending" ? (
                    <span className="ml-2 font-semibold text-red-700">permission pending: {p.clientPermission.client}</span>
                  ) : null}
                </div>
              </td>
              <td className="py-2 pr-3 font-mono whitespace-nowrap">
                {p.visualTemplate}
                {isTemplateBuilt(p.visualTemplate) ? null : <span className="ml-1 text-xs text-text-secondary">(not built)</span>}
              </td>
              <td className="py-2">
                <StatusBadge status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
