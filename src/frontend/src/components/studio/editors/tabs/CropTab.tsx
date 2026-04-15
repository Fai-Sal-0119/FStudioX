// ─── Crop Tab ─────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton, TabSectionHeader } from "../ImageEditorShared";

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "9:16" | "3:4";

const ASPECT_PRESETS: {
  label: string;
  value: AspectRatio;
  ratio: number | null;
}[] = [
  { label: "Free", value: "free", ratio: null },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "9:16", value: "9:16", ratio: 9 / 16 },
  { label: "3:4", value: "3:4", ratio: 3 / 4 },
];

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const HANDLE_SIZE = 10;

type Handle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | "move";

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function CropTab({
  imageUrl,
  onCropApply,
}: {
  imageUrl: string;
  onCropApply: (croppedUrl: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const [aspect, setAspect] = useState<AspectRatio>("free");
  const [imgNW, setImgNW] = useState(0);
  const [imgNH, setImgNH] = useState(0);

  // Crop rect is in image-pixel coordinates
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 100, h: 100 });
  const [imgDisplayW, setImgDisplayW] = useState(0);
  const [imgDisplayH, setImgDisplayH] = useState(0);
  const [imgOffsetX, setImgOffsetX] = useState(0);
  const [imgOffsetY, setImgOffsetY] = useState(0);

  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  // Update display dimensions when image loads / window resizes
  const updateLayout = useCallback(() => {
    const img = previewRef.current;
    const container = containerRef.current;
    if (!img || !container || imgNW === 0 || imgNH === 0) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const scaleW = containerW / imgNW;
    const scaleH = containerH / imgNH;
    const scale = Math.min(scaleW, scaleH, 1);
    const dw = imgNW * scale;
    const dh = imgNH * scale;
    setImgDisplayW(dw);
    setImgDisplayH(dh);
    setImgOffsetX((containerW - dw) / 2);
    setImgOffsetY((containerH - dh) / 2);
  }, [imgNW, imgNH]);

  useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [updateLayout]);

  // Reset crop when image natural dimensions change
  useEffect(() => {
    if (imgNW > 0 && imgNH > 0) {
      setCrop({ x: 0, y: 0, w: imgNW, h: imgNH });
    }
  }, [imgNW, imgNH]);

  // Apply aspect ratio
  const applyAspect = (a: AspectRatio) => {
    setAspect(a);
    const preset = ASPECT_PRESETS.find((p) => p.value === a);
    if (!preset?.ratio || imgNW === 0) return;
    const r = preset.ratio;
    let w = imgNW;
    let h = w / r;
    if (h > imgNH) {
      h = imgNH;
      w = h * r;
    }
    const x = (imgNW - w) / 2;
    const y = (imgNH - h) / 2;
    setCrop({ x, y, w, h });
  };

  // Convert image-px to display-px
  const toDisplay = (v: number, dim: "w" | "h") =>
    v * (dim === "w" ? imgDisplayW / imgNW : imgDisplayH / imgNH);

  const toImage = (v: number, dim: "w" | "h") =>
    v * (dim === "w" ? imgNW / imgDisplayW : imgNH / imgDisplayH);

  // Hit-test for handles
  const getHandle = (ex: number, ey: number): Handle | null => {
    if (imgDisplayW === 0) return null;
    // Convert event coords relative to overlay
    const rx = toDisplay(crop.x, "w");
    const ry = toDisplay(crop.y, "h");
    const rw = toDisplay(crop.w, "w");
    const rh = toDisplay(crop.h, "h");

    const near = (a: number, b: number) => Math.abs(a - b) < HANDLE_SIZE + 4;
    const inX = ex > rx - 4 && ex < rx + rw + 4;
    const inY = ey > ry - 4 && ey < ry + rh + 4;

    if (near(ex, rx) && near(ey, ry)) return "tl";
    if (near(ex, rx + rw) && near(ey, ry)) return "tr";
    if (near(ex, rx) && near(ey, ry + rh)) return "bl";
    if (near(ex, rx + rw) && near(ey, ry + rh)) return "br";
    if (near(ey, ry) && inX) return "t";
    if (near(ey, ry + rh) && inX) return "b";
    if (near(ex, rx) && inY) return "l";
    if (near(ex, rx + rw) && inY) return "r";
    // inside = move
    if (ex > rx && ex < rx + rw && ey > ry && ey < ry + rh) return "move";
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<Element>) => {
    const overlay = e.currentTarget.getBoundingClientRect();
    const ex = e.clientX - overlay.left;
    const ey = e.clientY - overlay.top;
    const handle = getHandle(ex, ey);
    if (!handle) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      handle,
      startX: ex,
      startY: ey,
      startCrop: { ...crop },
    };
  };

  const onPointerMove = (e: React.PointerEvent<Element>) => {
    if (!dragRef.current) return;
    const overlay = e.currentTarget.getBoundingClientRect();
    const ex = e.clientX - overlay.left;
    const ey = e.clientY - overlay.top;
    const dx = toImage(ex - dragRef.current.startX, "w");
    const dy = toImage(ey - dragRef.current.startY, "h");
    const sc = dragRef.current.startCrop;
    const handle = dragRef.current.handle;
    const aspectPreset = ASPECT_PRESETS.find((p) => p.value === aspect);
    const r = aspectPreset?.ratio ?? null;

    let { x, y, w, h } = sc;

    const minSize = 20;

    if (handle === "move") {
      x = clamp(sc.x + dx, 0, imgNW - sc.w);
      y = clamp(sc.y + dy, 0, imgNH - sc.h);
    } else {
      if (handle === "tl" || handle === "l" || handle === "bl") {
        const newX = clamp(sc.x + dx, 0, sc.x + sc.w - minSize);
        w = sc.w - (newX - sc.x);
        x = newX;
      }
      if (handle === "tr" || handle === "r" || handle === "br") {
        w = clamp(sc.w + dx, minSize, imgNW - sc.x);
      }
      if (handle === "tl" || handle === "t" || handle === "tr") {
        const newY = clamp(sc.y + dy, 0, sc.y + sc.h - minSize);
        h = sc.h - (newY - sc.y);
        y = newY;
      }
      if (handle === "bl" || handle === "b" || handle === "br") {
        h = clamp(sc.h + dy, minSize, imgNH - sc.y);
      }

      // Enforce aspect ratio (lock to width)
      if (r && (handle === "tr" || handle === "br" || handle === "r")) {
        h = w / r;
      } else if (r && (handle === "bl" || handle === "b")) {
        w = h * r;
      } else if (r && (handle === "tl" || handle === "t")) {
        w = h * r;
        x = sc.x + sc.w - w;
      }
    }

    setCrop({ x, y, w, h });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleApplyCrop = () => {
    if (!imageUrl || imgNW === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(crop.w);
    canvas.height = Math.round(crop.h);
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      onCropApply(canvas.toDataURL("image/png"));
    };
    img.src = imageUrl;
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0, w: imgNW, h: imgNH });
    setAspect("free");
  };

  const cropDisplayX = toDisplay(crop.x, "w");
  const cropDisplayY = toDisplay(crop.y, "h");
  const cropDisplayW = toDisplay(crop.w, "w");
  const cropDisplayH = toDisplay(crop.h, "h");

  const handles: { id: Handle; cx: number; cy: number }[] = [
    { id: "tl", cx: cropDisplayX, cy: cropDisplayY },
    { id: "tr", cx: cropDisplayX + cropDisplayW, cy: cropDisplayY },
    { id: "bl", cx: cropDisplayX, cy: cropDisplayY + cropDisplayH },
    {
      id: "br",
      cx: cropDisplayX + cropDisplayW,
      cy: cropDisplayY + cropDisplayH,
    },
    { id: "t", cx: cropDisplayX + cropDisplayW / 2, cy: cropDisplayY },
    {
      id: "b",
      cx: cropDisplayX + cropDisplayW / 2,
      cy: cropDisplayY + cropDisplayH,
    },
    { id: "l", cx: cropDisplayX, cy: cropDisplayY + cropDisplayH / 2 },
    {
      id: "r",
      cx: cropDisplayX + cropDisplayW,
      cy: cropDisplayY + cropDisplayH / 2,
    },
  ];

  return (
    <div className="space-y-3">
      <TabSectionHeader>Crop</TabSectionHeader>

      {/* Aspect ratio presets */}
      <div className="flex gap-1.5 flex-wrap">
        {ASPECT_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => applyAspect(p.value)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
            style={{
              backgroundColor:
                aspect === p.value
                  ? "var(--fsx-accent)"
                  : "var(--fsx-bg-elevated)",
              color: aspect === p.value ? "#fff" : "var(--fsx-text-muted)",
              border: `1px solid ${aspect === p.value ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Preview canvas with crop overlay */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden select-none"
        style={{
          width: "100%",
          height: 200,
          backgroundColor: "var(--fsx-bg-elevated)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        {imageUrl && (
          <>
            <img
              ref={previewRef}
              src={imageUrl}
              alt="Crop preview"
              className="absolute"
              style={{
                left: imgOffsetX,
                top: imgOffsetY,
                width: imgDisplayW,
                height: imgDisplayH,
                objectFit: "fill",
                opacity: 0.45,
              }}
              onLoad={() => {
                const img = previewRef.current!;
                setImgNW(img.naturalWidth);
                setImgNH(img.naturalHeight);
              }}
            />

            {/* Crop overlay SVG */}
            {imgDisplayW > 0 && (
              <svg
                role="img"
                aria-label="Crop selection area"
                style={{
                  position: "absolute",
                  left: imgOffsetX,
                  top: imgOffsetY,
                  width: imgDisplayW,
                  height: imgDisplayH,
                  cursor: "crosshair",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              >
                {/* Dark outside */}
                <defs>
                  <mask id="crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={cropDisplayX}
                      y={cropDisplayY}
                      width={cropDisplayW}
                      height={cropDisplayH}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.6)"
                  mask="url(#crop-mask)"
                />

                {/* Bright image inside crop */}
                <image
                  href={imageUrl}
                  x={-cropDisplayX + cropDisplayX}
                  y={0}
                  width={imgDisplayW}
                  height={imgDisplayH}
                  clipPath={`rect(${cropDisplayY}px ${cropDisplayX + cropDisplayW}px ${cropDisplayY + cropDisplayH}px ${cropDisplayX}px)`}
                  style={{
                    clipPath: `inset(${cropDisplayY}px ${imgDisplayW - cropDisplayX - cropDisplayW}px ${imgDisplayH - cropDisplayY - cropDisplayH}px ${cropDisplayX}px)`,
                  }}
                />

                {/* Crop rect border */}
                <rect
                  x={cropDisplayX}
                  y={cropDisplayY}
                  width={cropDisplayW}
                  height={cropDisplayH}
                  fill="none"
                  stroke="#e11d2e"
                  strokeWidth={1.5}
                />

                {/* Rule-of-thirds grid */}
                {[1, 2].map((i) => (
                  <g key={i}>
                    <line
                      x1={cropDisplayX + (cropDisplayW / 3) * i}
                      y1={cropDisplayY}
                      x2={cropDisplayX + (cropDisplayW / 3) * i}
                      y2={cropDisplayY + cropDisplayH}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={0.5}
                    />
                    <line
                      x1={cropDisplayX}
                      y1={cropDisplayY + (cropDisplayH / 3) * i}
                      x2={cropDisplayX + cropDisplayW}
                      y2={cropDisplayY + (cropDisplayH / 3) * i}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={0.5}
                    />
                  </g>
                ))}

                {/* Corner & edge handles */}
                {handles.map((h) => (
                  <rect
                    key={h.id}
                    x={h.cx - HANDLE_SIZE / 2}
                    y={h.cy - HANDLE_SIZE / 2}
                    width={HANDLE_SIZE}
                    height={HANDLE_SIZE}
                    fill="#e11d2e"
                    stroke="#fff"
                    strokeWidth={1}
                    rx={2}
                    style={{
                      cursor: h.id === "move" ? "move" : `${h.id}-resize`,
                    }}
                  />
                ))}
              </svg>
            )}
          </>
        )}
      </div>

      {/* Crop dimensions info */}
      <div
        className="flex justify-between text-[10px] font-mono"
        style={{ color: "var(--fsx-text-muted)" }}
      >
        <span>
          x:{Math.round(crop.x)} y:{Math.round(crop.y)}
        </span>
        <span>
          {Math.round(crop.w)} × {Math.round(crop.h)} px
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <ActionButton
          variant="primary"
          dataOcid="image_editor.crop_apply.button"
          onClick={handleApplyCrop}
        >
          ✂ Apply Crop
        </ActionButton>
        <ActionButton
          dataOcid="image_editor.crop_reset.button"
          onClick={handleReset}
        >
          Reset
        </ActionButton>
      </div>

      <p className="text-[10px]" style={{ color: "var(--fsx-text-muted)" }}>
        💡 Drag corners/edges to resize. Drag inside to move. Select aspect
        ratio preset to constrain proportions.
      </p>
    </div>
  );
}
