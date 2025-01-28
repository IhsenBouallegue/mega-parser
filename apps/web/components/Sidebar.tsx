"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store/useStore";
import Fuse from "fuse.js";
import { ChevronRight, File, Folder, Search } from "lucide-react";
import type { FileObject } from "mega-parser";
import { useEffect, useState } from "react";

interface SidebarProps {
  collapsed: boolean;
}

interface FileTreeItem {
  name: string;
  type: "file" | "folder";
  path?: string;
  language?: string;
  children?: FileTreeItem[];
}

function buildFileTree(files: FileObject[]): FileTreeItem[] {
  if (!files || files.length === 0) {
    return [];
  }

  const root: FileTreeItem = { name: "root", type: "folder", children: [] };

  for (const file of files) {
    if (!file.path) {
      continue;
    }

    const parts = file.path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      let existingItem = currentLevel.children?.find((item) => item.name === part);

      if (!existingItem) {
        const newItem: FileTreeItem = {
          name: part,
          type: isLastPart ? "file" : "folder",
          path: isLastPart ? file.path : undefined,
          language: isLastPart ? file.language : undefined,
          children: isLastPart ? undefined : [],
        };
        currentLevel.children = currentLevel.children || [];
        currentLevel.children.push(newItem);
        existingItem = newItem;
      }

      if (!isLastPart) {
        currentLevel = existingItem;
      }
    });
  }

  // Sort children recursively, putting folders before files
  const sortChildren = (items: FileTreeItem[]) => {
    items.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });

    for (const item of items) {
      if (item.children) {
        sortChildren(item.children);
      }
    }
  };

  if (root.children) {
    sortChildren(root.children);
  }

  return root.children || [];
}

function FileTreeItem({
  item,
  depth = 0,
  searchTerm = "",
  searchResults = new Set(),
}: {
  item: FileTreeItem;
  depth?: number;
  searchTerm?: string;
  searchResults?: Set<string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedFile, projects, currentProjectId } = useStore();

  useEffect(() => {
    if (searchTerm && item.type === "folder") {
      const hasMatchingChild = item.children?.some(
        (child) =>
          searchResults.has(child.path || "") ||
          (child.type === "folder" && child.children?.some((grandChild) => searchResults.has(grandChild.path || ""))),
      );
      setIsOpen(hasMatchingChild || false);
    }
  }, [searchTerm, item, searchResults]);

  const handleSelect = () => {
    if (item.type === "folder") {
      setIsOpen(!isOpen);
    } else if (item.path) {
      try {
        const currentProject = projects.find((p) => p.id === currentProjectId);
        const fileObject = currentProject?.analysisResults.find((f) => f.path === item.path);
        if (fileObject) {
          setSelectedFile(fileObject);
        } else {
          console.error("File not found in analysis results");
        }
      } catch (error) {
        console.error("Error selecting file:", error);
      }
    }
  };

  const isVisible = !searchTerm || searchResults.has(item.path || "") || item.type === "folder";

  if (!isVisible) return null;

  return (
    <div className="text-sm">
      <Button variant="ghost" className="w-full justify-start px-2 py-1 h-auto" onClick={handleSelect}>
        <div style={{ paddingLeft: `${depth * 12}px` }} className="flex items-center w-full">
          {item.type === "folder" && (
            <ChevronRight className={`mr-1 h-3 w-3 flex-shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
          )}
          {item.type === "file" ? (
            <File className="mr-1 h-3 w-3 flex-shrink-0" />
          ) : (
            <Folder className="mr-1 h-3 w-3 flex-shrink-0" />
          )}
          <span className="truncate text-xs">{item.name}</span>
        </div>
      </Button>
      {isOpen && item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              depth={depth + 1}
              searchTerm={searchTerm}
              searchResults={searchResults}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { projects, currentProjectId } = useStore();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(new Set<string>());

  useEffect(() => {
    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (currentProject) {
      const tree = buildFileTree(currentProject.analysisResults);
      setFileTree(tree);
    } else {
      setFileTree([]);
    }
  }, [projects, currentProjectId]);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(new Set());
      return;
    }

    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (!currentProject) return;

    const fuse = new Fuse(currentProject.analysisResults, {
      keys: ["name", "path"],
      threshold: 0.4,
      ignoreLocation: true,
      useExtendedSearch: true,
    });

    const results = fuse.search(searchTerm);
    setSearchResults(new Set(results.map((result) => (result.item as FileObject).path)));
  }, [searchTerm, projects, currentProjectId]);

  return (
    <div className={`h-full ${collapsed ? "w-12" : "w-full"} flex flex-col`}>
      <div className="px-2 mt-2 flex-shrink-0">
        <div className="relative">
          <Input className="peer bg-transparent border-none pe-9 ps-9" placeholder="Search..." type="search" />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Search size={16} strokeWidth={2} />
          </div>
        </div>
      </div>
      <ScrollArea className="flex-grow h-[calc(100vh-300px)]">
        <div className="p-2">
          {fileTree.length > 0 ? (
            fileTree.map((item) => (
              <FileTreeItem key={item.name} item={item} searchTerm={searchTerm} searchResults={searchResults} />
            ))
          ) : (
            <div>No files to display</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
