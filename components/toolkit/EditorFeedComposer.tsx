"use client";

import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { createEditorFeedItem, emptyEditorFeedDraft, type EditorFeedItemKind } from "@/lib/editorFeed";
import useEditorSummary from "@/lib/useEditorSummary";

interface EditorFeedComposerProps {
  defaultKind: EditorFeedItemKind;
  description: string;
  submitLabel: string;
  title: string;
}

function parseTimecode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null;
  }

  if (parts.length === 1) return parts[0] ?? 0;
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }

  return null;
}

function formatTimecodeInput(value: number) {
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function EditorFeedComposer({
  defaultKind,
  description,
  submitLabel,
  title,
}: EditorFeedComposerProps) {
  const { summary } = useEditorSummary();
  const initialWindow = useMemo(() => {
    const start = summary.latestCandidate?.startSec ?? 0;
    const end = summary.latestCandidate?.endSec ?? Math.max(start + 30, 30);
    return {
      endSec: end,
      startSec: start,
    };
  }, [summary.latestCandidate?.endSec, summary.latestCandidate?.startSec]);
  const [draft, setDraft] = useState(() => emptyEditorFeedDraft(defaultKind));
  const [startInput, setStartInput] = useState("0:00");
  const [endInput, setEndInput] = useState("0:30");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      channelName: summary.channelName,
      endSec: initialWindow.endSec,
      kind: defaultKind,
      projectId: summary.projectId,
      sessionLabel: summary.sessionLabel,
      startSec: initialWindow.startSec,
      videoId: summary.latestCandidate?.videoId ?? null,
      vodOffset: summary.latestCandidate?.vodOffset ?? initialWindow.startSec,
      vodUrl: summary.vodUrl,
    }));
    setStartInput(formatTimecodeInput(initialWindow.startSec));
    setEndInput(formatTimecodeInput(initialWindow.endSec));
  }, [
    defaultKind,
    initialWindow.endSec,
    initialWindow.startSec,
    summary.channelName,
    summary.latestCandidate?.videoId,
    summary.latestCandidate?.vodOffset,
    summary.projectId,
    summary.sessionLabel,
    summary.vodUrl,
  ]);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    const startSec = parseTimecode(startInput);
    const endSec = parseTimecode(endInput);

    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (startSec === null || endSec === null) {
      setError("Use `m:ss` or `h:mm:ss` for times.");
      return;
    }

    if (endSec <= startSec) {
      setError("End time must be after the start time.");
      return;
    }

    setIsSaving(true);

    try {
      await createEditorFeedItem({
        ...draft,
        endSec,
        note: draft.note?.trim() || null,
        startSec,
        title: draft.title.trim(),
        vodOffset: draft.vodOffset ?? startSec,
      });
      window.dispatchEvent(new CustomEvent("dm:editor-feed-changed"));
      setSuccess("Queued for Alert! Alert! import.");
      setDraft((prev) => ({
        ...prev,
        note: null,
        title: "",
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to queue editor feed item.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
      <p className="toolkit-eyebrow">Send to editor</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
        {description}
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--toolkit-text-strong)]">Title</span>
          <input
            className="toolkit-input"
            onChange={(event) => {
              const value = event.target.value;
              setDraft((prev) => ({ ...prev, title: value }));
            }}
            placeholder={defaultKind === "music_event" ? "Moderator skipped repeat request" : "Chat called out a strong moment"}
            type="text"
            value={draft.title}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--toolkit-text-strong)]">Session label</span>
          <input
            className="toolkit-input"
            onChange={(event) => {
              const value = event.target.value;
              setDraft((prev) => ({ ...prev, sessionLabel: value.trim() || null }));
            }}
            placeholder="Latest mirrored session"
            type="text"
            value={draft.sessionLabel ?? ""}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--toolkit-text-strong)]">Start</span>
          <input
            className="toolkit-input"
            onChange={(event) => setStartInput(event.target.value)}
            placeholder="0:00"
            type="text"
            value={startInput}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--toolkit-text-strong)]">End</span>
          <input
            className="toolkit-input"
            onChange={(event) => setEndInput(event.target.value)}
            placeholder="0:30"
            type="text"
            value={endInput}
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-[var(--toolkit-text-strong)]">Note</span>
        <textarea
          className="toolkit-textarea min-h-[112px]"
          onChange={(event) => {
            const value = event.target.value;
            setDraft((prev) => ({ ...prev, note: value || null }));
          }}
          placeholder="Optional context for the editor."
          value={draft.note ?? ""}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--toolkit-text-dim)]">
        {summary.projectId ? <span>Project: {summary.projectId}</span> : null}
        {summary.channelName ? <span>Channel: {summary.channelName}</span> : null}
        {summary.vodTitle ? <span>VOD: {summary.vodTitle}</span> : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-[16px] border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-[16px] border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <button
        className="toolkit-button toolkit-button-primary mt-5"
        disabled={isSaving}
        onClick={() => {
          void handleSubmit();
        }}
        type="button"
      >
        <Send className="h-4 w-4" />
        {isSaving ? "Queueing..." : submitLabel}
      </button>
    </section>
  );
}
