import type { ShowcaseSection, TemplateName, UserConfig } from "./types.js";
export declare function resolveTemplateSections(templateName?: TemplateName, explicitSections?: string[]): ShowcaseSection[];
export declare function parseUserConfig(raw: string, format?: "yaml" | "toml"): UserConfig;
export declare function loadUserConfig(configPath?: string): UserConfig;
