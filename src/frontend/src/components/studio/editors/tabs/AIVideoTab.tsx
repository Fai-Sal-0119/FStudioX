import {
  ChevronDown,
  ChevronRight,
  Film,
  Image,
  Palette,
  ScanLine,
  Sparkles,
  ZoomIn,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

/* ── types ───────────────────────────────────────────────────────────────── */
export type SceneMarker = { time: number; pct: number };

type ColorGradePreset = {
  id: string;
  label: string;
  filter: string;
  color: string;
};

type Thumbnail = { dataUrl: string; time: number; entropy: number };

/* ── color grading presets ───────────────────────────────────────────────── */
const GRADE_PRESETS: ColorGradePreset[] = [
  {
    id: "none",
    label: "None",
    filter: "none",
    color: "#555",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    filter: "sepia(0.2) contrast(1.1) brightness(0.95)",
    color: "#3a6186",
  },
  {
    id: "warm",
    label: "Warm",
    filter: "sepia(0.3) brightness(1.05) saturate(1.2)",
    color: "#f4a261",
  },
  {
    id: "cool",
    label: "Cool",
    filter: "hue-rotate(200deg) saturate(0.8) brightness(1.05)",
    color: "#4ecdc4",
  },
  {
    id: "vintage",
    label: "Vintage",
    filter: "sepia(0.5) saturate(0.7) contrast(0.9)",
    color: "#c9a96e",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    filter: "hue-rotate(280deg) saturate(2) contrast(1.2)",
    color: "#b026ff",
  },
  {
    id: "bw",
    label: "B&W",
    filter: "grayscale(1) contrast(1.1)",
    color: "#aaa",
  },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Sample a 10×10 grid from ImageData and compute mean absolute difference */
function frameDiff(a: ImageData, b: ImageData): number {
  const w = a.width;
  const h = a.height;
  const stepX = Math.floor(w / 10);
  const stepY = Math.floor(h / 10);
  let total = 0;
  let count = 0;
  for (let gy = 0; gy < 10; gy++) {
    for (let gx = 0; gx < 10; gx++) {
      const px = gx * stepX;
      const py = gy * stepY;
      const idx = (py * w + px) * 4;
      const rA = a.data[idx];
      const gA = a.data[idx + 1];
      const bA = a.data[idx + 2];
      const rB = b.data[idx];
      const gB = b.data[idx + 1];
      const bB = b.data[idx + 2];
      total +=
        (Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB)) / (3 * 255);
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

/** Compute pixel entropy (variation) as a measure of "interestingness" */
function frameEntropy(imgData: ImageData): number {
  const pixels = imgData.data;
  let sum = 0;
  const step = 16; // sample every 16th pixel for speed
  let count = 0;
  for (let i = 0; i < pixels.length; i += step * 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    sum += Math.abs(r - 128) + Math.abs(g - 128) + Math.abs(b - 128);
    count++;
  }
  return count > 0 ? sum / count / 128 : 0;
}

async function extractFrame(
  video: HTMLVideoElement,
  time: number,
  w: number,
  h: number,
): Promise<{ dataUrl: string; imgData: ImageData }> {
  return new Promise((resolve) => {
    video.currentTime = time;
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl: "", imgData: new ImageData(1, 1) });
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/png"), imgData });
    };
    video.addEventListener("seeked", onSeeked);
  });
}

/* ── card wrapper ────────────────────────────────────────────────────────── */
function AICard({
  title,
  icon,
  children,
  ocid,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  ocid: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--fsx-bg-elevated)",
        border: "1px solid var(--fsx-border)",
      }}
    >
      <button
        type="button"
        data-ocid={ocid}
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
        style={{
          backgroundColor: open ? "rgba(225,29,46,0.06)" : "transparent",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: open
              ? "var(--fsx-accent)"
              : "rgba(225,29,46,0.15)",
          }}
        >
          <span style={{ color: open ? "white" : "var(--fsx-accent)" }}>
            {icon}
          </span>
        </div>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        <span style={{ color: "var(--fsx-text-muted)" }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {open && (
        <div
          className="px-4 pb-4 pt-1"
          style={{ borderTop: "1px solid var(--fsx-border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ── props ───────────────────────────────────────────────────────────────── */
type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string | null;
  duration: number;
  /** callback: AI tab wants to apply a CSS filter to the video */
  onFilterChange: (filter: string) => void;
  /** callback: scene markers detected (for rendering on timeline) */
  onSceneMarkers: (markers: SceneMarker[]) => void;
  /** callback: stabilize transform on/off */
  onStabilize: (on: boolean) => void;
  sceneMarkers: SceneMarker[];
  stabilizeActive: boolean;
  currentTime: number;
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AIVideoTab({
  videoRef,
  videoUrl,
  duration,
  onFilterChange,
  onSceneMarkers,
  onStabilize,
  sceneMarkers,
  stabilizeActive,
  currentTime,
}: Props) {
  /* scene detection */
  const [sceneThreshold, setSceneThreshold] = useState(0.22);
  const [isDetecting, setIsDetecting] = useState(false);
  const [sceneCount, setSceneCount] = useState<number | null>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  /* color grading */
  const [activeGrade, setActiveGrade] = useState("none");

  /* thumbnails */
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [isExtractingThumbs, setIsExtractingThumbs] = useState(false);
  const [bestThumbIdx, setBestThumbIdx] = useState<number | null>(null);

  /* refs */
  const offscreenVideoRef = useRef<HTMLVideoElement | null>(null);

  /* ── Scene Detection ─────────────────────────────────────────────────── */
  const detectScenes = useCallback(async () => {
    if (!videoRef.current || !videoUrl || duration === 0) return;
    setIsDetecting(true);
    setSceneCount(null);
    onSceneMarkers([]);

    // Create an offscreen video element for frame extraction
    const vid = document.createElement("video");
    vid.src = videoUrl;
    vid.crossOrigin = "anonymous";
    vid.muted = true;
    vid.preload = "auto";
    offscreenVideoRef.current = vid;

    await new Promise<void>((res) => {
      vid.onloadeddata = () => res();
      vid.load();
    });

    const totalFrames = Math.floor(duration / 0.5);
    const sampleW = 160;
    const sampleH = 90;
    const canvas = document.createElement("canvas");
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsDetecting(false);
      return;
    }

    let prevImgData: ImageData | null = null;
    const markers: SceneMarker[] = [];

    for (let i = 0; i <= totalFrames; i++) {
      const t = i * 0.5;
      await new Promise<void>((res) => {
        vid.currentTime = t;
        vid.onseeked = () => {
          ctx.drawImage(vid, 0, 0, sampleW, sampleH);
          const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
          if (prevImgData) {
            const diff = frameDiff(prevImgData, imgData);
            if (diff > sceneThreshold && t > 0.5) {
              markers.push({ time: t, pct: (t / duration) * 100 });
            }
          }
          prevImgData = imgData;
          res();
        };
      });
    }

    onSceneMarkers(markers);
    setSceneCount(markers.length);
    setIsDetecting(false);
  }, [videoRef, videoUrl, duration, sceneThreshold, onSceneMarkers]);

  const jumpToScene = useCallback(
    (dir: "prev" | "next") => {
      if (!videoRef.current || sceneMarkers.length === 0) return;
      let idx = currentSceneIdx;
      if (dir === "next")
        idx = Math.min(sceneMarkers.length - 1, currentSceneIdx + 1);
      else idx = Math.max(0, currentSceneIdx - 1);
      setCurrentSceneIdx(idx);
      videoRef.current.currentTime = sceneMarkers[idx].time;
    },
    [videoRef, sceneMarkers, currentSceneIdx],
  );

  const splitAtScenes = useCallback(() => {
    // Visual split: adds markers that VideoEditor uses — already handled via onSceneMarkers
    // Just scroll into view as feedback
    const el = document.querySelector(
      '[data-ocid="video_editor.timeline.playhead"]',
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  /* ── Color Grading ───────────────────────────────────────────────────── */
  const applyGrade = (preset: ColorGradePreset) => {
    setActiveGrade(preset.id);
    onFilterChange(preset.filter === "none" ? "none" : preset.filter);
  };

  /* ── Thumbnail Generator ─────────────────────────────────────────────── */
  const extractThumbnails = useCallback(async () => {
    if (!videoUrl || duration === 0) return;
    setIsExtractingThumbs(true);
    setThumbnails([]);
    setBestThumbIdx(null);

    const vid = document.createElement("video");
    vid.src = videoUrl;
    vid.muted = true;
    vid.crossOrigin = "anonymous";
    vid.preload = "auto";
    await new Promise<void>((res) => {
      vid.onloadeddata = () => res();
      vid.load();
    });

    const positions = [0.1, 0.5, 0.9];
    const thumbW = 240;
    const thumbH = 135;
    const results: Thumbnail[] = [];

    for (const pct of positions) {
      const t = pct * duration;
      const { dataUrl, imgData } = await extractFrame(vid, t, thumbW, thumbH);
      const entropy = frameEntropy(imgData);
      results.push({ dataUrl, time: t, entropy });
    }

    setThumbnails(results);
    setIsExtractingThumbs(false);
  }, [videoUrl, duration]);

  const autoPickBest = () => {
    if (thumbnails.length === 0) return;
    const best = thumbnails.reduce(
      (best, t, i) => (t.entropy > thumbnails[best].entropy ? i : best),
      0,
    );
    setBestThumbIdx(best);
  };

  const downloadThumbnail = (t: Thumbnail, idx: number) => {
    const a = document.createElement("a");
    a.href = t.dataUrl;
    a.download = `thumbnail_${idx + 1}_${formatTime(t.time).replace(":", "m")}s.png`;
    a.click();
  };

  /* ── no video state ──────────────────────────────────────────────────── */
  if (!videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(225,29,46,0.1)" }}
        >
          <Sparkles size={20} style={{ color: "var(--fsx-accent)" }} />
        </div>
        <p className="text-sm font-semibold text-white">AI Tools</p>
        <p
          className="text-xs text-center max-w-[220px]"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          Load a video to use AI Scene Detection, Color Grading, Thumbnail
          Generator, and Stabilization.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2.5">
      {/* header */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <Sparkles size={13} style={{ color: "var(--fsx-accent)" }} />
        <h4
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          AI Tools
        </h4>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: "rgba(225,29,46,0.15)",
            color: "var(--fsx-accent)",
            fontSize: "9px",
          }}
        >
          Browser AI
        </span>
      </div>

      {/* ──── 1. Scene Detection ──────────────────────────────────────────── */}
      <AICard
        title="Scene Detection"
        icon={<ScanLine size={15} />}
        ocid="video_editor.ai.scene_detection.toggle"
      >
        <div className="space-y-3 mt-2">
          <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
            Analyzes frames every 0.5s to find scene changes using pixel
            difference.
          </p>

          {/* threshold slider */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span
                className="text-xs"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                Sensitivity threshold
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "var(--fsx-accent)" }}
              >
                {sceneThreshold.toFixed(2)}
              </span>
            </div>
            <input
              data-ocid="video_editor.ai.scene_threshold"
              type="range"
              min={0.15}
              max={0.35}
              step={0.01}
              value={sceneThreshold}
              onChange={(e) => setSceneThreshold(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "var(--fsx-accent)" }}
              aria-label="Scene detection threshold"
            />
            <div
              className="flex justify-between mt-1"
              style={{ color: "var(--fsx-text-muted)", fontSize: "9px" }}
            >
              <span>More scenes (0.15)</span>
              <span>Fewer scenes (0.35)</span>
            </div>
          </div>

          {/* detect button */}
          <button
            type="button"
            data-ocid="video_editor.ai.detect_scenes"
            onClick={detectScenes}
            disabled={isDetecting}
            className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: isDetecting
                ? "var(--fsx-bg-surface)"
                : "var(--fsx-accent)",
              color: "white",
              opacity: isDetecting ? 0.7 : 1,
            }}
          >
            {isDetecting ? (
              <>
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Analyzing frames…
              </>
            ) : (
              <>
                <ScanLine size={12} /> Detect Scenes
              </>
            )}
          </button>

          {/* results */}
          {sceneCount !== null && (
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                backgroundColor: "var(--fsx-bg-surface)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-semibold">
                  {sceneCount === 0
                    ? "No scene changes found"
                    : `${sceneCount} scene${sceneCount !== 1 ? "s" : ""} detected`}
                </span>
                {sceneCount > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(225,29,46,0.15)",
                      color: "var(--fsx-accent)",
                      fontSize: "9px",
                    }}
                  >
                    {Math.round(100 - sceneThreshold * 200)}% confidence
                  </span>
                )}
              </div>

              {sceneCount > 0 && (
                <>
                  {/* Scene timestamps */}
                  <div className="flex flex-wrap gap-1">
                    {sceneMarkers.slice(0, 8).map((m, i) => (
                      <button
                        key={m.time}
                        type="button"
                        onClick={() => {
                          if (videoRef.current)
                            videoRef.current.currentTime = m.time;
                          setCurrentSceneIdx(i);
                        }}
                        className="text-xs px-2 py-0.5 rounded-full font-mono transition-all"
                        style={{
                          backgroundColor:
                            currentSceneIdx === i
                              ? "var(--fsx-accent)"
                              : "var(--fsx-bg-elevated)",
                          color:
                            currentSceneIdx === i
                              ? "white"
                              : "var(--fsx-text-secondary)",
                          border:
                            currentSceneIdx === i
                              ? "1px solid var(--fsx-accent)"
                              : "1px solid var(--fsx-border)",
                          fontSize: "9px",
                        }}
                      >
                        {formatTime(m.time)}
                      </button>
                    ))}
                    {sceneMarkers.length > 8 && (
                      <span
                        className="text-xs px-2 py-0.5"
                        style={{
                          color: "var(--fsx-text-muted)",
                          fontSize: "9px",
                        }}
                      >
                        +{sceneMarkers.length - 8} more
                      </span>
                    )}
                  </div>

                  {/* Jump + Split */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      data-ocid="video_editor.ai.scene_prev"
                      onClick={() => jumpToScene("prev")}
                      disabled={currentSceneIdx === 0}
                      className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                        color: "var(--fsx-text-secondary)",
                        opacity: currentSceneIdx === 0 ? 0.4 : 1,
                      }}
                    >
                      ‹ Prev
                    </button>
                    <button
                      type="button"
                      data-ocid="video_editor.ai.scene_next"
                      onClick={() => jumpToScene("next")}
                      disabled={currentSceneIdx >= sceneMarkers.length - 1}
                      className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                        color: "var(--fsx-text-secondary)",
                        opacity:
                          currentSceneIdx >= sceneMarkers.length - 1 ? 0.4 : 1,
                      }}
                    >
                      Next ›
                    </button>
                    <button
                      type="button"
                      data-ocid="video_editor.ai.split_at_scenes"
                      onClick={splitAtScenes}
                      className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      style={{
                        backgroundColor: "rgba(225,29,46,0.12)",
                        border: "1px solid rgba(225,29,46,0.3)",
                        color: "var(--fsx-accent)",
                      }}
                    >
                      Split All
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </AICard>

      {/* ──── 2. Color Grading ────────────────────────────────────────────── */}
      <AICard
        title="AI Color Grading"
        icon={<Palette size={15} />}
        ocid="video_editor.ai.color_grading.toggle"
      >
        <div className="space-y-3 mt-2">
          <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
            One-tap cinematic presets applied as CSS filter chains to the
            preview.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {GRADE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-ocid={`video_editor.ai.grade.${preset.id}`}
                onClick={() => applyGrade(preset)}
                className="flex flex-col items-center gap-1.5 transition-all"
              >
                {/* Color swatch circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background:
                      preset.id === "none"
                        ? "linear-gradient(135deg, #333 0%, #666 100%)"
                        : `radial-gradient(circle, ${preset.color}dd 0%, ${preset.color}44 100%)`,
                    border:
                      activeGrade === preset.id
                        ? "2.5px solid var(--fsx-accent)"
                        : "2px solid var(--fsx-border)",
                    boxShadow:
                      activeGrade === preset.id
                        ? `0 0 8px ${preset.color}66`
                        : "none",
                  }}
                >
                  {activeGrade === preset.id && (
                    <span
                      className="text-white font-bold"
                      style={{ fontSize: "10px" }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  className="text-center leading-tight"
                  style={{
                    fontSize: "9px",
                    color:
                      activeGrade === preset.id
                        ? "var(--fsx-accent)"
                        : "var(--fsx-text-muted)",
                    fontWeight: activeGrade === preset.id ? 600 : 400,
                  }}
                >
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
          {activeGrade !== "none" && (
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{
                backgroundColor: "rgba(225,29,46,0.08)",
                border: "1px solid rgba(225,29,46,0.2)",
              }}
            >
              <span
                className="text-xs"
                style={{ color: "var(--fsx-text-secondary)" }}
              >
                Active:{" "}
                <strong style={{ color: "var(--fsx-accent)" }}>
                  {GRADE_PRESETS.find((p) => p.id === activeGrade)?.label}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => applyGrade(GRADE_PRESETS[0])}
                className="text-xs"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </AICard>

      {/* ──── 3. Thumbnail Generator ──────────────────────────────────────── */}
      <AICard
        title="Thumbnail Generator"
        icon={<Image size={15} />}
        ocid="video_editor.ai.thumbnail.toggle"
      >
        <div className="space-y-3 mt-2">
          <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
            Extracts keyframes at 10%, 50%, and 90% of the video. Auto-pick
            finds the most visually interesting frame.
          </p>

          <button
            type="button"
            data-ocid="video_editor.ai.extract_thumbnails"
            onClick={extractThumbnails}
            disabled={isExtractingThumbs}
            className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: isExtractingThumbs
                ? "var(--fsx-bg-surface)"
                : "var(--fsx-accent)",
              color: "white",
              opacity: isExtractingThumbs ? 0.7 : 1,
            }}
          >
            {isExtractingThumbs ? (
              <>
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Extracting frames…
              </>
            ) : (
              <>
                <Film size={12} /> Extract Keyframes
              </>
            )}
          </button>

          {thumbnails.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {thumbnails.map((thumb, i) => (
                  <div key={thumb.time} className="flex flex-col gap-1">
                    <div
                      className="relative rounded-lg overflow-hidden"
                      style={{
                        border:
                          bestThumbIdx === i
                            ? "2px solid var(--fsx-accent)"
                            : "1px solid var(--fsx-border)",
                        aspectRatio: "16/9",
                      }}
                    >
                      <img
                        src={thumb.dataUrl}
                        alt={`Frame at ${formatTime(thumb.time)}`}
                        className="w-full h-full object-cover"
                      />
                      {bestThumbIdx === i && (
                        <div
                          className="absolute top-1 left-1 px-1 rounded text-white font-bold"
                          style={{
                            backgroundColor: "var(--fsx-accent)",
                            fontSize: "8px",
                          }}
                        >
                          BEST
                        </div>
                      )}
                      <div
                        className="absolute bottom-0 left-0 right-0 text-center py-0.5"
                        style={{
                          background: "rgba(0,0,0,0.6)",
                          fontSize: "8px",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      >
                        {formatTime(thumb.time)}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid={`video_editor.ai.thumbnail_download_${i}`}
                      onClick={() => downloadThumbnail(thumb, i)}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                        color: "var(--fsx-text-secondary)",
                        fontSize: "9px",
                      }}
                    >
                      Save PNG
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                data-ocid="video_editor.ai.thumbnail_auto_pick"
                onClick={autoPickBest}
                className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: "rgba(225,29,46,0.1)",
                  border: "1px solid rgba(225,29,46,0.25)",
                  color: "var(--fsx-accent)",
                }}
              >
                <Sparkles size={12} /> Auto-pick Best Frame
              </button>
            </>
          )}
        </div>
      </AICard>

      {/* ──── 4. Video Stabilization ──────────────────────────────────────── */}
      <AICard
        title="Video Stabilization"
        icon={<ZoomIn size={15} />}
        ocid="video_editor.ai.stabilize.toggle"
      >
        <div className="space-y-3 mt-2">
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{
              backgroundColor: "rgba(225,29,46,0.06)",
              border: "1px solid rgba(225,29,46,0.18)",
            }}
          >
            <span style={{ color: "var(--fsx-accent)", fontSize: "12px" }}>
              ℹ
            </span>
            <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
              <strong className="text-white">Simulated stabilization</strong> —
              applies a{" "}
              <span
                className="font-mono"
                style={{ color: "var(--fsx-accent)" }}
              >
                scale(1.05)
              </span>{" "}
              center crop to reduce perceived edge jitter. True optical-flow
              stabilization is not available in-browser.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Apply Stabilization
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                Scale 105% + center crop
              </p>
            </div>
            <button
              type="button"
              data-ocid="video_editor.ai.stabilize"
              onClick={() => onStabilize(!stabilizeActive)}
              className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{
                backgroundColor: stabilizeActive
                  ? "var(--fsx-accent)"
                  : "var(--fsx-bg-surface)",
                border: "1px solid var(--fsx-border)",
              }}
              aria-pressed={stabilizeActive}
              aria-label="Toggle stabilization"
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{
                  left: stabilizeActive ? "calc(100% - 22px)" : "2px",
                  backgroundColor: "white",
                }}
              />
            </button>
          </div>

          {stabilizeActive && (
            <div
              className="rounded-lg px-3 py-2.5 space-y-1"
              style={{
                backgroundColor: "var(--fsx-bg-surface)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--fsx-text-muted)" }}>
                  Transform
                </span>
                <span
                  className="font-mono"
                  style={{ color: "var(--fsx-accent)" }}
                >
                  scale(1.05) translateZ(0)
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--fsx-text-muted)" }}>Crop</span>
                <span
                  className="font-mono"
                  style={{ color: "var(--fsx-text-secondary)" }}
                >
                  ~5% edges removed
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--fsx-text-muted)" }}>Method</span>
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "rgba(225,29,46,0.15)",
                    color: "var(--fsx-accent)",
                    fontSize: "9px",
                  }}
                >
                  Simulated
                </span>
              </div>
            </div>
          )}
        </div>
      </AICard>

      {/* current playhead info */}
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2"
        style={{
          backgroundColor: "var(--fsx-bg-surface)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        <span className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
          Current position
        </span>
        <span
          className="text-xs font-mono"
          style={{ color: "var(--fsx-text-secondary)" }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
