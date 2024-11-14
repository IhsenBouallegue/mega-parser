import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExportPluginEnum, FileObject } from "mega-parser";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

interface OutputViewerProps {
  rawOutput: FileObject[] | undefined;
  exportOutputs: Record<ExportPluginEnum, string>;
  exporters: ExportPluginEnum[];
}

export function OutputViewer({ rawOutput, exportOutputs, exporters }: OutputViewerProps) {
  if (!rawOutput && Object.keys(exportOutputs).length === 0) {
    return <div className="p-4 text-muted-foreground">Analysis results will appear here after running MegaParser.</div>;
  }

  return (
    <Tabs defaultValue="raw" className="w-full">
      <TabsList>
        <TabsTrigger value="raw">Raw Output</TabsTrigger>
        {exporters.map((exporter) => (
          <TabsTrigger key={exporter} value={exporter}>
            {exporter}
          </TabsTrigger>
        ))}
      </TabsList>
      {rawOutput && (
        <TabsContent value="raw">
          <JsonView data={rawOutput} />
        </TabsContent>
      )}

      {exporters.map((exporter) => (
        <TabsContent key={exporter} value={exporter}>
          <JsonView data={exportOutputs[exporter]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
