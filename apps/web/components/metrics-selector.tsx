import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { MetricPluginEnum } from "mega-parser";

interface MetricsSelectorProps {
  metrics: Record<MetricPluginEnum, boolean>;
  onMetricChange: (metric: MetricPluginEnum) => void;
}

export function MetricsSelector({ metrics, onMetricChange }: MetricsSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Metrics</CardTitle>
        <CardDescription>Choose the metrics you want to analyze</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(metrics).map(([metric, isChecked]) => (
          <div key={metric} className="flex items-center space-x-2">
            <Checkbox
              id={`metric${metric}`}
              checked={isChecked}
              onCheckedChange={() => onMetricChange(metric as MetricPluginEnum)}
            />
            <Label
              htmlFor={`metric${metric}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {metric}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
