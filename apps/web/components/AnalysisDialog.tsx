import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FileObject } from "mega-parser";
import { useState } from "react";

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalysisComplete: (results: FileObject[]) => void;
}

export default function AnalysisDialog({ open, onOpenChange, onAnalysisComplete }: AnalysisDialogProps) {
  const [folder, setFolder] = useState("");
  const [metrics, setMetrics] = useState({ rloc: true, sonarComplexity: true });
  const [exportFormats, setExportFormats] = useState({ simpleJson: true, codeCharta: false });
  const [ignorePatterns, setIgnorePatterns] = useState("");
  const [debugMode, setDebugMode] = useState(false);

  const handleRunAnalysis = async () => {
    // Simulating analysis for new analysis
    const response = await fetch("/mega-parser-analysis.json");
    const analysisData = await response.json();
    onAnalysisComplete(analysisData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Run New Analysis</DialogTitle>
          <DialogDescription>Configure your analysis settings to start a new project analysis.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="folder">Folder</Label>
            <Input id="folder" value={folder} onChange={(e) => setFolder(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Metrics</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rloc"
                checked={metrics.rloc}
                onCheckedChange={(checked) => setMetrics({ ...metrics, rloc: checked as boolean })}
              />
              <Label htmlFor="rloc">RLOC</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sonarComplexity"
                checked={metrics.sonarComplexity}
                onCheckedChange={(checked) => setMetrics({ ...metrics, sonarComplexity: checked as boolean })}
              />
              <Label htmlFor="sonarComplexity">Sonar Complexity</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Export Formats</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="simpleJson"
                checked={exportFormats.simpleJson}
                onCheckedChange={(checked) => setExportFormats({ ...exportFormats, simpleJson: checked as boolean })}
              />
              <Label htmlFor="simpleJson">SimpleJSON</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="codeCharta"
                checked={exportFormats.codeCharta}
                onCheckedChange={(checked) => setExportFormats({ ...exportFormats, codeCharta: checked as boolean })}
              />
              <Label htmlFor="codeCharta">CodeCharta</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ignorePatterns">Ignore Patterns</Label>
            <Input
              id="ignorePatterns"
              value={ignorePatterns}
              onChange={(e) => setIgnorePatterns(e.target.value)}
              placeholder="e.g., *.test.js,*.spec.js"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="debugMode"
              checked={debugMode}
              onCheckedChange={(checked) => setDebugMode(checked as boolean)}
            />
            <Label htmlFor="debugMode">Debug Mode</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-muted-foreground cursor-help">(?)</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Debug mode provides additional information for each analyzed file, including detailed complexity
                    metrics and pattern matches.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleRunAnalysis}>
            Run Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
