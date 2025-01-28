import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import type { FileObject } from "mega-parser";
import { useState } from "react";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const { addProject, setAnalysisResults, setCurrentProject } = useStore();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await file.text();
      const analysisData = JSON.parse(content) as FileObject[];

      const newProjectId = addProject(file.name.replace(/\.[^/.]+$/, ""));
      setAnalysisResults(analysisData);
      setCurrentProject(newProjectId);

      onOpenChange(false);
      toast({
        title: "Upload successful",
        description: "Your analysis file has been uploaded and processed.",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Upload failed",
        description: `There was an error processing your file: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Analysis File</DialogTitle>
          <DialogDescription>Import an existing analysis file to create a new project.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="analysis-file">Select File</Label>
            <Input id="analysis-file" type="file" accept=".json" onChange={handleFileChange} />
          </div>
          <Button onClick={handleUpload} disabled={!file}>
            Upload and Process
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
