// ─── Shared controls + FilterCanvas for Image Editor tabs ─────────────────────
import type { ReactNode } from "react";
import { PRESETS } from "./imageEditorUtils";
import type { Adjustments } from "./imageEditorUtils";
import { buildFilterString } from "./imageEditorUtils";

// ─── SliderControl ─────────────────────────────────────────────────────────────

export function SliderControl({
  label,
  icon,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span
          className="text-xs flex items-center gap-1.5"
          style={{ color: "var(--fsx-text-secondary)" }}
        >
          <span className="text-[10px]">{icon}</span>
          {label}
        </span>
        <span
          className="text-xs font-mono tabular-nums w-8 text-right"
          style={{
            color: value === 0 ? "var(--fsx-text-muted)" : "var(--fsx-accent)",
          }}
        >
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "var(--fsx-accent)" }}
      />
    </div>
  );
}

// ─── TabSectionHeader ──────────────────────────────────────────────────────────

export function TabSectionHeader({ children }: { children: ReactNode }) {
  return (
    <h4
      className="text-[11px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: "var(--fsx-text-muted)" }}
    >
      {children}
    </h4>
  );
}

// ─── ActionButton ──────────────────────────────────────────────────────────────

export function ActionButton({
  onClick,
  children,
  variant = "secondary",
  dataOcid,
  title,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  dataOcid?: string;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-ocid={dataOcid}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        backgroundColor:
          variant === "primary"
            ? "var(--fsx-accent)"
            : variant === "danger"
              ? "rgba(225,29,46,0.12)"
              : "var(--fsx-bg-elevated)",
        color:
          variant === "primary"
            ? "#fff"
            : variant === "danger"
              ? "var(--fsx-accent)"
              : "var(--fsx-text-secondary)",
        border:
          variant === "primary"
            ? "1px solid var(--fsx-accent)"
            : variant === "danger"
              ? "1px solid rgba(225,29,46,0.3)"
              : "1px solid var(--fsx-border)",
      }}
    >
      {children}
    </button>
  );
}

// ─── FilterCanvas ──────────────────────────────────────────────────────────────
// Reusable component: shows a CSS-filtered thumbnail of either a color swatch
// or a provided image URL, used in filter preset grids.

export function FilterCanvas({
  imageUrl,
  filterCss,
  thumbColor,
  active,
  label,
  onClick,
  size = 56,
}: {
  imageUrl?: string | null;
  filterCss: string;
  thumbColor: string;
  active: boolean;
  label: string;
  onClick: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 transition-all"
      aria-pressed={active}
      title={label}
    >
      <div
        className="overflow-hidden rounded-xl"
        style={{
          width: size,
          height: size,
          border: active
            ? "2px solid var(--fsx-accent)"
            : "2px solid transparent",
          boxShadow: active ? "0 0 0 1px var(--fsx-accent)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-cover"
            style={{ filter: filterCss !== "none" ? filterCss : undefined }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${thumbColor} 0%, ${thumbColor}88 50%, ${thumbColor}44 100%)`,
              filter: filterCss !== "none" ? filterCss : undefined,
            }}
          />
        )}
      </div>
      <span
        className="text-[10px] font-medium leading-none truncate max-w-[60px]"
        style={{
          color: active ? "var(--fsx-accent)" : "var(--fsx-text-muted)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── FilterPresetsRow ──────────────────────────────────────────────────────────
// Convenience wrapper: renders ALL presets in a horizontal scroll row using
// FilterCanvas, with optional source image for real previews.

export function FilterPresetsRow({
  activePresetId,
  imageUrl,
  adjustments,
  onPreset,
}: {
  activePresetId: string;
  imageUrl?: string | null;
  adjustments?: Adjustments;
  onPreset: (id: string) => void;
}) {
  return (
    <div
      data-ocid="image_editor.filters.scroll_row"
      className="flex gap-3 overflow-x-auto pb-2"
      style={{ scrollbarWidth: "none" }}
    >
      {PRESETS.map((preset) => {
        const active = activePresetId === preset.id;
        const filterCss = adjustments
          ? buildFilterString(preset.filter, adjustments)
          : preset.filter;
        return (
          <FilterCanvas
            key={preset.id}
            imageUrl={imageUrl}
            filterCss={filterCss}
            thumbColor={preset.thumb}
            active={active}
            label={preset.label}
            onClick={() => onPreset(preset.id)}
          />
        );
      })}
    </div>
  );
}

// ─── ToggleChip ───────────────────────────────────────────────────────────────
// Reusable chip-style toggle button with red active state.

export function ToggleChip({
  active,
  onClick,
  children,
  dataOcid,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  dataOcid?: string;
}) {
  return (
    <button
      type="button"
      data-ocid={dataOcid}
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px]"
      style={{
        backgroundColor: active
          ? "var(--fsx-accent)"
          : "var(--fsx-bg-elevated)",
        color: active ? "#fff" : "var(--fsx-text-secondary)",
        border: active
          ? "1px solid var(--fsx-accent)"
          : "1px solid var(--fsx-border)",
      }}
    >
      {children}
    </button>
  );
}
