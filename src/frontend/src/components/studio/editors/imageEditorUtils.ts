// ─── Canvas Utilities for FStudioX Image Editor ──────────────────────────────

// ─── Color-filter CSS functions for each preset ───────────────────────────────
// These return ready-to-use CSS filter strings for use in <img> or canvas.

/** Returns the CSS filter string for a named preset ID */
export function getPresetFilter(presetId: string): string {
  const p = PRESETS.find((x) => x.id === presetId);
  return p ? p.filter : "none";
}

/** Builds a CSS filter string from base preset + full Adjustments object */
export { buildFilterString as buildCssFilter };

/** Warm toning: sepia + saturate + brightness */
export function filterWarm(
  intensity = 100,
  saturation = 1.4,
  brightness = 1.05,
): string {
  const s = intensity / 100;
  return `sepia(${(0.3 * s).toFixed(2)}) saturate(${saturation}) brightness(${brightness}) hue-rotate(${(-10 * s).toFixed(1)}deg)`;
}

/** Cool toning: hue-rotate + desaturate */
export function filterCool(intensity = 100): string {
  const s = intensity / 100;
  return `hue-rotate(${(30 * s).toFixed(1)}deg) saturate(${(1 - 0.1 * s).toFixed(2)}) brightness(${(1 + 0.05 * s).toFixed(2)})`;
}

/** Black & white + optional contrast boost */
export function filterBW(contrast = 1.1): string {
  return `grayscale(1) contrast(${contrast.toFixed(2)})`;
}

/** Vintage film look */
export function filterVintage(intensity = 100): string {
  const s = intensity / 100;
  return `sepia(${(0.5 * s).toFixed(2)}) contrast(${(1 - 0.1 * s).toFixed(2)}) brightness(${(1 - 0.1 * s).toFixed(2)}) saturate(${(1 - 0.2 * s).toFixed(2)})`;
}

/** Clarendon-style: boost contrast + saturation */
export function filterClarendon(intensity = 100): string {
  const s = intensity / 100;
  return `contrast(${(1 + 0.2 * s).toFixed(2)}) saturate(${(1 + 0.35 * s).toFixed(2)}) brightness(${(1 + 0.1 * s).toFixed(2)})`;
}

/** Vivid: heavy saturation + contrast */
export function filterVivid(intensity = 100): string {
  const s = intensity / 100;
  return `saturate(${(1 + 0.8 * s).toFixed(2)}) contrast(${(1 + 0.2 * s).toFixed(2)})`;
}

/** Fade / matte effect */
export function filterFade(intensity = 100): string {
  const s = intensity / 100;
  return `brightness(${(1 + 0.1 * s).toFixed(2)}) contrast(${(1 - 0.15 * s).toFixed(2)}) saturate(${(1 - 0.2 * s).toFixed(2)})`;
}

/** Cinematic letterbox-ready color grading */
export function filterCinematic(intensity = 100): string {
  const s = intensity / 100;
  return `contrast(${(1 + 0.4 * s).toFixed(2)}) brightness(${(1 - 0.15 * s).toFixed(2)}) saturate(${(1 - 0.1 * s).toFixed(2)})`;
}

/** Neon glow-style heavy saturation */
export function filterNeon(intensity = 100): string {
  const s = intensity / 100;
  return `saturate(${(1 + 1 * s).toFixed(2)}) brightness(${(1 + 0.2 * s).toFixed(2)}) contrast(${(1 + 0.3 * s).toFixed(2)}) hue-rotate(${(30 * s).toFixed(1)}deg)`;
}

/** Muted / desaturated look */
export function filterMuted(intensity = 100): string {
  const s = intensity / 100;
  return `saturate(${(1 - 0.4 * s).toFixed(2)}) contrast(${(1 - 0.1 * s).toFixed(2)})`;
}

/** Juno: warm golden look */
export function filterJuno(intensity = 100): string {
  const s = intensity / 100;
  return `saturate(${(1 + 0.4 * s).toFixed(2)}) hue-rotate(${(-10 * s).toFixed(1)}deg) brightness(${(1 + 0.1 * s).toFixed(2)})`;
}

/** Lark: light airy look */
export function filterLark(intensity = 100): string {
  const s = intensity / 100;
  return `contrast(${(1 - 0.1 * s).toFixed(2)}) brightness(${(1 + 0.1 * s).toFixed(2)}) saturate(${(1 - 0.1 * s).toFixed(2)})`;
}

// ─── Placeholder so PRESETS can reference the exported array below ─────────────

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  blur: number;
  sharpen: number;
  exposure: number;
  shadows: number;
  highlights: number;
  vibrance: number;
  hue: number;
  gamma: number;
  grain: number;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  blur: 0,
  sharpen: 0,
  exposure: 0,
  shadows: 0,
  highlights: 0,
  vibrance: 0,
  hue: 0,
  gamma: 0,
  grain: 0,
};

export interface Preset {
  id: string;
  label: string;
  filter: string;
  thumb: string;
}

export const PRESETS: Preset[] = [
  { id: "normal", label: "Normal", filter: "none", thumb: "#8b7d7d" },
  {
    id: "warm",
    label: "Warm",
    filter: "sepia(0.3) saturate(1.4) brightness(1.05) hue-rotate(-10deg)",
    thumb: "#c4895e",
  },
  {
    id: "cool",
    label: "Cool",
    filter: "hue-rotate(30deg) saturate(0.9) brightness(1.05)",
    thumb: "#5e8ec4",
  },
  {
    id: "bw",
    label: "B&W",
    filter: "grayscale(1) contrast(1.1)",
    thumb: "#777777",
  },
  {
    id: "vintage",
    label: "Vintage",
    filter: "sepia(0.5) contrast(0.9) brightness(0.9) saturate(0.8)",
    thumb: "#a0845c",
  },
  {
    id: "clarendon",
    label: "Clarendon",
    filter: "contrast(1.2) saturate(1.35) brightness(1.1)",
    thumb: "#6a9fd8",
  },
  {
    id: "juno",
    label: "Juno",
    filter: "saturate(1.4) hue-rotate(-10deg) brightness(1.1)",
    thumb: "#c9a840",
  },
  {
    id: "lark",
    label: "Lark",
    filter: "contrast(0.9) brightness(1.1) saturate(0.9)",
    thumb: "#b8c9a0",
  },
  {
    id: "fade",
    label: "Fade",
    filter: "brightness(1.1) contrast(0.85) saturate(0.8)",
    thumb: "#b0a8a8",
  },
  {
    id: "vivid",
    label: "Vivid",
    filter: "saturate(1.8) contrast(1.2)",
    thumb: "#e13a6a",
  },
  {
    id: "muted",
    label: "Muted",
    filter: "saturate(0.6) contrast(0.9)",
    thumb: "#8d9090",
  },
];

export interface EffectPreset {
  id: string;
  label: string;
  thumb: string;
  apply: (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    intensity?: number,
  ) => void;
}

export const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "vignette",
    label: "Vignette",
    thumb: "#1a1a2e",
    apply: (ctx, w, h, intensity = 100) => {
      const str = intensity / 100;
      const grad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.3,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7,
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${0.65 * str})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "grain",
    label: "Grain",
    thumb: "#5a5a5a",
    apply: (ctx, w, h, intensity = 100) => {
      const noise = (intensity / 100) * 50;
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * noise;
        d[i] = Math.min(255, Math.max(0, d[i] + n));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: "haze",
    label: "Haze",
    thumb: "#cde0f0",
    apply: (ctx, w, h, intensity = 100) => {
      const alpha = (intensity / 100) * 0.22;
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "cinematic",
    label: "Cinematic",
    thumb: "#1c2535",
    apply: (ctx, w, h, intensity = 100) => {
      const barH = Math.round(h * 0.1 * (intensity / 100));
      ctx.fillStyle = "rgba(0,0,0,0.9)";
      ctx.fillRect(0, 0, w, barH);
      ctx.fillRect(0, h - barH, w, barH);
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      const t = intensity / 100;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, d[i] * (1 + 0.1 * t) + 10 * t);
        d[i + 2] = Math.min(255, d[i + 2] * (1 - 0.15 * t));
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: "glow",
    label: "Glow",
    thumb: "#ffe4a0",
    apply: (ctx, w, h, intensity = 100) => {
      const alpha = (intensity / 100) * 0.3;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d")!;
      octx.filter = "blur(8px) brightness(1.4)";
      octx.drawImage(ctx.canvas, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(off, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    },
  },
  {
    id: "glitch",
    label: "Glitch",
    thumb: "#ff003c",
    apply: (ctx, w, h, intensity = 100) => {
      const offset = Math.round(6 * (intensity / 100));
      const imageData = ctx.getImageData(0, 0, w, h);
      const shifted = ctx.createImageData(w, h);
      const src = imageData.data;
      const dst = shifted.data;
      for (let i = 0; i < src.length; i += 4) {
        const px = (i / 4) % w;
        const py = Math.floor(i / 4 / w);
        const shiftedIdx = (py * w + Math.min(w - 1, px + offset)) * 4;
        dst[shiftedIdx] = src[i];
        dst[i + 1] = src[i + 1];
        dst[i + 2] = src[i + 2];
        dst[i + 3] = 255;
      }
      ctx.putImageData(shifted, 0, 0);
    },
  },
  {
    id: "vhs",
    label: "VHS",
    thumb: "#1a0040",
    apply: (ctx, w, h, intensity = 100) => {
      const t = intensity / 100;
      // scanlines
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = `rgba(0,0,0,${0.12 * t})`;
        ctx.fillRect(0, y, w, 1);
      }
      // chromatic aberration
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      const shift = Math.round(4 * t);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const ri = (y * w + Math.min(w - 1, x + shift)) * 4;
          d[i] = d[ri];
        }
      }
      ctx.putImageData(imageData, 0, 0);
      // noise overlay
      ctx.fillStyle = `rgba(50,0,80,${0.08 * t})`;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "posterize",
    label: "Posterize",
    thumb: "#e040fb",
    apply: (ctx, w, h, intensity = 100) => {
      const levels = Math.max(2, Math.round(8 - (intensity / 100) * 6));
      const step = 255 / (levels - 1);
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] / step) * step;
        d[i + 1] = Math.round(d[i + 1] / step) * step;
        d[i + 2] = Math.round(d[i + 2] / step) * step;
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
];

export function buildFilterString(preset: string, adj: Adjustments): string {
  const parts: string[] = [];
  if (preset && preset !== "none") parts.push(preset);
  const brightness = 1 + adj.brightness / 100 + adj.exposure / 100;
  const contrast = 1 + adj.contrast / 100;
  const saturation = 1 + adj.saturation / 100 + adj.vibrance / 200;
  parts.push(`brightness(${Math.max(0, brightness).toFixed(3)})`);
  parts.push(`contrast(${Math.max(0, contrast).toFixed(3)})`);
  parts.push(`saturate(${Math.max(0, saturation).toFixed(3)})`);
  if (adj.blur > 0) parts.push(`blur(${adj.blur}px)`);
  if (adj.sharpen > 0)
    parts.push(`contrast(${(1 + adj.sharpen * 0.06).toFixed(3)})`);
  if (adj.temperature !== 0) {
    const deg =
      adj.temperature < 0 ? adj.temperature * 0.4 : adj.temperature * -0.4;
    const sepia = Math.abs(adj.temperature) / 100;
    parts.push(`hue-rotate(${deg.toFixed(1)}deg)`);
    if (adj.temperature > 0) parts.push(`sepia(${(sepia * 0.4).toFixed(3)})`);
  }
  if (adj.tint !== 0)
    parts.push(`hue-rotate(${(adj.tint * 1.5).toFixed(1)}deg)`);
  if (adj.hue !== 0) parts.push(`hue-rotate(${adj.hue}deg)`);
  if (adj.gamma !== 0) {
    const gammaVal = 1 + adj.gamma / 200;
    parts.push(`brightness(${Math.max(0, gammaVal).toFixed(3)})`);
  }
  return parts.join(" ") || "none";
}

// ─── Canvas pixel manipulation helpers ───────────────────────────────────────

export function isSkinTone(r: number, g: number, b: number): boolean {
  return r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15;
}

/**
 * removeBackground — flood-fill from image edges to find and erase the
 * background, preserving the main subject in the center.
 */
export function removeBackground(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  const tolerance = 42;
  const visited = new Uint8Array(w * h);

  function colorDist(i1: number, i2: number): number {
    return (
      Math.abs(d[i1] - d[i2]) +
      Math.abs(d[i1 + 1] - d[i2 + 1]) +
      Math.abs(d[i1 + 2] - d[i2 + 2])
    );
  }

  const queue: number[] = [];
  for (let x = 0; x < w; x++) {
    queue.push(x);
    queue.push((h - 1) * w + x);
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push(y * w);
    queue.push(y * w + w - 1);
  }
  for (const idx of queue) visited[idx] = 1;

  let qi = 0;
  const neighbours = [-1, 1, -w, w];

  while (qi < queue.length) {
    const cur = queue[qi++];
    const curIdx = cur * 4;
    const x = cur % w;
    const y = Math.floor(cur / w);
    for (const delta of neighbours) {
      const nx = x + (delta === -1 ? -1 : delta === 1 ? 1 : 0);
      const ny = y + (delta === -w ? -1 : delta === w ? 1 : 0);
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const nb = ny * w + nx;
      if (visited[nb]) continue;
      const nbIdx = nb * 4;
      if (colorDist(curIdx, nbIdx) < tolerance) {
        visited[nb] = 1;
        queue.push(nb);
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    if (visited[i] === 1) {
      d[i * 4 + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;
  octx.filter = "blur(0.6px)";
  octx.drawImage(canvas, 0, 0);
  octx.filter = "none";
  return out.toDataURL("image/png");
}

/**
 * detectFaceBBox — returns a bounding box for the likely face region.
 */
export function detectFaceBBox(
  src: HTMLImageElement,
): { x: number; y: number; w: number; h: number } | null {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = data.data;
  const cw = canvas.width;
  const ch = canvas.height;

  const xMin = Math.round(cw * 0.1);
  const xMax = Math.round(cw * 0.9);
  const yMax = Math.round(ch * 0.75);

  let bx1 = xMax;
  let bx2 = xMin;
  let by1 = yMax;
  let by2 = 0;
  let found = false;

  for (let y = 0; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      const i = (y * cw + x) * 4;
      if (isSkinTone(d[i], d[i + 1], d[i + 2])) {
        if (x < bx1) bx1 = x;
        if (x > bx2) bx2 = x;
        if (y < by1) by1 = y;
        if (y > by2) by2 = y;
        found = true;
      }
    }
  }

  if (!found || bx2 <= bx1 || by2 <= by1) return null;

  const padX = Math.round((bx2 - bx1) * 0.2);
  const padY = Math.round((by2 - by1) * 0.25);
  return {
    x: Math.max(0, bx1 - padX),
    y: Math.max(0, by1 - padY),
    w: Math.min(cw, bx2 - bx1 + padX * 2),
    h: Math.min(ch, by2 - by1 + padY * 2),
  };
}

/**
 * blendFaceOntoTarget — draws source face bbox onto target face bbox
 * with feathered alpha masking for smooth blending.
 */
export function blendFaceOntoTarget(
  targetImg: HTMLImageElement,
  sourceImg: HTMLImageElement,
  targetBox: { x: number; y: number; w: number; h: number },
  sourceBox: { x: number; y: number; w: number; h: number },
  opacity: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = targetImg.naturalWidth;
  canvas.height = targetImg.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(targetImg, 0, 0);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = targetBox.w;
  maskCanvas.height = targetBox.h;
  const mctx = maskCanvas.getContext("2d")!;

  const grad = mctx.createRadialGradient(
    targetBox.w / 2,
    targetBox.h / 2,
    targetBox.w * 0.1,
    targetBox.w / 2,
    targetBox.h / 2,
    targetBox.w * 0.6,
  );
  grad.addColorStop(0, `rgba(255,255,255,${opacity / 100})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  mctx.fillStyle = grad;
  mctx.fillRect(0, 0, targetBox.w, targetBox.h);

  mctx.globalCompositeOperation = "source-in";
  mctx.drawImage(
    sourceImg,
    sourceBox.x,
    sourceBox.y,
    sourceBox.w,
    sourceBox.h,
    0,
    0,
    targetBox.w,
    targetBox.h,
  );

  ctx.drawImage(maskCanvas, targetBox.x, targetBox.y);
  return canvas.toDataURL("image/png");
}

export function enhanceQuality(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "contrast(1.15) saturate(1.2) brightness(1.05)";
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";

  const offscreen = document.createElement("canvas");
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;
  const octx = offscreen.getContext("2d")!;
  octx.filter = "blur(1px)";
  octx.drawImage(canvas, 0, 0);
  octx.filter = "none";

  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.25;
  ctx.drawImage(offscreen, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  return canvas.toDataURL("image/png");
}

export function upscaleImage(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth * 2;
  canvas.height = src.naturalHeight * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "contrast(1.08) saturate(1.05)";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export function sharpenBoost(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);

  // unsharp mask: overlay a blurred inverted version
  const blur = document.createElement("canvas");
  blur.width = src.naturalWidth;
  blur.height = src.naturalHeight;
  const bctx = blur.getContext("2d")!;
  bctx.filter = "blur(1.5px)";
  bctx.drawImage(src, 0, 0);
  bctx.filter = "none";

  ctx.globalCompositeOperation = "hard-light";
  ctx.globalAlpha = 0.4;
  ctx.drawImage(blur, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // second pass: boost contrast + sharpen via filter
  const result = document.createElement("canvas");
  result.width = canvas.width;
  result.height = canvas.height;
  const rctx = result.getContext("2d")!;
  rctx.filter = "contrast(1.2) brightness(1.02)";
  rctx.drawImage(canvas, 0, 0);
  return result.toDataURL("image/png");
}

export function denoiseImage(src: HTMLImageElement, strength: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  const blurAmount = (strength / 100) * 1.5;
  ctx.filter = `blur(${blurAmount.toFixed(1)}px)`;
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";
  return canvas.toDataURL("image/png");
}

export function restoreColors(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  let minR = 255;
  let minG = 255;
  let minB = 255;
  let maxR = 0;
  let maxG = 0;
  let maxB = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < minR) minR = d[i];
    if (d[i] > maxR) maxR = d[i];
    if (d[i + 1] < minG) minG = d[i + 1];
    if (d[i + 1] > maxG) maxG = d[i + 1];
    if (d[i + 2] < minB) minB = d[i + 2];
    if (d[i + 2] > maxB) maxB = d[i + 2];
  }
  const rangeR = maxR - minR || 1;
  const rangeG = maxG - minG || 1;
  const rangeB = maxB - minB || 1;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(((d[i] - minR) / rangeR) * 255);
    d[i + 1] = Math.round(((d[i + 1] - minG) / rangeG) * 255);
    d[i + 2] = Math.round(((d[i + 2] - minB) / rangeB) * 255);
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function applyBeautyFilter(
  src: HTMLImageElement,
  smoothing: number,
  whitening: number,
  slimFace: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  if (slimFace > 0) {
    const scaleX = 1 - slimFace * 0.003;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scaleX, 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }
  if (smoothing > 0) {
    ctx.filter = `blur(${smoothing * 0.03}px)`;
  }
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  ctx.filter = "none";

  if (whitening > 0) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    const boost = whitening * 0.8;
    for (let i = 0; i < d.length; i += 4) {
      if (isSkinTone(d[i], d[i + 1], d[i + 2])) {
        d[i] = Math.min(255, d[i] + boost);
        d[i + 1] = Math.min(255, d[i + 1] + boost * 0.8);
        d[i + 2] = Math.min(255, d[i + 2] + boost * 0.6);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas.toDataURL("image/png");
}

// ─── AI Tool Types ────────────────────────────────────────────────────────────

export type AiToolId =
  | "portrait"
  | "object_remove"
  | "colorize"
  | "cartoon"
  | "skin_tone"
  | "red_eye"
  | "age_filter"
  | "blur_bg"
  | "smart_filter"
  | "magic_eraser";

export type CartoonMode = "cartoon" | "sketch";
export type AgeMode = "young" | "old";

// ─── portraitBlur ─────────────────────────────────────────────────────────────
// Applies a radial blur around the detected face bbox, keeping center sharp.

export function portraitBlur(src: HTMLImageElement): string {
  const w = src.naturalWidth;
  const h = src.naturalHeight;

  // Create blurred version
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d")!;
  bctx.filter = "blur(6px)";
  bctx.drawImage(src, 0, 0);
  bctx.filter = "none";

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;

  // Draw sharp base
  ctx.drawImage(src, 0, 0);

  // Mask: radial gradient — fully visible (shows blurred) at edges, transparent at center
  const cx = w * 0.5;
  const cy = h * 0.38; // face center tends to be upper-center
  const innerR = Math.min(w, h) * 0.22;
  const outerR = Math.max(w, h) * 0.72;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = w;
  maskCanvas.height = h;
  const mctx = maskCanvas.getContext("2d")!;
  const grad = mctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.15)");
  grad.addColorStop(1, "rgba(0,0,0,1)");
  mctx.fillStyle = grad;
  mctx.fillRect(0, 0, w, h);

  // Composite: blurred layer masked by radial gradient
  const maskedBlur = document.createElement("canvas");
  maskedBlur.width = w;
  maskedBlur.height = h;
  const mbctx = maskedBlur.getContext("2d")!;
  mbctx.drawImage(blurred, 0, 0);
  mbctx.globalCompositeOperation = "destination-in";
  mbctx.drawImage(maskCanvas, 0, 0);
  mbctx.globalCompositeOperation = "source-over";

  ctx.drawImage(maskedBlur, 0, 0);
  return out.toDataURL("image/png");
}

// ─── skinToneFix ─────────────────────────────────────────────────────────────
// Reduces redness and evens highlights/shadows on detected skin pixels.

export function skinToneFix(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    if (isSkinTone(r, g, b)) {
      // Reduce excess redness
      const redness = r - g;
      if (redness > 20) {
        d[i] = Math.max(0, r - Math.round(redness * 0.25));
        d[i + 1] = Math.min(255, g + Math.round(redness * 0.08));
      }
      // Normalize extreme highlights/shadows on skin
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma > 220) {
        const pull = (luma - 220) * 0.3;
        d[i] = Math.max(0, d[i] - pull);
        d[i + 1] = Math.max(0, d[i + 1] - pull);
        d[i + 2] = Math.max(0, d[i + 2] - pull);
      } else if (luma < 80) {
        const push = (80 - luma) * 0.2;
        d[i] = Math.min(255, d[i] + push);
        d[i + 1] = Math.min(255, d[i + 1] + push);
        d[i + 2] = Math.min(255, d[i + 2] + push);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

// ─── redEyeRemoval ───────────────────────────────────────────────────────────
// Finds red pixel clusters in the face bbox and neutralizes them.

export function redEyeRemoval(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  const cw = canvas.width;
  const ch = canvas.height;

  // Focus scan on upper portion (face/eye area)
  const yLimit = Math.round(ch * 0.65);

  for (let y = 0; y < yLimit; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // Red eye: high R, significantly lower G & B
      if (r > 150 && r > g * 2.2 && r > b * 2.2) {
        const avg = Math.round((g + b) / 2);
        d[i] = avg; // desaturate red channel
        d[i + 1] = avg;
        d[i + 2] = avg;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

// ─── cartoonEffect ────────────────────────────────────────────────────────────
// Edge detection overlay + posterize for cartoon look.

export function cartoonEffect(src: HTMLImageElement): string {
  const w = src.naturalWidth;
  const h = src.naturalHeight;

  // Posterize pass
  const posterCanvas = document.createElement("canvas");
  posterCanvas.width = w;
  posterCanvas.height = h;
  const pctx = posterCanvas.getContext("2d")!;
  pctx.drawImage(src, 0, 0);
  const pData = pctx.getImageData(0, 0, w, h);
  const pd = pData.data;
  const levels = 4;
  const step = 255 / (levels - 1);
  for (let i = 0; i < pd.length; i += 4) {
    pd[i] = Math.round(pd[i] / step) * step;
    pd[i + 1] = Math.round(pd[i + 1] / step) * step;
    pd[i + 2] = Math.round(pd[i + 2] / step) * step;
  }
  pctx.putImageData(pData, 0, 0);

  // Edge pass: grayscale + threshold
  const edgeCanvas = document.createElement("canvas");
  edgeCanvas.width = w;
  edgeCanvas.height = h;
  const ectx = edgeCanvas.getContext("2d")!;
  ectx.filter = "grayscale(1) contrast(8)";
  ectx.drawImage(src, 0, 0);
  ectx.filter = "none";

  // Composite: edges on top of posterized
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;
  ctx.filter = "saturate(1.5)";
  ctx.drawImage(posterCanvas, 0, 0);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.6;
  ctx.drawImage(edgeCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  return out.toDataURL("image/png");
}

// ─── sketchEffect ─────────────────────────────────────────────────────────────
// Grayscale + inverted blurred edge overlay for pencil sketch.

export function sketchEffect(src: HTMLImageElement): string {
  const w = src.naturalWidth;
  const h = src.naturalHeight;

  // Grayscale base
  const gray = document.createElement("canvas");
  gray.width = w;
  gray.height = h;
  const gctx = gray.getContext("2d")!;
  gctx.filter = "grayscale(1)";
  gctx.drawImage(src, 0, 0);
  gctx.filter = "none";

  // Inverted + blurred
  const inv = document.createElement("canvas");
  inv.width = w;
  inv.height = h;
  const ictx = inv.getContext("2d")!;
  ictx.filter = "grayscale(1) invert(1) blur(3px)";
  ictx.drawImage(src, 0, 0);
  ictx.filter = "none";

  // Blend with dodge
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(gray, 0, 0);
  ctx.globalCompositeOperation = "color-dodge";
  ctx.globalAlpha = 0.85;
  ctx.drawImage(inv, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  return out.toDataURL("image/png");
}

// ─── colorizeImage ────────────────────────────────────────────────────────────
// Boost saturation and apply warm color overlay to simulate colorization.

export function colorizeImage(src: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // First pass: strong saturation boost
  ctx.filter = "saturate(2.5) brightness(1.05) contrast(1.1)";
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";

  // Second pass: warm color tint overlay
  ctx.globalCompositeOperation = "color";
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#d4956a"; // warm skin/earth tone
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  return canvas.toDataURL("image/png");
}

// ─── ageFilterEffect ──────────────────────────────────────────────────────────
// Young: smooth + brighten face area. Old: subtle grain overlay + contrast tweak.

export function ageFilterEffect(src: HTMLImageElement, mode: AgeMode): string {
  const canvas = document.createElement("canvas");
  canvas.width = src.naturalWidth;
  canvas.height = src.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  if (mode === "young") {
    ctx.filter = "blur(0.6px) brightness(1.08) contrast(0.92) saturate(1.1)";
    ctx.drawImage(src, 0, 0);
    ctx.filter = "none";
    // Soft glow on skin
    const glow = document.createElement("canvas");
    glow.width = src.naturalWidth;
    glow.height = src.naturalHeight;
    const gctx = glow.getContext("2d")!;
    gctx.filter = "blur(4px) brightness(1.3)";
    gctx.drawImage(src, 0, 0);
    gctx.filter = "none";
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.12;
    ctx.drawImage(glow, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.filter = "contrast(1.12) brightness(0.96)";
    ctx.drawImage(src, 0, 0);
    ctx.filter = "none";
    // Add grain texture
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL("image/png");
}

// ─── blurBackground ───────────────────────────────────────────────────────────
// Use edge-based mask to blur non-center pixels (approximates subject isolation).

export function blurBackground(src: HTMLImageElement): string {
  const w = src.naturalWidth;
  const h = src.naturalHeight;

  // Blurred version
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d")!;
  bctx.filter = "blur(8px)";
  bctx.drawImage(src, 0, 0);
  bctx.filter = "none";

  // Sharp subject (center focus area)
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(blurred, 0, 0); // start with blurred

  // Punch a sharp hole in the center using radial mask
  const sharp = document.createElement("canvas");
  sharp.width = w;
  sharp.height = h;
  const sctx = sharp.getContext("2d")!;
  sctx.drawImage(src, 0, 0);

  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext("2d")!;
  const cx = w * 0.5;
  const cy = h * 0.45;
  const inner = Math.min(w, h) * 0.28;
  const outer = Math.min(w, h) * 0.55;
  const grad = mctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  mctx.fillStyle = grad;
  mctx.fillRect(0, 0, w, h);

  sctx.globalCompositeOperation = "destination-in";
  sctx.drawImage(mask, 0, 0);
  sctx.globalCompositeOperation = "source-over";

  ctx.drawImage(sharp, 0, 0);
  return out.toDataURL("image/png");
}

// ─── analyzeForSmartFilter ───────────────────────────────────────────────────
// Samples the image histogram and returns the best-matching preset id.

export function analyzeForSmartFilter(src: HTMLImageElement): string {
  const SIZE = 60; // sample at reduced size for speed
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0, SIZE, SIZE);
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalLuma = 0;
  const pixels = SIZE * SIZE;

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const avgR = totalR / pixels;
  const avgG = totalG / pixels;
  const avgB = totalB / pixels;
  const avgLuma = totalLuma / pixels;

  // Saturation estimate
  const maxCh = Math.max(avgR, avgG, avgB);
  const minCh = Math.min(avgR, avgG, avgB);
  const satEst = maxCh > 0 ? (maxCh - minCh) / maxCh : 0;

  // Pick preset based on analysis
  if (avgLuma < 80) return "cinematic"; // dark image → cinematic
  if (avgLuma > 185 && satEst < 0.15) return "fade"; // bright + low sat → fade
  if (satEst < 0.12) return "vivid"; // desaturated → boost
  if (avgR > avgB + 25 && avgR > avgG + 15) return "warm"; // warm-leaning
  if (avgB > avgR + 20) return "cool"; // cool-leaning
  if (avgLuma > 160 && satEst > 0.3) return "juno"; // bright + warm → juno
  if (satEst > 0.4) return "clarendon"; // already saturated → pop
  return "lark"; // default: light & airy
}

// ─── magicEraserApply ─────────────────────────────────────────────────────────
// Erases a circular region with feathered edges and fills with surrounding pixels.

export function magicEraserApply(
  src: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
): string {
  const w = src.naturalWidth;
  const h = src.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  const feather = Math.max(4, Math.round(radius * 0.25));

  // Sample surrounding pixels (ring just outside the eraser)
  const samplePixels: { r: number; g: number; b: number }[] = [];
  const sampleR = radius + feather + 4;
  for (let angle = 0; angle < 360; angle += 15) {
    const rad = (angle * Math.PI) / 180;
    const sx = Math.round(cx + sampleR * Math.cos(rad));
    const sy = Math.round(cy + sampleR * Math.sin(rad));
    if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
      const si = (sy * w + sx) * 4;
      samplePixels.push({ r: d[si], g: d[si + 1], b: d[si + 2] });
    }
  }

  const fillR =
    samplePixels.length > 0
      ? Math.round(
          samplePixels.reduce((s, p) => s + p.r, 0) / samplePixels.length,
        )
      : 128;
  const fillG =
    samplePixels.length > 0
      ? Math.round(
          samplePixels.reduce((s, p) => s + p.g, 0) / samplePixels.length,
        )
      : 128;
  const fillB =
    samplePixels.length > 0
      ? Math.round(
          samplePixels.reduce((s, p) => s + p.b, 0) / samplePixels.length,
        )
      : 128;

  const rMin = Math.max(0, cy - radius - feather);
  const rMax = Math.min(h, cy + radius + feather);
  const cMin = Math.max(0, cx - radius - feather);
  const cMax = Math.min(w, cx + radius + feather);

  for (let py = rMin; py < rMax; py++) {
    for (let px = cMin; px < cMax; px++) {
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist > radius + feather) continue;

      let alpha = 1;
      if (dist > radius) {
        alpha = 1 - (dist - radius) / feather;
      }
      alpha = Math.max(0, Math.min(1, alpha));

      const idx = (py * w + px) * 4;
      d[idx] = Math.round(d[idx] * (1 - alpha) + fillR * alpha);
      d[idx + 1] = Math.round(d[idx + 1] * (1 - alpha) + fillG * alpha);
      d[idx + 2] = Math.round(d[idx + 2] * (1 - alpha) + fillB * alpha);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}
