import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── Types ──────────────────────────────────────────────────────────────────

export interface PromptValves {
  model: string;
  temperature: number;
  system: string;
  user: string;
}

export interface AIConfig {
  preamble: Partial<PromptValves>;
  classification: Partial<PromptValves>;
}

export interface ResolvedPrompts {
  preamble: PromptValves;
  classification: PromptValves;
}

// ── Default prompt loading ─────────────────────────────────────────────────

const PROMPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "prompts");

function loadDefault(filename: string): string {
  return readFileSync(join(PROMPTS_DIR, filename), "utf-8").trim();
}

const DEFAULTS: ResolvedPrompts = {
  preamble: {
    model: "gpt-4.1",
    temperature: 0.5,
    system: loadDefault("preamble-system.txt"),
    user: loadDefault("preamble-user.txt"),
  },
  classification: {
    model: "gpt-4.1",
    temperature: 0.15,
    system: loadDefault("classification-system.txt"),
    user: loadDefault("classification-user.txt"),
  },
};

// ── Resolution ─────────────────────────────────────────────────────────────

/** Load a prompt value — if it looks like a file path, read the file; otherwise use as-is. */
function resolvePromptValue(
  value: string | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  // Heuristic: if it ends with .txt/.md or is an absolute/relative path, treat as file
  if (
    trimmed.endsWith(".txt") ||
    trimmed.endsWith(".md") ||
    isAbsolute(trimmed)
  ) {
    if (existsSync(trimmed)) {
      return readFileSync(trimmed, "utf-8").trim();
    }
    console.warn(`Prompt file not found: ${trimmed}, using default`);
    return fallback;
  }
  return trimmed;
}

function resolveValves(
  overrides: Partial<PromptValves> | undefined,
  defaults: PromptValves,
): PromptValves {
  return {
    model: overrides?.model || defaults.model,
    temperature: overrides?.temperature ?? defaults.temperature,
    system: resolvePromptValue(overrides?.system, defaults.system),
    user: resolvePromptValue(overrides?.user, defaults.user),
  };
}

export function resolvePrompts(
  aiConfig: AIConfig | undefined,
): ResolvedPrompts {
  return {
    preamble: resolveValves(aiConfig?.preamble, DEFAULTS.preamble),
    classification: resolveValves(
      aiConfig?.classification,
      DEFAULTS.classification,
    ),
  };
}

// ── Template interpolation ─────────────────────────────────────────────────

/** Replace `{{key}}` placeholders with values from the vars map. */
export function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (match, key: string) => vars[key] ?? match,
  );
}
