import type { ComplaintStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

const STATUS_CLASSES: Record<ComplaintStatus, string> = {
  submitted: "bg-slate-100 text-slate-700 ring-slate-200",
  under_review: "bg-amber-50 text-amber-800 ring-amber-200",
  in_progress: "bg-blue-50 text-blue-800 ring-blue-200",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
};

export function StatusBadge({ status, testId }: { status: ComplaintStatus; testId?: string }) {
  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ring-1",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const VERDICT_LABELS: Record<string, string> = {
  authentic: "Evidence authentic",
  needs_review: "Needs manual review",
  fake: "Screened as fake",
};

const VERDICT_CLASSES: Record<string, string> = {
  authentic: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  needs_review: "bg-amber-50 text-amber-800 ring-amber-200",
  fake: "bg-red-600 text-white ring-red-700",
};

export function VerdictBadge({ verdict, score, testId }: { verdict: string; score: number; testId?: string }) {
  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ring-1",
        VERDICT_CLASSES[verdict] ?? VERDICT_CLASSES.needs_review,
      )}
    >
      {VERDICT_LABELS[verdict] ?? verdict}
      <span className="font-mono opacity-80">{score}/100</span>
    </span>
  );
}
