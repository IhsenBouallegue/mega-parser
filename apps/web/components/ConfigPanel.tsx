import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConfigPanelProps {
  collapsed: boolean;
}

export default function ConfigPanel({ collapsed }: ConfigPanelProps) {
  return (
    <div className={`bg-background border-l h-full ${collapsed ? "w-12" : "w-full"}`}>
      <ScrollArea className="h-full">
        <div className="p-4">
          <h2 className="font-semibold mb-4">Configuration</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Metrics</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="rloc" />
                  <Label htmlFor="rloc">RLOC</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="complexity" />
                  <Label htmlFor="complexity">Sonar Complexity</Label>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Export Format</h3>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">SimpleJSON</SelectItem>
                  <SelectItem value="codecharta">CodeCharta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Ignore Patterns</h3>
              <Input placeholder="e.g., *.test.js,*.spec.js" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="debug" />
              <Label htmlFor="debug">Debug Mode</Label>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
