import chalk from "chalk";
import ora from "ora";
import type { AuthConfig, SonarConfig, SonarResponse } from "./types.js";

export class SonarManager {
  private config: SonarConfig;
  private auth: AuthConfig;

  constructor(config: SonarConfig) {
    this.config = config;
    this.auth = {
      username: config.defaultUser,
      password: config.defaultPassword,
    };
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<{ response: T; status: number }> {
    const authHeader = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString("base64");

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Basic ${authHeader}`,
      },
    });

    const data = (await response.json()) as T;
    return { response: data, status: response.status };
  }

  async waitForSonarQubeReady(): Promise<void> {
    const spinner = ora("⏳ Checking SonarQube status...").start();
    const checkInterval = 2000; // 2 seconds
    let elapsedTime = 0;

    while (elapsedTime < this.config.timeoutPeriod) {
      try {
        const { response, status } = await this.makeRequest<SonarResponse>(
          `${this.config.hostSonarUrl}/api/system/status`,
        );

        if (status === 200 && response.status === "UP") {
          spinner.succeed("✅ SonarQube is ready!");
          return;
        }
        
        spinner.text = `⏳ Waiting for SonarQube to be ready... (${elapsedTime / 1000}s)`;
      } catch (error) {
        spinner.text = `⏳ Waiting for SonarQube to start... (${elapsedTime / 1000}s)`;
        if (error instanceof Error) {
          console.error(chalk.gray(`Debug: ${error.message}`));
        }
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      elapsedTime += checkInterval;
    }

    spinner.fail(`❌ SonarQube did not become ready within ${this.config.timeoutPeriod / 1000} seconds.`);
    throw new Error("SonarQube timeout");
  }

  async resetPassword(): Promise<void> {
    console.log(chalk.blue("🔑 Testing SonarQube credentials..."));

    try {
      // Try default password
      const { response: defaultAuth, status: defaultStatus } = await this.makeRequest<SonarResponse>(
        `${this.config.hostSonarUrl}/api/authentication/validate`,
      );

      if (defaultStatus === 200 && defaultAuth.valid) {
        console.log(chalk.green("✅ Default credentials are valid. Changing password..."));
        await this.changePassword();
        return;
      }

      // Try new password
      this.auth.password = this.config.newPassword;
      const { response: newAuth, status: newStatus } = await this.makeRequest<SonarResponse>(
        `${this.config.hostSonarUrl}/api/authentication/validate`,
      );

      if (newStatus === 200 && newAuth.valid) {
        console.log(chalk.green("✅ New password is valid."));
        return;
      }

      throw new Error("Invalid credentials");
    } catch (error) {
      console.error(chalk.red("❌ Failed to validate or change password."));
      throw error;
    }
  }

  private async changePassword(): Promise<void> {
    const formData = new URLSearchParams({
      login: this.config.defaultUser,
      previousPassword: this.config.defaultPassword,
      password: this.config.newPassword,
    });

    try {
      const { status } = await this.makeRequest(`${this.config.hostSonarUrl}/api/users/change_password`, {
        method: "POST",
        body: formData,
      });

      if (status === 200 || status === 204) {
        console.log(chalk.green("✅ Password changed successfully."));
        this.auth.password = this.config.newPassword;
      } else {
        throw new Error(`Failed to change password. Status: ${status}`);
      }
    } catch (error) {
      console.error(chalk.red("❌ Failed to change password."));
      throw error;
    }
  }

  async cleanupProject(): Promise<void> {
    console.log(chalk.blue("🧹 Cleaning up previous SonarQube project..."));

    try {
      const { status } = await this.makeRequest(
        `${this.config.hostSonarUrl}/api/projects/delete?project=${encodeURIComponent(this.config.projectKey)}`,
        { method: "POST" },
      );

      if (status === 404) {
        console.log(chalk.yellow("❗️ Project not found, skipping deletion."));
        return;
      }

      if (status !== 200 && status !== 204) {
        throw new Error(`Failed to delete project. Status: ${status}`);
      }

      console.log(chalk.green("✅ Project deleted successfully."));
    } catch (error) {
      console.error(chalk.red("❌ Failed to cleanup project."));
      throw error;
    }
  }

  async revokeToken(): Promise<void> {
    console.log(chalk.blue("🔑 Revoking existing SonarQube token..."));

    try {
      const { status } = await this.makeRequest(
        `${this.config.hostSonarUrl}/api/user_tokens/revoke?name=${encodeURIComponent(this.config.tokenName)}`,
        { method: "POST" },
      );

      if (status === 404) {
        console.log(chalk.yellow("❗️ Token not found, skipping revocation."));
        return;
      }

      if (status !== 200 && status !== 204) {
        throw new Error(`Failed to revoke token. Status: ${status}`);
      }

      console.log(chalk.green("✅ Token revoked successfully."));
    } catch (error) {
      console.error(chalk.red("❌ Failed to revoke token."));
      throw error;
    }
  }

  async createProject(): Promise<void> {
    console.log(chalk.blue(`🔍 Checking if project '${this.config.projectKey}' exists...`));

    try {
      const { response, status } = await this.makeRequest<SonarResponse>(
        `${this.config.hostSonarUrl}/api/projects/search?projects=${encodeURIComponent(this.config.projectKey)}`,
      );

      if (status === 200 && response.components && response.components.length > 0) {
        console.log(chalk.yellow("❗️ Project already exists. Skipping creation."));
        return;
      }

      const createResponse = await this.makeRequest(
        `${this.config.hostSonarUrl}/api/projects/create?project=${encodeURIComponent(
          this.config.projectKey,
        )}&name=${encodeURIComponent(this.config.projectName)}`,
        { method: "POST" },
      );

      if (createResponse.status !== 200) {
        throw new Error(`Failed to create project. Status: ${createResponse.status}`);
      }

      console.log(chalk.green("✅ Project created successfully."));
    } catch (error) {
      console.error(chalk.red("❌ Failed to create project."));
      throw error;
    }
  }

  async generateToken(): Promise<string> {
    console.log(chalk.blue("🔑 Generating new token..."));

    try {
      const { response, status } = await this.makeRequest<SonarResponse>(
        `${this.config.hostSonarUrl}/api/user_tokens/generate?name=${encodeURIComponent(this.config.tokenName)}`,
        { method: "POST" },
      );

      if (status !== 200 || !response.token) {
        throw new Error("Failed to generate token");
      }

      console.log(chalk.green("✅ Token generated successfully."));
      return response.token;
    } catch (error) {
      console.error(chalk.red("❌ Failed to generate token."));
      throw error;
    }
  }

  async waitForAnalysisComplete(): Promise<void> {
    const spinner = ora("⏳ Waiting for analysis to complete...").start();
    const checkInterval = 2000; // 2 seconds
    let elapsedTime = 0;

    while (elapsedTime < this.config.timeoutPeriod) {
      try {
        const { response, status } = await this.makeRequest<SonarResponse>(
          `${this.config.hostSonarUrl}/api/ce/component?component=${encodeURIComponent(this.config.projectKey)}`,
        );

        if (status === 200 && response.current?.status === "SUCCESS") {
          spinner.succeed("✅ Analysis completed successfully!");
          return;
        }
      } catch (error) {
        // Ignore errors during polling
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      elapsedTime += checkInterval;
    }

    spinner.fail(`❌ Analysis did not complete within ${this.config.timeoutPeriod} seconds.`);
    throw new Error("Analysis timeout");
  }
}
