import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type WidgetStatusTone = "ready" | "planned" | "external";

export type ToolType =
  | "Browser Source"
  | "Diagnostic"
  | "Export Tool"
  | "External App"
  | "Local App"
  | "Script Generator";

interface WidgetCardProps {
  description: string;
  icon: LucideIcon;
  name: string;
  status: string;
  tone?: WidgetStatusTone;
  toolType?: ToolType;
  configureHref?: string;
  configureLabel?: string;
  openHref?: string;
  openLabel?: string;
  openExternal?: boolean;
}

const toneClasses: Record<WidgetStatusTone, string> = {
  ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  planned: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  external: "border-sky-400/20 bg-sky-400/10 text-sky-200",
};

function ActionLink({
  href,
  label,
  external = false,
  primary = false,
}: {
  href: string;
  label: string;
  external?: boolean;
  primary?: boolean;
}) {
  const className = [
    "toolkit-button",
    "w-full sm:w-auto",
    primary
      ? "toolkit-button-primary"
      : "toolkit-button-secondary",
  ].join(" ");

  if (external) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {label}
    </Link>
  );
}

export default function WidgetCard({
  description,
  icon: Icon,
  name,
  status,
  tone = "planned",
  toolType,
  configureHref,
  configureLabel = "Configure",
  openHref,
  openLabel = "Open",
  openExternal = false,
}: WidgetCardProps) {
  return (
    <div className="toolkit-surface toolkit-card-hover flex h-full flex-col justify-between px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[var(--toolkit-border-strong)] bg-[var(--toolkit-bg-subtle)] text-[var(--toolkit-text-strong)]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {toolType && (
              <span className="inline-flex rounded-full border border-[var(--toolkit-border-strong)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--toolkit-text-dim)]">
                {toolType}
              </span>
            )}
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses[tone]}`}
            >
              {status}
            </span>
          </div>
        </div>

        <h3 className="mt-5 text-[1.2rem] font-semibold tracking-[-0.045em] text-[var(--toolkit-text-strong)] sm:text-[1.45rem]">
          {name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--toolkit-text-muted)]">{description}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {configureHref ? (
          <ActionLink href={configureHref} label={configureLabel} primary />
        ) : null}
        {openHref ? (
          <ActionLink href={openHref} label={openLabel} external={openExternal} />
        ) : null}
      </div>
    </div>
  );
}
