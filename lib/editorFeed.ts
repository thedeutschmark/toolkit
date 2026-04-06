import { toolkitApi } from "@/lib/toolkitApi";

export type EditorFeedItemKind =
  | "twitch_clip"
  | "stream_marker"
  | "chat_bookmark"
  | "music_event"
  | "source_moment";

export interface EditorFeedItem {
  channelName: string | null;
  clipId: string | null;
  clipUrl: string | null;
  createdAt: string;
  endSec: number;
  id: string;
  kind: EditorFeedItemKind;
  note: string | null;
  projectId: string | null;
  sessionLabel: string | null;
  startSec: number;
  title: string;
  videoId: string | null;
  viewCount: number | null;
  vodOffset: number | null;
  vodUrl: string | null;
}

export interface EditorFeedResponse {
  items: EditorFeedItem[];
}

export interface EditorFeedWriteResponse extends EditorFeedResponse {
  item?: EditorFeedItem;
  ok: boolean;
}

export const EDITOR_FEED_KIND_LABELS: Record<EditorFeedItemKind, string> = {
  chat_bookmark: "Chat bookmark",
  music_event: "Music event",
  source_moment: "Source moment",
  stream_marker: "Stream marker",
  twitch_clip: "Twitch clip",
};

export function labelEditorFeedKind(kind: EditorFeedItemKind) {
  return EDITOR_FEED_KIND_LABELS[kind] ?? "Feed item";
}

export function emptyEditorFeedDraft(kind: EditorFeedItemKind): Omit<EditorFeedItem, "createdAt" | "id"> {
  return {
    channelName: null,
    clipId: null,
    clipUrl: null,
    endSec: 0,
    kind,
    note: null,
    projectId: null,
    sessionLabel: null,
    startSec: 0,
    title: "",
    videoId: null,
    viewCount: null,
    vodOffset: null,
    vodUrl: null,
  };
}

export async function fetchEditorFeed() {
  return toolkitApi.get<EditorFeedResponse>("/editor/feed");
}

export async function createEditorFeedItem(item: Partial<EditorFeedItem>) {
  return toolkitApi.post<EditorFeedWriteResponse>("/editor/feed", item);
}

export async function deleteEditorFeedItem(id: string) {
  return toolkitApi.delete<EditorFeedWriteResponse>(`/editor/feed?id=${encodeURIComponent(id)}`);
}
