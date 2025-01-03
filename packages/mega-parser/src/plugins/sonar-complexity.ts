import type { IMetricPlugin } from "@/types";
import type { ComplexityDebug, ComplexityPattern } from "@/types/debug";
import { Language } from "@/types/enums";

export class SonarComplexityPlugin implements IMetricPlugin {
  name = "sonarComplexity";
  supportedLanguages = [Language.Java, Language.Kotlin, Language.TypeScript];
  debugInfo?: ComplexityDebug;

  calculate(content: string, language: Language, debug = false): number {
    const result = this.calculateComplexity(content, language, debug);
    if (debug) {
      this.debugInfo = result.debug;
    }
    return result.complexity;
  }

  getDebugInfo(): ComplexityDebug | undefined {
    return this.debugInfo;
  }

  private getJavaPatterns(): { category: string; name: string; regex: string }[] {
    return [
      // Java Control Flow
      { category: "Control Flow", name: "If", regex: "\\bif\\b(?!\\s*else\\b)" },
      { category: "Control Flow", name: "Else If", regex: "\\belse\\s+if\\b" },
      { category: "Control Flow", name: "For", regex: "\\bfor\\b" },
      { category: "Control Flow", name: "While", regex: "\\bwhile\\b" },
      { category: "Control Flow", name: "Catch", regex: "\\bcatch\\b" },
      { category: "Control Flow", name: "Throw", regex: "\\bthrow\\b" },
      { category: "Control Flow", name: "Case", regex: "\\bcase\\b(?!\\s*:.*\\bcase\\b)" },
      // Java Operators
      { category: "Operators", name: "AND", regex: "&&" },
      { category: "Operators", name: "OR", regex: "\\|\\|" },
      { category: "Operators", name: "Ternary", regex: "\\?(?!:)" },
      // Java Specific
      { category: "Java Specific", name: "Anonymous Class", regex: "new\\s+\\w+\\s*\\([^)]*\\)\\s*\\{" },
      { category: "Java Specific", name: "Lambda", regex: "->(?!\\s*\\{)" },
    ];
  }

  private getKotlinPatterns(): { category: string; name: string; regex: string }[] {
    return [
      // Kotlin Control Flow
      { category: "Control Flow", name: "If", regex: "\\bif\\b(?!\\s*else\\b)" },
      { category: "Control Flow", name: "Else If", regex: "\\belse\\s+if\\b" },
      { category: "Control Flow", name: "For", regex: "\\bfor\\b(?=\\s*\\([^)]*\\)|\\s+in\\b)" },
      { category: "Control Flow", name: "While", regex: "\\bwhile\\b" },
      { category: "Control Flow", name: "Catch", regex: "\\bcatch\\b" },
      { category: "Control Flow", name: "Throw", regex: "\\bthrow\\b" },
      // Kotlin Operators
      { category: "Operators", name: "AND", regex: "&&(?!\\s*\\{)" },
      { category: "Operators", name: "OR", regex: "\\|\\|(?!\\s*\\{)" },
      // Kotlin Specific
      { category: "Kotlin Specific", name: "When", regex: "\\bwhen\\s*\\([^)]*\\)\\s*\\{" },
      // Null Safety Chain (includes safe calls with scope functions)
      {
        category: "Kotlin Specific",
        name: "Null Safety Chain",
        regex: "\\w+(?:\\?\\.[\\w.]+)+(?:\\.(?:let|also|run|apply|with)\\s*\\{[^}]*})?",
      },
      // Scope Functions (only match when not part of safe call chain)
      {
        category: "Kotlin Specific",
        name: "Scope Functions",
        regex: "(?<!\\?)\\.(let|also|run|apply|with)\\s*\\{",
      },
      { category: "Kotlin Specific", name: "Object", regex: "\\bobject\\s*:" },
      { category: "Kotlin Specific", name: "Companion Object", regex: "\\bcompanion\\s+object\\b" },
      {
        category: "Kotlin Specific",
        name: "Lambda",
        regex: "(?<!when\\s*\\([^)]*\\)\\s*\\{[^}]*?)(?<!\\.(let|also|run|apply|with)\\s*\\{[^}]*)->\\s*(?!\\{|$)",
      },
    ];
  }

  private getTypeScriptPatterns(): { category: string; name: string; regex: string }[] {
    return [
      // TypeScript Control Flow
      { category: "Control Flow", name: "If", regex: "\\bif\\b(?!\\s*else\\b)" },
      { category: "Control Flow", name: "Else If", regex: "\\belse\\s+if\\b" },
      { category: "Control Flow", name: "For", regex: "\\bfor\\b" },
      { category: "Control Flow", name: "While", regex: "\\bwhile\\b" },
      { category: "Control Flow", name: "Do While", regex: "\\bdo\\b" },
      { category: "Control Flow", name: "Try", regex: "\\btry\\b" },
      { category: "Control Flow", name: "Catch", regex: "\\bcatch\\b" },
      { category: "Control Flow", name: "Throw", regex: "\\bthrow\\b" },
      { category: "Control Flow", name: "Switch", regex: "\\bswitch\\b" },
      { category: "Control Flow", name: "Case", regex: "\\bcase\\b(?!\\s*:.*\\bcase\\b)" },

      // TypeScript Operators
      { category: "Operators", name: "AND", regex: "&&(?!\\s*\\{)" },
      { category: "Operators", name: "OR", regex: "\\|\\|(?!\\s*\\{)" },
      { category: "Operators", name: "Nullish", regex: "\\?\\?(?!\\s*\\{)" },
      // Don't match:
      // - Type annotations (?:)
      // - Optional properties (?<identifier>)
      // - Optional chaining (?.)
      // - Type unions (string | number)
      {
        category: "Operators",
        name: "Ternary",
        // Only match ternary that's followed by an expression, not type annotations
        regex: "\\?(?=\\s*[\\w'\"`\\(\\[{]|\\s*(?:true|false|null))(?![.:])",
      },

      // TypeScript Specific
      {
        category: "TypeScript Specific",
        name: "Optional Chaining",
        regex: "\\w+(?:\\?\\.[\\w$]+)+",
      },
      {
        category: "TypeScript Specific",
        name: "Type Guard",
        regex: "\\bis\\s+[A-Z]\\w*\\b",
      },
      {
        category: "TypeScript Specific",
        name: "Arrow Function",
        regex: "(?<!\\b(?:case|return|throw|yield|await)\\s*)=>(?!\\s*[{,])",
      },
      {
        category: "TypeScript Specific",
        name: "Generator",
        regex: "\\bfunction\\s*\\*",
      },
      {
        category: "TypeScript Specific",
        name: "Async Function",
        regex: "\\basync\\s+(?:function|\\()",
      },
    ];
  }

  private calculateComplexity(
    code: string,
    language: Language,
    debug: boolean,
  ): { complexity: number; debug?: ComplexityDebug } {
    const cleanCode =
      language === Language.TypeScript
        ? removeTypeScriptCommentsAndStrings(code)
        : language === Language.Java
          ? removeJavaCommentsAndStrings(code)
          : removeKotlinCommentsAndStrings(code);

    const patterns: ComplexityPattern[] = [];
    const languagePatterns =
      language === Language.Java
        ? this.getJavaPatterns()
        : language === Language.TypeScript
          ? this.getTypeScriptPatterns()
          : this.getKotlinPatterns();

    // Process each pattern
    for (const { category, name, regex } of languagePatterns) {
      const { matches, lines } = findAllMatches(cleanCode, new RegExp(regex, "g"));
      if (matches.length > 0) {
        patterns.push({
          category,
          name,
          regex,
          matches,
          lines,
          count: matches.length,
        });
      }
    }

    // Add when branch complexity for Kotlin
    if (language === Language.Kotlin) {
      const whenBranches = this.countWhenBranches(cleanCode);
      if (whenBranches.count > 0) {
        patterns.push(whenBranches);
      }
    }

    const complexity = 1 + patterns.reduce((sum, p) => sum + p.count, 0);

    if (!debug) {
      return { complexity };
    }

    return {
      complexity,
      debug: {
        patterns,
        totalComplexity: complexity,
        baseComplexity: 1,
        code: cleanCode,
        language: language.toLowerCase(),
      },
    };
  }

  private countWhenBranches(code: string): ComplexityPattern {
    const whenBlockPattern = /when\s*\([^)]*\)\s*\{([^}]*)\}/g;
    const whenBlocks = code.match(whenBlockPattern) || [];
    const branchMatches: string[] = [];
    const branchLines: number[] = [];

    for (const block of whenBlocks) {
      const blockStart = code.indexOf(block);
      if (blockStart === -1) continue;

      // Match only valid when branches:
      // - else ->
      // - is Type ->
      // - literal/identifier ->
      const branchPattern = /(?:(?:else)|(?:is\s+\w+)|(?:\d+|"[^"]*"|'[^']*'|\w+(?:\([^)]*\))?))[ \t]*->/g;
      const branches = block.match(branchPattern);
      if (branches && branches.length > 0) {
        branchMatches.push(...branches);
        const upToBlock = code.substring(0, blockStart);
        const startLine = upToBlock.split("\n").length;
        branchLines.push(...Array(branches.length).fill(startLine));
      }
    }

    return {
      category: "Kotlin Specific",
      name: "When Branches",
      regex: "->",
      matches: branchMatches,
      lines: branchLines,
      count: branchMatches.length,
    };
  }
}

function findAllMatches(code: string, pattern: RegExp): { matches: string[]; lines: number[] } {
  const matches: string[] = [];
  const lines: number[] = [];

  let match = pattern.exec(code);
  while (match !== null) {
    matches.push(match[0]);
    const lineNumber = code.substring(0, match.index).split("\n").length;
    lines.push(lineNumber);
    match = pattern.exec(code);
  }

  return { matches, lines };
}

function removeJavaCommentsAndStrings(code: string): string {
  const patterns = [
    /\/\/.*$/gm, // Single-line comments
    /\/\*[\s\S]*?\*\//g, // Multi-line comments
    /"(?:[^"\\]|\\.)*"/g, // Double-quoted strings
    /'(?:[^'\\]|\\.)*'/g, // Single-quoted strings
  ];

  let codeWithoutCommentsAndStrings = code;

  for (const pattern of patterns) {
    codeWithoutCommentsAndStrings = codeWithoutCommentsAndStrings.replace(pattern, "");
  }

  return codeWithoutCommentsAndStrings;
}

function removeKotlinCommentsAndStrings(code: string): string {
  const patterns = [
    /\/\/.*$/gm, // Single-line comments
    /\/\*[\s\S]*?\*\//g, // Multi-line comments
    /"(?:[^"\\]|\\.)*"/g, // Double-quoted strings
    /"""[\s\S]*?"""/g, // Triple-quoted strings
    /'(?:[^'\\]|\\.)*'/g, // Single-quoted strings
    /`(?:[^`\\]|\\.)*`/g, // Raw strings
  ];

  let codeWithoutCommentsAndStrings = code;

  for (const pattern of patterns) {
    codeWithoutCommentsAndStrings = codeWithoutCommentsAndStrings.replace(pattern, "");
  }

  return codeWithoutCommentsAndStrings;
}

function removeTypeScriptCommentsAndStrings(code: string): string {
  const patterns = [
    /\/\/.*$/gm, // Single-line comments
    /\/\*[\s\S]*?\*\//g, // Multi-line comments
    /"(?:[^"\\]|\\.)*"/g, // Double-quoted strings
    /'(?:[^"\\]|\\.)*'/g, // Single-quoted strings
    /`(?:[^`\\]|\\.)*`/g, // Template literals
    /\/(?:[^/\\]|\\.)*\/[gimuy]*/g, // Regular expressions
  ];

  let codeWithoutCommentsAndStrings = code;

  for (const pattern of patterns) {
    codeWithoutCommentsAndStrings = codeWithoutCommentsAndStrings.replace(pattern, "");
  }

  return codeWithoutCommentsAndStrings;
}
