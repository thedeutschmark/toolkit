"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MaskedTokenUrl from "@/components/toolkit/MaskedTokenUrl";
import { WIDGET_HOST_URL } from "@/lib/toolkitEnv";
import useWidgetTokens from "@/lib/useWidgetTokens";
import type { WidgetTokenRecord } from "@/lib/useWidgetTokens";
import {
  DEFAULT_WIDGET_CONFIG,
  SKIN_LIST,
  COVER_SHAPE_LIST,
  ANIMATION_LIST,
  FONT_ALLOWLIST,
  SKIN_RESTRICTIONS,
  type WidgetConfig,
} from "@deutschmark/widget-config";

function getPlayerSourceUrl(token: string) {
  return `${WIDGET_HOST_URL}/player/?wid=${token}`;
}

function getPlayerPreviewUrl(token: string) {
  return `${WIDGET_HOST_URL}/widget-preview/?surface=player&wid=${token}`;
}

/* ─── Small shared UI helpers ─── */

function Toggle({ checked, onChange, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--toolkit-accent)]",
        disabled ? "opacity-40 cursor-not-allowed" : "",
        checked ? "bg-[var(--toolkit-accent)]" : "bg-[var(--toolkit-border-strong)]",
      ].join(" ")}
    >
      <span className={[
        "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-6" : "translate-x-1",
      ].join(" ")} />
    </button>
  );
}

function OptionPicker<T extends string>({ options, value, onChange, disabled, labels }: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
            value === opt
              ? "border-[var(--toolkit-accent)] bg-[rgba(var(--toolkit-accent-rgb),0.12)] text-[var(--toolkit-text-strong)]"
              : "border-[var(--toolkit-border-strong)] bg-[var(--toolkit-bg-subtle)] text-[var(--toolkit-text-muted)] hover:border-[var(--toolkit-border-hover)] hover:text-[var(--toolkit-text-strong)]",
          ].join(" ")}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}

function FormRow({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <span className="text-sm text-[var(--toolkit-text)]">{label}</span>
        {note && <p className="mt-0.5 text-xs text-[var(--toolkit-text-dim)]">{note}</p>}
      </div>
      <div className="w-full sm:w-auto sm:flex-shrink-0">{children}</div>
    </div>
  );
}

/* ─── Config Editor ─── */

function WidgetConfigEditor({ token, onSaved }: {
  token: WidgetTokenRecord;
  onSaved: (newPreviewUrl: string) => void;
}) {
  const widgetTokens = useWidgetTokens();
  const [draft, setDraft] = useState<WidgetConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<WidgetConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load config when token changes
  useEffect(() => {
    setDraft(null);
    setSavedConfig(null);
    setSaveError(null);
    void widgetTokens.fetchConfig(token.token).then((config) => {
      if (config) {
        setDraft(config);
        setSavedConfig(config);
      }
    });
  }, [token.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = useMemo(() => {
    if (!draft || !savedConfig) return false;
    return JSON.stringify(draft) !== JSON.stringify(savedConfig);
  }, [draft, savedConfig]);

  // Unsaved changes guard (U5)
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function set<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);
  }

  async function handleSave() {
    if (!draft) return;
    setIsSaving(true);
    setSaveError(null);
    const saved = await widgetTokens.updateConfig(token.token, draft);
    setIsSaving(false);
    if (saved) {
      setSavedConfig(saved);
      setDraft(saved);
      onSaved(`${getPlayerPreviewUrl(token.token)}&_t=${Date.now()}`);
    } else {
      setSaveError("Failed to save config.");
    }
  }

  if (!draft) {
    return <p className="py-6 text-sm text-[var(--toolkit-text-muted)]">Loading config…</p>;
  }

  const restrictions = SKIN_RESTRICTIONS[draft.skin] ?? {};
  const coverShapeDisabled = !!restrictions.forceCoverShape;
  const fontDisabled = !!restrictions.forceFont;
  const blurForced = restrictions.coverBlur === true;

  const skinLabels: Partial<Record<typeof SKIN_LIST[number], string>> = {
    compact: "Compact",
    boxy: "Boxy",
    gallery: "Gallery",
    minimal: "Minimal",
    macos: "macOS",
    shell: "Shell",
    discord: "Discord",
  };

  const shapeLabels: Partial<Record<typeof COVER_SHAPE_LIST[number], string>> = {
    square: "Square",
    canvas: "Canvas",
    vinyl: "Vinyl",
    none: "None",
  };

  const animLabels: Partial<Record<typeof ANIMATION_LIST[number], string>> = {
    original: "Original",
    fade: "Fade",
    slide_left: "Slide ←",
    slide_right: "Slide →",
    slide_top: "Slide ↑",
    slide_bottom: "Slide ↓",
    grow: "Grow",
    shrink: "Shrink",
    swing_left: "Swing ←",
    swing_right: "Swing →",
    tilt_right: "Tilt →",
    tilt_left: "Tilt ←",
    none: "None",
  };

  return (
    <div className="space-y-6">
      {/* ─── Appearance ─── */}
      <div className="toolkit-surface px-6 py-6 space-y-5">
        <p className="toolkit-eyebrow">Appearance</p>

        <div className="space-y-1">
          <span className="text-sm text-[var(--toolkit-text)]">Skin</span>
          <div className="mt-2">
            <OptionPicker
              options={SKIN_LIST}
              value={draft.skin}
              onChange={v => set("skin", v)}
              labels={skinLabels}
            />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-sm text-[var(--toolkit-text)]">
            Cover shape
            {coverShapeDisabled && (
              <span className="ml-2 text-xs text-[var(--toolkit-text-dim)]">
                ({draft.skin === "macos" ? "macOS uses Vinyl" : draft.skin === "minimal" ? "Minimal hides art" : "locked by skin"})
              </span>
            )}
          </span>
          <div className="mt-2">
            <OptionPicker
              options={COVER_SHAPE_LIST}
              value={restrictions.forceCoverShape ?? draft.coverShape}
              onChange={v => set("coverShape", v)}
              disabled={coverShapeDisabled}
              labels={shapeLabels}
            />
          </div>
        </div>

        <FormRow label="Cover glow">
          <Toggle checked={draft.coverGlow} onChange={v => set("coverGlow", v)} />
        </FormRow>

        <FormRow
          label="Cover blur"
          note={blurForced ? "Always on for this skin" : draft.coverBlur ? "May impact OBS encoding on low-end hardware" : undefined}
        >
          <Toggle
            checked={blurForced || draft.coverBlur}
            onChange={v => set("coverBlur", v)}
            disabled={blurForced}
          />
        </FormRow>

        <div className="space-y-1">
          <label className="text-sm text-[var(--toolkit-text)]">
            Idle cover URL
            <span className="ml-2 text-xs text-[var(--toolkit-text-dim)]">(shown when nothing playing)</span>
          </label>
          <input
            type="url"
            className="toolkit-input mt-1"
            value={draft.idleCoverUrl ?? ""}
            placeholder="https://… or leave blank for default ♪"
            onChange={e => set("idleCoverUrl", e.target.value || null)}
          />
        </div>
      </div>

      {/* ─── Colors ─── */}
      <div className="toolkit-surface px-6 py-6 space-y-5">
        <p className="toolkit-eyebrow">Colors</p>

        <FormRow label="Theme">
          <OptionPicker
            options={["dark", "light"] as const}
            value={draft.theme}
            onChange={v => set("theme", v)}
          />
        </FormRow>

        <FormRow label="Tint color">
          <div className="flex items-center gap-3">
            <OptionPicker
              options={["album", "fixed"] as const}
              value={draft.tintMode}
              onChange={v => set("tintMode", v)}
              labels={{ album: "From album art", fixed: "Fixed" }}
            />
            <input
              type="color"
              className="h-8 w-10 cursor-pointer rounded border border-[var(--toolkit-border-strong)] bg-transparent p-0.5"
              value={draft.tintColor}
              onChange={e => { set("tintColor", e.target.value); set("tintMode", "fixed"); }}
            />
          </div>
        </FormRow>
      </div>

      {/* ─── Animations ─── */}
      <div className="toolkit-surface px-6 py-6 space-y-5">
        <p className="toolkit-eyebrow">Animations</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-[var(--toolkit-text)]">Reveal</label>
            <select
              className="toolkit-select"
              value={draft.reveal}
              onChange={e => set("reveal", e.target.value as WidgetConfig["reveal"])}
            >
              {ANIMATION_LIST.map(anim => (
                <option key={anim} value={anim}>{animLabels[anim] ?? anim}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--toolkit-text)]">Exit</label>
            <select
              className="toolkit-select"
              value={draft.exit}
              onChange={e => set("exit", e.target.value as WidgetConfig["exit"])}
            >
              {ANIMATION_LIST.map(anim => (
                <option key={anim} value={anim}>{animLabels[anim] ?? anim}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Typography ─── */}
      <div className="toolkit-surface px-6 py-6 space-y-5">
        <p className="toolkit-eyebrow">Typography</p>

        <div className="space-y-2">
          <label className="text-sm text-[var(--toolkit-text)]">
            Font
            {fontDisabled && (
              <span className="ml-2 text-xs text-[var(--toolkit-text-dim)]">
                (Shell uses Space Mono)
              </span>
            )}
          </label>
          <select
            className="toolkit-select"
            value={fontDisabled ? "Space Mono" : draft.fontFamily}
            disabled={fontDisabled}
            onChange={e => set("fontFamily", e.target.value)}
          >
            {FONT_ALLOWLIST.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-[var(--toolkit-text)]">Idle title</label>
            <input
              type="text"
              className="toolkit-input"
              value={draft.idleTitle}
              maxLength={50}
              placeholder="nothing playing"
              onChange={e => set("idleTitle", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--toolkit-text)]">Idle artist</label>
            <input
              type="text"
              className="toolkit-input"
              value={draft.idleArtist}
              maxLength={80}
              placeholder="(blank)"
              onChange={e => set("idleArtist", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ─── Visibility ─── */}
      <div className="toolkit-surface px-6 py-6 space-y-5">
        <p className="toolkit-eyebrow">Visibility</p>

        <FormRow label="Hide on pause">
          <Toggle checked={draft.hideOnPause} onChange={v => set("hideOnPause", v)} />
        </FormRow>

        {draft.hideOnPause && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--toolkit-text)]">Hide delay</label>
              <span className="text-sm text-[var(--toolkit-text-muted)]">{draft.hideDelaySec}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={1}
              className="w-full accent-[var(--toolkit-accent)]"
              value={draft.hideDelaySec}
              onChange={e => set("hideDelaySec", Number(e.target.value))}
            />
          </div>
        )}

        <FormRow label="Song change only" note="Widget appears only on new tracks, then hides after a duration">
          <Toggle checked={draft.songChangeOnly} onChange={v => set("songChangeOnly", v)} />
        </FormRow>

        {draft.songChangeOnly && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--toolkit-text)]">Visible duration</label>
              <span className="text-sm text-[var(--toolkit-text-muted)]">{draft.visibleDurationSec}s</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              className="w-full accent-[var(--toolkit-accent)]"
              value={draft.visibleDurationSec}
              onChange={e => set("visibleDurationSec", Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* ─── Elements ─── */}
      <div className="toolkit-surface px-6 py-6 space-y-5">
        <p className="toolkit-eyebrow">Elements</p>
        <FormRow label="Show visualizer">
          <Toggle checked={draft.showVisualizer} onChange={v => set("showVisualizer", v)} />
        </FormRow>
        <FormRow label="Show progress bar">
          <Toggle checked={draft.showProgress} onChange={v => set("showProgress", v)} />
        </FormRow>
        <FormRow label="Show timestamps">
          <Toggle checked={draft.showTimestamps} onChange={v => set("showTimestamps", v)} />
        </FormRow>
      </div>

      {/* ─── Save ─── */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="button"
          className="toolkit-button toolkit-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isDirty || isSaving}
          onClick={() => { void handleSave(); }}
        >
          {isSaving ? "Saving…" : "Save config"}
        </button>
        {isDirty && !isSaving && (
          <span className="text-sm text-[var(--toolkit-text-dim)]">Unsaved changes</span>
        )}
        {saveError && (
          <span className="text-sm text-[var(--toolkit-danger)]">{saveError}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function ToolkitPlayerWidgetPage() {
  const widgetTokens = useWidgetTokens();
  const [label, setLabel] = useState("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const playerTokens = useMemo(
    () => widgetTokens.tokens.filter((token) => token.surface === "player"),
    [widgetTokens.tokens],
  );

  const selectedTokenRecord = useMemo(
    () => playerTokens.find(t => t.token === selectedToken) ?? null,
    [playerTokens, selectedToken],
  );

  // Auto-select first token on load
  useEffect(() => {
    if (playerTokens.length > 0 && !selectedToken) {
      setSelectedToken(playerTokens[0]!.token);
      setPreviewUrl(getPlayerPreviewUrl(playerTokens[0]!.token));
    }
  }, [playerTokens, selectedToken]);

  async function handleCreateToken() {
    const created = await widgetTokens.createToken({
      label: label.trim() || `Player source ${playerTokens.length + 1}`,
      scopes: ["spotify:read"],
      surface: "player",
    });
    if (created) {
      setLabel("");
      setSelectedToken(created.token);
      setPreviewUrl(getPlayerPreviewUrl(created.token));
    }
  }

  async function handleDuplicate(sourceToken: string) {
    const source = playerTokens.find(t => t.token === sourceToken);
    const created = await widgetTokens.duplicateToken(
      sourceToken,
      `${source?.label ?? "Player source"} (copy)`,
    );
    if (created) {
      setSelectedToken(created.token);
      setPreviewUrl(getPlayerPreviewUrl(created.token));
    }
  }

  async function handleRegenerate(oldToken: string) {
    const newToken = await widgetTokens.regenerateToken(oldToken);
    if (newToken) {
      await navigator.clipboard.writeText(getPlayerSourceUrl(newToken));
      setSelectedToken(newToken);
      setPreviewUrl(getPlayerPreviewUrl(newToken));
    }
  }

  function handleCopyUrl(token: string) {
    void navigator.clipboard.writeText(getPlayerSourceUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function handleSaved(newUrl: string) {
    setPreviewUrl(newUrl);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Player widget</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Now Playing setup
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Each browser source is its own setup with separate styling, preview, and private OBS
          link. Name each source once, customise it independently, and paste the copied link
          straight into OBS.
        </p>
      </section>

      {widgetTokens.error && (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-6 py-4 text-sm text-amber-100">
          {widgetTokens.error}
        </div>
      )}

      {/* Token list + create */}
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        {/* Left: token list */}
        <div className="space-y-4">
          {/* Create token */}
          <div className="toolkit-surface px-4 py-5 sm:px-5">
            <p className="toolkit-eyebrow">New player source</p>
            <input
              className="toolkit-input mt-4"
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void handleCreateToken(); }}
              placeholder="OBS Main Scene"
              type="text"
              value={label}
            />
            <button
              className="toolkit-button toolkit-button-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={widgetTokens.isLoading}
              onClick={() => { void handleCreateToken(); }}
              type="button"
            >
              Add player source
            </button>
          </div>

          {/* Token cards */}
          {widgetTokens.isLoading ? (
            <p className="px-1 text-sm text-[var(--toolkit-text-muted)]">Loading player sources…</p>
          ) : playerTokens.length === 0 ? (
            <p className="px-1 text-sm leading-6 text-[var(--toolkit-text-muted)]">
              No player sources yet. Add one above.
            </p>
          ) : (
            <div className="space-y-2">
              {playerTokens.map((t) => {
                const sourceUrl = getPlayerSourceUrl(t.token);
                const isSelected = t.token === selectedToken;
                return (
                  <div
                    key={t.token}
                    className={[
                      "rounded-[14px] border p-4 cursor-pointer transition-colors",
                      isSelected
                        ? "border-[var(--toolkit-accent)] bg-[rgba(var(--toolkit-accent-rgb),0.06)]"
                        : "border-[var(--toolkit-border)] bg-[var(--toolkit-bg-panel)] hover:border-[var(--toolkit-border-hover)]",
                    ].join(" ")}
                    onClick={() => {
                      setSelectedToken(t.token);
                      setPreviewUrl(getPlayerPreviewUrl(t.token));
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--toolkit-text-strong)]">
                          {t.label ?? "Player source"}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--toolkit-text-dim)]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="self-start rounded-full bg-[rgba(var(--toolkit-accent-rgb),0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--toolkit-accent)] sm:self-auto">
                          selected
                        </span>
                      )}
                    </div>

                    {/* URL row */}
                    <MaskedTokenUrl url={sourceUrl} />

                    {/* Actions */}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="toolkit-button toolkit-button-primary !min-h-[32px] w-full px-3 text-xs sm:w-auto"
                        onClick={() => handleCopyUrl(t.token)}
                        title="This setup link is private, so avoid sharing it publicly"
                      >
                        {copiedToken === t.token ? "Copied!" : "Copy link"}
                      </button>
                      <button
                        type="button"
                        className="toolkit-button toolkit-button-secondary !min-h-[32px] w-full px-3 text-xs sm:w-auto"
                        onClick={() => void handleDuplicate(t.token)}
                      >
                        Duplicate setup
                      </button>
                      <button
                        type="button"
                        className="toolkit-button toolkit-button-secondary !min-h-[32px] w-full px-3 text-xs sm:w-auto"
                        onClick={() => void handleRegenerate(t.token)}
                        title="Creates a fresh private link with the same settings, turns off the old link, and copies the new one"
                      >
                        Replace link
                      </button>
                      <button
                        type="button"
                        className="toolkit-button toolkit-button-ghost !min-h-[32px] w-full px-3 text-xs text-[var(--toolkit-danger)] hover:text-[var(--toolkit-danger)] sm:w-auto"
                        onClick={() => {
                          if (t.token === selectedToken) setSelectedToken(null);
                          void widgetTokens.deleteToken(t.token);
                        }}
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

        {/* Right: config editor + preview */}
        <div className="space-y-4 min-w-0">
          {selectedTokenRecord ? (
            <>
              {/* Live preview iframe */}
              {previewUrl && (
                <div className="toolkit-surface overflow-hidden">
                  <div className="flex flex-col items-start gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pt-5">
                    <p className="toolkit-eyebrow">Live preview</p>
                    <button
                      type="button"
                      className="toolkit-button toolkit-button-ghost !min-h-[28px] px-3 text-xs"
                      onClick={() => {
                        if (iframeRef.current) {
                          iframeRef.current.src = `${getPlayerPreviewUrl(selectedTokenRecord.token)}&_t=${Date.now()}`;
                        }
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="mx-4 mb-4 overflow-hidden rounded-xl bg-[#1a1a2e] sm:mx-5 sm:mb-5" style={{ height: 180 }}>
                    <iframe
                      ref={iframeRef}
                      src={previewUrl}
                      title="Widget preview"
                      style={{ width: "100%", height: "100%", border: "none" }}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              )}

              {/* Config editor */}
              <WidgetConfigEditor
                key={selectedTokenRecord.token}
                token={selectedTokenRecord}
                onSaved={handleSaved}
              />
            </>
          ) : (
            <div className="toolkit-surface px-6 py-10 text-center">
              <p className="text-sm text-[var(--toolkit-text-muted)]">
                Select a player source on the left to configure it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
