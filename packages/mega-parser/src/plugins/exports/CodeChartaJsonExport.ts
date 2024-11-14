import { type CodeMapNode, type Edge, NodeType } from "@/types/CodeCharta";
import type { IExportPlugin } from "./IExportPlugin";

interface ExportCCFile {
  projectName: string;
  apiVersion: string;
  nodes: CodeMapNode[];
  edges: Edge[];
  attributeTypes: {
    nodes: { [key: string]: "absolute" | "relative" };
    edges: { [key: string]: "absolute" | "relative" };
  };
}

interface ParsedFile {
  path: string;
  metrics: { [key: string]: number };
}

interface ParsedFile {
  path: string;
  metrics: { [key: string]: number };
}

export class CodeChartaJsonExport implements IExportPlugin {
  name = "codeChartaJson";
  supportedExtensions = ["cc.json"];

  export(data: ParsedFile[]): string {
    // Build the hierarchical tree
    const rootNode: CodeMapNode = {
      name: "root",
      type: NodeType.FOLDER,
      attributes: {},
      children: [],
    };

    for (const file of data) {
      this.addFileToTree(rootNode, file);
    }

    // Collect attribute types
    const nodeAttributeTypes: { [key: string]: "absolute" | "relative" } = {};
    if (data.length > 0) {
      for (const metricName of Object.keys(data[0].metrics)) {
        nodeAttributeTypes[metricName] = "absolute";
      }
    }

    const exportCCFile: ExportCCFile = {
      projectName: "MegaParser Project",
      apiVersion: "1.0",
      nodes: [rootNode],
      edges: [],
      attributeTypes: {
        nodes: nodeAttributeTypes,
        edges: {},
      },
    };

    return JSON.stringify(exportCCFile, null, 2);
  }

  private addFileToTree(rootNode: CodeMapNode, file: ParsedFile) {
    const pathParts = file.path.split("/").filter((part) => part.length > 0);
    let currentNode = rootNode;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      let childNode = currentNode.children?.find(
        (child) => child.name === part,
      );

      if (!childNode) {
        childNode = {
          name: part,
          type: i === pathParts.length - 1 ? NodeType.FILE : NodeType.FOLDER,
          attributes: {},
          children: [],
        };
        currentNode.children?.push(childNode);
      }

      currentNode = childNode;
    }

    // Assign attributes if it's a file node
    if (currentNode.type === "File") {
      currentNode.attributes = file.metrics;
    }
  }
}
