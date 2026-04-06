"use client";

import { RefreshCcw, Trash2 } from "lucide-react";
import { formatEditorTimecode, formatEditorUpdatedAt } from "@/lib/editorSummary";
import { labelEditorFeedKind } from "@/lib/editorFeed";
import useEditorFeed from "@/lib/useEditorFeed";

interface EditorFeedPanelProps {
  compact?: boolean;
  maxItems?: number;
}

export default function EditorFeedPanel({
  compact = false,
  maxItems = compact ? 4 : 8,
}: EditorFeedPanelProps) {
  const { error, isLoading, items, refresh, remove } = useEditorFeed();
  const visibleItems = items.slice(0, maxItems);

  return (
    <section className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="toolkit-eyebrow">Editor feed</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--toolkit-text-strong)]">
            Shared handoff items
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
            Chat bookmarks and music events land here before `Alert! Alert!` imports them into the local reel project.
          </p>
        </div>

        <button
          className="toolkit-button toolkit-button-secondary"
          disabled={isLoading}
          onClick={() => void refresh()}
          type="button"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-[18px] border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {visibleItems.length === 0 ? (
        <p className="mt-5 text-sm leading-7 text-[var(--toolkit-text-muted)]">
          {isLoading
            ? "Loading the shared editor feed."
            : "No chat or music feed items yet. Use the forms below to push candidate moments into the local editor queue."}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {visibleItems.map((item) => (
            <article
              className="rounded-[20px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-4"
              key={item.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-[rgba(var(--toolkit-accent-rgb),0.25)] bg-[rgba(var(--toolkit-accent-rgb),0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--toolkit-text-strong)]">
                      {labelEditorFeedKind(item.kind)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--toolkit-text-dim)]">
                      {formatEditorTimecode(item.startSec)} to {formatEditorTimecode(item.endSec)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold tracking-[-0.03em] text-[var(--toolkit-text-strong)]">
                    {item.title}
                  </h3>
                  {item.note ? (
                    <p className="mt-2 text-sm leading-7 text-[var(--toolkit-text-muted)]">
                      {item.note}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--toolkit-text-dim)]">
                    {item.sessionLabel ? <span>Session: {item.sessionLabel}</span> : null}
                    {item.channelName ? <span>Channel: {item.channelName}</span> : null}
                    <span>{formatEditorUpdatedAt(item.createdAt)}</span>
                  </div>
                </div>

                <button
                  className="toolkit-button toolkit-button-ghost !min-h-[32px] px-3 text-xs text-[var(--toolkit-danger)] hover:text-[var(--toolkit-danger)]"
                  onClick={() => {
                    void remove(item.id);
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
