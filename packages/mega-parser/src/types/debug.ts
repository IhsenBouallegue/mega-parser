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
  baseComplexity: number;
  code: string;
  language: string;
}
