#!/usr/bin/env bun
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs-extra";
import ignore, { type Ignore } from "ignore";
import { ExportPluginEnum, MegaParser, MetricPluginEnum } from "mega-parser";
import type { FileInput } from "mega-parser";
import ora from "ora";
import prompts from "prompts";

const program = new Command();

program
  .name("mega-parser")
  .description("CLI tool for analyzing code using MegaParser")
  .version("1.0.0")
  .option("-p, --path <path>", "Path to file or directory to analyze")
  .option(
    "-m, --metrics <metrics>",
    "Comma-separated list of metrics (available: RealLinesOfCode, SonarComplexity)",
    (value) => value.split(","),
  )
  .option(
    "-e, --exporters <exporters>",
    "Comma-separated list of exporters (available: SimpleJson, CodeChartaJson)",
    (value) => value.split(","),
  )
  .option("--no-ignore", "Disable .gitignore functionality")
  .option(
    "--exclude <patterns>",
    "Comma-separated list of glob patterns to exclude (e.g., '**/test/**,**/*.test.*')",
    (value) => value.split(","),
  );

async function loadGitignoreRules(basePath: string, extraExcludes: string[] = []): Promise<Ignore> {
  const ig = ignore({
    ignorecase: true,
    allowRelativePaths: false,
  });

  // Add default ignores
  ig.add(["node_modules", ".git", "dist", "build", ".cache", "coverage"]);

  // Add extra exclude patterns
  if (extraExcludes.length > 0) {
    ig.add(extraExcludes);
    console.debug(chalk.gray("Added exclude patterns:", extraExcludes.join(", ")));
  }

  // Find and load all .gitignore files from the base path up to the root
  let currentPath = basePath;
  while (currentPath !== path.parse(currentPath).root) {
    const gitignorePath = path.join(currentPath, ".gitignore");
    try {
      if (await fs.pathExists(gitignorePath)) {
        const content = await fs.readFile(gitignorePath, "utf-8");
        // Add gitignore rules
        ig.add(content);

        // Log which gitignore file we're using
        console.debug(chalk.gray(`Using .gitignore from ${gitignorePath}`));
      }
    } catch (error) {
      console.error(chalk.yellow(`Warning: Error reading .gitignore at ${gitignorePath}:`), error);
    }
    currentPath = path.dirname(currentPath);
  }

  return ig;
}

async function readFilesRecursively(
  basePath: string,
  currentPath: string,
  files: FileInput[],
  ig: Ignore,
): Promise<void> {
  try {
    const fullPath = path.join(basePath, currentPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(currentPath, entry.name);
      const entryFullPath = path.join(basePath, relativePath);
      const normalizedRelativePath = relativePath.replace(/\\/g, "/");

      // Use ignores() for simpler ignore checking
      if (ig.ignores(normalizedRelativePath)) {
        console.debug(chalk.gray(`Skipping ${normalizedRelativePath} (ignored by .gitignore rules)`));
        continue;
      }

      try {
        if (entry.isDirectory()) {
          // Add trailing slash for directories as per gitignore spec
          if (ig.ignores(`${normalizedRelativePath}/`)) {
            console.debug(chalk.gray(`Skipping directory ${normalizedRelativePath}/ (ignored by .gitignore rules)`));
            continue;
          }
          await readFilesRecursively(basePath, relativePath, files, ig);
        } else if (entry.isFile()) {
          try {
            const content = await fs.readFile(entryFullPath, "utf-8");
            const fileStats = await fs.stat(entryFullPath);
            files.push({
              name: entry.name,
              path: normalizedRelativePath,
              content,
              size: fileStats.size,
            });
          } catch (error) {
            console.error(chalk.yellow(`Warning: Could not read file ${entryFullPath}:`), error);
          }
        }
      } catch (error) {
        console.error(chalk.yellow(`Warning: Error processing entry ${entryFullPath}:`), error);
      }
    }
  } catch (error) {
    console.error(chalk.yellow(`Warning: Could not read directory ${path.join(basePath, currentPath)}:`), error);
  }
}

async function getFilesFromPath(
  inputPath: string,
  useGitignore: boolean,
  excludePatterns: string[] = [],
): Promise<FileInput[]> {
  const files: FileInput[] = [];
  const normalizedPath = path.resolve(inputPath);
  const ig = useGitignore ? await loadGitignoreRules(normalizedPath, excludePatterns) : ignore();

  if (!useGitignore && excludePatterns.length > 0) {
    ig.add(excludePatterns);
    console.debug(chalk.gray("Added exclude patterns:", excludePatterns.join(", ")));
  }

  try {
    const stats = await fs.stat(normalizedPath);

    if (stats.isFile()) {
      // For single files, don't apply gitignore rules
      try {
        const content = await fs.readFile(normalizedPath, "utf-8");
        files.push({
          name: path.basename(normalizedPath),
          path: path.basename(normalizedPath),
          content,
          size: stats.size,
        });
      } catch (error) {
        console.error(chalk.yellow(`Warning: Could not read file ${normalizedPath}:`), error);
      }
    } else if (stats.isDirectory()) {
      await readFilesRecursively(normalizedPath, "", files, ig);
    }

    if (files.length === 0) {
      console.error(chalk.yellow(`Warning: No files were found in ${normalizedPath}`));
    } else {
      console.log(chalk.green(`Successfully processed ${files.length} files`));
    }
  } catch (error) {
    console.error(chalk.yellow(`Warning: Error accessing path ${normalizedPath}:`), error);
  }

  return files;
}

async function run() {
  try {
    const options = program.opts();
    let inputPath: string;
    let selectedMetrics: MetricPluginEnum[];
    let selectedExporters: ExportPluginEnum[];
    let excludePatterns: string[] = [];
    let wasInteractive = false;

    // Get input path
    if (options.path) {
      inputPath = options.path;
    } else {
      wasInteractive = true;
      const response = await prompts({
        type: "text",
        name: "inputPath",
        message: "Enter the path to file or directory to analyze:",
        validate: (value: string) => value.length > 0 || "Path is required",
      });
      inputPath = response.inputPath;
    }

    const normalizedPath = path.resolve(inputPath);

    // Validate path exists
    try {
      const exists = await fs.pathExists(normalizedPath);
      if (!exists) {
        console.error(chalk.red(`Error: Path ${normalizedPath} does not exist`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error checking path: ${normalizedPath}`), error);
      process.exit(1);
    }

    // Get exclude patterns
    if (options.exclude) {
      excludePatterns = options.exclude;
    } else if (!options.path) {
      // Only prompt for exclude patterns in interactive mode
      wasInteractive = true;
      const response = await prompts({
        type: "text",
        name: "excludePatterns",
        message: "Enter patterns to exclude (comma-separated, e.g., **/test/**,**/*.test.*) or press Enter to skip:",
      });
      if (response.excludePatterns) {
        excludePatterns = response.excludePatterns.split(",").map((p: string) => p.trim());
      }
    }

    // Get files
    const spinner = ora("Reading files...").start();
    const files = await getFilesFromPath(normalizedPath, options.ignore !== false, excludePatterns);

    if (files.length === 0) {
      spinner.fail("No files found or error reading files");
      process.exit(1);
    }

    spinner.succeed(`Found ${files.length} files`);

    // Get metrics
    if (options.metrics) {
      selectedMetrics = options.metrics.map((m: string) => {
        const metric = m.trim() as MetricPluginEnum;
        if (!Object.values(MetricPluginEnum).includes(metric)) {
          console.error(chalk.red(`Invalid metric: ${metric}`));
          process.exit(1);
        }
        return metric;
      });
    } else {
      wasInteractive = true;
      const response = await prompts({
        type: "multiselect",
        name: "selectedMetrics",
        message: "Select metrics to analyze:",
        choices: [
          { title: "Real Lines of Code", value: MetricPluginEnum.RealLinesOfCode },
          { title: "Sonar Complexity", value: MetricPluginEnum.SonarComplexity },
        ],
        min: 1,
      });
      selectedMetrics = response.selectedMetrics;
    }

    // Get exporters
    if (options.exporters) {
      selectedExporters = options.exporters.map((e: string) => {
        const exporter = e.trim() as ExportPluginEnum;
        if (!Object.values(ExportPluginEnum).includes(exporter)) {
          console.error(chalk.red(`Invalid exporter: ${exporter}`));
          process.exit(1);
        }
        return exporter;
      });
    } else {
      wasInteractive = true;
      const response = await prompts({
        type: "multiselect",
        name: "selectedExporters",
        message: "Select export formats:",
        choices: [
          { title: "Simple JSON", value: ExportPluginEnum.SimpleJson },
          { title: "CodeCharta JSON", value: ExportPluginEnum.CodeChartaJson },
        ],
        min: 1,
      });
      selectedExporters = response.selectedExporters;
    }

    // Initialize and run MegaParser
    spinner.start("Analyzing files...");
    const megaParser = new MegaParser(files);
    megaParser.setMetricPlugins(selectedMetrics);
    megaParser.setExportPlugins(selectedExporters);

    await megaParser.run();
    spinner.succeed("Analysis complete");

    // Display results
    console.log(`\n${chalk.bold("Results:")}`);
    for (const file of megaParser.rawOutputData) {
      console.log(chalk.cyan(`\nFile: ${file.path}`));
      console.log("Metrics:");
      for (const [metric, value] of Object.entries(file.metrics)) {
        console.log(`  ${metric}: ${value}`);
      }
    }

    // Save exports
    for (const exporter of selectedExporters) {
      const output = megaParser.getExportOutput(exporter);
      if (output) {
        const filename = `megaparser-${exporter.toLowerCase()}-output.json`;
        await fs.writeFile(filename, output);
        console.log(chalk.green(`\nExported ${filename}`));
      }
    }

    // Show equivalent command if we used interactive mode
    if (wasInteractive) {
      const command = [
        "bun run dev",
        `--path "${inputPath}"`,
        `--metrics ${selectedMetrics.join(",")}`,
        `--exporters ${selectedExporters.join(",")}`,
      ];

      if (excludePatterns.length > 0) {
        command.push(`--exclude "${excludePatterns.join(",")}"`);
      }

      console.log(chalk.yellow("\nTo skip prompts next time, use this command:"));
      console.log(chalk.cyan(command.join(" ")));
    }
  } catch (error) {
    console.error(chalk.red("\nError:"), error instanceof Error ? error.message : "An unknown error occurred");
    process.exit(1);
  }
}

program.action(run);
program.parse();
