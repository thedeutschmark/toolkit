export interface EmojiMotionFrame {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

export interface EmojiAnimationPreset {
  description: string;
  id: string;
  label: string;
  render: (progress: number, intensity: number, direction: 1 | -1) => EmojiMotionFrame;
}

const TAU = Math.PI * 2;

function wobble(progress: number, frequency: number) {
  return Math.sin(progress * TAU * frequency);
}

export const EMOJI_ANIMATION_PRESETS: EmojiAnimationPreset[] = [
  {
    id: "none",
    label: "Static",
    description: "Keep the emoji still and just crop/export cleanly.",
    render: () => ({
      rotation: 0,
      scale: 1,
      translateX: 0,
      translateY: 0,
    }),
  },
  {
    id: "bounce",
    label: "Bounce",
    description: "Vertical hop loop for hype or celebration emotes.",
    render: (progress, intensity) => ({
      rotation: wobble(progress, 1) * intensity * 0.05,
      scale: 1 + Math.max(0, wobble(progress, 1)) * intensity * 0.05,
      translateX: 0,
      translateY: -Math.max(0, wobble(progress, 1)) * intensity * 0.18,
    }),
  },
  {
    id: "shake",
    label: "Shake",
    description: "Fast side-to-side jitter for panic or rage reactions.",
    render: (progress, intensity, direction) => ({
      rotation: wobble(progress, 4) * intensity * 0.08,
      scale: 1,
      translateX: wobble(progress, 5) * intensity * 0.18 * direction,
      translateY: wobble(progress, 3) * intensity * 0.04,
    }),
  },
  {
    id: "spin",
    label: "Spin",
    description: "Full rotation loop for goofy or chaotic stickers.",
    render: (progress, intensity, direction) => ({
      rotation: progress * TAU * direction,
      scale: 1 + intensity * 0.04,
      translateX: 0,
      translateY: wobble(progress, 1) * intensity * 0.05,
    }),
  },
  {
    id: "nod",
    label: "Nod",
    description: "Small approval dip for yes, hi, or lurk-type emotes.",
    render: (progress, intensity) => ({
      rotation: wobble(progress, 2) * intensity * 0.1,
      scale: 1,
      translateX: 0,
      translateY: Math.max(0, wobble(progress, 2)) * intensity * 0.1,
    }),
  },
  {
    id: "pulse",
    label: "Pulse",
    description: "Scale in and out without changing pose.",
    render: (progress, intensity) => ({
      rotation: 0,
      scale: 1 + Math.max(0, wobble(progress, 2)) * intensity * 0.14,
      translateX: 0,
      translateY: 0,
    }),
  },
  {
    id: "wave",
    label: "Wave",
    description: "Lean and sway like a flag or sticker on stream.",
    render: (progress, intensity, direction) => ({
      rotation: wobble(progress, 1.5) * intensity * 0.18 * direction,
      scale: 1,
      translateX: wobble(progress, 1.5) * intensity * 0.08 * direction,
      translateY: wobble(progress, 3) * intensity * 0.04,
    }),
  },
  {
    id: "glitch",
    label: "Glitch",
    description: "Stepped offsets for a crunchy tech or VTuber HUD vibe.",
    render: (progress, intensity, direction) => {
      const phase = Math.floor(progress * 8) / 8;
      return {
        rotation: wobble(phase, 2) * intensity * 0.06,
        scale: 1,
        translateX: wobble(phase, 5) * intensity * 0.16 * direction,
        translateY: wobble(phase, 7) * intensity * 0.08,
      };
    },
  },
];

export const DEFAULT_EMOJI_PRESET_ID = "bounce";

export function getEmojiAnimationPreset(id: string) {
  return EMOJI_ANIMATION_PRESETS.find((preset) => preset.id === id) ?? EMOJI_ANIMATION_PRESETS[0]!;
}
