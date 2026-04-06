"use client";

import {
  Database,
  Headphones,
  ImagePlus,
  ListMusic,
  MonitorPlay,
  Music2,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import StatCard, { type HealthStatus } from "@/components/toolkit/StatCard";
import WidgetCard from "@/components/toolkit/WidgetCard";
import { toolkitApi } from "@/lib/toolkitApi";
import { WIDGET_HOST_URL } from "@/lib/toolkitEnv";

/* ─── Health data types (subset of what each endpoint returns) ─── */

interface WidgetToken { surface: string; token: string }
interface ConnectionsData {
  spotify: { connected: boolean; profile: { displayName: string } | null };
}
interface StreamSettingsData {
  settings: { streamPlaylistId: string | null };
}

/* ─── Health cards config ─── */

interface HealthCard {
  hint: string;
  icon: LucideIcon;
  label: string;
  status: HealthStatus;
  value: string;
}

function buildHealthCards(results: {
  connections: ConnectionsData | null;
  stream: StreamSettingsData | null;
  tokens: WidgetToken[] | null;
}): HealthCard[] {
  // Active sources
  const tokenCount = results.tokens?.length ?? 0;
  const playerCount = results.tokens?.filter(t => t.surface === "player").length ?? 0;
  const streamCount = results.tokens?.filter(t => t.surface === "stream").length ?? 0;

  // Spotify
  const spotify = results.connections?.spotify;
  const spotifyConnected = spotify?.connected ?? false;

  // Playlist
  const playlistConfigured = Boolean(results.stream?.settings.streamPlaylistId);

  return [
    {
      label: "Active Sources",
      value: results.tokens === null ? "—" : `${tokenCount}`,
      status: results.tokens === null ? "loading" : tokenCount > 0 ? "ok" : "warning",
      hint:
        results.tokens === null
          ? "Loading source count…"
          : tokenCount === 0
            ? "No browser sources configured yet."
            : `${playerCount} player · ${streamCount} stream`,
      icon: Database,
    },
    {
      label: "Spotify",
      value: results.connections === null ? "—" : spotifyConnected ? (spotify?.profile?.displayName ?? "Connected") : "Not connected",
      status: results.connections === null ? "loading" : spotifyConnected ? "ok" : "warning",
      hint:
        results.connections === null
          ? "Checking Spotify status…"
          : spotifyConnected
            ? "Credentials active, tokens valid"
            : "Connect your Spotify app in Connections",
      icon: Music2,
    },
    {
      label: "Stream Playlist",
      value: results.stream === null ? "—" : playlistConfigured ? "Configured" : "None set",
      status: results.stream === null ? "loading" : playlistConfigured ? "ok" : "warning",
      hint:
        results.stream === null
          ? "Checking playlist config…"
          : playlistConfigured
            ? "Song requests auto-captured to playlist"
            : "Set a capture playlist in Stream Music",
      icon: ListMusic,
    },
  ];
}

/* ─── Dashboard widgets (featured tools, no Stream Overlay) ─── */

const featuredWidgets = [
  {
    name: "Now Playing",
    description: "Current-track widget for OBS scenes, player pages, and stream overlays.",
    icon: Headphones,
    status: "Ready",
    tone: "ready" as const,
    toolType: "Browser Source" as const,
    configureHref: "/tools/player",
    configureLabel: "Player settings",
    openExternal: true,
    openHref: `${WIDGET_HOST_URL}/player/`,
    openLabel: "Open player",
  },
  {
    name: "Stream Music",
    description: "Manage chat command permissions, stream playlist capture, and the shared stream browser source.",
    icon: ListMusic,
    status: "Ready",
    tone: "ready" as const,
    toolType: "Browser Source" as const,
    configureHref: "/tools/stream-music",
    configureLabel: "Music settings",
    openExternal: true,
    openHref: `${WIDGET_HOST_URL}/stream/`,
    openLabel: "Open stream scene",
  },
  {
    name: "Starting Screen",
    description: "Configure the Starting Soon and Ending Soon scene copy and idle loop timing.",
    icon: MonitorPlay,
    status: "Ready",
    tone: "ready" as const,
    toolType: "Browser Source" as const,
    configureHref: "/tools/starting-screen",
    configureLabel: "Scene settings",
    openExternal: true,
    openHref: `${WIDGET_HOST_URL}/stream/`,
    openLabel: "Open stream scene",
  },
  {
    name: "Collab Planner",
    description: "Stream collab planning, raiding, and scheduling — a separate app with shared infrastructure.",
    icon: Users,
    status: "Live",
    tone: "external" as const,
    toolType: "External App" as const,
    openHref: "https://collab.deutschmark.online",
    openExternal: true,
    openLabel: "Open Collab",
  },
  {
    name: "Alert! Alert!",
    description: "Desktop stream alert tooling distributed separately from the dashboard runtime.",
    icon: Sparkles,
    status: "External",
    tone: "external" as const,
    toolType: "Local App" as const,
    configureHref: "/tools/alerts",
    openHref: "https://github.com/thedeutschmark/alert-alert",
    openExternal: true,
  },
  {
    name: "Emoji Maker",
    description: "Upload a reaction image, apply manual animation presets, and export a clean emote PNG or looping GIF.",
    icon: ImagePlus,
    status: "Ready",
    tone: "ready" as const,
    toolType: "Export Tool" as const,
    configureHref: "/tools/emoji-maker",
    configureLabel: "Open builder",
  },
];

/* ─── Page ─── */

const LOADING_CARDS: HealthCard[] = [
  { label: "Active Sources", value: "—", status: "loading", hint: "Loading…", icon: Database },
  { label: "Spotify",        value: "—", status: "loading", hint: "Loading…", icon: Music2 },
  { label: "Stream Playlist",value: "—", status: "loading", hint: "Loading…", icon: ListMusic },
];

export default function ToolkitHomePage() {
  const [cards, setCards] = useState<HealthCard[]>(LOADING_CARDS);

  useEffect(() => {
    const [tokensP, connectionsP, streamP] = [
      toolkitApi.get<{ tokens: WidgetToken[] }>("/widget-tokens"),
      toolkitApi.get<ConnectionsData>("/connections"),
      toolkitApi.get<StreamSettingsData>("/stream-settings"),
    ];

    Promise.allSettled([tokensP, connectionsP, streamP]).then(
      ([tokensRes, connectionsRes, streamRes]) => {
        setCards(
          buildHealthCards({
            tokens:      tokensRes.status      === "fulfilled" ? tokensRes.value.tokens : null,
            connections: connectionsRes.status === "fulfilled" ? connectionsRes.value   : null,
            stream:      streamRes.status      === "fulfilled" ? streamRes.value        : null,
          }),
        );
      },
    );
  }, []);

  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Overview</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-[3.1rem]">
          DM Toolkit
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)] sm:text-base">
          A streamer ops control plane for widget delivery, account connections, and stream-side setup.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
              Tools
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--toolkit-text-strong)]">
              Available
            </h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {featuredWidgets.map((widget) => (
            <WidgetCard key={widget.name} {...widget} />
          ))}
        </div>
      </section>
    </div>
  );
}
