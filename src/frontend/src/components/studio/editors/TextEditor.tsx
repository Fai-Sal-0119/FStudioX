import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Download,
  Maximize2,
  Minimize2,
  Redo2,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Alignment = "left" | "center" | "right" | "justify";
type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";
type FontWeight = 100 | 300 | 400 | 700 | 900;

const FONTS = [
  "Arial",
  "Georgia",
  "Courier New",
  "Impact",
  "Verdana",
  "Trebuchet MS",
  "Palatino",
  "Times New Roman",
  "Garamond",
  "Comic Sans MS",
];

const FONT_WEIGHTS: { label: string; value: FontWeight }[] = [
  { label: "Thin", value: 100 },
  { label: "Light", value: 300 },
  { label: "Normal", value: 400 },
  { label: "Bold", value: 700 },
  { label: "Black", value: 900 },
];

interface EditorState {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  textColor: string;
  textOpacity: number;
  bgColor: string;
  outlineColor: string;
  outlineWidth: number;
  shadowEnabled: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
  glowEnabled: boolean;
  glowColor: string;
  glowBlur: number;
  glowSpread: number;
  letterSpacing: number;
  lineHeight: number;
  alignment: Alignment;
  textTransform: TextTransform;
}

const DEFAULT_STATE: EditorState = {
  text: "Start typing your content here.\n\nFStudioX gives you full creative control over typography, colors, and effects.",
  fontFamily: "Arial",
  fontSize: 24,
  fontWeight: 400,
  italic: false,
  underline: false,
  strikethrough: false,
  textColor: "#FFFFFF",
  textOpacity: 100,
  bgColor: "#14151c",
  outlineColor: "#e11d2e",
  outlineWidth: 0,
  shadowEnabled: false,
  shadowX: 3,
  shadowY: 3,
  shadowBlur: 6,
  shadowColor: "#000000",
  glowEnabled: false,
  glowColor: "#e11d2e",
  glowBlur: 20,
  glowSpread: 10,
  letterSpacing: 0,
  lineHeight: 1.5,
  alignment: "center",
  textTransform: "none",
};

const MAX_HISTORY = 20;

export default function TextEditor() {
  const [state, setState] = useState<EditorState>(DEFAULT_STATE);
  const [history, setHistory] = useState<EditorState[]>([DEFAULT_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSizeInput, setFontSizeInput] = useState("24");

  const previewRef = useRef<HTMLDivElement>(null);

  // Push to undo history when state changes (but not from undo/redo itself)
  const pushHistory = useCallback(
    (newState: EditorState) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, newState].slice(-MAX_HISTORY);
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex],
  );

  const set = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      pushHistory(next);
      return next;
    });
    if (key === "fontSize") setFontSizeInput(String(value));
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const restored = history[newIndex];
    setState(restored);
    setFontSizeInput(String(restored.fontSize));
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const restored = history[newIndex];
    setState(restored);
    setFontSizeInput(String(restored.fontSize));
  };

  const reset = () => {
    setState(DEFAULT_STATE);
    setHistory([DEFAULT_STATE]);
    setHistoryIndex(0);
    setFontSizeInput("24");
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const wordCount = state.text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = state.text.length;

  const textDecoration =
    [
      state.underline ? "underline" : "",
      state.strikethrough ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ") || "none";

  const shadowVal = state.shadowEnabled
    ? `${state.shadowX}px ${state.shadowY}px ${state.shadowBlur}px ${state.shadowColor}`
    : undefined;

  const glowVal = state.glowEnabled
    ? `0 0 ${state.glowBlur}px ${state.glowColor}, 0 0 ${state.glowBlur + state.glowSpread}px ${state.glowColor}88`
    : undefined;

  const computedTextShadow =
    [shadowVal, glowVal].filter(Boolean).join(", ") || undefined;

  const hexToRgba = useCallback((hex: string, opacity: number) => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity / 100})`;
  }, []);

  const textStyle: React.CSSProperties = {
    fontFamily: state.fontFamily,
    fontSize: `${state.fontSize}px`,
    fontWeight: state.fontWeight,
    fontStyle: state.italic ? "italic" : "normal",
    textDecoration,
    color: hexToRgba(state.textColor, state.textOpacity),
    textAlign: state.alignment,
    textTransform: state.textTransform,
    letterSpacing: `${state.letterSpacing}px`,
    lineHeight: state.lineHeight,
    textShadow: computedTextShadow,
    WebkitTextStroke:
      state.outlineWidth > 0
        ? `${state.outlineWidth}px ${state.outlineColor}`
        : undefined,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  const downloadPNG = useCallback(async () => {
    const lines = state.text.split("\n");
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = 800 * scale;
    const estimatedHeight = Math.max(
      200,
      lines.length * state.fontSize * state.lineHeight * 1.4 + 80,
    );
    canvas.height = estimatedHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, 800, estimatedHeight);

    const weightStr =
      state.fontWeight >= 700
        ? "bold"
        : state.fontWeight <= 300
          ? "300"
          : "normal";
    ctx.font = `${state.italic ? "italic " : ""}${weightStr} ${state.fontSize}px ${state.fontFamily}`;
    ctx.fillStyle = hexToRgba(state.textColor, state.textOpacity);
    ctx.globalAlpha = 1;

    if (state.shadowEnabled) {
      ctx.shadowColor = state.shadowColor;
      ctx.shadowOffsetX = state.shadowX;
      ctx.shadowOffsetY = state.shadowY;
      ctx.shadowBlur = state.shadowBlur;
    }
    if (state.glowEnabled) {
      ctx.shadowColor = state.glowColor;
      ctx.shadowBlur = state.glowBlur + state.glowSpread;
    }

    ctx.textAlign =
      state.alignment === "justify"
        ? "left"
        : (state.alignment as CanvasTextAlign);
    const xPos =
      state.alignment === "center"
        ? 400
        : state.alignment === "right"
          ? 760
          : 40;
    let yPos = 40 + state.fontSize;
    const lineSpacing = state.fontSize * state.lineHeight;

    for (const line of lines) {
      const displayLine =
        state.textTransform === "uppercase"
          ? line.toUpperCase()
          : state.textTransform === "lowercase"
            ? line.toLowerCase()
            : state.textTransform === "capitalize"
              ? line.replace(/\b\w/g, (c) => c.toUpperCase())
              : line;
      ctx.fillText(displayLine, xPos, yPos);
      yPos += lineSpacing;
    }

    const link = document.createElement("a");
    link.download = "fstudiox-text.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [state, hexToRgba]);

  const downloadTXT = useCallback(() => {
    const blob = new Blob([state.text], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = "fstudiox-text.txt";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [state.text]);

  // ── Sub-components ──────────────────────────────────────────────────────────

  const ToggleBtn = ({
    active,
    onClick,
    children,
    label,
    small,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label?: string;
    small?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`${small ? "h-7 px-2 text-[11px]" : "h-9 px-2.5 text-xs"} min-w-[36px] rounded flex items-center justify-center gap-1 font-medium transition-all`}
      style={{
        backgroundColor: active
          ? "rgba(225,29,46,0.18)"
          : "var(--fsx-bg-elevated)",
        color: active ? "var(--fsx-accent)" : "var(--fsx-text-secondary)",
        border: active
          ? "1px solid rgba(225,29,46,0.4)"
          : "1px solid var(--fsx-border)",
      }}
    >
      {children}
    </button>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div
      className="text-[10px] font-semibold uppercase tracking-widest px-4 pt-3.5 pb-1"
      style={{ color: "var(--fsx-accent)" }}
    >
      {children}
    </div>
  );

  const SliderRow = ({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    unit = "",
    decimals = 0,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (v: number) => void;
    unit?: string;
    decimals?: number;
  }) => (
    <div className="flex items-center gap-3 px-4 py-1.5">
      <span
        className="text-xs w-24 shrink-0"
        style={{ color: "var(--fsx-text-muted)" }}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full cursor-pointer"
        style={{ accentColor: "var(--fsx-accent)" }}
      />
      <span
        className="text-xs font-mono w-14 text-right shrink-0"
        style={{ color: "var(--fsx-text-secondary)" }}
      >
        {value.toFixed(decimals)}
        {unit}
      </span>
    </div>
  );

  const ColorRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex items-center gap-3 px-4 py-2">
      <span
        className="text-xs w-24 shrink-0"
        style={{ color: "var(--fsx-text-muted)" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border cursor-pointer overflow-hidden"
          style={{ borderColor: "var(--fsx-border)" }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent"
          />
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: "var(--fsx-text-secondary)" }}
        >
          {value.toUpperCase()}
        </span>
      </div>
    </div>
  );

  const Toggle = ({
    label,
    value,
    ocid,
    onChange,
  }: {
    label: string;
    value: boolean;
    ocid?: string;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center gap-3 px-4 py-2">
      <span
        className="text-xs w-24 shrink-0"
        style={{ color: "var(--fsx-text-muted)" }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        data-ocid={ocid}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{
          backgroundColor: value
            ? "var(--fsx-accent)"
            : "var(--fsx-bg-elevated)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            left: value ? "calc(100% - 18px)" : "2px",
            backgroundColor: "#fff",
          }}
        />
      </button>
    </div>
  );

  const Divider = () => (
    <div
      className="mx-4 my-1 h-px"
      style={{ backgroundColor: "var(--fsx-border)" }}
    />
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      data-ocid="text_editor.panel"
      className={`flex flex-col overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : "h-full"}`}
      style={{ backgroundColor: "var(--fsx-bg-primary)" }}
    >
      {/* ── TOP 50%: PREVIEW ── */}
      <div
        className={`relative flex flex-col overflow-hidden border-b ${isFullscreen ? "flex-1" : "h-1/2"}`}
        style={{
          borderColor: "var(--fsx-border)",
          backgroundColor: state.bgColor,
        }}
      >
        {/* Labels row */}
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between z-10">
          <div
            className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              color: "var(--fsx-text-muted)",
              backgroundColor: "rgba(11,11,15,0.65)",
            }}
          >
            Preview
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex gap-2 text-[10px] px-2 py-0.5 rounded"
              style={{
                color: "var(--fsx-text-muted)",
                backgroundColor: "rgba(11,11,15,0.65)",
              }}
            >
              <span data-ocid="text_editor.word_count">{wordCount}w</span>
              <span data-ocid="text_editor.char_count">{charCount}ch</span>
            </div>
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={undo}
              disabled={historyIndex <= 0}
              data-ocid="text_editor.undo.btn"
              aria-label="Undo"
              className="w-7 h-7 flex items-center justify-center rounded transition-all disabled:opacity-30"
              style={{
                backgroundColor: "rgba(11,11,15,0.65)",
                color: "var(--fsx-text-secondary)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <Undo2 size={12} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              data-ocid="text_editor.redo.btn"
              aria-label="Redo"
              className="w-7 h-7 flex items-center justify-center rounded transition-all disabled:opacity-30"
              style={{
                backgroundColor: "rgba(11,11,15,0.65)",
                color: "var(--fsx-text-secondary)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <Redo2 size={12} />
            </button>
            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              data-ocid="text_editor.fullscreen.btn"
              aria-label={
                isFullscreen ? "Exit fullscreen" : "Fullscreen preview"
              }
              className="w-7 h-7 flex items-center justify-center rounded transition-all"
              style={{
                backgroundColor: "rgba(11,11,15,0.65)",
                color: "var(--fsx-text-secondary)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>
        </div>

        {/* Rendered text */}
        <div
          ref={previewRef}
          data-ocid="text_editor.preview"
          className="flex-1 flex items-center justify-center overflow-auto p-8 pt-10"
        >
          <div className="max-w-full w-full" style={textStyle}>
            {state.text || (
              <span style={{ opacity: 0.3 }}>
                Your styled text will appear here...
              </span>
            )}
          </div>
        </div>

        {/* Close fullscreen overlay hint */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: "rgba(11,11,15,0.7)",
              color: "var(--fsx-text-muted)",
              border: "1px solid var(--fsx-border)",
            }}
          >
            <Minimize2 size={11} />
            Exit Fullscreen
          </button>
        )}
      </div>

      {/* ── BOTTOM 50%: CONTROLS ── */}
      {!isFullscreen && (
        <div
          className="h-1/2 overflow-y-auto"
          style={{ backgroundColor: "var(--fsx-bg-primary)" }}
        >
          {/* ── FONT ── */}
          <SectionLabel>Font</SectionLabel>

          {/* Font family */}
          <div className="flex items-center gap-3 px-4 py-2">
            <span
              className="text-xs w-24 shrink-0"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              Family
            </span>
            <select
              data-ocid="text_editor.font_family.select"
              value={state.fontFamily}
              onChange={(e) => set("fontFamily", e.target.value)}
              className="flex-1 text-xs rounded px-2 py-1.5 border outline-none"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                borderColor: "var(--fsx-border)",
                color: "var(--fsx-text-secondary)",
              }}
            >
              {FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Font size with slider + numeric input */}
          <div className="flex items-center gap-3 px-4 py-1.5">
            <span
              className="text-xs w-24 shrink-0"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              Size
            </span>
            <input
              type="range"
              min={8}
              max={256}
              step={1}
              value={state.fontSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                set("fontSize", v);
                setFontSizeInput(String(v));
              }}
              className="flex-1 h-1.5 rounded-full cursor-pointer"
              style={{ accentColor: "var(--fsx-accent)" }}
            />
            <input
              type="number"
              min={8}
              max={256}
              value={fontSizeInput}
              onChange={(e) => setFontSizeInput(e.target.value)}
              onBlur={() => {
                const v = Math.max(
                  8,
                  Math.min(256, Number(fontSizeInput) || 24),
                );
                set("fontSize", v);
                setFontSizeInput(String(v));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = Math.max(
                    8,
                    Math.min(256, Number(fontSizeInput) || 24),
                  );
                  set("fontSize", v);
                  setFontSizeInput(String(v));
                }
              }}
              data-ocid="text_editor.font_size.input"
              className="text-xs font-mono w-14 text-right rounded px-1.5 py-1 border outline-none shrink-0"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                borderColor: "var(--fsx-border)",
                color: "var(--fsx-text-secondary)",
              }}
            />
            <span
              className="text-xs shrink-0"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              px
            </span>
          </div>

          {/* Font weight */}
          <div className="flex items-center gap-2 px-4 py-2">
            <span
              className="text-xs w-24 shrink-0"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              Weight
            </span>
            <div className="flex flex-wrap gap-1.5">
              {FONT_WEIGHTS.map(({ label, value }) => (
                <ToggleBtn
                  key={value}
                  small
                  active={state.fontWeight === value}
                  onClick={() => set("fontWeight", value)}
                  label={`${label} (${value})`}
                >
                  {label}
                </ToggleBtn>
              ))}
            </div>
          </div>

          <Divider />

          {/* ── SIZE & STYLE ── */}
          <SectionLabel>Style</SectionLabel>

          {/* Style toggles: italic, underline, strikethrough */}
          <div className="flex flex-wrap gap-2 px-4 py-2">
            <ToggleBtn
              active={state.italic}
              onClick={() => set("italic", !state.italic)}
              label="Italic"
            >
              <span className="italic text-sm font-serif">I</span>
            </ToggleBtn>
            <ToggleBtn
              active={state.underline}
              onClick={() => set("underline", !state.underline)}
              label="Underline"
            >
              <span className="underline text-sm">U</span>
            </ToggleBtn>
            <ToggleBtn
              active={state.strikethrough}
              onClick={() => set("strikethrough", !state.strikethrough)}
              label="Strikethrough"
            >
              <span className="line-through text-sm">S</span>
            </ToggleBtn>

            <div
              className="w-px h-9 mx-1"
              style={{ backgroundColor: "var(--fsx-border)" }}
            />

            {/* Alignment */}
            <ToggleBtn
              active={state.alignment === "left"}
              onClick={() => set("alignment", "left")}
              label="Align Left"
            >
              <AlignLeft size={14} />
            </ToggleBtn>
            <ToggleBtn
              active={state.alignment === "center"}
              onClick={() => set("alignment", "center")}
              label="Align Center"
            >
              <AlignCenter size={14} />
            </ToggleBtn>
            <ToggleBtn
              active={state.alignment === "right"}
              onClick={() => set("alignment", "right")}
              label="Align Right"
            >
              <AlignRight size={14} />
            </ToggleBtn>
            <ToggleBtn
              active={state.alignment === "justify"}
              onClick={() => set("alignment", "justify")}
              label="Justify"
            >
              <AlignJustify size={14} />
            </ToggleBtn>
          </div>

          {/* Text Transform */}
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {(
              [
                "none",
                "uppercase",
                "lowercase",
                "capitalize",
              ] as TextTransform[]
            ).map((t) => (
              <ToggleBtn
                key={t}
                small
                active={state.textTransform === t}
                onClick={() => set("textTransform", t)}
              >
                {t === "none"
                  ? "Aa"
                  : t === "uppercase"
                    ? "AA"
                    : t === "lowercase"
                      ? "aa"
                      : "Aa+"}
              </ToggleBtn>
            ))}
          </div>

          {/* Spacing sliders */}
          <SliderRow
            label="Letter Spacing"
            value={state.letterSpacing}
            min={-5}
            max={50}
            onChange={(v) => set("letterSpacing", v)}
            unit="px"
          />
          <SliderRow
            label="Line Height"
            value={state.lineHeight}
            min={0.5}
            max={5.0}
            step={0.1}
            onChange={(v) => set("lineHeight", v)}
            decimals={1}
          />

          <Divider />

          {/* ── COLOR ── */}
          <SectionLabel>Color</SectionLabel>
          <ColorRow
            label="Text Color"
            value={state.textColor}
            onChange={(v) => set("textColor", v)}
          />
          <SliderRow
            label="Text Opacity"
            value={state.textOpacity}
            min={0}
            max={100}
            onChange={(v) => set("textOpacity", v)}
            unit="%"
          />
          <ColorRow
            label="Background"
            value={state.bgColor}
            onChange={(v) => set("bgColor", v)}
          />

          <Divider />

          {/* ── EFFECTS ── */}
          <SectionLabel>Effects</SectionLabel>

          {/* Outline */}
          <ColorRow
            label="Outline Color"
            value={state.outlineColor}
            onChange={(v) => set("outlineColor", v)}
          />
          <SliderRow
            label="Outline Width"
            value={state.outlineWidth}
            min={0}
            max={20}
            onChange={(v) => set("outlineWidth", v)}
            unit="px"
          />

          <Divider />

          {/* Shadow */}
          <Toggle
            label="Text Shadow"
            value={state.shadowEnabled}
            ocid="text_editor.shadow.toggle"
            onChange={(v) => set("shadowEnabled", v)}
          />
          {state.shadowEnabled && (
            <>
              <SliderRow
                label="Shadow X"
                value={state.shadowX}
                min={-20}
                max={20}
                onChange={(v) => set("shadowX", v)}
                unit="px"
              />
              <SliderRow
                label="Shadow Y"
                value={state.shadowY}
                min={-20}
                max={20}
                onChange={(v) => set("shadowY", v)}
                unit="px"
              />
              <SliderRow
                label="Shadow Blur"
                value={state.shadowBlur}
                min={0}
                max={60}
                onChange={(v) => set("shadowBlur", v)}
                unit="px"
              />
              <ColorRow
                label="Shadow Color"
                value={state.shadowColor}
                onChange={(v) => set("shadowColor", v)}
              />
            </>
          )}

          <Divider />

          {/* Glow */}
          <Toggle
            label="Glow Effect"
            value={state.glowEnabled}
            ocid="text_editor.glow.toggle"
            onChange={(v) => set("glowEnabled", v)}
          />
          {state.glowEnabled && (
            <>
              <ColorRow
                label="Glow Color"
                value={state.glowColor}
                onChange={(v) => set("glowColor", v)}
              />
              <SliderRow
                label="Glow Blur"
                value={state.glowBlur}
                min={0}
                max={80}
                onChange={(v) => set("glowBlur", v)}
                unit="px"
              />
              <SliderRow
                label="Glow Spread"
                value={state.glowSpread}
                min={0}
                max={60}
                onChange={(v) => set("glowSpread", v)}
                unit="px"
              />
            </>
          )}

          <Divider />

          {/* ── TEXT INPUT ── */}
          <SectionLabel>Text Input</SectionLabel>
          <div className="px-4 pb-2">
            <textarea
              data-ocid="text_editor.content.textarea"
              value={state.text}
              onChange={(e) => set("text", e.target.value)}
              placeholder="Type your text here..."
              rows={4}
              className="w-full text-sm rounded-lg px-3 py-2.5 outline-none resize-none leading-relaxed"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                border: "1px solid var(--fsx-border)",
                color: "var(--fsx-text-primary)",
              }}
            />
          </div>

          <Divider />

          {/* ── EXPORT ── */}
          <SectionLabel>Export</SectionLabel>
          <div className="flex flex-wrap gap-2 px-4 py-3 pb-6">
            <button
              type="button"
              onClick={downloadPNG}
              data-ocid="text_editor.download_png.btn"
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all fsx-btn-primary"
            >
              <Download size={13} />
              Export PNG
            </button>
            <button
              type="button"
              onClick={downloadTXT}
              data-ocid="text_editor.download_txt.btn"
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                color: "var(--fsx-text-secondary)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <Download size={13} />
              Export TXT
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={historyIndex <= 0}
              aria-label="Undo"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-40"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                color: "var(--fsx-text-muted)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <Undo2 size={13} />
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              aria-label="Redo"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-40"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                color: "var(--fsx-text-muted)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <Redo2 size={13} />
              Redo
            </button>
            <button
              type="button"
              onClick={reset}
              data-ocid="text_editor.reset.btn"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all ml-auto"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                color: "var(--fsx-text-muted)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <RefreshCw size={13} />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
