import {
  CheckCircle,
  Download,
  Library,
  Mic,
  MicOff,
  Music,
  Pause,
  Play,
  Scissors,
  Sliders,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  MUSIC_CATEGORIES,
  MUSIC_LIBRARY,
} from "../../../data/musicLibraryData";
import type { MusicCategory, MusicTrack } from "../../../data/musicLibraryData";
import AIMusicTab from "./tabs/AIMusicTab";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

/* ─── types ───────────────────────────────────────────────────────────────── */
type Tab =
  | "library"
  | "import"
  | "trim"
  | "effects"
  | "voiceover"
  | "export"
  | "ai";
type ExportFormat = "MP3" | "WAV";
type ExportQuality = "High" | "Medium" | "Low";

interface Effects {
  volume: number; // 0-100, default 80
  bassBoost: number; // 0-100, default 0
  echo: number; // 0-100, default 0 (Echo/Reverb)
  pitch: number; // -100 to +100, default 0
  speed: number; // 50-200, default 100
  noiseReduction: number; // 0-100, default 0
  fadeIn: number; // 0-10 seconds, default 0
}

const DEFAULT_EFFECTS: Effects = {
  volume: 80,
  bassBoost: 0,
  echo: 0,
  pitch: 0,
  speed: 100,
  noiseReduction: 0,
  fadeIn: 0,
};

interface MusicDraft {
  selectedTrackId: string | null;
  importedFileName: string | null;
  trimStart: number;
  trimEnd: number;
  effects: Effects;
}

const DRAFT_KEY = "fstudiox-music-draft";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "library", label: "Library", icon: <Library size={11} /> },
  { id: "import", label: "Import", icon: <Upload size={11} /> },
  { id: "trim", label: "Trim", icon: <Scissors size={11} /> },
  { id: "effects", label: "Effects", icon: <Sliders size={11} /> },
  { id: "voiceover", label: "Voice", icon: <Mic size={11} /> },
  { id: "export", label: "Export", icon: <Download size={11} /> },
  { id: "ai", label: "AI Audio", icon: <Sparkles size={11} /> },
];

const TRIM_BARS = Array.from({ length: 40 }, (_, i) => ({
  id: `tw${i}`,
  pos: (i / 40) * 100,
  h: ((Math.sin(i * 0.4 + 1) + 1) / 2) * 70 + 15,
}));

/* ─── sub-components ──────────────────────────────────────────────────────── */
function VerticalSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  ocid,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  ocid?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <span
        className="text-[10px] font-mono font-bold"
        style={{ color: "var(--fsx-accent)" }}
      >
        {value > 0 && min < 0 ? `+${value}` : value}
        {unit}
      </span>
      <div
        className="relative flex-1 w-7 flex items-center justify-center"
        style={{ minHeight: "100px" }}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          data-ocid={ocid}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="appearance-none cursor-pointer"
          style={{
            accentColor: "var(--fsx-accent)",
            writingMode: "vertical-lr",
            direction: "rtl",
            width: "28px",
            height: "100px",
          }}
        />
        {/* track fill indicator */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 rounded-full pointer-events-none"
          style={{
            height: "100px",
            background: `linear-gradient(to top, var(--fsx-accent) ${pct}%, var(--fsx-bg-elevated) ${pct}%)`,
            opacity: 0.3,
          }}
        />
      </div>
      <span
        className="text-[9px] font-medium text-center leading-tight"
        style={{ color: "var(--fsx-text-muted)", maxWidth: "48px" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */
export default function MusicEditor() {
  const [activeTab, setActiveTab] = useState<Tab>("library");

  /* track / playback */
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [importedDuration, setImportedDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  /* category filter */
  const [activeCategory, setActiveCategory] = useState<MusicCategory | "All">(
    "All",
  );

  /* trim */
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [draggingHandle, setDraggingHandle] = useState<"start" | "end" | null>(
    null,
  );

  /* effects */
  const [effects, setEffects] = useState<Effects>({ ...DEFAULT_EFFECTS });

  /* voiceover */
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceoverBlob, setVoiceoverBlob] = useState<Blob | null>(null);
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [isPlayingVoiceover, setIsPlayingVoiceover] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micSupported] = useState(() => !!navigator.mediaDevices?.getUserMedia);

  /* export */
  const [exportFormat, setExportFormat] = useState<ExportFormat>("MP3");
  const [exportQuality, setExportQuality] = useState<ExportQuality>("High");
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  /* refs */
  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const trimlineRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── load draft from localStorage ──────────────────────────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft: MusicDraft = JSON.parse(raw);
        if (draft.effects) setEffects(draft.effects);
        if (draft.trimStart !== undefined) setTrimStart(draft.trimStart);
        if (draft.trimEnd !== undefined) setTrimEnd(draft.trimEnd);
        if (draft.selectedTrackId) {
          const track = MUSIC_LIBRARY.find(
            (t) => t.id === draft.selectedTrackId,
          );
          if (track) {
            setSelectedTrack(track);
            const [m, s] = track.duration.split(":").map(Number);
            setDuration((m ?? 0) * 60 + (s ?? 0));
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ── auto-save every 30s ────────────────────────────────────────────── */
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      const draft: MusicDraft = {
        selectedTrackId: selectedTrack?.id ?? null,
        importedFileName,
        trimStart,
        trimEnd,
        effects,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 30000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [selectedTrack, importedFileName, trimStart, trimEnd, effects]);

  /* ── waveform visualization ─────────────────────────────────────────── */
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0b0b0f";
    ctx.fillRect(0, 0, W, H);

    const bars = 60;
    const barW = (W / bars) * 0.6;
    const gap = (W / bars) * 0.4;
    const progress = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < bars; i++) {
      const x = i * (barW + gap) + gap / 2;
      const seed = (i * 7919 + 3) % 100;
      const isPast = i / bars < progress;

      let barH: number;
      if (analyserRef.current) {
        const bufLen = analyserRef.current.frequencyBinCount;
        const dataArr = new Uint8Array(bufLen);
        analyserRef.current.getByteFrequencyData(dataArr);
        const idx = Math.floor((i / bars) * bufLen);
        barH = (dataArr[idx] / 255) * H * 0.8 + 2;
      } else {
        barH = ((Math.sin(seed * 0.15) + 1) / 2) * H * 0.7 + H * 0.05;
      }

      const gradient = ctx.createLinearGradient(0, H, 0, H - barH);
      gradient.addColorStop(
        0,
        isPast ? "rgba(225,29,46,0.9)" : "rgba(225,29,46,0.25)",
      );
      gradient.addColorStop(
        1,
        isPast ? "rgba(225,29,46,0.4)" : "rgba(225,29,46,0.08)",
      );
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, H - barH, barW, barH, 2);
      ctx.fill();
    }

    if (duration > 0) {
      const px = (currentTime / duration) * W;
      ctx.strokeStyle = "#e11d2e";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(225,29,46,0.6)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [currentTime, duration]);

  useEffect(() => {
    const animate = () => {
      drawWaveform();
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawWaveform]);

  /* ── audio context setup ────────────────────────────────────────────── */
  const setupAudioContext = useCallback(() => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(
        audioRef.current,
      );
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }
  }, []);

  /* ── sync effects to audio ──────────────────────────────────────────── */
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = effects.volume / 100;
    audioRef.current.playbackRate = effects.speed / 100;
  }, [effects.volume, effects.speed]);

  /* ── load track (library) ───────────────────────────────────────────── */
  const handleLoadTrack = (track: MusicTrack) => {
    setSelectedTrack(track);
    setIsLoadingTrack(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setTrimStart(0);
    setTrimEnd(100);
    setDuration(track.durationSecs);
    setImportedFileName(null);
    setImportedDuration(0);
    setTimeout(() => setIsLoadingTrack(false), 600);
    setActiveTab("effects");
  };

  /* ── file import helper ─────────────────────────────────────────────── */
  const processFile = (file: File) => {
    setImportError(null);
    if (file.size > 50 * 1024 * 1024) {
      setImportError("File too large. Maximum 50MB allowed.");
      return;
    }
    const allowed = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/m4a",
      "audio/x-m4a",
      "audio/",
    ];
    const isAudio =
      allowed.some((t) => file.type.startsWith(t)) ||
      file.name.match(/\.(mp3|wav|m4a)$/i);
    if (!isAudio) {
      setImportError("Unsupported format. Please use MP3, WAV, or M4A.");
      return;
    }
    const url = URL.createObjectURL(file);
    setImportedFileName(file.name);
    setSelectedTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setTrimStart(0);
    setTrimEnd(100);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.onloadedmetadata = () => {
        const d = audioRef.current?.duration ?? 0;
        setDuration(d);
        setImportedDuration(d);
      };
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  /* ── playback controls ──────────────────────────────────────────────── */
  const togglePlay = () => {
    if (selectedTrack && !selectedTrack.src) {
      setIsPlaying((p) => !p);
      return;
    }
    if (!audioRef.current) return;
    try {
      setupAudioContext();
    } catch {
      /* ignore */
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying((p) => !p);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  /* ── trim drag ──────────────────────────────────────────────────────── */
  const getTrimPercent = useCallback((clientX: number): number => {
    const el = trimlineRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
  }, []);

  useEffect(() => {
    if (!draggingHandle) return;
    const onMove = (e: MouseEvent) => {
      const pct = getTrimPercent(e.clientX);
      if (draggingHandle === "start") setTrimStart(Math.min(pct, trimEnd - 2));
      else setTrimEnd(Math.max(pct, trimStart + 2));
    };
    const onUp = () => setDraggingHandle(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggingHandle, trimStart, trimEnd, getTrimPercent]);

  /* ── voiceover recording ────────────────────────────────────────────── */
  const startRecording = async () => {
    setMicError(null);
    if (!micSupported) {
      setMicError("Microphone not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      recordingChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setVoiceoverBlob(blob);
        setVoiceoverUrl(url);
        for (const t of stream.getTracks()) t.stop();
      };
      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setMicError(
        "Microphone access denied. Please allow mic access and try again.",
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const toggleVoiceoverPlay = () => {
    if (!voiceoverAudioRef.current || !voiceoverUrl) return;
    if (isPlayingVoiceover) {
      voiceoverAudioRef.current.pause();
    } else {
      voiceoverAudioRef.current.play().catch(() => {});
    }
    setIsPlayingVoiceover((p) => !p);
  };

  const deleteVoiceover = () => {
    setVoiceoverBlob(null);
    setVoiceoverUrl(null);
    setIsPlayingVoiceover(false);
  };

  /* ── export ─────────────────────────────────────────────────────────── */
  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    const steps = [10, 25, 45, 65, 80, 92, 100];
    let i = 0;
    const tick = setInterval(() => {
      if (i < steps.length) {
        setExportProgress(steps[i]);
        i++;
      } else {
        clearInterval(tick);
        setIsExporting(false);
        if (importedFileName && audioRef.current?.src) {
          const a = document.createElement("a");
          a.href = audioRef.current.src;
          a.download = `fstudiox_${importedFileName}`;
          a.click();
        }
        toast.success("Export complete — check downloads", {
          icon: <CheckCircle size={16} style={{ color: "#22c55e" }} />,
          duration: 4000,
        });
      }
    }, 200);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, []);

  /* ── computed values ────────────────────────────────────────────────── */
  const filteredTracks =
    activeCategory === "All"
      ? MUSIC_LIBRARY
      : MUSIC_LIBRARY.filter((t) => t.category === activeCategory);

  const trackName =
    selectedTrack?.name ?? importedFileName ?? "No audio loaded";
  const trackDurationDisplay =
    importedDuration > 0
      ? fmt(importedDuration)
      : (selectedTrack?.duration ?? "0:00");
  const trimStartSec = (trimStart / 100) * duration;
  const trimEndSec = (trimEnd / 100) * duration;

  const noAudio = !selectedTrack && !importedFileName;

  const sectionTitle = (text: string) => (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: "var(--fsx-text-muted)" }}
    >
      {text}
    </p>
  );

  const getExportFilename = () => {
    const base =
      selectedTrack?.name.toLowerCase().replace(/\s+/g, "_") ??
      importedFileName ??
      "audio";
    return `fstudiox_${base}.${exportFormat.toLowerCase()}`;
  };

  return (
    <div
      data-ocid="music_editor.panel"
      className="flex flex-col overflow-hidden"
      style={{ height: "100%", backgroundColor: "var(--fsx-bg-primary)" }}
    >
      {/* Hidden audio element */}
      {/* biome-ignore lint/a11y/useMediaCaption: music tracks */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration ?? 0;
          setDuration(d);
          setTrimEnd(100);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* ══════════════════ TOP ~45%: WAVEFORM + PLAYBACK ══════════════════ */}
      <div
        className="shrink-0 relative flex flex-col"
        style={{
          height: "45%",
          backgroundColor: "#0b0b0f",
          borderBottom: "1px solid var(--fsx-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(225,29,46,0.15)" }}
            >
              <Music size={13} style={{ color: "var(--fsx-accent)" }} />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--fsx-text-primary)", maxWidth: "180px" }}
              >
                {trackName}
              </p>
              <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
                {trackDurationDisplay}
              </p>
            </div>
          </div>
          {selectedTrack && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: `${CATEGORY_COLORS[selectedTrack.category]}22`,
                color: CATEGORY_COLORS[selectedTrack.category],
                border: `1px solid ${CATEGORY_COLORS[selectedTrack.category]}44`,
              }}
            >
              {CATEGORY_EMOJIS[selectedTrack.category]} {selectedTrack.category}
            </span>
          )}
        </div>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={100}
          className="w-full flex-1"
          style={{ display: "block" }}
          aria-label="Audio waveform visualization"
        />

        {/* Seek bar + time */}
        <div className="px-4 pb-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            data-ocid="music_editor.seek"
            onChange={handleSeek}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "var(--fsx-accent)" }}
            aria-label="Seek audio"
          />
          <div className="flex justify-between mt-0.5">
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              {fmt(currentTime)}
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-4 pb-3 shrink-0">
          <button
            type="button"
            data-ocid="music_editor.skip_back"
            onClick={() => {
              const t = Math.max(0, currentTime - 5);
              setCurrentTime(t);
              if (audioRef.current) audioRef.current.currentTime = t;
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{
              color: "var(--fsx-text-muted)",
              backgroundColor: "var(--fsx-bg-elevated)",
            }}
            aria-label="Skip back 5 seconds"
          >
            <span className="text-[10px] font-bold">-5</span>
          </button>

          <button
            type="button"
            data-ocid="music_editor.play_pause"
            onClick={togglePlay}
            disabled={isLoadingTrack}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: isLoadingTrack
                ? "rgba(225,29,46,0.4)"
                : "var(--fsx-accent)",
              color: "white",
              boxShadow: "0 0 16px rgba(225,29,46,0.35)",
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoadingTrack ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
          </button>

          <button
            type="button"
            data-ocid="music_editor.skip_forward"
            onClick={() => {
              const t = Math.min(duration, currentTime + 5);
              setCurrentTime(t);
              if (audioRef.current) audioRef.current.currentTime = t;
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{
              color: "var(--fsx-text-muted)",
              backgroundColor: "var(--fsx-bg-elevated)",
            }}
            aria-label="Skip forward 5 seconds"
          >
            <span className="text-[10px] font-bold">+5</span>
          </button>
        </div>
      </div>

      {/* ══════════════════ BOTTOM 55%: TABS + TOOLS ══════════════════════ */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ backgroundColor: "var(--fsx-bg-surface)" }}
      >
        {/* Tab strip — scrollable on mobile */}
        <div
          className="flex shrink-0 overflow-x-auto scrollbar-none"
          style={{ borderBottom: "1px solid var(--fsx-border)" }}
        >
          {TABS.map(({ id, label, icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                data-ocid={`music_editor.tab.${id}`}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                style={{
                  color: isActive
                    ? "var(--fsx-accent)"
                    : "var(--fsx-text-muted)",
                  borderBottom: isActive
                    ? "2px solid var(--fsx-accent)"
                    : "2px solid transparent",
                  backgroundColor: isActive
                    ? "rgba(225,29,46,0.06)"
                    : "transparent",
                }}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── LIBRARY ── */}
          {activeTab === "library" && (
            <div className="p-4">
              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {(["All", ...MUSIC_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    data-ocid={`music_editor.library.category.${cat.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
                    onClick={() =>
                      setActiveCategory(cat as MusicCategory | "All")
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all"
                    style={{
                      backgroundColor:
                        activeCategory === cat
                          ? cat === "All"
                            ? "var(--fsx-accent)"
                            : CATEGORY_COLORS[cat as MusicCategory]
                          : "var(--fsx-bg-elevated)",
                      color:
                        activeCategory === cat
                          ? "white"
                          : "var(--fsx-text-muted)",
                      border: `1px solid ${activeCategory === cat ? "transparent" : "var(--fsx-border)"}`,
                    }}
                  >
                    {cat !== "All"
                      ? CATEGORY_EMOJIS[cat as MusicCategory]
                      : "🎵"}{" "}
                    {cat}
                  </button>
                ))}
              </div>

              {/* Track list */}
              <div className="grid grid-cols-1 gap-2">
                {filteredTracks.map((track) => {
                  const isSelected = selectedTrack?.id === track.id;
                  const catColor = CATEGORY_COLORS[track.category];
                  return (
                    <button
                      key={track.id}
                      type="button"
                      data-ocid={`music_editor.library.track.${track.id}`}
                      onClick={() => handleLoadTrack(track)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left w-full transition-all"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(225,29,46,0.1)"
                          : "var(--fsx-bg-elevated)",
                        border: isSelected
                          ? "1px solid rgba(225,29,46,0.4)"
                          : "1px solid var(--fsx-border)",
                      }}
                      aria-pressed={isSelected}
                    >
                      {/* Play icon circle */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isSelected
                            ? "var(--fsx-accent)"
                            : `${catColor}22`,
                        }}
                      >
                        {isSelected && isPlaying ? (
                          <Pause size={13} style={{ color: "white" }} />
                        ) : (
                          <Play
                            size={13}
                            style={{ color: isSelected ? "white" : catColor }}
                          />
                        )}
                      </div>

                      {/* Track info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{
                            color: isSelected
                              ? "white"
                              : "var(--fsx-text-primary)",
                          }}
                        >
                          {track.name}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          {track.artist} · {track.bpm} BPM
                        </p>
                      </div>

                      {/* Right meta */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: catColor }}
                          >
                            {track.category}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "var(--fsx-text-muted)" }}
                        >
                          {track.duration}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── IMPORT ── */}
          {activeTab === "import" && (
            <div className="p-4 space-y-4">
              {sectionTitle("Import Audio File")}

              {/* Drag-drop zone */}
              <label
                className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${dragOver ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
                  padding: "36px 16px",
                  backgroundColor: dragOver
                    ? "rgba(225,29,46,0.06)"
                    : "var(--fsx-bg-elevated)",
                }}
                data-ocid="music_editor.import.dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: dragOver
                      ? "rgba(225,29,46,0.2)"
                      : "rgba(225,29,46,0.1)",
                  }}
                >
                  <Upload size={24} style={{ color: "var(--fsx-accent)" }} />
                </div>
                <div className="text-center">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--fsx-text-primary)" }}
                  >
                    {dragOver
                      ? "Drop to upload"
                      : "Tap or drag to upload audio"}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--fsx-text-muted)" }}
                  >
                    MP3 · WAV · M4A · Max 50MB
                  </p>
                </div>
                <input
                  data-ocid="music_editor.import.file_input"
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/x-m4a,audio/*"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>

              {/* Error message */}
              {importError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{
                    backgroundColor: "rgba(225,29,46,0.1)",
                    border: "1px solid rgba(225,29,46,0.3)",
                    color: "#f5c6cb",
                  }}
                  data-ocid="music_editor.import.error"
                >
                  <MicOff
                    size={13}
                    style={{ color: "var(--fsx-accent)", flexShrink: 0 }}
                  />
                  {importError}
                </div>
              )}

              {/* Loaded file info */}
              {importedFileName && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: "rgba(34,197,94,0.07)",
                    border: "1px solid rgba(34,197,94,0.25)",
                  }}
                  data-ocid="music_editor.import.loaded_file"
                >
                  <Music size={16} style={{ color: "#22c55e" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">
                      {importedFileName}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      Duration: {fmt(importedDuration)} · Ready to edit
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImportedFileName(null);
                      setImportedDuration(0);
                      setDuration(0);
                      setCurrentTime(0);
                    }}
                    className="p-1.5 rounded-lg transition-colors shrink-0"
                    style={{
                      color: "var(--fsx-text-muted)",
                      backgroundColor: "var(--fsx-bg-elevated)",
                    }}
                    aria-label="Remove imported file"
                    data-ocid="music_editor.import.remove_file"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TRIM ── */}
          {activeTab === "trim" && (
            <div className="p-4 space-y-4">
              {sectionTitle("Trim Audio")}

              {/* Waveform-like timeline */}
              <div
                ref={trimlineRef}
                className="relative rounded-xl overflow-hidden cursor-pointer select-none"
                style={{
                  height: "56px",
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  backgroundImage:
                    "linear-gradient(90deg, rgba(225,29,46,0.04) 1px, transparent 1px), repeating-linear-gradient(90deg, transparent 0px, transparent 7px, rgba(255,255,255,0.02) 7px, rgba(255,255,255,0.02) 8px)",
                  backgroundSize: "auto, 8px 100%",
                }}
                aria-label="Trim timeline"
              >
                {/* Selected region highlight */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: `${trimStart}%`,
                    width: `${trimEnd - trimStart}%`,
                    backgroundColor: "rgba(225,29,46,0.15)",
                    borderLeft: "2px solid var(--fsx-accent)",
                    borderRight: "2px solid var(--fsx-accent)",
                  }}
                />

                {/* Simulated waveform bars */}
                {TRIM_BARS.map(({ id, pos, h }) => {
                  const inRange = pos >= trimStart && pos <= trimEnd;
                  return (
                    <div
                      key={id}
                      className="absolute bottom-2"
                      style={{
                        left: `${pos}%`,
                        width: "2px",
                        height: `${h}%`,
                        backgroundColor: inRange
                          ? "rgba(225,29,46,0.7)"
                          : "rgba(255,255,255,0.15)",
                        borderRadius: "1px",
                      }}
                    />
                  );
                })}

                {/* Start handle */}
                <div
                  className="absolute top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize z-10"
                  style={{
                    left: `${trimStart}%`,
                    transform: "translateX(-50%)",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDraggingHandle("start");
                  }}
                  aria-label="Trim start handle"
                >
                  <div
                    className="w-3 h-10 rounded-sm flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--fsx-accent)",
                      boxShadow: "0 0 8px rgba(225,29,46,0.5)",
                    }}
                  >
                    <div className="w-0.5 h-5 bg-white rounded-full opacity-80" />
                  </div>
                </div>

                {/* End handle */}
                <div
                  className="absolute top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize z-10"
                  style={{ left: `${trimEnd}%`, transform: "translateX(-50%)" }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDraggingHandle("end");
                  }}
                  aria-label="Trim end handle"
                >
                  <div
                    className="w-3 h-10 rounded-sm flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--fsx-accent)",
                      boxShadow: "0 0 8px rgba(225,29,46,0.5)",
                    }}
                  >
                    <div className="w-0.5 h-5 bg-white rounded-full opacity-80" />
                  </div>
                </div>
              </div>

              {/* Time display grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Start",
                    value: fmt(trimStartSec),
                    ocid: "music_editor.trim.start",
                  },
                  {
                    label: "Duration",
                    value: fmt(trimEndSec - trimStartSec),
                    accent: true,
                    ocid: "music_editor.trim.duration",
                  },
                  {
                    label: "End",
                    value: fmt(trimEndSec),
                    ocid: "music_editor.trim.end",
                  },
                ].map(({ label, value, accent, ocid }) => (
                  <div
                    key={label}
                    data-ocid={ocid}
                    className="p-3 rounded-xl text-center"
                    style={{
                      backgroundColor: accent
                        ? "rgba(225,29,46,0.08)"
                        : "var(--fsx-bg-elevated)",
                      border: `1px solid ${accent ? "rgba(225,29,46,0.25)" : "var(--fsx-border)"}`,
                    }}
                  >
                    <p
                      className="text-[10px] mb-1"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      {label}
                    </p>
                    <p
                      className="font-mono font-bold text-sm"
                      style={{ color: accent ? "var(--fsx-accent)" : "white" }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid="music_editor.trim.reset"
                  onClick={() => {
                    setTrimStart(0);
                    setTrimEnd(100);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    border: "1px solid var(--fsx-border)",
                    color: "var(--fsx-text-muted)",
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  data-ocid="music_editor.trim.play_preview"
                  onClick={() => {
                    if (!audioRef.current || noAudio) return;
                    audioRef.current.currentTime = trimStartSec;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: "var(--fsx-accent)",
                    color: "white",
                  }}
                >
                  <Play size={12} /> Preview
                </button>
              </div>
            </div>
          )}

          {/* ── EFFECTS ── */}
          {activeTab === "effects" && (
            <div className="p-4 space-y-4">
              {sectionTitle("Audio Effects")}

              {/* 7 vertical sliders */}
              <div
                className="flex gap-2 justify-between px-2 py-4 rounded-2xl"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  minHeight: "180px",
                }}
                data-ocid="music_editor.effects.sliders"
              >
                <VerticalSlider
                  label="Volume"
                  value={effects.volume}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => setEffects((p) => ({ ...p, volume: v }))}
                  ocid="music_editor.effects.volume"
                />
                <VerticalSlider
                  label="Bass"
                  value={effects.bassBoost}
                  min={0}
                  max={100}
                  onChange={(v) => setEffects((p) => ({ ...p, bassBoost: v }))}
                  ocid="music_editor.effects.bass"
                />
                <VerticalSlider
                  label="Echo"
                  value={effects.echo}
                  min={0}
                  max={100}
                  onChange={(v) => setEffects((p) => ({ ...p, echo: v }))}
                  ocid="music_editor.effects.echo"
                />
                <VerticalSlider
                  label="Pitch"
                  value={effects.pitch}
                  min={-100}
                  max={100}
                  onChange={(v) => setEffects((p) => ({ ...p, pitch: v }))}
                  ocid="music_editor.effects.pitch"
                />
                <VerticalSlider
                  label="Speed"
                  value={effects.speed}
                  min={50}
                  max={200}
                  unit="%"
                  onChange={(v) => setEffects((p) => ({ ...p, speed: v }))}
                  ocid="music_editor.effects.speed"
                />
                <VerticalSlider
                  label="Noise"
                  value={effects.noiseReduction}
                  min={0}
                  max={100}
                  onChange={(v) =>
                    setEffects((p) => ({ ...p, noiseReduction: v }))
                  }
                  ocid="music_editor.effects.noise"
                />
                <VerticalSlider
                  label="Fade In"
                  value={effects.fadeIn}
                  min={0}
                  max={10}
                  unit="s"
                  onChange={(v) => setEffects((p) => ({ ...p, fadeIn: v }))}
                  ocid="music_editor.effects.fade_in"
                />
              </div>

              {/* Effects summary */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Volume", value: `${effects.volume}%` },
                  { label: "Bass Boost", value: `${effects.bassBoost}` },
                  { label: "Echo / Reverb", value: `${effects.echo}` },
                  {
                    label: "Pitch",
                    value:
                      effects.pitch > 0
                        ? `+${effects.pitch}`
                        : `${effects.pitch}`,
                  },
                  { label: "Speed", value: `${effects.speed}%` },
                  { label: "Noise Red.", value: `${effects.noiseReduction}` },
                  { label: "Fade In", value: `${effects.fadeIn}s` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: "var(--fsx-bg-elevated)",
                      border: "1px solid var(--fsx-border)",
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: "var(--fsx-accent)" }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                data-ocid="music_editor.effects.reset"
                onClick={() => setEffects({ ...DEFAULT_EFFECTS })}
                className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  color: "var(--fsx-text-muted)",
                }}
              >
                Reset All Effects
              </button>
            </div>
          )}

          {/* ── VOICEOVER ── */}
          {activeTab === "voiceover" && (
            <div className="p-4 space-y-4">
              {sectionTitle("Voiceover Recording")}

              {/* Mic status */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: micSupported
                    ? "rgba(34,197,94,0.07)"
                    : "rgba(225,29,46,0.07)",
                  border: `1px solid ${micSupported ? "rgba(34,197,94,0.2)" : "rgba(225,29,46,0.2)"}`,
                }}
              >
                {micSupported ? (
                  <Mic size={12} style={{ color: "#22c55e" }} />
                ) : (
                  <MicOff size={12} style={{ color: "var(--fsx-accent)" }} />
                )}
                <span
                  style={{
                    color: micSupported ? "#22c55e" : "var(--fsx-accent)",
                  }}
                >
                  {micSupported
                    ? "Microphone supported"
                    : "Microphone not supported in this browser"}
                </span>
              </div>

              {micError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{
                    backgroundColor: "rgba(225,29,46,0.1)",
                    border: "1px solid rgba(225,29,46,0.3)",
                    color: "#f5c6cb",
                  }}
                >
                  <MicOff
                    size={13}
                    style={{ color: "var(--fsx-accent)", flexShrink: 0 }}
                  />
                  {micError}
                </div>
              )}

              {/* Record button area */}
              <div className="flex flex-col items-center gap-5 py-4">
                {isRecording ? (
                  <>
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "rgba(225,29,46,0.15)",
                        border: "2px solid var(--fsx-accent)",
                        boxShadow:
                          "0 0 0 8px rgba(225,29,46,0.08), 0 0 0 16px rgba(225,29,46,0.04)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-sm"
                        style={{ backgroundColor: "var(--fsx-accent)" }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">
                        Recording…
                      </p>
                      <p
                        className="font-mono text-2xl font-bold mt-1"
                        style={{ color: "var(--fsx-accent)" }}
                        data-ocid="music_editor.voiceover.timer"
                      >
                        {fmtTimer(recordingSeconds)}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="music_editor.voiceover.stop"
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        border: "1px solid var(--fsx-border)",
                        color: "white",
                      }}
                    >
                      <Square size={14} /> Stop Recording
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "rgba(225,29,46,0.1)",
                        border: "1px solid rgba(225,29,46,0.25)",
                      }}
                    >
                      <Mic size={32} style={{ color: "var(--fsx-accent)" }} />
                    </div>
                    <button
                      type="button"
                      data-ocid="music_editor.voiceover.record"
                      onClick={startRecording}
                      disabled={!micSupported}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: micSupported
                          ? "var(--fsx-accent)"
                          : "var(--fsx-bg-elevated)",
                        color: micSupported ? "white" : "var(--fsx-text-muted)",
                        cursor: micSupported ? "pointer" : "not-allowed",
                        border: micSupported
                          ? "none"
                          : "1px solid var(--fsx-border)",
                      }}
                    >
                      <Mic size={14} /> Start Recording
                    </button>
                    {!micSupported && (
                      <p
                        className="text-xs text-center"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        Use Chrome or Firefox for mic recording support.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Recorded clip */}
              {voiceoverBlob && voiceoverUrl && (
                <div
                  className="space-y-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    border: "1px solid var(--fsx-border)",
                  }}
                >
                  {/* biome-ignore lint/a11y/useMediaCaption: voiceover playback */}
                  <audio
                    ref={voiceoverAudioRef}
                    src={voiceoverUrl}
                    onEnded={() => setIsPlayingVoiceover(false)}
                    className="hidden"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#22c55e" }}
                      />
                      <p className="text-sm font-semibold text-white">
                        Recorded Voiceover
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="music_editor.voiceover.delete"
                      onClick={deleteVoiceover}
                      className="p-1.5 rounded-lg transition-all"
                      style={{
                        color: "var(--fsx-text-muted)",
                        backgroundColor: "var(--fsx-bg-surface)",
                      }}
                      aria-label="Delete voiceover"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      data-ocid="music_editor.voiceover.play_pause"
                      onClick={toggleVoiceoverPlay}
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all"
                      style={{
                        backgroundColor: "var(--fsx-accent)",
                        color: "white",
                      }}
                      aria-label={
                        isPlayingVoiceover
                          ? "Pause voiceover"
                          : "Play voiceover"
                      }
                    >
                      {isPlayingVoiceover ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        {[
                          "v0",
                          "v1",
                          "v2",
                          "v3",
                          "v4",
                          "v5",
                          "v6",
                          "v7",
                          "v8",
                          "v9",
                          "v10",
                          "v11",
                        ].map((k, i) => (
                          <div
                            key={k}
                            className="rounded-full flex-1"
                            style={{
                              height: `${8 + (i % 5) * 4}px`,
                              backgroundColor:
                                isPlayingVoiceover && i < 7
                                  ? "var(--fsx-accent)"
                                  : "var(--fsx-border)",
                              transition: "background-color 0.2s",
                            }}
                          />
                        ))}
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--fsx-text-muted)" }}
                      >
                        {isPlayingVoiceover ? "Playing…" : "Ready to play"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXPORT ── */}
          {activeTab === "export" && (
            <div className="p-4 space-y-4">
              {sectionTitle("Export Audio")}

              {/* Settings summary */}
              <div
                className="p-4 rounded-xl space-y-2.5"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Music size={14} style={{ color: "var(--fsx-accent)" }} />
                  <span className="text-sm font-semibold text-white">
                    Export Summary
                  </span>
                </div>
                {[
                  { label: "Track", value: noAudio ? "— None —" : trackName },
                  { label: "Volume", value: `${effects.volume}%` },
                  { label: "Speed", value: `${effects.speed}%` },
                  { label: "Bass Boost", value: `${effects.bassBoost}` },
                  {
                    label: "Pitch",
                    value:
                      effects.pitch > 0
                        ? `+${effects.pitch}`
                        : `${effects.pitch}`,
                  },
                  { label: "Fade In", value: `${effects.fadeIn}s` },
                  {
                    label: "Trim",
                    value: `${fmt(trimStartSec)} → ${fmt(trimEndSec)}`,
                  },
                  ...(voiceoverBlob
                    ? [{ label: "Voiceover", value: "✓ Included" }]
                    : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span
                      className="text-xs"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-xs font-mono font-semibold truncate ml-2 max-w-[160px]"
                      style={{
                        color:
                          label === "Voiceover"
                            ? "#22c55e"
                            : label === "Track" && noAudio
                              ? "var(--fsx-text-muted)"
                              : "var(--fsx-text-secondary)",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Format selector */}
              <div
                className="p-3 rounded-xl space-y-3"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  FORMAT
                </p>
                <div className="flex gap-2">
                  {(["MP3", "WAV"] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      data-ocid={`music_editor.export.format.${f.toLowerCase()}`}
                      onClick={() => setExportFormat(f)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor:
                          exportFormat === f
                            ? "var(--fsx-accent)"
                            : "var(--fsx-bg-surface)",
                        color:
                          exportFormat === f
                            ? "white"
                            : "var(--fsx-text-muted)",
                        border: `1px solid ${exportFormat === f ? "transparent" : "var(--fsx-border)"}`,
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  QUALITY
                </p>
                <div className="flex gap-2">
                  {(["High", "Medium", "Low"] as ExportQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      data-ocid={`music_editor.export.quality.${q.toLowerCase()}`}
                      onClick={() => setExportQuality(q)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor:
                          exportQuality === q
                            ? "rgba(225,29,46,0.2)"
                            : "var(--fsx-bg-surface)",
                        color:
                          exportQuality === q
                            ? "var(--fsx-accent)"
                            : "var(--fsx-text-muted)",
                        border: `1px solid ${exportQuality === q ? "rgba(225,29,46,0.4)" : "var(--fsx-border)"}`,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <p
                  className="text-[10px]"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  File:{" "}
                  <span
                    className="font-mono"
                    style={{ color: "var(--fsx-text-secondary)" }}
                  >
                    {getExportFilename()}
                  </span>
                </p>
              </div>

              {/* Progress bar */}
              {isExporting && (
                <div
                  className="space-y-2"
                  data-ocid="music_editor.export.progress"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--fsx-text-muted)" }}
                    >
                      Exporting…
                    </span>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: "var(--fsx-accent)" }}
                    >
                      {exportProgress}%
                    </span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--fsx-bg-elevated)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${exportProgress}%`,
                        backgroundColor: "var(--fsx-accent)",
                        boxShadow: "0 0 8px rgba(225,29,46,0.5)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Export button */}
              <button
                type="button"
                data-ocid="music_editor.export.download"
                onClick={handleExport}
                disabled={noAudio || isExporting}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor:
                    noAudio || isExporting
                      ? "var(--fsx-bg-elevated)"
                      : "var(--fsx-accent)",
                  color:
                    noAudio || isExporting ? "var(--fsx-text-muted)" : "white",
                  cursor: noAudio || isExporting ? "not-allowed" : "pointer",
                  border: "1px solid var(--fsx-border)",
                  boxShadow:
                    !noAudio && !isExporting
                      ? "0 0 16px rgba(225,29,46,0.3)"
                      : "none",
                }}
              >
                {isExporting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {isExporting ? "Exporting…" : "Export & Download"}
              </button>

              {noAudio && (
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  Select a track from Library or Import an audio file first.
                </p>
              )}

              {/* Voiceover download */}
              {voiceoverBlob && voiceoverUrl && (
                <button
                  type="button"
                  data-ocid="music_editor.export.download_voiceover"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = voiceoverUrl;
                    a.download = "fstudiox_voiceover.webm";
                    a.click();
                  }}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    border: "1px solid var(--fsx-border)",
                    color: "var(--fsx-text-secondary)",
                  }}
                >
                  <Mic size={14} /> Download Voiceover
                </button>
              )}
            </div>
          )}

          {/* ── AI AUDIO ── */}
          {activeTab === "ai" && (
            <AIMusicTab
              audioRef={audioRef}
              duration={duration}
              noAudio={noAudio}
            />
          )}
        </div>
      </div>

      {/* Master volume bar */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-2"
        style={{
          backgroundColor: "var(--fsx-bg-elevated)",
          borderTop: "1px solid var(--fsx-border)",
        }}
      >
        <Volume2 size={13} style={{ color: "var(--fsx-text-muted)" }} />
        <input
          type="range"
          min={0}
          max={100}
          value={effects.volume}
          data-ocid="music_editor.master_volume"
          onChange={(e) =>
            setEffects((p) => ({ ...p, volume: Number(e.target.value) }))
          }
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "var(--fsx-accent)" }}
          aria-label="Master volume"
        />
        <span
          className="text-xs font-mono w-9 text-right"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          {effects.volume}%
        </span>
      </div>
    </div>
  );
}
