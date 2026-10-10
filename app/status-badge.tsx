import type { Status } from "@/lib/post/status";

const TONE: Record<Status, string> = {
  IDEA: "bg-slate-100 text-slate-600",
  SELECTED: "bg-slate-100 text-slate-700",
  DRAFT: "bg-amber-100 text-amber-800",
  AI_REVIEW: "bg-amber-100 text-amber-800",
  HUMAN_REVIEW: "bg-violet-100 text-violet-800",
  REVISION: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  SCHEDULED: "bg-sky-100 text-sky-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  ANALYSED: "bg-slate-200 text-slate-700",
  ARCHIVED: "bg-slate-200 text-slate-500",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-xs font-semibold whitespace-nowrap ${TONE[status]}`}>
      {status}
    </span>
  );
}
