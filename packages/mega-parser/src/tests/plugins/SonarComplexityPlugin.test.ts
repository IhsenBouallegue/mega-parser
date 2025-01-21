import { describe, expect, it } from "bun:test";
import { SonarComplexityPlugin } from "@/plugins/sonar-complexity";
import type { ComplexityDebug } from "@/types/debug";
import { Language } from "@/types/enums";
import { loadFile } from "../utils/load-file";

interface TestCase {
  fileName: string;
  expectedComplexity: number;
}

describe("SonarComplexityPlugin Tests", () => {
  const plugin = new SonarComplexityPlugin();

  describe("Java Tests", () => {
    const loadJavaFile = loadFile("src/tests/assets/java");

    const javaTestCases: TestCase[] = [
      { fileName: "SimpleClass.java", expectedComplexity: 1 },
      { fileName: "IfStatement.java", expectedComplexity: 2 },
      { fileName: "ForLoop.java", expectedComplexity: 2 },
      { fileName: "IfAndFor.java", expectedComplexity: 3 },
      { fileName: "MultipleControlFlow.java", expectedComplexity: 6 },
      { fileName: "LogicalOperators.java", expectedComplexity: 4 },
      { fileName: "TernaryOperator.java", expectedComplexity: 2 },
      { fileName: "LambdaExpression.java", expectedComplexity: 2 },
      { fileName: "NestedControlFlow.java", expectedComplexity: 7 },
      { fileName: "TryCatch.java", expectedComplexity: 2 },
      { fileName: "TryCatchFinally.java", expectedComplexity: 2 },
      { fileName: "NestedSwitch.java", expectedComplexity: 5 },
      { fileName: "AnonymousClass.java", expectedComplexity: 3 },
      { fileName: "TryWithResources.java", expectedComplexity: 2 },
      { fileName: "FunctionDetection.java", expectedComplexity: 3 },
    ];

    for (const { fileName, expectedComplexity } of javaTestCases) {
      it(`should calculate complexity for ${fileName}`, () => {
        const code = loadJavaFile(fileName);
        const result = plugin.calculate(code, Language.Java, true);
        const debug = plugin.getDebugInfo();

        if (result !== expectedComplexity) {
          printDebugInfo(fileName, debug);
        }

        expect(result).toBe(expectedComplexity);
      });
    }
  });

  describe("Kotlin Tests", () => {
    const loadKotlinFile = loadFile("src/tests/assets/kotlin");

    const kotlinTestCases: TestCase[] = [
      { fileName: "SimpleClass.kt", expectedComplexity: 1 },
      { fileName: "IfExpression.kt", expectedComplexity: 2 },
      { fileName: "ForLoop.kt", expectedComplexity: 2 },
      { fileName: "WhenExpression.kt", expectedComplexity: 5 },
      { fileName: "ElvisOperator.kt", expectedComplexity: 2 },
      { fileName: "SafeCall.kt", expectedComplexity: 2 },
      { fileName: "LambdaExpression.kt", expectedComplexity: 2 },
      { fileName: "CompanionObject.kt", expectedComplexity: 2 },
      { fileName: "ScopeFunctions.kt", expectedComplexity: 6 },
      { fileName: "MultipleControlFlow.kt", expectedComplexity: 6 },
      { fileName: "TryCatch.kt", expectedComplexity: 2 },
      { fileName: "ObjectExpression.kt", expectedComplexity: 3 },
      { fileName: "FunctionDetection.kt", expectedComplexity: 7 },
    ];

    for (const { fileName, expectedComplexity } of kotlinTestCases) {
      it(`should calculate complexity for ${fileName}`, () => {
        const code = loadKotlinFile(fileName);
        const result = plugin.calculate(code, Language.Kotlin, true);
        const debug = plugin.getDebugInfo();

        if (result !== expectedComplexity) {
          printDebugInfo(fileName, debug);
        }

        expect(result).toBe(expectedComplexity);
      });
    }
  });

  describe("TypeScript Tests", () => {
    const loadTypeScriptFile = loadFile("src/tests/assets/typescript");

    const typeScriptTestCases: TestCase[] = [
      { fileName: "SimpleClass.ts", expectedComplexity: 1 },
      { fileName: "IfStatement.ts", expectedComplexity: 2 },
      { fileName: "ForLoop.ts", expectedComplexity: 2 },
      { fileName: "OptionalChaining.ts", expectedComplexity: 2 },
      { fileName: "NullishCoalescing.ts", expectedComplexity: 2 },
      { fileName: "TypeGuards.ts", expectedComplexity: 3 },
      { fileName: "AsyncFunction.ts", expectedComplexity: 4 },
      { fileName: "FunctionDetection.ts", expectedComplexity: 4 },
    ];

    for (const { fileName, expectedComplexity } of typeScriptTestCases) {
      it(`should calculate complexity for ${fileName}`, () => {
        const code = loadTypeScriptFile(fileName);
        const result = plugin.calculate(code, Language.TypeScript, true);
        const debug = plugin.getDebugInfo();

        if (result !== expectedComplexity) {
          printDebugInfo(fileName, debug);
        }

        expect(result).toBe(expectedComplexity);
      });
    }
  });
});

function printDebugInfo(fileName: string, debug: ComplexityDebug | undefined): void {
  console.log("\n\x1b[36m%s\x1b[0m", `Debug info for ${fileName}`); // Cyan

  if (!debug) {
    console.log("\x1b[31m%s\x1b[0m", "No debug info available"); // Red
    return;
  }

  const byCategory = debug.patterns.reduce<Record<string, typeof debug.patterns>>((acc, pattern) => {
    acc[pattern.category] = acc[pattern.category] || [];
    acc[pattern.category].push(pattern);
    return acc;
  }, {});

  for (const [category, patterns] of Object.entries(byCategory)) {
    console.log("\n\x1b[33m%s\x1b[0m", category); // Yellow
    for (const pattern of patterns) {
      for (let i = 0; i < pattern.matches.length; i++) {
        console.log("\x1b[90m%d:\x1b[0m %s", pattern.lines[i], pattern.matches[i]); // Gray line numbers, matches
      }
    }
  }

  console.log("\n\x1b[1mTotal:\x1b[0m \x1b[37m%d\x1b[0m", debug.totalComplexity);
}
