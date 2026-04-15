// ─── Face Swap Tab — Gallery-based face clone ────────────────────────────────
import { useRef, useState } from "react";
import {
  ActionButton,
  SliderControl,
  TabSectionHeader,
} from "../ImageEditorShared";
import { blendFaceOntoTarget, detectFaceBBox } from "../imageEditorUtils";

export interface FaceSwapState {
  facePhotoUrl: string | null;
  blendOpacity: number;
  blendMode: string;
  faceBox: { x: number; y: number; w: number; h: number } | null;
}

export const DEFAULT_FACE_SWAP: FaceSwapState = {
  facePhotoUrl: null,
  blendOpacity: 88,
  blendMode: "normal",
  faceBox: null,
};

type Step = "source" | "target" | "blend";

export function FaceSwapTab({
  imageUrl,
  faceSwap,
  onChange,
  onApply,
}: {
  imageUrl: string;
  faceSwap: FaceSwapState;
  onChange: (update: Partial<FaceSwapState>) => void;
  /** Called with the merged result data-URL so ImageEditor can update imageUrl */
  onApply: (resultUrl: string) => void;
}) {
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("source");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null); // null = use current editor image
  const [useCurrentAsTarget, setUseCurrentAsTarget] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"ok" | "err">("ok");

  const handleSourcePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceUrl(URL.createObjectURL(file));
    setStep("target");
    setStatusMsg(null);
  };

  const handleTargetPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTargetUrl(URL.createObjectURL(file));
    setUseCurrentAsTarget(false);
    setStatusMsg(null);
  };

  const handleApply = () => {
    if (!sourceUrl) return;
    const resolvedTarget = useCurrentAsTarget
      ? imageUrl
      : (targetUrl ?? imageUrl);
    setIsProcessing(true);
    setStatusMsg(null);

    const srcImg = new Image();
    const tgtImg = new Image();
    let loadCount = 0;

    const onBothLoaded = () => {
      loadCount++;
      if (loadCount < 2) return;
      try {
        const srcBox = detectFaceBBox(srcImg);
        const tgtBox = detectFaceBBox(tgtImg);
        if (!srcBox) {
          setStatusMsg(
            "⚠ Could not detect a face in source photo. Try a clear front-facing photo.",
          );
          setStatusType("err");
          setIsProcessing(false);
          return;
        }
        if (!tgtBox) {
          setStatusMsg(
            "⚠ Could not detect a face in target photo. Try a clear front-facing photo.",
          );
          setStatusType("err");
          setIsProcessing(false);
          return;
        }
        onChange({ faceBox: tgtBox });
        const result = blendFaceOntoTarget(
          tgtImg,
          srcImg,
          tgtBox,
          srcBox,
          faceSwap.blendOpacity,
        );
        onApply(result);
        setStatusMsg("✓ Face swap applied! Use Download to save.");
        setStatusType("ok");
      } catch {
        setStatusMsg("⚠ Processing failed. Try a different photo.");
        setStatusType("err");
      }
      setIsProcessing(false);
    };

    srcImg.crossOrigin = "anonymous";
    tgtImg.crossOrigin = "anonymous";
    srcImg.onload = onBothLoaded;
    tgtImg.onload = onBothLoaded;
    srcImg.src = sourceUrl;
    tgtImg.src = resolvedTarget;
  };

  return (
    <div className="space-y-4">
      <TabSectionHeader>Face Swap / Clone</TabSectionHeader>

      {/* Step indicator */}
      <div className="flex gap-1">
        {(["source", "target", "blend"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => setStep(s)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor:
                  step === s ? "var(--fsx-accent)" : "var(--fsx-bg-elevated)",
                color: step === s ? "#fff" : "var(--fsx-text-muted)",
                border: `1px solid ${step === s ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
              }}
            >
              {i + 1}.{" "}
              {s === "source"
                ? "Source Face"
                : s === "target"
                  ? "Target"
                  : "Blend"}
            </button>
            {i < 2 && (
              <span style={{ color: "var(--fsx-text-muted)", fontSize: 10 }}>
                ›
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Source face */}
      {step === "source" && (
        <div className="space-y-3">
          <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
            Choose a photo that contains the{" "}
            <strong style={{ color: "var(--fsx-text-secondary)" }}>
              face you want to use
            </strong>
            . Best results with a clear, front-facing portrait.
          </p>
          <input
            ref={sourceInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSourcePick}
          />
          <ActionButton
            variant="primary"
            dataOcid="image_editor.face_source.button"
            onClick={() => sourceInputRef.current?.click()}
          >
            📷 Choose Source Face Photo
          </ActionButton>
          {sourceUrl && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--fsx-border)" }}
            >
              <img
                src={sourceUrl}
                alt="Source face"
                className="w-full h-28 object-cover"
              />
              <div
                className="px-2 py-1 text-[10px] text-center"
                style={{
                  color: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.08)",
                }}
              >
                ✓ Source face selected
              </div>
            </div>
          )}
          {sourceUrl && (
            <ActionButton onClick={() => setStep("target")}>
              Next: Choose Target →
            </ActionButton>
          )}
        </div>
      )}

      {/* Step 2 — Target photo */}
      {step === "target" && (
        <div className="space-y-3">
          <p className="text-[11px]" style={{ color: "var(--fsx-text-muted)" }}>
            Choose the photo whose face will be{" "}
            <strong style={{ color: "var(--fsx-text-secondary)" }}>
              replaced
            </strong>
            , or use the current editor image.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUseCurrentAsTarget(true)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: useCurrentAsTarget
                  ? "var(--fsx-accent)"
                  : "var(--fsx-bg-elevated)",
                color: useCurrentAsTarget ? "#fff" : "var(--fsx-text-muted)",
                border: `1px solid ${useCurrentAsTarget ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
              }}
            >
              Use Current Image
            </button>
            <button
              type="button"
              onClick={() => setUseCurrentAsTarget(false)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: !useCurrentAsTarget
                  ? "var(--fsx-accent)"
                  : "var(--fsx-bg-elevated)",
                color: !useCurrentAsTarget ? "#fff" : "var(--fsx-text-muted)",
                border: `1px solid ${!useCurrentAsTarget ? "var(--fsx-accent)" : "var(--fsx-border)"}`,
              }}
            >
              From Gallery
            </button>
          </div>

          {!useCurrentAsTarget && (
            <>
              <input
                ref={targetInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleTargetPick}
              />
              <ActionButton
                dataOcid="image_editor.face_target.button"
                onClick={() => targetInputRef.current?.click()}
              >
                📷 Choose Target Photo
              </ActionButton>
              {targetUrl && (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--fsx-border)" }}
                >
                  <img
                    src={targetUrl}
                    alt="Target"
                    className="w-full h-28 object-cover"
                  />
                </div>
              )}
            </>
          )}

          <ActionButton onClick={() => setStep("blend")}>
            Next: Blend Settings →
          </ActionButton>
        </div>
      )}

      {/* Step 3 — Blend settings & apply */}
      {step === "blend" && (
        <div className="space-y-3">
          <SliderControl
            label="Face Opacity"
            icon="◌"
            value={faceSwap.blendOpacity}
            min={30}
            max={100}
            onChange={(v) => onChange({ blendOpacity: v })}
          />

          {!sourceUrl && (
            <div
              className="rounded-lg p-2.5 text-[11px]"
              style={{
                backgroundColor: "rgba(225,29,46,0.08)",
                color: "#f87171",
                border: "1px solid rgba(225,29,46,0.2)",
              }}
            >
              ⚠ Go back to Step 1 and choose a source face photo first.
            </div>
          )}

          {sourceUrl && (
            <ActionButton
              variant="primary"
              dataOcid="image_editor.face_apply.button"
              onClick={handleApply}
            >
              {isProcessing ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Processing…
                </span>
              ) : (
                "🔀 Apply Face Swap"
              )}
            </ActionButton>
          )}

          {statusMsg && (
            <div
              className="rounded-lg p-2.5 text-xs"
              style={{
                backgroundColor:
                  statusType === "ok"
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(225,29,46,0.08)",
                color: statusType === "ok" ? "#22c55e" : "#f87171",
                border: `1px solid ${statusType === "ok" ? "rgba(34,197,94,0.2)" : "rgba(225,29,46,0.2)"}`,
              }}
            >
              {statusMsg}
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      <div
        className="rounded-lg p-2.5"
        style={{
          backgroundColor: "var(--fsx-bg-elevated)",
          border: "1px solid var(--fsx-border)",
        }}
      >
        <p className="text-[10px]" style={{ color: "var(--fsx-text-muted)" }}>
          💡{" "}
          <strong style={{ color: "var(--fsx-text-secondary)" }}>Tips:</strong>{" "}
          Use clear front-facing photos for best results. After applying, use
          the <em>Adjust</em> tab to match skin tone.
        </p>
      </div>
    </div>
  );
}
