"use client";

import { applyPalette, GIFEncoder, quantize } from "gifenc";
import {
  Download,
  Film,
  ImagePlus,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  DEFAULT_EMOJI_PRESET_ID,
  EMOJI_ANIMATION_PRESETS,
  getEmojiAnimationPreset,
} from "@/lib/emojiMakerPresets";

const LOOP_DURATION_MS = 1200;
const SIZE_OPTIONS = [56, 72, 112, 128];

type BackgroundMode = "solid" | "transparent";
type Direction = 1 | -1;

interface EmojiMakerSettings {
  animationId: string;
  backgroundColor: string;
  backgroundMode: BackgroundMode;
  direction: Direction;
  fps: number;
  intensity: number;
  offsetX: number;
  offsetY: number;
  outlineColor: string;
  outlineWidth: number;
  paddingPct: number;
  roundnessPct: number;
  shadowStrength: number;
  size: number;
  zoom: number;
}

interface UploadedSource {
  fileName: string;
  height: number;
  image: HTMLImageElement;
  width: number;
}

const DEFAULT_SETTINGS: EmojiMakerSettings = {
  animationId: DEFAULT_EMOJI_PRESET_ID,
  backgroundColor: "#10131c",
  backgroundMode: "transparent",
  direction: 1,
  fps: 12,
  intensity: 0.85,
  offsetX: 0,
  offsetY: 0,
  outlineColor: "#ffffff",
  outlineWidth: 0,
  paddingPct: 8,
  roundnessPct: 28,
  shadowStrength: 24,
  size: 112,
  zoom: 1.05,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const boundedRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + boundedRadius, y);
  ctx.lineTo(x + width - boundedRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + boundedRadius);
  ctx.lineTo(x + width, y + height - boundedRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - boundedRadius, y + height);
  ctx.lineTo(x + boundedRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - boundedRadius);
  ctx.lineTo(x, y + boundedRadius);
  ctx.quadraticCurveTo(x, y, x + boundedRadius, y);
  ctx.closePath();
}

function createCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createBlobUrl(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function sanitizeFilename(fileName: string) {
  const trimmed = fileName.replace(/\.[^.]+$/, "").trim().toLowerCase();
  return (trimmed || "emoji-maker")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatTimecode(seconds: number) {
  return `${seconds.toFixed(1)}s`;
}

function loadImage(file: File) {
  return new Promise<UploadedSource>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        fileName: file.name,
        height: image.naturalHeight,
        image,
        width: image.naturalWidth,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load that image."));
    };

    image.src = url;
  });
}

function findTransparentIndex(palette: Array<[number, number, number] | [number, number, number, number]>) {
  return palette.findIndex((color) => color.length === 4 && color[3] === 0);
}

function renderEmojiFrame(
  ctx: CanvasRenderingContext2D,
  source: UploadedSource | null,
  settings: EmojiMakerSettings,
  progress: number,
) {
  const size = settings.size;
  const padding = size * (settings.paddingPct / 100);
  const radius = ((size - padding * 2) * settings.roundnessPct) / 100;
  const bodySize = size - padding * 2;
  const outlineWidth = settings.outlineWidth;
  const shadowBlur = settings.shadowStrength > 0 ? size * (settings.shadowStrength / 100) : 0;
  const preset = getEmojiAnimationPreset(settings.animationId);
  const frame = preset.render(progress, settings.intensity, settings.direction);
  const motionX = frame.translateX * bodySize;
  const motionY = frame.translateY * bodySize;

  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (shadowBlur > 0) {
    ctx.save();
    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = "rgba(8, 12, 20, 0.45)";
    ctx.fillStyle = settings.backgroundMode === "solid"
      ? settings.backgroundColor
      : "rgba(20, 24, 36, 0.26)";
    drawRoundedRectPath(ctx, padding, padding, bodySize, bodySize, radius);
    ctx.fill();
    ctx.restore();
  }

  if (settings.backgroundMode === "solid") {
    ctx.save();
    ctx.fillStyle = settings.backgroundColor;
    drawRoundedRectPath(ctx, padding, padding, bodySize, bodySize, radius);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  drawRoundedRectPath(ctx, padding, padding, bodySize, bodySize, radius);
  ctx.clip();

  if (source) {
    const cropSize = Math.min(source.width, source.height) / settings.zoom;
    const maxOffsetX = Math.max(0, (source.width - cropSize) / 2);
    const maxOffsetY = Math.max(0, (source.height - cropSize) / 2);
    const sourceX = clamp((source.width - cropSize) / 2 + settings.offsetX * maxOffsetX, 0, source.width - cropSize);
    const sourceY = clamp((source.height - cropSize) / 2 + settings.offsetY * maxOffsetY, 0, source.height - cropSize);

    ctx.translate(size / 2 + motionX, size / 2 + motionY);
    ctx.rotate(frame.rotation);
    ctx.scale(frame.scale, frame.scale);
    ctx.drawImage(
      source.image,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      -bodySize / 2,
      -bodySize / 2,
      bodySize,
      bodySize,
    );

    if (settings.animationId === "glitch") {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.globalCompositeOperation = "screen";
      ctx.translate(2, -2);
      ctx.drawImage(
        source.image,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
        -bodySize / 2,
        -bodySize / 2,
        bodySize,
        bodySize,
      );
      ctx.restore();
    }
  } else {
    const gradient = ctx.createLinearGradient(padding, padding, size - padding, size - padding);
    gradient.addColorStop(0, "#fbbf24");
    gradient.addColorStop(0.5, "#fb7185");
    gradient.addColorStop(1, "#38bdf8");
    ctx.fillStyle = gradient;
    drawRoundedRectPath(ctx, padding, padding, bodySize, bodySize, radius);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(size * 0.38, size * 0.4, size * 0.05, 0, Math.PI * 2);
    ctx.arc(size * 0.62, size * 0.4, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = Math.max(3, size * 0.035);
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.54, size * 0.16, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();

  if (outlineWidth > 0) {
    ctx.save();
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = settings.outlineColor;
    drawRoundedRectPath(
      ctx,
      padding + outlineWidth / 2,
      padding + outlineWidth / 2,
      bodySize - outlineWidth,
      bodySize - outlineWidth,
      Math.max(0, radius - outlineWidth / 2),
    );
    ctx.stroke();
    ctx.restore();
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Export failed."));
    }, type);
  });
}

export default function EmojiMakerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [exportState, setExportState] = useState<{
    gif: boolean;
    png: boolean;
    status: string | null;
    tone: "error" | "success" | null;
  }>({
    gif: false,
    png: false,
    status: null,
    tone: null,
  });
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [settings, setSettings] = useState<EmojiMakerSettings>(DEFAULT_SETTINGS);
  const [source, setSource] = useState<UploadedSource | null>(null);

  const selectedPreset = useMemo(
    () => getEmojiAnimationPreset(settings.animationId),
    [settings.animationId],
  );

  const paintPreview = useEffectEvent((timestamp: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) {
      return;
    }

    if (canvas.width !== settings.size || canvas.height !== settings.size) {
      canvas.width = settings.size;
      canvas.height = settings.size;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const progress = settings.animationId === "none"
      ? 0
      : (timestamp % LOOP_DURATION_MS) / LOOP_DURATION_MS;
    progressRef.current = progress;
    renderEmojiFrame(ctx, source, settings, progress);
  });

  useEffect(() => {
    let frameId = 0;

    const tick = (timestamp: number) => {
      paintPreview(timestamp);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [paintPreview]);

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    setIsLoadingImage(true);
    setExportState((current) => ({ ...current, status: null, tone: null }));

    try {
      const next = await loadImage(file);
      setSource(next);
    } catch (error) {
      setExportState({
        gif: false,
        png: false,
        status: error instanceof Error ? error.message : "Could not load that image.",
        tone: "error",
      });
    } finally {
      setIsLoadingImage(false);
    }
  }

  function updateSetting<K extends keyof EmojiMakerSettings>(
    key: K,
    value: EmojiMakerSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    setExportState((current) => ({ ...current, status: null, tone: null }));
  }

  function handleClearImage() {
    setSource(null);
    setExportState((current) => ({ ...current, status: null, tone: null }));
  }

  async function handleDownloadPng() {
    if (!previewCanvasRef.current) {
      return;
    }

    setExportState((current) => ({
      ...current,
      png: true,
      status: null,
      tone: null,
    }));

    try {
      const canvas = createCanvas(settings.size);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Preview canvas is unavailable.");
      }

      renderEmojiFrame(ctx, source, settings, progressRef.current);
      const blob = await canvasToBlob(canvas, "image/png");
      createBlobUrl(blob, `${sanitizeFilename(source?.fileName ?? "emoji")}-${settings.size}px.png`);
      setExportState({
        gif: false,
        png: false,
        status: "PNG exported.",
        tone: "success",
      });
    } catch (error) {
      setExportState({
        gif: false,
        png: false,
        status: error instanceof Error ? error.message : "PNG export failed.",
        tone: "error",
      });
    }
  }

  async function handleDownloadGif() {
    setExportState((current) => ({
      ...current,
      gif: true,
      status: null,
      tone: null,
    }));

    try {
      const canvas = createCanvas(settings.size);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Preview canvas is unavailable.");
      }

      const frameCount = settings.animationId === "none"
        ? 1
        : Math.max(8, Math.min(24, Math.round((settings.fps * LOOP_DURATION_MS) / 1000)));
      const gif = GIFEncoder();

      for (let index = 0; index < frameCount; index += 1) {
        const progress = frameCount === 1 ? 0 : index / frameCount;
        renderEmojiFrame(ctx, source, settings, progress);
        const imageData = ctx.getImageData(0, 0, settings.size, settings.size);
        const palette = quantize(imageData.data, 256, {
          format: "rgba4444",
          oneBitAlpha: true,
        });
        const transparentIndex = findTransparentIndex(palette);
        const indexed = applyPalette(imageData.data, palette, "rgba4444");

        gif.writeFrame(indexed, settings.size, settings.size, {
          delay: frameCount === 1 ? 1000 : Math.round(1000 / settings.fps),
          dispose: 1,
          palette,
          repeat: 0,
          transparent: transparentIndex >= 0,
          transparentIndex: transparentIndex >= 0 ? transparentIndex : 0,
        });
      }

      gif.finish();
      const gifBytes = Uint8Array.from(gif.bytes());
      createBlobUrl(
        new Blob([gifBytes], { type: "image/gif" }),
        `${sanitizeFilename(source?.fileName ?? "emoji")}-${selectedPreset.id}.gif`,
      );
      setExportState({
        gif: false,
        png: false,
        status: "Animated GIF exported.",
        tone: "success",
      });
    } catch (error) {
      setExportState({
        gif: false,
        png: false,
        status: error instanceof Error ? error.message : "GIF export failed.",
        tone: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Emoji Maker</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Manual emoji and emote builder
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Upload a face, logo, or reaction image, crop it into a clean emote, then export a static PNG or a preset-loop GIF.
          {" "}
          This version intentionally skips AI animation, credit systems, and premium-only generation.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <section className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="toolkit-eyebrow">Preview</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">
                Live emoji canvas
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--toolkit-text-muted)]">
                The preview runs the exact same frame renderer the GIF exporter uses.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="toolkit-button toolkit-button-secondary"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <ImagePlus className="h-4 w-4" />
                Upload image
              </button>
              <button
                className="toolkit-button toolkit-button-secondary"
                onClick={handleReset}
                type="button"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset controls
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
            type="file"
          />

          <div
            className={`mt-6 rounded-[28px] border border-dashed p-4 transition-colors ${
              dragActive
                ? "border-[rgba(var(--toolkit-accent-rgb),0.65)] bg-[rgba(var(--toolkit-accent-rgb),0.1)]"
                : "border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)]/60"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              void handleFiles(event.dataTransfer.files);
            }}
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="flex min-h-[26rem] items-center justify-center rounded-[24px] border border-[var(--toolkit-border)] bg-[radial-gradient(circle_at_top,rgba(var(--toolkit-accent-rgb),0.18),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.18))] p-6">
                <canvas
                  ref={previewCanvasRef}
                  className="aspect-square w-full max-w-[22rem] rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,#121722,#090c12)] shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
                  height={settings.size}
                  width={settings.size}
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-panel)]/70 px-4 py-4">
                  <p className="toolkit-eyebrow">Source</p>
                  {source ? (
                    <>
                      <p className="mt-3 text-sm font-medium text-[var(--toolkit-text-strong)]">
                        {source.fileName}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                        {source.width} x {source.height}
                      </p>
                      <button
                        className="toolkit-button toolkit-button-secondary mt-4 w-full"
                        onClick={handleClearImage}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear image
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-sm leading-6 text-[var(--toolkit-text-muted)]">
                        Drop a PNG, JPG, WebP, GIF, or SVG here. GIF uploads use their poster frame instead of AI motion.
                      </p>
                      <button
                        className="toolkit-button toolkit-button-primary mt-4 w-full"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        <ImagePlus className="h-4 w-4" />
                        Choose image
                      </button>
                    </>
                  )}
                </div>

                <div className="rounded-[22px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-panel)]/70 px-4 py-4">
                  <p className="toolkit-eyebrow">Export</p>
                  <div className="mt-4 grid gap-3">
                    <button
                      className="toolkit-button toolkit-button-primary w-full"
                      disabled={exportState.png || isLoadingImage}
                      onClick={() => void handleDownloadPng()}
                      type="button"
                    >
                      <Download className="h-4 w-4" />
                      {exportState.png ? "Exporting PNG..." : "Download PNG"}
                    </button>
                    <button
                      className="toolkit-button toolkit-button-secondary w-full"
                      disabled={exportState.gif || isLoadingImage}
                      onClick={() => void handleDownloadGif()}
                      type="button"
                    >
                      <Film className="h-4 w-4" />
                      {exportState.gif ? "Encoding GIF..." : "Download GIF"}
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--toolkit-text-dim)]">
                    GIF loop: {settings.animationId === "none" ? "single still frame" : `${settings.fps} fps over ${formatTimecode(LOOP_DURATION_MS / 1000)}`}.
                  </p>
                </div>

                {exportState.status ? (
                  <div
                    className={`rounded-[18px] border px-4 py-3 text-sm ${
                      exportState.tone === "error"
                        ? "border-rose-400/25 bg-rose-400/10 text-rose-100"
                        : "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                    }`}
                  >
                    {exportState.status}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="toolkit-eyebrow">Motion presets</p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">
                  Pick the loop
                </h2>
              </div>
              <div className="rounded-full border border-[rgba(var(--toolkit-accent-rgb),0.3)] bg-[rgba(var(--toolkit-accent-rgb),0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--toolkit-text-strong)]">
                no ai
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {EMOJI_ANIMATION_PRESETS.map((preset) => {
                const active = preset.id === settings.animationId;

                return (
                  <button
                    key={preset.id}
                    className={`rounded-[20px] border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-[rgba(var(--toolkit-accent-rgb),0.55)] bg-[rgba(var(--toolkit-accent-rgb),0.12)] shadow-[0_0_0_1px_rgba(var(--toolkit-accent-rgb),0.15)]"
                        : "border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] hover:-translate-y-px hover:border-[rgba(var(--toolkit-accent-rgb),0.3)]"
                    }`}
                    onClick={() => updateSetting("animationId", preset.id)}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-sm font-semibold text-[var(--toolkit-text-strong)]">
                        {preset.label}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--toolkit-text-muted)]">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-6">
            <p className="toolkit-eyebrow">Controls</p>
            <div className="mt-4 space-y-5">
              <label className="block">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Canvas size</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                    {settings.size}px
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      className={`rounded-full border px-3 py-1.5 text-sm ${
                        option === settings.size
                          ? "border-[rgba(var(--toolkit-accent-rgb),0.55)] bg-[rgba(var(--toolkit-accent-rgb),0.12)] text-[var(--toolkit-text-strong)]"
                          : "border-[var(--toolkit-border)] text-[var(--toolkit-text-muted)] hover:text-[var(--toolkit-text-strong)]"
                      }`}
                      onClick={() => updateSetting("size", option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Zoom</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                    {settings.zoom.toFixed(2)}x
                  </span>
                </div>
                <input
                  className="mt-3 w-full accent-[var(--toolkit-accent)]"
                  max={2.6}
                  min={1}
                  onChange={(event) => updateSetting("zoom", Number(event.target.value))}
                  step={0.01}
                  type="range"
                  value={settings.zoom}
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Horizontal crop</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.offsetX.toFixed(2)}
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={1}
                    min={-1}
                    onChange={(event) => updateSetting("offsetX", Number(event.target.value))}
                    step={0.01}
                    type="range"
                    value={settings.offsetX}
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Vertical crop</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.offsetY.toFixed(2)}
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={1}
                    min={-1}
                    onChange={(event) => updateSetting("offsetY", Number(event.target.value))}
                    step={0.01}
                    type="range"
                    value={settings.offsetY}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Padding</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.paddingPct}%
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={24}
                    min={0}
                    onChange={(event) => updateSetting("paddingPct", Number(event.target.value))}
                    step={1}
                    type="range"
                    value={settings.paddingPct}
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Roundness</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.roundnessPct}%
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={50}
                    min={0}
                    onChange={(event) => updateSetting("roundnessPct", Number(event.target.value))}
                    step={1}
                    type="range"
                    value={settings.roundnessPct}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Intensity</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.intensity.toFixed(2)}
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={1.4}
                    min={0.1}
                    onChange={(event) => updateSetting("intensity", Number(event.target.value))}
                    step={0.01}
                    type="range"
                    value={settings.intensity}
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">FPS</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.fps}
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={20}
                    min={6}
                    onChange={(event) => updateSetting("fps", Number(event.target.value))}
                    step={1}
                    type="range"
                    value={settings.fps}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Outline width</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.outlineWidth}px
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={10}
                    min={0}
                    onChange={(event) => updateSetting("outlineWidth", Number(event.target.value))}
                    step={1}
                    type="range"
                    value={settings.outlineWidth}
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Shadow</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--toolkit-text-dim)]">
                      {settings.shadowStrength}%
                    </span>
                  </div>
                  <input
                    className="mt-3 w-full accent-[var(--toolkit-accent)]"
                    max={48}
                    min={0}
                    onChange={(event) => updateSetting("shadowStrength", Number(event.target.value))}
                    step={1}
                    type="range"
                    value={settings.shadowStrength}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Backdrop</span>
                  <select
                    className="mt-3 w-full rounded-[14px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-3 py-2.5 text-sm text-[var(--toolkit-text-strong)] outline-none"
                    onChange={(event) => updateSetting("backgroundMode", event.target.value as BackgroundMode)}
                    value={settings.backgroundMode}
                  >
                    <option value="transparent">Transparent</option>
                    <option value="solid">Solid color</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Direction</span>
                  <select
                    className="mt-3 w-full rounded-[14px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-3 py-2.5 text-sm text-[var(--toolkit-text-strong)] outline-none"
                    onChange={(event) => updateSetting("direction", Number(event.target.value) as Direction)}
                    value={settings.direction}
                  >
                    <option value={1}>Right / clockwise</option>
                    <option value={-1}>Left / counterclockwise</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Backdrop color</span>
                  <input
                    className="mt-3 h-11 w-full rounded-[14px] border border-[var(--toolkit-border)] bg-transparent"
                    onChange={(event) => updateSetting("backgroundColor", event.target.value)}
                    type="color"
                    value={settings.backgroundColor}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Outline color</span>
                  <input
                    className="mt-3 h-11 w-full rounded-[14px] border border-[var(--toolkit-border)] bg-transparent"
                    onChange={(event) => updateSetting("outlineColor", event.target.value)}
                    type="color"
                    value={settings.outlineColor}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-6">
            <p className="toolkit-eyebrow">Current build</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">
              {selectedPreset.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--toolkit-text-muted)]">
              {selectedPreset.description}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-3">
                <p className="toolkit-eyebrow">Loop</p>
                <p className="mt-2 text-sm text-[var(--toolkit-text-strong)]">
                  {settings.animationId === "none" ? "Still frame" : `${settings.fps} fps`}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-3">
                <p className="toolkit-eyebrow">Canvas</p>
                <p className="mt-2 text-sm text-[var(--toolkit-text-strong)]">
                  {settings.size}px square
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-3">
                <p className="toolkit-eyebrow">Backdrop</p>
                <p className="mt-2 text-sm text-[var(--toolkit-text-strong)]">
                  {settings.backgroundMode === "transparent" ? "Transparent" : settings.backgroundColor}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
