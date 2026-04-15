import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Save,
  Smartphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import type { ToolId } from "./Sidebar";

interface ToolbarProps {
  projectTitle: string;
  onProjectTitleChange: (title: string) => void;
  toolLabel: string;
  activeTool: ToolId;
  lastAutoSave: Date | null;
  onManualSave: () => void;
  getEditorContent: () => string;
}

function useAutoSaveLabel(lastAutoSave: Date | null) {
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAutoSave) return;
    setVisible(true);
    setLabel("Auto-saved");

    const updateLabel = () => {
      const diffMs = Date.now() - lastAutoSave.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) setLabel("Auto-saved just now");
      else if (diffMins === 1) setLabel("Auto-saved 1 min ago");
      else setLabel(`Auto-saved ${diffMins} min ago`);
    };

    const fadeTimer = setTimeout(updateLabel, 3000);
    const intervalTimer = setInterval(updateLabel, 30000);

    return () => {
      clearTimeout(fadeTimer);
      clearInterval(intervalTimer);
    };
  }, [lastAutoSave]);

  return { label, visible };
}

export default function Toolbar({
  projectTitle,
  onProjectTitleChange,
  toolLabel,
  activeTool,
  lastAutoSave,
  onManualSave,
  getEditorContent,
}: ToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { canInstall, promptInstall, isIOS } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);
  const { label: autoSaveLabel, visible: autoSaveVisible } =
    useAutoSaveLabel(lastAutoSave);

  const handleSave = () => {
    onManualSave();
    toast.success("Draft saved!", { duration: 2000 });
  };

  const handleDownload = () => {
    if (activeTool === "text") {
      const content = getEditorContent();
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectTitle || "fstudiox-text"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Text file downloaded!");
    } else if (activeTool === "image") {
      const img = document.querySelector<HTMLImageElement>(
        "[data-ocid='image_editor.canvas_target']",
      );
      if (!img?.src) {
        toast.error("No image to download. Please upload an image first.");
        return;
      }
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";
      tempImg.onload = () => {
        canvas.width = tempImg.naturalWidth;
        canvas.height = tempImg.naturalHeight;
        if (ctx) {
          ctx.filter = img.style.filter || "none";
          ctx.drawImage(tempImg, 0, 0);
        }
        const link = document.createElement("a");
        link.download = `${projectTitle || "fstudiox-image"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image downloaded!");
      };
      tempImg.src = img.src;
    } else {
      toast.success("Export started — check downloads.");
    }
  };

  const handleInstallClick = () => {
    if (isIOS) setShowIOSHint((prev) => !prev);
    else promptInstall();
  };

  const startEdit = () => {
    setTempTitle(projectTitle);
    setIsEditing(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    onProjectTitleChange(tempTitle.trim() || "Untitled Project");
    setIsEditing(false);
  };

  return (
    <div
      data-ocid="studio.toolbar.panel"
      className="flex items-center justify-between gap-2 px-3 sm:px-4 shrink-0"
      style={{
        height: "52px",
        backgroundColor: "var(--fsx-bg-surface)",
        borderBottom: "1px solid var(--fsx-border)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* ── Left: Logo + Title ── */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Logo */}
        <img
          src="/assets/generated/fstudiox-logo-v3-nav.dim_200x200.png"
          alt="FStudioX"
          className="w-7 h-7 rounded-lg object-cover shrink-0"
        />

        {/* Editable project title */}
        {isEditing ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <input
              ref={titleInputRef}
              data-ocid="studio.project_title.input"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              onBlur={commitEdit}
              className="flex-1 min-w-0 rounded-lg px-2.5 py-1 text-sm font-semibold text-white outline-none"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                border: "1.5px solid var(--fsx-accent)",
                maxWidth: "180px",
              }}
            />
            <button
              type="button"
              data-ocid="studio.project_title.save_button"
              onClick={commitEdit}
              className="p-1 rounded-md transition-colors active:scale-95"
              style={{
                backgroundColor: "rgba(225,29,46,0.15)",
                color: "var(--fsx-accent)",
              }}
            >
              <Check size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-ocid="studio.project_title.edit_button"
            onClick={startEdit}
            className="flex items-center gap-1.5 min-w-0 group rounded-lg px-1.5 py-1 -mx-1.5 transition-colors hover:bg-fsx-elevated"
            style={{ color: "var(--fsx-text-primary)" }}
          >
            <span className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[180px]">
              {projectTitle}
            </span>
            <Edit3
              size={11}
              className="shrink-0 opacity-30 group-hover:opacity-70 transition-opacity"
              style={{ color: "var(--fsx-text-muted)" }}
            />
          </button>
        )}

        {/* Active tool label pill — hidden on very small screens */}
        <div
          className="hidden sm:flex items-center px-2 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: "rgba(225,29,46,0.1)",
            border: "1px solid rgba(225,29,46,0.2)",
          }}
        >
          <span
            className="text-[10px] font-semibold"
            style={{ color: "var(--fsx-accent)" }}
          >
            {toolLabel}
          </span>
        </div>

        {/* Auto-save status — desktop only */}
        {autoSaveVisible && autoSaveLabel && (
          <div
            data-ocid="studio.autosave.indicator"
            className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            {autoSaveLabel === "Auto-saved" ? (
              <CheckCircle2 size={10} style={{ color: "#22c55e" }} />
            ) : (
              <Clock size={10} style={{ color: "#22c55e" }} />
            )}
            <span className="text-[10px]" style={{ color: "#22c55e" }}>
              {autoSaveLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Right: Action buttons ── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Save */}
        <button
          type="button"
          data-ocid="studio.save.secondary_button"
          onClick={handleSave}
          title="Save (Ctrl+S)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 hover:text-white"
          style={{
            backgroundColor: "var(--fsx-bg-elevated)",
            border: "1px solid var(--fsx-border)",
            color: "var(--fsx-text-secondary)",
          }}
        >
          <Save size={13} />
          <span className="hidden sm:block">Save</span>
        </button>

        {/* Install App */}
        {canInstall && (
          <div className="relative">
            <button
              type="button"
              data-ocid="studio.install_app.button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 hover:text-white"
              style={{
                backgroundColor: "var(--fsx-bg-elevated)",
                border: "1px solid var(--fsx-border)",
                color: "var(--fsx-text-secondary)",
              }}
            >
              <Smartphone size={13} />
              <span className="hidden sm:block">Install</span>
            </button>
            {isIOS && showIOSHint && (
              <div
                className="absolute right-0 top-10 w-52 p-3 rounded-xl text-xs z-50"
                style={{
                  backgroundColor: "var(--fsx-bg-surface)",
                  border: "1px solid var(--fsx-border)",
                  color: "var(--fsx-text-secondary)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                In Safari: tap <strong style={{ color: "white" }}>Share</strong>{" "}
                then{" "}
                <strong style={{ color: "white" }}>
                  &ldquo;Add to Home Screen&rdquo;
                </strong>
                .
              </div>
            )}
          </div>
        )}

        {/* Download — primary CTA */}
        <button
          type="button"
          data-ocid="studio.download.primary_button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
          style={{
            backgroundColor: "var(--fsx-accent)",
            boxShadow: "0 2px 8px rgba(225,29,46,0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--fsx-accent-hover)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 16px rgba(225,29,46,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--fsx-accent)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 2px 8px rgba(225,29,46,0.3)";
          }}
        >
          <Download size={13} />
          <span className="hidden sm:block">Download</span>
        </button>
      </div>
    </div>
  );
}
