import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FileObject } from "mega-parser";

interface AnalysisResultsProps {
  file: FileObject | null;
}

export default function AnalysisResults({ file }: AnalysisResultsProps) {
  if (!file) {
    return <div>Select a file to view analysis results.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{file.name} Analysis Results</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(file.metrics).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>Language</TableCell>
            <TableCell>{file.language}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
