import { useState } from "react";
import { TabSectionHeader } from "../ImageEditorShared";
// ─── Effects Tab ──────────────────────────────────────────────────────────────
import { EFFECT_PRESETS } from "../imageEditorUtils";

export function EffectsTab({
  activeEffects,
  onToggleEffect,
}: {
  activeEffects: Set<string>;
  onToggleEffect: (id: string) => void;
}) {
  const [intensity, setIntensity] = useState(80);

  return (
    <div className="space-y-4">
      <TabSectionHeader>Effects & Overlays</TabSectionHeader>
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Stack multiple effects. Applied on export.
      </p>

      {/* Effect grid */}
      <div className="grid grid-cols-4 gap-3">
        {EFFECT_PRESETS.map((effect) => {
          const active = activeEffects.has(effect.id);
          return (
            <button
              key={effect.id}
              type="button"
              data-ocid={`image_editor.effect.${effect.id}`}
              onClick={() => onToggleEffect(effect.id)}
              className="flex flex-col items-center gap-1.5 transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: `linear-gradient(135deg, ${effect.thumb}, ${effect.thumb}88)`,
                  border: active
                    ? "2px solid var(--fsx-accent)"
                    : "2px solid transparent",
                  boxShadow: active
                    ? "0 0 0 1px var(--fsx-accent), 0 0 8px rgba(225,29,46,0.3)"
                    : "none",
                }}
              >
                <span className="text-[10px] font-bold text-white/80 text-center leading-tight px-1">
                  {effect.label.slice(0, 4).toUpperCase()}
                </span>
              </div>
              <span
                className="text-[10px] font-medium leading-none text-center"
                style={{
                  color: active ? "var(--fsx-accent)" : "var(--fsx-text-muted)",
                }}
              >
                {effect.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Intensity slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span
            className="text-xs"
            style={{ color: "var(--fsx-text-secondary)" }}
          >
            Effect Intensity
          </span>
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: "var(--fsx-accent)" }}
          >
            {intensity}%
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "var(--fsx-accent)" }}
          data-ocid="image_editor.effects.intensity_slider"
        />
        <p className="text-[10px]" style={{ color: "var(--fsx-text-muted)" }}>
          Intensity applies to newly toggled effects only
        </p>
      </div>

      {activeEffects.size > 0 && (
        <div
          className="rounded-lg p-2.5 text-xs"
          style={{
            backgroundColor: "rgba(225,29,46,0.08)",
            border: "1px solid rgba(225,29,46,0.2)",
          }}
        >
          <span style={{ color: "var(--fsx-text-secondary)" }}>Active: </span>
          <span style={{ color: "var(--fsx-accent)" }}>
            {Array.from(activeEffects).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
