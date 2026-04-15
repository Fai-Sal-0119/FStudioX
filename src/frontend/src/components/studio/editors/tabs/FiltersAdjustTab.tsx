// ─── Filters + Adjust Tab ─────────────────────────────────────────────────────
import { FlipHorizontal2, FlipVertical2, RotateCw } from "lucide-react";
import { SliderControl, TabSectionHeader } from "../ImageEditorShared";
import type { Adjustments } from "../imageEditorUtils";
import { PRESETS } from "../imageEditorUtils";

const SLIDER_DEFS: {
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
  icon: string;
}[] = [
  { key: "brightness", label: "Brightness", min: -100, max: 100, icon: "☀" },
  { key: "contrast", label: "Contrast", min: -100, max: 100, icon: "◑" },
  { key: "saturation", label: "Saturation", min: -100, max: 100, icon: "◎" },
  { key: "exposure", label: "Exposure", min: -100, max: 100, icon: "⊙" },
  { key: "temperature", label: "Temperature", min: -50, max: 50, icon: "🌡" },
  { key: "tint", label: "Tint", min: -50, max: 50, icon: "🎨" },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100, icon: "💥" },
  { key: "hue", label: "Hue", min: -180, max: 180, icon: "🌈" },
  { key: "gamma", label: "Gamma", min: -100, max: 100, icon: "Γ" },
  { key: "shadows", label: "Shadows", min: -100, max: 100, icon: "🌑" },
  { key: "highlights", label: "Highlights", min: -100, max: 100, icon: "✦" },
  { key: "blur", label: "Blur", min: 0, max: 20, icon: "⬤" },
  { key: "sharpen", label: "Sharpen", min: 0, max: 10, icon: "◇" },
  { key: "grain", label: "Grain", min: 0, max: 100, icon: "⠿" },
];

export function FiltersTab({
  activePresetId,
  onPreset,
}: {
  activePresetId: string;
  onPreset: (id: string) => void;
}) {
  return (
    <section>
      <TabSectionHeader>Filter Presets</TabSectionHeader>
      <div
        data-ocid="image_editor.filters.scroll_row"
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {PRESETS.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              data-ocid={`image_editor.filter.${preset.id}`}
              onClick={() => onPreset(preset.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl overflow-hidden"
                style={{
                  border: active
                    ? "2px solid var(--fsx-accent)"
                    : "2px solid transparent",
                  boxShadow: active ? "0 0 0 1px var(--fsx-accent)" : "none",
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${preset.thumb} 0%, ${preset.thumb}88 50%, ${preset.thumb}44 100%)`,
                    filter:
                      preset.filter !== "none" ? preset.filter : undefined,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-medium leading-none"
                style={{
                  color: active ? "var(--fsx-accent)" : "var(--fsx-text-muted)",
                }}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function TransformTab({
  rotation,
  flipH,
  flipV,
  onRotation,
  onFlipH,
  onFlipV,
}: {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  onRotation: (v: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
}) {
  return (
    <section>
      <TabSectionHeader>Transform</TabSectionHeader>
      <div className="flex flex-wrap gap-2">
        {[0, 90, 180, 270].map((deg) => (
          <button
            key={deg}
            type="button"
            data-ocid={`image_editor.rotate_${deg}.button`}
            onClick={() => onRotation(deg)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
            style={{
              backgroundColor:
                rotation === deg
                  ? "var(--fsx-accent)"
                  : "var(--fsx-bg-elevated)",
              color: rotation === deg ? "#fff" : "var(--fsx-text-secondary)",
              border: `1px solid ${rotation === deg ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
            }}
          >
            <RotateCw size={12} style={{ transform: `rotate(${deg}deg)` }} />
            {deg}°
          </button>
        ))}
        <button
          type="button"
          data-ocid="image_editor.flip_h.button"
          onClick={onFlipH}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
          style={{
            backgroundColor: flipH
              ? "var(--fsx-accent)"
              : "var(--fsx-bg-elevated)",
            color: flipH ? "#fff" : "var(--fsx-text-secondary)",
            border: `1px solid ${flipH ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
          }}
        >
          <FlipHorizontal2 size={12} /> Flip H
        </button>
        <button
          type="button"
          data-ocid="image_editor.flip_v.button"
          onClick={onFlipV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
          style={{
            backgroundColor: flipV
              ? "var(--fsx-accent)"
              : "var(--fsx-bg-elevated)",
            color: flipV ? "#fff" : "var(--fsx-text-secondary)",
            border: `1px solid ${flipV ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
          }}
        >
          <FlipVertical2 size={12} /> Flip V
        </button>
      </div>
    </section>
  );
}

export function AdjustTab({
  adjustments,
  onChange,
}: {
  adjustments: Adjustments;
  onChange: (key: keyof Adjustments, value: number) => void;
}) {
  return (
    <section>
      <TabSectionHeader>Adjustments (14 Controls)</TabSectionHeader>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        {SLIDER_DEFS.map((def) => (
          <SliderControl
            key={def.key}
            label={def.label}
            icon={def.icon}
            value={adjustments[def.key]}
            min={def.min}
            max={def.max}
            onChange={(v) => onChange(def.key, v)}
          />
        ))}
      </div>
    </section>
  );
}
