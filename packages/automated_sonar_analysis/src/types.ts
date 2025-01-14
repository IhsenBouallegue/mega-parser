export interface SonarConfig {
  projectKey: string;
  projectName: string;
  newPassword: string;
  projectBaseDir: string;
  hostSonarUrl: string;
  containerSonarUrl: string;
  defaultUser: string;
  defaultPassword: string;
  tokenName: string;
  token: string;
  networkName: string;
  containerName: string;
  timeoutPeriod: number;
}

export interface DockerConfig {
  networkName: string;
  containerName: string;
}

export interface AuthConfig {
  username: string;
  password: string;
}

export interface SonarComponent {
  key: string;
  name: string;
  qualifier: string;
}

export interface SonarResponse {
  status?: string;
  valid?: boolean;
  token?: string;
  components?: SonarComponent[];
  current?: {
    status: string;
  };
}

export enum AnalysisStep {
  EnsureSonarQubeRunning = "Ensure SonarQube Running",
  ResetSonarQubePassword = "Reset SonarQube Password",
  CleanUpPreviousProject = "Clean Up Previous Project",
  RevokeToken = "Revoke Token",
  CreateProjectAndGenerateToken = "Create Project and Generate Token",
  RunSonarScanner = "Run SonarScanner",
  RunCodeChartaAnalysis = "Run CodeCharta Analysis",
  FinalCleanup = "Final Cleanup",
}
