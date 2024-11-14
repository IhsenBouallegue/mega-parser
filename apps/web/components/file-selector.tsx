import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface FileSelectorProps {
  onFileChange: (files: FileList | null) => void;
}

export function FileSelector({ onFileChange }: FileSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Files or Directory</CardTitle>
        <CardDescription>Choose the files or directory you want to analyze</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <FileText className="h-6 w-6 text-primary" />
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload">Upload files</Label>
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
      </CardContent>
    </Card>
  );
}
