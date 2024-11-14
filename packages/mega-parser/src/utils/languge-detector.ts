export function detectLanguage(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const LanguageExtensions: { [key: string]: string } = {
    java: "java",
    js: "javascript",
    ts: "typescript",
    // ADD EXTENSIONS
  };
  return LanguageExtensions[extension || ""] || "unknown";
}
