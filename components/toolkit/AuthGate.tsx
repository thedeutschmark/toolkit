"use client";

import type { ReactNode } from "react";

interface AuthGateProps {
  children: ReactNode;
  error?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onLogin: () => void;
}

export default function AuthGate({
  children,
  error,
  isAuthenticated,
  isLoading,
  onLogin,
}: AuthGateProps) {
  if (isLoading) {
    return (
      <div className="toolkit-surface px-6 py-10 text-[var(--toolkit-text-strong)]">
        <p className="toolkit-eyebrow">
          Session
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em]">
          Checking toolkit access
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Waiting for the shared auth worker to confirm the current session.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="toolkit-surface px-6 py-10 text-[var(--toolkit-text-strong)]">
        <p className="toolkit-eyebrow">
          Login required
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em]">
          Sign in with Twitch
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Use your Twitch account to unlock widget controls, provider connections, and browser-source setup.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-amber-200">{error}</p>
        ) : null}
        <button
          className="toolkit-button toolkit-button-primary mt-6 w-full sm:w-auto"
          onClick={onLogin}
          type="button"
        >
          Login with Twitch
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
