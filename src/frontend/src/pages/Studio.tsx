import { AlertCircle, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "../App";
import BottomNav from "../components/studio/BottomNav";
import ProjectsPanel from "../components/studio/ProjectsPanel";
import type { ToolId } from "../components/studio/Sidebar";
import Toolbar from "../components/studio/Toolbar";
import DesignEditor from "../components/studio/editors/DesignEditor";
import ImageEditor from "../components/studio/editors/ImageEditor";
import MusicEditor from "../components/studio/editors/MusicEditor";
import TextEditor from "../components/studio/editors/TextEditor";
import TextToVideoEditor from "../components/studio/editors/TextToVideoEditor";
import VideoEditor from "../components/studio/editors/VideoEditor";

interface StudioProps {
  onNavigate: (page: Page) => void;
  initialTool?: ToolId;
}

const DRAFT_KEY = "fstudiox_draft";
const AUTO_SAVE_INTERVAL = 30_000;

interface DraftData {
  activeTool: ToolId;
  projectTitle: string;
  savedAt: number;
}

function getEditorContent(tool: ToolId): string {
  if (tool === "text") {
    const el = document.querySelector<HTMLTextAreaElement>(
      "[data-ocid='text_editor.content.textarea']",
    );
    return el?.value ?? "";
  }
  if (tool === "image") {
    const el = document.querySelector<HTMLImageElement>(
      "[data-ocid='image_editor.canvas_target']",
    );
    return el?.src ?? "";
  }
  return "";
}

export default function Studio({
  onNavigate: _onNavigate,
  initialTool,
}: StudioProps) {
  const [activeTool, setActiveTool] = useState<ToolId>(initialTool ?? "image");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [prevTool, setPrevTool] = useState<ToolId>(initialTool ?? "image");
  const [transitioning, setTransitioning] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toolLabels: Record<ToolId, string> = {
    text: "Text Editor",
    image: "Photo Editor",
    video: "Video Editor",
    design: "Design Editor",
    music: "Music Editor",
    projects: "My Projects",
    t2v: "Text → Video",
  };

  const saveDraft = useCallback(() => {
    const draft: DraftData = {
      activeTool,
      projectTitle,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastAutoSave(new Date());
    } catch {
      // localStorage may be unavailable
    }
  }, [activeTool, projectTitle]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as DraftData;
        const ageMs = Date.now() - draft.savedAt;
        if (ageMs < 24 * 60 * 60 * 1000) {
          setPendingDraft(draft);
          setShowRestoreBanner(true);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(saveDraft, AUTO_SAVE_INTERVAL);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [saveDraft]);

  useEffect(() => {
    const handler = () => saveDraft();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveDraft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveDraft]);

  const handleToolChange = (tool: ToolId) => {
    if (tool === activeTool) return;
    setPrevTool(activeTool);
    setTransitioning(true);
    setTimeout(() => {
      setActiveTool(tool);
      setTransitioning(false);
    }, 120);
  };

  const handleRestore = () => {
    if (pendingDraft) {
      setActiveTool(pendingDraft.activeTool);
      setProjectTitle(pendingDraft.projectTitle);
    }
    setShowRestoreBanner(false);
    setPendingDraft(null);
  };

  const handleDismissBanner = () => {
    setShowRestoreBanner(false);
    setPendingDraft(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const formatDraftAge = (savedAt: number) => {
    const mins = Math.round((Date.now() - savedAt) / 60000);
    if (mins < 1) return "abhi abhi";
    if (mins === 1) return "1 minute pehle";
    if (mins < 60) return `${mins} minutes pehle`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} hour${hrs > 1 ? "s" : ""} pehle`;
  };

  const displayTool = transitioning ? prevTool : activeTool;

  // Bottom nav height: 64px base + safe-area. We apply padding to the scroll area.
  const BOTTOM_NAV_HEIGHT = 64;

  return (
    <div
      data-ocid="studio.page"
      className="flex flex-col bg-fsx-primary"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ── Toolbar (fixed top) ── */}
      <Toolbar
        projectTitle={projectTitle}
        onProjectTitleChange={setProjectTitle}
        toolLabel={toolLabels[activeTool]}
        activeTool={activeTool}
        lastAutoSave={lastAutoSave}
        onManualSave={saveDraft}
        getEditorContent={() => getEditorContent(activeTool)}
      />

      {/* ── Draft Restore Banner ── */}
      {showRestoreBanner && pendingDraft && (
        <div
          data-ocid="studio.restore_banner"
          className="flex items-center justify-between px-4 py-2.5 shrink-0 gap-3"
          style={{
            backgroundColor: "rgba(225,29,46,0.12)",
            borderBottom: "1px solid rgba(225,29,46,0.25)",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle
              size={14}
              style={{ color: "var(--fsx-accent)", flexShrink: 0 }}
            />
            <span className="text-xs font-medium" style={{ color: "#f5c6cb" }}>
              Apka pichla kaam save mila!{" "}
              <span style={{ color: "var(--fsx-text-muted)" }}>
                ({formatDraftAge(pendingDraft.savedAt)} ·{" "}
                {pendingDraft.activeTool} editor)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-ocid="studio.restore_banner.restore_button"
              onClick={handleRestore}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white transition-all active:scale-95"
              style={{ backgroundColor: "var(--fsx-accent)" }}
            >
              <RefreshCw size={11} />
              Restore
            </button>
            <button
              type="button"
              data-ocid="studio.restore_banner.dismiss_button"
              onClick={handleDismissBanner}
              className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--fsx-text-muted)" }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Editor Content Area (flex-1, scrollable, padded above fixed bottom nav) ── */}
      <main
        data-ocid="studio.editor_area"
        className="flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-150"
        style={{
          backgroundColor: "var(--fsx-bg-primary)",
          opacity: transitioning ? 0 : 1,
          // Extra bottom padding so content is never hidden behind the fixed nav
          paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + max(12px, env(safe-area-inset-bottom)))`,
        }}
      >
        {displayTool === "image" && <ImageEditor />}
        {displayTool === "video" && <VideoEditor />}
        {displayTool === "text" && <TextEditor />}
        {displayTool === "design" && <DesignEditor />}
        {displayTool === "music" && <MusicEditor />}
        {displayTool === "t2v" && <TextToVideoEditor />}
        {displayTool === "projects" && (
          <ProjectsPanel
            currentTool={activeTool}
            projectTitle={projectTitle}
            getEditorContent={() => getEditorContent(activeTool)}
          />
        )}
      </main>

      {/* ── Fixed Bottom Navigation ── */}
      <BottomNav activeTool={activeTool} onToolChange={handleToolChange} />
    </div>
  );
}
