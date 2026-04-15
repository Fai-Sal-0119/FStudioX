import { createActor } from "@/backend";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CloudUpload,
  Edit3,
  FolderOpen,
  Loader2,
  LogIn,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ToolId } from "./Sidebar";

const PROJECT_TYPES = ["text", "image", "video", "design"];

const TYPE_COLORS: Record<string, string> = {
  text: "#3B82F6",
  image: "#10B981",
  video: "#F59E0B",
  design: "#E11D2E",
};

interface ProjectWithId {
  id: bigint;
  title: string;
  content: string;
  projectType: string;
  createdAt: bigint;
  updatedAt: bigint;
}

interface ProjectsPanelProps {
  currentTool?: ToolId;
  projectTitle?: string;
  getEditorContent?: () => string;
}

export default function ProjectsPanel({
  currentTool,
  projectTitle,
  getEditorContent,
}: ProjectsPanelProps) {
  const { actor, isFetching: actorLoading } = useActor(createActor);
  const { identity, login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isLoggedIn = !!identity;

  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectType, setNewProjectType] = useState("text");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<bigint | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  // Cast actor to any for flexibility with backend methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyActor = actor as any;

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery<ProjectWithId[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!anyActor) return [];
      const raw = await anyActor.getProjects();
      return (raw as ProjectWithId[]).map((p, i) => ({ ...p, id: BigInt(i) }));
    },
    enabled: !!actor && !actorLoading && isLoggedIn,
  });

  // Create project
  const createMutation = useMutation({
    mutationFn: async ({
      title,
      type,
      content,
    }: { title: string; type: string; content: string }) => {
      if (!anyActor) throw new Error("Not connected");
      return anyActor.createProject(title, type, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created!");
      setCreateDialogOpen(false);
      setNewProjectTitle("");
      setNewProjectType("text");
    },
    onError: () => toast.error("Failed to create project"),
  });

  // Delete project
  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!anyActor) throw new Error("Not connected");
      return anyActor.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });

  // Rename project
  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: bigint; title: string }) => {
      if (!anyActor) throw new Error("Not connected");
      return anyActor.updateProject(id, title, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project renamed");
      setRenamingId(null);
    },
    onError: () => toast.error("Failed to rename project"),
  });

  const startRename = (p: ProjectWithId) => {
    setRenamingId(p.id);
    setRenameValue(p.title);
  };

  const commitRename = (id: bigint) => {
    if (renameValue.trim())
      renameMutation.mutate({ id, title: renameValue.trim() });
  };

  const formatDate = (ts: bigint) => {
    const ms = Number(ts / BigInt(1_000_000));
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(ms));
  };

  const formatRelativeDate = (ts: bigint) => {
    const ms = Number(ts / BigInt(1_000_000));
    const diffMs = Date.now() - ms;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const hrs = Math.floor(diffMins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return formatDate(ts);
  };

  // Save current editor work as a new project
  const handleSaveCurrentWork = async () => {
    if (!anyActor || !isLoggedIn) return;
    const title = projectTitle || "Untitled Project";
    const type =
      currentTool && currentTool !== "projects" ? currentTool : "text";
    const content = getEditorContent ? getEditorContent() : "";

    setIsSavingCurrent(true);
    try {
      await anyActor.createProject(title, type, content);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Current work saved as new project!", { duration: 3000 });
    } catch {
      toast.error("Failed to save current work");
    } finally {
      setIsSavingCurrent(false);
    }
  };

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div
        data-ocid="projects.panel"
        className="flex flex-col items-center justify-center h-full gap-6 px-6"
        style={{ backgroundColor: "var(--fsx-bg-primary)" }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: "rgba(225,29,46,0.1)",
            border: "1px solid rgba(225,29,46,0.2)",
          }}
        >
          <FolderOpen size={32} style={{ color: "var(--fsx-accent)" }} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Sign in to access Projects
          </h3>
          <p className="text-sm" style={{ color: "var(--fsx-text-muted)" }}>
            Your projects are saved securely on the blockchain.
          </p>
        </div>
        <button
          type="button"
          data-ocid="projects.login.primary_button"
          onClick={login}
          disabled={loginStatus === "logging-in"}
          className="fsx-btn-primary flex items-center gap-2"
        >
          {loginStatus === "logging-in" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogIn size={16} />
          )}
          {loginStatus === "logging-in" ? "Signing in..." : "Sign In"}
        </button>
      </div>
    );
  }

  return (
    <div
      data-ocid="projects.panel"
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--fsx-bg-primary)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{
          backgroundColor: "var(--fsx-bg-surface)",
          borderColor: "var(--fsx-border)",
        }}
      >
        <div>
          <h2 className="text-base font-bold text-white">My Projects</h2>
          <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Current Work button */}
          {currentTool && currentTool !== "projects" && (
            <button
              type="button"
              data-ocid="projects.save_current.button"
              onClick={handleSaveCurrentWork}
              disabled={isSavingCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: "rgba(225,29,46,0.12)",
                border: "1px solid rgba(225,29,46,0.3)",
                color: "#f5c6cb",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(225,29,46,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(225,29,46,0.12)";
              }}
              title="Save current editor work as a new project"
            >
              {isSavingCurrent ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CloudUpload size={12} />
              )}
              <span className="hidden sm:block">
                {isSavingCurrent ? "Saving..." : "Save Current Work"}
              </span>
            </button>
          )}

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                data-ocid="projects.new.primary_button"
                className="fsx-btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={15} /> New Project
              </button>
            </DialogTrigger>
            <DialogContent
              data-ocid="projects.create.dialog"
              className="border"
              style={{
                backgroundColor: "var(--fsx-bg-surface)",
                borderColor: "var(--fsx-border)",
                color: "white",
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-white">New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label
                    htmlFor="create-project-title"
                    className="text-sm"
                    style={{ color: "var(--fsx-text-secondary)" }}
                  >
                    Project Title
                  </label>
                  <input
                    data-ocid="projects.create.input"
                    id="create-project-title"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="My awesome project"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{
                      backgroundColor: "var(--fsx-bg-elevated)",
                      borderColor: "var(--fsx-border)",
                      color: "white",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newProjectTitle.trim()) {
                        createMutation.mutate({
                          title: newProjectTitle.trim(),
                          type: newProjectType,
                          content: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <span
                    className="text-sm"
                    style={{ color: "var(--fsx-text-secondary)" }}
                  >
                    Project Type
                  </span>
                  <Select
                    value={newProjectType}
                    onValueChange={setNewProjectType}
                  >
                    <SelectTrigger
                      data-ocid="projects.type.select"
                      className="border"
                      style={{
                        backgroundColor: "var(--fsx-bg-elevated)",
                        borderColor: "var(--fsx-border)",
                        color: "white",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: "var(--fsx-bg-surface)",
                        borderColor: "var(--fsx-border)",
                      }}
                    >
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="text-white capitalize"
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <button
                  type="button"
                  data-ocid="projects.create.cancel_button"
                  onClick={() => setCreateDialogOpen(false)}
                  className="fsx-btn-secondary text-sm px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-ocid="projects.create.submit_button"
                  onClick={() => {
                    if (newProjectTitle.trim()) {
                      createMutation.mutate({
                        title: newProjectTitle.trim(),
                        type: newProjectType,
                        content: "",
                      });
                    }
                  }}
                  disabled={!newProjectTitle.trim() || createMutation.isPending}
                  className="fsx-btn-primary text-sm flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  Create
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading || actorLoading ? (
          <div
            data-ocid="projects.loading_state"
            className="flex items-center justify-center h-40 gap-3"
            style={{ color: "var(--fsx-text-muted)" }}
          >
            <Loader2
              size={20}
              className="animate-spin"
              style={{ color: "var(--fsx-accent)" }}
            />
            <span className="text-sm">Loading projects...</span>
          </div>
        ) : isError ? (
          <div
            data-ocid="projects.error_state"
            className="flex flex-col items-center justify-center h-40 gap-3"
          >
            <p className="text-sm" style={{ color: "var(--fsx-accent)" }}>
              Failed to load projects
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div
            data-ocid="projects.empty_state"
            className="flex flex-col items-center justify-center h-60 gap-4"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(225,29,46,0.08)",
                border: "1px solid rgba(225,29,46,0.15)",
              }}
            >
              <FolderOpen size={24} style={{ color: "var(--fsx-accent)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white mb-1">
                No projects yet
              </p>
              <p className="text-xs" style={{ color: "var(--fsx-text-muted)" }}>
                Create your first project to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <div
                key={project.id.toString()}
                data-ocid={`projects.item.${i + 1}`}
                className="group p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: "var(--fsx-bg-surface)",
                  border: "1px solid var(--fsx-border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(225,29,46,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--fsx-border)";
                }}
              >
                {/* Badge + actions */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: `${TYPE_COLORS[project.projectType] ?? "#8B93A7"}20`,
                      color: TYPE_COLORS[project.projectType] ?? "#8B93A7",
                      border: `1px solid ${TYPE_COLORS[project.projectType] ?? "#8B93A7"}40`,
                    }}
                  >
                    {project.projectType}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-ocid={`projects.rename.edit_button.${i + 1}`}
                      onClick={() => startRename(project)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--fsx-text-muted)" }}
                      title="Rename"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      type="button"
                      data-ocid={`projects.delete.delete_button.${i + 1}`}
                      onClick={() => deleteMutation.mutate(project.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--fsx-accent)" }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Title (rename inline) */}
                {renamingId === project.id ? (
                  <div className="flex items-center gap-1 mb-2">
                    <input
                      data-ocid={`projects.rename.input.${i + 1}`}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(project.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="flex-1 bg-transparent border-b text-sm text-white outline-none"
                      style={{ borderColor: "var(--fsx-accent)" }}
                    />
                    <button
                      type="button"
                      data-ocid={`projects.rename.confirm_button.${i + 1}`}
                      onClick={() => commitRename(project.id)}
                    >
                      <Check size={13} style={{ color: "var(--fsx-accent)" }} />
                    </button>
                    <button
                      type="button"
                      data-ocid={`projects.rename.cancel_button.${i + 1}`}
                      onClick={() => setRenamingId(null)}
                    >
                      <X size={13} style={{ color: "var(--fsx-text-muted)" }} />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-sm font-semibold text-white mb-2 truncate">
                    {project.title}
                  </h3>
                )}

                {/* Timestamps */}
                <div className="space-y-0.5 mb-3">
                  <p
                    className="text-xs"
                    style={{ color: "var(--fsx-text-muted)" }}
                  >
                    Updated{" "}
                    <span style={{ color: "var(--fsx-text-secondary)" }}>
                      {formatRelativeDate(project.updatedAt)}
                    </span>
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--fsx-text-muted)" }}
                  >
                    Created {formatDate(project.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  data-ocid={`projects.open.button.${i + 1}`}
                  className="w-full py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: "var(--fsx-bg-elevated)",
                    border: "1px solid var(--fsx-border)",
                    color: "var(--fsx-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--fsx-text-secondary)";
                  }}
                >
                  <FolderOpen size={12} /> Open Project
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
