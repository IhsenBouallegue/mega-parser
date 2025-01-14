#!/usr/bin/env bun
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import prompts from "prompts";
import { DockerManager } from "./docker.js";
import { SonarManager } from "./sonar.js";
import { AnalysisStep, type SonarConfig } from "./types.js";

const DEFAULT_CONFIG: SonarConfig = {
  projectKey: "maibornwolff-gmbh_codecharta_visualization",
  projectName: "CodeCharta Visualization",
  newPassword: "newadminpassword",
  projectBaseDir: path.resolve(process.cwd(), "../visualization"),
  hostSonarUrl: "http://localhost:9000",
  containerSonarUrl: "http://sonarqube:9000",
  defaultUser: "admin",
  defaultPassword: "admin",
  tokenName: "codecharta_token",
  token: "",
  networkName: "sonarnet",
  containerName: "sonarqube",
  timeoutPeriod: 120000,
};

const program = new Command();

program
  .name("sonar-analysis")
  .description("Automated SonarQube and CodeCharta analysis tool")
  .version("1.0.0")
  .option("-k, --project-key <key>", "Project key for SonarQube")
  .option("-n, --project-name <name>", "Project name for SonarQube")
  .option("-p, --password <password>", "New SonarQube admin password")
  .option("-d, --directory <path>", "Directory containing the project to be scanned")
  .option("-u, --url <url>", "SonarQube host URL")
  .option("-t, --token-name <name>", "SonarQube token name")
  .option("-s, --skip-prompts", "Skip all prompts and use default values")
  .option("-h, --help", "Show help message");

async function promptForConfig(config: SonarConfig): Promise<boolean> {
  const response = await prompts(
    [
      {
        type: "text",
        name: "projectKey",
        message: "🔑 Enter the Project Key:",
        initial: config.projectKey,
      },
      {
        type: "text",
        name: "projectName",
        message: "📛 Enter the Project Name:",
        initial: config.projectName,
      },
      {
        type: "password",
        name: "newPassword",
        message: "🔒 Enter the new password for the SonarQube admin user:",
        initial: config.newPassword,
      },
      {
        type: "text",
        name: "projectBaseDir",
        message: "📁 Enter the directory path to be scanned:",
        initial: config.projectBaseDir,
      },
    ],
    {
      onCancel: () => {
        console.log(chalk.yellow("\n🚫 Configuration cancelled by user"));
        return false;
      },
    },
  );

  // Check if any response was received
  if (Object.keys(response).length === 0) {
    return false;
  }

  Object.assign(config, response);
  return true;
}

async function selectSteps(): Promise<AnalysisStep[] | null> {
  const steps = Object.values(AnalysisStep);
  const { selectedSteps } = await prompts(
    {
      type: "multiselect",
      name: "selectedSteps",
      message: "✨ Select steps to run:",
      choices: steps.map((step) => ({ title: step, value: step })),
      min: 1,
      instructions: false,
      hint: "- Space to select, Enter to confirm",
    },
    {
      onCancel: () => {
        console.log(chalk.yellow("\n🚫 Step selection cancelled by user"));
        return null;
      },
    },
  );

  if (!selectedSteps || selectedSteps.length === 0) {
    console.log(chalk.yellow("\n⚠️ No steps were selected"));
    return null;
  }

  return selectedSteps;
}

async function run() {
  try {
    console.log(chalk.cyan("🔧 Welcome to the SonarQube & CodeCharta Automation Tool 🔧"));
    console.log(chalk.cyan("------------------------------------------------------------"));
    console.log(chalk.cyan("This tool automates:"));
    console.log(chalk.cyan("1. 🚀 Setting up a SonarQube project"));
    console.log(chalk.cyan("2. 🔍 Running SonarScanner for code analysis"));
    console.log(chalk.cyan("3. 📊 Conducting CodeCharta visualization"));
    console.log(chalk.cyan("------------------------------------------------------------"));

    // Initialize Docker manager early for dependency checks
    const docker = new DockerManager({
      networkName: DEFAULT_CONFIG.networkName,
      containerName: DEFAULT_CONFIG.containerName,
    });

    // Check Docker and dependencies first
    console.log(chalk.blue("🔍 Checking dependencies..."));

    try {
      await docker.checkDockerSetup();
    } catch (error) {
      // Error message already shown by Docker manager
      process.exit(1);
    }

    const options = program.opts();
    const config: SonarConfig = { ...DEFAULT_CONFIG };

    // Override config with command line options
    if (options.projectKey) config.projectKey = options.projectKey;
    if (options.projectName) config.projectName = options.projectName;
    if (options.password) config.newPassword = options.password;
    if (options.directory) config.projectBaseDir = path.resolve(options.directory);
    if (options.url) config.hostSonarUrl = options.url;
    if (options.tokenName) config.tokenName = options.tokenName;

    // Prompt for configuration if not skipping
    if (!options.skipPrompts) {
      const configConfirmed = await promptForConfig(config);
      if (!configConfirmed) {
        console.error(chalk.red("❌ Configuration was not completed"));
        process.exit(1);
      }
    }

    // Recreate Docker manager with final config
    const dockerManager = new DockerManager({
      networkName: config.networkName,
      containerName: config.containerName,
    });

    const sonar = new SonarManager(config);

    // Select steps to run
    const steps = options.skipPrompts ? Object.values(AnalysisStep) : await selectSteps();

    if (!steps) {
      console.error(chalk.red("❌ No steps were selected"));
      process.exit(1);
    }

    console.log(chalk.blue("🚀 Starting selected steps..."));

    // Execute selected steps
    for (const step of steps) {
      console.log(chalk.blue(`▶️ Starting step: ${step}`));
      try {
        switch (step) {
          case AnalysisStep.EnsureSonarQubeRunning: {
            await dockerManager.ensureNetworkExists();
            const status = await dockerManager.getContainerStatus();
            if (status.exists) {
              if (!status.running) await dockerManager.startContainer();
            } else {
              await dockerManager.runSonarQubeContainer();
            }
            await sonar.waitForSonarQubeReady();
            break;
          }

          case AnalysisStep.ResetSonarQubePassword:
            await sonar.resetPassword();
            break;

          case AnalysisStep.CleanUpPreviousProject:
            await sonar.cleanupProject();
            break;

          case AnalysisStep.RevokeToken:
            await sonar.revokeToken();
            break;

          case AnalysisStep.CreateProjectAndGenerateToken:
            await sonar.createProject();
            config.token = await sonar.generateToken();
            break;

          case AnalysisStep.RunSonarScanner:
            await dockerManager.runSonarScanner({
              projectBaseDir: config.projectBaseDir,
              token: config.token,
              containerSonarUrl: config.containerSonarUrl,
            });
            await sonar.waitForAnalysisComplete();
            break;

          case AnalysisStep.RunCodeChartaAnalysis:
            await dockerManager.runCodeChartaAnalysis({
              projectBaseDir: config.projectBaseDir,
              projectKey: config.projectKey,
              token: config.token,
              containerSonarUrl: config.containerSonarUrl,
            });
            break;

          case AnalysisStep.FinalCleanup:
            await dockerManager.cleanup();
            break;
        }
        console.log(chalk.green(`✅ Completed step: ${step}`));
      } catch (error) {
        console.error(chalk.red(`❌ Error in step ${step}:`));
        if (error instanceof Error) {
          console.error(chalk.red(`Details: ${error.message}`));
          if (error.stack) {
            console.error(chalk.gray(error.stack));
          }
        } else {
          console.error(chalk.red("An unknown error occurred"));
        }
        process.exit(1); // Exit on any step failure
      }
    }

    // Print reusable command
    const command = [
      "sonar-analysis",
      `-k "${config.projectKey}"`,
      `-n "${config.projectName}"`,
      `-p "${config.newPassword}"`,
      `-d "${config.projectBaseDir}"`,
      `-u "${config.hostSonarUrl}"`,
      `-t "${config.tokenName}"`,
      "-s",
    ].join(" ");

    console.log(chalk.yellow("💡 To run this analysis again with the same configuration:"));
    console.log(chalk.cyan(command));
  } catch (error) {
    console.error(chalk.red("❌ Error:"), error instanceof Error ? error.message : "An unknown error occurred");
    process.exit(1);
  }
}

program.action(run);
program.parse();
