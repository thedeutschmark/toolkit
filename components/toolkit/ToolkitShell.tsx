"use client";

import type { CSSProperties, ReactNode } from "react";
import { Component, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import useToolkitAuth from "@/lib/useToolkitAuth";
import AuthGate from "./AuthGate";
import ToolkitSidebar from "./ToolkitSidebar";
import ToolkitTopBar from "./ToolkitTopBar";
import { getToolkitRouteTheme } from "./toolkitNav";

class ShellErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-[var(--toolkit-text-strong)]">Something went wrong</p>
          <p className="text-sm text-[var(--toolkit-text-muted)]">An unexpected error occurred in this page.</p>
          <button
            type="button"
            className="toolkit-button toolkit-button-secondary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const shellStyle: CSSProperties = {
  fontFamily: "var(--font-sans)",
  WebkitFontSmoothing: "antialiased",
  imageRendering: "auto",
};

interface ToolkitShellProps {
  children: ReactNode;
}

export default function ToolkitShell({ children }: ToolkitShellProps) {
  const pathname = usePathname();
  const auth = useToolkitAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const routeTheme = getToolkitRouteTheme(pathname);
  const themedShellStyle: CSSProperties = {
    ...shellStyle,
    "--toolkit-accent": routeTheme.accent,
    "--toolkit-accent-rgb": routeTheme.accentRgb,
  } as CSSProperties;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[var(--toolkit-bg-page)] text-[var(--toolkit-text)]" style={themedShellStyle}>
      <ToolkitSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ToolkitTopBar
          isAuthenticated={auth.isAuthenticated}
          isLoading={auth.isLoading}
          onLogin={auth.login}
          onLogout={auth.logout}
          onToggleSidebar={() => setMobileOpen((v) => !v)}
          user={auth.user}
        />
        <main className="flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-5 lg:p-7">
          <ShellErrorBoundary>
            <AuthGate
              error={auth.error}
              isAuthenticated={auth.isAuthenticated}
              isLoading={auth.isLoading}
              onLogin={auth.login}
            >
              {children}
            </AuthGate>
          </ShellErrorBoundary>
        </main>
      </div>
    </div>
  );
}
