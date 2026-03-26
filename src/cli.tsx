import { render } from "ink";
import React from "react";
import { configExists, initConfig } from "./config.js";
import type { PipelineConfig } from "./pipeline.js";
import { App } from "./tui/App.js";
import type { TemplateName } from "./types.js";

const subcommand = process.argv[2];

if (subcommand === "init") {
  if (configExists()) {
    console.log("github-insights.yml already exists, skipping.");
  } else {
    const path = initConfig();
    console.log(`Created ${path} — edit it to customize your profile.`);
  }
  process.exit(0);
}

const token = process.env.GITHUB_TOKEN || "";
const username = process.env.GITHUB_REPOSITORY_OWNER || "";

if (!token) {
  console.error("GITHUB_TOKEN is required. Run: gh auth token");
  process.exit(1);
}
if (!username) {
  console.error("GITHUB_REPOSITORY_OWNER is required.");
  process.exit(1);
}

const config: PipelineConfig = {
  token,
  username,
  outputDir: process.env.OUTPUT_DIR || "assets/insights",
  commitPush: false,
  commitMessage: "chore: update metrics",
  commitName: "",
  commitEmail: "",
  readmePath:
    process.env.README_PATH || (process.env.CI ? "README.md" : "none"),
  templateName: (process.env.TEMPLATE as TemplateName) || "showcase",
  requestedSections: process.env.SECTIONS
    ? process.env.SECTIONS.split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [],
};

render(<App config={config} />);
