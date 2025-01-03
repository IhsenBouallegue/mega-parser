import type { Language } from "./enums";

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
  calculate(content: string, language: Language): number;
}
