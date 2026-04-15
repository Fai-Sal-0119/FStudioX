import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import type { ToolId } from "./components/studio/Sidebar";
import Landing from "./pages/Landing";
import Studio from "./pages/Studio";

export type Page = "landing" | "studio";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [activeTool, setActiveTool] = useState<ToolId>("image");

  const handleNavigate = (page: Page, tool?: ToolId) => {
    if (tool) setActiveTool(tool);
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-fsx-primary">
      {currentPage === "landing" && <Landing onNavigate={handleNavigate} />}
      {currentPage === "studio" && (
        <Studio
          onNavigate={(page) => handleNavigate(page)}
          initialTool={activeTool}
        />
      )}
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#14151C",
            border: "1px solid #2A2D3A",
            color: "#FFFFFF",
          },
        }}
      />
    </div>
  );
}
