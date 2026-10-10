import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import type { Evidence } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: AlertTriangle,
} as const;

const STATUS_COLOR = {
  pass: "text-emerald-600",
  warn: "text-amber-600",
  fail: "text-amber-600",
} as const;

/** Result of the AI check that the captured media shows the complaint category. */
export default function EvidenceAudit({
  evidence,
  testIdPrefix,
}: {
  evidence: Evidence;
  testIdPrefix: string;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4"
      data-testid={`${testIdPrefix}-evidence-audit`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          AI category check
        </p>
        <span
          className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-800 uppercase ring-1 ring-amber-200"
          data-testid={`${testIdPrefix}-advisory-badge`}
        >
          {evidence.kind}
        </span>
      </div>

      <ul className="space-y-2 border-t border-border pt-3" data-testid={`${testIdPrefix}-check-list`}>
        {evidence.checks.map((check) => {
          const Icon = STATUS_ICON[check.status] ?? AlertTriangle;
          return (
            <li key={check.name} className="flex items-start gap-2 text-xs">
              <Icon className={cn("mt-0.5 size-3.5 shrink-0", STATUS_COLOR[check.status])} aria-hidden />
              <span>
                <span className="font-semibold">{check.name}</span>
                <span className="text-muted-foreground"> — {check.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
