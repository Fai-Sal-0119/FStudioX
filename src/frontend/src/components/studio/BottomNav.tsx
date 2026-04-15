import {
  Clapperboard,
  FolderOpen,
  Image,
  Layers,
  Music,
  Type,
  Video,
} from "lucide-react";
import type { ToolId } from "./Sidebar";

interface BottomNavProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
}

const NAV_ITEMS: {
  id: ToolId;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "image", label: "Photo", Icon: Image },
  { id: "video", label: "Video", Icon: Video },
  { id: "text", label: "Text", Icon: Type },
  { id: "design", label: "Design", Icon: Layers },
  { id: "music", label: "Music", Icon: Music },
  { id: "t2v", label: "T2V", Icon: Clapperboard },
  { id: "projects", label: "Projects", Icon: FolderOpen },
];

export default function BottomNav({
  activeTool,
  onToolChange,
}: BottomNavProps) {
  return (
    <nav
      data-ocid="studio.bottom_nav"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        backgroundColor: "var(--fsx-bg-surface)",
        borderTop: "1px solid var(--fsx-border)",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeTool === id;
        return (
          <button
            key={id}
            type="button"
            data-ocid={`studio.bottom_nav.${id}`}
            onClick={() => onToolChange(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 outline-none focus-visible:ring-2 active:scale-95 transition-transform duration-100"
            style={{
              height: "64px",
              color: isActive ? "var(--fsx-accent)" : "var(--fsx-text-muted)",
              minWidth: 0,
              paddingTop: "10px",
            }}
          >
            {/* Active indicator — pill bar at top */}
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-200"
              style={{
                width: isActive ? "28px" : "0px",
                height: "3px",
                backgroundColor: "var(--fsx-accent)",
                boxShadow: isActive
                  ? "0 0 8px rgba(225,29,46,0.8), 0 0 16px rgba(225,29,46,0.4)"
                  : "none",
                opacity: isActive ? 1 : 0,
              }}
              aria-hidden="true"
            />

            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />

            <span
              className="text-[10px] font-semibold leading-none tracking-wide mt-0.5"
              style={{
                color: isActive ? "var(--fsx-accent)" : "var(--fsx-text-muted)",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
