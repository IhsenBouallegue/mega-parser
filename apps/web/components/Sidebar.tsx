"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store/useStore";
import { ChevronRight, File, Folder, Search, X } from "lucide-react";
import type { FileObject } from "mega-parser";
import { useEffect, useState } from "react";

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
    let currentPath = "";

    for (const [index, part] of parts.entries()) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = index === parts.length - 1;
      let existingItem = currentLevel.children?.find(
        (item) => item.name === part && item.type === (isLastPart ? "file" : "folder"),
      );

      if (!existingItem) {
        const newItem: FileTreeItem = {
          name: part,
          type: isLastPart ? "file" : "folder",
          path: currentPath, // Always store the full path
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
    }
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

function highlightMatch(text: string, searchTerm: string): JSX.Element {
  if (!searchTerm) return <>{text}</>;

  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  const index = normalizedText.indexOf(normalizedSearch);

  if (index === -1) {
    return <>{text}</>;
  }

  return (
    <>
      {text.slice(0, index)}
      <span className="bg-yellow-200 font-medium">{text.slice(index, index + searchTerm.length)}</span>
      {text.slice(index + searchTerm.length)}
    </>
  );
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
    // Auto-expand folders when searching
    if (searchTerm) {
      const shouldBeOpen =
        item.type === "folder" &&
        (searchResults.has(item.path || "") || // Folder itself matches
          item.children?.some(
            (
              child, // Any child matches
            ) => searchResults.has(child.path || "") || child.name.toLowerCase().includes(searchTerm.toLowerCase()),
          ));
      setIsOpen(shouldBeOpen || false);
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
        }
      } catch (error) {
        console.error("Error selecting file:", error);
      }
    }
  };

  const isVisible =
    !searchTerm ||
    searchResults.has(item.path || "") ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type === "folder" &&
      item.children?.some(
        (child) => searchResults.has(child.path || "") || child.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ));

  if (!isVisible) return null;

  const isHighlighted =
    searchTerm && (searchResults.has(item.path || "") || item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="text-sm">
      <Button
        type="button"
        variant="ghost"
        className={`w-full justify-start px-2 py-1 h-auto ${isHighlighted ? "bg-yellow-100 hover:bg-yellow-200" : ""}`}
        onClick={handleSelect}
      >
        <div style={{ paddingLeft: `${depth * 12}px` }} className="flex items-center w-full">
          {item.type === "folder" && (
            <ChevronRight className={`mr-1 h-3 w-3 flex-shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
          )}
          {item.type === "file" ? (
            <File className="mr-1 h-3 w-3 flex-shrink-0" />
          ) : (
            <Folder className="mr-1 h-3 w-3 flex-shrink-0" />
          )}
          <span className="truncate text-xs">{highlightMatch(item.name, searchTerm)}</span>
        </div>
      </Button>
      {isOpen && item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path || `folder-${child.name}-${child.type}-${Math.random()}`}
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
    if (!searchTerm.trim()) {
      setSearchResults(new Set());
      return;
    }

    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (!currentProject) return;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    const paths = new Set<string>();

    // Simple substring search in filenames
    for (const file of currentProject.analysisResults) {
      if (!file.path) continue;

      const fileName = file.name.toLowerCase();

      // Check if filename contains the search term
      if (fileName.includes(normalizedSearch)) {
        paths.add(file.path);
        // Add parent folders to keep the tree structure visible
        let currentPath = "";
        for (const part of file.path.split("/")) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          paths.add(currentPath);
        }
      }
    }

    setSearchResults(paths);
  }, [searchTerm, projects, currentProjectId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`h-full ${collapsed ? "w-12" : "w-full"} flex flex-col`}>
      <div className="px-2 mt-2 flex-shrink-0">
        <div className="relative">
          <Input
            className="peer bg-transparent border-none pe-9 ps-9 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
            placeholder="Search..."
            type="search"
            value={searchTerm}
            onChange={handleSearch}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Search size={16} strokeWidth={2} />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 hover:text-muted-foreground"
            >
              <span className="sr-only">Clear search</span>
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-grow h-[calc(100vh-300px)]">
        <div className="p-2">
          {fileTree.length > 0 ? (
            fileTree.map((item) => (
              <FileTreeItem
                key={item.path || `folder-${item.name}-${Math.random()}`}
                item={item}
                searchTerm={searchTerm}
                searchResults={searchResults}
              />
            ))
          ) : (
            <div>No files to display</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
