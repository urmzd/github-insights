import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import {
  fetchAIPreamble,
  fetchAllRepoData,
  fetchContributionData,
  fetchExpertiseAnalysis,
  fetchManifestsForRepos,
  fetchProjectClassifications,
  fetchReadmeForRepos,
  fetchUserProfile,
  makeGraphql,
} from "./api.js";
import { generateFullSvg, wrapSectionSvg } from "./components/full-svg.js";
import { renderSection } from "./components/section.js";
import { loadUserConfig } from "./config.js";
import {
  aggregateLanguages,
  buildClassificationInputs,
  buildSections,
  collectAllDependencies,
  collectAllTopics,
  getTopProjectsByComplexity,
  SECTION_KEYS,
  splitProjectsByRecency,
} from "./metrics.js";
import { loadPreamble } from "./readme.js";
import {
  buildSocialBadges,
  extractFirstName,
  getTemplate,
} from "./templates.js";
import type { TemplateName } from "./types.js";

async function run(): Promise<void> {
  try {
    const token =
      core.getInput("github-token") || process.env.GITHUB_TOKEN || "";
    const username =
      core.getInput("username") || process.env.GITHUB_REPOSITORY_OWNER || "";
    const outputDir = core.getInput("output-dir") || "metrics";
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
      core.getInput("readme-path") ||
      (process.env.CI ? "README.md" : "_README.md");
    const indexOnly = (core.getInput("index-only") || "true") === "true";
    const userConfig = loadUserConfig(configPath);

    // Template and sections from action inputs or config
    const templateName: TemplateName =
      (core.getInput("template") as TemplateName) ||
      userConfig.template ||
      "classic";
    const sectionsInput = core.getInput("sections") || "";
    const requestedSections =
      sectionsInput.length > 0
        ? sectionsInput
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        : userConfig.sections || [];

    if (!token) {
      core.setFailed("github-token is required");
      return;
    }
    if (!username) {
      core.setFailed("username is required");
      return;
    }

    // ── Fetch ─────────────────────────────────────────────────────────────
    const graphql = makeGraphql(token);

    core.info("Fetching repo data...");
    const repos = await fetchAllRepoData(graphql, username);
    core.info(`Found ${repos.length} public repos`);

    core.info("Fetching dependency manifests...");
    core.info("Fetching contribution data...");
    core.info("Fetching READMEs...");
    core.info("Fetching user profile...");
    const [manifests, contributionData, readmeMap, userProfile] =
      await Promise.all([
        fetchManifestsForRepos(graphql, username, repos),
        fetchContributionData(graphql, username),
        fetchReadmeForRepos(graphql, username, repos),
        fetchUserProfile(graphql, username),
      ]);
    core.info(`Fetched manifests for ${manifests.size} repos`);
    core.info(
      `Contributions: ${contributionData.contributions.totalCommitContributions} commits, ${contributionData.contributions.totalPullRequestContributions} PRs`,
    );
    core.info(`Fetched READMEs for ${readmeMap.size} repos`);
    core.info(`User profile: ${userProfile.name || username}`);

    // ── Transform ─────────────────────────────────────────────────────────
    const languages = aggregateLanguages(repos);
    const complexProjects = getTopProjectsByComplexity(repos);
    const projects = complexProjects.slice(0, 5);

    const allDeps = collectAllDependencies(repos, manifests);
    const allTopics = collectAllTopics(repos);

    core.info("Fetching project classifications from GitHub Models...");
    const classificationInputs = buildClassificationInputs(
      repos,
      contributionData,
    );
    const [aiClassifications, techHighlights] = await Promise.all([
      fetchProjectClassifications(token, classificationInputs),
      (async () => {
        core.info("Fetching expertise analysis from GitHub Models...");
        return fetchExpertiseAnalysis(
          token,
          languages,
          allDeps,
          allTopics,
          repos,
          readmeMap,
          userConfig,
        );
      })(),
    ]);
    core.info(
      `Project classifications: ${aiClassifications.length} AI-classified (${repos.length - aiClassifications.length} heuristic fallback)`,
    );
    core.info(`Expertise analysis: ${techHighlights.length} categories`);

    const {
      active: activeProjects,
      maintained: maintainedProjects,
      inactive: inactiveProjects,
    } = splitProjectsByRecency(repos, contributionData, aiClassifications);

    const sectionDefs = buildSections({
      languages,
      techHighlights,
      projects,
      contributionData,
    });

    // Filter sections by requested keys if specified
    let activeSections = sectionDefs.filter(
      (s) => s.renderBody || (s.items && s.items.length > 0),
    );
    if (requestedSections.length > 0) {
      const allowedFilenames = new Set(
        requestedSections.map((key) => SECTION_KEYS[key]).filter(Boolean),
      );
      activeSections = activeSections.filter((s) =>
        allowedFilenames.has(s.filename),
      );
    }

    // ── Render + Write ────────────────────────────────────────────────────
    mkdirSync(outputDir, { recursive: true });

    for (const section of activeSections) {
      const { svg, height } = renderSection(
        section.title,
        section.subtitle,
        section.renderBody || section.items || [],
        section.options || {},
      );
      writeFileSync(
        `${outputDir}/${section.filename}`,
        wrapSectionSvg(svg, height),
      );
      core.info(`Wrote ${outputDir}/${section.filename}`);
    }

    const combinedSvg = generateFullSvg(activeSections);
    writeFileSync(`${outputDir}/index.svg`, combinedSvg);
    core.info(`Wrote ${outputDir}/index.svg`);

    // ── README ─────────────────────────────────────────────────────────────
    if (readmePath && readmePath !== "none") {
      const svgDir = relative(dirname(readmePath), outputDir) || ".";

      let preamble = loadPreamble(userConfig.preamble);

      if (!preamble) {
        core.info("No PREAMBLE.md found, generating with AI...");
        preamble = await fetchAIPreamble(token, {
          username,
          profile: userProfile,
          userConfig,
          languages,
          techHighlights,
          activeProjects,
          complexProjects,
        });
      }

      const svgs = indexOnly
        ? [{ label: "GitHub Metrics", path: `${svgDir}/index.svg` }]
        : activeSections.map((s) => ({
            label: s.title,
            path: `${svgDir}/${s.filename}`,
          }));

      // Build section SVG path map for templates
      const sectionSvgs: Record<string, string> = {};
      for (const [key, filename] of Object.entries(SECTION_KEYS)) {
        if (activeSections.some((s) => s.filename === filename)) {
          sectionSvgs[key] = `${svgDir}/${filename}`;
        }
      }

      const displayName = userConfig.name || userProfile.name || username;
      const socialBadges = buildSocialBadges(userProfile);

      {
        const template = getTemplate(templateName);
        const readme = template({
          username,
          name: displayName,
          firstName: extractFirstName(displayName),
          pronunciation: userConfig.pronunciation,
          title: userConfig.title,
          bio: userConfig.bio,
          preamble,
          svgs,
          sectionSvgs,
          profile: userProfile,
          activeProjects,
          maintainedProjects,
          inactiveProjects,
          allProjects: complexProjects,
          languages,
          techHighlights,
          contributionData,
          socialBadges,
          svgDir,
        });
        writeFileSync(readmePath, readme);
      }

      core.info(`Wrote ${readmePath} (template: ${templateName})`);

      // ── Local template previews ──────────────────────────────────────────
      if (!process.env.CI) {
        const allTemplateNames: TemplateName[] = [
          "classic",
          "modern",
          "minimal",
        ];
        for (const tplName of allTemplateNames) {
          const tplDir = `examples/${tplName}`;
          mkdirSync(tplDir, { recursive: true });

          // Copy SVGs into the subfolder
          copyFileSync(`${outputDir}/index.svg`, `${tplDir}/index.svg`);
          for (const section of activeSections) {
            copyFileSync(
              `${outputDir}/${section.filename}`,
              `${tplDir}/${section.filename}`,
            );
          }

          const previewSvgs = indexOnly
            ? [{ label: "GitHub Metrics", path: `./index.svg` }]
            : activeSections.map((s) => ({
                label: s.title,
                path: `./${s.filename}`,
              }));

          const previewSectionSvgs: Record<string, string> = {};
          for (const [key, filename] of Object.entries(SECTION_KEYS)) {
            if (activeSections.some((s) => s.filename === filename)) {
              previewSectionSvgs[key] = `./${filename}`;
            }
          }

          const template = getTemplate(tplName);
          const output = template({
            username,
            name: displayName,
            firstName: extractFirstName(displayName),
            pronunciation: userConfig.pronunciation,
            title: userConfig.title,
            bio: userConfig.bio,
            preamble,
            svgs: previewSvgs,
            sectionSvgs: previewSectionSvgs,
            profile: userProfile,
            activeProjects,
            maintainedProjects,
            inactiveProjects,
            allProjects: complexProjects,
            languages,
            techHighlights,
            contributionData,
            socialBadges,
            svgDir: ".",
          });

          const previewPath = `${tplDir}/README.md`;
          writeFileSync(previewPath, output);
          core.info(`Wrote ${previewPath} (template preview: ${tplName})`);
        }
      }
    }

    // ── Commit + Push ─────────────────────────────────────────────────────
    if (commitPush) {
      await exec.exec("git", ["config", "user.name", commitName]);
      await exec.exec("git", ["config", "user.email", commitEmail]);
      const filesToAdd = [`${outputDir}/`];
      if (readmePath && readmePath !== "none") {
        filesToAdd.push(readmePath);
      }
      await exec.exec("git", ["add", ...filesToAdd]);

      const diffResult = await exec.exec(
        "git",
        ["diff", "--staged", "--quiet"],
        { ignoreReturnCode: true },
      );

      if (diffResult !== 0) {
        await exec.exec("git", ["commit", "-m", commitMessage]);
        await exec.exec("git", ["push"]);
        core.info("Changes committed and pushed.");
      } else {
        core.info("No changes to commit.");
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    core.setFailed(msg);
  }
}

run();
