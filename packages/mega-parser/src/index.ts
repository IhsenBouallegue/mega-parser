// MegaParser.ts

import { RealLinesOfCodePlugin } from "@/plugins/real-lines-of-code";
import { SonarComplexityPlugin } from "@/plugins/sonar-complexity";
import type { IMetricPlugin } from "@/types";
import { detectLanguage } from "@/utils/languge-detector";

import { CodeChartaJsonExport } from "@/plugins/exports/CodeChartaJsonExport";
import type { IExportPlugin } from "@/plugins/exports/IExportPlugin";
import { SimpleJsonExport } from "@/plugins/exports/SimpleJsonExport";
import type { Language } from "@/types/enums";

interface FileObject {
  path: string;
  name: string;
  language: Language;
  content: string;
  metrics: { [metricName: string]: number };
}

export enum MetricPluginEnum {
  RealLinesOfCode = "RealLinesOfCode",
  SonarComplexity = "SonarComplexity",
  // Add other metric plugin names here
}

export enum ExportPluginEnum {
  SimpleJson = "SimpleJson",
  CodeChartaJson = "CodeChartaJson",
  // Add other export plugin names here
}

export class MegaParser {
  public rawOutputData: FileObject[];
  private files: FileList;

  private availableMetricPlugins: Map<MetricPluginEnum, IMetricPlugin> = new Map([
    [MetricPluginEnum.RealLinesOfCode, new RealLinesOfCodePlugin()],
    [MetricPluginEnum.SonarComplexity, new SonarComplexityPlugin()],
    // Add other metric plugins as needed
  ]);

  private availableExportPlugins: Map<ExportPluginEnum, IExportPlugin> = new Map([
    [ExportPluginEnum.SimpleJson, new SimpleJsonExport()],
    [ExportPluginEnum.CodeChartaJson, new CodeChartaJsonExport()],
    // Add other export plugins as needed
  ]);

  private enabledMetricPlugins: IMetricPlugin[] = [];
  private enabledExportPlugins: Map<ExportPluginEnum, IExportPlugin> = new Map();

  private exportOutputs: Map<ExportPluginEnum, string> = new Map();

  constructor(files: FileList) {
    this.files = files;
    this.rawOutputData = [];
  }

  /**
   * Enable metric plugins based on the provided enums.
   * @param metricPluginEnums Array of MetricPluginEnum to enable.
   */
  public setMetricPlugins(metricPluginEnums: MetricPluginEnum[]): void {
    this.enabledMetricPlugins = [];
    for (const pluginEnum of metricPluginEnums) {
      const plugin = this.availableMetricPlugins.get(pluginEnum);
      if (plugin) {
        this.enabledMetricPlugins.push(plugin);
      }
    }
  }

  /**
   * Enable export plugins based on the provided enums.
   * @param exportPluginEnums Array of ExportPluginEnum to enable.
   */
  public setExportPlugins(exportPluginEnums: ExportPluginEnum[]): void {
    this.enabledExportPlugins.clear();
    for (const pluginEnum of exportPluginEnums) {
      const plugin = this.availableExportPlugins.get(pluginEnum);
      if (plugin) {
        this.enabledExportPlugins.set(pluginEnum, plugin);
      }
    }
  }

  /**
   * Runs the parser and computes metrics.
   */
  public async run(): Promise<void> {
    const fileObjects = await this.prepareFileObjects();

    for (const fileObj of fileObjects) {
      const applicablePlugins = this.enabledMetricPlugins.filter((plugin) =>
        plugin.supportedLanguages.includes(fileObj.language),
      );

      fileObj.metrics = {};

      for (const plugin of applicablePlugins) {
        const metricValue = plugin.calculate(fileObj.content, fileObj.language);
        fileObj.metrics[plugin.name] = metricValue;
      }

      this.rawOutputData.push({
        path: fileObj.path,
        name: fileObj.name,
        language: fileObj.language,
        content: fileObj.content,
        metrics: fileObj.metrics,
      });
    }

    // Generate outputs for each enabled export plugin
    for (const [pluginEnum, plugin] of this.enabledExportPlugins.entries()) {
      const exportedContent = plugin.export(this.rawOutputData);
      this.exportOutputs.set(pluginEnum, exportedContent);
    }
  }

  /**
   * Retrieves the export output for a given export plugin enum.
   * @param exportPluginEnum ExportPluginEnum value.
   * @returns The exported content as a string, or undefined if not available.
   */
  public getExportOutput(exportPluginEnum: ExportPluginEnum): string | undefined {
    return this.exportOutputs.get(exportPluginEnum);
  }

  /**
   * Retrieves all export outputs.
   * @returns A Map of ExportPluginEnum to their outputs.
   */
  public getAllExportOutputs(): Map<ExportPluginEnum, string> {
    return this.exportOutputs;
  }

  private async prepareFileObjects(): Promise<FileObject[]> {
    const fileObjects: FileObject[] = [];

    for (const file of Array.from(this.files)) {
      const content = await this.readFileContent(file);
      const language = detectLanguage(file.name);
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const relativePath = (file as any).webkitRelativePath || file.name;

      fileObjects.push({
        path: relativePath.replace(/\\/g, "/"), // Normalize paths
        name: file.name,
        language,
        content,
        metrics: {},
      });
    }

    return fileObjects;
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // Removed generateOutput and downloadFile methods since no direct download is needed
}
