import { readFileSync } from "node:fs";
import * as toml from "smol-toml";
import type { TemplateName, UserConfig } from "./types.js";

const VALID_TEMPLATES = new Set<string>(["classic", "modern", "minimal"]);

export function parseUserConfig(raw: string): UserConfig {
  const parsed = toml.parse(raw);
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
  if (Array.isArray(parsed.sections)) {
    const sections = parsed.sections
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().toLowerCase());
    if (sections.length > 0) {
      config.sections = sections;
    }
  }

  return config;
}

export function loadUserConfig(configPath?: string): UserConfig {
  const path = configPath || ".github-metrics.toml";
  try {
    const raw = readFileSync(path, "utf-8");
    return parseUserConfig(raw);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return {};
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: failed to parse config file "${path}": ${msg}`);
    return {};
  }
}
