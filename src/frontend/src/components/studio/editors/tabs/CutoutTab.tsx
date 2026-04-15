// ─── Cutout Tab ───────────────────────────────────────────────────────────────
import { Download, Scissors } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton, TabSectionHeader } from "../ImageEditorShared";

type BrushSize = "small" | "medium" | "large";
const BRUSH_SIZES: Record<BrushSize, number> = {
  small: 12,
  medium: 28,
  large: 55,
};

export function CutoutTab({
  imageUrl,
  onCutoutReady,
}: {
  imageUrl: string;
  onCutoutReady: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState<BrushSize>("medium");
  const [isErasing, setIsErasing] = useState(false);
  const [inverted, setInverted] = useState(false);
  const isDrawing = useRef(false);
  const [loaded, setLoaded] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(
        1,
        MAX / Math.max(img.naturalWidth, img.naturalHeight),
      );
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const erase = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const rect = canvas.getBoundingClientRect();
      let clientX: number;
      let clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const radius = BRUSH_SIZES[brushSize];
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    },
    [brushSize],
  );

  const handleInvert = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 3; i < d.length; i += 4) {
      d[i] = d[i] > 128 ? 0 : 255;
    }
    ctx.putImageData(imageData, 0, 0);
    setInverted((v) => !v);
  };

  const handleDownloadCutout = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onCutoutReady(dataUrl);
    const link = document.createElement("a");
    link.download = "cutout.png";
    link.href = dataUrl;
    link.click();
  };

  const handleCopyToOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCutoutReady(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-4">
      <TabSectionHeader>Subject Cutout / Eraser</TabSectionHeader>
      <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
        Paint over areas to erase (remove) them. Download as transparent PNG.
      </p>

      {/* Brush size */}
      <div className="space-y-2">
        <span
          className="text-xs"
          style={{ color: "var(--fsx-text-secondary)" }}
        >
          Brush Size
        </span>
        <div className="flex gap-2">
          {(["small", "medium", "large"] as BrushSize[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setBrushSize(s)}
              className="flex-1 py-2 rounded-lg text-xs capitalize transition-colors"
              style={{
                backgroundColor:
                  brushSize === s
                    ? "var(--fsx-accent)"
                    : "var(--fsx-bg-elevated)",
                color: brushSize === s ? "#fff" : "var(--fsx-text-secondary)",
                border: `1px solid ${brushSize === s ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle erase mode */}
      <button
        type="button"
        onClick={() => setIsErasing((v) => !v)}
        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        style={{
          backgroundColor: isErasing
            ? "rgba(225,29,46,0.15)"
            : "var(--fsx-bg-elevated)",
          color: isErasing ? "var(--fsx-accent)" : "var(--fsx-text-secondary)",
          border: `1px solid ${isErasing ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
        }}
      >
        <Scissors size={13} />
        {isErasing
          ? "Erasing — Click Canvas to Erase"
          : "Activate Eraser Brush"}
      </button>

      {/* Canvas */}
      {loaded && (
        <div
          className="rounded-lg overflow-hidden w-full"
          style={{
            border: `1px solid ${isErasing ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
            cursor: isErasing ? "crosshair" : "default",
            backgroundImage:
              "repeating-conic-gradient(#333 0% 25%, #222 0% 50%)",
            backgroundSize: "16px 16px",
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full"
            onMouseDown={() => {
              if (isErasing) isDrawing.current = true;
            }}
            onMouseMove={isErasing ? erase : undefined}
            onMouseUp={() => {
              isDrawing.current = false;
            }}
            onMouseLeave={() => {
              isDrawing.current = false;
            }}
            onTouchStart={() => {
              if (isErasing) isDrawing.current = true;
            }}
            onTouchMove={isErasing ? erase : undefined}
            onTouchEnd={() => {
              isDrawing.current = false;
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          dataOcid="image_editor.cutout_invert.button"
          onClick={handleInvert}
        >
          {inverted ? "↺ Revert" : "⊘ Invert Selection"}
        </ActionButton>
        <ActionButton
          onClick={handleCopyToOverlay}
          dataOcid="image_editor.cutout_overlay.button"
        >
          📋 Copy to Overlay
        </ActionButton>
      </div>
      <ActionButton
        variant="primary"
        dataOcid="image_editor.cutout_download.button"
        onClick={handleDownloadCutout}
      >
        <Download size={13} /> Download Cutout PNG
      </ActionButton>
    </div>
  );
}
