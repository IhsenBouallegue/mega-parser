import type { IExportPlugin } from "./IExportPlugin";

export class SimpleJsonExport implements IExportPlugin {
  name = "simpleJson";
  supportedExtensions = ["json"];

  export(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }
}
