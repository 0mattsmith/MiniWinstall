export interface ComponentItem {
  id: string;
  name: string;
  category: "bloatware" | "telemetry" | "defender" | "system" | "gaming";
  description: string;
  sizeMb: number;
  riskScore: number; // 0 (None) to 100 (High)
  checked: boolean;
}

export interface DriverItem {
  id: string;
  name: string;
  type: string; // e.g., Network, Storage, Video, OEM
  version: string;
  sizeKb: number;
  fileName: string;
}

export interface UnattendedConfig {
  username: string;
  computerName: string;
  bypassTPM: boolean;
  bypassRAMCheck: boolean;
  bypassSecureBoot: boolean;
  bypassDiskCheck: boolean;
  skipMicrosoftAccount: boolean;
  enableDeveloperMode: boolean;
  rootPassword?: string;
  autoLogon: boolean;
  timezone: string;
}

export interface SystemStabilityCheck {
  isStable: boolean;
  integrityScore: number; // 0 to 100
  potentialIssues: string[];
  recommendedFixes: string[];
  estimatedSizeDecreaseGb: number;
  performanceImprovementPct: number;
}

export interface RustPlugin {
  name: string;
  description: string;
  trigger: string; // "pre-mount" | "post-mount" | "pre-unmount" | "post-package"
  rustCode: string;
}

export interface SimulationLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}
