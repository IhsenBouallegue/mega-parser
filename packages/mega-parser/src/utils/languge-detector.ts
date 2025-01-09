import { Language } from "@/types/enums";

export function detectLanguage(fileName: string): Language {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const LanguageExtensions: { [key: string]: Language } = {
    java: Language.Java,
    ts: Language.TypeScript,
    kt: Language.Kotlin,

    css: Language.CSS,
    html: Language.HTML,
    scss: Language.SCSS,

    json: Language.JSON,
    yaml: Language.YAML,
    yml: Language.YAML,
    xml: Language.XML,

    md: Language.Markdown,
    markdown: Language.Markdown,
    txt: Language.Text,
  };
  return LanguageExtensions[extension || ""] || Language.Unknown;
}
