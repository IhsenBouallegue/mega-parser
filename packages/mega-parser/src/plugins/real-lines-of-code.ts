import type { IMetricPlugin } from "@/types";
import { Language } from "@/types/enums";

export class RealLinesOfCodePlugin implements IMetricPlugin {
  name = "realLinesOfCode";
  supportedLanguages = [Language.Java, Language.Kotlin, Language.TypeScript];

  calculate(content: string, _language: Language): number {
    const lines = content.split(/\r\n|\r|\n/);
    const nonEmptyLines = lines.filter((line) => line.trim() !== "");
    return nonEmptyLines.length;
  }
}
