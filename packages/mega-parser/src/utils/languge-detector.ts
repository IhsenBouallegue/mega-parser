import { Language } from "@/types/enums";

export function detectLanguage(fileName: string): Language {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const LanguageExtensions: { [key: string]: Language } = {
    java: Language.Java,
    js: Language.JavaScript,
    ts: Language.TypeScript,
    kt: Language.Kotlin,
    kts: Language.Kotlin,
    // ADD EXTENSIONS
  };
  return LanguageExtensions[extension || ""] || Language.Unknown;
}
