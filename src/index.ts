import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import {
  fetchAIPreamble,
  fetchAllRepoData,
  fetchContributionData,
  fetchProjectClassifications,
  fetchUserProfile,
  makeGraphql,
} from "./api.js";
import { InsightsError, getExitCode } from "./errors.js";
import { generateFullSvg, wrapSectionSvg } from "./components/full-svg.js";
import { renderSection } from "./components/section.js";
import { loadUserConfig, resolveTemplateSections } from "./config.js";
import {
  aggregateLanguages,
  buildClassificationInputs,
  buildSections,
  computeConstellationLayout,
  computeContributionRhythm,
  computeLanguageVelocity,
  computeSpotlightProjects,
  getTopProjectsByComplexity,
  SECTION_KEYS,
  SVG_SECTION_KEYS,
  splitProjectsByRecency,
} from "./metrics.js";
import { resolvePrompts } from "./prompts.js";
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
    const userConfig = loadUserConfig(configPath);
    const prompts = resolvePrompts(userConfig.ai);

    // Template and sections from action inputs or config
    const templateName: TemplateName =
      (core.getInput("template") as TemplateName) ||
      userConfig.template ||
      "showcase";
    const sectionsInput = core.getInput("sections") || "";
    const requestedSections =
      sectionsInput.length > 0
        ? sectionsInput
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        : userConfig.sections || [];
    const resolvedSections = resolveTemplateSections(
      templateName,
      requestedSections,
    );
    const svgSectionsNeeded = new Set(
      resolvedSections.filter((s) =>
        (SVG_SECTION_KEYS as readonly string[]).includes(s),
      ),
    );

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

    core.info("Fetching contribution data...");
    core.info("Fetching user profile...");
    const [contributionData, userProfile] = await Promise.all([
      fetchContributionData(graphql, username),
      fetchUserProfile(graphql, username),
    ]);
    core.info(
      `Contributions: ${contributionData.contributions.totalCommitContributions} commits, ${contributionData.contributions.totalPullRequestContributions} PRs`,
    );
    core.info(`User profile: ${userProfile.name || username}`);

    // ── Transform ─────────────────────────────────────────────────────────
    const languages = aggregateLanguages(repos);
    const complexProjects = getTopProjectsByComplexity(repos);

    core.info("Fetching project classifications from GitHub Models...");
    const classificationInputs = buildClassificationInputs(
      repos,
      contributionData,
    );

    let aiClassifications: Awaited<
      ReturnType<typeof fetchProjectClassifications>
    > = [];
    try {
      aiClassifications = await fetchProjectClassifications(
        token,
        classificationInputs,
        prompts.classification,
      );
    } catch (err) {
      const msg = err instanceof InsightsError ? `${err.message} [${err.code}]` : String(err);
      core.warning(`AI classification unavailable (${msg}), using heuristics`);
    }
    core.info(
      `Project classifications: ${aiClassifications.length} AI-classified (${repos.length - aiClassifications.length} heuristic fallback)`,
    );

    const {
      active: activeProjects,
      maintained: maintainedProjects,
      inactive: inactiveProjects,
      archived: archivedProjects,
    } = splitProjectsByRecency(repos, contributionData, aiClassifications);

    // ── Compute new visualization data ───────────────────────────────────
    const velocity = computeLanguageVelocity(contributionData, repos);
    const rhythm = computeContributionRhythm(contributionData);
    const constellation = computeConstellationLayout(complexProjects, repos);

    const sectionDefs = buildSections({
      velocity,
      rhythm,
      constellation,
      contributionData,
    });

    // Filter SVG sections to only those needed by resolved sections
    let activeSections = sectionDefs.filter((s) => s.renderBody);
    if (svgSectionsNeeded.size > 0) {
      const allowedFilenames = new Set(
        [...svgSectionsNeeded].map((key) => SECTION_KEYS[key]).filter(Boolean),
      );
      activeSections = activeSections.filter((s) =>
        allowedFilenames.has(s.filename),
      );
    }

    // ── Render + Write ────────────────────────────────────────────────────
    mkdirSync(outputDir, { recursive: true });

    for (const section of activeSections) {
      if (!section.renderBody) continue;
      const { svg, height } = renderSection(
        section.title,
        section.subtitle,
        section.renderBody,
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

      const displayName = userConfig.name || userProfile.name || username;
      const socialBadges = buildSocialBadges(userProfile);
      const spotlightProjects = computeSpotlightProjects(
        repos,
        contributionData,
        aiClassifications,
      );

      let preamble = loadPreamble(userConfig.preamble);

      if (!preamble) {
        core.info("No PREAMBLE.md found, generating with AI...");
        try {
          preamble = await fetchAIPreamble(
            token,
            {
              username,
              profile: userProfile,
              userConfig,
              languages,
              spotlightProjects,
              complexProjects,
            },
            prompts.preamble,
          );
        } catch (err) {
          const msg = err instanceof InsightsError ? `${err.message} [${err.code}]` : String(err);
          core.warning(`AI preamble unavailable (${msg}), skipping`);
        }
      }

      const svgs = activeSections.map((s) => ({
        label: s.title,
        path: `${svgDir}/${s.filename}`,
      }));

      const sectionSvgs: Record<string, string> = {};
      for (const [key, filename] of Object.entries(SECTION_KEYS)) {
        if (activeSections.some((s) => s.filename === filename)) {
          sectionSvgs[key] = `${svgDir}/${filename}`;
        }
      }

      // Build categorized projects map
      const includeArchived = userConfig.exclude_archived === false;
      const allProjectItems = [
        ...activeProjects,
        ...maintainedProjects,
        ...inactiveProjects,
        ...(includeArchived ? archivedProjects : []),
      ];
      const categorizedProjects: Record<string, typeof allProjectItems> = {};
      for (const project of allProjectItems) {
        const cat = project.category || "Other";
        if (!categorizedProjects[cat]) categorizedProjects[cat] = [];
        categorizedProjects[cat].push(project);
      }

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
          templateName,
          svgs,
          sectionSvgs,
          profile: userProfile,
          activeProjects,
          maintainedProjects,
          inactiveProjects,
          archivedProjects,
          allProjects: complexProjects,
          categorizedProjects,
          languages,
          velocity,
          rhythm,
          constellation,
          contributionData,
          socialBadges,
          svgDir,
          spotlightProjects,
          resolvedSections,
        });
        writeFileSync(readmePath, readme);
      }

      core.info(
        `Wrote ${readmePath} (sections: ${resolvedSections.join(", ")})`,
      );

      // ── Local template preview ───────────────────────────────────────────
      if (!process.env.CI) {
        const tplDir = "examples/default";
        mkdirSync(tplDir, { recursive: true });

        copyFileSync(`${outputDir}/index.svg`, `${tplDir}/index.svg`);
        for (const section of activeSections) {
          copyFileSync(
            `${outputDir}/${section.filename}`,
            `${tplDir}/${section.filename}`,
          );
        }

        const previewSvgs = activeSections.map((s) => ({
          label: s.title,
          path: `./${s.filename}`,
        }));

        const previewSectionSvgs: Record<string, string> = {};
        for (const [key, filename] of Object.entries(SECTION_KEYS)) {
          if (activeSections.some((s) => s.filename === filename)) {
            previewSectionSvgs[key] = `./${filename}`;
          }
        }

        const template = getTemplate(templateName);
        const output = template({
          username,
          name: displayName,
          firstName: extractFirstName(displayName),
          pronunciation: userConfig.pronunciation,
          title: userConfig.title,
          bio: userConfig.bio,
          preamble,
          templateName,
          svgs: previewSvgs,
          sectionSvgs: previewSectionSvgs,
          profile: userProfile,
          activeProjects,
          maintainedProjects,
          inactiveProjects,
          archivedProjects,
          allProjects: complexProjects,
          categorizedProjects,
          languages,
          velocity,
          rhythm,
          constellation,
          contributionData,
          socialBadges,
          svgDir: ".",
          spotlightProjects,
          resolvedSections,
        });

        const previewPath = `${tplDir}/README.md`;
        writeFileSync(previewPath, output);
        core.info(`Wrote ${previewPath} (preview)`);
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
    const code = error instanceof InsightsError ? error.code : undefined;
    const msg = error instanceof Error ? error.message : String(error);
    core.setFailed(code ? `[${code}] ${msg}` : msg);
    process.exitCode = getExitCode(error);
  }
}

run();
