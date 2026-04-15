// ─── AI Photo Tab ─────────────────────────────────────────────────────────────
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { TabSectionHeader } from "../ImageEditorShared";
import type { AgeMode, AiToolId, CartoonMode } from "../imageEditorUtils";
import {
  PRESETS,
  ageFilterEffect,
  analyzeForSmartFilter,
  blurBackground,
  cartoonEffect,
  colorizeImage,
  magicEraserApply,
  portraitBlur,
  redEyeRemoval,
  sketchEffect,
  skinToneFix,
} from "../imageEditorUtils";

// ─── Tool Definitions ─────────────────────────────────────────────────────────

interface AiTool {
  id: AiToolId;
  icon: string;
  label: string;
  desc: string;
}

const AI_TOOLS: AiTool[] = [
  {
    id: "portrait",
    icon: "🎭",
    label: "Portrait Mode",
    desc: "Auto-blur background, keep subject sharp",
  },
  {
    id: "object_remove",
    icon: "🪄",
    label: "Object Remove",
    desc: "Paint over objects to erase them",
  },
  {
    id: "colorize",
    icon: "🎨",
    label: "AI Colorize",
    desc: "Add vibrant color to any photo",
  },
  {
    id: "cartoon",
    icon: "🖼",
    label: "Cartoon/Sketch",
    desc: "Cartoon or pencil sketch effects",
  },
  {
    id: "skin_tone",
    icon: "✨",
    label: "Skin Tone Fix",
    desc: "Even out skin tone automatically",
  },
  {
    id: "red_eye",
    icon: "👁",
    label: "Red Eye Fix",
    desc: "Remove red eye from flash photos",
  },
  {
    id: "age_filter",
    icon: "⏳",
    label: "Age Filter",
    desc: "Make face look younger or older",
  },
  {
    id: "blur_bg",
    icon: "🌫",
    label: "Blur Background",
    desc: "Isolate subject, blur background",
  },
  {
    id: "smart_filter",
    icon: "🤖",
    label: "Smart Filter",
    desc: "AI picks the best filter for you",
  },
  {
    id: "magic_eraser",
    icon: "⭐",
    label: "Magic Eraser",
    desc: "Feathered brush erase + fill",
  },
];

// ─── Mini-Panel Components ─────────────────────────────────────────────────────

function CartoonPanel({
  imgRef,
  onApply,
  onBusy,
}: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  onApply: (url: string) => void;
  onBusy: (b: boolean) => void;
}) {
  const run = (mode: CartoonMode) => {
    const img = imgRef.current;
    if (!img) return;
    onBusy(true);
    setTimeout(() => {
      const result =
        mode === "cartoon" ? cartoonEffect(img) : sketchEffect(img);
      onApply(result);
      onBusy(false);
    }, 60);
  };
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <MiniBtn icon="🖼" label="Cartoon" onClick={() => run("cartoon")} />
      <MiniBtn icon="✏️" label="Pencil Sketch" onClick={() => run("sketch")} />
    </div>
  );
}

function AgeFilterPanel({
  imgRef,
  onApply,
  onBusy,
}: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  onApply: (url: string) => void;
  onBusy: (b: boolean) => void;
}) {
  const run = (mode: AgeMode) => {
    const img = imgRef.current;
    if (!img) return;
    onBusy(true);
    setTimeout(() => {
      onApply(ageFilterEffect(img, mode));
      onBusy(false);
    }, 60);
  };
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <MiniBtn icon="🌱" label="Young" onClick={() => run("young")} />
      <MiniBtn icon="🌿" label="Old" onClick={() => run("old")} />
    </div>
  );
}

function MagicEraserPanel({
  imgRef,
  onApply,
  onBusy,
}: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  onApply: (url: string) => void;
  onBusy: (b: boolean) => void;
}) {
  const [radius, setRadius] = useState(60);
  const [centerX, setCenterX] = useState(50);
  const [centerY, setCenterY] = useState(50);

  const run = () => {
    const img = imgRef.current;
    if (!img) return;
    onBusy(true);
    setTimeout(() => {
      const cx = Math.round((centerX / 100) * img.naturalWidth);
      const cy = Math.round((centerY / 100) * img.naturalHeight);
      const r = Math.round(
        (radius / 100) * Math.min(img.naturalWidth, img.naturalHeight),
      );
      onApply(magicEraserApply(img, cx, cy, r));
      onBusy(false);
    }, 60);
  };

  return (
    <div className="space-y-3 mt-3">
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Position the eraser center and set radius, then apply.
      </p>
      {[
        { label: "Center X", value: centerX, set: setCenterX },
        { label: "Center Y", value: centerY, set: setCenterY },
        { label: "Radius", value: radius, set: setRadius },
      ].map(({ label, value, set }) => (
        <div key={label} className="space-y-1">
          <div className="flex justify-between">
            <span
              className="text-[11px]"
              style={{ color: "var(--fsx-text-secondary)" }}
            >
              {label}
            </span>
            <span
              className="text-[11px] font-mono"
              style={{ color: "var(--fsx-accent)" }}
            >
              {value}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={99}
            value={value}
            onChange={(e) => set(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "var(--fsx-accent)" }}
          />
        </div>
      ))}
      <button
        type="button"
        data-ocid="image_editor.ai_magic_eraser.apply_button"
        onClick={run}
        className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          backgroundColor: "var(--fsx-accent)",
          color: "#fff",
          border: "1px solid var(--fsx-accent)",
        }}
      >
        ⭐ Apply Magic Eraser
      </button>
    </div>
  );
}

function SmartFilterPanel({
  imgRef,
  onApplyPresetId,
}: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  onApplyPresetId: (id: string) => void;
}) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const analyze = () => {
    const img = imgRef.current;
    if (!img) return;
    const result = analyzeForSmartFilter(img);
    setSuggestion(result);
    setApplied(false);
  };

  const applyIt = () => {
    if (!suggestion) return;
    onApplyPresetId(suggestion);
    setApplied(true);
  };

  return (
    <div className="space-y-3 mt-3">
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Analyzes your image histogram and picks the best filter preset.
      </p>
      <button
        type="button"
        data-ocid="image_editor.ai_smart_filter.analyze_button"
        onClick={analyze}
        className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          backgroundColor: "var(--fsx-bg-elevated)",
          color: "var(--fsx-text-secondary)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        🤖 Analyze Image
      </button>
      {suggestion && (
        <div
          className="rounded-lg p-3 flex items-center justify-between"
          style={{
            backgroundColor: "rgba(225,29,46,0.08)",
            border: "1px solid rgba(225,29,46,0.25)",
          }}
        >
          <span
            className="text-xs"
            style={{ color: "var(--fsx-text-secondary)" }}
          >
            AI suggests:{" "}
            <span className="font-bold" style={{ color: "var(--fsx-accent)" }}>
              {PRESETS.find((p) => p.id === suggestion)?.label ?? suggestion}
            </span>
          </span>
          <button
            type="button"
            data-ocid="image_editor.ai_smart_filter.apply_button"
            onClick={applyIt}
            className="text-xs font-semibold px-3 py-1 rounded-lg transition-all"
            style={{
              backgroundColor: applied
                ? "rgba(34,197,94,0.15)"
                : "var(--fsx-accent)",
              color: applied ? "#22c55e" : "#fff",
              border: `1px solid ${applied ? "rgba(34,197,94,0.3)" : "var(--fsx-accent)"}`,
            }}
          >
            {applied ? "✓ Applied" : "Apply"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Generic One-Tap Panel ─────────────────────────────────────────────────────

function OneTapPanel({
  toolId,
  imgRef,
  onApply,
  onBusy,
  imageUrl,
}: {
  toolId: AiToolId;
  imgRef: React.RefObject<HTMLImageElement | null>;
  onApply: (url: string) => void;
  onBusy: (b: boolean) => void;
  imageUrl: string | null;
}) {
  const CONFIGS: Record<
    string,
    { label: string; icon: string; fn: (img: HTMLImageElement) => string }
  > = {
    portrait: { label: "Apply Portrait Mode", icon: "🎭", fn: portraitBlur },
    colorize: { label: "AI Colorize", icon: "🎨", fn: colorizeImage },
    skin_tone: { label: "Fix Skin Tone", icon: "✨", fn: skinToneFix },
    red_eye: { label: "Remove Red Eye", icon: "👁", fn: redEyeRemoval },
    blur_bg: { label: "Blur Background", icon: "🌫", fn: blurBackground },
    object_remove: {
      label: "Remove Object (center region)",
      icon: "🪄",
      fn: (img: HTMLImageElement) => {
        const cx = Math.round(img.naturalWidth / 2);
        const cy = Math.round(img.naturalHeight / 2);
        const r = Math.round(
          Math.min(img.naturalWidth, img.naturalHeight) * 0.15,
        );
        return magicEraserApply(img, cx, cy, r);
      },
    },
  };
  const cfg = CONFIGS[toolId];
  if (!cfg) return null;

  const run = () => {
    const img = imgRef.current;
    if (!img || !imageUrl) return;
    onBusy(true);
    setTimeout(() => {
      onApply(cfg.fn(img));
      onBusy(false);
    }, 60);
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        data-ocid={`image_editor.ai_${toolId}.apply_button`}
        onClick={run}
        className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          backgroundColor: "var(--fsx-accent)",
          color: "#fff",
          border: "1px solid var(--fsx-accent)",
        }}
      >
        {cfg.icon} {cfg.label}
      </button>
    </div>
  );
}

// ─── MiniBtn ──────────────────────────────────────────────────────────────────

function MiniBtn({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
      style={{
        backgroundColor: "var(--fsx-accent)",
        color: "#fff",
        border: "1px solid var(--fsx-accent)",
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

// ─── Main AIPhotoTab Component ─────────────────────────────────────────────────

export function AIPhotoTab({
  imgRef,
  imageUrl,
  isProcessing,
  onApply,
  onBusy,
  onApplyPresetId,
}: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  imageUrl: string | null;
  isProcessing: boolean;
  onApply: (url: string) => void;
  onBusy: (b: boolean) => void;
  onApplyPresetId: (id: string) => void;
}) {
  const [activeTool, setActiveTool] = useState<AiToolId | null>(null);

  const selectTool = (id: AiToolId) => {
    setActiveTool((prev) => (prev === id ? null : id));
  };

  const renderPanel = () => {
    if (!activeTool) return null;
    switch (activeTool) {
      case "cartoon":
        return (
          <CartoonPanel imgRef={imgRef} onApply={onApply} onBusy={onBusy} />
        );
      case "age_filter":
        return (
          <AgeFilterPanel imgRef={imgRef} onApply={onApply} onBusy={onBusy} />
        );
      case "magic_eraser":
        return (
          <MagicEraserPanel imgRef={imgRef} onApply={onApply} onBusy={onBusy} />
        );
      case "smart_filter":
        return (
          <SmartFilterPanel imgRef={imgRef} onApplyPresetId={onApplyPresetId} />
        );
      default:
        return (
          <OneTapPanel
            toolId={activeTool}
            imgRef={imgRef}
            onApply={onApply}
            onBusy={onBusy}
            imageUrl={imageUrl}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <TabSectionHeader>AI Photo Tools</TabSectionHeader>
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Client-side AI effects — tap a tool to open its controls.
      </p>

      {/* Processing overlay indicator */}
      {isProcessing && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
          style={{
            backgroundColor: "rgba(225,29,46,0.1)",
            border: "1px solid rgba(225,29,46,0.25)",
            color: "var(--fsx-accent)",
          }}
        >
          <Loader2 size={13} className="animate-spin shrink-0" />
          AI is processing your image…
        </div>
      )}

      {/* 2-column tool grid */}
      <div
        className="grid grid-cols-2 gap-2"
        data-ocid="image_editor.ai_tools.grid"
      >
        {AI_TOOLS.map((tool) => {
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              data-ocid={`image_editor.ai_${tool.id}.card`}
              onClick={() => selectTool(tool.id)}
              disabled={isProcessing}
              className="flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: active
                  ? "rgba(225,29,46,0.12)"
                  : "var(--fsx-bg-elevated)",
                border: active
                  ? "1px solid var(--fsx-accent)"
                  : "1px solid var(--fsx-border)",
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-base leading-none">{tool.icon}</span>
                <span
                  className="text-xs font-semibold leading-tight"
                  style={{
                    color: active
                      ? "var(--fsx-accent)"
                      : "var(--fsx-text-secondary)",
                  }}
                >
                  {tool.label}
                </span>
              </div>
              <p
                className="text-[10px] leading-tight pl-[26px]"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                {tool.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active tool mini-panel */}
      {activeTool && (
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: "var(--fsx-bg-elevated)",
            border: "1px solid var(--fsx-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">
              {AI_TOOLS.find((t) => t.id === activeTool)?.icon}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--fsx-text-secondary)" }}
            >
              {AI_TOOLS.find((t) => t.id === activeTool)?.label}
            </span>
          </div>
          {renderPanel()}
        </div>
      )}

      {/* Info box */}
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
          ✦ AI Tools Guide
        </p>
        <ul className="space-y-1">
          {[
            "Portrait: radial blur mask preserves face area",
            "Colorize: saturation boost + warm overlay",
            "Cartoon: edge detection + posterize",
            "Sketch: grayscale + inverted edges",
            "Skin Tone: reduces redness on skin pixels",
            "Red Eye: replaces red clusters in face area",
            "Magic Eraser: feathered brush fill from edges",
            "Smart Filter: histogram analysis picks best preset",
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
