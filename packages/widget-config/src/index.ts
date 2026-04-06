export const SKIN_LIST = [
  "compact",
  "boxy",
  "gallery",
  "minimal",
  "macos",
  "shell",
  "discord",
] as const;

export const COVER_SHAPE_LIST = ["square", "canvas", "vinyl", "none"] as const;

export const ANIMATION_LIST = [
  "original",
  "fade",
  "slide_left",
  "slide_right",
  "slide_top",
  "slide_bottom",
  "grow",
  "shrink",
  "swing_left",
  "swing_right",
  "tilt_right",
  "tilt_left",
  "none",
] as const;

export const SURFACE_LIST = ["player", "stream", "overlay"] as const;

export const SCOPE_LIST = ["spotify:read"] as const;

export const FONT_ALLOWLIST = [
  "Jost",
  "Poppins",
  "Inter",
  "Roboto",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Nunito",
  "Raleway",
  "Source Sans 3",
  "DM Sans",
  "Outfit",
  "Lexend",
  "Space Grotesk",
  "Barlow",
] as const;

export type Skin = (typeof SKIN_LIST)[number];
export type CoverShape = (typeof COVER_SHAPE_LIST)[number];
export type AnimationType = (typeof ANIMATION_LIST)[number];
export type FontFamily = (typeof FONT_ALLOWLIST)[number] | string;

export interface WidgetConfig {
  skin: Skin;
  coverShape: CoverShape;
  coverGlow: boolean;
  coverBlur: boolean;
  idleCoverUrl: string | null;
  theme: "dark" | "light";
  tintMode: "album" | "fixed";
  tintColor: string;
  reveal: AnimationType;
  exit: AnimationType;
  fontFamily: string;
  idleTitle: string;
  idleArtist: string;
  hideOnPause: boolean;
  hideDelaySec: number;
  songChangeOnly: boolean;
  visibleDurationSec: number;
  showVisualizer: boolean;
  showProgress: boolean;
  showTimestamps: boolean;
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  skin: "compact",
  coverShape: "square",
  coverGlow: true,
  coverBlur: false,
  idleCoverUrl: null,
  theme: "dark",
  tintMode: "album",
  tintColor: "#8b82b0",
  reveal: "original",
  exit: "fade",
  fontFamily: "Jost",
  idleTitle: "nothing playing",
  idleArtist: "",
  hideOnPause: false,
  hideDelaySec: 10,
  songChangeOnly: false,
  visibleDurationSec: 8,
  showVisualizer: true,
  showProgress: true,
  showTimestamps: true,
};

export const SKIN_RESTRICTIONS: Partial<Record<Skin, {
  forceCoverShape?: CoverShape;
  forceFont?: string;
  coverBlur?: boolean;
  hideArt?: boolean;
}>> = {
  macos: { forceCoverShape: "vinyl", coverBlur: true },
  shell: { forceFont: "Space Mono", hideArt: true },
  minimal: { forceCoverShape: "none", hideArt: true },
};

export function mergeWithDefaults(partial: Partial<WidgetConfig>): WidgetConfig {
  return {
    skin: SKIN_LIST.includes(partial.skin as Skin)
      ? (partial.skin as Skin)
      : DEFAULT_WIDGET_CONFIG.skin,
    coverShape: COVER_SHAPE_LIST.includes(partial.coverShape as CoverShape)
      ? (partial.coverShape as CoverShape)
      : DEFAULT_WIDGET_CONFIG.coverShape,
    coverGlow: typeof partial.coverGlow === "boolean" ? partial.coverGlow : DEFAULT_WIDGET_CONFIG.coverGlow,
    coverBlur: typeof partial.coverBlur === "boolean" ? partial.coverBlur : DEFAULT_WIDGET_CONFIG.coverBlur,
    idleCoverUrl: typeof partial.idleCoverUrl === "string" ? partial.idleCoverUrl : null,
    theme: partial.theme === "light" || partial.theme === "dark" ? partial.theme : DEFAULT_WIDGET_CONFIG.theme,
    tintMode: partial.tintMode === "album" || partial.tintMode === "fixed" ? partial.tintMode : DEFAULT_WIDGET_CONFIG.tintMode,
    tintColor: typeof partial.tintColor === "string" && /^#[0-9a-fA-F]{6}$/.test(partial.tintColor)
      ? partial.tintColor
      : DEFAULT_WIDGET_CONFIG.tintColor,
    reveal: ANIMATION_LIST.includes(partial.reveal as AnimationType)
      ? (partial.reveal as AnimationType)
      : DEFAULT_WIDGET_CONFIG.reveal,
    exit: ANIMATION_LIST.includes(partial.exit as AnimationType)
      ? (partial.exit as AnimationType)
      : DEFAULT_WIDGET_CONFIG.exit,
    fontFamily: typeof partial.fontFamily === "string" && partial.fontFamily.trim()
      ? partial.fontFamily.trim().slice(0, 100)
      : DEFAULT_WIDGET_CONFIG.fontFamily,
    idleTitle: typeof partial.idleTitle === "string"
      ? partial.idleTitle.slice(0, 50)
      : DEFAULT_WIDGET_CONFIG.idleTitle,
    idleArtist: typeof partial.idleArtist === "string"
      ? partial.idleArtist.slice(0, 80)
      : DEFAULT_WIDGET_CONFIG.idleArtist,
    hideOnPause: typeof partial.hideOnPause === "boolean" ? partial.hideOnPause : DEFAULT_WIDGET_CONFIG.hideOnPause,
    hideDelaySec: typeof partial.hideDelaySec === "number"
      ? Math.min(120, Math.max(0, Math.round(partial.hideDelaySec)))
      : DEFAULT_WIDGET_CONFIG.hideDelaySec,
    songChangeOnly: typeof partial.songChangeOnly === "boolean" ? partial.songChangeOnly : DEFAULT_WIDGET_CONFIG.songChangeOnly,
    visibleDurationSec: typeof partial.visibleDurationSec === "number"
      ? Math.min(60, Math.max(1, Math.round(partial.visibleDurationSec)))
      : DEFAULT_WIDGET_CONFIG.visibleDurationSec,
    showVisualizer: typeof partial.showVisualizer === "boolean" ? partial.showVisualizer : DEFAULT_WIDGET_CONFIG.showVisualizer,
    showProgress: typeof partial.showProgress === "boolean" ? partial.showProgress : DEFAULT_WIDGET_CONFIG.showProgress,
    showTimestamps: typeof partial.showTimestamps === "boolean" ? partial.showTimestamps : DEFAULT_WIDGET_CONFIG.showTimestamps,
  };
}
