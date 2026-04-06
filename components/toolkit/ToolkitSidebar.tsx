"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { communityNav, isRouteActive, primaryNav, widgetNav } from "./toolkitNav";

interface ToolkitSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function linkClasses(active: boolean) {
  return [
    "flex items-center gap-3 rounded-[12px] border px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out",
    active
      ? "border-[rgba(var(--toolkit-accent-rgb),0.34)] bg-[rgba(var(--toolkit-accent-rgb),0.11)] text-[var(--toolkit-text-strong)] shadow-[0_0_0_1px_rgba(var(--toolkit-accent-rgb),0.2),0_12px_32px_rgba(0,0,0,0.2)]"
      : "border-transparent text-[var(--toolkit-text-muted)] hover:-translate-y-px hover:border-[var(--toolkit-border)] hover:bg-[var(--toolkit-bg-subtle)] hover:text-[var(--toolkit-text-strong)]",
  ].join(" ");
}

export default function ToolkitSidebar({ mobileOpen, onCloseMobile }: ToolkitSidebarProps) {
  const pathname = usePathname();
  const CommunityIcon = communityNav.icon;

  return (
    <>
      <button
        aria-label="Close sidebar overlay"
        className={`fixed inset-0 z-30 bg-black/65 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
        type="button"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(86vw,20rem)] shrink-0 flex-col border-r border-[var(--toolkit-border)] bg-[color:var(--toolkit-bg-panel)]/95 backdrop-blur-xl transition-transform duration-200 sm:w-72 lg:static lg:translate-x-0 lg:w-72 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--toolkit-border)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div aria-hidden="true" className="toolkit-rack-light">
                <span className="toolkit-rack-light-core" />
                <span className="toolkit-rack-light-bloom" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[-0.03em] text-[var(--toolkit-text-strong)]">
                  deutschmark toolkit
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--toolkit-text-dim)]">
                  live control plane
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--toolkit-text-muted)]">
              Creator infrastructure for widgets, integrations, and broadcast setup.
            </p>
          </div>

          <button
            aria-label="Close mobile sidebar"
            className="ml-3 shrink-0 rounded-[12px] border border-[var(--toolkit-border)] p-2 text-[var(--toolkit-text-muted)] transition-colors hover:bg-[var(--toolkit-bg-subtle)] hover:text-[var(--toolkit-text-strong)] lg:hidden"
            onClick={onCloseMobile}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(pathname, item.href, item.exact);

              return (
                <Link
                  key={item.href}
                  className={linkClasses(active)}
                  href={item.href}
                  onClick={onCloseMobile}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
              Tools
            </p>

            <div className="mt-2 space-y-1">
              {widgetNav.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(pathname, item.href, item.exact);

                return (
                  <Link
                    key={item.href}
                    className={linkClasses(active)}
                    href={item.href}
                    onClick={onCloseMobile}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--toolkit-border)] p-4">
          <a
            className={linkClasses(false)}
            href={communityNav.href}
            rel="noreferrer"
            target="_blank"
          >
            <CommunityIcon className="h-4 w-4 shrink-0" />
            {communityNav.label}
          </a>
        </div>
      </aside>
    </>
  );
}
