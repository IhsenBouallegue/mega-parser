import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import type { FileObject } from "mega-parser";
import type { ComplexityDebug, ComplexityPattern } from "mega-parser/src/types/debug";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import "highlight.js/styles/github-dark.css";

// Register TypeScript language
hljs.registerLanguage("typescript", typescript);

// Define pattern colors
const PATTERN_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEEAD", // Yellow
  "#D4A5A5", // Pink
  "#9370DB", // Purple
  "#20B2AA", // Light Sea Green
  "#FFB6C1", // Light Pink
  "#98FB98", // Pale Green
];

interface DebugViewerProps {
  files: FileObject[];
}

export function DebugViewer({ files }: DebugViewerProps) {
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [patternColorMap, setPatternColorMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Initialize pattern colors when selected file changes
    if (selectedFile) {
      const debug = getDebugInfo(selectedFile);
      if (debug) {
        const newColorMap = new Map<string, string>();
        const patterns = debug.patterns;
        let colorIndex = 0;
        for (const pattern of patterns) {
          newColorMap.set(pattern.name, PATTERN_COLORS[colorIndex % PATTERN_COLORS.length]);
          colorIndex++;
        }
        setPatternColorMap(newColorMap);
      }
    }
  }, [selectedFile]);

  const getDebugInfo = (file: FileObject): ComplexityDebug | null => {
    if (!file.debugInfo?.[1]) return null;
    return file.debugInfo[1] as ComplexityDebug;
  };

  const createHighlightedElement = (html: string) => {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (
      <div
        className="hljs font-mono text-sm bg-background"
        ref={(node) => {
          if (node) {
            node.innerHTML = html;
            // Add specific classes for better syntax highlighting
            node.classList.add("language-typescript");
            node.classList.add("hljs-theme-dark");
          }
        }}
      />
    );
  };

  const highlightCode = (code: string, language: string) => {
    const highlighted = hljs.highlight(code, { language }).value;
    return createHighlightedElement(highlighted);
  };

  const highlightCodeWithPatterns = (code: string, patterns: ComplexityPattern[]) => {
    // First, create a map of line numbers to matches for each pattern
    const lineMatches = new Map<
      number,
      { pattern: ComplexityPattern; match: string; regex: RegExp; isFunction: boolean }[]
    >();

    for (const pattern of patterns) {
      pattern.matches.forEach((match, idx) => {
        const lineNum = pattern.lines[idx];
        if (!lineMatches.has(lineNum)) {
          lineMatches.set(lineNum, []);
        }
        // Escape special regex characters in the match string
        const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // For function patterns, we need to match the entire function declaration
        const isFunction = pattern.category.includes("Function");
        const matchRegex = isFunction ? new RegExp(`^\\s*${escapedMatch}\\s*$`) : new RegExp(escapedMatch);

        lineMatches.get(lineNum)?.push({
          pattern,
          match,
          regex: matchRegex,
          isFunction,
        });
      });
    }

    // Split code into lines and process each line
    const lines = code.split("\n");
    const processedLines = lines.map((line, idx) => {
      // First highlight the line with highlight.js
      let highlightedLine = hljs.highlight(line, { language: "typescript" }).value;

      // Then apply pattern highlights if any exist for this line
      const matches = lineMatches.get(idx + 1) || [];
      for (const { pattern, match, regex, isFunction } of matches) {
        const color = patternColorMap.get(pattern.name) || PATTERN_COLORS[0];
        if (isFunction) {
          // For functions, wrap the entire line
          if (regex.test(line)) {
            highlightedLine = `<span style="background-color: ${color}40; border-bottom: 2px solid ${color}">${highlightedLine}</span>`;
          }
        } else {
          // For other patterns, just highlight the matching part
          highlightedLine = highlightedLine.replace(
            regex,
            `<span style="background-color: ${color}40; border-bottom: 2px solid ${color}">$&</span>`,
          );
        }
      }
      return highlightedLine;
    });

    return createHighlightedElement(processedLines.join("\n"));
  };

  const renderFileTree = () => {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Files</h3>
        <div className="space-y-2">
          {files.map((file) => {
            const debug = getDebugInfo(file);
            if (!debug) return null;

            return (
              <button
                type="button"
                key={file.path}
                className={`w-full p-2 rounded cursor-pointer hover:bg-accent ${
                  selectedFile?.path === file.path ? "bg-accent" : ""
                } text-left`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex justify-between items-center">
                  <span>{file.name}</span>
                  <span className="text-sm text-muted-foreground">Complexity: {debug.totalComplexity}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPatternHighlight = (code: string, pattern: ComplexityPattern) => {
    const color = patternColorMap.get(pattern.name) || PATTERN_COLORS[0];
    return (
      <div key={pattern.name} className="mt-4">
        <h4 className="font-medium" style={{ borderLeft: `4px solid ${color}`, paddingLeft: "8px" }}>
          {pattern.category} - {pattern.name} ({pattern.count})
        </h4>
        <div className="mt-2 space-y-2">
          {pattern.matches.map((match, idx) => (
            <div key={`${pattern.name}-${pattern.lines[idx]}-${match}`} className="flex items-start space-x-2">
              <span className="text-sm text-muted-foreground min-w-[4rem]">Line {pattern.lines[idx]}</span>
              <pre className="bg-background p-2 rounded flex-1 overflow-x-auto">
                <code className="text-sm">{highlightCode(match, "typescript")}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFileDetails = () => {
    if (!selectedFile) {
      return <div className="p-4 text-center text-muted-foreground">Select a file to view details</div>;
    }

    const debug = getDebugInfo(selectedFile);
    if (!debug) {
      return <div className="p-4 text-center text-muted-foreground">No debug information available</div>;
    }

    return (
      <div className="p-4 h-full">
        <h3 className="text-xl font-semibold mb-4">{selectedFile.name}</h3>
        <Tabs defaultValue="patterns" className="h-[calc(100%-2rem)]">
          <TabsList>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="patterns" className="h-[calc(100%-2.5rem)] overflow-auto">
            <div className="space-y-4">
              {debug.patterns
                .sort((a, b) => a.category.localeCompare(b.category))
                .map((pattern) => renderPatternHighlight(debug.code, pattern))}
            </div>
          </TabsContent>
          <TabsContent value="code" className="h-[calc(100%-2.5rem)]">
            <Card className="p-4 h-full bg-background">
              <ScrollArea className="h-full">
                <pre className="whitespace-pre-wrap">
                  <code>{highlightCodeWithPatterns(debug.code, debug.patterns)}</code>
                </pre>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r h-full">
        <ScrollArea className="h-full">{renderFileTree()}</ScrollArea>
      </div>
      <div className="flex-1 h-full overflow-hidden">{renderFileDetails()}</div>
    </div>
  );
}
