// src/plugins/exports/IExportPlugin.ts

export interface IExportPlugin {
  /**
   * The name of the export plugin.
   */
  name: string;

  /**
   * Supported file extensions for the export format.
   */
  supportedExtensions: string[];

  /**
   * Export the parsed data to the desired format.
   * @param data The data to export.
   * @returns The exported data as a string.
   */
  export(data: unknown): string;
}
