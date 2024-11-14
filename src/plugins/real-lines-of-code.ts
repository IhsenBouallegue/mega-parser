import type { IMetricPlugin } from "@/types";

export class RealLinesOfCodePlugin implements IMetricPlugin {
  name = "realLinesOfCode";
  supportedLanguages = ["*"];

  calculate(content: string): number {
    const lines = content.split(/\r\n|\r|\n/);
    const nonEmptyLines = lines.filter((line) => line.trim() !== "");
    return nonEmptyLines.length;
  }
}
