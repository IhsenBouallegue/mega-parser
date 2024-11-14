"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Play } from "lucide-react";
import { type ExportPluginEnum, type FileObject, MegaParser, MetricPluginEnum } from "mega-parser";
import { useState } from "react";
import { ExporterSelector } from "./exporter-selector";
import { FileSelector } from "./file-selector";
import { MetricsSelector } from "./metrics-selector";
import { OutputViewer } from "./output-viewer";

export default function MegaParserUI() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [metrics, setMetrics] = useState<Record<MetricPluginEnum, boolean>>({
    [MetricPluginEnum.RealLinesOfCode]: true,
    [MetricPluginEnum.SonarComplexity]: false,
  });
  const [exporters, setExporters] = useState<ExportPluginEnum[]>([]);
  const [output, setOutput] = useState<FileObject[]>();
  const [exportOutputs, setExportOutputs] = useState<Record<ExportPluginEnum, string>>(
    () => ({}) as Record<ExportPluginEnum, string>,
  );

  const handleFileChange = (selectedFiles: FileList | null) => {
    setFiles(selectedFiles);
  };

  const handleMetricChange = (metric: MetricPluginEnum) => {
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [metric]: !prevMetrics[metric],
    }));
  };

  const handleExporterChange = (exporter: ExportPluginEnum) => {
    setExporters((prevExporters) => {
      if (prevExporters.includes(exporter)) {
        return prevExporters.filter((e) => e !== exporter);
      }
      return [...prevExporters, exporter];
    });
  };

  const runMegaParser = async () => {
    if (!files) return;

    const requestedMetrics = Object.keys(metrics).filter(
      (metric) => metrics[metric as MetricPluginEnum],
    ) as MetricPluginEnum[];

    const megaParser = new MegaParser(files);

    megaParser.setMetricPlugins(requestedMetrics);
    megaParser.setExportPlugins(exporters);

    await megaParser.run();

    const rawData = megaParser.rawOutputData;
    const exportOutputsMap = megaParser.getAllExportOutputs();

    setOutput(rawData);
    setExportOutputs(Object.fromEntries(exportOutputsMap) as Record<ExportPluginEnum, string>);
  };

  const downloadOutput = () => {
    if (!output) return;
    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "megaparser-output.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">MegaParser Dashboard</h1>
        <div className="space-y-8">
          <FileSelector onFileChange={handleFileChange} />
          <MetricsSelector metrics={metrics} onMetricChange={handleMetricChange} />
          <ExporterSelector exporters={exporters} onExporterChange={handleExporterChange} />
          <Button onClick={runMegaParser} disabled={!files || exporters.length === 0}>
            <Play className="mr-2 h-4 w-4" /> Run MegaParser
          </Button>
        </div>
      </div>

      <div className="w-1/2 bg-muted p-4 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Output Preview</h2>
        <ScrollArea className="flex-grow rounded-md border">
          <OutputViewer rawOutput={output} exportOutputs={exportOutputs} exporters={exporters} />
        </ScrollArea>
        <div className="mt-4">
          <Button onClick={downloadOutput} disabled={!output} className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download Results
          </Button>
        </div>
      </div>
    </div>
  );
}
