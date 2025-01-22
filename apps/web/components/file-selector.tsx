import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

interface FileSelectorProps {
  onFileChange: (files: FileList | null) => void;
  onAnalysisFileUpload: (file: File) => void;
  error?: string | null;
}

export function FileSelector({ onFileChange, onAnalysisFileUpload, error }: FileSelectorProps) {
  const handleAnalysisFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAnalysisFileUpload?.(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Files or Analysis</CardTitle>
        <CardDescription>Choose files to analyze or upload a previous analysis file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <FileText className="h-6 w-6 text-primary" />
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload">Upload files for analysis</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={(e) => onFileChange(e.target.files)}
              webkitdirectory="true"
              multiple
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Upload className="h-6 w-6 text-primary" />
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="analysis-upload">Upload analysis file</Label>
            <Input
              id="analysis-upload"
              type="file"
              onChange={handleAnalysisFileChange}
              accept=".json"
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">Upload a previously generated analysis JSON file</p>
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
