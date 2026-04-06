import type { LucideIcon } from "lucide-react";

export type HealthStatus = "ok" | "warning" | "loading";

interface StatCardProps {
  hint: string;
  icon: LucideIcon;
  label: string;
  status?: HealthStatus;
  value: string;
}

const statusDot: Record<HealthStatus, string> = {
  ok:      "bg-[var(--toolkit-success)]",
  warning: "bg-[var(--toolkit-warning)]",
  loading: "bg-[var(--toolkit-border-hover)] animate-pulse",
};

const statusRing: Record<HealthStatus, string> = {
  ok:      "border-emerald-400/25",
  warning: "border-amber-400/25",
  loading: "border-[var(--toolkit-border-strong)]",
};

export default function StatCard({ label, value, hint, icon: Icon, status }: StatCardProps) {
  return (
    <div className={`toolkit-surface toolkit-card-hover px-6 py-6 text-[var(--toolkit-text-strong)] ${status === "loading" ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="toolkit-eyebrow">{label}</p>
          <p className="mt-4 truncate text-3xl font-semibold tracking-[-0.06em] text-[var(--toolkit-text-strong)] sm:text-[2rem]">
            {value}
          </p>
        </div>
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-[var(--toolkit-bg-subtle)] text-[var(--toolkit-text)] ${status ? statusRing[status] : "border-[var(--toolkit-border-strong)]"}`}>
          <Icon className="h-5 w-5" />
          {status && (
            <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--toolkit-bg-panel)] ${statusDot[status]}`} />
          )}
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--toolkit-text-muted)]">{hint}</p>
    </div>
  );
}
