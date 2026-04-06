"use client";

import Link from "next/link";
import { ExternalLink, FolderOpen, RefreshCcw } from "lucide-react";
import {
  buildAlertAlertOpenNowUrl,
  formatEditorTimecode,
  formatEditorUpdatedAt,
  labelEditorCandidateKind,
} from "@/lib/editorSummary";
import useEditorSummary from "@/lib/useEditorSummary";

interface EditorSummaryPanelProps {
  compact?: boolean;
  manageHref?: string;
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-3">
      <p className="toolkit-eyebrow">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--toolkit-text-strong)]">
        {value}
      </p>
    </div>
  );
}

export default function EditorSummaryPanel({
  compact = false,
  manageHref,
}: EditorSummaryPanelProps) {
  const { error, isLoading, refresh, summary } = useEditorSummary();
  const openNowUrl = buildAlertAlertOpenNowUrl(summary);
  const latestCandidate = summary.latestCandidate;
  const hasPublishedSummary = Boolean(summary.updatedAt || summary.projectId || summary.vodUrl);

  return (
    <section className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="toolkit-eyebrow">Alert! Alert!</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--toolkit-text-strong)]">
            Editing queue
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
            Hosted toolkit state mirrored from the local editor. This is a summary surface for the latest VOD, imported clip candidate, and counts already tracked in `Alert! Alert!`.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {manageHref ? (
            <Link className="toolkit-button toolkit-button-secondary" href={manageHref}>
              Manage alerts
            </Link>
          ) : null}
          <button
            className="toolkit-button toolkit-button-secondary"
            disabled={isLoading}
            onClick={() => void refresh()}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          {openNowUrl ? (
            <a
              className="toolkit-button toolkit-button-primary"
              href={openNowUrl}
              rel="noreferrer"
              target="_blank"
            >
              <FolderOpen className="h-4 w-4" />
              Open now
            </a>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[18px] border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className={`mt-6 grid gap-4 ${compact ? "lg:grid-cols-4" : "lg:grid-cols-2 xl:grid-cols-4"}`}>
        <Stat
          label="Session"
          value={summary.sessionLabel ?? (isLoading ? "Loading..." : "No session yet")}
        />
        <Stat
          label="Moments"
          value={`${summary.sourceMomentCount}`}
        />
        <Stat
          label="Clips"
          value={`${summary.clipCount}`}
        />
        <Stat
          label="Short Ready"
          value={`${summary.shortReadyCount}`}
        />
      </div>

      <div className={`mt-6 grid gap-4 ${compact ? "xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]" : "xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]"}`}>
        <div className="rounded-[22px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-5 py-5">
          <p className="toolkit-eyebrow">Latest source</p>
          {latestCandidate ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[rgba(var(--toolkit-accent-rgb),0.3)] bg-[rgba(var(--toolkit-accent-rgb),0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--toolkit-text-strong)]">
                  {labelEditorCandidateKind(latestCandidate.kind)}
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                  {formatEditorTimecode(latestCandidate.startSec)} to {formatEditorTimecode(latestCandidate.endSec)}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--toolkit-text-strong)]">
                {latestCandidate.title}
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Stat
                  label="VOD"
                  value={summary.vodTitle ?? "No VOD title mirrored yet"}
                />
                <Stat
                  label="Channel"
                  value={summary.channelName ?? "Unknown"}
                />
              </div>
              {latestCandidate.clipUrl ? (
                <a
                  className="toolkit-button toolkit-button-secondary mt-5"
                  href={latestCandidate.clipUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open source clip
                </a>
              ) : null}
            </>
          ) : (
            <div className="mt-4">
              <p className="text-sm leading-7 text-[var(--toolkit-text-muted)]">
                {isLoading
                  ? "Loading the latest mirrored editor summary."
                  : "No local edit candidate has been mirrored yet. Once Alert! Alert! publishes a project summary, the latest Twitch clip or stream marker will show up here."}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-5 py-5">
          <p className="toolkit-eyebrow">Mirror status</p>
          <p className="mt-4 text-sm leading-7 text-[var(--toolkit-text-muted)]">
            {hasPublishedSummary
              ? "Toolkit has a published summary from the local editor. Use Open now to hand the latest mirrored VOD and candidate back into Alert! Alert! on localhost."
              : "Toolkit is waiting for the local desktop app to publish an editor summary. The hosted app does not store full reel projects; it only renders a mirrored snapshot."}
          </p>

          <div className="mt-5 space-y-3 text-sm text-[var(--toolkit-text-muted)]">
            <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--toolkit-border)] px-4 py-3">
              <span>Last update</span>
              <span className="text-right text-[var(--toolkit-text-strong)]">
                {formatEditorUpdatedAt(summary.updatedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--toolkit-border)] px-4 py-3">
              <span>Project id</span>
              <span className="text-right text-[var(--toolkit-text-strong)]">
                {summary.projectId ?? "Not published"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--toolkit-border)] px-4 py-3">
              <span>Local launch</span>
              <span className="text-right text-[var(--toolkit-text-strong)]">
                {openNowUrl ? "Ready" : "Unavailable"}
              </span>
            </div>
          </div>

          {!compact ? (
            <a
              className="toolkit-button toolkit-button-secondary mt-5"
              href="https://github.com/thedeutschmark/alert-alert"
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              Open GitHub
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
