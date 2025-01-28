import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FileObject } from "mega-parser";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface StatisticsViewProps {
  analysisResults: FileObject[];
}

export default function StatisticsView({ analysisResults }: StatisticsViewProps) {
  const totalFiles = analysisResults.length;
  const totalRLOC = analysisResults.reduce((sum, file) => sum + (file.metrics.rloc || 0), 0);
  const averageComplexity =
    analysisResults.reduce((sum, file) => sum + (file.metrics.sonar_complexity || 0), 0) / totalFiles;

  const languageDistribution = analysisResults.reduce((acc: Record<string, number>, file) => {
    acc[file.language] = (acc[file.language] || 0) + 1;
    return acc;
  }, {});

  const languageData = Object.entries(languageDistribution).map(([name, value]) => ({ name, value }));

  const complexityDistribution = analysisResults.reduce((acc: Record<string, number>, file) => {
    const complexity = file.metrics.sonar_complexity || 0;
    const range = Math.floor(complexity / 5) * 5;
    const key = `${range}-${range + 4}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const complexityData = Object.entries(complexityDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Number.parseInt(a.name) - Number.parseInt(b.name));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Complexity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complexityData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={languageData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
