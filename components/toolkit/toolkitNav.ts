import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BellRing,
  Blocks,
  BookMarked,
  Heart,
  House,
  ImagePlus,
  ListMusic,
  MessageCircleMore,
  MonitorPlay,
  Music2,
  PlaySquare,
  PlugZap,
  Settings2,
  Video,
} from "lucide-react";

export interface ToolkitNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
  exact?: boolean;
}

export interface ToolkitRouteTheme {
  accent: string;
  accentRgb: string;
}

export const primaryNav: ToolkitNavLink[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: House,
    exact: true,
  },
  {
    href: "/connections",
    label: "Connections",
    icon: PlugZap,
  },
  {
    href: "/tools/setup-doctor",
    label: "Setup Doctor",
    icon: Activity,
  },
  {
    href: "/tools/support-wall",
    label: "Support Wall",
    icon: Heart,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings2,
  },
];

export const widgetNav: ToolkitNavLink[] = [
  {
    href: "/tools",
    label: "Overview",
    icon: Blocks,
    exact: true,
  },
  {
    href: "/tools/player",
    label: "Player",
    icon: Music2,
  },
  {
    href: "/tools/starting-screen",
    label: "Starting Screen",
    icon: MonitorPlay,
  },
  {
    href: "/tools/alerts",
    label: "Alerts",
    icon: BellRing,
  },
  {
    href: "/tools/emoji-maker",
    label: "Emoji Maker",
    icon: ImagePlus,
  },
  {
    href: "/tools/stream-music",
    label: "Stream Music",
    icon: ListMusic,
  },
  {
    href: "/tools/command-profiles",
    label: "Command Profiles",
    icon: BookMarked,
  },
  {
    href: "/tools/video-shout-out",
    label: "Video Shout Out",
    icon: Video,
  },
  {
    href: "/tools/clip-play",
    label: "Clip Play",
    icon: PlaySquare,
  },
];

export const communityNav: ToolkitNavLink = {
  href: "https://discord.com/invite/hQEQE9myXX",
  label: "Discord",
  icon: MessageCircleMore,
  external: true,
};

const labelMap = new Map<string, string>([
  ["dashboard", "Home"],
  ["toolkit", "Home"],
  ["tools", "Tools"],
  ["widgets", "Tools"],
  ["player", "Player"],
  ["starting-screen", "Starting Screen"],
  ["alerts", "Alerts"],
  ["emoji-maker", "Emoji Maker"],
  ["stream-music", "Stream Music"],
  ["video-shout-out", "Video Shout Out"],
  ["clip-play", "Clip Play"],
  ["setup-doctor", "Setup Doctor"],
  ["command-profiles", "Command Profiles"],
  ["support-wall", "Support Wall"],
  ["connections", "Connections"],
  ["settings", "Settings"],
]);

const defaultTheme: ToolkitRouteTheme = {
  accent: "#7aa2f7",
  accentRgb: "122, 162, 247",
};

export function getToolkitRouteTheme(pathname: string): ToolkitRouteTheme {
  if (pathname.startsWith("/tools/player")) {
    return {
      accent: "#38bdf8",
      accentRgb: "56, 189, 248",
    };
  }

  if (pathname.startsWith("/tools/starting-screen")) {
    return {
      accent: "#f59e0b",
      accentRgb: "245, 158, 11",
    };
  }

  if (pathname.startsWith("/tools/emoji-maker")) {
    return {
      accent: "#f97316",
      accentRgb: "249, 115, 22",
    };
  }

  if (pathname.startsWith("/tools/stream-music")) {
    return {
      accent: "#34d399",
      accentRgb: "52, 211, 153",
    };
  }

  if (pathname.startsWith("/tools/alerts")) {
    return {
      accent: "#fb7185",
      accentRgb: "251, 113, 133",
    };
  }

  if (pathname.startsWith("/tools/video-shout-out")) {
    return {
      accent: "#f43f5e",
      accentRgb: "244, 63, 94",
    };
  }

  if (pathname.startsWith("/tools/clip-play")) {
    return {
      accent: "#a3e635",
      accentRgb: "163, 230, 53",
    };
  }

  if (pathname.startsWith("/tools/setup-doctor")) {
    return {
      accent: "#22d3ee",
      accentRgb: "34, 211, 238",
    };
  }

  if (pathname.startsWith("/tools/command-profiles")) {
    return {
      accent: "#818cf8",
      accentRgb: "129, 140, 248",
    };
  }

  if (pathname.startsWith("/tools/support-wall")) {
    return {
      accent: "#f43f5e",
      accentRgb: "244, 63, 94",
    };
  }

  if (pathname === "/tools" || pathname.startsWith("/tools/")) {
    return {
      accent: "#a78bfa",
      accentRgb: "167, 139, 250",
    };
  }

  if (pathname.startsWith("/connections")) {
    return {
      accent: "#22d3ee",
      accentRgb: "34, 211, 238",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      accent: "#f97316",
      accentRgb: "249, 115, 22",
    };
  }

  return defaultTheme;
}

export function isRouteActive(pathname: string, href: string, exact = false) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getToolkitBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return ["Home"];
  }

  return segments
    .map((segment) => labelMap.get(segment) ?? segment.replace(/-/g, " "))
    .map((label) => label.charAt(0).toUpperCase() + label.slice(1));
}
