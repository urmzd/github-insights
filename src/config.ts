import { readFileSync } from "node:fs";
import * as toml from "smol-toml";
import type { UserConfig } from "./types.js";

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

  return config;
}

export function loadUserConfig(configPath?: string): UserConfig {
  const path = configPath || ".github-metrics.toml";
  try {
    const raw = readFileSync(path, "utf-8");
    return parseUserConfig(raw);
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: failed to parse config file "${path}": ${msg}`);
    return {};
  }
}
