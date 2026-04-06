"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Minus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ToolkitApiError, toolkitApi } from "@/lib/toolkitApi";

/* ─── Types ─── */

type CheckStatus = "fail" | "loading" | "pass" | "skip" | "warn";

interface Check {
  actionHref?: string;
  actionLabel?: string;
  detail: string;
  id: string;
  status: CheckStatus;
  title: string;
}

interface CheckGroup {
  checks: Check[];
  id: string;
  label: string;
}

/* ─── API shapes (subset) ─── */

interface ConnectionsData {
  spotify: {
    connected: boolean;
    hasCredentials: boolean;
    profile: { displayName: string } | null;
  };
  twitch: {
    connected: boolean;
    profile: { login: string; name: string };
  };
}

interface TokenData { surface: string; token: string }
interface StreamSettingsData { settings: { streamPlaylistId: string | null } }

/* ─── Check builder ─── */

function plural(n: number, word: string) {
  return `${n} ${word}${n !== 1 ? "s" : ""}`;
}

function buildGroups(
  connectionsRes: PromiseSettledResult<ConnectionsData>,
  tokensRes: PromiseSettledResult<{ tokens: TokenData[] }>,
  streamRes: PromiseSettledResult<StreamSettingsData>,
): CheckGroup[] {
  const connOk = connectionsRes.status === "fulfilled";
  const is401 =
    connectionsRes.status === "rejected" &&
    connectionsRes.reason instanceof ToolkitApiError &&
    connectionsRes.reason.status === 401;

  const conn   = connOk ? connectionsRes.value : null;
  const tokens = tokensRes.status === "fulfilled" ? tokensRes.value.tokens : null;
  const stream = streamRes.status === "fulfilled" ? streamRes.value : null;

  /* Account */
  const accountChecks: Check[] = [
    {
      id: "session",
      title: "Session active",
      detail: conn
        ? "Authenticated — session is valid."
        : is401
          ? "Not signed in."
          : "Could not reach the auth service.",
      status: conn ? "pass" : "fail",
      actionLabel: is401 ? "Sign in" : undefined,
      actionHref: is401 ? "/" : undefined,
    },
    {
      id: "twitch",
      title: "Twitch connected",
      detail: conn
        ? `Connected as @${conn.twitch.profile.login}.`
        : is401
          ? "Sign in first."
          : "Could not verify.",
      status: conn ? "pass" : is401 ? "skip" : "fail",
    },
  ];

  /* Spotify */
  const creds   = conn?.spotify.hasCredentials ?? false;
  const oauthOk = conn?.spotify.connected ?? false;

  const spotifyChecks: Check[] = [
    {
      id: "spotify_creds",
      title: "Spotify app credentials",
      detail: !conn
        ? (is401 ? "Sign in first." : "Could not check.")
        : creds
          ? "Client ID and secret are configured."
          : "No credentials — Spotify features will not work.",
      status: !conn ? "skip" : creds ? "pass" : "warn",
      actionLabel: conn && !creds ? "Add credentials" : undefined,
      actionHref: conn && !creds ? "/connections" : undefined,
    },
    {
      id: "spotify_oauth",
      title: "Spotify OAuth tokens",
      detail: !conn
        ? (is401 ? "Sign in first." : "Could not check.")
        : !creds
          ? "Configure app credentials before authorising."
          : oauthOk
            ? `Connected${conn.spotify.profile ? ` as ${conn.spotify.profile.displayName}` : ""}.`
            : "Not connected — authorise Spotify in Connections.",
      status: !conn ? "skip" : !creds ? "skip" : oauthOk ? "pass" : "warn",
      actionLabel: conn && creds && !oauthOk ? "Connect Spotify" : undefined,
      actionHref: conn && creds && !oauthOk ? "/connections" : undefined,
    },
  ];

  /* Browser sources */
  const playerCount = tokens?.filter(t => t.surface === "player").length ?? 0;
  const streamCount = tokens?.filter(t => t.surface === "stream").length ?? 0;
  const totalCount  = tokens?.length ?? 0;

  const sourceChecks: Check[] = [
    {
      id: "sources_any",
      title: "At least one browser source",
      detail: tokens === null
        ? "Could not load sources."
        : totalCount > 0
          ? `${plural(totalCount, "source")} configured.`
          : "No sources yet — create one in Player or Stream Music.",
      status: tokens === null ? "fail" : totalCount > 0 ? "pass" : "warn",
      actionLabel: tokens !== null && totalCount === 0 ? "Create source" : undefined,
      actionHref: tokens !== null && totalCount === 0 ? "/tools/player" : undefined,
    },
    {
      id: "sources_player",
      title: "Player source",
      detail: tokens === null
        ? "Could not load sources."
        : playerCount > 0
          ? `${plural(playerCount, "player source")} — Now Playing widget ready.`
          : "No player sources — the Now Playing widget has no endpoint.",
      status: tokens === null ? "fail" : playerCount > 0 ? "pass" : "warn",
      actionLabel: tokens !== null && playerCount === 0 ? "Add player source" : undefined,
      actionHref: tokens !== null && playerCount === 0 ? "/tools/player" : undefined,
    },
    {
      id: "sources_stream",
      title: "Stream source",
      detail: tokens === null
        ? "Could not load sources."
        : streamCount > 0
          ? `${plural(streamCount, "stream source")} — chat commands ready.`
          : "No stream sources — music chat commands will have no endpoint.",
      status: tokens === null ? "fail" : streamCount > 0 ? "pass" : "warn",
      actionLabel: tokens !== null && streamCount === 0 ? "Add stream source" : undefined,
      actionHref: tokens !== null && streamCount === 0 ? "/tools/stream-music" : undefined,
    },
  ];

  /* Stream config */
  const playlistSet = Boolean(stream?.settings.streamPlaylistId);

  const configChecks: Check[] = [
    {
      id: "playlist",
      title: "Stream capture playlist",
      detail: stream === null
        ? "Could not load stream settings."
        : playlistSet
          ? "Song requests auto-captured to playlist."
          : "No capture playlist — !sr requests will not be saved.",
      status: stream === null ? "fail" : playlistSet ? "pass" : "warn",
      actionLabel: stream !== null && !playlistSet ? "Set playlist" : undefined,
      actionHref: stream !== null && !playlistSet ? "/tools/stream-music" : undefined,
    },
  ];

  return [
    { id: "account", label: "Account",         checks: accountChecks },
    { id: "spotify", label: "Spotify",         checks: spotifyChecks },
    { id: "sources", label: "Browser Sources", checks: sourceChecks  },
    { id: "config",  label: "Stream Config",   checks: configChecks  },
  ];
}

/* ─── Status icon ─── */

const STATUS_CONFIG: Record<CheckStatus, {
  className: string;
  Icon: LucideIcon;
}> = {
  pass:    { Icon: CheckCircle2,  className: "text-[var(--toolkit-success)]" },
  warn:    { Icon: AlertTriangle, className: "text-[var(--toolkit-warning)]" },
  fail:    { Icon: XCircle,       className: "text-[var(--toolkit-danger)]"  },
  loading: { Icon: Loader2,       className: "animate-spin text-[var(--toolkit-text-dim)]" },
  skip:    { Icon: Minus,         className: "text-[var(--toolkit-text-dim)]" },
};

/* ─── Summary counts ─── */

function summarise(groups: CheckGroup[]) {
  const all = groups.flatMap(g => g.checks);
  return {
    pass:    all.filter(c => c.status === "pass").length,
    warn:    all.filter(c => c.status === "warn").length,
    fail:    all.filter(c => c.status === "fail").length,
    loading: all.some(c => c.status === "loading"),
  };
}

/* ─── Loading skeleton ─── */

const LOADING_GROUPS: CheckGroup[] = [
  {
    id: "account", label: "Account",
    checks: [
      { id: "session", title: "Session active",      detail: "Checking…", status: "loading" },
      { id: "twitch",  title: "Twitch connected",    detail: "Checking…", status: "loading" },
    ],
  },
  {
    id: "spotify", label: "Spotify",
    checks: [
      { id: "spotify_creds", title: "Spotify app credentials", detail: "Checking…", status: "loading" },
      { id: "spotify_oauth", title: "Spotify OAuth tokens",    detail: "Checking…", status: "loading" },
    ],
  },
  {
    id: "sources", label: "Browser Sources",
    checks: [
      { id: "sources_any",    title: "At least one browser source", detail: "Checking…", status: "loading" },
      { id: "sources_player", title: "Player source",               detail: "Checking…", status: "loading" },
      { id: "sources_stream", title: "Stream source",               detail: "Checking…", status: "loading" },
    ],
  },
  {
    id: "config", label: "Stream Config",
    checks: [
      { id: "playlist", title: "Stream capture playlist", detail: "Checking…", status: "loading" },
    ],
  },
];

/* ─── Check row ─── */

function CheckRow({ check }: { check: Check }) {
  const { Icon, className } = STATUS_CONFIG[check.status];

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${check.status === "skip" ? "text-[var(--toolkit-text-dim)]" : "text-[var(--toolkit-text-strong)]"}`}>
          {check.title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--toolkit-text-muted)]">
          {check.detail}
        </p>
      </div>
      {check.actionHref && check.actionLabel && (
        <Link
          className="shrink-0 text-xs font-medium text-[var(--toolkit-accent)] hover:underline underline-offset-4"
          href={check.actionHref}
        >
          {check.actionLabel} →
        </Link>
      )}
    </div>
  );
}

/* ─── Page ─── */

export default function SetupDoctorPage() {
  const [groups, setGroups]   = useState<CheckGroup[]>(LOADING_GROUPS);
  const [running, setRunning] = useState(true);
  const [ran, setRan]         = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    setGroups(LOADING_GROUPS);

    const [connectionsRes, tokensRes, streamRes] = await Promise.allSettled([
      toolkitApi.get<ConnectionsData>("/connections"),
      toolkitApi.get<{ tokens: TokenData[] }>("/widget-tokens"),
      toolkitApi.get<StreamSettingsData>("/stream-settings"),
    ]);

    setGroups(buildGroups(connectionsRes, tokensRes, streamRes));
    setRunning(false);
    setRan(true);
  }, []);

  useEffect(() => { void run(); }, [run]);

  const summary = summarise(groups);
  const allClear = ran && !running && summary.fail === 0 && summary.warn === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="toolkit-eyebrow">Diagnostics</p>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
              Setup Doctor
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
              Checks your auth session, Spotify connection, browser source inventory, and stream
              config in one pass. Fix any warnings or failures before going live.
            </p>
          </div>
          <button
            className="toolkit-button toolkit-button-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running}
            onClick={() => void run()}
            type="button"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {running ? "Running…" : "Re-run checks"}
          </button>
        </div>
      </section>

      {/* Summary banner */}
      {ran && (
        <div className={[
          "toolkit-surface px-5 py-4 sm:px-6",
          allClear
            ? "border-emerald-400/20 bg-emerald-400/5"
            : summary.fail > 0
              ? "border-[var(--toolkit-danger)]/20 bg-[var(--toolkit-danger)]/5"
              : "border-amber-400/20 bg-amber-400/5",
        ].join(" ")}>
          <div className="flex items-center gap-3">
            {allClear ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--toolkit-success)]" />
            ) : summary.fail > 0 ? (
              <XCircle className="h-5 w-5 shrink-0 text-[var(--toolkit-danger)]" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--toolkit-warning)]" />
            )}
            <p className="text-sm font-medium text-[var(--toolkit-text-strong)]">
              {allClear
                ? "All checks passed — you're good to go."
                : [
                    summary.pass > 0 && `${summary.pass} passed`,
                    summary.warn > 0 && `${summary.warn} warning${summary.warn !== 1 ? "s" : ""}`,
                    summary.fail > 0 && `${summary.fail} failure${summary.fail !== 1 ? "s" : ""}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Check groups */}
      <div className="space-y-4">
        {groups.map(group => (
          <section key={group.id} className="toolkit-surface px-5 py-5 sm:px-6 sm:py-6">
            <p className="toolkit-eyebrow">{group.label}</p>
            <div className="mt-4 divide-y divide-[var(--toolkit-border)]">
              {group.checks.map(check => (
                <CheckRow key={check.id} check={check} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div className="rounded-[var(--toolkit-radius-md)] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-3">
        <div className="flex items-start gap-2">
          <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--toolkit-text-dim)]" />
          <p className="text-xs leading-5 text-[var(--toolkit-text-dim)]">
            Setup Doctor checks only what the toolkit can observe via its own API. OBS WebSocket
            connectivity, Streamer.bot action state, and actual overlay render health require
            manual verification on your end.
          </p>
        </div>
      </div>
    </div>
  );
}
