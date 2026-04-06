import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as toml from "smol-toml";
import * as yaml from "yaml";
import { z } from "zod";
import type { AIConfig } from "./prompts.js";
import type { ShowcaseSection, TemplateName } from "./types.js";

// ── Zod schema ────────────────────────────────────────────────────────────

const VALID_TEMPLATES = [
  "classic",
  "modern",
  "minimal",
  "ecosystem",
  "showcase",
] as const;
const VALID_SECTIONS = [
  "spotlight",
  "velocity",
  "rhythm",
  "constellation",
  "impact",
  "portfolio",
  "stack",
] as const;

const VALID_CONSTELLATION_GROUP_BY = ["language", "category"] as const;
const constellationGroupBySet = new Set<string>(VALID_CONSTELLATION_GROUP_BY);

const templateSet = new Set<string>(VALID_TEMPLATES);
const sectionSet = new Set<string>(VALID_SECTIONS);

/** Trims a string, returns undefined if empty/whitespace-only. */
const optionalTrimmedString = z
  .string()
  .transform((s) => {
    const trimmed = s.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  .optional();

/** Lowercases + validates against template enum, returns undefined if invalid. */
const lenientTemplate = z
  .string()
  .transform((s) => {
    const lower = s.trim().toLowerCase();
    return templateSet.has(lower)
      ? (lower as (typeof VALID_TEMPLATES)[number])
      : undefined;
  })
  .optional();

/** Lenient prompt valves — accepts partial overrides, drops unknowns. */
const promptValvesSchema = z
  .object({
    model: optionalTrimmedString,
    temperature: z.number().min(0).max(2).optional(),
    system: optionalTrimmedString,
    user: optionalTrimmedString,
  })
  .strip()
  .optional();

const aiConfigSchema = z
  .object({
    preamble: promptValvesSchema,
    classification: promptValvesSchema,
  })
  .strip()
  .optional();

/** Lowercases + validates against constellation group-by enum, returns undefined if invalid. */
const lenientConstellationGroupBy = z
  .string()
  .transform((s) => {
    const lower = s.trim().toLowerCase();
    return constellationGroupBySet.has(lower)
      ? (lower as (typeof VALID_CONSTELLATION_GROUP_BY)[number])
      : undefined;
  })
  .optional();

/** Filters array to valid section strings, returns undefined if empty. */
const lenientSections = z
  .array(z.unknown())
  .transform((arr) => {
    const valid = arr
      .filter((item): item is string => typeof item === "string")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => sectionSet.has(s)) as (typeof VALID_SECTIONS)[number][];
    return valid.length > 0 ? valid : undefined;
  })
  .optional();

export const UserConfigSchema = z
  .object({
    name: optionalTrimmedString,
    pronunciation: optionalTrimmedString,
    title: optionalTrimmedString,
    desired_title: optionalTrimmedString,
    bio: optionalTrimmedString,
    preamble: optionalTrimmedString,
    template: lenientTemplate,
    sections: lenientSections,
    exclude_archived: z.boolean().optional(),
    fail_fast: z.boolean().optional(),
    export_json: z.boolean().optional(),
    constellation_group_by: lenientConstellationGroupBy,
    ai: aiConfigSchema,
  })
  .strip()
  .transform((obj) => {
    // Remove keys whose value is undefined so the result is a clean partial.
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) clean[k] = v;
    }
    return clean as UserConfig;
  });

export type UserConfig = {
  name?: string;
  pronunciation?: string;
  title?: string;
  desired_title?: string;
  bio?: string;
  preamble?: string;
  template?: (typeof VALID_TEMPLATES)[number];
  sections?: (typeof VALID_SECTIONS)[number][];
  exclude_archived?: boolean;
  fail_fast?: boolean;
  export_json?: boolean;
  constellation_group_by?: (typeof VALID_CONSTELLATION_GROUP_BY)[number];
  ai?: AIConfig;
};

export const SectionSchema = z.enum(VALID_SECTIONS);

// ── Constants ─────────────────────────────────────────────────────────────

const SECTION_PRESETS: Record<string, ShowcaseSection[]> = {
  classic: ["velocity", "rhythm", "constellation", "impact"],
  modern: ["spotlight", "velocity", "rhythm", "constellation", "impact"],
  minimal: ["velocity", "rhythm"],
  ecosystem: [
    "spotlight",
    "velocity",
    "rhythm",
    "constellation",
    "stack",
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

const DEFAULT_CONFIG_ASSET = join(
  dirname(fileURLToPath(import.meta.url)),
  "templates",
  "github-insights.default.yaml",
);

// ── Public API ────────────────────────────────────────────────────────────

export function resolveTemplateSections(
  templateName?: TemplateName,
  explicitSections?: string[],
): ShowcaseSection[] {
  if (explicitSections && explicitSections.length > 0) {
    const valid = explicitSections.filter(
      (s) => SectionSchema.safeParse(s).success,
    );
    return valid.length > 0 ? (valid as ShowcaseSection[]) : DEFAULT_SECTIONS;
  }
  if (templateName && SECTION_PRESETS[templateName]) {
    return SECTION_PRESETS[templateName];
  }
  return DEFAULT_SECTIONS;
}

export function parseUserConfig(
  raw: string,
  format: "yaml" | "toml" = "yaml",
): UserConfig {
  const parsed =
    format === "toml"
      ? toml.parse(raw)
      : ((yaml.parse(raw) as Record<string, unknown>) ?? {});
  return UserConfigSchema.parse(parsed);
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
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      console.warn(`Warning: invalid config "${resolved.path}":\n${issues}`);
      return {};
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `Warning: failed to parse config file "${resolved.path}": ${msg}`,
    );
    return {};
  }
}

export function configExists(): boolean {
  return (
    existsSync("github-insights.yml") || existsSync("github-insights.yaml")
  );
}

export function initConfig(path = "github-insights.yml"): string {
  if (existsSync(path)) {
    return path;
  }
  copyFileSync(DEFAULT_CONFIG_ASSET, path);
  return path;
}

// ── Internals ─────────────────────────────────────────────────────────────

function detectFormat(path: string): "yaml" | "toml" {
  return path.endsWith(".toml") ? "toml" : "yaml";
}

function resolveConfigPath(): { path: string; format: "yaml" | "toml" } {
  if (existsSync("github-insights.yaml")) {
    return { path: "github-insights.yaml", format: "yaml" };
  }
  if (existsSync("github-insights.yml")) {
    return { path: "github-insights.yml", format: "yaml" };
  }
  return { path: "github-insights.yaml", format: "yaml" };
}
