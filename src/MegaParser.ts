// MegaParser.ts
import { RealLinesOfCodePlugin } from "@/plugins/real-lines-of-code";
import { SonarComplexityJavaPlugin } from "@/plugins/sonar-complexity-java";
import type { IMetricPlugin } from "@/types";
import { detectLanguage } from "@/utils/languge-detector";

import { CodeChartaJsonExport } from "@/plugins/exports/CodeChartaJsonExport";
import type { IExportPlugin } from "@/plugins/exports/IExportPlugin";
import { SimpleJsonExport } from "@/plugins/exports/SimpleJsonExport";

interface FileObject {
  path: string;
  name: string;
  language: string;
  content: string;
  metrics: { [metricName: string]: number };
}

export class MegaParser {
  private files: FileList;
  private requestedMetrics: string[];
  private outputData: any[];

  private metricPlugins: IMetricPlugin[] = [
    new RealLinesOfCodePlugin(),
    new SonarComplexityJavaPlugin(),
    // Add other plugins as needed
  ];

  private exportPlugins: IExportPlugin[] = [
    new SimpleJsonExport(),
    new CodeChartaJsonExport(),
    // Add other export plugins as needed
  ];

  constructor(files: FileList, requestedMetrics: string[]) {
    this.files = files;
    this.requestedMetrics = requestedMetrics;
    this.outputData = [];
  }

  public async run() {
    const fileObjects = await this.prepareFileObjects();

    for (const fileObj of fileObjects) {
      const applicablePlugins = this.metricPlugins.filter(
        (plugin) =>
          this.requestedMetrics.includes(plugin.name) &&
          (plugin.supportedLanguages.includes(fileObj.language) ||
            plugin.supportedLanguages.includes("*")),
      );

      fileObj.metrics = {};

      for (const plugin of applicablePlugins) {
        const metricValue = plugin.calculate(fileObj.content);
        fileObj.metrics[plugin.name] = metricValue;
      }

      this.outputData.push({
        path: fileObj.path,
        metrics: fileObj.metrics,
      });
    }

    this.generateOutput();
  }

  private async prepareFileObjects(): Promise<FileObject[]> {
    const fileObjects: FileObject[] = [];

    for (const file of Array.from(this.files)) {
      const content = await this.readFileContent(file);
      const language = detectLanguage(file.name);
      const relativePath = (file as any).webkitRelativePath || file.name;

      fileObjects.push({
        path: relativePath,
        name: file.name,
        language,
        content,
        metrics: {},
      });
    }

    return fileObjects;
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsText(file);
    });
  }

  private generateOutput() {
    // biome-ignore lint/complexity/noForEach: <explanation>
    this.exportPlugins.forEach((plugin) => {
      const exportedContent = plugin.export(this.outputData);
      const extension = plugin.supportedExtensions[0];
      const fileName = `output.${extension}`;

      this.downloadFile(exportedContent, fileName);
    });
  }

  private downloadFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;

    // Append to body
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
