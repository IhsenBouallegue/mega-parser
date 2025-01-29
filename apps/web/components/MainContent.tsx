"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassmorphicContainer } from "@/components/ui/styled";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { Bug, Code, ListCollapse } from "lucide-react";
import type { ComplexityDebug, ComplexityPattern } from "mega-parser";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MainContent() {
  const [activeTab, setActiveTab] = useState("content");
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<ComplexityPattern | null>(null);
  const selectedFile = useStore((state) => state.selectedFile);

  useEffect(() => {
    if (selectedFile?.debugInfo) {
      const plugins = Object.keys(selectedFile.debugInfo);
      if (plugins.length > 0) {
        setSelectedPlugin(plugins[0]);
      }
    }
  }, [selectedFile]);

  const renderContent = () => {
    if (!selectedFile?.content) return null;

    const lines = selectedFile.content.split("\n");
    const debugInfo = selectedFile.debugInfo?.[selectedPlugin || ""] as ComplexityDebug | undefined;
    const patterns = debugInfo?.patterns || [];

    return (
      <div className="h-full">
        <ScrollArea className="h-full">
          <SyntaxHighlighter
            language={selectedFile.language || "plaintext"}
            style={oneLight}
            wrapLines={true}
            showLineNumbers={true}
            lineNumberStyle={{
              minWidth: "2em",
              paddingRight: "1em",
              color: "#999",
              userSelect: "none",
            }}
            lineProps={(lineNumber) => {
              const isHighlightedLine = highlightedLine === lineNumber;
              const hasPattern = patterns.some(
                (pattern: ComplexityPattern) =>
                  pattern.lines.includes(lineNumber) && lines[lineNumber - 1].match(new RegExp(pattern.regex, "g")),
              );
              const isSelectedPattern =
                selectedPattern?.lines.includes(lineNumber) &&
                lines[lineNumber - 1].match(new RegExp(selectedPattern.regex, "g"));

              return {
                style: {
                  display: "block",
                  backgroundColor: isHighlightedLine
                    ? "rgba(200, 200, 200, 0.2)"
                    : isSelectedPattern
                      ? "rgba(255, 217, 0, 0.2)" // brighter yellow for selected pattern
                      : hasPattern
                        ? "rgba(255, 255, 0, 0.1)" // subtle yellow for other patterns
                        : undefined,
                },
              };
            }}
            customStyle={{
              margin: 0,
              padding: "1em",
              background: "transparent",
              fontSize: "14px",
              lineHeight: "1.5",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            {selectedFile.content}
          </SyntaxHighlighter>
        </ScrollArea>
      </div>
    );
  };

  const renderDebug = () => {
    if (!selectedPlugin || !selectedFile?.debugInfo || !selectedFile.debugInfo[selectedPlugin]) {
      return <div>No debug information available for this plugin</div>;
    }

    const debugInfo = selectedFile.debugInfo[selectedPlugin];

    return (
      <div className="space-y-6">
        {Object.entries(debugInfo).map(([category, patterns]) => {
          if (!Array.isArray(patterns)) return null;

          return (
            <div key={category} className="debug-section">
              <h3 className="text-lg font-medium mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patterns.map((pattern: ComplexityPattern) => (
                  <Card
                    key={`${pattern.name}-${pattern.regex}`}
                    className={`debug-pattern cursor-pointer transition-colors ${
                      selectedPattern?.regex === pattern.regex ? "ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">{pattern.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4">
                      {pattern.matches.map((match: string, idx: number) => (
                        <div
                          key={`${pattern.regex}-${pattern.lines[idx]}-${match}`}
                          className="debug-match p-2 bg-muted rounded-md cursor-pointer hover:bg-muted-foreground/10"
                          onClick={() => {
                            setActiveTab("content");
                            setHighlightedLine(pattern.lines[idx]);
                            setSelectedPattern(pattern);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setActiveTab("content");
                              setHighlightedLine(pattern.lines[idx]);
                              setSelectedPattern(pattern);
                            }
                          }}
                        >
                          <div className="text-xs text-muted-foreground">Line {pattern.lines[idx]}</div>
                          <pre className="text-xs mt-1 overflow-x-auto">
                            <code>{match}</code>
                          </pre>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!selectedFile) {
    return <div className="h-full flex items-center justify-center">Select a file to view details</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-visible">
      <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="flex-1 flex flex-col">
        <div className="flex justify-between items-start pr-6 gap-2">
          <GlassmorphicContainer className="flex-1 mt-1 h-9 flex items-start justify-center pl-2 rounded-full">
            <h2 className="text-lg font-bold pl-2 text-black">{selectedFile.name}</h2>
          </GlassmorphicContainer>
          <ScrollArea>
            <TabsList className="relative h-auto w-full gap-0.5 bg-transparent p-0 ">
              <TabsTrigger
                value="content"
                className="overflow-hidden h-12 rounded-t-xl rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
              >
                <Code className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                Content
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="overflow-hidden h-12 rounded-t-xl rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
              >
                <ListCollapse className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                Details
              </TabsTrigger>
              <TabsTrigger
                value="debug"
                className="overflow-hidden h-12 rounded-t-xl rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
              >
                <Bug className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                Debug
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <GlassmorphicContainer className="flex-1 overflow-hidden">
          <TabsContent value="details" className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(selectedFile.metrics || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Language</TableCell>
                  <TableCell>{selectedFile.language || "Unknown"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="content" className="h-full">
            {renderContent()}
          </TabsContent>
          <TabsContent value="debug" className="h-full overflow-auto p-4">
            <div className="mb-4">
              <Label className="mb-2 block">Select Plugin</Label>
              <Select value={selectedPlugin || ""} onValueChange={setSelectedPlugin}>
                <SelectTrigger className="transparent-select">
                  <SelectValue placeholder="Select a plugin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(selectedFile.debugInfo || {}).map((plugin) => (
                    <SelectItem key={plugin} value={plugin}>
                      {plugin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderDebug()}
          </TabsContent>
        </GlassmorphicContainer>
      </Tabs>
    </div>
  );
}
