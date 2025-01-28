import { useStore } from "@/store/useStore";

export const updateProject = (projectId: string, updates: { name: string }) => {
  const { projects, updateProject } = useStore.getState();
  const projectIndex = projects.findIndex((p) => p.id === projectId);

  if (projectIndex !== -1) {
    updateProject(projectId, updates);
  } else {
    console.error(`Project with id ${projectId} not found`);
  }
};
