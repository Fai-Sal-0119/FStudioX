// ─── Quality Enhancement Tab ──────────────────────────────────────────────────
import { Zap } from "lucide-react";
import {
  ActionButton,
  SliderControl,
  TabSectionHeader,
} from "../ImageEditorShared";

export interface QualityState {
  denoise: number;
  hdrEffect: boolean;
  upscaled: boolean;
  sharpenBoosted: boolean;
}

export const DEFAULT_QUALITY: QualityState = {
  denoise: 0,
  hdrEffect: false,
  upscaled: false,
  sharpenBoosted: false,
};

export function QualityTab({
  quality,
  onDenoise,
  onHDR,
  onEnhance,
  onUpscale,
  onRestoreColors,
  onSharpenBoost,
  isProcessing,
}: {
  quality: QualityState;
  onDenoise: (v: number) => void;
  onHDR: () => void;
  onEnhance: () => void;
  onUpscale: () => void;
  onRestoreColors: () => void;
  onSharpenBoost: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="space-y-4">
      <TabSectionHeader>Quality Enhancement</TabSectionHeader>
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Canvas-based tools — baked into the image permanently.
      </p>

      {/* Primary action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          variant="primary"
          dataOcid="image_editor.enhance.button"
          onClick={onEnhance}
        >
          {isProcessing ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Processing…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Zap size={13} /> Enhance Quality
            </span>
          )}
        </ActionButton>

        <ActionButton
          dataOcid="image_editor.upscale.button"
          onClick={onUpscale}
        >
          <span className="flex items-center gap-1.5">⤢ Upscale 2×</span>
        </ActionButton>

        <ActionButton
          dataOcid="image_editor.restore_colors.button"
          onClick={onRestoreColors}
        >
          🎨 Restore Colors
        </ActionButton>

        <ActionButton
          dataOcid="image_editor.sharpen_boost.button"
          onClick={onSharpenBoost}
        >
          <span className="flex items-center gap-1.5">◇ Sharpen Boost</span>
        </ActionButton>
      </div>

      {/* HDR Toggle */}
      <button
        type="button"
        data-ocid="image_editor.hdr.button"
        onClick={onHDR}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{
          backgroundColor: quality.hdrEffect
            ? "rgba(225,29,46,0.15)"
            : "var(--fsx-bg-elevated)",
          color: quality.hdrEffect
            ? "var(--fsx-accent)"
            : "var(--fsx-text-secondary)",
          border: `1px solid ${quality.hdrEffect ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
        }}
      >
        ✦ HDR Effect {quality.hdrEffect ? "— Active" : ""}
      </button>

      {/* Denoise Slider */}
      <SliderControl
        label="Denoise"
        icon="〰"
        value={quality.denoise}
        min={0}
        max={100}
        onChange={onDenoise}
      />

      {/* Status badges */}
      <div className="space-y-2">
        {quality.upscaled && (
          <div
            className="rounded-lg p-2.5 text-xs"
            style={{
              backgroundColor: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#22c55e",
            }}
          >
            ✓ Image upscaled to 2× resolution
          </div>
        )}
        {quality.sharpenBoosted && (
          <div
            className="rounded-lg p-2.5 text-xs"
            style={{
              backgroundColor: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#22c55e",
            }}
          >
            ✓ Sharpen boost applied
          </div>
        )}
      </div>

      <div
        className="rounded-lg p-3 space-y-1.5"
        style={{
          backgroundColor: "var(--fsx-bg-elevated)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        <p
          className="text-[10px] font-semibold"
          style={{ color: "var(--fsx-text-secondary)" }}
        >
          ✦ Quality Guide
        </p>
        <ul className="space-y-1">
          {[
            "Enhance: unsharp mask + contrast boost",
            "Upscale: 2× canvas with bicubic smoothing",
            "Sharpen Boost: high-pass detail sharpening",
            "HDR: boosts micro-detail + saturation",
            "Restore: auto-levels histogram per channel",
            "Denoise: smart blur noise reduction",
          ].map((tip) => (
            <li
              key={tip}
              className="text-[10px]"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              · {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
