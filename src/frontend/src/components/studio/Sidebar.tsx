import {
  ArrowLeft,
  FolderOpen,
  ImageIcon,
  Palette,
  Type,
  Video,
} from "lucide-react";
import type { Page } from "../../App";

export type ToolId =
  | "text"
  | "image"
  | "video"
  | "design"
  | "music"
  | "projects"
  | "t2v";

interface SidebarProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  onNavigate: (page: Page) => void;
}

const tools: { id: ToolId; icon: React.ElementType; label: string }[] = [
  { id: "text", icon: Type, label: "Text" },
  { id: "image", icon: ImageIcon, label: "Image" },
  { id: "video", icon: Video, label: "Video" },
  { id: "design", icon: Palette, label: "Design" },
];

export default function Sidebar({
  activeTool,
  onToolChange,
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      data-ocid="studio.sidebar.panel"
      className="flex flex-col w-16 lg:w-60 shrink-0 border-r"
      style={{
        backgroundColor: "#101118",
        borderColor: "var(--fsx-border)",
        height: "100vh",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-3 lg:px-5 h-16 border-b shrink-0"
        style={{ borderColor: "var(--fsx-border)" }}
      >
        <img
          src="/assets/generated/fstudiox-logo-v3-nav.dim_200x200.png"
          alt="FStudioX Logo"
          className="w-8 h-8 rounded-lg object-cover shrink-0"
        />
        <span className="hidden lg:block font-heading font-bold text-lg text-white">
          FStudio<span style={{ color: "var(--fsx-accent)" }}>X</span>
        </span>
      </div>

      {/* Tools */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1 overflow-y-auto">
        <p
          className="hidden lg:block text-xs font-medium px-2 mb-3"
          style={{ color: "var(--fsx-text-muted)" }}
        >
          TOOLS
        </p>
        {tools.map(({ id, icon: Icon, label }) => {
          const isActive = activeTool === id;
          return (
            <button
              type="button"
              key={id}
              data-ocid={`sidebar.${id}.tab`}
              onClick={() => onToolChange(id)}
              className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
              style={{
                color: isActive ? "white" : "var(--fsx-text-muted)",
                backgroundColor: isActive
                  ? "rgba(225,29,46,0.12)"
                  : "transparent",
                borderLeft: isActive
                  ? "2px solid var(--fsx-accent)"
                  : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--fsx-text-muted)";
                }
              }}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </button>
          );
        })}

        <div
          className="my-3"
          style={{ borderTop: "1px solid var(--fsx-border)" }}
        />

        {/* Projects */}
        <button
          type="button"
          data-ocid="sidebar.projects.tab"
          onClick={() => onToolChange("projects")}
          className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            color:
              activeTool === "projects" ? "white" : "var(--fsx-text-muted)",
            backgroundColor:
              activeTool === "projects"
                ? "rgba(225,29,46,0.12)"
                : "transparent",
            borderLeft:
              activeTool === "projects"
                ? "2px solid var(--fsx-accent)"
                : "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (activeTool !== "projects") {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "white";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTool !== "projects") {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--fsx-text-muted)";
            }
          }}
        >
          <FolderOpen size={18} className="shrink-0" />
          <span className="hidden lg:block">Projects</span>
        </button>
      </nav>

      {/* Back to Home */}
      <div
        className="p-2 lg:p-3 border-t"
        style={{ borderColor: "var(--fsx-border)" }}
      >
        <button
          type="button"
          data-ocid="sidebar.back_home.link"
          onClick={() => onNavigate("landing")}
          className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "var(--fsx-text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--fsx-text-muted)";
          }}
        >
          <ArrowLeft size={18} className="shrink-0" />
          <span className="hidden lg:block">Back to Home</span>
        </button>
      </div>
    </aside>
  );
}
