import type { UserConfig } from "./types.js";
export declare function parseUserConfig(raw: string, format?: "yaml" | "toml"): UserConfig;
export declare function loadUserConfig(configPath?: string): UserConfig;
