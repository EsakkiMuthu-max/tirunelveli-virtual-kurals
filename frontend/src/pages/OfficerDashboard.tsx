import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, History, Layers, ListChecks, Loader2, MapPin, ShieldCheck, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import EvidenceAudit from "@/components/EvidenceAudit";
import StatCard from "@/components/StatCard";
import DashboardSummary from "@/components/DashboardSummary";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { apiErrorMessage, apiGet, apiPatch } from "@/lib/api";
import type { Complaint, ComplaintStats, ComplaintStatus } from "@/lib/types";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const ACTIONABLE: Array<{ value: ComplaintStatus; label: string }> = [
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading } = useSession();

  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<string>("in_progress");
  const [note, setNote] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["officer", "stats"],
    queryFn: () => apiGet<ComplaintStats>("/officer/stats"),
    enabled: !!user,
    retry: false,
  });

  const { data: complaints, isError } = useQuery({
    queryKey: ["officer", "complaints", filter],
    queryFn: () => apiGet<Complaint[]>(`/officer/complaints?status=${filter}`),
    enabled: !!user,
    retry: false,
  });

  const updateStatus = useMutation({
    mutationFn: (complaintId: string) =>
      apiPatch<Complaint>(`/officer/complaints/${complaintId}/status`, {
        status: nextStatus,
        message: note.trim(),
      }),
    onSuccess: async (complaint) => {
      toast.success(`${complaint.reference} marked ${STATUS_LABELS[complaint.status]}.`);
      setOpenId(null);
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["officer"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "The status could not be updated.")),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="officer-dashboard-loading">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const queue = isError ? [] : complaints ?? [];

  return (
    <AppShell
      user={user}
      title="Officer Control Center"
      subtitle={`Work queue for ${user.department_name ?? "your department"}.`}
    >
      <div className="civic-stat-grid" data-testid="officer-stat-grid">
        <StatCard label="Total Reports" value={stats?.total ?? 0} icon={Layers} testId="officer-stat-total" />
        <StatCard label="Awaiting Action" value={(stats?.submitted ?? 0) + (stats?.under_review ?? 0)} icon={Clock} testId="officer-stat-pending" tone="amber" />
        <StatCard label="In Progress" value={stats?.in_progress ?? 0} icon={ListChecks} testId="officer-stat-in-progress" tone="blue" />
        <StatCard label="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle2} testId="officer-stat-resolved" tone="green" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} icon={XCircle} testId="officer-stat-rejected" tone="red" />
      </div>

      <div className="officer-board">
      <section className="officer-queue">
      <div className="civic-queue-heading"><h2>Department Complaints</h2><span>{user.department_name}</span></div>
      <Tabs value={filter} onValueChange={(value: string) => setFilter(value)} className="civic-filters">
        <TabsList variant="line" className="civic-filter-list" data-testid="officer-filter-tabs">
          {FILTERS.map((option) => (
            <TabsTrigger key={option.value} value={option.value} data-testid={`officer-filter-${option.value}`}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {queue.length === 0 ? (
        <div
          className="civic-queue-empty"
          data-testid="officer-queue-empty"
        >
          <p className="text-base font-semibold">Nothing in this view</p>
          <p className="pt-1 text-sm text-muted-foreground">
            Complaints filed against {user.department_name} will appear here as soon as a citizen
            submits one.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-4" data-testid="officer-queue-list">
          {queue.map((complaint) => (
            <li
              key={complaint.id}
              className="civic-complaint"
              data-testid={`officer-complaint-${complaint.reference}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{complaint.reference}</span>
                    <StatusBadge status={complaint.status} testId={`officer-status-${complaint.reference}`} />
                    {complaint.verification_status === "needs_review" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-800 uppercase ring-1 ring-amber-200">
                        Check evidence
                      </span>
                    ) : null}
                  </div>
                  <p className="pt-1.5 text-base font-bold">{complaint.category}</p>
                  <p className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden />
                    {complaint.area}
                    {complaint.landmark ? ` · ${complaint.landmark}` : ""} · filed by{" "}
                    {complaint.citizen_name}
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
                  <p className="max-w-2xl pt-2 text-sm leading-relaxed text-muted-foreground">
                    {complaint.description}
                  </p>
                </div>
                <Button
                  variant={openId === complaint.id ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setOpenId(openId === complaint.id ? null : complaint.id);
                    setNextStatus("in_progress");
                    setNote("");
                  }}
                  data-testid={`officer-toggle-${complaint.reference}`}
                >
                  {openId === complaint.id ? "Close" : "Update status"}
                </Button>
              </div>

              {complaint.rejection_reason ? (
                <div className="border-b border-red-200 bg-red-50 px-5 py-3">
                  <p className="text-sm text-red-900">
                    <span className="font-bold">Rejection reason: </span>
                    {complaint.rejection_reason}
                  </p>
                </div>
              ) : null}

              <div className="civic-evidence-grid">
                <div className="space-y-3">
                  {complaint.evidence ? (
                    <>
                      {complaint.evidence.kind === "video" ? (
                        <video
                          src={`/api/complaints/${complaint.id}/evidence`}
                          controls
                          className="max-h-56 w-full rounded-xl bg-black object-contain"
                          data-testid={`officer-evidence-video-${complaint.reference}`}
                        />
                      ) : (
                        <img
                          src={`/api/complaints/${complaint.id}/evidence`}
                          alt={`Evidence filed with ${complaint.reference}`}
                          loading="lazy"
                          className="max-h-56 w-full rounded-xl border border-border object-cover"
                          data-testid={`officer-evidence-image-${complaint.reference}`}
                        />
                      )}
                      <EvidenceAudit evidence={complaint.evidence} testIdPrefix={`officer-${complaint.reference}`} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No evidence stored.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                    <History className="size-3.5" aria-hidden />
                    Status history
                  </p>
                  <ol className="space-y-3">
                    {complaint.updates.map((update, index) => (
                      <li key={`${update.created_at}-${index}`} className="relative pl-6">
                        <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-primary" />
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

                  {openId === complaint.id ? (
                    <form
                      className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4"
                      data-testid={`officer-status-form-${complaint.reference}`}
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (note.trim().length < 3) {
                          toast.error("Add a short note for the citizen.");
                          return;
                        }
                        updateStatus.mutate(complaint.id);
                      }}
                    >
                      <Select value={nextStatus} onValueChange={(value: string) => setNextStatus(value)}>
                        <SelectTrigger data-testid={`officer-status-select-${complaint.reference}`}>
                          <SelectValue>
                            {(value) =>
                              ACTIONABLE.find((option) => option.value === value)?.label ?? "Pick a status"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIONABLE.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              data-testid={`officer-status-option-${option.value}`}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Textarea
                        rows={3}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={
                          nextStatus === "rejected"
                            ? "Required: explain why the complaint is being rejected."
                            : "Add a short update for the citizen."
                        }
                        data-testid={`officer-note-input-${complaint.reference}`}
                      />

                      <Button
                        type="submit"
                        disabled={updateStatus.isPending}
                        className="gradient-crimson civic-save-update"
                        data-testid={`officer-submit-status-${complaint.reference}`}
                      >
                        {updateStatus.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                        {nextStatus === "rejected" ? "Reject with reason" : "Save update"}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      </section>
      <aside className="officer-insights">
        <section className="civic-panel">
          <h2 className="text-lg font-bold">Department Overview</h2>
          <DashboardSummary stats={stats} />
        </section>
        <section className="civic-panel">
          <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-primary" aria-hidden />Department Desk</h2>
      <div className="civic-department-notice">
        <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          You only see complaints routed to{" "}
          <span className="font-semibold text-foreground">{user.department_name}</span>. The other six
          departments are invisible to this login.
        </p>
      </div>

        </section>
      </aside>
      </div>
    </AppShell>
  );
}
