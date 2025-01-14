import { CodeChartaJsonExport } from "@/plugins/exports/CodeChartaJsonExport";
import type { IExportPlugin } from "@/plugins/exports/IExportPlugin";
import { SimpleJsonExport } from "@/plugins/exports/SimpleJsonExport";
import { RealLinesOfCodePlugin } from "@/plugins/real-lines-of-code";
import { SonarComplexityPlugin } from "@/plugins/sonar-complexity";
import type { FileInput, FileObject, IMetricPlugin } from "@/types";
import { Language } from "@/types/enums";
import { detectLanguage } from "@/utils/languge-detector";

export type { FileInput, FileObject, IMetricPlugin, IExportPlugin };
export { Language, detectLanguage };

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
  public rawOutputData: FileObject[] = [];
  private files: FileInput[];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  private availableMetricPlugins = new Map<MetricPluginEnum, IMetricPlugin>([
    [MetricPluginEnum.RealLinesOfCode, new RealLinesOfCodePlugin()],
    [MetricPluginEnum.SonarComplexity, new SonarComplexityPlugin()],
  ]);

  private availableExportPlugins = new Map<ExportPluginEnum, IExportPlugin>([
    [ExportPluginEnum.SimpleJson, new SimpleJsonExport()],
    [ExportPluginEnum.CodeChartaJson, new CodeChartaJsonExport()],
  ]);

  private enabledMetricPlugins: IMetricPlugin[] = [];
  private enabledExportPlugins = new Map<ExportPluginEnum, IExportPlugin>();
  private exportOutputs = new Map<ExportPluginEnum, string>();

  constructor(files: FileInput[]) {
    this.files = files;
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

    for (const file of this.files) {
      try {
        if (file.size > this.MAX_FILE_SIZE) {
          console.warn(
            `Skipping ${file.name}: File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${
              this.MAX_FILE_SIZE / 1024 / 1024
            }MB`,
          );
          continue;
        }

        const language = detectLanguage(file.name);
        fileObjects.push({
          path: file.path.replace(/\\/g, "/"),
          name: file.name,
          language,
          content: file.content,
          metrics: {},
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    return fileObjects;
  }
}
