import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateProject } from "@/services/projectService"; // Import the updateProject function
import { useStore } from "@/store/useStore";
import { Download, Edit, Plus, Settings } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { projects, currentProjectId, setCurrentProject, isBackgroundEnabled, toggleBackground, exportAnalysis } =
    useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState("");

  const handleEditProject = () => {
    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (currentProject) {
      setEditingProjectName(currentProject.name);
      setIsEditingProject(true);
    }
  };

  const handleSaveProject = () => {
    if (currentProjectId) {
      updateProject(currentProjectId, { name: editingProjectName });
      setIsEditingProject(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const { content, extension } = exportAnalysis(format);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <header className="flex justify-between items-center p-4">
      <h1 className="text-2xl font-bold">MegaParser Web Studio</h1>
      <div className="flex items-center space-x-2">
        <Select value={currentProjectId || ""} onValueChange={setCurrentProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
            <SelectItem value="new" className="text-primary">
              <div className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                <span>Create New Project</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {currentProjectId && (
          <>
            <Button variant="outline" size="icon" onClick={handleEditProject}>
              <Edit className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("SimpleJson")}>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("CodeChartaJson")}>Export as CodeCharta</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Adjust your application settings here.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="background-toggle">Enable Background Effects</Label>
              <Switch id="background-toggle" checked={isBackgroundEnabled} onCheckedChange={toggleBackground} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Change the name of your project here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectName" className="text-right">
                Name
              </Label>
              <Input
                id="projectName"
                value={editingProjectName}
                onChange={(e) => setEditingProjectName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProject}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
