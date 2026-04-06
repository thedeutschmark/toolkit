export type EditorCandidateKind =
  | "twitch_clip"
  | "stream_marker"
  | "chat_bookmark"
  | "music_event"
  | "source_moment";

export interface EditorSummaryCandidate {
  clipId: string | null;
  clipUrl: string | null;
  createdAt: string | null;
  endSec: number;
  kind: EditorCandidateKind;
  startSec: number;
  title: string;
  videoId: string | null;
  viewCount: number | null;
  vodOffset: number | null;
}

export interface EditorSummary {
  channelName: string | null;
  clipCount: number;
  latestCandidate: EditorSummaryCandidate | null;
  localAppUrl: string | null;
  projectId: string | null;
  sessionLabel: string | null;
  shortReadyCount: number;
  sourceMomentCount: number;
  updatedAt: string | null;
  vodTitle: string | null;
  vodUrl: string | null;
}

export interface EditorSummaryResponse {
  summary: EditorSummary;
}

export const EMPTY_EDITOR_SUMMARY: EditorSummary = {
  channelName: null,
  clipCount: 0,
  latestCandidate: null,
  localAppUrl: null,
  projectId: null,
  sessionLabel: null,
  shortReadyCount: 0,
  sourceMomentCount: 0,
  updatedAt: null,
  vodTitle: null,
  vodUrl: null,
};

export function labelEditorCandidateKind(kind: EditorCandidateKind) {
  switch (kind) {
    case "twitch_clip":
      return "Twitch clip";
    case "stream_marker":
      return "Stream marker";
    case "chat_bookmark":
      return "Chat bookmark";
    case "music_event":
      return "Music event";
    case "source_moment":
      return "Source moment";
    default:
      return "Edit candidate";
  }
}

export function buildAlertAlertRootUrl() {
  return "http://localhost:3000/";
}

export function buildAlertAlertOpenNowUrl(summary: EditorSummary | null) {
  if (!summary?.vodUrl && !summary?.latestCandidate?.videoId) {
    return null;
  }

  const url = new URL(summary?.localAppUrl || buildAlertAlertRootUrl());
  url.searchParams.set("mode", "reel");
  url.searchParams.set("open_now", "1");

  if (summary.projectId) {
    url.searchParams.set("project_id", summary.projectId);
  }

  if (summary.channelName) {
    url.searchParams.set("channel_name", summary.channelName);
  }

  if (summary.sessionLabel) {
    url.searchParams.set("session_label", summary.sessionLabel);
  }

  if (summary.vodTitle) {
    url.searchParams.set("vod_title", summary.vodTitle);
  }

  if (summary.vodUrl) {
    url.searchParams.set("vod_url", summary.vodUrl);
  }

  if (summary.latestCandidate?.videoId) {
    url.searchParams.set("video_id", summary.latestCandidate.videoId);
  }

  if (summary.latestCandidate?.clipId) {
    url.searchParams.set("clip_id", summary.latestCandidate.clipId);
  }

  if (summary.latestCandidate?.clipUrl) {
    url.searchParams.set("clip_url", summary.latestCandidate.clipUrl);
  }

  if (summary.latestCandidate?.createdAt) {
    url.searchParams.set("created_at", summary.latestCandidate.createdAt);
  }

  if (summary.latestCandidate?.vodOffset !== null && summary.latestCandidate?.vodOffset !== undefined) {
    url.searchParams.set("vod_offset", String(summary.latestCandidate.vodOffset));
  }

  if (summary.latestCandidate?.viewCount !== null && summary.latestCandidate?.viewCount !== undefined) {
    url.searchParams.set("view_count", String(summary.latestCandidate.viewCount));
  }

  if (summary.latestCandidate) {
    url.searchParams.set("candidate_kind", summary.latestCandidate.kind);
    url.searchParams.set("candidate_title", summary.latestCandidate.title);
    url.searchParams.set("start_sec", String(summary.latestCandidate.startSec));
    url.searchParams.set("end_sec", String(summary.latestCandidate.endSec));
  }

  return url.toString();
}

export function formatEditorTimecode(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function formatEditorUpdatedAt(value: string | null) {
  if (!value) {
    return "Not published yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
