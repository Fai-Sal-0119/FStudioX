import {
  Download,
  Expand,
  ImageIcon,
  Redo2,
  RefreshCw,
  SplitSquareHorizontal,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { AIPhotoTab } from "./tabs/AIPhotoTab";
import { BackgroundTab, GRADIENTS } from "./tabs/BackgroundTab";
import type { BackgroundState } from "./tabs/BackgroundTab";
import { BeautyTab } from "./tabs/BeautyTab";
import type { BeautyState } from "./tabs/BeautyTab";
import { CropTab } from "./tabs/CropTab";
import { CutoutTab } from "./tabs/CutoutTab";
import { EffectsTab } from "./tabs/EffectsTab";
import { FaceSwapTab } from "./tabs/FaceSwapTab";
import type { FaceSwapState } from "./tabs/FaceSwapTab";
import { AdjustTab, FiltersTab, TransformTab } from "./tabs/FiltersAdjustTab";
import { OverlaysTab } from "./tabs/OverlaysTab";
import type { OverlayState } from "./tabs/OverlaysTab";
import { QualityTab } from "./tabs/QualityTab";
import type { QualityState } from "./tabs/QualityTab";

import {
  DEFAULT_ADJUSTMENTS,
  EFFECT_PRESETS,
  PRESETS,
  applyBeautyFilter,
  buildFilterString,
  denoiseImage,
  enhanceQuality,
  removeBackground,
  restoreColors,
  sharpenBoost,
  upscaleImage,
} from "./imageEditorUtils";
import type { Adjustments } from "./imageEditorUtils";

import { DEFAULT_BG_STATE } from "./tabs/BackgroundTab";
import { DEFAULT_BEAUTY } from "./tabs/BeautyTab";
import { DEFAULT_FACE_SWAP } from "./tabs/FaceSwapTab";
import { DEFAULT_OVERLAY } from "./tabs/OverlaysTab";
import { DEFAULT_QUALITY } from "./tabs/QualityTab";

// ─── History ──────────────────────────────────────────────────────────────────

interface HistoryEntry {
  imageUrl: string;
}

const MAX_HISTORY = 20;

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId =
  | "filters"
  | "adjust"
  | "background"
  | "crop"
  | "faceswap"
  | "cutout"
  | "effects"
  | "beauty"
  | "quality"
  | "overlays"
  | "ai";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "filters", label: "Filters", icon: "🎨" },
  { id: "adjust", label: "Adjust", icon: "⚙" },
  { id: "background", label: "BG", icon: "🖼" },
  { id: "crop", label: "Crop", icon: "✂" },
  { id: "faceswap", label: "Face Swap", icon: "🔀" },
  { id: "cutout", label: "Cutout", icon: "🖌" },
  { id: "effects", label: "Effects", icon: "✨" },
  { id: "beauty", label: "Beauty", icon: "💄" },
  { id: "quality", label: "Quality", icon: "⬆" },
  { id: "overlays", label: "Overlays", icon: "📋" },
  { id: "ai", label: "AI", icon: "🤖" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageEditor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [imageNaturalW, setImageNaturalW] = useState(0);
  const [imageNaturalH, setImageNaturalH] = useState(0);
  const [adjustments, setAdjustments] =
    useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [activePresetId, setActivePresetId] = useState("normal");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("filters");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Advanced state
  const [bg, setBg] = useState<BackgroundState>(DEFAULT_BG_STATE);
  const [activeEffects, setActiveEffects] = useState<Set<string>>(new Set());
  const [beauty, setBeauty] = useState<BeautyState>(DEFAULT_BEAUTY);
  const [quality, setQuality] = useState<QualityState>(DEFAULT_QUALITY);
  const [faceSwap, setFaceSwap] = useState<FaceSwapState>(DEFAULT_FACE_SWAP);
  const [overlay, setOverlay] = useState<OverlayState>(DEFAULT_OVERLAY);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  // ── History (undo/redo) ───────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback(
    (url: string) => {
      setHistory((prev) => {
        const slice = prev.slice(0, historyIndex + 1);
        const next = [...slice, { imageUrl: url }];
        return next.slice(-MAX_HISTORY);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex],
  );

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setImageUrl(history[newIndex].imageUrl);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setImageUrl(history[newIndex].imageUrl);
  };

  const setImageUrlWithHistory = useCallback(
    (url: string) => {
      setImageUrl(url);
      pushHistory(url);
    },
    [pushHistory],
  );

  const imgRef = useRef<HTMLImageElement>(null);

  const activePreset =
    PRESETS.find((p) => p.id === activePresetId) ?? PRESETS[0];
  const filterString = buildFilterString(activePreset.filter, adjustments);

  const transformStyle = [
    `rotate(${rotation}deg)`,
    `scaleX(${flipH ? -1 : 1})`,
    `scaleY(${flipV ? -1 : 1})`,
  ].join(" ");

  // ── File loading ─────────────────────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageName(file.name);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActivePresetId("normal");
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBg(DEFAULT_BG_STATE);
    setActiveEffects(new Set());
    setBeauty(DEFAULT_BEAUTY);
    setQuality(DEFAULT_QUALITY);
    setFaceSwap(DEFAULT_FACE_SWAP);
    setOverlay(DEFAULT_OVERLAY);
    setCutoutUrl(null);
    setHistory([{ imageUrl: url }]);
    setHistoryIndex(0);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  // ── Reset ────────────────────────────────────────────────────────────────────

  const resetAll = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActivePresetId("normal");
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBg(DEFAULT_BG_STATE);
    setActiveEffects(new Set());
    setBeauty(DEFAULT_BEAUTY);
    setQuality(DEFAULT_QUALITY);
    setFaceSwap(DEFAULT_FACE_SWAP);
    setOverlay(DEFAULT_OVERLAY);
  };

  // ── Background ops ────────────────────────────────────────────────────────────

  const handleRemoveBg = () => {
    const img = imgRef.current;
    if (!img || !imageUrl) return;
    setIsProcessing(true);
    setTimeout(() => {
      const result = removeBackground(img);
      setImageUrlWithHistory(result);
      setBg((prev) => ({ ...prev, removed: true }));
      setIsProcessing(false);
    }, 80);
  };

  // ── Quality ops ───────────────────────────────────────────────────────────────

  const handleEnhance = () => {
    const img = imgRef.current;
    if (!img) return;
    setIsProcessing(true);
    setTimeout(() => {
      const result = enhanceQuality(img);
      setImageUrlWithHistory(result);
      setIsProcessing(false);
    }, 80);
  };

  const handleUpscale = () => {
    const img = imgRef.current;
    if (!img) return;
    setIsProcessing(true);
    setTimeout(() => {
      const result = upscaleImage(img);
      setImageUrlWithHistory(result);
      setQuality((prev) => ({ ...prev, upscaled: true }));
      setIsProcessing(false);
    }, 80);
  };

  const handleRestoreColors = () => {
    const img = imgRef.current;
    if (!img) return;
    setIsProcessing(true);
    setTimeout(() => {
      const result = restoreColors(img);
      setImageUrlWithHistory(result);
      setIsProcessing(false);
    }, 80);
  };

  const handleSharpenBoost = () => {
    const img = imgRef.current;
    if (!img) return;
    setIsProcessing(true);
    setTimeout(() => {
      const result = sharpenBoost(img);
      setImageUrlWithHistory(result);
      setQuality((prev) => ({ ...prev, sharpenBoosted: true }));
      setIsProcessing(false);
    }, 80);
  };

  const handleHDR = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = "contrast(1.3) saturate(1.4) brightness(1.05)";
    ctx.drawImage(img, 0, 0);
    const result = canvas.toDataURL("image/png");
    setImageUrlWithHistory(result);
    setQuality((prev) => ({ ...prev, hdrEffect: !prev.hdrEffect }));
  };

  const handleDenoise = (v: number) => {
    const img = imgRef.current;
    if (!img || v === 0) {
      setQuality((prev) => ({ ...prev, denoise: v }));
      return;
    }
    setQuality((prev) => ({ ...prev, denoise: v }));
    const result = denoiseImage(img, v);
    setImageUrlWithHistory(result);
  };

  // ── Toggle effect ─────────────────────────────────────────────────────────────

  const handleToggleEffect = (id: string) => {
    setActiveEffects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Download PNG (final composite) ───────────────────────────────────────────

  const downloadPng = useCallback(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const rotated90 = rotation === 90 || rotation === 270;
      const canvas = document.createElement("canvas");
      canvas.width = rotated90 ? img.height : img.width;
      canvas.height = rotated90 ? img.width : img.height;
      const ctx = canvas.getContext("2d")!;

      // Draw background layer
      if (bg.type === "color") {
        ctx.fillStyle = bg.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bg.type === "gradient") {
        const grad = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const g = GRADIENTS[bg.gradientIndex];
        const stops = g.value.match(/#[a-fA-F0-9]{6}/g) ?? ["#000", "#fff"];
        stops.forEach((s, i) => grad.addColorStop(i / (stops.length - 1), s));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bg.type === "gallery" && bg.galleryUrl) {
        const bgImg = new Image();
        bgImg.src = bg.galleryUrl;
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      }

      // Draw main image
      ctx.filter = filterString === "none" ? "none" : filterString;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      ctx.filter = "none";

      // Apply beauty
      if (beauty.smoothing > 0 || beauty.whitening > 0 || beauty.slimFace > 0) {
        const tempImg = new Image();
        tempImg.src = applyBeautyFilter(
          img,
          beauty.smoothing,
          beauty.whitening,
          beauty.slimFace,
        );
        ctx.drawImage(tempImg, 0, 0);
      }

      // Apply effects
      for (const effectId of activeEffects) {
        const effect = EFFECT_PRESETS.find((e) => e.id === effectId);
        if (effect) effect.apply(ctx, canvas.width, canvas.height);
      }

      // Apply overlay
      if (overlay.url) {
        const overlayImg = new Image();
        overlayImg.src = overlay.url;
        const sw = (canvas.width * overlay.scale) / 100;
        const sh = (canvas.height * overlay.scale) / 100;
        const sx = (canvas.width - sw) * (overlay.posX / 100);
        const sy = (canvas.height - sh) * (overlay.posY / 100);
        ctx.globalAlpha = overlay.opacity / 100;
        ctx.globalCompositeOperation =
          overlay.blendMode as GlobalCompositeOperation;
        ctx.drawImage(overlayImg, sx, sy, sw, sh);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      const link = document.createElement("a");
      link.download = `${imageName.replace(/\.[^.]+$/, "")}_fstudiox.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = imageUrl;
  }, [
    imageUrl,
    filterString,
    rotation,
    flipH,
    flipV,
    imageName,
    bg,
    activeEffects,
    beauty,
    overlay,
  ]);

  // ── Tab content renderer ──────────────────────────────────────────────────────

  const renderTabContent = () => {
    if (!imageUrl) return null;
    switch (activeTab) {
      case "filters":
        return (
          <div className="space-y-5">
            <FiltersTab
              activePresetId={activePresetId}
              onPreset={setActivePresetId}
            />
            <TransformTab
              rotation={rotation}
              flipH={flipH}
              flipV={flipV}
              onRotation={setRotation}
              onFlipH={() => setFlipH((v) => !v)}
              onFlipV={() => setFlipV((v) => !v)}
            />
          </div>
        );
      case "adjust":
        return (
          <AdjustTab
            adjustments={adjustments}
            onChange={(key, value) =>
              setAdjustments((prev) => ({ ...prev, [key]: value }))
            }
          />
        );
      case "background":
        return (
          <BackgroundTab
            bg={bg}
            onChange={(update) => setBg((prev) => ({ ...prev, ...update }))}
            onRemoveBg={handleRemoveBg}
            isProcessing={isProcessing}
          />
        );
      case "crop":
        return (
          <CropTab
            imageUrl={imageUrl}
            onCropApply={(url) => {
              setImageUrlWithHistory(url);
              setRotation(0);
              setFlipH(false);
              setFlipV(false);
            }}
          />
        );
      case "faceswap":
        return (
          <FaceSwapTab
            imageUrl={imageUrl}
            faceSwap={faceSwap}
            onChange={(update) =>
              setFaceSwap((prev) => ({ ...prev, ...update }))
            }
            onApply={(url) => setImageUrlWithHistory(url)}
          />
        );
      case "cutout":
        return <CutoutTab imageUrl={imageUrl} onCutoutReady={setCutoutUrl} />;
      case "effects":
        return (
          <EffectsTab
            activeEffects={activeEffects}
            onToggleEffect={handleToggleEffect}
          />
        );
      case "beauty":
        return (
          <BeautyTab
            beauty={beauty}
            onChange={(key, value) =>
              setBeauty((prev) => ({ ...prev, [key]: value }))
            }
          />
        );
      case "quality":
        return (
          <QualityTab
            quality={quality}
            onDenoise={handleDenoise}
            onHDR={handleHDR}
            onEnhance={handleEnhance}
            onUpscale={handleUpscale}
            onRestoreColors={handleRestoreColors}
            onSharpenBoost={handleSharpenBoost}
            isProcessing={isProcessing}
          />
        );
      case "overlays":
        return (
          <OverlaysTab
            overlay={overlay}
            onChange={(update) =>
              setOverlay((prev) => ({ ...prev, ...update }))
            }
          />
        );
      case "ai":
        return (
          <AIPhotoTab
            imgRef={imgRef}
            imageUrl={imageUrl}
            isProcessing={isProcessing}
            onApply={setImageUrlWithHistory}
            onBusy={setIsProcessing}
            onApplyPresetId={setActivePresetId}
          />
        );
      default:
        return null;
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      data-ocid="image_editor.panel"
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--fsx-bg-primary)" }}
    >
      {/* ── FULLSCREEN OVERLAY ── */}
      {fullscreen && imageUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
        >
          <button
            type="button"
            aria-label="Close fullscreen"
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full transition-colors z-10"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }}
          >
            <X size={20} />
          </button>
          <img
            src={imageUrl}
            alt="Full preview"
            className="max-w-full max-h-full object-contain"
            style={{ filter: filterString, transform: transformStyle }}
          />
        </div>
      )}

      {/* ── TOP: Preview (50% height) ── */}
      <div
        className="flex-none relative flex items-center justify-center overflow-hidden"
        style={{ height: "50%", backgroundColor: "var(--fsx-bg-primary)" }}
      >
        {!imageUrl ? (
          <div
            data-ocid="image_editor.dropzone"
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className="flex flex-col items-center justify-center gap-4 w-full h-full cursor-pointer transition-all"
            style={{
              border: `2px dashed ${isDragging ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
              backgroundColor: isDragging
                ? "rgba(225,29,46,0.04)"
                : "transparent",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(225,29,46,0.1)",
                border: "1px solid rgba(225,29,46,0.25)",
              }}
            >
              <ImageIcon size={30} style={{ color: "var(--fsx-accent)" }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white mb-1 text-base">
                Drop an image here
              </p>
              <p className="text-sm" style={{ color: "var(--fsx-text-muted)" }}>
                PNG, JPG, WebP, GIF supported
              </p>
            </div>
            <label className="fsx-btn-primary cursor-pointer">
              <input
                data-ocid="image_editor.upload_button"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
              <span className="flex items-center gap-2">
                <Upload size={14} /> Choose Image
              </span>
            </label>
            <p
              className="text-xs font-bold tracking-widest"
              style={{ color: "var(--fsx-accent)", opacity: 0.4 }}
            >
              FSTUDIOX
            </p>
          </div>
        ) : (
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              background:
                bg.type === "color"
                  ? bg.color
                  : bg.type === "gradient"
                    ? GRADIENTS[bg.gradientIndex].value
                    : "black",
            }}
          >
            {bg.type === "gallery" && bg.galleryUrl && (
              <img
                src={bg.galleryUrl}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: bg.overlayOpacity / 100 }}
              />
            )}
            {/* Checkerboard for transparent bg */}
            {bg.removed && bg.type === "none" && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#2a2d3a 0% 25%, #1f2230 0% 50%)",
                  backgroundSize: "20px 20px",
                }}
              />
            )}
            <img
              ref={imgRef}
              data-ocid="image_editor.canvas_target"
              src={imageUrl}
              alt="Preview"
              onLoad={(e) => {
                const el = e.currentTarget;
                setImageNaturalW(el.naturalWidth);
                setImageNaturalH(el.naturalHeight);
              }}
              className="max-w-full max-h-full object-contain select-none relative z-10"
              style={{
                filter: showOriginal ? "none" : filterString,
                transform: transformStyle,
                transition: "filter 0.15s ease, transform 0.2s ease",
              }}
            />
            {/* Overlay layer */}
            {overlay.url && !showOriginal && (
              <img
                src={overlay.url}
                alt="Overlay"
                className="absolute z-20 pointer-events-none"
                style={{
                  opacity: overlay.opacity / 100,
                  mixBlendMode:
                    overlay.blendMode as React.CSSProperties["mixBlendMode"],
                  width: `${overlay.scale}%`,
                  left: `${overlay.posX * (1 - overlay.scale / 100)}%`,
                  top: `${overlay.posY * (1 - overlay.scale / 100)}%`,
                }}
              />
            )}
            {showOriginal && (
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider z-30"
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  color: "var(--fsx-text-secondary)",
                  border: "1px solid var(--fsx-border)",
                }}
              >
                ORIGINAL
              </div>
            )}
            {/* Fullscreen button */}
            <button
              type="button"
              aria-label="Fullscreen preview"
              data-ocid="image_editor.fullscreen.button"
              onClick={() => setFullscreen(true)}
              className="absolute top-2 right-2 z-30 flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Expand size={14} />
            </button>
            {imageNaturalW > 0 && (
              <div
                className="absolute bottom-2 right-3 text-[10px] font-mono z-30"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                {imageNaturalW} × {imageNaturalH}
                {quality.upscaled && (
                  <span style={{ color: "var(--fsx-accent)" }}> 2×</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM: Controls (50% height) ── */}
      <div
        className="flex-none flex flex-col overflow-hidden"
        style={{
          height: "50%",
          backgroundColor: "var(--fsx-bg-surface)",
          borderTop: "1px solid var(--fsx-border)",
        }}
      >
        {/* Action bar */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-2 gap-2"
          style={{
            backgroundColor: "var(--fsx-bg-surface)",
            borderBottom: "1px solid var(--fsx-border)",
          }}
        >
          <span className="text-xs font-semibold text-white tracking-wide truncate min-w-0">
            {imageUrl ? imageName : "Image Editor"}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {imageUrl && (
              <>
                {/* Undo */}
                <button
                  type="button"
                  aria-label="Undo"
                  data-ocid="image_editor.undo.button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    color: canUndo
                      ? "var(--fsx-text-secondary)"
                      : "var(--fsx-text-muted)",
                    border: "1px solid var(--fsx-border)",
                    opacity: canUndo ? 1 : 0.4,
                  }}
                  title={`Undo (${historyIndex} steps)`}
                >
                  <Undo2 size={12} />
                </button>
                {/* Redo */}
                <button
                  type="button"
                  aria-label="Redo"
                  data-ocid="image_editor.redo.button"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    color: canRedo
                      ? "var(--fsx-text-secondary)"
                      : "var(--fsx-text-muted)",
                    border: "1px solid var(--fsx-border)",
                    opacity: canRedo ? 1 : 0.4,
                  }}
                  title="Redo"
                >
                  <Redo2 size={12} />
                </button>
                <button
                  type="button"
                  data-ocid="image_editor.before_after.toggle_button"
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor: showOriginal
                      ? "var(--fsx-accent)"
                      : "var(--fsx-bg-elevated)",
                    color: showOriginal ? "#fff" : "var(--fsx-text-secondary)",
                    border: "1px solid var(--fsx-border)",
                  }}
                  title="Hold to compare original"
                >
                  <SplitSquareHorizontal size={12} />
                  <span className="hidden sm:inline">Before/After</span>
                </button>
                <button
                  type="button"
                  data-ocid="image_editor.reset.secondary_button"
                  onClick={resetAll}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    color: "var(--fsx-text-secondary)",
                    border: "1px solid var(--fsx-border)",
                  }}
                  title="Reset All"
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  type="button"
                  data-ocid="image_editor.download.primary_button"
                  onClick={downloadPng}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold fsx-btn-primary"
                  title="Download PNG"
                >
                  <Download size={12} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <label
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    color: "var(--fsx-text-secondary)",
                    border: "1px solid var(--fsx-border)",
                  }}
                  title="Replace image"
                >
                  <Upload size={12} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {imageUrl ? (
          <>
            {/* Tab bar — scrollable */}
            <div
              className="shrink-0 flex overflow-x-auto"
              style={{
                scrollbarWidth: "none",
                backgroundColor: "var(--fsx-bg-elevated)",
                borderBottom: "1px solid var(--fsx-border)",
              }}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-ocid={`image_editor.tab.${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className="shrink-0 flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all whitespace-nowrap"
                    style={{
                      color: active
                        ? "var(--fsx-accent)"
                        : "var(--fsx-text-muted)",
                      borderBottom: active
                        ? "2px solid var(--fsx-accent)"
                        : "2px solid transparent",
                      backgroundColor: active
                        ? "rgba(225,29,46,0.06)"
                        : "transparent",
                    }}
                  >
                    <span className="text-[13px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ scrollbarWidth: "thin" }}
            >
              {renderTabContent()}
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center flex-1 gap-2"
            style={{ color: "var(--fsx-text-muted)" }}
          >
            <ImageIcon size={24} style={{ opacity: 0.4 }} />
            <p className="text-xs">Load an image to start editing</p>
          </div>
        )}
      </div>

      {/* Hidden: store cutout ref for potential future use */}
      {cutoutUrl && <span className="hidden" data-cutout={cutoutUrl} />}
    </div>
  );
}
