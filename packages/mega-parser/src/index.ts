// MegaParser.ts

import { RealLinesOfCodePlugin } from "@/plugins/real-lines-of-code";
import { SonarComplexityPlugin } from "@/plugins/sonar-complexity";
import type { IMetricPlugin } from "@/types";
import { detectLanguage } from "@/utils/languge-detector";

import { CodeChartaJsonExport } from "@/plugins/exports/CodeChartaJsonExport";
import type { IExportPlugin } from "@/plugins/exports/IExportPlugin";
import { SimpleJsonExport } from "@/plugins/exports/SimpleJsonExport";
import type { Language } from "@/types/enums";
import { createFileProcessorWorker } from "./workers/worker-factory";

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
      console.log(fileObj.language, fileObj.name, applicablePlugins);

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
    // Check if Web Workers are supported
    if (typeof Worker !== "undefined") {
      return this.prepareFileObjectsWithWorkers();
    }
    return this.prepareFileObjectsSequential();
  }

  private async prepareFileObjectsSequential(): Promise<FileObject[]> {
    // Original implementation
    const fileObjects: FileObject[] = [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    for (const file of Array.from(this.files)) {
      try {
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Skipping ${file.name}: File size exceeds limit`);
          continue;
        }

        const content = await this.readFileContent(file);
        const language = detectLanguage(file.name);
        const relativePath = (file as any).webkitRelativePath || file.name;

        fileObjects.push({
          path: relativePath.replace(/\\/g, "/"),
          name: file.name,
          language,
          content,
          metrics: {},
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    return fileObjects;
  }

  private async prepareFileObjectsWithWorkers(): Promise<FileObject[]> {
    const fileObjects: FileObject[] = [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_CONCURRENT_WORKERS = 4;
    const files = Array.from(this.files);
    let processedFiles = 0;

    // Create chunks of files for parallel processing
    const chunks: File[][] = [];
    for (let i = 0; i < files.length; i += MAX_CONCURRENT_WORKERS) {
      chunks.push(files.slice(i, i + MAX_CONCURRENT_WORKERS));
    }

    // Process each chunk in parallel
    for (const chunk of chunks) {
      const workerPromises = chunk.map((file) => {
        return new Promise<FileObject | null>((resolve, reject) => {
          try {
            const worker = createFileProcessorWorker();

            worker.onmessage = (e) => {
              const { type, fileObject, message } = e.data;

              if (type === "success") {
                resolve(fileObject);
              } else if (type === "warning") {
                console.warn(message);
                resolve(null);
              } else {
                reject(new Error(message));
              }

              worker.terminate();
            };

            worker.onerror = (error) => {
              reject(error);
              worker.terminate();
            };

            worker.postMessage({ file, maxSize: MAX_FILE_SIZE });
          } catch (error) {
            console.error(`Worker creation failed for ${file.name}:`, error);
            resolve(null);
          }
        });
      });

      try {
        const results = await Promise.allSettled(workerPromises);

        for (const result of results) {
          processedFiles++;
          // Calculate progress percentage
          const progress = Math.round((processedFiles / files.length) * 100);
          // Emit progress event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("megaparser-progress", {
                detail: { progress },
              }),
            );
          }

          if (result.status === "fulfilled" && result.value) {
            fileObjects.push(result.value);
          }
        }
      } catch (error) {
        console.error("Error processing chunk:", error);
      }
    }

    return fileObjects;
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error(`Timeout reading file ${file.name}`));
      }, 30000); // 30 second timeout

      reader.onload = (e) => {
        clearTimeout(timeout);
        resolve(e.target?.result as string);
      };

      reader.onerror = (e) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to read file ${file.name}: ${e.target?.error?.message || "Unknown error"}`));
      };

      reader.onabort = () => {
        clearTimeout(timeout);
        reject(new Error(`File reading aborted for ${file.name}`));
      };

      reader.readAsText(file);
    });
  }
}
