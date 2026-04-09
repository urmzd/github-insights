import { execSync } from "node:child_process";
import { Command, Option } from "commander";
import { render } from "ink";
import React from "react";
import { configExists, initConfig } from "./config.js";
import { getExitCode } from "./errors.js";
import { type PipelineCallbacks, type PipelineConfig, runPipeline } from "./pipeline.js";
import { App } from "./tui/App.js";
import type { TemplateName } from "./types.js";

// Hardcoded at build time — update via `npm version`
const version = "3.4.0";

const program = new Command()
  .name("github-insights")
  .description("Generate GitHub profile insights and visualizations")
  .version(version);

program
  .command("init")
  .description("Create a github-insights.yml config file")
  .action(() => {
    if (configExists()) {
      console.log("github-insights.yml already exists, skipping.");
    } else {
      const path = initConfig();
      console.log(`Created ${path} — edit it to customize your profile.`);
    }
  });

program
  .command("generate", { isDefault: true })
  .description("Generate metrics and visualizations")
  .option("-t, --token <token>", "GitHub token", process.env.GITHUB_TOKEN)
  .option(
    "-u, --username <username>",
    "GitHub username",
    process.env.GITHUB_REPOSITORY_OWNER,
  )
  .option(
    "-o, --output-dir <dir>",
    "Output directory for SVGs",
    process.env.OUTPUT_DIR || "assets/insights",
  )
  .option(
    "--readme-path <path>",
    "README output path",
    process.env.README_PATH || (process.env.CI ? "README.md" : "none"),
  )
  .option(
    "--template <name>",
    "Template preset",
    process.env.TEMPLATE || "showcase",
  )
  .option("--sections <list>", "Comma-separated section list")
  .option(
    "--fail-fast",
    "Exit with an error instead of falling back to heuristics when AI is unavailable",
    false,
  )
  .option("--verbose", "Show TUI progress (default: silent when not a TTY)", process.stdout.isTTY)
  .addOption(
    new Option("--format <format>", "Output format")
      .choices(["json", "human"])
      .default("human"),
  )
  .action((opts) => {
    const token = opts.token || "";
    const username = opts.username || "";

    if (!token) {
      console.error("GITHUB_TOKEN is required. Run: gh auth token");
      process.exit(1);
    }
    if (!username) {
      console.error(
        "GITHUB_REPOSITORY_OWNER is required (or pass --username).",
      );
      process.exit(1);
    }

    const sectionsRaw = opts.sections || process.env.SECTIONS || "";
    const config: PipelineConfig = {
      token,
      username,
      outputDir: opts.outputDir,
      commitPush: false,
      commitMessage: "chore: update metrics",
      commitName: "",
      commitEmail: "",
      readmePath: opts.readmePath,
      templateName: opts.template as TemplateName,
      requestedSections: sectionsRaw
        ? sectionsRaw
            .split(",")
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean)
        : [],
      failFast: opts.failFast,
      exportJson: opts.format === "json",
    };

    if (opts.verbose) {
      render(
        <App
          config={config}
          onExit={(err) => {
            process.exitCode = err ? getExitCode(err) : 0;
          }}
        />,
      );
    } else {
      const callbacks: PipelineCallbacks = {
        onPhaseStart() {},
        onPhaseComplete() {},
        onProgress() {},
        onError(err) {
          process.stderr.write(`error: ${err.message}\n`);
        },
      };
      runPipeline(config, callbacks).catch((err: unknown) => {
        process.exitCode = getExitCode(err);
      });
    }
  });

program
  .command("update")
  .description("Update github-insights to the latest version")
  .action(() => {
    execSync("npm install -g @urmzd/github-insights@latest", {
      stdio: "inherit",
    });
  });

program
  .command("version")
  .description("Print version")
  .action(() => {
    console.log(`github-insights ${version}`);
  });

program.parse();
