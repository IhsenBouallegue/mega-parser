#!/usr/bin/env bun
import path from "node:path";
import { $ } from "bun";
import chalk from "chalk";
import fs from "fs-extra";
import prompts from "prompts";

const testDir = path.resolve(__dirname, "test-files");
const outputDir = path.resolve(__dirname, "analysis-output");

async function runMegaParserAnalysis() {
  try {
    const megaParserOutput = path.join(outputDir, "mega-parser", "mega-parser-analysis");
    await fs.ensureDir(path.dirname(megaParserOutput));
    await $`cd ../cli && bun run dev --path ${testDir} --metrics RealLinesOfCode,SonarComplexity --exporters SimpleJson,CodeChartaJson --output ${megaParserOutput} --debug`;
  } catch (error) {
    console.error("Failed to analyze with mega-parser:", error);
  }
}

async function runSonarAnalysis() {
  try {
    const sonarOutputDir = path.join(outputDir, "sonar");
    await fs.ensureDir(sonarOutputDir);
    const tempOutputFile = path.join(testDir, "analysis.cc.json.gz");
    const finalOutputFile = path.join(sonarOutputDir, "analysis.cc.json.gz");

    // Run sonar analysis with temporary output file
    await $`cd ../automated-sonar-analysis && bun run dev \
      -k "mega_parser_perf" \
      -n "Mega Parser Performance Tests" \
      -d "${testDir}" \
      -f "${tempOutputFile}" \
      -s`;

    // Move the output file to the final location
    if (await fs.pathExists(tempOutputFile)) {
      console.log("Moving sonar output file to: ", finalOutputFile);
      await fs.move(tempOutputFile, finalOutputFile, { overwrite: true });
    }
  } catch (error) {
    console.error("Failed to analyze with sonar:", error);
  }
}

async function comparePerformance() {
  console.log(chalk.blue("🔍 Performance Comparison Tool"));
  console.log(chalk.gray("Test Directory:", testDir));
  console.log(chalk.gray("Output Directory:", outputDir));
  console.log("================================================");

  // Prompt for which analyzers to run
  const { selectedAnalyzers } = await prompts({
    type: "multiselect",
    name: "selectedAnalyzers",
    message: "Select analyzers to run:",
    choices: [
      { title: "Mega Parser", value: "mega-parser", selected: true },
      { title: "SonarQube", value: "sonar", selected: true },
    ],
    min: 1,
    instructions: false,
  });

  // Create output directories
  await fs.ensureDir(path.join(outputDir, "mega-parser"));
  await fs.ensureDir(path.join(outputDir, "sonar"));

  // Run selected analyzers
  if (selectedAnalyzers.includes("mega-parser")) {
    console.log(chalk.blue("\n🚀 Running Mega Parser analysis..."));
    await runMegaParserAnalysis();
  }

  if (selectedAnalyzers.includes("sonar")) {
    console.log(chalk.blue("\n🚀 Running SonarQube analysis..."));
    await runSonarAnalysis();
  }

  console.log(chalk.green("\n✨ Analysis complete!"));
}

comparePerformance().catch((error) => {
  console.error(chalk.red("\n❌ Script failed:"), error);
  process.exit(1);
});
