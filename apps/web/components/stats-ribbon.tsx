import { Card, CardContent } from "@/components/ui/card";
import type { Language } from "mega-parser";

interface FileStats {
  totalFiles: number;
  analyzableFiles: number;
  ignoredFiles: number;
  languageStats: Record<Language, number>;
}

interface StatsRibbonProps {
  stats: FileStats | null;
}

export function StatsRibbon({ stats }: StatsRibbonProps) {
  if (!stats) return null;

  const totalLanguageFiles = Object.values(stats.languageStats).reduce((a, b) => a + b, 0);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">File Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Files:</span>
                <span className="font-medium">{stats.totalFiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Files to Analyze:</span>
                <span className="font-medium">{stats.analyzableFiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ignored Files:</span>
                <span className="font-medium">{stats.ignoredFiles}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Language Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.languageStats)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([language, count]) => (
                  <div key={language} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground capitalize">{language}:</span>
                      <div className="h-2 bg-primary/10 rounded-full w-24">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(count / totalLanguageFiles) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-medium">
                      {count} ({((count / totalLanguageFiles) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
