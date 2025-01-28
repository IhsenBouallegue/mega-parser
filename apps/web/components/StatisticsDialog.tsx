import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/store/useStore";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { useRef } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const METRIC_THRESHOLDS = {
  rloc: { warning: 100, critical: 200 },
  sonar_complexity: { warning: 10, critical: 20 },
};

const Legend = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center">
      <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 mr-2" />
      <span>
        Warning: RLOC {">"} 100 or Complexity {">"} 10
      </span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 mr-2" />
      <span>
        Critical: RLOC {">"} 200 or Complexity {">"} 20
      </span>
    </div>
  </div>
);

interface StatisticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function StatisticsDialog({ open, onOpenChange }: StatisticsDialogProps) {
  const { projects, currentProjectId } = useStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const analysisResults = currentProject?.analysisResults || [];

  const totalFiles = analysisResults.length;
  const totalRLOC = analysisResults.reduce((sum, file) => sum + (file.metrics.rloc || 0), 0);
  const averageComplexity =
    analysisResults.reduce((sum, file) => sum + (file.metrics.sonar_complexity || 0), 0) / totalFiles || 0;

  // Language distribution as pie chart data
  const languageDistribution = analysisResults.reduce((acc: Record<string, number>, file) => {
    acc[file.language] = (acc[file.language] || 0) + 1;
    return acc;
  }, {});

  const languageData = Object.entries(languageDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Top 5 files by complexity
  const topComplexityFiles = [...analysisResults]
    .sort((a, b) => (b.metrics.sonar_complexity || 0) - (a.metrics.sonar_complexity || 0))
    .slice(0, 5);

  // Top 5 files by RLOC
  const topRlocFiles = [...analysisResults].sort((a, b) => (b.metrics.rloc || 0) - (a.metrics.rloc || 0)).slice(0, 5);

  // Files outside acceptable ranges
  const problematicFiles = analysisResults.filter(
    (file) =>
      (file.metrics.rloc || 0) > METRIC_THRESHOLDS.rloc.warning ||
      (file.metrics.sonar_complexity || 0) > METRIC_THRESHOLDS.sonar_complexity.warning,
  );

  const handleExportPNG = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const link = document.createElement("a");
    link.download = "statistics.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("statistics.pdf");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl my-4">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Project Statistics</DialogTitle>
              <DialogDescription>Detailed analysis of your project metrics</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPNG}>
                <Download className="w-4 h-4 mr-2" />
                Export PNG
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div ref={contentRef} className="space-y-6">
          <Legend />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Files</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalFiles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total RLOC</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalRLOC}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Complexity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{averageComplexity.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={languageData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} (${((value / totalFiles) * 100).toFixed(1)}%)`, "Files"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Complex Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topComplexityFiles.map((file) => (
                    <div
                      key={file.name}
                      className={`p-2 rounded ${
                        file.metrics.sonar_complexity > METRIC_THRESHOLDS.sonar_complexity.critical
                          ? "bg-red-100 dark:bg-red-900/30"
                          : file.metrics.sonar_complexity > METRIC_THRESHOLDS.sonar_complexity.warning
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : ""
                      }`}
                    >
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">Complexity: {file.metrics.sonar_complexity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Largest Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topRlocFiles.map((file) => (
                    <div
                      key={file.name}
                      className={`p-2 rounded ${
                        file.metrics.rloc > METRIC_THRESHOLDS.rloc.critical
                          ? "bg-red-100 dark:bg-red-900/30"
                          : file.metrics.rloc > METRIC_THRESHOLDS.rloc.warning
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : ""
                      }`}
                    >
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">RLOC: {file.metrics.rloc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Files Needing Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {problematicFiles.slice(0, 5).map((file) => (
                    <div key={file.name} className="p-2 rounded bg-yellow-100 dark:bg-yellow-900/30">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        RLOC: {file.metrics.rloc} | Complexity: {file.metrics.sonar_complexity}
                      </p>
                    </div>
                  ))}
                  {problematicFiles.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      And {problematicFiles.length - 5} more files need review...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
