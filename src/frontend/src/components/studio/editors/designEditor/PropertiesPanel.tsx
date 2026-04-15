// ─── Design Editor Properties Panel ─────────────────────────────────────────

import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignHorizontalDistributeEnd,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Copy,
  Italic,
  Trash2,
} from "lucide-react";
import type { CanvasShape } from "./types";
import { FONTS } from "./types";

interface PropertiesPanelProps {
  selectedShape: CanvasShape | undefined;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  bgColor: string;
  onFillChange: (v: string) => void;
  onStrokeColorChange: (v: string) => void;
  onStrokeWidthChange: (v: number) => void;
  onOpacityChange: (v: number) => void;
  onRotationChange: (v: number) => void;
  onFontFamilyChange: (v: string) => void;
  onFontSizeChange: (v: number) => void;
  onBoldChange: (v: boolean) => void;
  onItalicChange: (v: boolean) => void;
  onBgColorChange: (v: string) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (
    axis:
      | "left"
      | "center"
      | "right"
      | "top"
      | "middle"
      | "bottom"
      | "dist-h"
      | "dist-v",
  ) => void;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-xs font-semibold uppercase tracking-widest px-1 pb-2 pt-1"
      style={{
        color: "var(--fsx-text-muted)",
        borderBottom: "1px solid var(--fsx-border)",
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  );
}

function ControlRow({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className="text-xs shrink-0"
        style={{ color: "var(--fsx-text-secondary)", minWidth: "64px" }}
      >
        {label}
      </span>
      <div className="flex-1 flex items-center justify-end gap-2">
        {children}
      </div>
    </div>
  );
}

export default function PropertiesPanel({
  selectedShape,
  fillColor,
  strokeColor,
  strokeWidth,
  opacity,
  rotation,
  fontFamily,
  fontSize,
  bold,
  italic,
  bgColor,
  onFillChange,
  onStrokeColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onRotationChange,
  onFontFamilyChange,
  onFontSizeChange,
  onBoldChange,
  onItalicChange,
  onBgColorChange,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onAlign,
}: PropertiesPanelProps) {
  const isText = selectedShape?.type === "text";

  return (
    <div className="space-y-4">
      {/* ── Colors & Stroke ── */}
      <div className="space-y-3">
        <SectionHeader>Colors &amp; Stroke</SectionHeader>
        <ControlRow label="Fill">
          <input
            data-ocid="design_editor.fill_color.input"
            type="color"
            value={fillColor}
            onChange={(e) => onFillChange(e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer border-0"
            style={{ backgroundColor: "transparent" }}
          />
          <span
            className="text-xs font-mono"
            style={{ color: "var(--fsx-text-muted)" }}
          >
            {fillColor}
          </span>
        </ControlRow>
        <ControlRow label="Stroke">
          <input
            data-ocid="design_editor.stroke_color.input"
            type="color"
            value={strokeColor}
            onChange={(e) => onStrokeColorChange(e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer border-0"
            style={{ backgroundColor: "transparent" }}
          />
          <span
            className="text-xs font-mono"
            style={{ color: "var(--fsx-text-muted)" }}
          >
            {strokeColor}
          </span>
        </ControlRow>
        <div className="space-y-1.5">
          <ControlRow label="Stroke W">
            <span
              className="text-xs font-mono"
              style={{ color: "var(--fsx-accent)" }}
            >
              {strokeWidth}px
            </span>
          </ControlRow>
          <input
            data-ocid="design_editor.stroke_width.input"
            type="range"
            min={0}
            max={20}
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
            style={{ accentColor: "var(--fsx-accent)" }}
          />
        </div>
        <div className="space-y-1.5">
          <ControlRow label="Opacity">
            <span
              className="text-xs font-mono"
              style={{ color: "var(--fsx-accent)" }}
            >
              {opacity}%
            </span>
          </ControlRow>
          <input
            data-ocid="design_editor.opacity.input"
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
            style={{ accentColor: "var(--fsx-accent)" }}
          />
        </div>
        <ControlRow label="Rotation">
          <input
            data-ocid="design_editor.rotation.input"
            type="number"
            min={-360}
            max={360}
            value={rotation}
            onChange={(e) => onRotationChange(Number(e.target.value))}
            className="w-16 px-2 py-1 rounded text-xs outline-none text-right"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              border: "1px solid var(--fsx-border)",
              color: "white",
            }}
          />
          <span className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
            °
          </span>
        </ControlRow>
        <ControlRow label="Canvas BG">
          <input
            data-ocid="design_editor.bg_color.input"
            type="color"
            value={bgColor}
            onChange={(e) => onBgColorChange(e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer border-0"
            style={{ backgroundColor: "transparent" }}
          />
        </ControlRow>
      </div>

      {/* ── Text & Font ── */}
      <div className="space-y-3">
        <SectionHeader>
          Text &amp; Font
          {!isText && (
            <span
              className="normal-case font-normal ml-1"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              (select text)
            </span>
          )}
        </SectionHeader>
        <div className="space-y-1">
          <span
            className="text-xs"
            style={{ color: "var(--fsx-text-secondary)" }}
          >
            Font Family
          </span>
          <select
            data-ocid="design_editor.font_family.select"
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            disabled={!isText}
            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none disabled:opacity-40"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              border: "1px solid var(--fsx-border)",
              color: "white",
            }}
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <ControlRow label="Size">
            <span
              className="text-xs font-mono"
              style={{ color: "var(--fsx-accent)" }}
            >
              {fontSize}px
            </span>
          </ControlRow>
          <input
            data-ocid="design_editor.font_size.input"
            type="range"
            min={8}
            max={200}
            value={fontSize}
            disabled={!isText}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full h-1.5 appearance-none rounded-full cursor-pointer disabled:opacity-40"
            style={{ accentColor: "var(--fsx-accent)" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="design_editor.bold.toggle"
            disabled={!isText}
            onClick={() => onBoldChange(!bold)}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
            style={{
              backgroundColor: bold
                ? "rgba(225,29,46,0.18)"
                : "var(--fsx-bg-elevated)",
              border: bold
                ? "1px solid rgba(225,29,46,0.4)"
                : "1px solid var(--fsx-border)",
              color: bold ? "var(--fsx-accent)" : "var(--fsx-text-secondary)",
            }}
          >
            <Bold size={13} /> Bold
          </button>
          <button
            type="button"
            data-ocid="design_editor.italic.toggle"
            disabled={!isText}
            onClick={() => onItalicChange(!italic)}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
            style={{
              backgroundColor: italic
                ? "rgba(225,29,46,0.18)"
                : "var(--fsx-bg-elevated)",
              border: italic
                ? "1px solid rgba(225,29,46,0.4)"
                : "1px solid var(--fsx-border)",
              color: italic ? "var(--fsx-accent)" : "var(--fsx-text-secondary)",
            }}
          >
            <Italic size={13} /> Italic
          </button>
        </div>
      </div>

      {/* ── Shape Actions ── */}
      {selectedShape && (
        <div className="space-y-3">
          <SectionHeader>Shape Actions</SectionHeader>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              {
                label: "Front",
                fn: onBringToFront,
                ocid: "bring_front",
                icon: <ChevronUp size={12} />,
              },
              {
                label: "Back",
                fn: onSendToBack,
                ocid: "send_back",
                icon: <ChevronDown size={12} />,
              },
            ].map(({ label, fn, ocid, icon }) => (
              <button
                key={label}
                type="button"
                data-ocid={`design_editor.${ocid}.button`}
                onClick={fn}
                className="flex items-center justify-center gap-1 h-8 rounded-lg text-xs transition-all"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  color: "var(--fsx-text-secondary)",
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              data-ocid="design_editor.duplicate.button"
              onClick={onDuplicate}
              className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs transition-all"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                border: "1px solid var(--fsx-border)",
                color: "var(--fsx-text-secondary)",
              }}
            >
              <Copy size={12} /> Duplicate
            </button>
            <button
              type="button"
              data-ocid="design_editor.delete.button"
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs transition-all"
              style={{
                backgroundColor: "rgba(225,29,46,0.1)",
                border: "1px solid rgba(225,29,46,0.3)",
                color: "var(--fsx-accent)",
              }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>

          {/* Alignment */}
          <SectionHeader>Alignment</SectionHeader>
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                {
                  id: "left" as const,
                  icon: <AlignLeft size={13} />,
                  title: "Align Left",
                },
                {
                  id: "center" as const,
                  icon: <AlignCenter size={13} />,
                  title: "Align Center H",
                },
                {
                  id: "right" as const,
                  icon: <AlignRight size={13} />,
                  title: "Align Right",
                },
                {
                  id: "top" as const,
                  icon: <ChevronUp size={13} />,
                  title: "Align Top",
                },
                {
                  id: "middle" as const,
                  icon: <AlignCenter size={13} />,
                  title: "Align Middle V",
                },
                {
                  id: "bottom" as const,
                  icon: <ChevronDown size={13} />,
                  title: "Align Bottom",
                },
                {
                  id: "dist-h" as const,
                  icon: <AlignHorizontalDistributeCenter size={13} />,
                  title: "Distribute H",
                },
                {
                  id: "dist-v" as const,
                  icon: <AlignHorizontalDistributeEnd size={13} />,
                  title: "Distribute V",
                },
              ] as Array<{
                id:
                  | "left"
                  | "center"
                  | "right"
                  | "top"
                  | "middle"
                  | "bottom"
                  | "dist-h"
                  | "dist-v";
                icon: React.ReactNode;
                title: string;
              }>
            ).map(({ id, icon, title }) => (
              <button
                key={id}
                type="button"
                data-ocid={`design_editor.align_${id}.button`}
                onClick={() => onAlign(id)}
                title={title}
                className="flex items-center justify-center h-8 rounded-lg text-xs transition-all"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  color: "var(--fsx-text-secondary)",
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
