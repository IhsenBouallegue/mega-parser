import type { FileObject } from "mega-parser";
import { create } from "zustand";

interface Project {
  id: string;
  name: string;
  analysisResults: FileObject[];
}

interface ProjectStats {
  fileCount: number;
  folderCount: number;
  totalRLOC: number;
  averageComplexity: number;
}

interface Store {
  projects: Project[];
  currentProjectId: string | null;
  selectedFile: FileObject | null;
  isBackgroundEnabled: boolean;
  addProject: (name: string) => string;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setCurrentProject: (id: string) => void;
  setAnalysisResults: (results: FileObject[]) => void;
  setSelectedFile: (file: FileObject | null) => void;
  exportAnalysis: (format: string) => { content: string; extension: string };
  toggleBackground: () => void;
  getCurrentProject: () => Project | null;
  getProjectStats: (projectId: string) => ProjectStats;
  getFilteredFiles: (searchTerm: string) => FileObject[];
}

export const useStore = create<Store>((set, get) => ({
  projects: [],
  currentProjectId: null,
  selectedFile: null,
  isBackgroundEnabled: true,

  getCurrentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId) || null;
  },

  getProjectStats: (projectId: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) {
      return {
        fileCount: 0,
        folderCount: 0,
        totalRLOC: 0,
        averageComplexity: 0,
      };
    }

    const fileCount = project.analysisResults.length;
    const folderCount = new Set(
      project.analysisResults.map((file) => file.path.split("/").slice(0, -1).join("/")).filter(Boolean),
    ).size;
    const totalRLOC = project.analysisResults.reduce((sum, file) => sum + (file.metrics.rloc || 0), 0);
    const averageComplexity =
      fileCount > 0
        ? project.analysisResults.reduce((sum, file) => sum + (file.metrics.sonar_complexity || 0), 0) / fileCount
        : 0;

    return {
      fileCount,
      folderCount,
      totalRLOC,
      averageComplexity,
    };
  },

  getFilteredFiles: (searchTerm: string) => {
    try {
      const currentProject = get().getCurrentProject();
      if (!currentProject || !searchTerm) return [];

      const normalizedSearch = searchTerm.toLowerCase();
      return currentProject.analysisResults.filter(
        (file) =>
          file.name.toLowerCase().includes(normalizedSearch) || file.path.toLowerCase().includes(normalizedSearch),
      );
    } catch (error) {
      console.error("Error filtering files:", error);
      return [];
    }
  },

  addProject: (name) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      analysisResults: [],
    };
    set((state) => ({
      projects: [...state.projects, newProject],
      currentProjectId: newProject.id,
    }));
    return newProject.id;
  },

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((project) => (project.id === id ? { ...project, ...updates } : project)),
    })),

  setCurrentProject: (id) => {
    if (id === "new") {
      const projectName = prompt("Enter project name:");
      if (projectName) {
        const newId = get().addProject(projectName);
        set({ currentProjectId: newId });
      }
    } else {
      set({ currentProjectId: id });
    }
  },

  setAnalysisResults: (results) =>
    set((state) => {
      if (state.currentProjectId) {
        const updatedProjects = state.projects.map((project) =>
          project.id === state.currentProjectId ? { ...project, analysisResults: results } : project,
        );
        return { projects: updatedProjects };
      }
      return {};
    }),

  setSelectedFile: (file: FileObject | null) =>
    set((state) => {
      if (file === null) {
        return { selectedFile: null };
      }

      try {
        const safeFile = {
          path: file.path || "",
          name: file.name || "",
          language: file.language || "unknown",
          content: file.content || "",
          metrics: file.metrics || {},
          debugInfo: file.debugInfo || {},
        };

        return { selectedFile: safeFile };
      } catch (error) {
        console.error("Error setting selected file:", error);
        return state;
      }
    }),

  exportAnalysis: (format: string) => {
    const currentProject = get().getCurrentProject();
    if (!currentProject) {
      throw new Error("No current project");
    }

    let content: string;
    let extension: string;

    if (format === "SimpleJson") {
      content = JSON.stringify(currentProject.analysisResults, null, 2);
      extension = "json";
    } else if (format === "CodeChartaJson") {
      content = JSON.stringify(
        {
          /* CodeCharta format */
        },
        null,
        2,
      );
      extension = "cc.json";
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }

    return { content, extension };
  },

  toggleBackground: () =>
    set((state) => ({
      isBackgroundEnabled: !state.isBackgroundEnabled,
    })),
}));
