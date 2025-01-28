import type { IMetricPlugin } from "@/types";
import type { ComplexityDebug, ComplexityPattern } from "@/types";
import { Language } from "@/types";

export class SonarComplexityPlugin implements IMetricPlugin<ComplexityDebug> {
  name = "sonar_complexity";
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
      // Java Functions
      {
        category: "Functions",
        name: "Method",
        regex: "(?:public|private|protected|static|\\s)*\\b[\\w<>\\[\\]]+\\s+[\\w_]+\\s*\\([^)]*\\)\\s*\\{",
      },
      { category: "Functions", name: "Constructor", regex: "\\b[A-Z][\\w_]*\\s*\\([^)]*\\)\\s*\\{" },
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
      // ============================
      // Kotlin Functions with bodies
      // ============================
      {
        category: "Functions",
        name: "Function",
        regex:
          // ^[ \t]*fun ... {  (requires a body)
          // Optional generics <T>
          // Optional extension receiver: e.g. String., MyClass<T>.
          // Function name + param list (...)
          // Optional return type that can include ?, e.g. : Node<T>?
          // Then an opening curly {
          "^[ \t]*fun\\s*" +
          "(?:<[^>]+>\\s*)?" + // optional generic: fun <T>
          "(?:[A-Za-z0-9_<>.:?]+\\.)?" + // optional extension receiver: String., MyClass<T>., etc.
          "[A-Za-z0-9_]+" + // function name
          "\\s*\\([^)]*\\)" + // parameter list (...)
          "(?:\\s*:\\s*[\\w<>\\[\\]\\?]+)?" + // optional return type, allowing '?' for e.g. Node<T>?
          "\\s*\\{", // opening curly brace
      },

      // ============================
      // Kotlin Control Flow
      // ============================
      { category: "Control Flow", name: "If", regex: "\\bif\\b(?!\\s*else\\b)" },
      { category: "Control Flow", name: "Else If", regex: "\\belse\\s+if\\b" },
      {
        category: "Control Flow",
        name: "For",
        regex: "\\bfor\\b(?=\\s*\\([^)]*\\)|\\s+in\\b)",
      },
      { category: "Control Flow", name: "While", regex: "\\bwhile\\b" },
      { category: "Control Flow", name: "Catch", regex: "\\bcatch\\b" },
      { category: "Control Flow", name: "Throw", regex: "\\bthrow\\b" },

      // ============================
      // Kotlin Operators
      // ============================
      { category: "Operators", name: "AND", regex: "&&(?!\\s*\\{)" },
      { category: "Operators", name: "OR", regex: "\\|\\|(?!\\s*\\{)" },

      // ============================
      // Kotlin Specific
      // ============================
      { category: "Kotlin Specific", name: "When", regex: "\\bwhen\\s*\\([^)]*\\)\\s*\\{" },

      // ----------------------------
      // In sonar cognitive complexity null safety chain is not counted as complexity
      // {
      //   category: "Kotlin Specific",
      //   name: "Null Safety Chain",
      //   regex: "\\w+(?:\\?\\.[\\w.]+)+(?:\\.(?:let|also|run|apply|with)\\s*\\{[^}]*})?",
      // },
      // ----------------------------

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
      {
        // 1) Named Function Declarations: e.g.
        //    "function foo() { ... }"
        //    "export async function foo() { ... }"
        //    "export default async function foo() { ... }" (if you want to allow that too)
        category: "Functions",
        name: "Named Function Declarations",
        regex:
          // Explanation:
          // ^[ \t]*    => start of line + optional indentation
          // (?:export\s+(?:default\s+)?)? => optional 'export' and/or 'default'
          // (?:async\s+)? => optional 'async'
          // function\s+ => 'function' plus at least one space
          // (?!if|for|...) => disallow certain keywords as function names
          // [A-Za-z_$][A-Za-z0-9_$]* => valid identifier
          // \([^)]*\) => parameter list in (...)
          // (?:\s*:\s*...) => optional return type
          // \s*\{ => opening curly
          "^[ \t]*(?:export\\s+(?:default\\s+)?)?(?:async\\s+)?function\\s+(?!if|for|while|switch|catch|do)" +
          "[A-Za-z_$][A-Za-z0-9_$]*\\s*\\([^)]*\\)" +
          "(?:\\s*:\\s*[A-Za-z_$][A-Za-z0-9_$<>,|\\[\\]?]*)?" + // optional return type
          "\\s*\\{",
      },

      {
        // 2) Class/Object Methods: e.g. "public foo(): void { ... }", "foo(): number { ... }"
        category: "Functions",
        name: "Class/Object Methods",
        regex:
          // Start-of-line + optional spaces
          // + optional TS modifiers (public|private|protected|static|abstract|readonly|async)
          // + disallow keywords as method name (if|for|while|...)
          // + valid identifier + optional generics
          // + param list (...)
          // + optional return/type annotation `: SomeType`
          // + opening curly
          "^[ \t]*(?:(?:public|private|protected|static|abstract|readonly|async)\\s+)*" +
          "(?!if|for|while|switch|catch|do)" +
          "[A-Za-z_$][A-Za-z0-9_$]*(?:<[^>]*>)?\\s*\\([^)]*\\)" +
          "(?:\\s*:\\s*[A-Za-z_$][A-Za-z0-9_$<>,|\\[\\]? ]*)?" +
          "\\s*\\{",
      },
      {
        // 3) Arrow Functions (Block Body): e.g. "const foo = (x) => { ... }"
        category: "Functions",
        name: "Arrow Functions",
        regex:
          // Start-of-line + optional spaces
          // + (const|let|var)
          // + variable name disallowing keywords
          // + optional async
          // + param list or single param
          // + => + { (block)
          "^[ \t]*(?:const|let|var)\\s+(?!if|for|while|switch|catch|do)" +
          "[A-Za-z_$][A-Za-z0-9_$]*\\s*=\\s*" +
          "(?:async\\s+)?" +
          "(?:\\([^)]*\\)|[A-Za-z_$][A-Za-z0-9_$]*)\\s*=>\\s*\\{",
      },

      // TypeScript Control Flow
      // "if (...)" statements
      {
        category: "Control Flow",
        name: "If",
        // \bif\s*\(   => word boundary, "if", optional spaces, then "("
        regex: "\\bif\\s*\\(",
      },

      // "else if (...)" statements
      {
        category: "Control Flow",
        name: "Else If",
        // \belse\s+if\s*\(  => ensures we see "else if("
        regex: "\\belse\\s+if\\s*\\(",
      },

      // "for (...)" loops
      {
        category: "Control Flow",
        name: "For",
        regex: "\\bfor\\s*\\(",
      },

      // "while (...)" loops
      {
        category: "Control Flow",
        name: "While",
        regex: "\\bwhile\\s*\\(",
      },

      // "do" (often used with "do { ... } while(...)")
      // There's no parentheses immediately after 'do' in JS/TS.
      {
        category: "Control Flow",
        name: "Do While",
        regex: "\\bdo\\b",
      },

      // "try { ... }"
      // No parentheses right after "try"
      {
        category: "Control Flow",
        name: "Try",
        regex: "\\btry\\b",
      },

      // "catch (...)" blocks
      {
        category: "Control Flow",
        name: "Catch",
        regex: "\\bcatch\\s*\\(",
      },

      // "throw" statements often followed by an expression, not parentheses
      {
        category: "Control Flow",
        name: "Throw",
        regex: "\\bthrow\\b",
      },

      // "switch (...)" statements
      {
        category: "Control Flow",
        name: "Switch",
        regex: "\\bswitch\\s*\\(",
      },

      // "case" within switch statements
      // Typically: "case <expression>:"
      // The negative lookahead (?!...) is to avoid double-counting "case" on the same line
      {
        category: "Control Flow",
        name: "Case",
        regex: "\\bcase\\b(?!\\s*:.*\\bcase\\b)",
      },
      {
        category: "Control Flow",
        name: "Filter",
        regex: "\\.filter\\s*\\(",
      },
      {
        category: "Control Flow",
        name: "Map",
        regex: "\\.map\\s*\\(",
      },
      {
        category: "Control Flow",
        name: "ForEach",
        regex: "\\.forEach\\s*\\(",
      },
      {
        category: "Control Flow",
        name: "Case",
        regex: "\\bcase\\b(?!\\s*:.*\\bcase\\b)",
      },

      // TypeScript Operators
      { category: "Operators", name: "AND", regex: "&&(?!\\s*\\{)" },
      { category: "Operators", name: "OR", regex: "\\|\\|(?!\\s*\\{)" },
      {
        category: "Operators",
        name: "Nullish",
        // Explanation:
        // - Match `??`
        // - `(?!\\.)` ensures we don't match `??.`
        //   (which is invalid, but helps avoid partial matches).
        // - If you also want to exclude `??=`, use `(?![.=])` instead
        regex: "\\?\\?(?!\\.)",
      },
      {
        category: "Operators",
        name: "Ternary",
        // Explanation:
        // - `(?<!\\?)\\?`: negative lookbehind to ensure this '?' is NOT preceded by '?'
        // - `(?!\\?|\\.)`: negative lookahead so next char is not '?' or '.'
        // - `(?=...)`: requires typical ternary usage (identifier, true/false/null, etc.)
        // - `(?![.:])`: do not allow immediate '.' or ':'
        regex: "(?<!\\?)\\?(?!\\?|\\.)(?=\\s*[\\w'\"`\\(\\[{]|\\s*(?:true|false|null))(?![.:])",
      },
      // TypeScript Specific
      {
        category: "TypeScript Specific",
        name: "Optional Chaining",
        // e.g. matches `foo?.bar`, `obj?.prop?.deep`
        regex: "\\w+(?:\\?\\.[\\w$]+)+",
      },
      {
        category: "TypeScript Specific",
        name: "Type Guard",
        regex: "\\bis\\s+[A-Z]\\w*\\b",
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

    // Process each pattern in MULTILINE mode ("gm")
    for (const { category, name, regex } of languagePatterns) {
      const { matches, lines } = findAllMatches(cleanCode, new RegExp(regex, "gm"));
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

    // Add 'when' branch complexity for Kotlin
    if (language === Language.Kotlin) {
      const whenBranches = this.countWhenBranches(cleanCode);
      if (whenBranches.count > 0) {
        patterns.push(whenBranches);
      }
    }

    const complexity = patterns.reduce((sum, p) => sum + p.count, 0);

    if (!debug) {
      return { complexity };
    }

    return {
      complexity,
      debug: {
        patterns,
        totalComplexity: complexity,
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

      // Match valid when branches: else ->, is Type ->, or literal ->
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

// Helpers
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
    // /\/\/.*$/gm, // Single-line comments
    // /\/\*[\s\S]*?\*\//g, // Multi-line comments
    // /"(?:[^"\\]|\\.)*"/g, // Double-quoted strings
    // /'(?:[^'\\]|\\.)*'/g, // Single-quoted strings
    /`(?:[^`\\]|\\.)*`/g, // Template literals
    // /\/(?:[^/\\]|\\.)*\/[gimuy]*/g, // Regular expressions
  ];

  let codeWithoutCommentsAndStrings = code;

  for (const pattern of patterns) {
    codeWithoutCommentsAndStrings = codeWithoutCommentsAndStrings.replace(pattern, "");
  }

  return codeWithoutCommentsAndStrings;
}
