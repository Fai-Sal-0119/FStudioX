import {
  Activity,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Mic,
  Music2,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
  Wand2,
  ZapOff,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/* ─── types ─────────────────────────────────────────────────────────────── */
interface BeatDetectionResult {
  beatTimes: number[];
  bpm: number;
}

interface SeparationResult {
  vocalsUrl: string;
  musicUrl: string;
}

interface AIMusicTabProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  duration: number;
  noAudio: boolean;
  /** Beat times (seconds) — forwarded back to parent for snap-to-beat in Trim */
  onBeatsDetected?: (beats: number[]) => void;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
function sectionCard(children: React.ReactNode, ocid: string) {
  return (
    <div
      data-ocid={ocid}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--fsx-border)" }}
    >
      {children}
    </div>
  );
}

function StatusBadge({
  text,
  type,
}: { text: string; type: "success" | "error" | "info" }) {
  const colorMap = {
    success: {
      bg: "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.3)",
      color: "#22c55e",
    },
    error: {
      bg: "rgba(225,29,46,0.1)",
      border: "rgba(225,29,46,0.3)",
      color: "var(--fsx-accent)",
    },
    info: {
      bg: "rgba(96,165,250,0.1)",
      border: "rgba(96,165,250,0.3)",
      color: "#60a5fa",
    },
  };
  const c = colorMap[type];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
      }}
    >
      {text}
    </span>
  );
}

/* ─── sub-tool card ──────────────────────────────────────────────────────── */
function ToolCard({
  icon,
  title,
  subtitle,
  badge,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--fsx-border)",
        backgroundColor: "var(--fsx-bg-elevated)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{
          backgroundColor: expanded ? "rgba(225,29,46,0.06)" : "transparent",
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(225,29,46,0.12)" }}
        >
          <span style={{ color: "var(--fsx-accent)" }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{title}</p>
            {badge}
          </div>
          <p
            className="text-xs truncate"
            style={{ color: "var(--fsx-text-muted)" }}
          >
            {subtitle}
          </p>
        </div>
        <span style={{ color: "var(--fsx-text-muted)" }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 pt-2 space-y-3"
          style={{ borderTop: "1px solid var(--fsx-border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */
export default function AIMusicTab({
  audioRef,
  duration,
  noAudio,
  onBeatsDetected,
}: AIMusicTabProps) {
  /* expanded panels */
  const [openPanel, setOpenPanel] = useState<
    "beats" | "separator" | "enhance" | "normalize" | null
  >("beats");
  const toggle = (p: typeof openPanel) =>
    setOpenPanel((prev) => (prev === p ? null : p));

  /* ── Beat Detection state ── */
  const [isDetecting, setIsDetecting] = useState(false);
  const [beatResult, setBeatResult] = useState<BeatDetectionResult | null>(
    null,
  );
  const [snapToBeat, setSnapToBeat] = useState(false);

  /* ── Audio Separator state ── */
  const [isSeparating, setIsSeparating] = useState(false);
  const [sepResult, setSepResult] = useState<SeparationResult | null>(null);
  const [playingTrack, setPlayingTrack] = useState<"vocals" | "music" | null>(
    null,
  );
  const vocalsAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Voiceover Enhance state ── */
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(true);
  const [isPlayingEnhanced, setIsPlayingEnhanced] = useState(false);
  const enhancedAudioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Normalize state ── */
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizeResult, setNormalizeResult] = useState<{
    peakBefore: number;
    peakAfter: number;
    normalizedUrl: string;
  } | null>(null);
  const [normalizeUndoUrl, setNormalizeUndoUrl] = useState<string | null>(null);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* BEAT DETECTION                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */
  const detectBeats = async () => {
    const audio = audioRef.current;
    if (!audio?.src || noAudio) {
      toast.error("Load an audio track first.");
      return;
    }
    setIsDetecting(true);
    setBeatResult(null);
    try {
      const ctx = new AudioContext();
      const response = await fetch(audio.src);
      const arrayBuf = await response.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      await ctx.close();

      const channelData = audioBuf.getChannelData(0);
      const sampleRate = audioBuf.sampleRate;
      const hopSamples = Math.round(sampleRate * 0.01); // ~10ms hop

      /* energy envelope per hop */
      const hops = Math.floor(channelData.length / hopSamples);
      const energy: number[] = new Array(hops);
      for (let h = 0; h < hops; h++) {
        let e = 0;
        const start = h * hopSamples;
        const end = Math.min(start + hopSamples, channelData.length);
        for (let i = start; i < end; i++) {
          e += channelData[i] ** 2;
        }
        energy[h] = e / hopSamples;
      }

      /* onset strength: positive slope in energy */
      const onset: number[] = new Array(hops).fill(0);
      for (let h = 1; h < hops; h++) {
        const diff = energy[h] - energy[h - 1];
        onset[h] = diff > 0 ? diff : 0;
      }

      /* stats for threshold */
      const mean = onset.reduce((a, b) => a + b, 0) / onset.length;
      const variance =
        onset.reduce((a, b) => a + (b - mean) ** 2, 0) / onset.length;
      const std = Math.sqrt(variance);
      const threshold = mean + 1.5 * std;

      /* peak picking */
      const minInterval = 0.3; // seconds
      const minHopGap = Math.round((minInterval * sampleRate) / hopSamples);
      const beatTimes: number[] = [];
      let lastBeatHop = -minHopGap;

      for (let h = 1; h < hops - 1; h++) {
        if (
          onset[h] > threshold &&
          onset[h] > onset[h - 1] &&
          onset[h] >= onset[h + 1] &&
          h - lastBeatHop >= minHopGap
        ) {
          beatTimes.push((h * hopSamples) / sampleRate);
          lastBeatHop = h;
        }
      }

      /* BPM from median IBI */
      let bpm = 0;
      if (beatTimes.length >= 2) {
        const ibis: number[] = [];
        for (let i = 1; i < beatTimes.length; i++) {
          ibis.push(beatTimes[i] - beatTimes[i - 1]);
        }
        ibis.sort((a, b) => a - b);
        const medianIBI = ibis[Math.floor(ibis.length / 2)];
        bpm = Math.round(60 / medianIBI);
        /* clamp to reasonable range */
        bpm = Math.max(40, Math.min(240, bpm));
      }

      setBeatResult({ beatTimes, bpm });
      onBeatsDetected?.(beatTimes);
      toast.success(
        `Beat detection complete — ${beatTimes.length} beats found`,
      );
    } catch {
      toast.error("Beat detection failed. Try a different audio file.");
    } finally {
      setIsDetecting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* AUDIO SEPARATOR                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */
  const separateAudio = async () => {
    const audio = audioRef.current;
    if (!audio?.src || noAudio) {
      toast.error("Load an audio track first.");
      return;
    }
    setIsSeparating(true);
    setSepResult(null);
    try {
      const response = await fetch(audio.src);
      const arrayBuf = await response.arrayBuffer();

      /* ── Vocals (band-pass 300–3400 Hz) ── */
      const vocalsCtx = new OfflineAudioContext(1, 0, 44100);
      const vocalsBuf = await vocalsCtx.decodeAudioData(arrayBuf.slice(0));
      const vocalsFullCtx = new OfflineAudioContext(
        vocalsBuf.numberOfChannels,
        vocalsBuf.length,
        vocalsBuf.sampleRate,
      );
      const vocalsSource = vocalsFullCtx.createBufferSource();
      vocalsSource.buffer = vocalsBuf;
      const hpFilter = vocalsFullCtx.createBiquadFilter();
      hpFilter.type = "highpass";
      hpFilter.frequency.value = 300;
      const lpFilter = vocalsFullCtx.createBiquadFilter();
      lpFilter.type = "lowpass";
      lpFilter.frequency.value = 3400;
      vocalsSource.connect(hpFilter);
      hpFilter.connect(lpFilter);
      lpFilter.connect(vocalsFullCtx.destination);
      vocalsSource.start(0);
      const vocalsRendered = await vocalsFullCtx.startRendering();
      const vocalsUrl = bufferToWavUrl(vocalsRendered);

      /* ── Music (notch 300–3400 Hz via two shelf filters) ── */
      const musicCtx = new OfflineAudioContext(
        vocalsRendered.numberOfChannels,
        vocalsRendered.length,
        vocalsRendered.sampleRate,
      );
      const musicBuf = await musicCtx.decodeAudioData(arrayBuf.slice(0));
      const musicSource = musicCtx.createBufferSource();
      musicSource.buffer = musicBuf;
      const notch = musicCtx.createBiquadFilter();
      notch.type = "notch";
      notch.frequency.value = 1700; // center of 300–3400 band
      notch.Q.value = 1.5;
      musicSource.connect(notch);
      notch.connect(musicCtx.destination);
      musicSource.start(0);
      const musicRendered = await musicCtx.startRendering();
      const musicUrl = bufferToWavUrl(musicRendered);

      setSepResult({ vocalsUrl, musicUrl });
      toast.success("Basic separation complete");
    } catch {
      toast.error("Separation failed. Try a different file.");
    } finally {
      setIsSeparating(false);
    }
  };

  const toggleSepPlay = (track: "vocals" | "music") => {
    const ref = track === "vocals" ? vocalsAudioRef : musicAudioRef;
    const other = track === "vocals" ? musicAudioRef : vocalsAudioRef;
    if (!ref.current) return;
    if (playingTrack === track) {
      ref.current.pause();
      setPlayingTrack(null);
    } else {
      other.current?.pause();
      ref.current.play().catch(() => {});
      setPlayingTrack(track);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* VOICEOVER ENHANCE                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */
  const enhanceVoiceover = async () => {
    const audio = audioRef.current;
    if (!audio?.src || noAudio) {
      toast.error("Load an audio track first.");
      return;
    }
    setIsEnhancing(true);
    setEnhancedUrl(null);
    try {
      const response = await fetch(audio.src);
      const arrayBuf = await response.arrayBuffer();
      const tempCtx = new AudioContext();
      const srcBuf = await tempCtx.decodeAudioData(arrayBuf);
      await tempCtx.close();

      const offCtx = new OfflineAudioContext(
        srcBuf.numberOfChannels,
        srcBuf.length,
        srcBuf.sampleRate,
      );
      const source = offCtx.createBufferSource();
      source.buffer = srcBuf;

      /* high-pass: removes room rumble below 80Hz */
      const hp = offCtx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 80;
      hp.Q.value = 0.7;

      /* compressor: -24dB threshold, 4:1 ratio, level evenness */
      const comp = offCtx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.25;
      comp.knee.value = 6;

      /* presence boost: +3dB shelf around 2–4kHz */
      const presence = offCtx.createBiquadFilter();
      presence.type = "peaking";
      presence.frequency.value = 3000;
      presence.Q.value = 1.0;
      presence.gain.value = 3;

      source.connect(hp);
      hp.connect(comp);
      comp.connect(presence);
      presence.connect(offCtx.destination);
      source.start(0);

      const rendered = await offCtx.startRendering();
      const url = bufferToWavUrl(rendered);
      setEnhancedUrl(url);
      setShowBefore(false);
      toast.success("Voiceover enhanced — preview the result");
    } catch {
      toast.error("Enhancement failed.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleEnhancedPlay = () => {
    if (!enhancedAudioRef.current || !enhancedUrl) return;
    if (isPlayingEnhanced) {
      enhancedAudioRef.current.pause();
      setIsPlayingEnhanced(false);
    } else {
      enhancedAudioRef.current.play().catch(() => {});
      setIsPlayingEnhanced(true);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* NORMALIZE                                                                */
  /* ─────────────────────────────────────────────────────────────────────── */
  const normalizeAudio = async () => {
    const audio = audioRef.current;
    if (!audio?.src || noAudio) {
      toast.error("Load an audio track first.");
      return;
    }
    setIsNormalizing(true);
    setNormalizeResult(null);
    try {
      const response = await fetch(audio.src);
      const arrayBuf = await response.arrayBuffer();
      const tempCtx = new AudioContext();
      const srcBuf = await tempCtx.decodeAudioData(arrayBuf);
      await tempCtx.close();

      /* find peak amplitude */
      let peak = 0;
      for (let ch = 0; ch < srcBuf.numberOfChannels; ch++) {
        const data = srcBuf.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
          if (Math.abs(data[i]) > peak) peak = Math.abs(data[i]);
        }
      }

      /* target: -3dBFS = 10^(-3/20) ≈ 0.7079 */
      const targetPeak = 0.7079;
      const gain = peak > 0 ? targetPeak / peak : 1;

      /* apply gain to new buffer */
      const offCtx = new OfflineAudioContext(
        srcBuf.numberOfChannels,
        srcBuf.length,
        srcBuf.sampleRate,
      );
      const source = offCtx.createBufferSource();
      source.buffer = srcBuf;
      const gainNode = offCtx.createGain();
      gainNode.gain.value = gain;
      source.connect(gainNode);
      gainNode.connect(offCtx.destination);
      source.start(0);

      const rendered = await offCtx.startRendering();
      const normalizedUrl = bufferToWavUrl(rendered);

      /* store original for undo */
      setNormalizeUndoUrl(audio.src);
      audio.src = normalizedUrl;

      const peakDbBefore = 20 * Math.log10(peak);
      const peakDbAfter = 20 * Math.log10(targetPeak);

      setNormalizeResult({
        peakBefore: Math.round(peakDbBefore * 10) / 10,
        peakAfter: Math.round(peakDbAfter * 10) / 10,
        normalizedUrl,
      });
      toast.success("Audio normalized to -3dBFS");
    } catch {
      toast.error("Normalization failed.");
    } finally {
      setIsNormalizing(false);
    }
  };

  const undoNormalize = () => {
    if (!normalizeUndoUrl || !audioRef.current) return;
    audioRef.current.src = normalizeUndoUrl;
    setNormalizeResult(null);
    setNormalizeUndoUrl(null);
    toast.success("Normalization undone");
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* RENDER                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 space-y-3" data-ocid="music_editor.ai_audio.panel">
      {/* Header banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(225,29,46,0.12) 0%, rgba(96,29,225,0.08) 100%)",
          border: "1px solid rgba(225,29,46,0.2)",
        }}
      >
        <Sparkles
          size={16}
          style={{ color: "var(--fsx-accent)", flexShrink: 0 }}
        />
        <div>
          <p className="text-xs font-bold text-white">AI Audio Tools</p>
          <p className="text-[10px]" style={{ color: "var(--fsx-text-muted)" }}>
            Client-side Web Audio API processing
          </p>
        </div>
        {noAudio && <StatusBadge text="No audio" type="error" />}
      </div>

      {/* ── 1. Beat Detection ── */}
      <ToolCard
        icon={<Activity size={16} />}
        title="AI Beat Detection"
        subtitle="Detect beats & BPM from audio onset strength"
        badge={
          beatResult ? (
            <StatusBadge text={`~${beatResult.bpm} BPM`} type="success" />
          ) : undefined
        }
        expanded={openPanel === "beats"}
        onToggle={() => toggle("beats")}
      >
        {/* Waveform with beat markers */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            height: "56px",
            backgroundColor: "#0b0b0f",
            border: "1px solid var(--fsx-border)",
          }}
          data-ocid="music_editor.ai_audio.beat_waveform"
          aria-label="Beat detection waveform"
        >
          {/* Static waveform bars */}
          {Array.from({ length: 48 }, (_, i) => {
            const h = ((Math.sin(i * 0.43 + 0.9) + 1) / 2) * 60 + 20;
            const pos = (i / 48) * 100;
            return (
              <div
                key={`wb-${pos.toFixed(2)}`}
                className="absolute bottom-2 w-0.5 rounded-full"
                style={{
                  left: `${pos}%`,
                  height: `${h}%`,
                  backgroundColor: "rgba(225,29,46,0.35)",
                }}
              />
            );
          })}
          {/* Beat marker ticks */}
          {beatResult &&
            duration > 0 &&
            beatResult.beatTimes.slice(0, 80).map((t) => (
              <div
                key={`bt-${t.toFixed(3)}`}
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: `${(t / duration) * 100}%`,
                  width: "2px",
                  backgroundColor: "var(--fsx-accent)",
                  opacity: 0.85,
                  boxShadow: "0 0 4px rgba(225,29,46,0.6)",
                }}
              />
            ))}
        </div>

        {beatResult && (
          <div className="grid grid-cols-2 gap-2">
            {sectionCard(
              <div className="p-3 text-center">
                <p
                  className="text-[10px]"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  BPM Estimate
                </p>
                <p
                  className="font-mono font-bold text-lg"
                  style={{ color: "var(--fsx-accent)" }}
                >
                  ~{beatResult.bpm}
                </p>
              </div>,
              "music_editor.ai_audio.bpm_display",
            )}
            {sectionCard(
              <div className="p-3 text-center">
                <p
                  className="text-[10px]"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  Beats Found
                </p>
                <p className="font-mono font-bold text-lg text-white">
                  {beatResult.beatTimes.length}
                </p>
              </div>,
              "music_editor.ai_audio.beat_count",
            )}
          </div>
        )}

        {/* Snap to beat toggle */}
        <div
          className="flex items-center justify-between py-2 px-3 rounded-lg"
          style={{
            backgroundColor: "var(--fsx-bg-surface)",
            border: "1px solid var(--fsx-border)",
          }}
        >
          <div>
            <p className="text-xs font-semibold text-white">Snap to Beat</p>
            <p
              className="text-[10px]"
              style={{ color: "var(--fsx-text-muted)" }}
            >
              Trim handles snap to nearest beat
            </p>
          </div>
          <button
            type="button"
            data-ocid="music_editor.ai_audio.snap_toggle"
            onClick={() => setSnapToBeat((p) => !p)}
            disabled={!beatResult}
            className="w-11 h-6 rounded-full transition-all relative"
            style={{
              backgroundColor:
                snapToBeat && beatResult
                  ? "var(--fsx-accent)"
                  : "var(--fsx-bg-elevated)",
              opacity: !beatResult ? 0.5 : 1,
              border: "1px solid var(--fsx-border)",
            }}
            aria-checked={snapToBeat}
            role="switch"
            aria-label="Snap trim handles to beat positions"
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{
                left: snapToBeat && beatResult ? "calc(100% - 22px)" : "2px",
                backgroundColor: "white",
              }}
            />
          </button>
        </div>

        <button
          type="button"
          data-ocid="music_editor.ai_audio.detect_beats"
          onClick={detectBeats}
          disabled={isDetecting || noAudio}
          className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: noAudio
              ? "var(--fsx-bg-elevated)"
              : "var(--fsx-accent)",
            color: noAudio ? "var(--fsx-text-muted)" : "white",
            opacity: isDetecting ? 0.7 : 1,
            cursor: noAudio || isDetecting ? "not-allowed" : "pointer",
            boxShadow:
              !noAudio && !isDetecting
                ? "0 0 12px rgba(225,29,46,0.25)"
                : "none",
          }}
        >
          {isDetecting ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Activity size={13} />
          )}
          {isDetecting ? "Detecting…" : "Detect Beats"}
        </button>
      </ToolCard>

      {/* ── 2. Audio Separator ── */}
      <ToolCard
        icon={<Music2 size={16} />}
        title="AI Audio Separator"
        subtitle="Basic separation — vocals vs background music"
        badge={<StatusBadge text="Basic" type="info" />}
        expanded={openPanel === "separator"}
        onToggle={() => toggle("separator")}
      >
        <p
          className="text-[10px] px-1"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          Applies band-pass (300–3400 Hz) for vocals and a notch filter for
          music. Not ML-quality — results vary by audio complexity.
        </p>

        {sepResult && (
          <div className="space-y-2">
            {/* biome-ignore lint/a11y/useMediaCaption: AI separated audio */}
            <audio
              ref={vocalsAudioRef}
              src={sepResult.vocalsUrl}
              onEnded={() => setPlayingTrack(null)}
            />
            {/* biome-ignore lint/a11y/useMediaCaption: AI separated audio */}
            <audio
              ref={musicAudioRef}
              src={sepResult.musicUrl}
              onEnded={() => setPlayingTrack(null)}
            />

            {[
              {
                track: "vocals" as const,
                label: "Vocals",
                icon: <Mic size={13} />,
              },
              {
                track: "music" as const,
                label: "Background Music",
                icon: <Music2 size={13} />,
              },
            ].map(({ track, label, icon }) => (
              <div
                key={track}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: "var(--fsx-bg-surface)",
                  border: `1px solid ${playingTrack === track ? "rgba(225,29,46,0.4)" : "var(--fsx-border)"}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      playingTrack === track
                        ? "var(--fsx-accent)"
                        : "rgba(225,29,46,0.12)",
                  }}
                >
                  <span
                    style={{
                      color:
                        playingTrack === track ? "white" : "var(--fsx-accent)",
                    }}
                  >
                    {icon}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white flex-1">
                  {label}
                </p>
                <button
                  type="button"
                  data-ocid={`music_editor.ai_audio.sep_play.${track}`}
                  onClick={() => toggleSepPlay(track)}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor:
                      playingTrack === track
                        ? "var(--fsx-accent)"
                        : "var(--fsx-bg-elevated)",
                    color:
                      playingTrack === track
                        ? "white"
                        : "var(--fsx-text-muted)",
                    border: "1px solid var(--fsx-border)",
                  }}
                >
                  {playingTrack === track ? "Pause" : "Play"}
                </button>
                <a
                  href={
                    track === "vocals"
                      ? sepResult.vocalsUrl
                      : sepResult.musicUrl
                  }
                  download={`fstudiox_${track}.wav`}
                  data-ocid={`music_editor.ai_audio.sep_download.${track}`}
                  className="p-1.5 rounded-lg transition-all"
                  style={{
                    color: "var(--fsx-text-muted)",
                    backgroundColor: "var(--fsx-bg-elevated)",
                    border: "1px solid var(--fsx-border)",
                  }}
                  aria-label={`Download ${label}`}
                >
                  <Download size={13} />
                </a>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          data-ocid="music_editor.ai_audio.separate"
          onClick={separateAudio}
          disabled={isSeparating || noAudio}
          className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: noAudio
              ? "var(--fsx-bg-elevated)"
              : "var(--fsx-accent)",
            color: noAudio ? "var(--fsx-text-muted)" : "white",
            opacity: isSeparating ? 0.7 : 1,
            cursor: noAudio || isSeparating ? "not-allowed" : "pointer",
            boxShadow:
              !noAudio && !isSeparating
                ? "0 0 12px rgba(225,29,46,0.25)"
                : "none",
          }}
        >
          {isSeparating ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <ZapOff size={13} />
          )}
          {isSeparating ? "Separating…" : "Run Basic Separation"}
        </button>
      </ToolCard>

      {/* ── 3. Voiceover Enhance ── */}
      <ToolCard
        icon={<Wand2 size={16} />}
        title="AI Voiceover Enhance"
        subtitle="High-pass + compressor + presence boost chain"
        badge={
          enhancedUrl ? (
            <StatusBadge text="Enhanced" type="success" />
          ) : undefined
        }
        expanded={openPanel === "enhance"}
        onToggle={() => toggle("enhance")}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "High-Pass", value: "80 Hz", desc: "Room rumble removed" },
            { label: "Compressor", value: "4:1", desc: "–24dB threshold" },
            { label: "Presence", value: "+3 dB", desc: "2–4 kHz clarity" },
          ].map(({ label, value, desc }) => (
            <div
              key={label}
              className="p-2.5 rounded-xl"
              style={{
                backgroundColor: "var(--fsx-bg-surface)",
                border: "1px solid var(--fsx-border)",
              }}
            >
              <p
                className="text-xs font-mono font-bold"
                style={{ color: "var(--fsx-accent)" }}
              >
                {value}
              </p>
              <p className="text-[10px] font-semibold text-white mt-0.5">
                {label}
              </p>
              <p
                className="text-[9px] mt-0.5"
                style={{ color: "var(--fsx-text-muted)" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>

        {enhancedUrl && (
          <>
            {/* biome-ignore lint/a11y/useMediaCaption: enhanced voiceover audio */}
            <audio
              ref={enhancedAudioRef}
              src={enhancedUrl}
              onEnded={() => setIsPlayingEnhanced(false)}
            />
            {/* Before / After toggle */}
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--fsx-border)" }}
              data-ocid="music_editor.ai_audio.enhance_toggle"
            >
              {(["Before", "After"] as const).map((label) => {
                const active = label === "Before" ? showBefore : !showBefore;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setShowBefore(label === "Before")}
                    className="flex-1 py-2 text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: active
                        ? "var(--fsx-accent)"
                        : "var(--fsx-bg-elevated)",
                      color: active ? "white" : "var(--fsx-text-muted)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                data-ocid="music_editor.ai_audio.enhance_preview"
                onClick={toggleEnhancedPlay}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: "rgba(225,29,46,0.12)",
                  border: "1px solid rgba(225,29,46,0.3)",
                  color: "var(--fsx-accent)",
                }}
              >
                {isPlayingEnhanced ? "Pause Preview" : "Preview Enhanced"}
              </button>
              <a
                href={enhancedUrl}
                download="fstudiox_enhanced_voice.wav"
                data-ocid="music_editor.ai_audio.enhance_download"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: "var(--fsx-bg-elevated)",
                  border: "1px solid var(--fsx-border)",
                  color: "var(--fsx-text-muted)",
                }}
                aria-label="Download enhanced voiceover"
              >
                <Download size={13} />
              </a>
            </div>
          </>
        )}

        <button
          type="button"
          data-ocid="music_editor.ai_audio.enhance"
          onClick={enhanceVoiceover}
          disabled={isEnhancing || noAudio}
          className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: noAudio
              ? "var(--fsx-bg-elevated)"
              : "var(--fsx-accent)",
            color: noAudio ? "var(--fsx-text-muted)" : "white",
            opacity: isEnhancing ? 0.7 : 1,
            cursor: noAudio || isEnhancing ? "not-allowed" : "pointer",
            boxShadow:
              !noAudio && !isEnhancing
                ? "0 0 12px rgba(225,29,46,0.25)"
                : "none",
          }}
        >
          {isEnhancing ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Wand2 size={13} />
          )}
          {isEnhancing ? "Enhancing…" : "Enhance Voiceover"}
        </button>
      </ToolCard>

      {/* ── 4. AI Normalize ── */}
      <ToolCard
        icon={<Sliders size={16} />}
        title="AI Audio Normalize"
        subtitle="Scale peak amplitude to –3 dBFS"
        badge={
          normalizeResult ? (
            <StatusBadge text="Normalized ✓" type="success" />
          ) : undefined
        }
        expanded={openPanel === "normalize"}
        onToggle={() => toggle("normalize")}
      >
        <p
          className="text-[10px] px-1"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          Finds peak amplitude in current audio and scales the entire track so
          the loudest sample hits exactly –3 dBFS.
        </p>

        {normalizeResult && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Before", value: `${normalizeResult.peakBefore} dB` },
              {
                label: "After",
                value: `${normalizeResult.peakAfter} dBFS`,
                accent: true,
              },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="p-3 rounded-xl text-center"
                style={{
                  backgroundColor: accent
                    ? "rgba(225,29,46,0.08)"
                    : "var(--fsx-bg-surface)",
                  border: `1px solid ${accent ? "rgba(225,29,46,0.25)" : "var(--fsx-border)"}`,
                }}
              >
                <p
                  className="text-[10px]"
                  style={{ color: "var(--fsx-text-muted)" }}
                >
                  {label}
                </p>
                <p
                  className="font-mono font-bold text-sm mt-0.5"
                  style={{ color: accent ? "var(--fsx-accent)" : "white" }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="music_editor.ai_audio.normalize"
            onClick={normalizeAudio}
            disabled={isNormalizing || noAudio || !!normalizeResult}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor:
                noAudio || normalizeResult
                  ? "var(--fsx-bg-elevated)"
                  : "var(--fsx-accent)",
              color:
                noAudio || normalizeResult ? "var(--fsx-text-muted)" : "white",
              opacity: isNormalizing ? 0.7 : 1,
              cursor:
                noAudio || isNormalizing || normalizeResult
                  ? "not-allowed"
                  : "pointer",
              boxShadow:
                !noAudio && !isNormalizing && !normalizeResult
                  ? "0 0 12px rgba(225,29,46,0.25)"
                  : "none",
            }}
          >
            {isNormalizing ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : normalizeResult ? (
              <CheckCircle size={13} />
            ) : (
              <Volume2 size={13} />
            )}
            {isNormalizing
              ? "Normalizing…"
              : normalizeResult
                ? "Normalized ✓"
                : "Normalize"}
          </button>

          {normalizeResult && (
            <button
              type="button"
              data-ocid="music_editor.ai_audio.normalize_undo"
              onClick={undoNormalize}
              className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                border: "1px solid var(--fsx-border)",
                color: "var(--fsx-text-muted)",
              }}
            >
              <RotateCcw size={12} /> Undo
            </button>
          )}
        </div>
      </ToolCard>
    </div>
  );
}

/* ─── util: AudioBuffer → WAV Blob URL ──────────────────────────────────── */
function bufferToWavUrl(buffer: AudioBuffer): string {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const arrayBuf = new ArrayBuffer(44 + length * numCh * 2);
  const view = new DataView(arrayBuf);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(off + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + length * numCh * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, length * numCh * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return URL.createObjectURL(new Blob([arrayBuf], { type: "audio/wav" }));
}
