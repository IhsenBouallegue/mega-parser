import type { Language } from "./enums";

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
}

export interface IMetricPlugin {
  name: string;
  supportedLanguages: Language[];
  calculate(content: string, language: Language, debug?: boolean): number;
}
