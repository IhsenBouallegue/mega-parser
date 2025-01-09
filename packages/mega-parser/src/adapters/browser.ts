import type { FileInput } from "@/types";

export async function createFileInputFromBrowser(files: FileList): Promise<FileInput[]> {
  const fileInputs: FileInput[] = [];

  for (const file of Array.from(files)) {
    const content = await readFileContent(file);
    fileInputs.push({
      path: (file as any).webkitRelativePath || file.name,
      name: file.name,
      content,
      size: file.size,
    });
  }

  return fileInputs;
}

function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error(`Timeout reading file ${file.name}`));
    }, 30000);

    reader.onload = (e) => {
      clearTimeout(timeout);
      resolve(e.target?.result as string);
    };

    reader.onerror = (e) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to read file ${file.name}: ${e.target?.error?.message || "Unknown error"}`));
    };

    reader.readAsText(file);
  });
}
