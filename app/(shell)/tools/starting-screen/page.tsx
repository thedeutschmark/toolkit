"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MaskedTokenUrl from "@/components/toolkit/MaskedTokenUrl";
import { ToolkitApiError, toolkitApi } from "@/lib/toolkitApi";
import { WIDGET_HOST_URL } from "@/lib/toolkitEnv";
import useWidgetTokens from "@/lib/useWidgetTokens";

interface StreamSceneSettings {
  countdownPrefix: string;
  dmHoldSeconds: number;
  endHeroText: string;
  idleEndingText: string;
  idleStartingText: string;
  labelText: string;
  startHeroText: string;
  titleCardHoldSeconds: number;
}

interface StreamSettingsResponse {
  settings?: {
    scene?: Partial<StreamSceneSettings>;
  };
}

const DEFAULT_STREAM_SCENE_SETTINGS: StreamSceneSettings = {
  countdownPrefix: "starting in",
  dmHoldSeconds: 16,
  endHeroText: "ENDING SOON",
  idleEndingText: "ending soon",
  idleStartingText: "starting soon",
  labelText: "the stream is",
  startHeroText: "STARTING SOON",
  titleCardHoldSeconds: 8,
};

function getStreamSourceUrl(token: string) {
  return `${WIDGET_HOST_URL}/stream/?wid=${token}`;
}

function getStartingScreenPreviewUrl(token: string) {
  return `${WIDGET_HOST_URL}/stream/?wid=${token}`;
}

function mergeSceneSettings(partial?: Partial<StreamSceneSettings> | null) {
  return {
    ...DEFAULT_STREAM_SCENE_SETTINGS,
    ...(partial ?? {}),
  };
}

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof ToolkitApiError) {
    return error.message || fallback;
  }

  return fallback;
}

export default function StartingScreenWidgetPage() {
  const widgetTokens = useWidgetTokens();
  const [scene, setScene] = useState<StreamSceneSettings>(DEFAULT_STREAM_SCENE_SETTINGS);
  const [savedScene, setSavedScene] = useState<StreamSceneSettings>(DEFAULT_STREAM_SCENE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [tokenLabel, setTokenLabel] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const streamTokens = useMemo(
    () => widgetTokens.tokens.filter((token) => token.surface === "stream"),
    [widgetTokens.tokens],
  );

  const previewUrl = useMemo(
    () => (previewToken ? getStartingScreenPreviewUrl(previewToken) : null),
    [previewToken],
  );

  const isDirty = JSON.stringify(scene) !== JSON.stringify(savedScene);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setSaveMessage(null);

    try {
      const response = await toolkitApi.get<StreamSettingsResponse>("/stream-settings");
      const next = mergeSceneSettings(response.settings?.scene);
      setScene(next);
      setSavedScene(next);
    } catch (error) {
      setLoadError(messageFromError(error, "Couldn't load Starting Screen settings."));
    } finally {
      setIsLoading(false);
    }
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

  function setField<K extends keyof StreamSceneSettings>(key: K, value: StreamSceneSettings[K]) {
    setScene((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await toolkitApi.put<StreamSettingsResponse>("/stream-settings", {
        scene,
      });
      const next = mergeSceneSettings(response.settings?.scene);
      setScene(next);
      setSavedScene(next);
      setSaveMessage({ tone: "success", text: "Saved." });
    } catch (error) {
      setSaveMessage({
        text: messageFromError(error, "Failed to save Starting Screen settings."),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
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
    await widgetTokens.duplicateToken(
      sourceToken,
      `${source?.label ?? "Stream source"} (copy)`,
    );
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

  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Starting Screen</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Starting Soon and Ending Soon scene settings
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          This controls the title-card copy and timing on the OBS
          {" "}
          <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1 py-0.5 text-xs text-[var(--toolkit-text-strong)]">
            /stream
          </code>
          {" "}
          route. It uses the same stream browser source as chat commands and the Stream Music surface.
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
            Starting screens, ending screens, and music commands all use the same private
            {" "}
            <code className="rounded bg-[var(--toolkit-bg-subtle)] px-1 py-0.5 text-xs text-[var(--toolkit-text-strong)]">
              /stream
            </code>
            {" "}
            browser source link.
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
              No stream sources yet. Add one on the left, then paste its link into your OBS browser source.
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
              <p className="toolkit-eyebrow">Scene preview</p>
              <p className="mt-1 text-xs text-[var(--toolkit-text-dim)]">
                Preview the selected stream source on the full stream route. OBS still decides whether the page is in starting or ending mode.
              </p>
            </div>
            <button
              className="toolkit-button toolkit-button-ghost !min-h-[28px] px-3 text-xs"
              onClick={() => {
                if (previewFrameRef.current && previewToken) {
                  previewFrameRef.current.src = `${getStartingScreenPreviewUrl(previewToken)}&_t=${Date.now()}`;
                }
              }}
              type="button"
            >
              Refresh
            </button>
          </div>
          <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-[var(--toolkit-border)] bg-[#06080f] sm:mx-6 sm:mb-6" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              ref={previewFrameRef}
              sandbox="allow-scripts allow-same-origin"
              src={previewUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Starting screen preview"
            />
          </div>
        </div>
      ) : null}

      {loadError ? (
        <div className="toolkit-surface px-6 py-6">
          <p className="toolkit-eyebrow">Settings unavailable</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
            {loadError}
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
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="toolkit-surface px-6 py-6 space-y-5">
              <p className="toolkit-eyebrow">Copy</p>

              <div className="space-y-2">
                <label className="text-sm text-[var(--toolkit-text)]">Small label</label>
                <input
                  className="toolkit-input"
                  disabled={isLoading}
                  maxLength={36}
                  onChange={(event) => setField("labelText", event.target.value)}
                  placeholder="the stream is"
                  type="text"
                  value={scene.labelText}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--toolkit-text)]">Countdown prefix</label>
                <input
                  className="toolkit-input"
                  disabled={isLoading}
                  maxLength={28}
                  onChange={(event) => setField("countdownPrefix", event.target.value)}
                  placeholder="starting in"
                  type="text"
                  value={scene.countdownPrefix}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[var(--toolkit-text)]">Starting hero</label>
                  <input
                    className="toolkit-input"
                    disabled={isLoading}
                    maxLength={32}
                    onChange={(event) => setField("startHeroText", event.target.value)}
                    placeholder="STARTING SOON"
                    type="text"
                    value={scene.startHeroText}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--toolkit-text)]">Ending hero</label>
                  <input
                    className="toolkit-input"
                    disabled={isLoading}
                    maxLength={32}
                    onChange={(event) => setField("endHeroText", event.target.value)}
                    placeholder="ENDING SOON"
                    type="text"
                    value={scene.endHeroText}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[var(--toolkit-text)]">Idle starting text</label>
                  <input
                    className="toolkit-input"
                    disabled={isLoading}
                    maxLength={28}
                    onChange={(event) => setField("idleStartingText", event.target.value)}
                    placeholder="starting soon"
                    type="text"
                    value={scene.idleStartingText}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--toolkit-text)]">Idle ending text</label>
                  <input
                    className="toolkit-input"
                    disabled={isLoading}
                    maxLength={28}
                    onChange={(event) => setField("idleEndingText", event.target.value)}
                    placeholder="ending soon"
                    type="text"
                    value={scene.idleEndingText}
                  />
                </div>
              </div>
            </div>

            <div className="toolkit-surface px-6 py-6 space-y-5">
              <p className="toolkit-eyebrow">Timing</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[var(--toolkit-text)]">DM logo hold</label>
                  <span className="text-sm text-[var(--toolkit-text-muted)]">{scene.dmHoldSeconds}s</span>
                </div>
                <input
                  className="w-full accent-[var(--toolkit-accent)]"
                  disabled={isLoading}
                  max={60}
                  min={4}
                  onChange={(event) => setField("dmHoldSeconds", Number(event.target.value))}
                  step={1}
                  type="range"
                  value={scene.dmHoldSeconds}
                />
                <p className="text-xs text-[var(--toolkit-text-dim)]">
                  How long the DM logo stays on-screen before cycling to the title card while idle.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[var(--toolkit-text)]">Title card hold</label>
                  <span className="text-sm text-[var(--toolkit-text-muted)]">{scene.titleCardHoldSeconds}s</span>
                </div>
                <input
                  className="w-full accent-[var(--toolkit-accent)]"
                  disabled={isLoading}
                  max={60}
                  min={4}
                  onChange={(event) => setField("titleCardHoldSeconds", Number(event.target.value))}
                  step={1}
                  type="range"
                  value={scene.titleCardHoldSeconds}
                />
                <p className="text-xs text-[var(--toolkit-text-dim)]">
                  How long the Starting Soon or Ending Soon title card remains visible during the idle loop.
                </p>
              </div>

              <div className="rounded-[14px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-4 text-sm leading-6 text-[var(--toolkit-text-muted)]">
                The OBS scene name still controls whether the page shows the starting or ending variant.
                These settings only change the text and timing on that scene.
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              className="toolkit-button toolkit-button-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || isSaving || !isDirty}
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
        </>
      )}
    </div>
  );
}
