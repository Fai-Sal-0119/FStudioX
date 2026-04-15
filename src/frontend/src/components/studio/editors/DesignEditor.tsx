import {
  Download,
  Grid3X3,
  Magnet,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer,
  Plus,
  Redo2,
  Sparkles,
  Square,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AIAssistPanel from "./designEditor/AIAssistPanel";
import LayersPanel from "./designEditor/LayersPanel";
import PropertiesPanel from "./designEditor/PropertiesPanel";
import { exportSVG, renderCanvas } from "./designEditor/renderer";
import type {
  CanvasShape,
  CanvasSizePreset,
  TemplateName,
  ToolType,
} from "./designEditor/types";
import {
  DEFAULT_SHAPES,
  GRID_SIZE,
  SIZE_PRESETS,
  TEMPLATES,
  generateId,
  shapeName,
} from "./designEditor/types";

// ─── Tool palette ─────────────────────────────────────────────────────────────

const toolDefs: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <MousePointer size={14} /> },
  { id: "rect", label: "Rect", icon: <Square size={14} /> },
  {
    id: "circle",
    label: "Circle",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  { id: "line", label: "Line", icon: <Minus size={14} /> },
  { id: "text", label: "Text", icon: <Type size={14} /> },
  {
    id: "triangle",
    label: "Tri",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path d="M7 2L13 12H1L7 2Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "star",
    label: "Star",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 1l1.6 3.26 3.6.52-2.6 2.54.61 3.58L7 9.1l-3.21 1.8.61-3.58L1.8 4.78l3.6-.52L7 1z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    id: "hexagon",
    label: "Hex",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <polygon
          points="7,1 12.2,4 12.2,10 7,13 1.8,10 1.8,4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "arrow",
    label: "Arrow",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 7h8M8 4l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const MOBILE_TABS = ["Tools", "Layers", "Properties", "AI"] as const;
type MobileTab = (typeof MOBILE_TABS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DesignEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [shapes, setShapes] = useState<CanvasShape[]>(DEFAULT_SHAPES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#191B24");
  const [sizePreset, setSizePreset] = useState<CanvasSizePreset>("custom");
  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(600);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Shape property controls
  const [fillColor, setFillColor] = useState("#E11D2E");
  const [strokeColor, setStrokeColor] = useState("#FFFFFF");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(24);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // History
  const [history, setHistory] = useState<CanvasShape[][]>([DEFAULT_SHAPES]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // UI state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("Tools");

  const selectedShape = shapes.find((s) => s.id === selectedId);

  // ── Sync property controls to selected shape ──────────────────────────────
  useEffect(() => {
    if (!selectedShape) return;
    setFillColor(
      selectedShape.fill === "transparent" ? "#000000" : selectedShape.fill,
    );
    setStrokeColor(
      selectedShape.stroke === "transparent" ? "#000000" : selectedShape.stroke,
    );
    setStrokeWidth(selectedShape.strokeWidth);
    setOpacity(Math.round(selectedShape.opacity * 100));
    setRotation(selectedShape.rotation);
    if (selectedShape.fontFamily) setFontFamily(selectedShape.fontFamily);
    if (selectedShape.fontSize) setFontSize(selectedShape.fontSize);
    setBold(selectedShape.bold ?? false);
    setItalic(selectedShape.italic ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShape]);

  // ── History ───────────────────────────────────────────────────────────────
  const pushHistory = useCallback(
    (next: CanvasShape[]) => {
      setHistory((h) => [...h.slice(0, historyIdx + 1), next].slice(-20));
      setHistoryIdx((i) => Math.min(i + 1, 19));
    },
    [historyIdx],
  );

  const undo = () => {
    if (historyIdx <= 0) return;
    setShapes(history[historyIdx - 1]);
    setHistoryIdx((i) => i - 1);
    setSelectedId(null);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    setShapes(history[historyIdx + 1]);
    setHistoryIdx((i) => i + 1);
    setSelectedId(null);
  };

  const commit = useCallback(
    (next: CanvasShape[]) => {
      setShapes(next);
      pushHistory(next);
    },
    [pushHistory],
  );

  // ── Canvas render ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(
      canvas,
      shapes,
      selectedId,
      bgColor,
      canvasW,
      canvasH,
      showGrid,
      zoom,
    );
  }, [shapes, selectedId, bgColor, canvasW, canvasH, showGrid, zoom]);

  // ── Zoom controls ─────────────────────────────────────────────────────────
  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const fitToScreen = () => setZoom(1);

  // ── Canvas coords ─────────────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const snap = (v: number) =>
    snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    if (activeTool === "select") {
      const hit = [...shapes]
        .reverse()
        .find(
          (s) =>
            s.visible &&
            !s.locked &&
            pos.x >= s.x &&
            pos.x <= s.x + s.width &&
            pos.y >= s.y &&
            pos.y <= s.y + s.height,
        );
      setSelectedId(hit?.id ?? null);
      return;
    }
    if (activeTool === "text") {
      setTextPos({ x: snap(pos.x), y: snap(pos.y) });
      setShowTextInput(true);
      return;
    }
    setIsDrawing(true);
    setDrawStart({ x: snap(pos.x), y: snap(pos.y) });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const raw = getCanvasPos(e);
    const pos = { x: snap(raw.x), y: snap(raw.y) };
    const dx = pos.x - drawStart.x;
    const dy = pos.y - drawStart.y;
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    const type = activeTool as CanvasShape["type"];
    const newShape: CanvasShape = {
      id: generateId(),
      type,
      name: shapeName(type),
      x: type === "line" ? drawStart.x : Math.min(drawStart.x, pos.x),
      y: type === "line" ? drawStart.y : Math.min(drawStart.y, pos.y),
      width: type === "line" ? dx : Math.abs(dx),
      height: type === "line" ? dy : Math.abs(dy),
      rotation: 0,
      fill: type === "line" ? "transparent" : fillColor,
      stroke: strokeColor,
      strokeWidth,
      opacity: opacity / 100,
      visible: true,
      locked: false,
    };
    const next = [...shapes, newShape];
    commit(next);
    setSelectedId(newShape.id);
  };

  const addText = () => {
    if (!textInput.trim()) return;
    const newShape: CanvasShape = {
      id: generateId(),
      type: "text",
      name: shapeName("text"),
      x: textPos.x,
      y: textPos.y,
      width: 300,
      height: fontSize + 8,
      rotation: 0,
      fill: "transparent",
      stroke: fillColor,
      strokeWidth: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text: textInput,
      fontSize,
      fontFamily,
      bold,
      italic,
    };
    commit([...shapes, newShape]);
    setSelectedId(newShape.id);
    setTextInput("");
    setShowTextInput(false);
  };

  // ── Shape mutations ───────────────────────────────────────────────────────
  const updateSelected = (patch: Partial<CanvasShape>) => {
    if (!selectedId) return;
    commit(shapes.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    commit(shapes.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedShape) return;
    const copy: CanvasShape = {
      ...selectedShape,
      id: generateId(),
      name: `${selectedShape.name} copy`,
      x: selectedShape.x + 20,
      y: selectedShape.y + 20,
    };
    commit([...shapes, copy]);
    setSelectedId(copy.id);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const s = shapes.find((x) => x.id === selectedId)!;
    commit([...shapes.filter((x) => x.id !== selectedId), s]);
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const s = shapes.find((x) => x.id === selectedId)!;
    commit([s, ...shapes.filter((x) => x.id !== selectedId)]);
  };

  const moveLayer = (dir: "up" | "down") => {
    if (!selectedId) return;
    const arr = [...shapes];
    const idx = arr.findIndex((s) => s.id === selectedId);
    if (dir === "up" && idx < arr.length - 1)
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    if (dir === "down" && idx > 0)
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
    commit(arr);
  };

  const toggleVisibility = (id: string) =>
    commit(
      shapes.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    );
  const toggleLock = (id: string) =>
    commit(shapes.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)));
  const deleteLayer = (id: string) => {
    commit(shapes.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const alignShape = (
    axis:
      | "left"
      | "center"
      | "right"
      | "top"
      | "middle"
      | "bottom"
      | "dist-h"
      | "dist-v",
  ) => {
    if (!selectedShape) return;
    let patch: Partial<CanvasShape> = {};
    if (axis === "left") patch = { x: 0 };
    else if (axis === "center")
      patch = { x: (canvasW - selectedShape.width) / 2 };
    else if (axis === "right") patch = { x: canvasW - selectedShape.width };
    else if (axis === "top") patch = { y: 0 };
    else if (axis === "middle")
      patch = { y: (canvasH - selectedShape.height) / 2 };
    else if (axis === "bottom") patch = { y: canvasH - selectedShape.height };
    else if (axis === "dist-h")
      patch = { x: (canvasW - selectedShape.width) / 2 };
    else if (axis === "dist-v")
      patch = { y: (canvasH - selectedShape.height) / 2 };
    updateSelected(patch);
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "fstudiox-design.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadSvg = () => {
    const svg = exportSVG(shapes, bgColor, canvasW, canvasH);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "fstudiox-design.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Template apply ────────────────────────────────────────────────────────
  const applyTemplate = (t: TemplateName) => {
    const tmpl = TEMPLATES[t];
    setBgColor(tmpl.bg);
    setCanvasW(tmpl.w);
    setCanvasH(tmpl.h);
    const shaped: CanvasShape[] = tmpl.shapes.map((s) => ({
      ...s,
      id: generateId(),
    }));
    commit(shaped);
    setSelectedId(null);
  };

  // ── Canvas size preset ────────────────────────────────────────────────────
  const applyPreset = (preset: CanvasSizePreset) => {
    setSizePreset(preset);
    if (preset !== "custom") {
      setCanvasW(SIZE_PRESETS[preset].w);
      setCanvasH(SIZE_PRESETS[preset].h);
    }
  };

  // ── AI Assist handlers ────────────────────────────────────────────────────
  const handleAIPalette = (bg: string, shapeFill: string) => {
    setBgColor(bg);
    const firstUnlocked = shapes.find((s) => !s.locked && s.type !== "text");
    if (firstUnlocked) {
      commit(
        shapes.map((s) =>
          s.id === firstUnlocked.id ? { ...s, fill: shapeFill } : s,
        ),
      );
    }
  };

  const handleAIAddText = (text: string) => {
    const cx = canvasW / 2 - 200;
    const cy = canvasH / 2 - 20;
    const newShape: CanvasShape = {
      id: generateId(),
      type: "text",
      name: shapeName("text"),
      x: cx,
      y: cy,
      width: 400,
      height: 48,
      rotation: 0,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text,
      fontSize: 36,
      fontFamily,
      bold: true,
      italic: false,
    };
    commit([...shapes, newShape]);
    setSelectedId(newShape.id);
  };

  const handleAILoadLogo = (logoShapes: CanvasShape[]) => {
    commit([...shapes, ...logoShapes]);
    setSelectedId(null);
  };

  // ── Text position in display coords ──────────────────────────────────────
  const textDisplayX = textPos.x * zoom;
  const textDisplayY = textPos.y * zoom;

  return (
    <div
      data-ocid="design_editor.panel"
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--fsx-bg-primary)" }}
    >
      {/* ── Top 50%: Canvas preview ──────────────────────────────────────── */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          height: isFullscreen ? "100%" : "50%",
          backgroundColor: "#090a10",
          borderBottom: "2px solid var(--fsx-border)",
          transition: "height 0.25s ease",
        }}
      >
        {/* Top bar left */}
        <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            data-ocid="design_editor.undo.button"
            onClick={undo}
            disabled={historyIdx <= 0}
            title="Undo (Ctrl+Z)"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all disabled:opacity-30"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              color: "var(--fsx-text-secondary)",
            }}
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            data-ocid="design_editor.redo.button"
            onClick={redo}
            disabled={historyIdx >= history.length - 1}
            title="Redo"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all disabled:opacity-30"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              color: "var(--fsx-text-secondary)",
            }}
          >
            <Redo2 size={13} />
          </button>
          <button
            type="button"
            data-ocid="design_editor.grid.toggle"
            onClick={() => setShowGrid((g) => !g)}
            title="Toggle Grid"
            aria-pressed={showGrid}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
            style={{
              backgroundColor: showGrid
                ? "rgba(225,29,46,0.18)"
                : "var(--fsx-bg-elevated)",
              border: showGrid ? "1px solid rgba(225,29,46,0.4)" : "none",
              color: showGrid
                ? "var(--fsx-accent)"
                : "var(--fsx-text-secondary)",
            }}
          >
            <Grid3X3 size={13} />
          </button>
          <button
            type="button"
            data-ocid="design_editor.snap.toggle"
            onClick={() => setSnapToGrid((s) => !s)}
            title="Snap to Grid"
            aria-pressed={snapToGrid}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
            style={{
              backgroundColor: snapToGrid
                ? "rgba(225,29,46,0.18)"
                : "var(--fsx-bg-elevated)",
              border: snapToGrid ? "1px solid rgba(225,29,46,0.4)" : "none",
              color: snapToGrid
                ? "var(--fsx-accent)"
                : "var(--fsx-text-secondary)",
            }}
          >
            <Magnet size={13} />
          </button>
        </div>

        {/* Top bar right */}
        <div className="absolute top-2 right-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            data-ocid="design_editor.zoom_out.button"
            onClick={zoomOut}
            title="Zoom Out"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              color: "var(--fsx-text-secondary)",
            }}
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            data-ocid="design_editor.fit.button"
            onClick={fitToScreen}
            title="Fit to Screen"
            className="px-2 h-7 rounded-md text-xs font-mono transition-all min-w-[3.5rem] text-center"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              color: "var(--fsx-text-secondary)",
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            data-ocid="design_editor.zoom_in.button"
            onClick={zoomIn}
            title="Zoom In"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              color: "var(--fsx-text-secondary)",
            }}
          >
            <ZoomIn size={13} />
          </button>
          <div
            style={{
              width: "1px",
              height: "20px",
              backgroundColor: "var(--fsx-border)",
            }}
          />
          <button
            type="button"
            data-ocid="design_editor.ai_assist.button"
            onClick={() => setShowAIPanel((v) => !v)}
            title="AI Assist"
            className="flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium transition-all"
            style={{
              backgroundColor: showAIPanel
                ? "rgba(225,29,46,0.2)"
                : "var(--fsx-bg-elevated)",
              border: `1px solid ${showAIPanel ? "rgba(225,29,46,0.4)" : "var(--fsx-border)"}`,
              color: showAIPanel
                ? "var(--fsx-accent)"
                : "var(--fsx-text-secondary)",
            }}
          >
            <Sparkles size={12} /> AI
          </button>
          <div
            style={{
              width: "1px",
              height: "20px",
              backgroundColor: "var(--fsx-border)",
            }}
          />
          <button
            type="button"
            data-ocid="design_editor.download_svg.button"
            onClick={downloadSvg}
            title="Export SVG"
            className="flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium transition-all"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              border: "1px solid var(--fsx-border)",
              color: "var(--fsx-text-secondary)",
            }}
          >
            <Download size={12} /> SVG
          </button>
          <button
            type="button"
            data-ocid="design_editor.download.button"
            onClick={downloadPng}
            title="Export PNG"
            className="flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium transition-all"
            style={{ backgroundColor: "var(--fsx-accent)", color: "white" }}
          >
            <Download size={12} /> PNG
          </button>
          <button
            type="button"
            data-ocid="design_editor.fullscreen.button"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              color: "var(--fsx-text-secondary)",
            }}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>

        {/* Canvas */}
        <div
          className="relative overflow-auto"
          style={{
            maxWidth: "calc(100% - 16px)",
            maxHeight: "calc(100% - 52px)",
          }}
        >
          {showTextInput && (
            <div
              className="absolute z-20 flex gap-1"
              style={{ left: textDisplayX, top: textDisplayY }}
            >
              <input
                data-ocid="design_editor.text.input"
                ref={(el) => el?.focus()}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addText();
                  if (e.key === "Escape") setShowTextInput(false);
                }}
                className="px-2 py-1 text-xs rounded outline-none"
                style={{
                  backgroundColor: "var(--fsx-bg-surface)",
                  border: "1px solid var(--fsx-accent)",
                  color: "white",
                  minWidth: "140px",
                }}
                placeholder="Type and press Enter…"
              />
              <button
                type="button"
                data-ocid="design_editor.text.submit_button"
                onClick={addText}
                className="px-2 py-1 text-xs rounded font-medium text-white"
                style={{ backgroundColor: "var(--fsx-accent)" }}
              >
                Add
              </button>
            </div>
          )}
          <canvas
            data-ocid="design_editor.canvas_target"
            ref={canvasRef}
            width={canvasW * zoom}
            height={canvasH * zoom}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            style={{
              cursor: activeTool === "select" ? "default" : "crosshair",
              border: "1px solid var(--fsx-border)",
              borderRadius: "6px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              display: "block",
            }}
          />
        </div>

        {/* Canvas size label */}
        <div
          className="absolute bottom-2 left-3 text-xs font-mono"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          {canvasW}×{canvasH} · {SIZE_PRESETS[sizePreset].label}
        </div>
      </div>

      {/* ── Bottom 50%: Controls ─────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className="flex-1 flex overflow-hidden" style={{ height: "50%" }}>
          {/* Main controls column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile tab switcher */}
            <div
              className="flex md:hidden border-b sticky top-0 z-10 shrink-0"
              style={{
                backgroundColor: "var(--fsx-bg-surface)",
                borderColor: "var(--fsx-border)",
              }}
            >
              {MOBILE_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  data-ocid={`design_editor.tab.${tab.toLowerCase()}`}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 text-xs font-medium transition-all"
                  style={{
                    color:
                      activeTab === tab
                        ? "var(--fsx-accent)"
                        : "var(--fsx-text-secondary)",
                    borderBottom:
                      activeTab === tab
                        ? "2px solid var(--fsx-accent)"
                        : "2px solid transparent",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* ─── Tool palette ─ */}
              <div
                className={`${activeTab !== "Tools" ? "hidden md:flex" : "flex"} sticky top-0 z-10 px-3 py-2 flex-wrap gap-1.5`}
                style={{
                  backgroundColor: "var(--fsx-bg-surface)",
                  borderBottom: "1px solid var(--fsx-border)",
                }}
              >
                {toolDefs.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    data-ocid={`design_editor.tool.${id}`}
                    title={label}
                    onClick={() => setActiveTool(id)}
                    className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        activeTool === id
                          ? "rgba(225,29,46,0.18)"
                          : "var(--fsx-bg-elevated)",
                      color:
                        activeTool === id
                          ? "var(--fsx-accent)"
                          : "var(--fsx-text-secondary)",
                      border:
                        activeTool === id
                          ? "1px solid rgba(225,29,46,0.4)"
                          : "1px solid var(--fsx-border)",
                    }}
                  >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
                <div
                  style={{
                    width: "1px",
                    alignSelf: "stretch",
                    backgroundColor: "var(--fsx-border)",
                    margin: "0 4px",
                  }}
                />
                {(
                  [
                    "blank",
                    "social-post",
                    "story",
                    "banner",
                    "poster",
                  ] as TemplateName[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-ocid={`design_editor.template.${t}`}
                    onClick={() => applyTemplate(t)}
                    className="flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: "var(--fsx-bg-elevated)",
                      border: "1px solid var(--fsx-border)",
                      color: "var(--fsx-text-secondary)",
                    }}
                  >
                    {TEMPLATES[t].name}
                  </button>
                ))}
              </div>

              {/* ─── Content panels ─ */}
              <div className="p-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {/* Properties */}
                <div
                  className={
                    activeTab === "Properties" || activeTab === "Tools"
                      ? "block"
                      : "hidden md:block"
                  }
                >
                  <PropertiesPanel
                    selectedShape={selectedShape}
                    fillColor={fillColor}
                    strokeColor={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    rotation={rotation}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    bold={bold}
                    italic={italic}
                    bgColor={bgColor}
                    onFillChange={(v) => {
                      setFillColor(v);
                      updateSelected({ fill: v });
                    }}
                    onStrokeColorChange={(v) => {
                      setStrokeColor(v);
                      updateSelected({ stroke: v });
                    }}
                    onStrokeWidthChange={(v) => {
                      setStrokeWidth(v);
                      updateSelected({ strokeWidth: v });
                    }}
                    onOpacityChange={(v) => {
                      setOpacity(v);
                      updateSelected({ opacity: v / 100 });
                    }}
                    onRotationChange={(v) => {
                      setRotation(v);
                      updateSelected({ rotation: v });
                    }}
                    onFontFamilyChange={(v) => {
                      setFontFamily(v);
                      updateSelected({ fontFamily: v });
                    }}
                    onFontSizeChange={(v) => {
                      setFontSize(v);
                      updateSelected({ fontSize: v });
                    }}
                    onBoldChange={(v) => {
                      setBold(v);
                      updateSelected({ bold: v });
                    }}
                    onItalicChange={(v) => {
                      setItalic(v);
                      updateSelected({ italic: v });
                    }}
                    onBgColorChange={setBgColor}
                    onBringToFront={bringToFront}
                    onSendToBack={sendToBack}
                    onDuplicate={duplicateSelected}
                    onDelete={deleteSelected}
                    onAlign={alignShape}
                  />
                </div>

                {/* Canvas Size */}
                <div
                  className={
                    activeTab === "Tools" ? "block" : "hidden md:block"
                  }
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-widest px-1 pb-2 pt-1 mb-2.5"
                    style={{
                      color: "var(--fsx-text-muted)",
                      borderBottom: "1px solid var(--fsx-border)",
                    }}
                  >
                    Canvas Size
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {(Object.keys(SIZE_PRESETS) as CanvasSizePreset[]).map(
                      (key) => (
                        <button
                          key={key}
                          type="button"
                          data-ocid={`design_editor.preset_${key}.button`}
                          onClick={() => applyPreset(key)}
                          className="px-2 h-8 rounded-lg text-xs transition-all text-left truncate"
                          style={{
                            backgroundColor:
                              sizePreset === key
                                ? "rgba(225,29,46,0.18)"
                                : "var(--fsx-bg-elevated)",
                            border:
                              sizePreset === key
                                ? "1px solid rgba(225,29,46,0.4)"
                                : "1px solid var(--fsx-border)",
                            color:
                              sizePreset === key
                                ? "var(--fsx-accent)"
                                : "var(--fsx-text-secondary)",
                          }}
                        >
                          {SIZE_PRESETS[key].label}
                        </button>
                      ),
                    )}
                  </div>
                  {sizePreset === "custom" && (
                    <div className="flex gap-2">
                      {[
                        { label: "Width", val: canvasW, set: setCanvasW },
                        { label: "Height", val: canvasH, set: setCanvasH },
                      ].map(({ label, val, set }) => (
                        <div key={label} className="flex-1 space-y-1">
                          <span
                            className="text-xs"
                            style={{ color: "var(--fsx-text-secondary)" }}
                          >
                            {label}
                          </span>
                          <input
                            type="number"
                            min={100}
                            max={4000}
                            value={val}
                            onChange={(e) => set(Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg text-xs outline-none"
                            style={{
                              backgroundColor: "var(--fsx-bg-elevated)",
                              border: "1px solid var(--fsx-border)",
                              color: "white",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Zoom quick buttons */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className="text-xs"
                      style={{ color: "var(--fsx-text-secondary)" }}
                    >
                      Zoom:
                    </span>
                    {[0.5, 0.75, 1, 1.5, 2].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZoom(z)}
                        className="px-2 h-6 rounded text-xs transition-all"
                        style={{
                          backgroundColor:
                            zoom === z
                              ? "rgba(225,29,46,0.18)"
                              : "var(--fsx-bg-elevated)",
                          border:
                            zoom === z
                              ? "1px solid rgba(225,29,46,0.4)"
                              : "1px solid var(--fsx-border)",
                          color:
                            zoom === z
                              ? "var(--fsx-accent)"
                              : "var(--fsx-text-secondary)",
                        }}
                      >
                        {Math.round(z * 100)}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={zoomIn}
                      className="w-6 h-6 flex items-center justify-center rounded"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                        color: "var(--fsx-text-secondary)",
                      }}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={zoomOut}
                      className="w-6 h-6 flex items-center justify-center rounded"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                        color: "var(--fsx-text-secondary)",
                      }}
                    >
                      <Minus size={11} />
                    </button>
                  </div>
                </div>

                {/* Layers */}
                <div
                  className={`${activeTab === "Layers" ? "block" : "hidden md:block"} md:col-span-2 xl:col-span-1`}
                >
                  <LayersPanel
                    shapes={shapes}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onToggleVisibility={toggleVisibility}
                    onToggleLock={toggleLock}
                    onDelete={deleteLayer}
                    onMoveLayer={moveLayer}
                    onClearAll={() => setShowClearConfirm(true)}
                    showClearConfirm={showClearConfirm}
                    onConfirmClear={() => {
                      commit([]);
                      setSelectedId(null);
                      setShowClearConfirm(false);
                    }}
                    onCancelClear={() => setShowClearConfirm(false)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── AI Assist Side Panel ──────────────────────────────────────── */}
          {(showAIPanel || activeTab === "AI") && (
            <div
              data-ocid="design_editor.ai_panel"
              className="w-64 shrink-0 border-l overflow-hidden"
              style={{
                borderColor: "var(--fsx-border)",
                backgroundColor: "var(--fsx-bg-primary)",
              }}
            >
              <AIAssistPanel
                onApplyPalette={handleAIPalette}
                onAddTextShape={handleAIAddText}
                onApplyTemplate={applyTemplate}
                onLoadLogo={handleAILoadLogo}
                canvasRef={canvasRef}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
