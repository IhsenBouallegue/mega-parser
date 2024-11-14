import "./style.css";

// src/main.ts
import { MegaParser } from ".";

document.getElementById("runButton")?.addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  const files = fileInput.files;

  if (!files) {
    alert("No files selected");
    return;
  }

  const requestedMetrics: string[] = [];
  if (
    (document.getElementById("metricRealLinesOfCode") as HTMLInputElement)
      .checked
  ) {
    requestedMetrics.push("realLinesOfCode");
  }
  if (
    (document.getElementById("metricSonarComplexity") as HTMLInputElement)
      .checked
  ) {
    requestedMetrics.push("sonarComplexity");
  }

  const parser = new MegaParser(files, requestedMetrics);
  parser.run();
});
