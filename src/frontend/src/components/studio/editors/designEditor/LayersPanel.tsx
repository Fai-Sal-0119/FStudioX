// ─── Design Editor Layers Panel ───────────────────────────────────────────────

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import type { CanvasShape } from "./types";

interface LayersPanelProps {
  shapes: CanvasShape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveLayer: (dir: "up" | "down") => void;
  onClearAll: () => void;
  showClearConfirm: boolean;
  onConfirmClear: () => void;
  onCancelClear: () => void;
}

export default function LayersPanel({
  shapes,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onMoveLayer,
  onClearAll,
  showClearConfirm,
  onConfirmClear,
  onCancelClear,
}: LayersPanelProps) {
  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between px-1 pb-2 pt-1"
        style={{
          borderBottom: "1px solid var(--fsx-border)",
          marginBottom: "8px",
        }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          Layers ({shapes.length})
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move layer up"
            onClick={() => onMoveLayer("up")}
            className="w-6 h-6 flex items-center justify-center rounded transition-all"
            style={{
              color: "var(--fsx-text-muted)",
              backgroundColor: "var(--fsx-bg-elevated)",
            }}
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            aria-label="Move layer down"
            onClick={() => onMoveLayer("down")}
            className="w-6 h-6 flex items-center justify-center rounded transition-all"
            style={{
              color: "var(--fsx-text-muted)",
              backgroundColor: "var(--fsx-bg-elevated)",
            }}
          >
            <ChevronDown size={12} />
          </button>
          <button
            type="button"
            data-ocid="design_editor.clear_all.button"
            onClick={onClearAll}
            className="px-2 py-0.5 rounded text-xs font-medium transition-all"
            style={{
              backgroundColor: "rgba(225,29,46,0.1)",
              border: "1px solid rgba(225,29,46,0.25)",
              color: "var(--fsx-accent)",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: "rgba(225,29,46,0.08)",
            border: "1px solid rgba(225,29,46,0.25)",
          }}
        >
          <span style={{ color: "var(--fsx-text-secondary)" }}>
            Delete all shapes?
          </span>
          <button
            type="button"
            data-ocid="design_editor.clear_confirm.button"
            onClick={onConfirmClear}
            className="px-2 py-0.5 rounded font-semibold"
            style={{ backgroundColor: "var(--fsx-accent)", color: "white" }}
          >
            Yes
          </button>
          <button
            type="button"
            data-ocid="design_editor.clear_cancel.button"
            onClick={onCancelClear}
            style={{ color: "var(--fsx-text-muted)" }}
          >
            Cancel
          </button>
        </div>
      )}

      {shapes.length === 0 ? (
        <p
          className="text-xs py-2 px-1"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          No layers yet. Draw a shape to begin.
        </p>
      ) : (
        <div className="space-y-1">
          {[...shapes].reverse().map((shape, i) => (
            <button
              key={shape.id}
              type="button"
              data-ocid={`design_editor.layer.item.${i + 1}`}
              aria-label={`Select layer: ${shape.name}`}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-left"
              style={{
                backgroundColor:
                  selectedId === shape.id
                    ? "rgba(225,29,46,0.12)"
                    : "var(--fsx-bg-elevated)",
                border:
                  selectedId === shape.id
                    ? "1px solid rgba(225,29,46,0.3)"
                    : "1px solid var(--fsx-border)",
                opacity: shape.visible ? 1 : 0.45,
              }}
              onClick={() => onSelect(shape.id)}
            >
              <div
                className="w-3.5 h-3.5 rounded shrink-0 flex-none"
                style={{
                  backgroundColor:
                    shape.fill === "transparent" ? shape.stroke : shape.fill,
                  border: "1px solid var(--fsx-border)",
                }}
              />
              <span
                className="flex-1 text-xs truncate min-w-0"
                style={{
                  color:
                    selectedId === shape.id
                      ? "white"
                      : "var(--fsx-text-secondary)",
                }}
              >
                {shape.name}
                {shape.text ? ` — "${shape.text.slice(0, 12)}"` : ""}
              </span>
              <button
                type="button"
                data-ocid={`design_editor.layer.visibility.${i + 1}`}
                title={shape.visible ? "Hide" : "Show"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(shape.id);
                }}
                className="w-5 h-5 flex items-center justify-center rounded shrink-0 flex-none"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                {shape.visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
              <button
                type="button"
                data-ocid={`design_editor.layer.lock.${i + 1}`}
                title={shape.locked ? "Unlock" : "Lock"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(shape.id);
                }}
                className="w-5 h-5 flex items-center justify-center rounded shrink-0 flex-none"
                style={{
                  color: shape.locked
                    ? "var(--fsx-accent)"
                    : "var(--fsx-text-muted)",
                }}
              >
                {shape.locked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
              <button
                type="button"
                data-ocid={`design_editor.layer.delete.${i + 1}`}
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(shape.id);
                }}
                className="w-5 h-5 flex items-center justify-center rounded shrink-0 flex-none"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                <Trash2 size={11} />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
