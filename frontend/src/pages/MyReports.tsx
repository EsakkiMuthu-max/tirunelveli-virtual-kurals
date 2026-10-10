import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, History, Loader2, MapPin, Paperclip, XCircle } from "lucide-react";
import AppShell, { departmentIcon } from "@/components/AppShell";
import EvidenceAudit from "@/components/EvidenceAudit";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/useSession";
import { apiGet } from "@/lib/api";
import type { Complaint, ComplaintStatus } from "@/lib/types";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export default function MyReports() {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();
  const [filter, setFilter] = useState("all");

  const { data: complaints, isError } = useQuery({
    queryKey: ["complaints", "mine"],
    queryFn: () => apiGet<Complaint[]>("/complaints/mine"),
    enabled: !!user,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="my-reports-loading">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const all = isError ? [] : complaints ?? [];
  const visible = filter === "all" ? all : all.filter((c) => c.status === filter);

  return (
    <AppShell
      user={user}
      title="Report Status"
      subtitle="Every grievance you filed, with its evidence verdict and officer updates."
      actions={
        <Link
          to="/citizen/report"
          className={`${buttonVariants({ size: "sm" })} gradient-crimson font-semibold text-white`}
          data-testid="new-report-link"
        >
          <FilePlus2 className="size-4" aria-hidden />
          New report
        </Link>
      }
    >
      <Tabs value={filter} onValueChange={(value: string) => setFilter(value)}>
        <TabsList variant="line" className="flex-wrap" data-testid="status-filter-tabs">
          {FILTERS.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              data-testid={`status-filter-${option.value}`}
            >
              {option.label}
              <span className="ml-1.5 font-mono text-[11px] opacity-70">
                {option.value === "all"
                  ? all.length
                  : all.filter((c) => c.status === option.value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div
          className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center"
          data-testid="my-reports-empty"
        >
          <p className="text-base font-semibold">
            {all.length === 0 ? "You have not filed any reports yet" : "Nothing in this status"}
          </p>
          <p className="pt-1 text-sm text-muted-foreground">
            {all.length === 0
              ? "File a grievance with a photo or video and track the officer's updates here."
              : "Pick another tab to see your other reports."}
          </p>
          {all.length === 0 ? (
            <Link
              to="/citizen/report"
              className={`${buttonVariants({ size: "sm" })} gradient-crimson mt-4 font-semibold text-white`}
              data-testid="empty-new-report-link"
            >
              Report an Issue
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-5 space-y-4" data-testid="my-reports-list">
          {visible.map((complaint) => {
            const Icon = departmentIcon(complaint.department_id);
            return (
              <li
                key={complaint.id}
                className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                data-testid={`report-card-${complaint.reference}`}
              >
                <div className="flex flex-wrap items-start gap-3 border-b border-border p-5">
                  <div className="gradient-tile flex size-10 shrink-0 items-center justify-center rounded-xl text-white">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary" data-testid={`report-reference-${complaint.reference}`}>
                        {complaint.reference}
                      </span>
                      <StatusBadge status={complaint.status} testId={`report-status-${complaint.reference}`} />
                    </div>
                    <p className="pt-1.5 text-base font-bold">{complaint.category}</p>
                    <p className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden />
                      {complaint.area}
                      {complaint.landmark ? ` · ${complaint.landmark}` : ""}
                    </p>
                    {complaint.reporting_latitude !== null && complaint.reporting_longitude !== null ? (
                      <a
                        className="mt-1 inline-block text-xs text-primary underline"
                        href={`https://www.openstreetmap.org/?mlat=${complaint.reporting_latitude}&mlon=${complaint.reporting_longitude}#map=18/${complaint.reporting_latitude}/${complaint.reporting_longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View detected reporting location
                      </a>
                    ) : null}
                    <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
                      {complaint.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(complaint.created_at).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Officer's recorded rejection reason */}
                {complaint.rejection_reason ? (
                  <div
                    className="border-b border-red-200 bg-red-50 p-5"
                    data-testid={`rejection-callout-${complaint.reference}`}
                  >
                    <p className="flex items-center gap-2 text-sm font-bold text-red-900">
                      <XCircle className="size-4" aria-hidden />
                      Rejection reason recorded by the officer
                    </p>
                    <p
                      className="pt-1.5 text-sm leading-relaxed text-red-900"
                      data-testid={`rejection-reason-${complaint.reference}`}
                    >
                      {complaint.rejection_reason}
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
                  {/* Evidence */}
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      <Paperclip className="size-3.5" aria-hidden />
                      Attached evidence
                    </p>
                    {complaint.evidence ? (
                      <>
                        {complaint.evidence.kind === "video" ? (
                          <video
                            src={`/api/complaints/${complaint.id}/evidence`}
                            controls
                            className="max-h-56 w-full rounded-xl bg-black object-contain"
                            data-testid={`evidence-video-${complaint.reference}`}
                          />
                        ) : (
                          <img
                            src={`/api/complaints/${complaint.id}/evidence`}
                            alt={`Evidence filed with ${complaint.reference}`}
                            loading="lazy"
                            className="max-h-56 w-full rounded-xl border border-border object-cover"
                            data-testid={`evidence-image-${complaint.reference}`}
                          />
                        )}
                        <EvidenceAudit evidence={complaint.evidence} testIdPrefix={`report-${complaint.reference}`} />
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No evidence stored.</p>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      <History className="size-3.5" aria-hidden />
                      Status history
                    </p>
                    <ol className="space-y-3" data-testid={`report-timeline-${complaint.reference}`}>
                      {complaint.updates.map((update, index) => (
                        <li key={`${update.created_at}-${index}`} className="relative pl-6">
                          <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-primary" />
                          {index < complaint.updates.length - 1 ? (
                            <span className="absolute top-4 left-[4.5px] h-[calc(100%+0.25rem)] w-px bg-border" />
                          ) : null}
                          <p className="text-xs font-bold text-primary uppercase">
                            {STATUS_LABELS[update.status as ComplaintStatus] ?? update.status}
                          </p>
                          <p className="pt-0.5 text-sm leading-relaxed">{update.message}</p>
                          <p className="pt-0.5 text-xs text-muted-foreground">
                            {update.actor} · {new Date(update.created_at).toLocaleString("en-IN")}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
