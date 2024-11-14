import type { IMetricPlugin } from "@/types";

export class SonarComplexityJavaPlugin implements IMetricPlugin {
  name = "sonarComplexity";
  supportedLanguages = ["java"];

  calculate(content: string): number {
    return calculateJavaComplexity(content);
  }
}

function calculateJavaComplexity(code: string): number {
  const codeWithoutCommentsAndStrings = removeCommentsAndStrings(code);

  const complexityKeywords = [
    "if",
    "for",
    "while",
    "case",
    "&&",
    "\\|\\|",
    "\\?",
    "->",
  ];
  const pattern = new RegExp(`\\b(${complexityKeywords.join("|")})\\b`, "g");

  const matches = codeWithoutCommentsAndStrings.match(pattern);
  const complexity = matches ? matches.length : 0;

  return complexity;
}

function removeCommentsAndStrings(code: string): string {
  const patterns = [
    /\/\/.*$/gm, // Single-line comments
    /\/\*[\s\S]*?\*\//g, // Multi-line comments
    /"(?:\\.|[^"\\])*"/g, // Double-quoted strings
    /'(?:\\.|[^'\\])*'/g, // Single-quoted strings
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
