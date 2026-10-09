import * as core from "@actions/core";
import { resolveAIEndpoint } from "./ai.js";
import { getExitCode, InsightsError } from "./errors.js";
import type { PipelineCallbacks, PipelineConfig } from "./pipeline.js";
import { runPipeline } from "./pipeline.js";
import type { TemplateName } from "./types.js";

async function run(): Promise<void> {
  const token = core.getInput("github-token") || process.env.GITHUB_TOKEN || "";
  const username =
    core.getInput("username") || process.env.GITHUB_REPOSITORY_OWNER || "";
  const outputDir = core.getInput("output-dir") || "assets/insights";
  const commitPush =
    (core.getInput("commit-push") || (process.env.CI ? "true" : "false")) ===
    "true";
  const commitMessage =
    core.getInput("commit-message") || "chore: update metrics";
  const commitName = core.getInput("commit-name") || "github-actions[bot]";
  const commitEmail =
    core.getInput("commit-email") ||
    "41898282+github-actions[bot]@users.noreply.github.com";
  const configPath = core.getInput("config-file") || undefined;
  const readmePath =
    core.getInput("readme-path") || (process.env.CI ? "README.md" : "none");
  const failFast = (core.getInput("fail-fast") || "false") === "true";
  const exportJson = (core.getInput("export-json") || "false") === "true";
  const cache = (core.getInput("cache") || "true") !== "false";
  // action.yml supplies the defaults; an explicit empty ai-base-url disables AI.
  const ai = resolveAIEndpoint({
    baseUrl: core.getInput("ai-base-url"),
    model: core.getInput("ai-model"),
    apiKey: core.getInput("ai-api-key"),
    reasoningEffort: core.getInput("ai-reasoning-effort"),
  });
  if (ai.apiKey) core.setSecret(ai.apiKey);

  const templateName: TemplateName =
    (core.getInput("template") as TemplateName) || "showcase";
  const sectionsInput = core.getInput("sections") || "";
  const requestedSections =
    sectionsInput.length > 0
      ? sectionsInput
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];

  const config: PipelineConfig = {
    token,
    ai,
    username,
    outputDir,
    commitPush,
    commitMessage,
    commitName,
    commitEmail,
    configPath,
    readmePath,
    templateName,
    requestedSections,
    failFast,
    exportJson,
    cache,
  };

  const callbacks: PipelineCallbacks = {
    onPhaseStart(_phase, label) {
      core.info(`${label}...`);
    },
    onPhaseComplete(_phase, summary) {
      core.info(summary);
    },
    onProgress(message) {
      core.info(message);
    },
    onNotice(message) {
      core.notice(message);
    },
    onError(error) {
      core.setFailed(error.message);
    },
  };

  try {
    await runPipeline(config, callbacks);
  } catch (error: unknown) {
    const code = error instanceof InsightsError ? error.code : undefined;
    const msg = error instanceof Error ? error.message : String(error);
    core.setFailed(code ? `[${code}] ${msg}` : msg);
    process.exitCode = getExitCode(error);
  }
}

run();
