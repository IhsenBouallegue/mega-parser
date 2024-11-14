import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExportPluginEnum, type ExportPluginEnum as ExporterType } from "mega-parser";

interface ExporterSelectorProps {
  exporters: ExporterType[];
  onExporterChange: (exporter: ExporterType) => void;
}

export function ExporterSelector({ exporters, onExporterChange }: ExporterSelectorProps) {
  const allExporters: ExporterType[] = [ExportPluginEnum.SimpleJson, ExportPluginEnum.CodeChartaJson];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Exporters</CardTitle>
        <CardDescription>Choose the output formats you want to generate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allExporters.map((exporter) => (
          <div key={exporter} className="flex items-center space-x-2">
            <Checkbox
              id={`exporter${exporter}`}
              checked={exporters.includes(exporter)}
              onCheckedChange={() => onExporterChange(exporter)}
            />
            <Label
              htmlFor={`exporter${exporter}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {exporter.toUpperCase()}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
