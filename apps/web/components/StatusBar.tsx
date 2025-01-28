import { useStore } from "@/store/useStore";

export default function StatusBar() {
  const { currentProjectId, getProjectStats } = useStore();

  const stats = currentProjectId ? getProjectStats(currentProjectId) : null;

  return (
    <div className="flex justify-between items-center px-4 py-2">
      <span>{stats && stats.fileCount > 0 ? "Analysis Complete" : "No Analysis Data"}</span>
      <span>
        Files: {stats?.fileCount || 0} | RLOC: {stats?.totalRLOC || 0} | Avg. Complexity:{" "}
        {stats?.averageComplexity.toFixed(2) || "0.00"}
      </span>
    </div>
  );
}
