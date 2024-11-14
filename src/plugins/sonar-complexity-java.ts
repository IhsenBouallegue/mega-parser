import type { IMetricPlugin } from "@/types";

export class SonarComplexityJavaPlugin implements IMetricPlugin {
  name = "sonarComplexity";
  supportedLanguages = ["java"];

  calculate(content: string): number {
    return calculateJavaComplexity(content);
  }
}

export function calculateJavaComplexity(code: string): number {
  const codeWithoutCommentsAndStrings = removeCommentsAndStrings(code);

  const complexityPatterns = [
    "\\bif\\b",
    "\\belse\\s+if\\b",
    "\\bfor\\b",
    "\\bwhile\\b",
    "\\bcase\\b",
    "\\bcatch\\b",
    "\\bthrow\\b",
    "\\?|&&|\\|\\||->",
    "new\\s+\\w+(\\s*\\([^)]*\\))?\\s*(?=\\{)",
  ];

  const pattern = new RegExp(complexityPatterns.join("|"), "g");

  const matches = codeWithoutCommentsAndStrings.match(pattern);
  const complexity = (matches ? matches.length : 0) + 1; // Add 1 for base complexity

  return complexity;
}

function removeCommentsAndStrings(code: string): string {
  // Patterns to remove comments and strings
  const patterns = [
    /\/\/.*$/gm, // Single-line comments
    /\/\*[\s\S]*?\*\//g, // Multi-line comments
    /"(?:[^"\\]|\\.)*"/g, // Double-quoted strings
    /'(?:[^'\\]|\\.)*'/g, // Single-quoted strings
  ];

  let codeWithoutCommentsAndStrings = code;

  for (const pattern of patterns) {
    codeWithoutCommentsAndStrings = codeWithoutCommentsAndStrings.replace(
      pattern,
      "",
    );
  }

  return codeWithoutCommentsAndStrings;
}
