import { createRequire } from "node:module";
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { configExists, initConfig } from "./config.js";
import type { PipelineConfig } from "./pipeline.js";
import { App } from "./tui/App.js";
import type { TemplateName } from "./types.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

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
    };

    render(<App config={config} />);
  });

program.parse();
