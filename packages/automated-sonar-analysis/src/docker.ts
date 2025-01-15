import path from "node:path";
import { $ } from "bun";
import chalk from "chalk";
import fs from "fs-extra";
import prompts from "prompts";
import type { DockerConfig } from "./types.js";

const REQUIRED_IMAGES = [
  "sonarsource/sonar-scanner-cli",
  "codecharta/codecharta-analysis",
  "sonarqube:community",
] as const;

interface CodeChartaOptions {
  projectBaseDir: string;
  projectKey: string;
  token: string;
  containerSonarUrl: string;
  outputFile?: string;
}

export class DockerManager {
  private config: DockerConfig;

  constructor(config: DockerConfig) {
    this.config = config;
  }

  private async isDockerRunning(): Promise<boolean> {
    try {
      const result = await $`docker info`.quiet().nothrow();

      if (result.exitCode !== 0) {
        const errorMsg = result.stderr.toString();
        if (errorMsg.includes("Cannot connect to the Docker daemon")) {
          console.error(chalk.red("\n❌ Cannot connect to Docker daemon"));
          console.error(chalk.yellow("\n💡 Please ensure Docker is installed and running:"));
          console.error(chalk.yellow("   1. Check if Docker is installed: 'docker --version'"));
          console.error(chalk.yellow("   2. On Windows/macOS: Start Docker Desktop"));
          console.error(chalk.yellow("   3. On Linux: Run 'sudo systemctl start docker'"));
          console.error(chalk.yellow("   4. Wait a few seconds for Docker to fully start"));
        } else if (errorMsg.includes("permission denied")) {
          console.error(chalk.red("\n❌ Permission denied when trying to access Docker"));
          console.error(chalk.yellow("\n💡 Please ensure you have the right permissions:"));
          console.error(chalk.yellow("   - On Linux: Add your user to the docker group:"));
          console.error(chalk.yellow("     'sudo usermod -aG docker $USER'"));
          console.error(chalk.yellow("     Then log out and back in."));
          console.error(chalk.yellow("   - On Windows: Run as Administrator"));
        } else {
          console.error(chalk.red("\n❌ Docker error:"), errorMsg);
        }
        return false;
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red("\n❌ Failed to check Docker status:"), error.message);
        if (error.message.includes("command not found")) {
          console.error(chalk.yellow("\n💡 Docker is not installed. Please install Docker:"));
          console.error(chalk.yellow("   Visit https://docs.docker.com/get-docker/"));
        }
      }
      return false;
    }
  }

  async ensureDockerRunning(): Promise<void> {
    if (!(await this.isDockerRunning())) {
      console.error(chalk.red("❌ Docker is not running."));
      console.error(chalk.yellow("\n💡 Please ensure Docker is running:"));
      console.error(chalk.yellow("   1. Check if Docker is installed: 'docker --version'"));
      console.error(chalk.yellow("   2. On Windows/macOS: Start Docker Desktop"));
      console.error(chalk.yellow("   3. On Linux: Run 'sudo systemctl start docker'"));
      console.error(chalk.yellow("   4. Wait a few seconds for Docker to fully start"));
      throw new Error("Docker daemon is not running");
    }
  }

  private async isImagePresent(image: string): Promise<boolean> {
    try {
      const result = await $`docker image inspect ${image}`.quiet().nothrow();
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  private async pullImage(image: string): Promise<void> {
    console.log(chalk.blue(`🔧 Pulling Docker image: ${image}...`));
    const result = await $`docker pull ${image}`.quiet();
    if (result.exitCode !== 0) {
      throw new Error(`Failed to pull Docker image: ${image}`);
    }
  }

  async ensureImagesExist(): Promise<void> {
    await this.ensureDockerRunning();

    const missingImages: string[] = [];
    const presentImages: string[] = [];

    // Check which images are missing
    for (const image of REQUIRED_IMAGES) {
      if (await this.isImagePresent(image)) {
        presentImages.push(image);
      } else {
        missingImages.push(image);
      }
    }

    // Log present images
    for (const image of presentImages) {
      console.log(chalk.green(`✅ Docker image '${image}' is already available locally.`));
    }

    // If no missing images, we're done
    if (missingImages.length === 0) {
      return;
    }

    // Show missing images and prompt user
    console.log(chalk.yellow("❗️ The script needs to pull the following Docker images:"));
    for (const image of missingImages) {
      console.log(chalk.yellow(`  - ${image}`));
    }

    const { shouldPull } = await prompts(
      {
        type: "confirm",
        name: "shouldPull",
        message: "Do you want to proceed with pulling these images?",
        initial: true,
      },
      {
        onCancel: () => {
          console.log(chalk.yellow("🚫 Image pulling cancelled."));
          process.exit(1);
        },
      },
    );

    if (!shouldPull) {
      console.log(chalk.yellow("🚫 Image pulling cancelled. The script cannot proceed without these images."));
      process.exit(1);
    }

    // Pull missing images
    for (const image of missingImages) {
      try {
        await this.pullImage(image);
        console.log(chalk.green(`✅ Successfully pulled ${image}`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to pull ${image}:`));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        throw error;
      }
    }
  }

  private async isDockerInstalled(): Promise<boolean> {
    try {
      const result = await $`docker --version`.quiet().nothrow();
      if (result.exitCode !== 0) {
        console.error(chalk.red("❌ Docker command failed:"));
        if (result.stderr) console.error(chalk.gray(result.stderr.toString()));
        return false;
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red("❌ Failed to check Docker installation:"));
        console.error(chalk.gray(error.message));
        if (error.message.includes("command not found") || error.message.includes("not recognized")) {
          console.error(chalk.yellow("💡 Docker is not installed. Please install Docker:"));
          console.error(chalk.yellow("   Visit https://docs.docker.com/get-docker/"));
        }
      }
      return false;
    }
  }

  private async isDockerDaemonRunning(): Promise<{ running: boolean; error?: string }> {
    try {
      const result = await $`docker info`.quiet().nothrow();
      if (result.exitCode !== 0) {
        const errorMsg = result.stderr.toString();
        let userMessage = "Docker daemon is not running. Please start Docker and try again.";

        if (errorMsg.includes("Cannot connect to the Docker daemon")) {
          userMessage = "Docker daemon is not running. Please start Docker Desktop and try again.";
        } else if (errorMsg.includes("permission denied")) {
          userMessage = "Permission denied. Please run with administrator privileges.";
        }

        return { running: false, error: userMessage };
      }
      return { running: true };
    } catch (error) {
      return {
        running: false,
        error: "Failed to check Docker daemon status. Please ensure Docker is installed and running.",
      };
    }
  }

  async checkDockerSetup(): Promise<void> {
    // 1. Check if Docker is installed
    console.log(chalk.blue("Checking if Docker is installed..."));
    try {
      const result = await $`docker --version`.quiet().nothrow();
      if (result.exitCode !== 0 || result.stderr.includes("command not found")) {
        console.error(
          chalk.red("❌ Docker is not installed. Please install Docker from https://docs.docker.com/get-docker/"),
        );
        throw new Error("Docker is not installed");
      }
      console.log(chalk.green("✅ Docker is installed"));
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Docker")) {
        console.error(
          chalk.red("❌ Docker is not installed. Please install Docker from https://docs.docker.com/get-docker/"),
        );
      }
      throw error;
    }

    // 2. Check if Docker daemon is running
    console.log(chalk.blue("Checking if Docker daemon is running..."));
    try {
      const result = await $`docker info`.quiet().nothrow();
      if (result.exitCode !== 0) {
        const errorMsg = result.stderr.toString();
        if (errorMsg.includes("Cannot connect to the Docker daemon")) {
          console.error(chalk.red("❌ Docker daemon is not running. Please start Docker Desktop and try again"));
          throw new Error("Docker daemon is not running");
        }
        if (errorMsg.includes("permission denied")) {
          console.error(chalk.red("❌ Permission denied. Please run with administrator privileges"));
          throw new Error("Permission denied accessing Docker");
        }
        console.error(chalk.red("❌ Docker daemon error. Please ensure Docker is running properly"));
        throw new Error("Docker daemon error");
      }
      console.log(chalk.green("✅ Docker daemon is running"));
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Docker")) {
        console.error(chalk.red("❌ Docker daemon error. Please ensure Docker is running properly"));
      }
      throw error;
    }

    // 3. Check required Docker images
    console.log(chalk.blue("Checking required Docker images..."));
    await this.ensureImagesExist();
  }

  async ensureNetworkExists(): Promise<void> {
    console.log(chalk.blue(`🔍 Checking Docker network ${this.config.networkName}...`));

    try {
      // Check if network exists
      const inspectResult = await $`docker network inspect ${this.config.networkName}`.quiet().nothrow();

      if (inspectResult.exitCode === 0) {
        console.log(chalk.yellow(`❗️ Docker network ${this.config.networkName} already exists.`));
        return;
      }

      // Network doesn't exist, create it
      console.log(chalk.blue(`🔧 Creating Docker network ${this.config.networkName}...`));
      const createResult = await $`docker network create ${this.config.networkName}`.quiet();
      console.log(chalk.green("✅ Network created successfully."));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to create Docker network: ${error.message}`));
      }
      throw error;
    }
  }

  async getContainerStatus(): Promise<{ exists: boolean; running: boolean }> {
    try {
      // Check if container exists
      const existsResult = await $`docker ps -a -q -f name=${this.config.containerName}`.quiet();
      const exists = existsResult.stdout.toString().trim().length > 0;

      if (!exists) {
        return { exists: false, running: false };
      }

      // Check if container is running
      const runningResult = await $`docker ps -q -f name=${this.config.containerName}`.quiet();
      const running = runningResult.stdout.toString().trim().length > 0;

      return { exists, running };
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to check container status: ${error.message}`));
      }
      throw error;
    }
  }

  async startContainer(): Promise<void> {
    console.log(chalk.blue(`🚀 Starting container ${this.config.containerName}...`));
    try {
      await $`docker start ${this.config.containerName}`.quiet();
      console.log(chalk.green("✅ Container started successfully."));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to start container: ${error.message}`));
      }
      throw error;
    }
  }

  async runSonarQubeContainer(): Promise<void> {
    console.log(chalk.blue("🚀 Starting new SonarQube container..."));
    try {
      await $`docker run -d --name ${this.config.containerName} --network ${this.config.networkName} -p 9000:9000 sonarqube:community`.quiet();
      console.log(chalk.green("✅ SonarQube container started successfully."));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to start SonarQube container: ${error.message}`));
      }
      throw error;
    }
  }

  async runSonarScanner(options: {
    projectBaseDir: string;
    token: string;
    containerSonarUrl: string;
  }): Promise<void> {
    console.log(chalk.blue("🔍 Running SonarScanner..."));

    try {
      const result = await $`docker run --rm -it \
        --network ${this.config.networkName} \
        -v "${options.projectBaseDir}:/usr/src" \
        -w /usr/src \
        sonarsource/sonar-scanner-cli \
        sonar-scanner \
        -Dsonar.token=${options.token} \
        -Dsonar.host.url="${options.containerSonarUrl}"`
        .quiet()
        .nothrow();

      // Log output regardless of success/failure
      if (result.stdout.length > 0) console.log(chalk.gray(result.stdout.toString()));
      if (result.stderr.length > 0) console.error(chalk.yellow("⚠️ Scanner warnings:"), result.stderr.toString());

      if (result.exitCode !== 0) {
        throw new Error(`SonarScanner failed with exit code ${result.exitCode}`);
      }

      console.log(chalk.green("✅ SonarScanner analysis complete."));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to run SonarScanner: ${error.message}`));
      }
      throw error;
    }
  }

  async runCodeChartaAnalysis(options: CodeChartaOptions): Promise<void> {
    try {
      console.log(chalk.blue("📊 Running CodeCharta analysis..."));

      // Convert Windows path to Unix format for Docker
      const containerPath = options.projectBaseDir.replace(/\\/g, "/");
      const normalizedPath = containerPath.replace(/^([A-Z]):/, (_, drive) => `/${drive.toLowerCase()}`);

      const result = await $`docker run --rm -it \
        --network "${this.config.networkName}" \
        --name codecharta-analysis \
        -v "${containerPath}:${normalizedPath}" \
        -w "${normalizedPath}" \
        codecharta/codecharta-analysis \
        ccsh sonarimport "${options.containerSonarUrl}" "${options.projectKey}" \
        "--user-token=${options.token}" \
        "--output-file=${options.outputFile || "analysis.cc.json"}" \
        "--merge-modules=false"`
        .quiet()
        .nothrow();

      // Log output regardless of success/failure
      if (result.stdout.length > 0) console.log(chalk.gray(result.stdout.toString()));
      if (result.stderr.length > 0) console.error(chalk.yellow("⚠️ CodeCharta warnings:"), result.stderr.toString());

      if (result.exitCode !== 0) {
        throw new Error(`CodeCharta analysis failed with exit code ${result.exitCode}`);
      }

      console.log(chalk.green("✅ CodeCharta analysis complete."));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to run CodeCharta analysis: ${error.message}`));
      }
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log(chalk.blue("🧹 Cleaning up..."));

    try {
      // Stop container if it exists
      const stopResult = await $`docker stop ${this.config.containerName}`.quiet().nothrow();
      if (stopResult.exitCode === 0) {
        console.log(chalk.gray("✓ Container stopped"));
      } else {
        console.log(chalk.yellow("⚠️ Container stop skipped (not running)"));
      }

      // Remove container if it exists
      const rmResult = await $`docker rm ${this.config.containerName}`.quiet().nothrow();
      if (rmResult.exitCode === 0) {
        console.log(chalk.gray("✓ Container removed"));
      } else {
        console.log(chalk.yellow("⚠️ Container removal skipped (not found)"));
      }

      // Remove network if it exists
      const networkResult = await $`docker network rm ${this.config.networkName}`.quiet().nothrow();
      if (networkResult.exitCode === 0) {
        console.log(chalk.gray("✓ Network removed"));
      } else {
        console.log(chalk.yellow("⚠️ Network removal skipped (not found or in use)"));
      }

      console.log(chalk.green("✨ Cleanup complete."));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Error during cleanup: ${error.message}`));
      }
      throw error;
    }
  }
}
