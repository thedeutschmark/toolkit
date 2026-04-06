"use client";

import useToolkitSettings from "@/lib/useToolkitSettings";
import useWidgetTokens from "@/lib/useWidgetTokens";

export default function ToolkitSettingsPage() {
  const settings = useToolkitSettings();
  const widgetTokens = useWidgetTokens();

  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Settings</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Preferences and source management
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Toolkit defaults are saved through the auth worker, and every issued widget source can be reviewed from here.
        </p>
      </section>

      {settings.error ? (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-6 py-4 text-sm text-amber-100">
          {settings.error}
        </div>
      ) : null}

      {widgetTokens.error ? (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-6 py-4 text-sm text-amber-100">
          {widgetTokens.error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
          <p className="toolkit-eyebrow">
            Theme
          </p>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm text-stone-300">
              <span>Toolkit theme</span>
              <select
                className="toolkit-select"
                disabled={settings.isLoading || settings.isSaving}
                onChange={(event) => {
                  void settings.save({
                    ...settings.settings,
                    theme: event.target.value as "graphite" | "night" | "obs",
                  });
                }}
                value={settings.settings.theme ?? "graphite"}
              >
                <option value="graphite">Graphite</option>
                <option value="night">Night</option>
                <option value="obs">OBS</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-stone-300">
              <span>Default player mode</span>
              <select
                className="toolkit-select"
                disabled={settings.isLoading || settings.isSaving}
                onChange={(event) => {
                  void settings.save({
                    ...settings.settings,
                    playerMode: event.target.value as "compact" | "overlay" | "minimal",
                  });
                }}
                value={settings.settings.playerMode ?? "compact"}
              >
                <option value="compact">Compact</option>
                <option value="overlay">Overlay</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
          </div>

          <p className="mt-5 text-sm text-[var(--toolkit-text-muted)]">
            {settings.isSaving ? "Saving…" : "Changes save back to the auth worker settings record."}
          </p>
        </div>

        <div className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
          <p className="toolkit-eyebrow">
            Widget sources
          </p>
          {widgetTokens.isLoading ? (
            <p className="mt-4 text-sm text-[var(--toolkit-text-muted)]">Loading sources…</p>
          ) : widgetTokens.tokens.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--toolkit-text-muted)]">
              No widget sources created yet. Add one from the player or stream widget pages.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {widgetTokens.tokens.map((token) => (
                <div
                  key={token.token}
                  className="toolkit-surface-subtle px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-[var(--toolkit-text-strong)]">
                        {token.label || `${token.surface} source`}
                      </p>
                      <p className="mt-1 text-xs text-[var(--toolkit-text-dim)]">
                        {token.surface} · {new Date(token.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="toolkit-button toolkit-button-ghost !min-h-0 self-start px-0 py-0 text-xs uppercase tracking-[0.16em]"
                      onClick={() => {
                        void widgetTokens.deleteToken(token.token);
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
