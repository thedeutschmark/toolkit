"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EditorFeedComposer from "@/components/toolkit/EditorFeedComposer";
import MaskedTokenUrl from "@/components/toolkit/MaskedTokenUrl";
import { toolkitApi, ToolkitApiError } from "@/lib/toolkitApi";
import { WIDGET_HOST_URL } from "@/lib/toolkitEnv";
import useWidgetTokens from "@/lib/useWidgetTokens";

type PermissionLevel = "everyone" | "vip" | "mod" | "streamer";

interface StreamMusicSettings {
  commandsEnabled: boolean;
  streamPlaylistId: string | null;
  permissions: Record<string, PermissionLevel>;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  public: boolean;
}

interface ExcludedSong {
  artist: string;
  id: string;
  name: string;
}

const DEFAULT_SETTINGS: StreamMusicSettings = {
  commandsEnabled: true,
  streamPlaylistId: null,
  permissions: {
    sr: "everyone",
    sNow: "everyone",
    sLink: "everyone",
    sQueue: "everyone",
    sNext: "mod",
    sPrev: "mod",
    sPause: "mod",
    sPlay: "mod",
    sVol: "mod",
    sAdd: "mod",
    sLike: "mod",
    sReplay: "mod",
    songOut: "mod",
  },
};

const PERMISSION_LEVELS: readonly PermissionLevel[] = ["everyone", "vip", "mod", "streamer"];

const COMMANDS: Array<{ key: keyof StreamMusicSettings["permissions"]; label: string }> = [
  { key: "sr", label: "!sr - song request" },
  { key: "sNow", label: "!snow - now playing" },
  { key: "sLink", label: "!slink - Spotify link" },
  { key: "sQueue", label: "!squeue - queue list" },
  { key: "sNext", label: "!snext - skip track" },
  { key: "sPrev", label: "!sprev - previous track" },
  { key: "sPause", label: "!spause - pause" },
  { key: "sPlay", label: "!splay - resume" },
  { key: "sVol", label: "!svol - set volume" },
  { key: "sAdd", label: "!sadd - add to stream playlist" },
  { key: "sLike", label: "!slike - like track" },
  { key: "sReplay", label: "!sreplay - re-queue track" },
  { key: "songOut", label: "!songout - exclude song" },
];

function getStreamSourceUrl(token: string) {
  return `${WIDGET_HOST_URL}/stream/?wid=${token}`;
}

function getStreamPreviewUrl(token: string) {
  return `${WIDGET_HOST_URL}/widget-preview/?surface=stream&wid=${token}`;
}

function readApiErrorCode(error: unknown) {
  if (!(error instanceof ToolkitApiError)) {
    return null;
  }

  if (!error.data || typeof error.data !== "object" || !("error" in error.data)) {
    return null;
  }

  const code = (error.data as { error?: unknown }).error;
  return typeof code === "string" ? code : null;
}

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof ToolkitApiError) {
    const code = readApiErrorCode(error);
    if (code) {
      return code.replace(/_/g, " ");
    }

    return error.message || fallback;
  }

  return fallback;
}

function settingsErrorMessage(error: unknown) {
  return messageFromError(
    error,
    "Couldn't load saved Stream Music settings. Retry before making changes.",
  );
}

function playlistsErrorMessage(error: unknown) {
  const code = readApiErrorCode(error);
  if (
    code === "spotify_not_connected" ||
    code === "spotify_credentials_missing" ||
    code === "spotify_refresh_failed" ||
    code === "invalid_spotify_refresh_response"
  ) {
    return "Spotify needs to be reconnected before playlists can be loaded.";
  }

  return messageFromError(error, "Couldn't load your Spotify playlists.");
}

function excludedSongsErrorMessage(error: unknown) {
  return messageFromError(error, "Couldn't load excluded songs.");
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={[
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--toolkit-accent)]",
        disabled ? "cursor-not-allowed opacity-40" : "",
        checked ? "bg-[var(--toolkit-accent)]" : "bg-[var(--toolkit-border-strong)]",
      ].join(" ")}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={[
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export default function StreamMusicPage() {
  const widgetTokens = useWidgetTokens();
  const [settings, setSettings] = useState<StreamMusicSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<StreamMusicSettings>(DEFAULT_SETTINGS);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [excludedSongs, setExcludedSongs] = useState<ExcludedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(null);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [excludedSongsError, setExcludedSongsError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const streamTokens = useMemo(
    () => widgetTokens.tokens.filter((token) => token.surface === "stream"),
    [widgetTokens.tokens],
  );

  const previewUrl = useMemo(
    () => (previewToken ? getStreamPreviewUrl(previewToken) : null),
    [previewToken],
  );

  const isDirty =
    settingsLoaded && JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const load = useCallback(async () => {
    setIsLoading(true);
    setSettingsLoaded(false);
    setSettingsLoadError(null);
    setPlaylistsError(null);
    setExcludedSongsError(null);
    setSaveMessage(null);

    const [settingsRes, playlistsRes, excludedRes] = await Promise.allSettled([
      toolkitApi.get<{ settings: StreamMusicSettings }>("/stream-settings"),
      toolkitApi.get<{ playlists: SpotifyPlaylist[] }>("/spotify/playlists"),
      toolkitApi.get<{ songs: ExcludedSong[] }>("/excluded-songs"),
    ]);

    if (settingsRes.status === "fulfilled") {
      const nextSettings: StreamMusicSettings = {
        ...DEFAULT_SETTINGS,
        ...settingsRes.value.settings,
        permissions: {
          ...DEFAULT_SETTINGS.permissions,
          ...(settingsRes.value.settings?.permissions ?? {}),
        },
      };
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      setSettingsLoaded(true);
    } else {
      setSettingsLoadError(settingsErrorMessage(settingsRes.reason));
    }

    if (playlistsRes.status === "fulfilled") {
      setPlaylists(playlistsRes.value.playlists ?? []);
    } else {
      setPlaylists([]);
      setPlaylistsError(playlistsErrorMessage(playlistsRes.reason));
    }

    if (excludedRes.status === "fulfilled") {
      setExcludedSongs(excludedRes.value.songs ?? []);
    } else {
      setExcludedSongs([]);
      setExcludedSongsError(excludedSongsErrorMessage(excludedRes.reason));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!copiedToken) {
      return;
    }

    const timer = window.setTimeout(() => setCopiedToken(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedToken]);

  useEffect(() => {
    if (streamTokens.length === 0) {
      setPreviewToken(null);
      return;
    }

    if (!previewToken || !streamTokens.some((token) => token.token === previewToken)) {
      setPreviewToken(streamTokens[0]!.token);
    }
  }, [previewToken, streamTokens]);

  async function save() {
    if (!settingsLoaded) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await toolkitApi.put<{ settings: StreamMusicSettings }>(
        "/stream-settings",
        settings,
      );
      const nextSettings: StreamMusicSettings = {
        ...DEFAULT_SETTINGS,
        ...res.settings,
        permissions: {
          ...DEFAULT_SETTINGS.permissions,
          ...(res.settings?.permissions ?? {}),
        },
      };
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      setSaveMessage({ tone: "success", text: "Saved." });
    } catch (error) {
      setSaveMessage({
        text: messageFromError(error, "Failed to save settings."),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function removeExcludedSong(id: string) {
    setRemovingId(id);

    try {
      const res = await toolkitApi.delete<{ songs: ExcludedSong[] }>(
        `/excluded-songs?id=${encodeURIComponent(id)}`,
      );
      setExcludedSongs(res.songs ?? []);
      setExcludedSongsError(null);
    } catch (error) {
      setExcludedSongsError(excludedSongsErrorMessage(error));
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCreateToken() {
    if (widgetTokens.isLoading) {
      return;
    }

    const created = await widgetTokens.createToken({
      label: tokenLabel.trim() || `Stream source ${streamTokens.length + 1}`,
      scopes: ["spotify:read", "spotify:control"],
      surface: "stream",
    });

    if (created) {
      setTokenLabel("");
    }
  }

  async function handleDuplicate(sourceToken: string) {
    const source = streamTokens.find((token) => token.token === sourceToken);
    const duplicate = await widgetTokens.duplicateToken(
      sourceToken,
      `${source?.label ?? "Stream source"} (copy)`,
    );

    if (duplicate) {
      setCopiedToken(null);
    }
  }

  async function handleRegenerate(oldToken: string) {
    const nextToken = await widgetTokens.regenerateToken(oldToken);
    if (!nextToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(getStreamSourceUrl(nextToken));
      setCopiedToken(nextToken);
    } catch {
      setCopiedToken(null);
    }
  }

  function handleCopyUrl(token: string) {
    void navigator.clipboard
      .writeText(getStreamSourceUrl(token))
      .then(() => setCopiedToken(token))
      .catch(() => setCopiedToken(null));
  }

  function setPermission(
    key: keyof StreamMusicSettings["permissions"],
    level: PermissionLevel,
  ) {
    setSettings((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: level },
    }));
  }

  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Stream Music</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Chat commands and stream playlist
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          This is the stream-ready music control panel for chat commands, queue control,
          exclusions, and playlist capture. Each stream browser source comes with the private
          setup link the scene needs to render music controls on stream.
        </p>
      </section>

      {widgetTokens.error ? (
        <div className="toolkit-surface px-6 py-4 text-sm text-red-400">
          {widgetTokens.error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="toolkit-surface px-4 py-5 sm:px-5">
          <p className="toolkit-eyebrow">New stream source</p>
          <p className="mt-4 text-sm leading-6 text-[var(--toolkit-text-muted)]">
            Every stream source includes both
            {" "}
            <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1 py-0.5 text-xs text-[var(--toolkit-text-strong)]">
              spotify:read
            </code>
            {" "}
            and
            {" "}
            <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1 py-0.5 text-xs text-[var(--toolkit-text-strong)]">
              spotify:control
            </code>
            {" "}
            so the same private setup link can power the on-stream player and chat commands
            together.
          </p>
          <input
            className="toolkit-input mt-4"
            onChange={(event) => setTokenLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleCreateToken();
              }
            }}
            placeholder="OBS Stream Scene"
            type="text"
            value={tokenLabel}
          />
          <button
            className="toolkit-button toolkit-button-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={widgetTokens.isLoading}
            onClick={() => {
              void handleCreateToken();
            }}
            type="button"
          >
            Add stream source
          </button>
        </div>

        <div className="toolkit-surface px-4 py-5 sm:px-5">
          <p className="toolkit-eyebrow">Stream browser sources</p>
          {widgetTokens.isLoading ? (
            <p className="mt-4 text-sm text-[var(--toolkit-text-muted)]">Loading sources...</p>
          ) : streamTokens.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[var(--toolkit-text-muted)]">
              No stream sources yet. Add one on the left, then paste its link into your OBS
              browser source.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {streamTokens.map((token) => {
                const sourceUrl = getStreamSourceUrl(token.token);
                const isPreviewing = token.token === previewToken;

                return (
                  <div
                    className={[
                      "cursor-pointer rounded-[14px] border p-4 transition-colors",
                      isPreviewing
                        ? "border-[var(--toolkit-accent)] bg-[rgba(var(--toolkit-accent-rgb),0.06)]"
                        : "border-[var(--toolkit-border)] bg-[var(--toolkit-bg-panel)] hover:border-[var(--toolkit-border-hover)]",
                    ].join(" ")}
                    key={token.token}
                    onClick={() => setPreviewToken(token.token)}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--toolkit-text-strong)]">
                          {token.label ?? "Stream source"}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--toolkit-text-dim)]">
                          {new Date(token.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {isPreviewing ? (
                          <span className="rounded-full bg-[rgba(var(--toolkit-accent-rgb),0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--toolkit-accent)]">
                            previewing
                          </span>
                        ) : null}
                        {token.scopes.map((scope) => (
                          <span
                            className="rounded-full border border-[var(--toolkit-border-strong)] bg-[var(--toolkit-bg-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--toolkit-text-muted)]"
                            key={`${token.token}-${scope}`}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    <MaskedTokenUrl url={sourceUrl} />

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap" onClick={(event) => event.stopPropagation()}>
                      <button
                        className="toolkit-button toolkit-button-primary !min-h-[32px] w-full px-3 text-xs sm:w-auto"
                        onClick={() => handleCopyUrl(token.token)}
                        type="button"
                      >
                        {copiedToken === token.token ? "Copied!" : "Copy link"}
                      </button>
                      <button
                        className="toolkit-button toolkit-button-secondary !min-h-[32px] w-full px-3 text-xs sm:w-auto"
                        onClick={() => {
                          void handleDuplicate(token.token);
                        }}
                        type="button"
                      >
                        Duplicate setup
                      </button>
                      <button
                        className="toolkit-button toolkit-button-secondary !min-h-[32px] w-full px-3 text-xs sm:w-auto"
                        onClick={() => {
                          void handleRegenerate(token.token);
                        }}
                        type="button"
                      >
                        Replace link
                      </button>
                      <button
                        className="toolkit-button toolkit-button-ghost !min-h-[32px] w-full px-3 text-xs text-[var(--toolkit-danger)] hover:text-[var(--toolkit-danger)] sm:w-auto"
                        onClick={() => {
                          void widgetTokens.deleteToken(token.token);
                        }}
                        type="button"
                      >
                        Delete setup
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {previewUrl ? (
        <div className="toolkit-surface overflow-hidden">
          <div className="flex flex-col items-start gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-5">
            <div>
              <p className="toolkit-eyebrow">Live preview</p>
              <p className="mt-1 text-xs text-[var(--toolkit-text-dim)]">
                Centered stream widget preview for the selected stream source.
              </p>
            </div>
            <button
              className="toolkit-button toolkit-button-ghost !min-h-[28px] px-3 text-xs"
              onClick={() => {
                if (previewFrameRef.current && previewToken) {
                  previewFrameRef.current.src = `${getStreamPreviewUrl(previewToken)}&_t=${Date.now()}`;
                }
              }}
              type="button"
            >
              Refresh
            </button>
          </div>
          <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-[var(--toolkit-border)] bg-[#0d1020] sm:mx-6 sm:mb-6" style={{ height: 248 }}>
            <iframe
              ref={previewFrameRef}
              sandbox="allow-scripts allow-same-origin"
              src={previewUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Stream widget preview"
            />
          </div>
        </div>
      ) : null}

      {!settingsLoaded && !isLoading ? (
        <div className="toolkit-surface px-6 py-6">
          <p className="toolkit-eyebrow">Settings unavailable</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
            {settingsLoadError ?? "Couldn't load saved Stream Music settings."}
          </p>
          <button
            className="toolkit-button toolkit-button-primary mt-4"
            onClick={() => {
              void load();
            }}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="toolkit-surface px-6 py-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--toolkit-text-strong)]">
                  Enable chat commands
                </p>
                <p className="mt-0.5 text-xs text-[var(--toolkit-text-muted)]">
                  When off, the stream scene ignores all music commands in chat.
                </p>
              </div>
              <Toggle
                checked={settings.commandsEnabled}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, commandsEnabled: value }))
                }
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--toolkit-text-strong)]">
                Stream playlist
              </p>
              <p className="mb-3 text-xs text-[var(--toolkit-text-muted)]">
                When set, every
                {" "}
                <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1 py-0.5 text-xs">
                  !sr
                </code>
                {" "}
                request is also written to this playlist so you keep a full stream-session music log.
              </p>

              {playlists.length > 0 ? (
                <select
                  className="toolkit-select max-w-xl"
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      streamPlaylistId: event.target.value || null,
                    }))
                  }
                  value={settings.streamPlaylistId ?? ""}
                >
                  <option value="">None - disable auto-add</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name}
                      {playlist.public ? "" : " (private)"}
                    </option>
                  ))}
                </select>
              ) : playlistsError ? (
                <div className="rounded-[14px] border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  <p>{playlistsError}</p>
                  <button
                    className="toolkit-button toolkit-button-secondary mt-3 !min-h-[32px] px-3 text-xs"
                    onClick={() => {
                      void load();
                    }}
                    type="button"
                  >
                    Retry Spotify data
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--toolkit-text-muted)]">
                  No Spotify playlists found. Reuse your connected Spotify account from the
                  {" "}
                  <Link
                    className="text-[var(--toolkit-accent)] underline underline-offset-4"
                    href="/connections"
                  >
                    Connections
                  </Link>
                  {" "}
                  page or create a playlist in Spotify first.
                </p>
              )}
            </div>
          </div>

          <div className="toolkit-surface px-6 py-6">
            <p className="toolkit-eyebrow mb-4">Command permissions</p>
            <p className="mb-5 text-xs text-[var(--toolkit-text-muted)]">
              Set the minimum role required for each command. Higher roles always inherit access.
            </p>
            <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
              <table className="min-w-[38rem] w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--toolkit-border)]">
                    <th className="w-56 py-2 pr-4 text-left text-xs font-medium text-[var(--toolkit-text-muted)]">
                      Command
                    </th>
                    {PERMISSION_LEVELS.map((level) => (
                      <th
                        className="px-3 py-2 text-center text-xs font-medium text-[var(--toolkit-text-muted)] capitalize"
                        key={level}
                      >
                        {level}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMMANDS.map(({ key, label }) => {
                    const current = settings.permissions[key] ?? DEFAULT_SETTINGS.permissions[key];

                    return (
                      <tr className="border-b border-[var(--toolkit-border)] last:border-0" key={key}>
                        <td className="py-3 pr-4 font-mono text-xs text-[var(--toolkit-text-muted)]">
                          {label}
                        </td>
                        {PERMISSION_LEVELS.map((level) => (
                          <td className="px-3 py-3 text-center" key={level}>
                            <button
                              aria-label={`Set ${key} to ${level}`}
                              className={[
                                "mx-auto flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                                current === level
                                  ? "border-[var(--toolkit-accent)] bg-[var(--toolkit-accent)]"
                                  : "border-[var(--toolkit-border-strong)] hover:border-[var(--toolkit-accent)]",
                              ].join(" ")}
                              onClick={() => setPermission(key, level)}
                              type="button"
                            >
                              {current === level ? (
                                <span className="block h-2 w-2 rounded-full bg-white" />
                              ) : null}
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              className="toolkit-button toolkit-button-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isSaving || !isDirty}
              onClick={() => {
                void save();
              }}
              type="button"
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
            {saveMessage ? (
              <span
                className={[
                  "text-sm",
                  saveMessage.tone === "success" ? "text-green-400" : "text-red-400",
                ].join(" ")}
              >
                {saveMessage.text}
              </span>
            ) : null}
            {isDirty && !saveMessage ? (
              <span className="text-xs text-[var(--toolkit-text-muted)]">Unsaved changes</span>
            ) : null}
          </div>

          <div className="toolkit-surface px-6 py-6">
            <p className="toolkit-eyebrow mb-1">Excluded songs</p>
            <p className="mb-5 text-xs text-[var(--toolkit-text-muted)]">
              Songs blocked from
              {" "}
              <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1 py-0.5 text-xs">
                !sr
              </code>
              .
              {" "}
              <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1 py-0.5 text-xs">
                !songout
              </code>
              {" "}
              adds them during the stream; this list is the control surface for cleanup and review.
            </p>

            {excludedSongsError ? (
              <div className="mb-4 rounded-[14px] border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {excludedSongsError}
              </div>
            ) : null}

            {excludedSongs.length === 0 ? (
              <p className="text-xs text-[var(--toolkit-text-muted)]">No excluded songs.</p>
            ) : (
              <div className="space-y-1">
                {excludedSongs.map((song) => (
                  <div
                    className="flex flex-col items-start gap-2 rounded-lg border border-[var(--toolkit-border)] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    key={song.id}
                  >
                    <div>
                      <span className="text-sm text-[var(--toolkit-text-strong)]">{song.name}</span>
                      <span className="ml-2 text-xs text-[var(--toolkit-text-muted)]">{song.artist}</span>
                    </div>
                    <button
                      className="text-xs text-[var(--toolkit-text-muted)] transition-colors hover:text-red-400 disabled:opacity-40"
                      disabled={removingId === song.id}
                      onClick={() => {
                        void removeExcludedSong(song.id);
                      }}
                      type="button"
                    >
                      {removingId === song.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="toolkit-surface px-6 py-6">
        <p className="toolkit-eyebrow mb-4">Setup requirements</p>
        <ul className="space-y-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
          <li>
            Use a stream source from this page. Its setup link already includes the read and
            control access the stream scene needs, so you do not need a separate Player source.
          </li>
          <li>
            If playlist loading fails, reconnect Spotify from the
            {" "}
            <Link
              className="text-[var(--toolkit-accent)] underline underline-offset-4"
              href="/connections"
            >
              Connections
            </Link>
            {" "}
            page before saving command settings.
          </li>
          <li>
            Use the full browser source link copied from this page. The private
            {" "}
            <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1.5 py-0.5 text-xs text-[var(--toolkit-text-strong)]">
              wid
            </code>
            {" "}
            value inside that link tells the scene which stream source to load.
          </li>
        </ul>
      </div>

      <EditorFeedComposer
        defaultKind="music_event"
        description="Push a high-signal music note into the shared editor feed when a song request lands, a moderator skips a track, or chat reacts strongly to a song. The item inherits the latest mirrored VOD/session context by default."
        submitLabel="Queue music event"
        title="Music event handoff"
      />
    </div>
  );
}
