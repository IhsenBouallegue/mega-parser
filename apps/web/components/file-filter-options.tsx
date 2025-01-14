import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye } from "lucide-react";

interface FileFilterOptionsProps {
  useGitignore: boolean;
  onUseGitignoreChange: (value: boolean) => void;
  excludePatterns: string;
  onExcludePatternsChange: (value: string) => void;
  ignoreRules: string[];
}

export function FileFilterOptions({
  useGitignore,
  onUseGitignoreChange,
  excludePatterns,
  onExcludePatternsChange,
  ignoreRules,
}: FileFilterOptionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>File Filtering Options</CardTitle>
        <CardDescription>Configure which files to include in the analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useGitignore"
              checked={useGitignore}
              onCheckedChange={(checked) => onUseGitignoreChange(checked as boolean)}
            />
            <Label
              htmlFor="useGitignore"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Respect .gitignore rules
            </Label>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Preview Rules
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Active Ignore Rules</DialogTitle>
                <DialogDescription>
                  These are all the active ignore rules, including .gitignore rules and custom exclude patterns
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <pre className="text-sm">
                  {ignoreRules.length > 0 ? ignoreRules.join("\n") : "No active ignore rules"}
                </pre>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid w-full gap-1.5">
          <Label htmlFor="excludePatterns">Exclude Patterns</Label>
          <Input
            id="excludePatterns"
            placeholder="e.g., **/test/**,**/*.test.*"
            value={excludePatterns}
            onChange={(e) => onExcludePatternsChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated glob patterns to exclude (e.g., **/test/**,**/*.test.*)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
