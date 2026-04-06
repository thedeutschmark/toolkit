"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ToolkitUser } from "@/lib/toolkitApi";
import { getToolkitBreadcrumbs } from "./toolkitNav";

interface ToolkitTopBarProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  onLogin: () => void;
  onLogout: () => void | Promise<void>;
  onToggleSidebar: () => void;
  user: ToolkitUser | null;
}

function initialsForUser(user: ToolkitUser | null) {
  if (!user) return "DM";
  return user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ToolkitTopBar({
  isAuthenticated,
  isLoading,
  onLogin,
  onLogout,
  onToggleSidebar,
  user,
}: ToolkitTopBarProps) {
  const pathname = usePathname();
  const breadcrumbs = getToolkitBreadcrumbs(pathname);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1] ?? "Home";
  const contextLabel =
    breadcrumbs.length > 1
      ? breadcrumbs.slice(0, -1).join(" / ")
      : "Control plane for widgets, connections, and browser-source setup";

  return (
    <header className="border-b border-[var(--toolkit-border)] bg-[color:var(--toolkit-bg-page)]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-start justify-between gap-4 sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <button
            aria-label="Toggle sidebar"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] text-[var(--toolkit-text)] transition-all duration-150 hover:-translate-y-px hover:border-[var(--toolkit-border-hover)] hover:bg-[var(--toolkit-bg-hover)] lg:hidden"
            onClick={onToggleSidebar}
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <p className="toolkit-eyebrow">
              {breadcrumbs.length > 1 ? "Current section" : "Toolkit dashboard"}
            </p>
            <h1 className="mt-2 text-lg font-semibold tracking-[-0.045em] text-[var(--toolkit-text-strong)] sm:text-[1.75rem]">
              {pageTitle}
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-[var(--toolkit-text-muted)] sm:mt-2 sm:text-sm">
              {contextLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isLoading ? (
            <div className="rounded-full border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-3 py-1.5 text-xs text-[var(--toolkit-text-muted)]">
              Checking session
            </div>
          ) : isAuthenticated && user ? (
            <>
              <span className="hidden rounded-full border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-3 py-1.5 text-xs text-[var(--toolkit-text-muted)] sm:block">
                @{user.login}
              </span>
              <button
                className="toolkit-button toolkit-button-ghost !min-h-0 rounded-full px-3 py-1.5 text-xs"
                onClick={() => { void onLogout(); }}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="toolkit-button toolkit-button-primary !min-h-[36px] rounded-full px-4 py-1.5 text-xs sm:!min-h-0"
              onClick={onLogin}
              type="button"
            >
              Login with Twitch
            </button>
          )}

          {user?.avatar ? (
            <img
              alt={user.name}
              className="h-9 w-9 rounded-full border border-[var(--toolkit-border)] object-cover sm:h-10 sm:w-10"
              referrerPolicy="no-referrer"
              src={user.avatar}
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] text-sm font-semibold text-[var(--toolkit-text-strong)] sm:h-10 sm:w-10">
              {initialsForUser(user)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
