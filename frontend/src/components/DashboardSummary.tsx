import type { ComplaintStats } from "@/lib/types";

export default function DashboardSummary({ stats }: { stats?: ComplaintStats }) {
  const rows = [
    { label: "Awaiting Action", value: (stats?.submitted ?? 0) + (stats?.under_review ?? 0) },
    { label: "In Progress", value: stats?.in_progress ?? 0 },
    { label: "Resolved", value: stats?.resolved ?? 0 },
    { label: "Rejected", value: stats?.rejected ?? 0 },
  ];
  return (
    <dl className="civic-summary">
      {rows.map((row) => (
        <div key={row.label} className="civic-summary-row">
          <dt>{row.label}</dt><dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
