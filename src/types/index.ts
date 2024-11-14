export interface FileObject {
  path: string;
  name: string;
  language: string;
  content: string;
  metrics: { [metricName: string]: number };
}

export interface IMetricPlugin {
  name: string;
  supportedLanguages: string[];
  calculate(content: string): number;
}
