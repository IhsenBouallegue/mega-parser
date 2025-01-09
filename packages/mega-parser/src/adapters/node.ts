import { readFileSync } from "fs";
import { resolve } from "path";
import type { FileInput } from "@/types";

export function createFileInputFromPath(paths: string[]): FileInput[] {
  return paths.map((path) => {
    const resolvedPath = resolve(path);
    const content = readFileSync(resolvedPath, "utf-8");
    const stats = statSync(resolvedPath);

    return {
      path: resolvedPath,
      name: basename(resolvedPath),
      content,
      size: stats.size,
    };
  });
}
