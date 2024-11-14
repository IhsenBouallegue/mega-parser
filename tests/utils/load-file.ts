import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadFile(directory: string) {
  return (fileName: string): string => {
    const filePath = join(process.cwd(), directory, fileName);

    return readFileSync(filePath, "utf-8");
  };
}
