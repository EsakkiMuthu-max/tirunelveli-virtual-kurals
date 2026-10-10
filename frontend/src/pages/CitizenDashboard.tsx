import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, CheckCircle2, Clock, FilePlus2, Layers, ListChecks, Loader2, XCircle,
} from "lucide-react";
import AppShell, { departmentIcon } from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import DashboardSummary from "@/components/DashboardSummary";
import { StatusBadge } from "@/components/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { apiGet } from "@/lib/api";
import type { Complaint, ComplaintStats, Department } from "@/lib/types";

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["complaints", "mine", "stats"],
    queryFn: () => apiGet<ComplaintStats>("/complaints/mine/stats"),
    enabled: !!user,
    retry: false,
  });

  const { data: complaints } = useQuery({
    queryKey: ["complaints", "mine"],
    queryFn: () => apiGet<Complaint[]>("/complaints/mine"),
    enabled: !!user,
    retry: false,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiGet<Department[]>("/departments"),
    retry: false,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="citizen-dashboard-loading">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const allReports = complaints ?? [];
  const latestReports = allReports.slice(0, 5);
  const latestIds = new Set(latestReports.map((complaint) => complaint.id));
  const rejectedReports = allReports.filter(
    (complaint) => complaint.status === "rejected" && !latestIds.has(complaint.id),
  );
  const recent = [...latestReports, ...rejectedReports];

  return (
    <AppShell
      user={user}
      title={`Good Morning, ${user.display_name}!`}
      subtitle="Tirunelveli — your reports and department desks."
    >
      <div className="civic-stat-grid" data-testid="citizen-stat-grid">
        <StatCard label="Total Reports" value={stats?.total ?? 0} icon={Layers} testId="stat-total" />
        <StatCard label="Awaiting Action" value={(stats?.submitted ?? 0) + (stats?.under_review ?? 0)} icon={Clock} testId="stat-pending" tone="amber" />
        <StatCard label="In Progress" value={stats?.in_progress ?? 0} icon={ListChecks} testId="stat-in-progress" tone="blue" />
        <StatCard label="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle2} testId="stat-resolved" tone="green" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} icon={XCircle} testId="stat-rejected" tone="red" />
      </div>

      <div className="citizen-board">
      {/* Quick actions */}
      <section className="civic-panel citizen-actions" data-testid="quick-actions-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            Quick Actions
          </h2>
        </div>
        <div className="civic-quick-links">
          <Link
            to="/citizen/report"
            className={`${buttonVariants({ size: "lg" })} gradient-crimson civic-report-action`}
            data-testid="quick-action-report"
          >
            <FilePlus2 className="size-4" aria-hidden />
            Report an Issue
          </Link>
          <Link
            to="/citizen/reports"
            className={`${buttonVariants({ size: "lg" })} gradient-amber civic-status-action`}
            data-testid="quick-action-status"
          >
            <ListChecks className="size-4" aria-hidden />
            Check Report Status
          </Link>
        </div>
      </section>

        {/* Recent reports */}
        <section className="civic-panel citizen-recent" data-testid="recent-reports-panel">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-lg font-bold">Recent reports & officer rejections</h2>
            <Link
              to="/citizen/reports"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              data-testid="view-all-reports-link"
            >
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center" data-testid="recent-reports-empty">
              <p className="text-sm font-semibold">No reports yet</p>
              <p className="pt-1 text-sm text-muted-foreground">
                File your first grievance with a photo or video and follow its progress here.
              </p>
              <Link
                to="/citizen/report"
                className={`${buttonVariants({ size: "sm" })} gradient-crimson mt-4 font-semibold text-white`}
                data-testid="empty-state-report-link"
              >
                Report an Issue
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" data-testid="recent-reports-list">
              {recent.map((complaint) => {
                const Icon = departmentIcon(complaint.department_id);
                return (
                  <li key={complaint.id}>
                    <Link
                      to="/citizen/reports"
                      className="civic-report-row"
                      data-testid={`recent-report-${complaint.reference}`}
                    >
                      <div className="gradient-tile civic-report-icon">
                        <Icon className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{complaint.reference}</span>
                          <StatusBadge status={complaint.status} />
                        </div>
                        <p className="truncate pt-1 text-sm font-semibold">{complaint.category}</p>
                        <p className="text-xs text-muted-foreground">{complaint.area}</p>
                        {complaint.rejection_reason ? (
                          <p className="pt-1 text-xs font-medium text-red-700">
                            Officer rejection reason: {complaint.rejection_reason}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* The seven departments */}
        <section className="civic-panel citizen-departments" data-testid="departments-panel">
          <h2 className="text-lg font-bold">The seven departments</h2>

          <ul className="civic-department-grid">
            {(departments ?? []).map((department) => {
              const Icon = departmentIcon(department.id);
              return (
                <li
                  key={department.id}
                  className="civic-department"
                  data-testid={`department-row-${department.id}`}
                >
                  <Icon className="civic-department-icon" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{department.name}</p>
                    <p className="text-xs text-muted-foreground">{department.tamil_name}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="civic-panel citizen-overview">
          <h2 className="text-lg font-bold">Report Overview</h2>
          <DashboardSummary stats={stats} />
        </section>
      </div>
    </AppShell>
  );
}
