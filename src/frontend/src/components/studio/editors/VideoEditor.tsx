import {
  Activity,
  ChevronDown,
  Cpu,
  Crop,
  Download,
  Eye,
  EyeOff,
  FastForward,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Scissors,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AIVideoTab, { type SceneMarker } from "./tabs/AIVideoTab";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatTimeFull(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
}

/* ─── constants ────────────────────────────────────────────────────────────── */
const FILTER_PRESETS = [
  { id: "original", label: "Original", filter: "none", color: "#888" },
  {
    id: "warm",
    label: "Warm",
    filter: "sepia(0.3) saturate(1.4) brightness(1.05)",
    color: "#f4a261",
  },
  {
    id: "cool",
    label: "Cool",
    filter: "hue-rotate(180deg) saturate(0.8)",
    color: "#4ecdc4",
  },
  { id: "bw", label: "B&W", filter: "grayscale(1)", color: "#aaa" },
  {
    id: "vintage",
    label: "Vintage",
    filter: "sepia(0.5) contrast(1.2) brightness(0.9)",
    color: "#c9a96e",
  },
  {
    id: "clarendon",
    label: "Clarendon",
    filter: "contrast(1.2) saturate(1.35)",
    color: "#5fa8d3",
  },
  {
    id: "juno",
    label: "Juno",
    filter: "saturate(1.8) contrast(0.9)",
    color: "#f9c74f",
  },
  {
    id: "lark",
    label: "Lark",
    filter: "brightness(1.1) contrast(0.9) saturate(1.1)",
    color: "#b7e4c7",
  },
  {
    id: "fade",
    label: "Fade",
    filter: "opacity(0.8) brightness(1.1)",
    color: "#ccc",
  },
  {
    id: "vivid",
    label: "Vivid",
    filter: "saturate(1.8) contrast(1.1)",
    color: "#e63946",
  },
  {
    id: "muted",
    label: "Muted",
    filter: "saturate(0.6) brightness(1.05)",
    color: "#6b7280",
  },
  {
    id: "retro",
    label: "Retro",
    filter: "sepia(0.7) contrast(1.1) hue-rotate(-10deg)",
    color: "#d4a373",
  },
  {
    id: "neon",
    label: "Neon",
    filter: "saturate(2) brightness(1.2) contrast(1.3) hue-rotate(30deg)",
    color: "#06d6a0",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    filter: "contrast(1.4) brightness(0.85) saturate(0.9)",
    color: "#264653",
  },
  {
    id: "dreamy",
    label: "Dreamy",
    filter: "brightness(1.15) blur(0.5px) saturate(1.2)",
    color: "#c77dff",
  },
  {
    id: "summer",
    label: "Summer",
    filter: "saturate(1.4) brightness(1.1) hue-rotate(10deg)",
    color: "#f4d35e",
  },
  {
    id: "moody",
    label: "Moody",
    filter: "contrast(1.3) brightness(0.8) saturate(0.7)",
    color: "#3d405b",
  },
  {
    id: "dark",
    label: "Dark",
    filter: "brightness(0.65) contrast(1.4) saturate(0.8)",
    color: "#222",
  },
  {
    id: "sunset",
    label: "Sunset",
    filter: "sepia(0.4) hue-rotate(-20deg) saturate(1.6)",
    color: "#f77f00",
  },
  {
    id: "glitch",
    label: "Glitch",
    filter: "hue-rotate(90deg) saturate(2) contrast(1.5)",
    color: "#ff2d78",
  },
];

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

const SPEED_CURVES = [
  {
    id: "slow",
    label: "Slow",
    description: "Smooth slow motion",
    rate: 0.5,
    icon: "🐢",
    svg: "M 0 20 C 10 20, 20 18, 40 10",
  },
  {
    id: "normal",
    label: "Normal",
    description: "Natural playback",
    rate: 1.0,
    icon: "🚶",
    svg: "M 0 20 L 40 0",
  },
  {
    id: "fast",
    label: "Fast",
    description: "Quick timelapse",
    rate: 2.0,
    icon: "🏃",
    svg: "M 0 20 C 20 18, 30 5, 40 0",
  },
];

const EMOJI_STICKERS = [
  "🎬",
  "🎵",
  "🔥",
  "⭐",
  "💫",
  "✨",
  "🎉",
  "🎊",
  "❤️",
  "🌟",
  "💥",
  "🎯",
  "🎨",
  "🌈",
  "🦋",
  "🌺",
  "🏆",
  "💎",
  "🚀",
  "🎪",
  "😍",
  "🥰",
  "😎",
  "🤩",
  "🎭",
  "🌙",
  "☀️",
  "💜",
  "🎸",
  "📸",
  "🍀",
  "🌊",
  "⚡",
  "🎀",
  "🦄",
  "🎮",
  "🌸",
  "💖",
  "🔮",
  "🎲",
];

const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
] as const;
type BlendMode = (typeof BLEND_MODES)[number];

const QUALITY_OPTIONS = [
  { label: "360p", value: "360p" },
  { label: "480p", value: "480p" },
  { label: "720p HD", value: "720p" },
  { label: "1080p FHD", value: "1080p" },
];

const ASPECT_RATIOS = [
  { label: "Free", value: "free", w: 0, h: 0 },
  { label: "1:1", value: "1:1", w: 1, h: 1 },
  { label: "4:3", value: "4:3", w: 4, h: 3 },
  { label: "16:9", value: "16:9", w: 16, h: 9 },
  { label: "9:16", value: "9:16", w: 9, h: 16 },
  { label: "3:4", value: "3:4", w: 3, h: 4 },
];

const OVERLAY_FONTS = [
  "Default",
  "Impact",
  "Georgia",
  "Courier New",
  "Arial Black",
  "Trebuchet MS",
  "Verdana",
  "Comic Sans MS",
  "Palatino",
  "Tahoma",
];

/* ─── types ────────────────────────────────────────────────────────────────── */
type Tab =
  | "trim"
  | "crop"
  | "filters"
  | "adjust"
  | "text"
  | "overlays"
  | "volume"
  | "export"
  | "ai";

type Adjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  exposure: number;
  shadows: number;
  highlights: number;
  blur: number;
  sharpen: number;
};

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  exposure: 0,
  shadows: 0,
  highlights: 0,
  blur: 0,
  sharpen: 0,
};

type CropRect = { x: number; y: number; w: number; h: number };

type TextOverlay = {
  id: string;
  type: "text" | "emoji";
  content: string;
  fontSize: number;
  color: string;
  opacity: number;
  x: number;
  y: number;
  blendMode: BlendMode;
  visible: boolean;
  fontFamily?: string;
};

type Segment = { start: number; end: number; label: string };

type EditState = {
  filter: string;
  adjustments: Adjustments;
  trimStart: number;
  trimEnd: number;
  overlays: TextOverlay[];
  cropRect: CropRect;
  cropActive: boolean;
  segments: Segment[];
  isReversed: boolean;
};

const DEFAULT_CROP: CropRect = { x: 10, y: 10, w: 80, h: 80 };

/* ─── main component ───────────────────────────────────────────────────────── */
export default function VideoEditor() {
  /* video state */
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [customSpeed, setCustomSpeed] = useState(1);
  const [exportQuality, setExportQuality] = useState("720p");
  const [isReversed, setIsReversed] = useState(false);
  const [activeCurve, setActiveCurve] = useState("normal");

  /* editing state */
  const [activeFilter, setActiveFilter] = useState("original");
  const [adjustments, setAdjustments] = useState<Adjustments>({
    ...DEFAULT_ADJUSTMENTS,
  });
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [segments, setSegments] = useState<Segment[]>([]);

  /* crop state */
  const [cropRect, setCropRect] = useState<CropRect>({ ...DEFAULT_CROP });
  const [cropActive, setCropActive] = useState(false);
  const [cropAspect, setCropAspect] = useState("free");
  const cropDragRef = useRef<{
    type: "move" | "tl" | "tr" | "bl" | "br" | "l" | "r" | "t" | "b";
    startX: number;
    startY: number;
    startRect: CropRect;
  } | null>(null);

  /* fullscreen + export modal */
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  /* overlays */
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null,
  );
  const [newTextInput, setNewTextInput] = useState("");
  const [newTextFont, setNewTextFont] = useState("Default");
  const [newTextSize, setNewTextSize] = useState(28);
  const [newTextColor, setNewTextColor] = useState("#ffffff");
  const [newTextPosX, setNewTextPosX] = useState(50);
  const [newTextPosY, setNewTextPosY] = useState(80);

  /* timeline drag */
  const [draggingHandle, setDraggingHandle] = useState<
    "start" | "end" | "playhead" | null
  >(null);
  const [showStartLabel, setShowStartLabel] = useState(false);
  const [showEndLabel, setShowEndLabel] = useState(false);

  /* undo/redo */
  const [history, setHistory] = useState<EditState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<EditState[]>([]);
  const historyIndexRef = useRef(-1);

  /* tabs */
  const [activeTab, setActiveTab] = useState<Tab>("trim");

  /* AI tools state */
  const [aiSceneMarkers, setAiSceneMarkers] = useState<SceneMarker[]>([]);
  const [aiStabilizeActive, setAiStabilizeActive] = useState(false);
  const [aiGradeFilter, setAiGradeFilter] = useState("none");

  const videoRef = useRef<HTMLVideoElement>(null);
  const fsVideoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trimIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoFileRef = useRef<File | null>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const exportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── computed filter ──────────────────────────────────────────────────── */
  const getComputedFilter = useCallback((): string => {
    const preset = FILTER_PRESETS.find((f) => f.id === activeFilter);
    const b = 1 + (adjustments.brightness + adjustments.exposure * 0.5) / 100;
    const c = 1 + (adjustments.contrast + adjustments.highlights * 0.3) / 100;
    const s = 1 + adjustments.saturation / 100;
    const blurVal =
      adjustments.blur > 0 ? `blur(${(adjustments.blur / 100) * 5}px)` : "";
    const adj = `brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)}) saturate(${s.toFixed(3)}) ${blurVal}`;
    const base =
      preset?.filter && preset.filter !== "none"
        ? `${preset.filter} ${adj}`
        : adj;
    // Apply AI grade on top if set
    const withGrade =
      aiGradeFilter && aiGradeFilter !== "none"
        ? `${base.trim()} ${aiGradeFilter}`
        : base.trim();
    return withGrade.trim();
  }, [activeFilter, adjustments, aiGradeFilter]);

  const getCropClipPath = useCallback((): string => {
    if (!cropActive) return "none";
    const { x, y, w, h } = cropRect;
    return `inset(${y}% ${100 - x - w}% ${100 - y - h}% ${x}%)`;
  }, [cropActive, cropRect]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.filter = getComputedFilter();
      videoRef.current.style.clipPath = getCropClipPath();
    }
  }, [getComputedFilter, getCropClipPath]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  /* sync fullscreen video */
  useEffect(() => {
    if (!isFullscreen || !fsVideoRef.current || !videoUrl) return;
    fsVideoRef.current.src = videoUrl;
    fsVideoRef.current.currentTime = currentTime;
    fsVideoRef.current.volume = volume / 100;
    fsVideoRef.current.muted = isMuted;
    fsVideoRef.current.playbackRate = playbackSpeed;
    fsVideoRef.current.style.filter = getComputedFilter();
  }, [
    isFullscreen,
    videoUrl,
    currentTime,
    volume,
    isMuted,
    playbackSpeed,
    getComputedFilter,
  ]);

  /* ─── history ──────────────────────────────────────────────────────────── */
  const captureState = useCallback(
    (): EditState => ({
      filter: activeFilter,
      adjustments: { ...adjustments },
      trimStart,
      trimEnd,
      overlays: overlays.map((o) => ({ ...o })),
      cropRect: { ...cropRect },
      cropActive,
      segments: segments.map((s) => ({ ...s })),
      isReversed,
    }),
    [
      activeFilter,
      adjustments,
      trimStart,
      trimEnd,
      overlays,
      cropRect,
      cropActive,
      segments,
      isReversed,
    ],
  );

  const pushHistory = useCallback((state: EditState) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(state);
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setHistory([...newHistory]);
    setHistoryIndex(newHistory.length - 1);
  }, []);

  const restoreState = useCallback((state: EditState) => {
    setActiveFilter(state.filter);
    setAdjustments({ ...state.adjustments });
    setTrimStart(state.trimStart);
    setTrimEnd(state.trimEnd);
    setOverlays(state.overlays.map((o) => ({ ...o })));
    setCropRect({ ...state.cropRect });
    setCropActive(state.cropActive);
    setSegments(state.segments.map((s) => ({ ...s })));
    setIsReversed(state.isReversed);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const idx = historyIndexRef.current - 1;
    historyIndexRef.current = idx;
    setHistoryIndex(idx);
    restoreState(historyRef.current[idx]);
  }, [restoreState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const idx = historyIndexRef.current + 1;
    historyIndexRef.current = idx;
    setHistoryIndex(idx);
    restoreState(historyRef.current[idx]);
  }, [restoreState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, isFullscreen]);

  /* ─── file loading ─────────────────────────────────────────────────────── */
  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    videoFileRef.current = file;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    setTrimStart(0);
    setTrimEnd(100);
    setActiveFilter("original");
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    setOverlays([]);
    setPlaybackSpeed(1);
    setCustomSpeed(1);
    setCropRect({ ...DEFAULT_CROP });
    setCropActive(false);
    setSegments([]);
    setIsReversed(false);
    setHistoryIndex(-1);
    historyRef.current = [];
    setHistory([]);
    setActiveTab("trim");
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

  /* ─── playback ─────────────────────────────────────────────────────────── */
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipBack = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, currentTime - 5);
  };
  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, currentTime + 5);
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  /* ─── split at playhead ────────────────────────────────────────────────── */
  const splitAtPlayhead = () => {
    if (duration === 0) return;
    const pct = (currentTime / duration) * 100;
    if (pct <= trimStart + 1 || pct >= trimEnd - 1) return;
    const trimStartSec = (trimStart / 100) * duration;
    const trimEndSec = (trimEnd / 100) * duration;
    const newSegments: Segment[] = [
      {
        start: trimStartSec,
        end: currentTime,
        label: `Clip A: ${formatTime(trimStartSec)}–${formatTime(currentTime)}`,
      },
      {
        start: currentTime,
        end: trimEndSec,
        label: `Clip B: ${formatTime(currentTime)}–${formatTime(trimEndSec)}`,
      },
    ];
    setSegments(newSegments);
    pushHistory({ ...captureState(), segments: newSegments });
  };

  /* ─── reverse toggle ────────────────────────────────────────────────────── */
  const toggleReverse = () => {
    const next = !isReversed;
    setIsReversed(next);
    pushHistory({ ...captureState(), isReversed: next });
  };

  /* ─── timeline ─────────────────────────────────────────────────────────── */
  const getTimelinePercent = useCallback((clientX: number): number => {
    const el = timelineRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
  }, []);

  const handleTimelineMouseDown = (
    e: React.MouseEvent,
    handle: "start" | "end" | "playhead",
  ) => {
    e.preventDefault();
    setDraggingHandle(handle);
    if (handle === "start") setShowStartLabel(true);
    if (handle === "end") setShowEndLabel(true);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingHandle) return;
    const pct = getTimelinePercent(e.clientX);
    const t = (pct / 100) * duration;
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  useEffect(() => {
    if (!draggingHandle) return;
    const onMove = (e: MouseEvent) => {
      const pct = getTimelinePercent(e.clientX);
      if (draggingHandle === "start") setTrimStart(Math.min(pct, trimEnd - 2));
      else if (draggingHandle === "end")
        setTrimEnd(Math.max(pct, trimStart + 2));
      else if (draggingHandle === "playhead") {
        const t = (pct / 100) * duration;
        setCurrentTime(t);
        if (videoRef.current) videoRef.current.currentTime = t;
      }
    };
    const onUp = () => {
      setDraggingHandle(null);
      setShowStartLabel(false);
      setShowEndLabel(false);
      pushHistory(captureState());
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [
    draggingHandle,
    trimStart,
    trimEnd,
    duration,
    captureState,
    pushHistory,
    getTimelinePercent,
  ]);

  /* ─── playback loop (trim) ─────────────────────────────────────────────── */
  const playTrimmed = () => {
    if (!videoRef.current || duration === 0) return;
    const startSec = (trimStart / 100) * duration;
    const endSec = (trimEnd / 100) * duration;
    videoRef.current.currentTime = startSec;
    videoRef.current.play();
    setIsPlaying(true);
    if (trimIntervalRef.current) clearInterval(trimIntervalRef.current);
    trimIntervalRef.current = setInterval(() => {
      if (!videoRef.current) return;
      if (videoRef.current.currentTime >= endSec) {
        videoRef.current.pause();
        setIsPlaying(false);
        clearInterval(trimIntervalRef.current!);
      }
    }, 100);
  };

  /* ─── export modal simulation ───────────────────────────────────────────── */
  const startExport = () => {
    setShowExportModal(true);
    setExportProgress(0);
    setExportDone(false);
    setIsExporting(true);
    let progress = 0;
    if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
    exportIntervalRef.current = setInterval(() => {
      progress += Math.random() * 12 + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(exportIntervalRef.current!);
        setExportProgress(100);
        setIsExporting(false);
        setExportDone(true);
        // Trigger actual download after "processing"
        setTimeout(() => {
          const file = videoFileRef.current;
          const url = videoUrl;
          if (file && url) {
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
          }
        }, 500);
      } else {
        setExportProgress(Math.round(progress));
      }
    }, 200);
  };

  /* ─── crop drag ────────────────────────────────────────────────────────── */
  const handleCropMouseDown = (
    e: React.MouseEvent,
    type: "move" | "tl" | "tr" | "bl" | "br" | "l" | "r" | "t" | "b",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    cropDragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!cropDragRef.current || !previewAreaRef.current) return;
      const { type, startX, startY, startRect } = cropDragRef.current;
      const rect = previewAreaRef.current.getBoundingClientRect();
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      let { x, y, w, h } = startRect;
      const selectedAspect = ASPECT_RATIOS.find((a) => a.value === cropAspect);
      if (type === "move") {
        x = Math.max(0, Math.min(100 - w, startRect.x + dx));
        y = Math.max(0, Math.min(100 - h, startRect.y + dy));
      } else {
        if (type === "l" || type === "tl" || type === "bl") {
          const newX = Math.max(
            0,
            Math.min(startRect.x + startRect.w - 5, startRect.x + dx),
          );
          w = startRect.w - (newX - startRect.x);
          x = newX;
        }
        if (type === "r" || type === "tr" || type === "br") {
          w = Math.max(5, Math.min(100 - startRect.x, startRect.w + dx));
        }
        if (type === "t" || type === "tl" || type === "tr") {
          const newY = Math.max(
            0,
            Math.min(startRect.y + startRect.h - 5, startRect.y + dy),
          );
          h = startRect.h - (newY - startRect.y);
          y = newY;
        }
        if (type === "b" || type === "bl" || type === "br") {
          h = Math.max(5, Math.min(100 - startRect.y, startRect.h + dy));
        }
        if (selectedAspect && selectedAspect.w > 0) {
          const ar = selectedAspect.w / selectedAspect.h;
          if (["r", "l", "tr", "tl", "br", "bl"].includes(type)) h = w / ar;
        }
      }
      setCropRect({ x, y, w, h });
    };
    const onUp = () => {
      if (!cropDragRef.current) return;
      cropDragRef.current = null;
      pushHistory(captureState());
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [cropAspect, captureState, pushHistory]);

  const applyCropAspectRatio = (aspectValue: string) => {
    setCropAspect(aspectValue);
    const ar = ASPECT_RATIOS.find((a) => a.value === aspectValue);
    if (!ar || ar.w === 0) return;
    const ratio = ar.w / ar.h;
    const newW = 70;
    const newH = newW / ratio;
    const newX = (100 - newW) / 2;
    const newY = (100 - newH) / 2;
    setCropRect({ x: newX, y: newY, w: newW, h: Math.min(newH, 100 - newY) });
  };

  /* ─── overlays ─────────────────────────────────────────────────────────── */
  const addTextOverlay = () => {
    if (!newTextInput.trim()) return;
    const overlay: TextOverlay = {
      id: `ov_${Date.now()}`,
      type: "text",
      content: newTextInput.trim(),
      fontSize: newTextSize,
      color: newTextColor,
      opacity: 100,
      x: newTextPosX,
      y: newTextPosY,
      blendMode: "normal",
      visible: true,
      fontFamily: newTextFont === "Default" ? undefined : newTextFont,
    };
    const next = [...overlays, overlay];
    setOverlays(next);
    setSelectedOverlayId(overlay.id);
    setNewTextInput("");
    pushHistory({ ...captureState(), overlays: next });
  };

  const addEmojiOverlay = (emoji: string) => {
    const overlay: TextOverlay = {
      id: `ov_${Date.now()}`,
      type: "emoji",
      content: emoji,
      fontSize: 40,
      color: "#ffffff",
      opacity: 100,
      x: 50,
      y: 50,
      blendMode: "normal",
      visible: true,
    };
    const next = [...overlays, overlay];
    setOverlays(next);
    setSelectedOverlayId(overlay.id);
    pushHistory({ ...captureState(), overlays: next });
  };

  const updateOverlay = (id: string, patch: Partial<TextOverlay>) => {
    setOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  };

  const deleteOverlay = (id: string) => {
    const next = overlays.filter((o) => o.id !== id);
    setOverlays(next);
    if (selectedOverlayId === id) setSelectedOverlayId(null);
    pushHistory({ ...captureState(), overlays: next });
  };

  const toggleOverlayVisibility = (id: string) => {
    updateOverlay(id, { visible: !overlays.find((o) => o.id === id)?.visible });
  };

  const moveOverlayUp = (id: string) => {
    const idx = overlays.findIndex((o) => o.id === id);
    if (idx <= 0) return;
    const next = [...overlays];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setOverlays(next);
    pushHistory({ ...captureState(), overlays: next });
  };

  const moveOverlayDown = (id: string) => {
    const idx = overlays.findIndex((o) => o.id === id);
    if (idx >= overlays.length - 1) return;
    const next = [...overlays];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setOverlays(next);
    pushHistory({ ...captureState(), overlays: next });
  };

  const selectedOverlay =
    overlays.find((o) => o.id === selectedOverlayId) ?? null;

  /* ─── render helpers ───────────────────────────────────────────────────── */
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimmedDuration =
    duration > 0 ? ((trimEnd - trimStart) / 100) * duration : 0;
  const trimStartSec = (trimStart / 100) * duration;
  const trimEndSec = (trimEnd / 100) * duration;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "trim", label: "Trim", icon: <Scissors size={11} /> },
    { id: "filters", label: "Filters", icon: <Sparkles size={11} /> },
    { id: "adjust", label: "Adjust", icon: <Sliders size={11} /> },
    { id: "crop", label: "Crop", icon: <Crop size={11} /> },
    { id: "text", label: "Text", icon: <Activity size={11} /> },
    { id: "overlays", label: "Overlays", icon: <Layers size={11} /> },
    { id: "volume", label: "Volume", icon: <Volume2 size={11} /> },
    { id: "export", label: "Export", icon: <Download size={11} /> },
    { id: "ai", label: "AI Tools", icon: <Cpu size={11} /> },
  ];

  /* ── Overlays renderer ── */
  const renderOverlays = () =>
    overlays
      .filter((o) => o.visible)
      .map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setSelectedOverlayId(o.id)}
          className="absolute pointer-events-auto cursor-pointer select-none bg-transparent border-0 p-0"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: `${o.fontSize}px`,
            color: o.color,
            opacity: o.opacity / 100,
            mixBlendMode: o.blendMode,
            fontFamily: o.fontFamily ?? undefined,
            textShadow:
              o.type === "text" ? "0 1px 4px rgba(0,0,0,0.8)" : "none",
            fontWeight: 700,
            outline:
              selectedOverlayId === o.id
                ? "2px solid var(--fsx-accent)"
                : "none",
            outlineOffset: "4px",
            borderRadius: "4px",
            padding: "2px 4px",
            zIndex: 10,
          }}
        >
          {o.content}
        </button>
      ));

  return (
    <>
      {/* ═══════════════════ EXPORT MODAL ═════════════════════════════════════ */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => {
            if (!isExporting) setShowExportModal(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !isExporting) setShowExportModal(false);
          }}
          aria-label="Export Video backdrop"
          tabIndex={-1}
        >
          <div
            className="rounded-2xl p-6 w-80 max-w-[90vw]"
            style={{
              backgroundColor: "var(--fsx-bg-elevated)",
              border: "1px solid var(--fsx-border)",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-base">Export Video</h3>
              {!isExporting && (
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--fsx-bg-surface)",
                    color: "var(--fsx-text-muted)",
                  }}
                  aria-label="Close"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quality selector */}
            {!isExporting && !exportDone && (
              <>
                <p
                  className="text-xs mb-3"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  Select export quality:
                </p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => setExportQuality(q.value)}
                      className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        backgroundColor:
                          exportQuality === q.value
                            ? "var(--fsx-accent)"
                            : "var(--fsx-bg-surface)",
                        color:
                          exportQuality === q.value
                            ? "white"
                            : "var(--fsx-text-secondary)",
                        border:
                          exportQuality === q.value
                            ? "1px solid var(--fsx-accent)"
                            : "1px solid var(--fsx-border)",
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <div
                  className="rounded-xl p-3 mb-4"
                  style={{
                    backgroundColor: "var(--fsx-bg-surface)",
                    border: "1px solid var(--fsx-border)",
                  }}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--fsx-text-muted)" }}>
                      Duration
                    </span>
                    <span className="font-mono text-white">
                      {formatTime(trimmedDuration)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--fsx-text-muted)" }}>
                      Quality
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--fsx-accent)" }}
                    >
                      {exportQuality}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="video_editor.export.start"
                  onClick={startExport}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: "var(--fsx-accent)",
                    color: "white",
                  }}
                >
                  <Download size={14} /> Start Export
                </button>
              </>
            )}

            {/* Progress */}
            {isExporting && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(225,29,46,0.15)" }}
                  >
                    <Zap size={16} style={{ color: "var(--fsx-accent)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Exporting…
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      Applying effects & rendering
                    </p>
                  </div>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{
                    height: "8px",
                    backgroundColor: "var(--fsx-bg-surface)",
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${exportProgress}%`,
                      backgroundColor: "var(--fsx-accent)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--fsx-text-muted)" }}>
                    Progress
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: "var(--fsx-accent)" }}
                  >
                    {exportProgress}%
                  </span>
                </div>
              </div>
            )}

            {/* Done */}
            {exportDone && (
              <div className="text-center space-y-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: "rgba(225,29,46,0.15)" }}
                >
                  <Download size={24} style={{ color: "var(--fsx-accent)" }} />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Export Complete!</p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--fsx-text-muted)" }}
                  >
                    Your video has been downloaded.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: "var(--fsx-bg-surface)",
                    border: "1px solid var(--fsx-border)",
                    color: "white",
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ FULLSCREEN OVERLAY ═══════════════════════════════ */}
      {isFullscreen && videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.97)" }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={fsVideoRef}
              src={videoUrl}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: getComputedFilter(),
                clipPath: getCropClipPath(),
              }}
              onTimeUpdate={() =>
                setCurrentTime(fsVideoRef.current?.currentTime ?? 0)
              }
              onEnded={() => setIsPlaying(false)}
            >
              <track kind="captions" />
            </video>
            <div className="absolute inset-0 pointer-events-none">
              {overlays
                .filter((o) => o.visible)
                .map((o) => (
                  <span
                    key={o.id}
                    className="absolute pointer-events-none select-none"
                    style={{
                      left: `${o.x}%`,
                      top: `${o.y}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${o.fontSize}px`,
                      color: o.color,
                      opacity: o.opacity / 100,
                      mixBlendMode: o.blendMode,
                      fontFamily: o.fontFamily ?? undefined,
                      textShadow:
                        o.type === "text"
                          ? "0 1px 4px rgba(0,0,0,0.8)"
                          : "none",
                      fontWeight: 700,
                      zIndex: 10,
                    }}
                  >
                    {o.content}
                  </span>
                ))}
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 px-6 pt-10 pb-6"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
              }}
            >
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.01}
                value={currentTime}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  setCurrentTime(t);
                  if (fsVideoRef.current) fsVideoRef.current.currentTime = t;
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-4"
                style={{ accentColor: "var(--fsx-accent)" }}
                aria-label="Seek"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!fsVideoRef.current) return;
                      if (isPlaying) {
                        fsVideoRef.current.pause();
                        videoRef.current?.pause();
                        setIsPlaying(false);
                      } else {
                        fsVideoRef.current.play();
                        videoRef.current?.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: "var(--fsx-accent)" }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <span className="text-sm font-mono text-white">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="video_editor.fullscreen.close"
                  onClick={() => setIsFullscreen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  aria-label="Exit fullscreen"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white z-50"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              aria-label="Close fullscreen"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════ MAIN EDITOR ══════════════════════════════ */}
      <div
        data-ocid="video_editor.panel"
        className="flex flex-col overflow-hidden"
        style={{ height: "100%", backgroundColor: "var(--fsx-bg-primary)" }}
      >
        {/* ══════════════════════════ TOP 50%: PREVIEW ═════════════════════════ */}
        <div
          ref={previewAreaRef}
          className="relative flex items-center justify-center overflow-hidden shrink-0"
          style={{ height: "50%", backgroundColor: "#000" }}
        >
          {!videoUrl ? (
            <div
              data-ocid="video_editor.dropzone"
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
                  ? "rgba(225,29,46,0.05)"
                  : "var(--fsx-bg-surface)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(225,29,46,0.12)",
                  border: "1px solid rgba(225,29,46,0.25)",
                }}
              >
                <Video size={28} style={{ color: "var(--fsx-accent)" }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white mb-1">
                  Drag video here or tap to upload
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  MP4 · MOV · WebM · MKV
                </p>
              </div>
              <label className="fsx-btn-primary cursor-pointer text-sm px-5 py-2.5">
                <input
                  data-ocid="video_editor.upload_button"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <span className="flex items-center gap-2">
                  <Upload size={13} /> Choose Video
                </span>
              </label>
            </div>
          ) : (
            <>
              <video
                data-ocid="video_editor.canvas_target"
                ref={videoRef}
                src={videoUrl}
                className="max-w-full max-h-full object-contain"
                style={{
                  maxHeight: "calc(100% - 56px)",
                  maxWidth: "100%",
                  transform: aiStabilizeActive
                    ? "scale(1.05) translateZ(0)"
                    : undefined,
                  transition: "transform 0.3s ease",
                }}
                onTimeUpdate={() =>
                  setCurrentTime(videoRef.current?.currentTime ?? 0)
                }
                onLoadedMetadata={() => {
                  const d = videoRef.current?.duration ?? 0;
                  setDuration(d);
                  setTrimEnd(100);
                  pushHistory(captureState());
                }}
                onEnded={() => setIsPlaying(false)}
              >
                <track kind="captions" />
              </video>

              {/* Crop overlay */}
              {activeTab === "crop" && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 20 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                  />
                  <div
                    className="absolute pointer-events-auto cursor-move"
                    style={{
                      left: `${cropRect.x}%`,
                      top: `${cropRect.y}%`,
                      width: `${cropRect.w}%`,
                      height: `${cropRect.h}%`,
                      border: "2px solid white",
                      backgroundColor: "transparent",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                    }}
                    onMouseDown={(e) => handleCropMouseDown(e, "move")}
                  >
                    {[33.33, 66.66].map((p) => (
                      <div
                        key={`v${p}`}
                        className="absolute top-0 bottom-0"
                        style={{
                          left: `${p}%`,
                          width: "1px",
                          backgroundColor: "rgba(255,255,255,0.25)",
                        }}
                      />
                    ))}
                    {[33.33, 66.66].map((p) => (
                      <div
                        key={`h${p}`}
                        className="absolute left-0 right-0"
                        style={{
                          top: `${p}%`,
                          height: "1px",
                          backgroundColor: "rgba(255,255,255,0.25)",
                        }}
                      />
                    ))}
                    {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                      <div
                        key={corner}
                        className="absolute w-4 h-4 pointer-events-auto"
                        style={{
                          top: corner.startsWith("t") ? -4 : undefined,
                          bottom: corner.startsWith("b") ? -4 : undefined,
                          left: corner.endsWith("l") ? -4 : undefined,
                          right: corner.endsWith("r") ? -4 : undefined,
                          cursor:
                            corner === "tl" || corner === "br"
                              ? "nwse-resize"
                              : "nesw-resize",
                          backgroundColor: "white",
                          borderRadius: "2px",
                          zIndex: 2,
                        }}
                        onMouseDown={(e) => handleCropMouseDown(e, corner)}
                      />
                    ))}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -top-2 w-8 h-2 bg-white rounded-sm cursor-n-resize"
                      onMouseDown={(e) => handleCropMouseDown(e, "t")}
                    />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-8 h-2 bg-white rounded-sm cursor-s-resize"
                      onMouseDown={(e) => handleCropMouseDown(e, "b")}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -left-2 w-2 h-8 bg-white rounded-sm cursor-w-resize"
                      onMouseDown={(e) => handleCropMouseDown(e, "l")}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -right-2 w-2 h-8 bg-white rounded-sm cursor-e-resize"
                      onMouseDown={(e) => handleCropMouseDown(e, "r")}
                    />
                  </div>
                </div>
              )}

              {/* Overlays */}
              {renderOverlays()}

              {/* Reverse indicator */}
              {isReversed && (
                <div
                  className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full z-30"
                  style={{
                    backgroundColor: "rgba(225,29,46,0.85)",
                    fontSize: "9px",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  ⏪ REVERSED
                </div>
              )}

              {/* Top-right controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-30">
                {cropActive && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "var(--fsx-accent)",
                      color: "white",
                      fontSize: "9px",
                    }}
                  >
                    CROPPED
                  </span>
                )}
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "9px",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {exportQuality}
                </span>
                <button
                  type="button"
                  data-ocid="video_editor.fullscreen.toggle"
                  onClick={() => setIsFullscreen(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                  aria-label="Fullscreen preview"
                >
                  <Maximize2 size={13} />
                </button>
              </div>

              {/* Playback controls */}
              <div
                className="absolute bottom-0 left-0 right-0 px-3 pt-8 pb-1"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                }}
              >
                {/* Visual Timeline */}
                <div
                  ref={timelineRef}
                  onClick={handleTimelineClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleTimelineClick(e as unknown as React.MouseEvent);
                  }}
                  role="slider"
                  tabIndex={0}
                  aria-label="Timeline"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="relative mb-2 select-none"
                  style={{ height: "24px", cursor: "pointer" }}
                >
                  <div
                    className="absolute inset-y-0 my-auto rounded-full"
                    style={{
                      left: 0,
                      right: 0,
                      height: "4px",
                      backgroundColor: "rgba(255,255,255,0.18)",
                    }}
                  />
                  <div
                    className="absolute inset-y-0 my-auto rounded-l-full"
                    style={{
                      left: 0,
                      width: `${trimStart}%`,
                      height: "4px",
                      backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                  />
                  <div
                    className="absolute inset-y-0 my-auto"
                    style={{
                      left: `${trimStart}%`,
                      width: `${trimEnd - trimStart}%`,
                      height: "4px",
                      backgroundColor: "var(--fsx-accent)",
                    }}
                  />
                  <div
                    className="absolute inset-y-0 my-auto rounded-r-full"
                    style={{
                      left: `${trimEnd}%`,
                      right: 0,
                      height: "4px",
                      backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                  />

                  {/* Segment markers */}
                  {segments.map((seg) => (
                    <div
                      key={seg.label}
                      className="absolute top-0 bottom-0 border-l-2"
                      style={{
                        left: `${(seg.start / duration) * 100}%`,
                        borderColor: "#fff700",
                        zIndex: 15,
                      }}
                    />
                  ))}

                  {/* AI Scene markers */}
                  {aiSceneMarkers.map((marker) => (
                    <div
                      key={marker.time}
                      className="absolute"
                      style={{
                        left: `${marker.pct}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "3px",
                        height: "14px",
                        backgroundColor: "var(--fsx-accent)",
                        borderRadius: "1px",
                        zIndex: 14,
                        boxShadow: "0 0 3px rgba(225,29,46,0.7)",
                      }}
                    />
                  ))}

                  {/* Trim Start handle */}
                  <div
                    data-ocid="video_editor.timeline.handle_start"
                    onMouseDown={(e) => handleTimelineMouseDown(e, "start")}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-5 rounded-sm flex items-center justify-center cursor-ew-resize z-20"
                    style={{
                      left: `${trimStart}%`,
                      backgroundColor: "var(--fsx-accent)",
                      border: "1.5px solid white",
                    }}
                  >
                    {showStartLabel && (
                      <span
                        className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono px-1 py-0.5 rounded whitespace-nowrap"
                        style={{
                          backgroundColor: "var(--fsx-accent)",
                          color: "white",
                          fontSize: "9px",
                        }}
                      >
                        {formatTimeFull(trimStartSec)}
                      </span>
                    )}
                  </div>

                  {/* Trim End handle */}
                  <div
                    data-ocid="video_editor.timeline.handle_end"
                    onMouseDown={(e) => handleTimelineMouseDown(e, "end")}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-5 rounded-sm flex items-center justify-center cursor-ew-resize z-20"
                    style={{
                      left: `${trimEnd}%`,
                      backgroundColor: "var(--fsx-accent)",
                      border: "1.5px solid white",
                    }}
                  >
                    {showEndLabel && (
                      <span
                        className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono px-1 py-0.5 rounded whitespace-nowrap"
                        style={{
                          backgroundColor: "var(--fsx-accent)",
                          color: "white",
                          fontSize: "9px",
                        }}
                      >
                        {formatTimeFull(trimEndSec)}
                      </span>
                    )}
                  </div>

                  {/* Playhead */}
                  <div
                    data-ocid="video_editor.timeline.playhead"
                    onMouseDown={(e) => handleTimelineMouseDown(e, "playhead")}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 cursor-col-resize"
                    style={{ left: `${progressPercent}%` }}
                  >
                    <div
                      style={{
                        width: "2px",
                        height: "20px",
                        backgroundColor: "white",
                        borderRadius: "1px",
                        boxShadow: "0 0 4px rgba(255,255,255,0.6)",
                      }}
                    />
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={skipBack}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                      aria-label="Skip back 5s"
                    >
                      <SkipBack size={11} />
                    </button>
                    <button
                      type="button"
                      data-ocid="video_editor.play_pause.toggle"
                      onClick={togglePlay}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: "var(--fsx-accent)" }}
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={skipForward}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                      aria-label="Skip forward 5s"
                    >
                      <SkipForward size={11} />
                    </button>
                    <span
                      className="text-xs font-mono ml-1"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {formatTime(currentTime)}{" "}
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>/</span>{" "}
                      {formatTime(duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={undo}
                      disabled={!canUndo}
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{
                        color: canUndo
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.2)",
                      }}
                      aria-label="Undo"
                    >
                      <Undo2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={redo}
                      disabled={!canRedo}
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{
                        color: canRedo
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.2)",
                      }}
                      aria-label="Redo"
                    >
                      <Redo2 size={12} />
                    </button>
                    <button
                      type="button"
                      data-ocid="video_editor.mute.toggle"
                      onClick={toggleMute}
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-14 h-1 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: "var(--fsx-accent)" }}
                      aria-label="Volume"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ══════════════════════ BOTTOM 50%: TOOLS ════════════════════════════ */}
        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{
            backgroundColor: "var(--fsx-bg-primary)",
            borderTop: "1px solid var(--fsx-border)",
          }}
        >
          {!videoUrl ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
                Load a video to access editing controls
              </p>
            </div>
          ) : (
            <>
              {/* Tab bar */}
              <div
                className="flex shrink-0 overflow-x-auto"
                style={{
                  backgroundColor: "var(--fsx-bg-surface)",
                  borderBottom: "1px solid var(--fsx-border)",
                  scrollbarWidth: "none",
                }}
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    data-ocid={`video_editor.tab.${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-none flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors whitespace-nowrap"
                    style={{
                      color:
                        activeTab === tab.id
                          ? "var(--fsx-accent)"
                          : "var(--fsx-text-muted)",
                      borderBottom:
                        activeTab === tab.id
                          ? "2px solid var(--fsx-accent)"
                          : "2px solid transparent",
                      backgroundColor: "transparent",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
              >
                {/* ════ TRIM TAB ════ */}
                {activeTab === "trim" && (
                  <div className="p-4 space-y-4">
                    {/* In/Out display */}
                    <div
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                      }}
                    >
                      <div className="text-center">
                        <p
                          className="text-xs mb-0.5"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          In
                        </p>
                        <p
                          className="text-sm font-mono font-bold"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          {formatTimeFull(trimStartSec)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs mb-0.5"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Duration
                        </p>
                        <p className="text-sm font-mono font-bold text-white">
                          {formatTime(trimmedDuration)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs mb-0.5"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Out
                        </p>
                        <p
                          className="text-sm font-mono font-bold"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          {formatTimeFull(trimEndSec)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs mb-0.5"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Total
                        </p>
                        <p
                          className="text-sm font-mono"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          {formatTime(duration)}
                        </p>
                      </div>
                    </div>

                    {/* Start/End sliders */}
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span
                          className="text-xs"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Start
                        </span>
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          {formatTimeFull(trimStartSec)}
                        </span>
                      </div>
                      <input
                        data-ocid="video_editor.trim_start.input"
                        type="range"
                        min={0}
                        max={trimEnd - 2}
                        step={0.1}
                        value={trimStart}
                        onChange={(e) => setTrimStart(Number(e.target.value))}
                        onMouseUp={() => pushHistory(captureState())}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "var(--fsx-accent)" }}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span
                          className="text-xs"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          End
                        </span>
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          {formatTimeFull(trimEndSec)}
                        </span>
                      </div>
                      <input
                        data-ocid="video_editor.trim_end.input"
                        type="range"
                        min={trimStart + 2}
                        max={100}
                        step={0.1}
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(Number(e.target.value))}
                        onMouseUp={() => pushHistory(captureState())}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "var(--fsx-accent)" }}
                      />
                    </div>

                    {/* Split + Reverse + Reverse status */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-ocid="video_editor.split.button"
                        onClick={splitAtPlayhead}
                        className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        style={{
                          backgroundColor: "rgba(225,29,46,0.12)",
                          border: "1px solid rgba(225,29,46,0.3)",
                          color: "var(--fsx-accent)",
                        }}
                      >
                        <Scissors size={12} /> Split at{" "}
                        {formatTime(currentTime)}
                      </button>
                      <button
                        type="button"
                        data-ocid="video_editor.reverse.toggle"
                        onClick={toggleReverse}
                        className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        style={{
                          backgroundColor: isReversed
                            ? "var(--fsx-accent)"
                            : "var(--fsx-bg-elevated)",
                          border: isReversed
                            ? "1px solid var(--fsx-accent)"
                            : "1px solid var(--fsx-border)",
                          color: isReversed
                            ? "white"
                            : "var(--fsx-text-secondary)",
                        }}
                      >
                        ⏪ {isReversed ? "Reversed" : "Reverse"}
                      </button>
                    </div>

                    {/* Segments list */}
                    {segments.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Split Segments
                        </p>
                        <div className="space-y-1.5">
                          {segments.map((seg, segIdx) => (
                            <div
                              key={seg.label}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{
                                backgroundColor: "var(--fsx-bg-elevated)",
                                border: "1px solid var(--fsx-border)",
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    segIdx === 0
                                      ? "#f9c74f"
                                      : "var(--fsx-accent)",
                                }}
                              />
                              <span
                                className="text-xs flex-1"
                                style={{ color: "var(--fsx-text-secondary)" }}
                              >
                                {seg.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSegments([]);
                            pushHistory({ ...captureState(), segments: [] });
                          }}
                          className="mt-2 text-xs flex items-center gap-1"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          <RotateCcw size={10} /> Clear Splits
                        </button>
                      </div>
                    )}

                    {/* Preview + Reset */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-ocid="video_editor.play_trimmed.button"
                        onClick={playTrimmed}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: "rgba(225,29,46,0.12)",
                          border: "1px solid rgba(225,29,46,0.3)",
                          color: "var(--fsx-accent)",
                        }}
                      >
                        <Play size={12} /> Preview (
                        {formatTime(trimmedDuration)})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTrimStart(0);
                          setTrimEnd(100);
                          pushHistory({
                            ...captureState(),
                            trimStart: 0,
                            trimEnd: 100,
                          });
                        }}
                        className="py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: "var(--fsx-bg-elevated)",
                          border: "1px solid var(--fsx-border)",
                          color: "var(--fsx-text-muted)",
                        }}
                      >
                        <RotateCcw size={11} /> Reset
                      </button>
                    </div>

                    {/* Speed section in Trim tab */}
                    <div
                      style={{
                        borderTop: "1px solid var(--fsx-border)",
                        paddingTop: "16px",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          <FastForward size={11} className="inline mr-1" />{" "}
                          Playback Speed
                        </h4>
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          {playbackSpeed}×
                        </span>
                      </div>

                      {/* Speed presets */}
                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {SPEED_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            data-ocid={`video_editor.speed.${s}x`}
                            onClick={() => {
                              setPlaybackSpeed(s);
                              setCustomSpeed(s);
                            }}
                            className="py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor:
                                playbackSpeed === s
                                  ? "var(--fsx-accent)"
                                  : "var(--fsx-bg-elevated)",
                              color:
                                playbackSpeed === s
                                  ? "white"
                                  : "var(--fsx-text-secondary)",
                              border:
                                playbackSpeed === s
                                  ? "1px solid var(--fsx-accent)"
                                  : "1px solid var(--fsx-border)",
                            }}
                          >
                            {s}×
                          </button>
                        ))}
                      </div>

                      {/* Custom speed slider */}
                      <div className="mb-3">
                        <div className="flex justify-between mb-1.5">
                          <span
                            className="text-xs"
                            style={{ color: "var(--fsx-text-muted)" }}
                          >
                            Custom Speed
                          </span>
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--fsx-accent)" }}
                          >
                            {customSpeed.toFixed(2)}×
                          </span>
                        </div>
                        <input
                          data-ocid="video_editor.speed.custom_slider"
                          type="range"
                          min={0.1}
                          max={4}
                          step={0.05}
                          value={customSpeed}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setCustomSpeed(v);
                            setPlaybackSpeed(v);
                          }}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: "var(--fsx-accent)" }}
                          aria-label="Custom speed"
                        />
                        <div
                          className="flex justify-between mt-1"
                          style={{
                            color: "var(--fsx-text-muted)",
                            fontSize: "9px",
                          }}
                        >
                          <span>0.1×</span>
                          <span>1×</span>
                          <span>2×</span>
                          <span>4×</span>
                        </div>
                      </div>

                      {/* Speed curves */}
                      <p
                        className="text-xs mb-2"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Speed Curve
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {SPEED_CURVES.map((curve) => (
                          <button
                            key={curve.id}
                            type="button"
                            data-ocid={`video_editor.speed_curve.${curve.id}`}
                            onClick={() => {
                              setActiveCurve(curve.id);
                              setPlaybackSpeed(curve.rate);
                              setCustomSpeed(curve.rate);
                            }}
                            className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl transition-all"
                            style={{
                              backgroundColor:
                                activeCurve === curve.id
                                  ? "rgba(225,29,46,0.15)"
                                  : "var(--fsx-bg-elevated)",
                              border:
                                activeCurve === curve.id
                                  ? "1.5px solid var(--fsx-accent)"
                                  : "1px solid var(--fsx-border)",
                            }}
                          >
                            {/* Mini curve SVG */}
                            <svg
                              width="42"
                              height="22"
                              viewBox="0 0 42 22"
                              fill="none"
                              role="img"
                              aria-label={`${curve.label} speed curve`}
                            >
                              <title>{curve.label} speed curve</title>
                              <path
                                d={curve.svg}
                                stroke={
                                  activeCurve === curve.id
                                    ? "var(--fsx-accent)"
                                    : "rgba(255,255,255,0.3)"
                                }
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                              />
                            </svg>
                            <span className="text-base">{curve.icon}</span>
                            <span
                              className="text-xs font-semibold"
                              style={{
                                color:
                                  activeCurve === curve.id
                                    ? "var(--fsx-accent)"
                                    : "var(--fsx-text-secondary)",
                              }}
                            >
                              {curve.label}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                color: "var(--fsx-text-muted)",
                              }}
                            >
                              {curve.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ════ FILTERS TAB ════ */}
                {activeTab === "filters" && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Filter Presets
                      </h4>
                      <span
                        className="text-xs"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        {FILTER_PRESETS.length} filters
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {FILTER_PRESETS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          data-ocid={`video_editor.filter.${f.id}`}
                          onClick={() => {
                            setActiveFilter(f.id);
                            pushHistory({ ...captureState(), filter: f.id });
                          }}
                          className="flex flex-col items-center gap-1.5 transition-all"
                        >
                          <div
                            className="w-full aspect-square rounded-xl overflow-hidden relative"
                            style={{
                              border:
                                activeFilter === f.id
                                  ? "2.5px solid var(--fsx-accent)"
                                  : "2px solid var(--fsx-border)",
                              boxShadow:
                                activeFilter === f.id
                                  ? "0 0 0 1px var(--fsx-accent)"
                                  : "none",
                            }}
                          >
                            <div
                              className="w-full h-full flex items-center justify-center text-xl"
                              style={{
                                backgroundColor: `${f.color}33`,
                                filter: f.filter === "none" ? "none" : f.filter,
                              }}
                            >
                              <span style={{ fontSize: "22px" }}>🎬</span>
                            </div>
                            <div
                              className="absolute bottom-0 left-0 right-0 h-1"
                              style={{ backgroundColor: f.color }}
                            />
                          </div>
                          <span
                            className="text-xs leading-tight text-center"
                            style={{
                              color:
                                activeFilter === f.id
                                  ? "var(--fsx-accent)"
                                  : "var(--fsx-text-muted)",
                              fontWeight: activeFilter === f.id ? 600 : 400,
                              fontSize: "10px",
                            }}
                          >
                            {f.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ════ ADJUST TAB ════ */}
                {activeTab === "adjust" && (
                  <div className="p-4 space-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Adjustments
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustments({ ...DEFAULT_ADJUSTMENTS });
                          pushHistory({
                            ...captureState(),
                            adjustments: { ...DEFAULT_ADJUSTMENTS },
                          });
                        }}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--fsx-accent)" }}
                      >
                        <RotateCcw size={10} /> Reset All
                      </button>
                    </div>
                    {(
                      Object.keys(DEFAULT_ADJUSTMENTS) as (keyof Adjustments)[]
                    ).map((key) => {
                      const isPositiveOnly =
                        key === "blur" || key === "sharpen";
                      const min = isPositiveOnly ? 0 : -100;
                      const val = adjustments[key];
                      return (
                        <AdjustmentSlider
                          key={key}
                          label={key.charAt(0).toUpperCase() + key.slice(1)}
                          value={val}
                          min={min}
                          onChange={(v) =>
                            setAdjustments({ ...adjustments, [key]: v })
                          }
                          onCommit={() => pushHistory(captureState())}
                        />
                      );
                    })}
                  </div>
                )}

                {/* ════ CROP TAB ════ */}
                {activeTab === "crop" && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Crop Video
                      </h4>
                      <span
                        className="text-xs"
                        style={{
                          color: cropActive
                            ? "var(--fsx-accent)"
                            : "var(--fsx-text-muted)",
                        }}
                      >
                        {cropActive
                          ? "✓ Crop Applied"
                          : "Drag handles on video"}
                      </span>
                    </div>
                    <div
                      className="px-3 py-2.5 rounded-xl text-xs"
                      style={{
                        backgroundColor: "rgba(225,29,46,0.08)",
                        border: "1px solid rgba(225,29,46,0.2)",
                        color: "var(--fsx-text-muted)",
                      }}
                    >
                      Drag the white handles on the video preview to set crop
                      area. Use aspect ratio presets for common sizes.
                    </div>
                    <div>
                      <p
                        className="text-xs mb-2"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Aspect Ratio
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {ASPECT_RATIOS.map((ar) => (
                          <button
                            key={ar.value}
                            type="button"
                            data-ocid={`video_editor.crop.aspect_${ar.value}`}
                            onClick={() => applyCropAspectRatio(ar.value)}
                            className="py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{
                              backgroundColor:
                                cropAspect === ar.value
                                  ? "var(--fsx-accent)"
                                  : "var(--fsx-bg-elevated)",
                              color:
                                cropAspect === ar.value
                                  ? "white"
                                  : "var(--fsx-text-secondary)",
                              border:
                                cropAspect === ar.value
                                  ? "1px solid var(--fsx-accent)"
                                  : "1px solid var(--fsx-border)",
                            }}
                          >
                            {ar.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div
                      className="grid grid-cols-2 gap-2 rounded-xl p-3"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                      }}
                    >
                      {[
                        { label: "X", value: `${Math.round(cropRect.x)}%` },
                        { label: "Y", value: `${Math.round(cropRect.y)}%` },
                        { label: "Width", value: `${Math.round(cropRect.w)}%` },
                        {
                          label: "Height",
                          value: `${Math.round(cropRect.h)}%`,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between"
                        >
                          <span
                            className="text-xs"
                            style={{ color: "var(--fsx-text-muted)" }}
                          >
                            {item.label}
                          </span>
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--fsx-text-secondary)" }}
                          >
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-ocid="video_editor.crop.apply"
                        onClick={() => {
                          setCropActive(true);
                          pushHistory({ ...captureState(), cropActive: true });
                        }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: "var(--fsx-accent)",
                          color: "white",
                        }}
                      >
                        <Crop size={12} /> Apply Crop
                      </button>
                      <button
                        type="button"
                        data-ocid="video_editor.crop.reset"
                        onClick={() => {
                          setCropRect({ ...DEFAULT_CROP });
                          setCropActive(false);
                          setCropAspect("free");
                          pushHistory({
                            ...captureState(),
                            cropRect: { ...DEFAULT_CROP },
                            cropActive: false,
                          });
                        }}
                        className="py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: "var(--fsx-bg-elevated)",
                          border: "1px solid var(--fsx-border)",
                          color: "var(--fsx-text-muted)",
                        }}
                      >
                        <RotateCcw size={11} /> Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* ════ TEXT TAB ════ */}
                {activeTab === "text" && (
                  <div className="p-4 space-y-4">
                    <div
                      className="rounded-xl p-3 space-y-3"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                      }}
                    >
                      <h4
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Add Text Overlay
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter text…"
                          value={newTextInput}
                          onChange={(e) => setNewTextInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTextOverlay();
                          }}
                          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                          style={{
                            backgroundColor: "var(--fsx-bg-surface)",
                            border: "1px solid var(--fsx-border)",
                            color: "white",
                          }}
                        />
                        <button
                          type="button"
                          onClick={addTextOverlay}
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--fsx-accent)",
                            color: "white",
                          }}
                          aria-label="Add text overlay"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Font */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Font
                        </span>
                        <select
                          value={newTextFont}
                          onChange={(e) => setNewTextFont(e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg outline-none"
                          style={{
                            backgroundColor: "var(--fsx-bg-surface)",
                            border: "1px solid var(--fsx-border)",
                            color: "var(--fsx-text-secondary)",
                          }}
                        >
                          {OVERLAY_FONTS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <MiniSlider
                        label="Font Size"
                        value={newTextSize}
                        min={10}
                        max={120}
                        onChange={setNewTextSize}
                      />

                      {/* Color swatches */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Color
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[
                            "#ffffff",
                            "#ff0000",
                            "#ffff00",
                            "#00ff00",
                            "#00ffff",
                            "#ff69b4",
                            "#000000",
                          ].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewTextColor(c)}
                              className="w-5 h-5 rounded-full transition-all"
                              style={{
                                backgroundColor: c,
                                outline:
                                  newTextColor === c
                                    ? "2px solid var(--fsx-accent)"
                                    : "2px solid transparent",
                                outlineOffset: "1px",
                              }}
                              aria-label={`Color ${c}`}
                            />
                          ))}
                          <input
                            type="color"
                            value={newTextColor}
                            onChange={(e) => setNewTextColor(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer"
                            style={{
                              border: "1px solid var(--fsx-border)",
                              backgroundColor: "transparent",
                            }}
                          />
                        </div>
                      </div>

                      <MiniSlider
                        label="Pos X"
                        value={newTextPosX}
                        min={0}
                        max={100}
                        onChange={setNewTextPosX}
                      />
                      <MiniSlider
                        label="Pos Y"
                        value={newTextPosY}
                        min={0}
                        max={100}
                        onChange={setNewTextPosY}
                      />
                    </div>

                    {/* Selected text overlay edit */}
                    {selectedOverlay && selectedOverlay.type === "text" && (
                      <div
                        className="p-3 rounded-xl space-y-3"
                        style={{
                          backgroundColor: "var(--fsx-bg-elevated)",
                          border: "1px solid rgba(225,29,46,0.3)",
                        }}
                      >
                        <h4
                          className="text-xs font-semibold"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          Edit Selected Text
                        </h4>
                        <input
                          type="text"
                          value={selectedOverlay.content}
                          onChange={(e) =>
                            updateOverlay(selectedOverlay.id, {
                              content: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{
                            backgroundColor: "var(--fsx-bg-surface)",
                            border: "1px solid var(--fsx-border)",
                            color: "white",
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs"
                            style={{ color: "var(--fsx-text-muted)" }}
                          >
                            Font
                          </span>
                          <select
                            value={selectedOverlay.fontFamily ?? "Default"}
                            onChange={(e) =>
                              updateOverlay(selectedOverlay.id, {
                                fontFamily:
                                  e.target.value === "Default"
                                    ? undefined
                                    : e.target.value,
                              })
                            }
                            className="text-xs px-2 py-1 rounded-lg outline-none"
                            style={{
                              backgroundColor: "var(--fsx-bg-surface)",
                              border: "1px solid var(--fsx-border)",
                              color: "var(--fsx-text-secondary)",
                            }}
                          >
                            {OVERLAY_FONTS.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                        <MiniSlider
                          label="Font Size"
                          value={selectedOverlay.fontSize}
                          min={10}
                          max={150}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { fontSize: v })
                          }
                        />
                        <MiniSlider
                          label="Opacity"
                          value={selectedOverlay.opacity}
                          min={0}
                          max={100}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { opacity: v })
                          }
                        />
                        <MiniSlider
                          label="X Pos"
                          value={selectedOverlay.x}
                          min={0}
                          max={100}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { x: v })
                          }
                        />
                        <MiniSlider
                          label="Y Pos"
                          value={selectedOverlay.y}
                          min={0}
                          max={100}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { y: v })
                          }
                        />
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs"
                            style={{ color: "var(--fsx-text-muted)" }}
                          >
                            Color
                          </span>
                          <input
                            type="color"
                            value={selectedOverlay.color}
                            onChange={(e) =>
                              updateOverlay(selectedOverlay.id, {
                                color: e.target.value,
                              })
                            }
                            className="w-8 h-6 rounded cursor-pointer"
                            style={{ border: "1px solid var(--fsx-border)" }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs"
                            style={{ color: "var(--fsx-text-muted)" }}
                          >
                            Blend
                          </span>
                          <div className="relative">
                            <select
                              value={selectedOverlay.blendMode}
                              onChange={(e) =>
                                updateOverlay(selectedOverlay.id, {
                                  blendMode: e.target.value as BlendMode,
                                })
                              }
                              className="text-xs pl-2 pr-6 py-1 rounded-lg outline-none appearance-none"
                              style={{
                                backgroundColor: "var(--fsx-bg-surface)",
                                border: "1px solid var(--fsx-border)",
                                color: "var(--fsx-text-secondary)",
                              }}
                            >
                              {BLEND_MODES.map((m) => (
                                <option key={m} value={m}>
                                  {m.charAt(0).toUpperCase() + m.slice(1)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={10}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ color: "var(--fsx-text-muted)" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ════ OVERLAYS TAB (Emojis/Stickers + Layer Manager) ════ */}
                {activeTab === "overlays" && (
                  <div className="p-4 space-y-4">
                    {/* Emoji stickers */}
                    <div>
                      <h4
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Stickers & Emojis
                      </h4>
                      <div className="grid grid-cols-8 gap-1.5">
                        {EMOJI_STICKERS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => addEmojiOverlay(emoji)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all hover:scale-110"
                            style={{
                              backgroundColor: "var(--fsx-bg-elevated)",
                              border: "1px solid var(--fsx-border)",
                            }}
                            aria-label={`Add ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Overlay layers */}
                    {overlays.length > 0 && (
                      <div>
                        <h4
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Layers ({overlays.length})
                        </h4>
                        <div className="space-y-1.5">
                          {overlays.map((o, idx) => (
                            <div
                              key={o.id}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                              style={{
                                backgroundColor:
                                  selectedOverlayId === o.id
                                    ? "rgba(225,29,46,0.12)"
                                    : "var(--fsx-bg-elevated)",
                                border:
                                  selectedOverlayId === o.id
                                    ? "1px solid rgba(225,29,46,0.4)"
                                    : "1px solid var(--fsx-border)",
                              }}
                              onClick={() => setSelectedOverlayId(o.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setSelectedOverlayId(o.id);
                              }}
                            >
                              <span className="text-base">
                                {o.type === "emoji" ? o.content : "T"}
                              </span>
                              <span
                                className="flex-1 text-xs truncate min-w-0"
                                style={{ color: "var(--fsx-text-secondary)" }}
                              >
                                {o.type === "text"
                                  ? o.content
                                  : `Sticker ${o.content}`}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveOverlayUp(o.id);
                                  }}
                                  disabled={idx === 0}
                                  className="w-5 h-5 flex items-center justify-center rounded text-xs"
                                  style={{
                                    color: "var(--fsx-text-muted)",
                                    opacity: idx === 0 ? 0.3 : 1,
                                  }}
                                  aria-label="Move up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveOverlayDown(o.id);
                                  }}
                                  disabled={idx === overlays.length - 1}
                                  className="w-5 h-5 flex items-center justify-center rounded text-xs"
                                  style={{
                                    color: "var(--fsx-text-muted)",
                                    opacity:
                                      idx === overlays.length - 1 ? 0.3 : 1,
                                  }}
                                  aria-label="Move down"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOverlayVisibility(o.id);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded"
                                  style={{
                                    color: o.visible
                                      ? "var(--fsx-text-secondary)"
                                      : "var(--fsx-text-muted)",
                                  }}
                                  aria-label={o.visible ? "Hide" : "Show"}
                                >
                                  {o.visible ? (
                                    <Eye size={11} />
                                  ) : (
                                    <EyeOff size={11} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteOverlay(o.id);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded"
                                  style={{ color: "var(--fsx-text-muted)" }}
                                  aria-label="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected overlay quick edit */}
                    {selectedOverlay && (
                      <div
                        className="p-3 rounded-xl space-y-3"
                        style={{
                          backgroundColor: "var(--fsx-bg-elevated)",
                          border: "1px solid var(--fsx-border)",
                        }}
                      >
                        <h4
                          className="text-xs font-semibold"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Edit:{" "}
                          {selectedOverlay.type === "emoji"
                            ? selectedOverlay.content
                            : `"${selectedOverlay.content}"`}
                        </h4>
                        <MiniSlider
                          label="Size"
                          value={selectedOverlay.fontSize}
                          min={10}
                          max={100}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { fontSize: v })
                          }
                        />
                        <MiniSlider
                          label="Opacity"
                          value={selectedOverlay.opacity}
                          min={0}
                          max={100}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { opacity: v })
                          }
                        />
                        <MiniSlider
                          label="X Position"
                          value={selectedOverlay.x}
                          min={0}
                          max={100}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { x: v })
                          }
                        />
                        <MiniSlider
                          label="Y Position"
                          value={selectedOverlay.y}
                          min={0}
                          max={100}
                          onChange={(v) =>
                            updateOverlay(selectedOverlay.id, { y: v })
                          }
                        />
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs"
                            style={{ color: "var(--fsx-text-muted)" }}
                          >
                            Blend Mode
                          </span>
                          <select
                            value={selectedOverlay.blendMode}
                            onChange={(e) =>
                              updateOverlay(selectedOverlay.id, {
                                blendMode: e.target.value as BlendMode,
                              })
                            }
                            className="text-xs px-2 py-1 rounded-lg outline-none"
                            style={{
                              backgroundColor: "var(--fsx-bg-surface)",
                              border: "1px solid var(--fsx-border)",
                              color: "var(--fsx-text-secondary)",
                            }}
                          >
                            {BLEND_MODES.map((m) => (
                              <option key={m} value={m}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {overlays.length === 0 && (
                      <div className="text-center py-6">
                        <p
                          className="text-xs"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Tap a sticker above to add it to your video
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ════ VOLUME TAB ════ */}
                {activeTab === "volume" && (
                  <div className="p-4 space-y-5">
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      Audio & Volume
                    </h4>

                    {/* Mute toggle */}
                    <div
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Mute Audio
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          Silence all audio in video
                        </p>
                      </div>
                      <button
                        type="button"
                        data-ocid="video_editor.mute.toggle"
                        onClick={toggleMute}
                        className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                        style={{
                          backgroundColor: isMuted
                            ? "var(--fsx-accent)"
                            : "var(--fsx-bg-surface)",
                          border: "1px solid var(--fsx-border)",
                        }}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                        aria-pressed={isMuted}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                          style={{
                            left: isMuted ? "calc(100% - 22px)" : "2px",
                            backgroundColor: "white",
                          }}
                        />
                      </button>
                    </div>

                    {/* Volume slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          Volume Level
                        </span>
                        <span
                          className="text-sm font-mono font-bold"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          {isMuted ? "Muted" : `${volume}%`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setVolume(0)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--fsx-bg-elevated)",
                            border: "1px solid var(--fsx-border)",
                            color: "var(--fsx-text-muted)",
                          }}
                          aria-label="Set volume 0"
                        >
                          <VolumeX size={14} />
                        </button>
                        <input
                          data-ocid="video_editor.volume.slider"
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: "var(--fsx-accent)" }}
                          aria-label="Volume level"
                        />
                        <button
                          type="button"
                          onClick={() => setVolume(100)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--fsx-bg-elevated)",
                            border: "1px solid var(--fsx-border)",
                            color: "var(--fsx-text-secondary)",
                          }}
                          aria-label="Set volume 100"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                      {/* Volume presets */}
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setVolume(v);
                              setIsMuted(false);
                            }}
                            className="py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{
                              backgroundColor:
                                volume === v && !isMuted
                                  ? "var(--fsx-accent)"
                                  : "var(--fsx-bg-elevated)",
                              color:
                                volume === v && !isMuted
                                  ? "white"
                                  : "var(--fsx-text-secondary)",
                              border:
                                volume === v && !isMuted
                                  ? "1px solid var(--fsx-accent)"
                                  : "1px solid var(--fsx-border)",
                            }}
                          >
                            {v}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual volume bar */}
                    <div
                      className="rounded-xl p-3 space-y-2"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Volume Level
                      </p>
                      <div className="flex items-end gap-0.5 h-8">
                        {[
                          5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70,
                          75, 80, 85, 90, 95, 100,
                        ].map((pct) => {
                          const isActive = !isMuted && volume >= pct;
                          const isHigh = pct > 80;
                          const isMed = pct > 60;
                          return (
                            <div
                              key={`bar-${pct}`}
                              className="flex-1 rounded-t-sm transition-all"
                              style={{
                                height: `${30 + (pct / 100) * 70}%`,
                                backgroundColor: isActive
                                  ? isHigh
                                    ? "#e11d2e"
                                    : isMed
                                      ? "#f9c74f"
                                      : "#06d6a0"
                                  : "var(--fsx-bg-surface)",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ════ EXPORT TAB ════ */}
                {activeTab === "export" && (
                  <div className="p-4 space-y-5">
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      Export Settings
                    </h4>

                    {/* Quality */}
                    <div>
                      <p
                        className="text-xs mb-2"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Output Quality
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {QUALITY_OPTIONS.map((q) => (
                          <button
                            key={q.value}
                            type="button"
                            data-ocid={`video_editor.quality.${q.value}`}
                            onClick={() => setExportQuality(q.value)}
                            className="py-3 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-0.5"
                            style={{
                              backgroundColor:
                                exportQuality === q.value
                                  ? "var(--fsx-accent)"
                                  : "var(--fsx-bg-elevated)",
                              color:
                                exportQuality === q.value
                                  ? "white"
                                  : "var(--fsx-text-secondary)",
                              border:
                                exportQuality === q.value
                                  ? "1px solid var(--fsx-accent)"
                                  : "1px solid var(--fsx-border)",
                            }}
                          >
                            <span className="font-bold">{q.label}</span>
                            {exportQuality === q.value && (
                              <span style={{ fontSize: "9px", opacity: 0.8 }}>
                                Selected
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Export info */}
                    <div
                      className="rounded-xl p-3 space-y-2"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                      }}
                    >
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--fsx-text-muted)" }}>
                          Duration
                        </span>
                        <span className="font-mono text-white">
                          {formatTime(trimmedDuration)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--fsx-text-muted)" }}>
                          Quality
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--fsx-accent)" }}
                        >
                          {exportQuality}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--fsx-text-muted)" }}>
                          Speed
                        </span>
                        <span
                          className="font-mono"
                          style={{ color: "var(--fsx-text-secondary)" }}
                        >
                          {playbackSpeed}×
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--fsx-text-muted)" }}>
                          Filter
                        </span>
                        <span
                          className="font-semibold capitalize"
                          style={{ color: "var(--fsx-text-secondary)" }}
                        >
                          {FILTER_PRESETS.find((f) => f.id === activeFilter)
                            ?.label ?? "Original"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--fsx-text-muted)" }}>
                          Overlays
                        </span>
                        <span style={{ color: "var(--fsx-text-secondary)" }}>
                          {overlays.length} layer
                          {overlays.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Replace video */}
                    <div>
                      <p
                        className="text-xs mb-2"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Replace Video
                      </p>
                      <label
                        data-ocid="video_editor.replace.upload_button"
                        className="fsx-btn-secondary text-xs cursor-pointer w-full flex items-center justify-center gap-2"
                      >
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                        <Upload size={12} /> Replace Video
                      </label>
                    </div>

                    {/* Export button */}
                    <button
                      type="button"
                      data-ocid="video_editor.export.button"
                      onClick={() => setShowExportModal(true)}
                      className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                      style={{
                        backgroundColor: "var(--fsx-accent)",
                        color: "white",
                        boxShadow: "0 4px 20px rgba(225,29,46,0.3)",
                      }}
                    >
                      <Download size={16} /> Export & Download
                    </button>
                    <p
                      className="text-xs text-center"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      Visual effects are applied in real-time preview. Download
                      saves with original quality.
                    </p>
                  </div>
                )}

                {/* ════ AI TOOLS TAB ════ */}
                {activeTab === "ai" && (
                  <AIVideoTab
                    videoRef={videoRef}
                    videoUrl={videoUrl}
                    duration={duration}
                    currentTime={currentTime}
                    onFilterChange={(filter) => setAiGradeFilter(filter)}
                    onSceneMarkers={(markers) => setAiSceneMarkers(markers)}
                    onStabilize={(on) => setAiStabilizeActive(on)}
                    sceneMarkers={aiSceneMarkers}
                    stabilizeActive={aiStabilizeActive}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── AdjustmentSlider ──────────────────────────────────────────────────────── */
type AdjSliderProps = {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
};
function AdjustmentSlider({
  label,
  value,
  min = -100,
  onChange,
  onCommit,
}: AdjSliderProps) {
  return (
    <div className="py-1">
      <div className="flex justify-between mb-1">
        <span className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
          {label}
        </span>
        <span
          className="text-xs font-mono"
          style={{
            color: value === 0 ? "var(--fsx-text-muted)" : "var(--fsx-accent)",
          }}
        >
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        data-ocid={`video_editor.adjust.${label.toLowerCase()}`}
        type="range"
        min={min}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "var(--fsx-accent)" }}
        aria-label={label}
      />
    </div>
  );
}

/* ─── MiniSlider ────────────────────────────────────────────────────────────── */
type MiniSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
};
function MiniSlider({ label, value, min, max, onChange }: MiniSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs w-20 shrink-0"
        style={{ color: "var(--fsx-text-muted)" }}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "var(--fsx-accent)" }}
        aria-label={label}
      />
      <span
        className="text-xs font-mono w-8 text-right"
        style={{ color: "var(--fsx-text-muted)" }}
      >
        {value}
      </span>
    </div>
  );
}
