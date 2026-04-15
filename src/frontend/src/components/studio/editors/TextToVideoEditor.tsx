import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Loader2,
  MoveDown,
  MoveUp,
  Music2,
  Play,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MUSIC_LIBRARY } from "../../../data/musicLibraryData";
import type { MusicTrack } from "../../../data/musicLibraryData";

// ── Types ────────────────────────────────────────────────────────────────────

type AnimStyle = "typewriter" | "fade" | "slidein" | "bounce" | "zoom";
type SlideDir = "left" | "right" | "bottom";
type BgType = "solid" | "gradient" | "image";
type TransitionType = "fade" | "blur" | "wipe" | "cut" | "bounce";
type TextAlign = "left" | "center" | "right";

const GRADIENTS: { label: string; value: string }[] = [
  {
    label: "Dark Red Glow",
    value: "linear-gradient(135deg,#1a0008 0%,#3d0012 50%,#0a0010 100%)",
  },
  {
    label: "Dark Blue",
    value: "linear-gradient(135deg,#0a0018 0%,#0d1a3d 50%,#03040f 100%)",
  },
  {
    label: "Dark Purple",
    value: "linear-gradient(135deg,#0f0020 0%,#2a0050 50%,#060014 100%)",
  },
  {
    label: "Dark Green",
    value: "linear-gradient(135deg,#001208 0%,#003318 50%,#000a04 100%)",
  },
  {
    label: "Dark Gold",
    value: "linear-gradient(135deg,#1a1000 0%,#3d2800 50%,#0f0a00 100%)",
  },
  {
    label: "Pitch Black+Red",
    value:
      "radial-gradient(ellipse at center,#2a0008 0%,#0a0000 40%,#000000 100%)",
  },
];

const FONTS = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Oswald", value: "Oswald, sans-serif" },
];

interface Slide {
  id: string;
  text: string;
  animStyle: AnimStyle;
  slideDir: SlideDir;
  duration: number; // seconds
  bgType: BgType;
  bgColor: string;
  bgGradient: string;
  bgImage: string | null;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  textAlign: TextAlign;
  transition: TransitionType;
  transitionDuration: number; // 0.3–1s
}

function makeSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: Math.random().toString(36).slice(2),
    text: "Your Story Starts Here",
    animStyle: "typewriter",
    slideDir: "left",
    duration: 3,
    bgType: "gradient",
    bgColor: "#0a0a0a",
    bgGradient: GRADIENTS[0].value,
    bgImage: null,
    fontSize: 52,
    fontColor: "#ffffff",
    fontFamily: "Montserrat, sans-serif",
    textAlign: "center",
    transition: "fade",
    transitionDuration: 0.5,
    ...overrides,
  };
}

// ── Canvas renderer ──────────────────────────────────────────────────────────

interface RenderState {
  slide: Slide;
  t: number; // 0–1 normalized time within slide
  transT: number; // 0–1 transition progress (0 = no transition)
  nextSlide: Slide | null;
  phase: "in" | "hold" | "out";
}

function renderSlideToCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: RenderState,
) {
  const { slide, t, transT, nextSlide, phase } = state;

  ctx.clearRect(0, 0, W, H);

  // Background
  function drawBg(s: Slide, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (s.bgType === "solid") {
      ctx.fillStyle = s.bgColor;
      ctx.fillRect(0, 0, W, H);
    } else if (s.bgType === "gradient") {
      const g = document.createElement("canvas");
      g.width = W;
      g.height = H;
      const gc = g.getContext("2d")!;
      // Parse gradient string — fallback to dark fill
      gc.fillStyle = "#0a0a0a";
      gc.fillRect(0, 0, W, H);
      // Overlay red glow for all gradients
      const radial = gc.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        W * 0.7,
      );
      if (s.bgGradient.includes("#3d0012") || s.bgGradient.includes("2a0008")) {
        radial.addColorStop(0, "rgba(180,0,30,0.35)");
        radial.addColorStop(1, "rgba(0,0,0,0)");
      } else if (s.bgGradient.includes("#2a0050")) {
        radial.addColorStop(0, "rgba(80,0,180,0.35)");
        radial.addColorStop(1, "rgba(0,0,0,0)");
      } else if (s.bgGradient.includes("#003318")) {
        radial.addColorStop(0, "rgba(0,120,40,0.25)");
        radial.addColorStop(1, "rgba(0,0,0,0)");
      } else if (s.bgGradient.includes("#3d2800")) {
        radial.addColorStop(0, "rgba(160,80,0,0.3)");
        radial.addColorStop(1, "rgba(0,0,0,0)");
      } else {
        radial.addColorStop(0, "rgba(80,100,200,0.25)");
        radial.addColorStop(1, "rgba(0,0,0,0)");
      }
      gc.fillStyle = radial;
      gc.fillRect(0, 0, W, H);
      ctx.drawImage(g, 0, 0);
    } else if (s.bgType === "image" && s.bgImage) {
      const img = new Image();
      img.src = s.bgImage;
      try {
        ctx.drawImage(img, 0, 0, W, H);
      } catch {
        /* not loaded yet */
      }
    }
    ctx.restore();
  }

  // Transition rendering
  if (phase === "out" && nextSlide && transT > 0) {
    if (slide.transition === "cut") {
      drawBg(nextSlide);
    } else if (slide.transition === "fade") {
      drawBg(slide);
      drawBg(nextSlide, transT);
    } else if (slide.transition === "blur") {
      drawBg(slide, 1 - transT);
      drawBg(nextSlide, transT);
    } else if (slide.transition === "wipe") {
      drawBg(slide);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W * transT, H);
      ctx.clip();
      drawBg(nextSlide);
      ctx.restore();
    } else if (slide.transition === "bounce") {
      drawBg(slide, 1 - transT);
      ctx.save();
      const scale = 0.5 + transT * 0.5;
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -H / 2);
      drawBg(nextSlide, transT);
      ctx.restore();
    }
    return; // skip text during transition
  }

  drawBg(slide);

  // Text rendering with animation
  ctx.save();
  const lines = slide.text.split("\n");
  const fs = slide.fontSize;
  ctx.font = `bold ${fs}px ${slide.fontFamily}`;
  ctx.textAlign =
    slide.textAlign === "left"
      ? "left"
      : slide.textAlign === "right"
        ? "right"
        : "center";
  ctx.textBaseline = "middle";

  const lineHeight = fs * 1.25;
  const totalH = lines.length * lineHeight;
  const startY = H / 2 - totalH / 2 + lineHeight / 2;

  const xBase =
    slide.textAlign === "left"
      ? 40
      : slide.textAlign === "right"
        ? W - 40
        : W / 2;

  function getAnimAlpha(): number {
    if (slide.animStyle === "typewriter") return 1;
    if (slide.animStyle === "fade") return Math.min(1, t * 2);
    if (slide.animStyle === "zoom") return Math.min(1, t * 2);
    if (slide.animStyle === "bounce") return Math.min(1, t * 3);
    if (slide.animStyle === "slidein") return Math.min(1, t * 2);
    return 1;
  }

  function getAnimScale(): number {
    if (slide.animStyle === "zoom") {
      const raw = 0.5 + t * 0.5;
      return Math.min(1, raw + (raw > 0.9 ? (raw - 0.9) * 2 : 0));
    }
    if (slide.animStyle === "bounce") {
      const overshoot =
        t < 0.7 ? t / 0.7 : 1 + Math.sin(((t - 0.7) / 0.3) * Math.PI) * 0.08;
      return Math.min(1.1, overshoot);
    }
    return 1;
  }

  function getSlideOffset(): [number, number] {
    if (slide.animStyle !== "slidein") return [0, 0];
    const inner = 1 - Math.min(1, t * 1.5);
    const ease = 1 - inner ** 3;
    const dist = 80;
    if (slide.slideDir === "left") return [-(1 - ease) * dist, 0];
    if (slide.slideDir === "right") return [(1 - ease) * dist, 0];
    if (slide.slideDir === "bottom") return [0, (1 - ease) * dist];
    return [0, 0];
  }

  const alpha = getAnimAlpha();
  const scale = getAnimScale();
  const [offX, offY] = getSlideOffset();

  ctx.globalAlpha = alpha;
  ctx.translate(offX, offY);
  if (scale !== 1) {
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
  }

  if (slide.animStyle === "typewriter") {
    const fullText = slide.text;
    const charCount = Math.floor(t * (fullText.length + 8));
    const visibleText = fullText.slice(0, charCount);
    const visLines = visibleText.split("\n");
    visLines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.fillStyle = slide.fontColor;
      ctx.fillText(line, xBase, y);
    });
    // Cursor
    if (charCount <= fullText.length) {
      const cursorVisible = Math.floor(Date.now() / 500) % 2 === 0;
      if (cursorVisible) {
        const lastLine = visLines[visLines.length - 1] ?? "";
        const metrics = ctx.measureText(lastLine);
        const lineIdx = visLines.length - 1;
        const cy = startY + lineIdx * lineHeight;
        const cx =
          slide.textAlign === "center"
            ? xBase + metrics.width / 2 + 4
            : slide.textAlign === "right"
              ? xBase - metrics.width - 4
              : xBase + metrics.width + 4;
        ctx.fillStyle = "#e11d2e";
        ctx.fillRect(cx, cy - fs * 0.45, 3, fs * 0.9);
      }
    }
  } else {
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.fillStyle = slide.fontColor;
      ctx.fillText(line, xBase, y);
    });
  }

  ctx.restore();
}

// ── Small sub-components ─────────────────────────────────────────────────────

function SlideThumb({
  slide,
  index,
  active,
  onClick,
}: {
  slide: Slide;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-ocid={`t2v.slide_thumb.${index}`}
      onClick={onClick}
      className="w-full rounded-lg overflow-hidden text-left transition-all duration-150 relative shrink-0"
      style={{
        border: active
          ? "2px solid #e11d2e"
          : "1.5px solid rgba(255,255,255,0.1)",
        boxShadow: active ? "0 0 12px rgba(225,29,46,0.4)" : "none",
        background: slide.bgType === "solid" ? slide.bgColor : "#0d0d12",
        minHeight: 64,
      }}
    >
      <div className="p-2">
        <div className="text-[9px] font-bold mb-1" style={{ color: "#e11d2e" }}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <p className="text-[10px] font-semibold leading-tight line-clamp-2 text-white">
          {slide.text || "Empty slide"}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span
            className="text-[9px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {slide.animStyle}
          </span>
          <span
            className="text-[9px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {slide.duration}s
          </span>
        </div>
      </div>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-widest mb-2"
      style={{ color: "rgba(225,29,46,0.8)" }}
    >
      {children}
    </p>
  );
}

function Row({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div
        className="block text-xs font-medium mb-1.5"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TextToVideoEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [slides, setSlides] = useState<Slide[]>([
    makeSlide({
      text: "Your Story Starts Here",
      animStyle: "typewriter",
      bgGradient: GRADIENTS[5].value,
    }),
    makeSlide({
      text: "Create. Inspire. Share.",
      animStyle: "fade",
      bgGradient: GRADIENTS[0].value,
      fontColor: "#ff4455",
    }),
    makeSlide({
      text: "Made with FStudioX",
      animStyle: "zoom",
      bgGradient: GRADIENTS[1].value,
    }),
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [beatSync, setBeatSync] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [exportDone, setExportDone] = useState(false);

  const CANVAS_W = 360;
  const CANVAS_H = 640;

  const activeSlide = slides[activeIdx] ?? slides[0];

  const updateSlide = useCallback(
    (patch: Partial<Slide>) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === activeIdx ? { ...s, ...patch } : s)),
      );
    },
    [activeIdx],
  );

  const addSlide = () => {
    if (slides.length >= 10) return;
    const newSlide = makeSlide();
    setSlides((prev) => [...prev, newSlide]);
    setActiveIdx(slides.length);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => Math.max(0, Math.min(prev, slides.length - 2)));
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    setSlides((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
    setActiveIdx(newIdx);
  };

  const totalDuration = slides.reduce(
    (sum, s) => sum + s.duration + s.transitionDuration,
    0,
  );

  // Static preview render (non-playing)
  useEffect(() => {
    if (isPlaying || isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderSlideToCanvas(ctx, CANVAS_W, CANVAS_H, {
      slide: activeSlide,
      t: 0.6,
      transT: 0,
      nextSlide: null,
      phase: "hold",
    });
  }, [activeSlide, isPlaying, isRecording]);

  // Playback engine
  const startPlayback = useCallback(
    (onEnd?: () => void) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setIsPlaying(true);
      let startTime: number | null = null;
      let currentSlideIdx = 0;
      let slotStart = 0; // start time of current slot (slide + transition)

      const totalDur = slides.reduce(
        (sum, s) => sum + s.duration + s.transitionDuration,
        0,
      );

      const tick = (ts: number) => {
        if (!startTime) startTime = ts;
        const elapsed = (ts - startTime) / 1000;
        setPlayTime(elapsed);

        if (elapsed >= totalDur) {
          setIsPlaying(false);
          setPlayTime(0);
          // Final frame
          const lastSlide = slides[slides.length - 1];
          if (lastSlide)
            renderSlideToCanvas(ctx, CANVAS_W, CANVAS_H, {
              slide: lastSlide,
              t: 1,
              transT: 0,
              nextSlide: null,
              phase: "hold",
            });
          onEnd?.();
          return;
        }

        // Find current slide
        let accumulated = 0;
        let slideIdx = 0;
        for (let i = 0; i < slides.length; i++) {
          const slot = slides[i].duration + slides[i].transitionDuration;
          if (elapsed < accumulated + slot) {
            slideIdx = i;
            slotStart = accumulated;
            break;
          }
          accumulated += slot;
        }
        currentSlideIdx = slideIdx;
        const slide = slides[currentSlideIdx];
        const localTime = elapsed - slotStart;
        const inTransition = localTime > slide.duration;
        const transT = inTransition
          ? (localTime - slide.duration) / slide.transitionDuration
          : 0;
        const t = inTransition ? 1 : localTime / slide.duration;

        renderSlideToCanvas(ctx, CANVAS_W, CANVAS_H, {
          slide,
          t: Math.min(1, t),
          transT: Math.min(1, transT),
          nextSlide: slides[currentSlideIdx + 1] ?? null,
          phase: inTransition ? "out" : "hold",
        });

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [slides],
  );

  const stopPlayback = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
    setPlayTime(0);
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    startPlayback();
  };

  // Beat sync
  useEffect(() => {
    if (!beatSync || !selectedMusic) return;
    const bpm = selectedMusic.bpm;
    const beatInterval = 60 / bpm;
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        duration: Math.round(beatInterval * 4 * 10) / 10,
      })),
    );
  }, [beatSync, selectedMusic]);

  // Music preview
  const toggleMusicPlay = () => {
    if (!selectedMusic) return;
    if (musicPlaying) {
      audioRef.current?.pause();
      setMusicPlaying(false);
    } else {
      // Create a silent oscillator as placeholder since src is empty
      setMusicPlaying(true);
      setTimeout(() => setMusicPlaying(false), 2000);
    }
  };

  // Export as WebM
  const handleExport = async () => {
    if (isRecording || isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setRecordProgress(0);
    setExportDone(false);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = canvas.captureStream(30);
    } catch {
      setIsRecording(false);
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FStudioX_T2V_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setRecordProgress(100);
      setExportDone(true);
      setTimeout(() => {
        setExportDone(false);
        setRecordProgress(0);
      }, 3000);
    };

    recorder.start(100);

    // Progress tracking
    let startT = performance.now();
    const totalMs = totalDuration * 1000;
    const progressInterval = setInterval(() => {
      const p = Math.min(99, ((performance.now() - startT) / totalMs) * 100);
      setRecordProgress(Math.floor(p));
    }, 200);

    startPlayback(() => {
      clearInterval(progressInterval);
      setTimeout(() => recorder.stop(), 300);
    });
  };

  // BG image upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      updateSlide({ bgType: "image", bgImage: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  // Chip button helper
  const chipClass = (_active: boolean) =>
    "px-2.5 py-1 rounded-md text-xs font-semibold border transition-all duration-150 cursor-pointer select-none";
  const chipStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? "rgba(225,29,46,0.2)" : "rgba(255,255,255,0.05)",
    borderColor: active ? "#e11d2e" : "rgba(255,255,255,0.1)",
    color: active ? "#ff6b7a" : "rgba(255,255,255,0.55)",
  });

  return (
    <div
      data-ocid="t2v.editor"
      className="flex flex-col"
      style={{
        height: "100%",
        backgroundColor: "var(--fsx-bg-primary)",
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0 border-b"
        style={{
          backgroundColor: "var(--fsx-bg-surface)",
          borderColor: "var(--fsx-border)",
        }}
      >
        <Film size={16} style={{ color: "#e11d2e" }} />
        <span className="font-bold text-sm text-white mr-2 hidden sm:block">
          Text → Video
        </span>

        <div className="flex-1" />

        {/* Music selector */}
        <div className="flex items-center gap-1.5 mr-1">
          <Music2
            size={14}
            style={{
              color: selectedMusic ? "#e11d2e" : "rgba(255,255,255,0.4)",
            }}
          />
          <select
            data-ocid="t2v.music_select"
            value={selectedMusic?.id ?? ""}
            onChange={(e) => {
              const track =
                MUSIC_LIBRARY.find((t) => t.id === e.target.value) ?? null;
              setSelectedMusic(track);
            }}
            className="text-xs rounded-md px-2 py-1 outline-none cursor-pointer"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)",
              maxWidth: 140,
            }}
          >
            <option value="">No music</option>
            {MUSIC_LIBRARY.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
          {selectedMusic && (
            <button
              type="button"
              data-ocid="t2v.music_preview_btn"
              onClick={toggleMusicPlay}
              className="p-1 rounded transition-all"
              style={{
                color: musicPlaying ? "#e11d2e" : "rgba(255,255,255,0.5)",
              }}
              title={musicPlaying ? "Stop preview" : "Preview music"}
            >
              {musicPlaying ? <Square size={12} /> : <Play size={12} />}
            </button>
          )}
        </div>

        {/* Play */}
        <button
          type="button"
          data-ocid="t2v.preview_btn"
          onClick={handlePlay}
          disabled={isRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
          style={{
            backgroundColor: isPlaying
              ? "rgba(225,29,46,0.15)"
              : "rgba(225,29,46,0.85)",
            color: "white",
            border: "1px solid rgba(225,29,46,0.5)",
          }}
        >
          {isPlaying ? <Square size={12} /> : <Play size={12} />}
          {isPlaying ? "Stop" : "Preview"}
        </button>

        {/* Export */}
        <button
          type="button"
          data-ocid="t2v.export_btn"
          onClick={handleExport}
          disabled={isPlaying || isRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
          style={{
            backgroundColor: exportDone
              ? "rgba(34,197,94,0.2)"
              : "rgba(255,255,255,0.08)",
            color: exportDone ? "#4ade80" : "rgba(255,255,255,0.85)",
            border: `1px solid ${exportDone ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}`,
          }}
        >
          {isRecording ? (
            <Loader2 size={12} className="animate-spin" />
          ) : exportDone ? (
            <Check size={12} />
          ) : (
            <Download size={12} />
          )}
          {isRecording
            ? `${recordProgress}%`
            : exportDone
              ? "Saved!"
              : "Export"}
        </button>
      </div>

      {/* Export progress bar */}
      {isRecording && (
        <div
          className="h-1 shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${recordProgress}%`,
              backgroundColor: "#e11d2e",
              boxShadow: "0 0 8px rgba(225,29,46,0.6)",
            }}
          />
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* ── Left Sidebar: Slides ── */}
        <div
          className="flex flex-col shrink-0 border-r transition-all duration-200"
          style={{
            width: sidebarOpen ? 140 : 32,
            backgroundColor: "var(--fsx-bg-surface)",
            borderColor: "var(--fsx-border)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            data-ocid="t2v.sidebar_toggle"
            onClick={() => setSidebarOpen((p) => !p)}
            className="flex items-center justify-center h-8 shrink-0 border-b hover:bg-white/5 transition-colors"
            style={{ borderColor: "var(--fsx-border)" }}
            title={sidebarOpen ? "Collapse slides" : "Expand slides"}
          >
            {sidebarOpen ? (
              <ChevronLeft
                size={14}
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
            ) : (
              <ChevronRight
                size={14}
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
            )}
          </button>

          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-0">
              {slides.map((slide, i) => (
                <div key={slide.id} className="relative group">
                  <SlideThumb
                    slide={slide}
                    index={i}
                    active={i === activeIdx}
                    onClick={() => setActiveIdx(i)}
                  />
                  {slides.length > 1 && (
                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveSlide(i, -1)}
                        disabled={i === 0}
                        className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30"
                        title="Move up"
                        aria-label="Move slide up"
                      >
                        <MoveUp size={9} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(i, 1)}
                        disabled={i === slides.length - 1}
                        className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30"
                        title="Move down"
                        aria-label="Move slide down"
                      >
                        <MoveDown size={9} />
                      </button>
                      <button
                        type="button"
                        data-ocid={`t2v.delete_slide.${i}`}
                        onClick={() => deleteSlide(i)}
                        className="p-0.5 rounded hover:bg-red-900/50"
                        title="Delete slide"
                        aria-label="Delete slide"
                      >
                        <Trash2 size={9} style={{ color: "#ff6b7a" }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {slides.length < 10 && (
                <button
                  type="button"
                  data-ocid="t2v.add_slide_btn"
                  onClick={addSlide}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold border border-dashed transition-all hover:border-red-500/50 hover:bg-red-950/20"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <Plus size={12} />
                  Add Slide
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Center: Canvas ── */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden p-3 gap-3">
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl"
            style={{
              boxShadow:
                "0 0 40px rgba(225,29,46,0.15), 0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              data-ocid="t2v.preview_canvas"
              style={{
                display: "block",
                maxHeight: "calc(100vh - 260px)",
                maxWidth: "100%",
                aspectRatio: "9/16",
                width: "auto",
                height: "auto",
              }}
            />
          </div>

          {/* Playback bar */}
          <div className="w-full max-w-xs">
            <div
              className="flex items-center justify-between text-[10px] mb-1"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <span>{playTime.toFixed(1)}s</span>
              <span>
                {totalDuration.toFixed(1)}s total · {slides.length} slides
              </span>
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${totalDuration > 0 ? Math.min(100, (playTime / totalDuration) * 100) : 0}%`,
                  backgroundColor: "#e11d2e",
                  boxShadow: "0 0 6px rgba(225,29,46,0.6)",
                }}
              />
            </div>
            <p
              className="text-[9px] text-center mt-1.5"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Exports as WebM/MP4 depending on your browser
            </p>
          </div>
        </div>

        {/* ── Right Panel: Settings ── */}
        <div
          className="flex flex-col shrink-0 border-l transition-all duration-200"
          style={{
            width: rightOpen ? 220 : 32,
            backgroundColor: "var(--fsx-bg-surface)",
            borderColor: "var(--fsx-border)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            data-ocid="t2v.rightpanel_toggle"
            onClick={() => setRightOpen((p) => !p)}
            className="flex items-center justify-center h-8 shrink-0 border-b hover:bg-white/5 transition-colors"
            style={{ borderColor: "var(--fsx-border)" }}
            title={rightOpen ? "Collapse settings" : "Expand settings"}
          >
            {rightOpen ? (
              <ChevronRight
                size={14}
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
            ) : (
              <ChevronLeft
                size={14}
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
            )}
          </button>

          {rightOpen && (
            <div
              className="flex-1 overflow-y-auto p-3 min-h-0 text-xs"
              style={{ scrollbarWidth: "thin" }}
            >
              {/* Text content */}
              <div className="mb-4">
                <SectionLabel>Text Content</SectionLabel>
                <textarea
                  data-ocid="t2v.slide_text_input"
                  value={activeSlide.text}
                  onChange={(e) => updateSlide({ text: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-2.5 py-2 text-xs resize-none outline-none"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    fontFamily: activeSlide.fontFamily,
                  }}
                  placeholder="Type your text here..."
                />
              </div>

              {/* Animation */}
              <div className="mb-4">
                <SectionLabel>Animation</SectionLabel>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      "typewriter",
                      "fade",
                      "slidein",
                      "bounce",
                      "zoom",
                    ] as AnimStyle[]
                  ).map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={chipClass(activeSlide.animStyle === a)}
                      style={chipStyle(activeSlide.animStyle === a)}
                      onClick={() => updateSlide({ animStyle: a })}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                {activeSlide.animStyle === "slidein" && (
                  <div className="flex gap-1.5 mt-1">
                    {(["left", "right", "bottom"] as SlideDir[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={chipClass(activeSlide.slideDir === d)}
                        style={chipStyle(activeSlide.slideDir === d)}
                        onClick={() => updateSlide({ slideDir: d })}
                      >
                        ↙ {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Typography */}
              <div className="mb-4">
                <SectionLabel>Typography</SectionLabel>
                <Row label="Font">
                  <select
                    data-ocid="t2v.font_select"
                    value={activeSlide.fontFamily}
                    onChange={(e) =>
                      updateSlide({ fontFamily: e.target.value })
                    }
                    className="w-full rounded-md px-2 py-1 outline-none text-xs"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Row>
                <Row label={`Size: ${activeSlide.fontSize}px`}>
                  <input
                    data-ocid="t2v.font_size_slider"
                    type="range"
                    min={24}
                    max={120}
                    value={activeSlide.fontSize}
                    onChange={(e) =>
                      updateSlide({ fontSize: Number(e.target.value) })
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#e11d2e" }}
                  />
                </Row>
                <Row label="Color">
                  <input
                    data-ocid="t2v.font_color_input"
                    type="color"
                    value={activeSlide.fontColor}
                    onChange={(e) => updateSlide({ fontColor: e.target.value })}
                    className="w-full h-8 rounded-md cursor-pointer"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </Row>
                <Row label="Alignment">
                  <div className="flex gap-1.5">
                    {(
                      [
                        ["left", "left"],
                        ["center", "center"],
                        ["right", "right"],
                      ] as [TextAlign, string][]
                    ).map(([v, _]) => (
                      <button
                        key={v}
                        type="button"
                        className={chipClass(activeSlide.textAlign === v)}
                        style={{
                          ...chipStyle(activeSlide.textAlign === v),
                          flex: 1,
                        }}
                        onClick={() => updateSlide({ textAlign: v })}
                      >
                        {v === "left" ? (
                          <AlignLeft size={12} />
                        ) : v === "center" ? (
                          <AlignCenter size={12} />
                        ) : (
                          <AlignRight size={12} />
                        )}
                      </button>
                    ))}
                  </div>
                </Row>
              </div>

              {/* Background */}
              <div className="mb-4">
                <SectionLabel>Background</SectionLabel>
                <div className="flex gap-1.5 mb-3">
                  {(["solid", "gradient", "image"] as BgType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={chipClass(activeSlide.bgType === t)}
                      style={{
                        ...chipStyle(activeSlide.bgType === t),
                        flex: 1,
                      }}
                      onClick={() => updateSlide({ bgType: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {activeSlide.bgType === "solid" && (
                  <input
                    data-ocid="t2v.bg_color_input"
                    type="color"
                    value={activeSlide.bgColor}
                    onChange={(e) => updateSlide({ bgColor: e.target.value })}
                    className="w-full h-8 rounded-md cursor-pointer"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                )}
                {activeSlide.bgType === "gradient" && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {GRADIENTS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => updateSlide({ bgGradient: g.value })}
                        className="h-10 rounded-md border transition-all"
                        style={{
                          background: g.value,
                          borderColor:
                            activeSlide.bgGradient === g.value
                              ? "#e11d2e"
                              : "rgba(255,255,255,0.1)",
                          boxShadow:
                            activeSlide.bgGradient === g.value
                              ? "0 0 8px rgba(225,29,46,0.5)"
                              : "none",
                        }}
                        title={g.label}
                        aria-label={g.label}
                      />
                    ))}
                  </div>
                )}
                {activeSlide.bgType === "image" && (
                  <label
                    className="flex flex-col items-center justify-center w-full h-16 rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:border-red-500/50"
                    style={{
                      borderColor: "rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <span className="text-[10px]">Upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBgImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* Duration */}
              <div className="mb-4">
                <SectionLabel>Slide Duration</SectionLabel>
                <Row label={`Duration: ${activeSlide.duration}s`}>
                  <input
                    data-ocid="t2v.duration_slider"
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={activeSlide.duration}
                    onChange={(e) =>
                      updateSlide({ duration: Number(e.target.value) })
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#e11d2e" }}
                  />
                </Row>
              </div>

              {/* Transition */}
              <div className="mb-4">
                <SectionLabel>Transition to Next</SectionLabel>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      "fade",
                      "blur",
                      "wipe",
                      "cut",
                      "bounce",
                    ] as TransitionType[]
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={chipClass(activeSlide.transition === t)}
                      style={chipStyle(activeSlide.transition === t)}
                      onClick={() => updateSlide({ transition: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {activeSlide.transition !== "cut" && (
                  <Row label={`Speed: ${activeSlide.transitionDuration}s`}>
                    <input
                      data-ocid="t2v.transition_dur_slider"
                      type="range"
                      min={0.3}
                      max={1}
                      step={0.1}
                      value={activeSlide.transitionDuration}
                      onChange={(e) =>
                        updateSlide({
                          transitionDuration: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: "#e11d2e" }}
                    />
                  </Row>
                )}
              </div>

              {/* Beat sync */}
              {selectedMusic && (
                <div
                  className="mb-4 p-2.5 rounded-lg"
                  style={{
                    backgroundColor: "rgba(225,29,46,0.08)",
                    border: "1px solid rgba(225,29,46,0.2)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-semibold"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      Beat Sync
                    </span>
                    <button
                      type="button"
                      data-ocid="t2v.beat_sync_toggle"
                      onClick={() => setBeatSync((p) => !p)}
                      className="w-9 h-5 rounded-full transition-colors relative"
                      style={{
                        backgroundColor: beatSync
                          ? "#e11d2e"
                          : "rgba(255,255,255,0.1)",
                      }}
                      aria-pressed={beatSync}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: beatSync ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>
                    Syncs slide durations to {selectedMusic.bpm} BPM beats
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
