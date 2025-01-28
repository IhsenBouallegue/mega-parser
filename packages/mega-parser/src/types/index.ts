import type { Language } from "./enums";
export * from "./enums";

export interface ComplexityPattern {
  name: string;
  category: string;
  regex: string;
  matches: string[];
  lines: number[];
  count: number;
}

export interface ComplexityDebug {
  patterns: ComplexityPattern[];
  totalComplexity: number;
  language: string;
}

export interface FileInput {
  path: string;
  name: string;
  content: string;
  size: number;
}

export interface FileObject {
  path: string;
  name: string;
  language: Language;
  content: string;
  metrics: { [metricName: string]: number };
  debugInfo?: { [pluginName: string]: unknown };
}

export interface IMetricPlugin<DebugInfo> {
  name: string;
  supportedLanguages: Language[];
  calculate(content: string, language: Language, debug?: boolean): number;
  getDebugInfo(): DebugInfo | undefined;
}
