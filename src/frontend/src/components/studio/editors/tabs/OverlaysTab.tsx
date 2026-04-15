// ─── Overlays Tab ─────────────────────────────────────────────────────────────
import { Trash2 } from "lucide-react";
import { useRef } from "react";
import {
  ActionButton,
  SliderControl,
  TabSectionHeader,
} from "../ImageEditorShared";

export interface OverlayState {
  url: string | null;
  opacity: number;
  blendMode: string;
  scale: number;
  posX: number;
  posY: number;
}

export const DEFAULT_OVERLAY: OverlayState = {
  url: null,
  opacity: 70,
  blendMode: "normal",
  scale: 100,
  posX: 50,
  posY: 50,
};

const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
];

export function OverlaysTab({
  overlay,
  onChange,
}: {
  overlay: OverlayState;
  onChange: (update: Partial<OverlayState>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ url: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-4">
      <TabSectionHeader>Photo Overlay</TabSectionHeader>
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Add a semi-transparent overlay image on top of your photo.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePick}
      />

      {!overlay.url ? (
        <ActionButton
          variant="primary"
          dataOcid="image_editor.overlay_add.button"
          onClick={() => inputRef.current?.click()}
        >
          + Add Photo Overlay
        </ActionButton>
      ) : (
        <div className="space-y-3">
          <div
            className="relative rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--fsx-border)" }}
          >
            <img
              src={overlay.url}
              alt="Overlay"
              className="w-full h-24 object-cover"
            />
            <button
              type="button"
              data-ocid="image_editor.overlay_remove.button"
              onClick={() => onChange({ url: null })}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "rgba(225,29,46,0.85)" }}
            >
              <Trash2 size={12} color="#fff" />
            </button>
          </div>

          <SliderControl
            label="Opacity"
            icon="◌"
            value={overlay.opacity}
            min={0}
            max={100}
            onChange={(v) => onChange({ opacity: v })}
          />

          <SliderControl
            label="Scale"
            icon="⤢"
            value={overlay.scale}
            min={10}
            max={200}
            onChange={(v) => onChange({ scale: v })}
          />

          <SliderControl
            label="Position X"
            icon="↔"
            value={overlay.posX}
            min={0}
            max={100}
            onChange={(v) => onChange({ posX: v })}
          />

          <SliderControl
            label="Position Y"
            icon="↕"
            value={overlay.posY}
            min={0}
            max={100}
            onChange={(v) => onChange({ posY: v })}
          />

          <div className="space-y-2">
            <span
              className="text-xs"
              style={{ color: "var(--fsx-text-secondary)" }}
            >
              Blend Mode
            </span>
            <div className="flex gap-2 flex-wrap">
              {BLEND_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ blendMode: m })}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] capitalize transition-colors"
                  style={{
                    backgroundColor:
                      overlay.blendMode === m
                        ? "var(--fsx-accent)"
                        : "var(--fsx-bg-elevated)",
                    color:
                      overlay.blendMode === m
                        ? "#fff"
                        : "var(--fsx-text-secondary)",
                    border: `1px solid ${overlay.blendMode === m ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <ActionButton
            dataOcid="image_editor.overlay_change.button"
            onClick={() => inputRef.current?.click()}
          >
            📷 Change Overlay Photo
          </ActionButton>
        </div>
      )}
    </div>
  );
}
