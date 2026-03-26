import { existsSync, readFileSync } from "node:fs";
import * as toml from "smol-toml";
import * as yaml from "yaml";
import type { ShowcaseSection, TemplateName, UserConfig } from "./types.js";

const VALID_TEMPLATES = new Set<string>([
  "classic",
  "modern",
  "minimal",
  "ecosystem",
  "showcase",
]);

const VALID_SECTIONS = new Set<string>([
  "spotlight",
  "velocity",
  "rhythm",
  "constellation",
  "impact",
  "portfolio",
]);

const SECTION_PRESETS: Record<string, ShowcaseSection[]> = {
  classic: ["velocity", "rhythm", "constellation", "impact"],
  modern: ["spotlight", "velocity", "rhythm", "constellation", "impact"],
  minimal: ["velocity", "rhythm"],
  ecosystem: [
    "spotlight",
    "velocity",
    "rhythm",
    "constellation",
    "portfolio",
    "impact",
  ],
  showcase: [
    "spotlight",
    "velocity",
    "rhythm",
    "constellation",
    "portfolio",
    "impact",
  ],
};

const DEFAULT_SECTIONS: ShowcaseSection[] = SECTION_PRESETS.showcase;

export function resolveTemplateSections(
  templateName?: TemplateName,
  explicitSections?: string[],
): ShowcaseSection[] {
  if (explicitSections && explicitSections.length > 0) {
    const valid = explicitSections.filter((s) => {
      if (VALID_SECTIONS.has(s)) return true;
      console.warn(`Unknown section "${s}", ignoring.`);
      return false;
    });
    return valid.length > 0 ? (valid as ShowcaseSection[]) : DEFAULT_SECTIONS;
  }
  if (templateName && SECTION_PRESETS[templateName]) {
    return SECTION_PRESETS[templateName];
  }
  return DEFAULT_SECTIONS;
}

function extractConfig(parsed: Record<string, unknown>): UserConfig {
  const config: UserConfig = {};

  if (typeof parsed.title === "string" && parsed.title.trim()) {
    config.title = parsed.title.trim();
  }
  if (typeof parsed.desired_title === "string" && parsed.desired_title.trim()) {
    config.desired_title = parsed.desired_title.trim();
  }
  if (typeof parsed.name === "string" && parsed.name.trim()) {
    config.name = parsed.name.trim();
  }
  if (typeof parsed.pronunciation === "string" && parsed.pronunciation.trim()) {
    config.pronunciation = parsed.pronunciation.trim();
  }
  if (typeof parsed.bio === "string" && parsed.bio.trim()) {
    config.bio = parsed.bio.trim();
  }
  if (typeof parsed.preamble === "string" && parsed.preamble.trim()) {
    config.preamble = parsed.preamble.trim();
  }
  if (typeof parsed.template === "string" && parsed.template.trim()) {
    const t = parsed.template.trim().toLowerCase();
    if (VALID_TEMPLATES.has(t)) {
      config.template = t as TemplateName;
    } else {
      console.warn(
        `Unknown template "${t}", falling back to "classic". Valid: ${[...VALID_TEMPLATES].join(", ")}`,
      );
    }
  }
  if (typeof parsed.exclude_archived === "boolean") {
    config.exclude_archived = parsed.exclude_archived;
  }
  if (Array.isArray(parsed.sections)) {
    const sections = parsed.sections
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => {
        if (VALID_SECTIONS.has(s)) return true;
        console.warn(
          `Unknown section "${s}" in config, ignoring. Valid: ${[...VALID_SECTIONS].join(", ")}`,
        );
        return false;
      });
    if (sections.length > 0) {
      config.sections = sections;
    }
  }

  return config;
}

export function parseUserConfig(
  raw: string,
  format: "yaml" | "toml" = "yaml",
): UserConfig {
  const parsed =
    format === "toml"
      ? toml.parse(raw)
      : ((yaml.parse(raw) as Record<string, unknown>) ?? {});
  return extractConfig(parsed);
}

export function loadUserConfig(configPath?: string): UserConfig {
  const resolved = configPath
    ? { path: configPath, format: detectFormat(configPath) }
    : resolveConfigPath();
  try {
    const raw = readFileSync(resolved.path, "utf-8");
    return parseUserConfig(raw, resolved.format);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return {};
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `Warning: failed to parse config file "${resolved.path}": ${msg}`,
    );
    return {};
  }
}

function detectFormat(path: string): "yaml" | "toml" {
  return path.endsWith(".toml") ? "toml" : "yaml";
}

function resolveConfigPath(): { path: string; format: "yaml" | "toml" } {
  if (existsSync("github-insights.yml")) {
    return { path: "github-insights.yml", format: "yaml" };
  }
  if (existsSync("github-insights.yaml")) {
    return { path: "github-insights.yaml", format: "yaml" };
  }
  return { path: "github-insights.yml", format: "yaml" };
}
