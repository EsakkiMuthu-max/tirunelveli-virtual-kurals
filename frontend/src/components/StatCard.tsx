import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  testId: string;
  tone?: "default" | "amber" | "blue" | "green" | "red";
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "gradient-tile",
  amber: "bg-gradient-to-br from-amber-500 to-amber-400",
  blue: "bg-gradient-to-br from-blue-600 to-sky-500",
  green: "bg-gradient-to-br from-emerald-600 to-green-500",
  red: "bg-gradient-to-br from-red-700 to-rose-500",
};

export default function StatCard({ label, value, icon: Icon, testId, tone = "default" }: StatCardProps) {
  return (
    <div
      className="civic-stat"
      data-testid={testId}
    >
      <div
        className={cn(
          "civic-stat-icon",
          TONES[tone],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="civic-stat-copy">
      <p
        className="civic-stat-value"
        data-testid={`${testId}-value`}
      >
        {value}
      </p>
      <p className="civic-stat-label">{label}</p>
      </div>
    </div>
  );
}
