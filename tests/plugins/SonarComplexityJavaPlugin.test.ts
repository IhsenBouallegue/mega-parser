import { SonarComplexityJavaPlugin } from '@/plugins/sonar-complexity-java';
import { describe, expect, it } from "bun:test";
import { loadFile } from "../utils/load-file";

describe("SonarComplexityJavaPlugin Tests", () => {
  const plugin = new SonarComplexityJavaPlugin();
  const loadJavaFile = loadFile("tests/assets/java");

  const testCases = [
    { fileName: "SimpleClass.java", expectedComplexity: 1 },
    { fileName: "IfStatement.java", expectedComplexity: 2 },
    { fileName: "ForLoop.java", expectedComplexity: 2 },
    { fileName: "IfAndFor.java", expectedComplexity: 3 },
    { fileName: "MultipleControlFlow.java", expectedComplexity: 5 },
    { fileName: "LogicalOperators.java", expectedComplexity: 4 },
    { fileName: "TernaryOperator.java", expectedComplexity: 2 },
    { fileName: "LambdaExpression.java", expectedComplexity: 2 },
    { fileName: "SwitchCases.java", expectedComplexity: 4 },
    { fileName: "NestedControlFlow.java", expectedComplexity: 6 },
    { fileName: "TryCatch.java", expectedComplexity: 2 },
    { fileName: "TryCatchFinally.java", expectedComplexity: 2 },
    { fileName: "NestedSwitch.java", expectedComplexity: 5 },
    { fileName: "ComplexLogicalExpressions.java", expectedComplexity: 5 },
    { fileName: "RecursiveMethod.java", expectedComplexity: 2 },
    { fileName: "ThrowException.java", expectedComplexity: 2 },
    { fileName: "AnonymousClass.java", expectedComplexity: 3 },
    { fileName: "TryWithResources.java", expectedComplexity: 2 },
  ];
  
  for (const { fileName, expectedComplexity } of testCases) {
    it(`should calculate complexity for ${fileName}`, () => {
      const code = loadJavaFile(fileName);
      const result = plugin.calculate(code);
      expect(result).toBe(expectedComplexity);
    });
  }
});