import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import type { ExportPluginEnum, FileObject } from "mega-parser";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

interface OutputViewerProps {
  rawOutput: FileObject[] | undefined;
  exportOutputs: Record<ExportPluginEnum, string>;
  exporters: ExportPluginEnum[];
  onExportDownload: (exporter: ExportPluginEnum) => void;
}

export function OutputViewer({ rawOutput, exportOutputs, exporters, onExportDownload }: OutputViewerProps) {
  if (!rawOutput && Object.keys(exportOutputs).length === 0) {
    return <div className="p-4 text-muted-foreground">Analysis results will appear here after running MegaParser.</div>;
  }

  return (
    <Tabs defaultValue="raw" className="w-full flex flex-col">
      <TabsList className="w-full">
        <TabsTrigger value="raw" className="flex-1">
          Raw Output
        </TabsTrigger>
        {exporters.map((exporter) => (
          <TabsTrigger key={exporter} value={exporter} className="flex-1 justify-between">
            <span>{exporter}</span>
            <div
              onClick={(e) => {
                e.preventDefault();
                onExportDownload(exporter);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onExportDownload(exporter);
                }
              }}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "cursor-pointer ml-2 h-5 w-5 p-0")}
              aria-label={`Download ${exporter} output`}
            >
              <Download className="h-4 w-4" />
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
      {rawOutput && (
        <TabsContent value="raw">
          <div className="mb-4 p-4 bg-muted rounded-md">
            <h3 className="text-lg font-semibold mb-4">Raw Output</h3>
            <ScrollArea className="flex flex-grow min-h-1 h-[80vh] rounded-lg border-2">
              <JsonView data={rawOutput} />
            </ScrollArea>
          </div>
        </TabsContent>
      )}

      {exporters.map((exporter) => (
        <TabsContent key={exporter} value={exporter}>
          <div className="mb-4 p-4 bg-muted rounded-md">
            <h3 className="text-lg font-semibold mb-4">{exporter} Output</h3>
            <ScrollArea className="flex flex-grow min-h-1 h-[80vh] rounded-lg border-2">
              {exportOutputs[exporter] ? (
                <JsonView
                  data={(() => {
                    try {
                      return JSON.parse(exportOutputs[exporter]);
                    } catch (e) {
                      return { error: "Invalid JSON output", content: exportOutputs[exporter] };
                    }
                  })()}
                />
              ) : (
                <div className="p-4 text-muted-foreground">No output available for {exporter}</div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
