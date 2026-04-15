// ─── Background Tab ───────────────────────────────────────────────────────────
import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  ActionButton,
  SliderControl,
  TabSectionHeader,
} from "../ImageEditorShared";

export type BgType = "none" | "color" | "gradient" | "gallery";

export interface BackgroundState {
  removed: boolean;
  type: BgType;
  color: string;
  gradientIndex: number;
  galleryUrl: string | null;
  overlayOpacity: number;
}

export const DEFAULT_BG_STATE: BackgroundState = {
  removed: false,
  type: "none",
  color: "#e11d2e",
  gradientIndex: 0,
  galleryUrl: null,
  overlayOpacity: 100,
};

const GRADIENTS = [
  { label: "Sunset", value: "linear-gradient(135deg,#ff7b54,#ffb26b,#ffe3b3)" },
  { label: "Ocean", value: "linear-gradient(135deg,#0f3460,#0e6ba8,#a8d8ea)" },
  {
    label: "Purple Haze",
    value: "linear-gradient(135deg,#6b21a8,#a855f7,#e879f9)",
  },
  {
    label: "Golden Hour",
    value: "linear-gradient(135deg,#f59e0b,#ef4444,#1e1b4b)",
  },
  {
    label: "Midnight",
    value: "linear-gradient(135deg,#0b0b0f,#1e293b,#334155)",
  },
  { label: "Forest", value: "linear-gradient(135deg,#14532d,#22c55e,#bbf7d0)" },
];

export function BackgroundTab({
  bg,
  onChange,
  onRemoveBg,
  isProcessing,
}: {
  bg: BackgroundState;
  onChange: (update: Partial<BackgroundState>) => void;
  onRemoveBg: () => void;
  isProcessing: boolean;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<"remove" | "replace">(
    "remove",
  );

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ galleryUrl: url, type: "gallery" });
  };

  return (
    <div className="space-y-4">
      {/* Section toggle */}
      <div
        className="flex rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--fsx-border)" }}
      >
        {(["remove", "replace"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(s)}
            className="flex-1 py-2 text-xs font-semibold capitalize transition-colors"
            style={{
              backgroundColor:
                activeSection === s
                  ? "var(--fsx-accent)"
                  : "var(--fsx-bg-elevated)",
              color: activeSection === s ? "#fff" : "var(--fsx-text-muted)",
            }}
          >
            {s === "remove" ? "Remove BG" : "Replace BG"}
          </button>
        ))}
      </div>

      {activeSection === "remove" && (
        <section className="space-y-3">
          <TabSectionHeader>Background Removal</TabSectionHeader>
          <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
            Auto-detects and removes background using edge-based colour
            sampling.
          </p>
          <ActionButton
            variant="primary"
            dataOcid="image_editor.bg_remove.button"
            onClick={onRemoveBg}
          >
            {isProcessing ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Processing…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ImageIcon size={13} /> Remove Background
              </span>
            )}
          </ActionButton>
          {bg.removed && (
            <div
              className="rounded-lg p-2 text-xs text-center"
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              ✓ Background removed — checkerboard = transparent
            </div>
          )}
        </section>
      )}

      {activeSection === "replace" && (
        <section className="space-y-4">
          <TabSectionHeader>Replace Background</TabSectionHeader>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {(["color", "gradient", "gallery"] as BgType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ type: t })}
                className="px-3 py-1.5 rounded-lg text-xs capitalize transition-colors"
                style={{
                  backgroundColor:
                    bg.type === t
                      ? "var(--fsx-accent)"
                      : "var(--fsx-bg-elevated)",
                  color: bg.type === t ? "#fff" : "var(--fsx-text-secondary)",
                  border: `1px solid ${bg.type === t ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
                }}
              >
                {t === "gallery"
                  ? "📷 Gallery"
                  : t === "color"
                    ? "🎨 Color"
                    : "🌈 Gradient"}
              </button>
            ))}
          </div>

          {bg.type === "color" && (
            <div className="space-y-2">
              <span
                className="text-xs"
                style={{ color: "var(--fsx-text-secondary)" }}
              >
                Pick Color
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bg.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                  style={{ backgroundColor: "transparent" }}
                />
                <span
                  className="text-sm font-mono"
                  style={{ color: "var(--fsx-text-secondary)" }}
                >
                  {bg.color}
                </span>
              </div>
              {/* Quick color palette */}
              <div className="flex gap-2 flex-wrap pt-1">
                {[
                  "#000000",
                  "#ffffff",
                  "#e11d2e",
                  "#1e293b",
                  "#0f3460",
                  "#14532d",
                  "#6b21a8",
                  "#f59e0b",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ color: c })}
                    className="w-7 h-7 rounded-lg transition-all"
                    style={{
                      backgroundColor: c,
                      border:
                        bg.color === c
                          ? "2px solid var(--fsx-accent)"
                          : "1px solid var(--fsx-border)",
                      boxShadow:
                        bg.color === c ? "0 0 0 1px var(--fsx-accent)" : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {bg.type === "gradient" && (
            <div className="grid grid-cols-3 gap-2">
              {GRADIENTS.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => onChange({ gradientIndex: i })}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{
                    border:
                      bg.gradientIndex === i
                        ? "2px solid var(--fsx-accent)"
                        : "2px solid transparent",
                    boxShadow:
                      bg.gradientIndex === i
                        ? "0 0 0 1px var(--fsx-accent)"
                        : "none",
                  }}
                >
                  <div className="h-10" style={{ background: g.value }} />
                  <div
                    className="text-[10px] py-1 text-center"
                    style={{
                      backgroundColor: "var(--fsx-bg-elevated)",
                      color: "var(--fsx-text-muted)",
                    }}
                  >
                    {g.label}
                  </div>
                </button>
              ))}
            </div>
          )}

          {bg.type === "gallery" && (
            <div className="space-y-2">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryPick}
              />
              <ActionButton
                dataOcid="image_editor.bg_gallery.button"
                onClick={() => galleryInputRef.current?.click()}
              >
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={13} /> Choose from Gallery
                </span>
              </ActionButton>
              {bg.galleryUrl && (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--fsx-border)" }}
                >
                  <img
                    src={bg.galleryUrl}
                    alt="BG"
                    className="w-full h-20 object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {bg.type !== "none" && (
            <SliderControl
              label="BG Opacity"
              icon="⬚"
              value={bg.overlayOpacity}
              min={0}
              max={100}
              onChange={(v) => onChange({ overlayOpacity: v })}
            />
          )}
        </section>
      )}
    </div>
  );
}

export { GRADIENTS };
