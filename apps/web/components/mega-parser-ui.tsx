"use client";

import { Button } from "@/components/ui/button";
import ignore from "ignore";
import { Loader2, Play } from "lucide-react";
import {
  ExportOutput,
  ExportPluginEnum,
  type FileInput,
  type FileObject,
  Language,
  MegaParser,
  MetricPluginEnum,
} from "mega-parser";
import { useState } from "react";
import { DebugViewer } from "./debug-viewer";
import { ExporterSelector } from "./exporter-selector";
import { FileFilterOptions } from "./file-filter-options";
import { FileSelector } from "./file-selector";
import { MetricsSelector } from "./metrics-selector";
import { OutputViewer } from "./output-viewer";
import { StatsRibbon } from "./stats-ribbon";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface FileStats {
  totalFiles: number;
  analyzableFiles: number;
  ignoredFiles: number;
  languageStats: Record<Language, number>;
}

const LanguageExtensions: { [key: string]: Language } = {
  java: Language.Java,
  ts: Language.TypeScript,
  tsx: Language.TypeScript,
  kt: Language.Kotlin,
  kts: Language.Kotlin,
  css: Language.CSS,
  html: Language.HTML,
  htm: Language.HTML,
  scss: Language.SCSS,
  json: Language.JSON,
  yaml: Language.YAML,
  yml: Language.YAML,
  xml: Language.XML,
  md: Language.Markdown,
  markdown: Language.Markdown,
  txt: Language.Text,
};

function detectLanguage(fileName: string): Language {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return LanguageExtensions[extension] || Language.Unknown;
}

export default function MegaParserUI() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [metrics, setMetrics] = useState<Record<MetricPluginEnum, boolean>>({
    [MetricPluginEnum.RealLinesOfCode]: true,
    [MetricPluginEnum.SonarComplexity]: false,
  });
  const [exporters, setExporters] = useState<ExportPluginEnum[]>([]);
  const [output, setOutput] = useState<FileObject[]>();
  const [exportOutputs, setExportOutputs] = useState<Record<ExportPluginEnum, string>>(
    () => ({}) as Record<ExportPluginEnum, string>,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGitignore, setUseGitignore] = useState(true);
  const [excludePatterns, setExcludePatterns] = useState("");
  const [ignoreRules, setIgnoreRules] = useState<string[]>([]);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [activeTab, setActiveTab] = useState<"output" | "debug">("output");

  const handleFileChange = (selectedFiles: FileList | null) => {
    console.log("🔄 handleFileChange called", {
      hasFiles: !!selectedFiles,
      fileCount: selectedFiles?.length,
      showStats,
    });

    setFiles(selectedFiles);
    console.log("✅ Files state updated");

    if (selectedFiles && showStats) {
      console.log("📊 Starting file stats update...");
      updateFileStats(selectedFiles);
    } else {
      console.log("❌ Skipping file stats update");
      setFileStats(null);
    }
    console.log("🏁 handleFileChange completed");
  };

  const handleMetricChange = (metric: MetricPluginEnum) => {
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [metric]: !prevMetrics[metric],
    }));
  };

  const handleExporterChange = (exporter: ExportPluginEnum) => {
    setExporters((prevExporters) => {
      if (prevExporters.includes(exporter)) {
        return prevExporters.filter((e) => e !== exporter);
      }
      return [...prevExporters, exporter];
    });
  };

  const updateFileStats = async (fileList: FileList) => {
    const ig = ignore({
      ignorecase: true,
      allowRelativePaths: false,
    });

    const rules: string[] = [];

    // Add default ignores if using gitignore
    if (useGitignore) {
      const defaultRules = ["node_modules", ".git"];
      rules.push(...defaultRules);
      ig.add(defaultRules);

      // Try to read .gitignore from the selected directory
      for (const file of fileList) {
        const dirPath = file.webkitRelativePath.split("/")[0];
        const gitignoreFile = Array.from(fileList).find((f) => f.webkitRelativePath === `${dirPath}/.gitignore`);

        if (gitignoreFile) {
          try {
            const content = await gitignoreFile.text();
            const gitignoreRules = content.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
            rules.push(...gitignoreRules);
            ig.add(gitignoreRules);
            break;
          } catch (error) {
            console.error("Error reading .gitignore:", error);
          }
        }
      }
    }

    // Add exclude patterns if any
    if (excludePatterns) {
      const patterns = excludePatterns.split(",").map((p) => p.trim());
      rules.push(...patterns);
      ig.add(patterns);
    }

    setIgnoreRules(rules);

    const stats: FileStats = {
      totalFiles: fileList.length,
      analyzableFiles: 0,
      ignoredFiles: 0,
      languageStats: {
        [Language.Java]: 0,
        [Language.Kotlin]: 0,
        [Language.TypeScript]: 0,
        [Language.CSS]: 0,
        [Language.HTML]: 0,
        [Language.SCSS]: 0,
        [Language.JSON]: 0,
        [Language.YAML]: 0,
        [Language.XML]: 0,
        [Language.Markdown]: 0,
        [Language.Text]: 0,
        [Language.Unknown]: 0,
      },
    };

    for (const file of fileList) {
      const relativePath = file.webkitRelativePath || file.name;
      const normalizedPath = relativePath.replace(/\\/g, "/");

      if (ig.ignores(normalizedPath)) {
        stats.ignoredFiles++;
        continue;
      }

      stats.analyzableFiles++;
      const language = detectLanguage(file.name);
      stats.languageStats[language]++;
    }

    setFileStats(stats);
  };

  const filterFiles = async (fileList: FileList): Promise<FileInput[]> => {
    const ig = ignore({
      ignorecase: true,
      allowRelativePaths: false,
    });

    // Add default ignores if using gitignore
    if (useGitignore) {
      ig.add(["node_modules", ".git"]);

      // Try to read .gitignore from the selected directory
      for (const file of fileList) {
        const dirPath = file.webkitRelativePath.split("/")[0];
        const gitignoreFile = Array.from(fileList).find((f) => f.webkitRelativePath === `${dirPath}/.gitignore`);

        if (gitignoreFile) {
          try {
            const content = await gitignoreFile.text();
            ig.add(content.split("\n").filter((line) => line.trim() && !line.startsWith("#")));
            break;
          } catch (error) {
            console.error("Error reading .gitignore:", error);
          }
        }
      }
    }

    // Add exclude patterns if any
    if (excludePatterns) {
      const patterns = excludePatterns.split(",").map((p) => p.trim());
      ig.add(patterns);
    }

    const filteredFiles: FileInput[] = [];
    for (const file of fileList) {
      const relativePath = file.webkitRelativePath || file.name;
      const normalizedPath = relativePath.replace(/\\/g, "/");

      // Skip if file matches ignore patterns
      if (ig.ignores(normalizedPath)) {
        console.debug(`Skipping ${normalizedPath} (ignored by patterns)`);
        continue;
      }

      try {
        const content = await file.text();
        filteredFiles.push({
          name: file.name,
          path: normalizedPath,
          content,
          size: file.size,
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    return filteredFiles;
  };

  const runMegaParser = async () => {
    if (!files) return;

    console.log("🔍 Starting MegaParser run...");
    setIsProcessing(true);
    setError(null);
    setOutput(undefined);
    setExportOutputs({} as Record<ExportPluginEnum, string>);

    try {
      console.log("📁 Converting files to FileInput format...");
      const fileInputs = await Promise.all(
        Array.from(files).map(async (file) => {
          console.log(`📄 Processing file: ${file.name} (${file.size} bytes)`);
          try {
            const content = await file.text();
            console.log(`✅ Successfully read content for: ${file.name}`);
            return {
              path: file.name,
              name: file.name,
              size: file.size,
              content,
            };
          } catch (err) {
            console.error(`❌ Error reading file ${file.name}:`, err);
            throw err;
          }
        }),
      );

      console.log("🔧 Initializing MegaParser...");
      const parser = new MegaParser(fileInputs);

      console.log("⚙️ Setting up metrics:", metrics);
      parser.setMetricPlugins(
        Object.keys(metrics).filter((metric) => metrics[metric as MetricPluginEnum]) as MetricPluginEnum[],
      );

      console.log("📤 Setting up exporters:", exporters);
      parser.setExportPlugins(exporters);

      console.log("🚀 Running parser...");
      await parser.run(debugMode);
      console.log("✅ Parser run complete");

      const rawData = parser.rawOutputData;
      const exportOutputsMap = parser.getAllExportOutputs();

      console.log("💾 Setting output data...");
      setOutput(rawData);

      const stringExportOutputs = Object.entries(exportOutputsMap).reduce<Record<ExportPluginEnum, string>>(
        (acc, [key, value]) => {
          acc[key as ExportPluginEnum] = value.content;
          return acc;
        },
        {} as Record<ExportPluginEnum, string>,
      );

      console.log("💾 Setting export outputs...");
      setExportOutputs(stringExportOutputs);
      console.log("✨ MegaParser run completed successfully");
    } catch (err) {
      console.error("❌ MegaParser error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsProcessing(false);
      console.log("🏁 MegaParser process finished");
    }
  };

  const handleExportDownload = (exporter: ExportPluginEnum) => {
    const exportData = exportOutputs[exporter];
    if (!exportData) return;

    let filename = `megaparser-${exporter.toLowerCase()}-output`;
    let type = "text/plain";

    switch (exporter) {
      case ExportPluginEnum.SimpleJson:
        filename += ".json";
        type = "application/json";
        break;
      case ExportPluginEnum.CodeChartaJson:
        filename += ".cc.json";
        type = "application/json";
        break;
    }

    const blob = new Blob([exportData], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnalysisFileUpload = async (file: File) => {
    try {
      const content = await file.text();
      const analysisData = JSON.parse(content);

      // More detailed validation with specific error messages
      if (!Array.isArray(analysisData)) {
        throw new Error("Analysis file must contain an array of results");
      }
      if (analysisData.length === 0) {
        throw new Error("Analysis file contains no results");
      }
      if (!analysisData[0].metrics) {
        throw new Error("Analysis file is missing metrics data");
      }
      // Check if any file has debug info
      const hasDebugInfo = analysisData.some((file) => file.debugInfo && Array.isArray(file.debugInfo));
      if (!hasDebugInfo) {
        throw new Error("Analysis file is missing debug information");
      }

      setOutput(analysisData);
      setDebugMode(true);
      setActiveTab("debug");
      setError(null); // Clear any existing errors
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to parse analysis file");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">MegaParser Dashboard</h1>
        {showStats && <StatsRibbon stats={fileStats} />}
        <div className="space-y-8">
          <FileSelector onFileChange={handleFileChange} onAnalysisFileUpload={handleAnalysisFileUpload} error={error} />
          <FileFilterOptions
            useGitignore={useGitignore}
            onUseGitignoreChange={setUseGitignore}
            excludePatterns={excludePatterns}
            onExcludePatternsChange={setExcludePatterns}
            ignoreRules={ignoreRules}
          />
          <MetricsSelector metrics={metrics} onMetricChange={handleMetricChange} />
          <ExporterSelector exporters={exporters} onExporterChange={handleExporterChange} />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
              <label htmlFor="debug-mode" className="text-sm font-medium">
                Debug Mode
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-stats"
                checked={showStats}
                onCheckedChange={(checked) => {
                  setShowStats(checked);
                  if (checked && files) {
                    updateFileStats(files);
                  } else {
                    setFileStats(null);
                  }
                }}
              />
              <label htmlFor="show-stats" className="text-sm font-medium">
                Show Statistics
              </label>
            </div>
          </div>
          <Button onClick={runMegaParser} disabled={!files || exporters.length === 0 || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run MegaParser
              </>
            )}
          </Button>
          {error && <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>}
        </div>
      </div>

      <div className="w-1/2 bg-muted p-4 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Output Preview</h2>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "output" | "debug")}>
          <TabsList>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="debug" disabled={!debugMode}>
              Debug
            </TabsTrigger>
          </TabsList>
          <TabsContent value="output" className="flex-1">
            <OutputViewer
              rawOutput={output}
              exportOutputs={exportOutputs}
              exporters={exporters}
              onExportDownload={handleExportDownload}
            />
          </TabsContent>
          <TabsContent value="debug" className="flex-1 h-[calc(100vh-12rem)]">
            {output && debugMode ? (
              <DebugViewer files={output} />
            ) : (
              <div className="text-center text-muted-foreground p-4">
                Enable debug mode and run analysis to see debug information
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
