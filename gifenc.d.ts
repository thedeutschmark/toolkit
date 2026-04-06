declare module "gifenc" {
  export type GifPaletteColor =
    | [number, number, number]
    | [number, number, number, number];

  export type GifPalette = GifPaletteColor[];

  export interface GIFEncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  export interface GIFFrameOptions {
    delay?: number;
    dispose?: number;
    first?: boolean;
    palette?: GifPalette;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
  }

  export interface QuantizeOptions {
    clearAlpha?: boolean;
    clearAlphaColor?: number;
    clearAlphaThreshold?: number;
    format?: "rgb565" | "rgb444" | "rgba4444";
    oneBitAlpha?: boolean | number;
  }

  export interface GIFEncoderResult {
    bytes(): Uint8Array;
    finish(): void;
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: GIFFrameOptions,
    ): void;
  }

  export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderResult;
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): GifPalette;
}
