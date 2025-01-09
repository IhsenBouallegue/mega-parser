import type { IMetricPlugin } from "@/types";
import { Language } from "@/types/enums";

export class RealLinesOfCodePlugin implements IMetricPlugin {
  name = "rloc";
  supportedLanguages = [
    Language.Java,
    Language.Kotlin,
    Language.TypeScript,
    Language.CSS,
    Language.HTML,
    Language.SCSS,

    // Language.JSON,
    // Language.YAML,
    // Language.XML,
    // Language.Markdown,
    // Language.Text,
    // Language.Unknown, // Support unknown text files too
  ];

  calculate(content: string, language: Language): number {
    // Special handling for JSON to count actual content lines
    if (language === Language.JSON) {
      try {
        // Format JSON to count actual content lines
        const formatted = JSON.stringify(JSON.parse(content), null, 2);
        const lines = formatted.split(/\r\n|\r|\n/);
        return lines.filter((line) => line.trim() !== "").length;
      } catch {
        // If JSON parsing fails, fall back to normal line counting
        return this.countNonEmptyLines(content);
      }
    }

    // Special handling for YAML to ignore comment lines
    if (language === Language.YAML) {
      const lines = content.split(/\r\n|\r|\n/);
      return lines.filter((line) => {
        const trimmed = line.trim();
        return trimmed !== "" && !trimmed.startsWith("#");
      }).length;
    }

    // Special handling for Markdown to ignore heading markers
    if (language === Language.Markdown) {
      const lines = content.split(/\r\n|\r|\n/);
      return lines.filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed !== "" &&
          !trimmed.match(/^#{1,6}\s/) && // Headings
          !trimmed.match(/^[-*_]{3,}$/)
        ); // Horizontal rules
      }).length;
    }

    // Default handling for all other file types
    return this.countNonEmptyLines(content);
  }

  private countNonEmptyLines(content: string): number {
    const lines = content.split(/\r\n|\r|\n/);
    return lines.filter((line) => line.trim() !== "").length;
  }
}
