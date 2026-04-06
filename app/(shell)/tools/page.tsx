import {
  Activity,
  BellRing,
  BookMarked,
  Headphones,
  ImagePlus,
  ListMusic,
  MonitorPlay,
  PlaySquare,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToolType } from "@/components/toolkit/WidgetCard";
import WidgetCard from "@/components/toolkit/WidgetCard";
import { WIDGET_HOST_URL } from "@/lib/toolkitEnv";

const widgets: Array<{
  name: string;
  description: string;
  icon: LucideIcon;
  status: string;
  tone: "ready" | "planned" | "external";
  toolType: ToolType;
  configureHref?: string;
  configureLabel?: string;
  openExternal?: boolean;
  openHref?: string;
  openLabel?: string;
}> = [
  {
    name: "Setup Doctor",
    description: "Run a full health check across your auth session, Spotify connection, browser sources, and stream config in one pass.",
    icon: Activity,
    status: "Ready",
    tone: "ready",
    toolType: "External App" as ToolType, // re-using slot — this is a meta-tool
    configureHref: "/tools/setup-doctor",
    configureLabel: "Run checks",
  },
  {
    name: "Player Widget",
    description: "Create player browser sources, tune the now-playing visuals, and copy setup links directly into scenes.",
    icon: Headphones,
    status: "Ready",
    tone: "ready",
    toolType: "Browser Source",
    configureHref: "/tools/player",
    configureLabel: "Player settings",
    openExternal: true,
    openHref: `${WIDGET_HOST_URL}/player/`,
    openLabel: "Open player",
  },
  {
    name: "Stream Music",
    description: "Manage the live scene source, chat command permissions, excluded songs, and playlist capture.",
    icon: ListMusic,
    status: "Ready",
    tone: "ready",
    toolType: "Browser Source",
    configureHref: "/tools/stream-music",
    configureLabel: "Music settings",
    openExternal: true,
    openHref: `${WIDGET_HOST_URL}/stream/`,
    openLabel: "Open stream scene",
  },
  {
    name: "Starting Screen",
    description: "Control the Starting Soon and Ending Soon scene copy, loop timing, and stream source setup.",
    icon: MonitorPlay,
    status: "Ready",
    tone: "ready",
    toolType: "Browser Source",
    configureHref: "/tools/starting-screen",
    configureLabel: "Scene settings",
    openExternal: true,
    openHref: `${WIDGET_HOST_URL}/stream/`,
    openLabel: "Open stream scene",
  },
  {
    name: "Video Shout Out",
    description: "Configure the !vso command — picks a random Twitch clip for a target streamer and plays it as an OBS browser source overlay.",
    icon: Video,
    status: "Ready",
    tone: "ready",
    toolType: "Script Generator",
    configureHref: "/tools/video-shout-out",
    configureLabel: "VSO settings",
  },
  {
    name: "Clip Play",
    description: "Let chat play any Twitch clip, YouTube video, TikTok, Instagram Reel, or Facebook video in an OBS browser source overlay — with built-in volume normalization.",
    icon: PlaySquare,
    status: "Ready",
    tone: "ready",
    toolType: "Script Generator",
    configureHref: "/tools/clip-play",
    configureLabel: "Clip Play settings",
  },
  {
    name: "Emoji Maker",
    description: "Build static and preset-animated emoji from any uploaded reaction image without AI-only upsells.",
    icon: ImagePlus,
    status: "Ready",
    tone: "ready",
    toolType: "Export Tool",
    configureHref: "/tools/emoji-maker",
    configureLabel: "Open builder",
  },
  {
    name: "Command Profiles",
    description: "Save named permission matrices — Open Queue, Mods Only, Viewer DJ — and apply them to Stream Music in one click.",
    icon: BookMarked,
    status: "Ready",
    tone: "ready",
    toolType: "Script Generator" as ToolType,
    configureHref: "/tools/command-profiles",
    configureLabel: "Manage profiles",
  },
  {
    name: "Alert! Alert!",
    description: "Desktop alert tooling remains external, but the dashboard links docs and downloads.",
    icon: BellRing,
    status: "External",
    tone: "external",
    toolType: "Local App",
    configureHref: "/tools/alerts",
    openHref: "https://github.com/thedeutschmark/alert-alert",
    openExternal: true,
  },
];

export default function ToolkitWidgetsPage() {
  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Tool catalog</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Tools and rollout status
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Browser sources, script generators, export tools, and local app handoffs — every tool that affects a live stream runtime or directly supports the operator workflow around it.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {widgets.map((widget) => (
          <WidgetCard key={widget.name} {...widget} />
        ))}
      </div>
    </div>
  );
}
