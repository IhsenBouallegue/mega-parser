"use client";

import { Button } from "@/components/ui/button";
import ignore from "ignore";
import { Loader2, Play } from "lucide-react";
import { ExportPluginEnum, type FileInput, type FileObject, Language, MegaParser, MetricPluginEnum } from "mega-parser";
import { useState } from "react";
import { ExporterSelector } from "./exporter-selector";
import { FileFilterOptions } from "./file-filter-options";
import { FileSelector } from "./file-selector";
import { MetricsSelector } from "./metrics-selector";
import { OutputViewer } from "./output-viewer";
import { StatsRibbon } from "./stats-ribbon";

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

  const handleFileChange = (selectedFiles: FileList | null) => {
    setFiles(selectedFiles);
    if (selectedFiles) {
      updateFileStats(selectedFiles);
    } else {
      setFileStats(null);
    }
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

    setIsProcessing(true);
    setError(null);

    try {
      const requestedMetrics = Object.keys(metrics).filter(
        (metric) => metrics[metric as MetricPluginEnum],
      ) as MetricPluginEnum[];

      const filteredFiles = await filterFiles(files);
      if (filteredFiles.length === 0) {
        throw new Error("No files to analyze after applying filters");
      }

      const megaParser = new MegaParser(filteredFiles);
      megaParser.setMetricPlugins(requestedMetrics);
      megaParser.setExportPlugins(exporters);

      await megaParser.run();

      const rawData = megaParser.rawOutputData;
      const exportOutputsMap = megaParser.getAllExportOutputs();

      setOutput(rawData);
      setExportOutputs(Object.fromEntries(exportOutputsMap) as Record<ExportPluginEnum, string>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing files");
      console.error("MegaParser error:", err);
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">MegaParser Dashboard</h1>
        <StatsRibbon stats={fileStats} />
        <div className="space-y-8">
          <FileSelector onFileChange={handleFileChange} />
          <FileFilterOptions
            useGitignore={useGitignore}
            onUseGitignoreChange={setUseGitignore}
            excludePatterns={excludePatterns}
            onExcludePatternsChange={setExcludePatterns}
            ignoreRules={ignoreRules}
          />
          <MetricsSelector metrics={metrics} onMetricChange={handleMetricChange} />
          <ExporterSelector exporters={exporters} onExporterChange={handleExporterChange} />
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
        </div>
      </div>

      <div className="w-1/2 bg-muted p-4 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Output Preview</h2>
        <OutputViewer
          rawOutput={output}
          exportOutputs={exportOutputs}
          exporters={exporters}
          onExportDownload={handleExportDownload}
        />
      </div>

      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">{error}</div>}
    </div>
  );
}
