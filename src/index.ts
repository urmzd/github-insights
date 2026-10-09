import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { resolveAIEndpoint } from "./ai.js";
import { AICache, hashAIInputs } from "./ai-cache.js";
import {
  fetchAIPreamble,
  fetchAllRepoData,
  fetchContributionData,
  fetchProjectClassifications,
  fetchUserProfile,
  makeGraphql,
} from "./api.js";
import { generateFullSvg, wrapSectionSvg } from "./components/full-svg.js";
import { renderSection } from "./components/section.js";
import { loadUserConfig, resolveTemplateSections } from "./config.js";
import { getExitCode, InsightsError } from "./errors.js";
import {
  buildClassificationInputs,
  buildInsightsReport,
  buildSections,
  SECTION_KEYS,
  SVG_SECTION_KEYS,
} from "./metrics.js";
import { resolvePrompts } from "./prompts.js";
import { loadPreamble } from "./readme.js";
import {
  buildSocialBadges,
  extractFirstName,
  getTemplate,
} from "./templates.js";
import type { RepoClassificationOutput, TemplateName } from "./types.js";

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
    const ai = resolveAIEndpoint({
      baseUrl: core.getInput("ai-base-url"),
      model: core.getInput("ai-model"),
      apiKey: core.getInput("ai-api-key"),
      reasoningEffort: core.getInput("ai-reasoning-effort"),
    });
    const prompts = resolvePrompts(userConfig.ai, ai);
    const cacheEnabled =
      (core.getInput("cache") || "true") === "true" &&
      userConfig.cache !== false;
    const aiCache = cacheEnabled
      ? AICache.load(`${outputDir}/.ai-cache.json`)
      : undefined;

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
    core.info("Fetching project classifications from the AI endpoint...");
    const classificationInputs = buildClassificationInputs(
      repos,
      contributionData,
    );

    const classificationHash = hashAIInputs(
      "classifications",
      classificationInputs,
      prompts.classification,
    );
    let aiClassifications: RepoClassificationOutput[] = [];
    const cachedClassifications = aiCache?.get<RepoClassificationOutput[]>(
      "classifications",
      classificationHash,
    );
    if (cachedClassifications) {
      aiClassifications = cachedClassifications;
      core.info("Classification inputs unchanged, using cached AI results");
    } else {
      try {
        aiClassifications = await fetchProjectClassifications(
          ai,
          classificationInputs,
          prompts.classification,
        );
        aiCache?.set("classifications", classificationHash, aiClassifications);
      } catch (err) {
        const msg =
          err instanceof InsightsError
            ? `${err.message} [${err.code}]`
            : String(err);
        core.warning(
          `AI classification unavailable (${msg}), using heuristics`,
        );
      }
    }
    core.info(
      `Project classifications: ${aiClassifications.length} AI-classified (${repos.length - aiClassifications.length} heuristic fallback)`,
    );

    const displayName = userConfig.name || userProfile.name || username;
    const constellationGroupBy =
      userConfig.constellation_group_by || "language";

    const report = buildInsightsReport({
      username,
      displayName,
      profile: userProfile,
      repos,
      contributionData,
      aiClassifications,
      constellationGroupBy,
      excludeArchived: userConfig.exclude_archived !== false,
    });

    const sectionDefs = buildSections({
      velocity: report.velocity,
      rhythm: report.rhythm,
      constellation: report.constellation,
      stack: report.stack,
      contributionData: report.contributionData,
      constellationGroupBy: report.constellationGroupBy,
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
        wrapSectionSvg(svg, height, "dark"),
      );
      const lightFilename = section.filename.replace(/\.svg$/, "-light.svg");
      writeFileSync(
        `${outputDir}/${lightFilename}`,
        wrapSectionSvg(svg, height, "light"),
      );
      core.info(`Wrote ${outputDir}/${section.filename} (+light)`);
    }

    writeFileSync(
      `${outputDir}/index.svg`,
      generateFullSvg(activeSections, "dark"),
    );
    writeFileSync(
      `${outputDir}/index-light.svg`,
      generateFullSvg(activeSections, "light"),
    );
    core.info(`Wrote ${outputDir}/index.svg (+light)`);

    // ── README ─────────────────────────────────────────────────────────────
    if (readmePath && readmePath !== "none") {
      const svgDir = relative(dirname(readmePath), outputDir) || ".";

      const socialBadges = buildSocialBadges(userProfile);

      let preamble = loadPreamble(userConfig.preamble);

      if (!preamble) {
        const preambleContext = {
          username,
          profile: userProfile,
          userConfig,
          languages: report.languages,
          spotlightProjects: report.spotlightProjects,
          complexProjects: report.allProjects,
        };
        const preambleHash = hashAIInputs(
          "preamble",
          preambleContext,
          prompts.preamble,
        );
        preamble = aiCache?.get<string>("preamble", preambleHash);
        if (preamble) {
          core.info("Preamble inputs unchanged, using cached AI preamble");
        } else {
          core.info("No PREAMBLE.md found, generating with AI...");
          try {
            preamble = await fetchAIPreamble(
              ai,
              preambleContext,
              prompts.preamble,
            );
            aiCache?.set("preamble", preambleHash, preamble);
          } catch (err) {
            const msg =
              err instanceof InsightsError
                ? `${err.message} [${err.code}]`
                : String(err);
            core.warning(`AI preamble unavailable (${msg}), skipping`);
          }
        }
      }

      const svgs = activeSections.map((s) => ({
        label: s.title,
        path: `${svgDir}/${s.filename}`,
      }));

      const sectionSvgs: Record<string, string> = {};
      const sectionSvgsLight: Record<string, string> = {};
      for (const [key, filename] of Object.entries(SECTION_KEYS)) {
        if (activeSections.some((s) => s.filename === filename)) {
          sectionSvgs[key] = `${svgDir}/${filename}`;
          sectionSvgsLight[key] =
            `${svgDir}/${filename.replace(/\.svg$/, "-light.svg")}`;
        }
      }

      const contextBase = {
        username,
        name: displayName,
        firstName: extractFirstName(displayName),
        pronunciation: userConfig.pronunciation,
        title: userConfig.title,
        bio: userConfig.bio,
        preamble,
        templateName,
        profile: userProfile,
        activeProjects: report.activeProjects,
        maintainedProjects: report.maintainedProjects,
        inactiveProjects: report.inactiveProjects,
        archivedProjects: report.archivedProjects,
        allProjects: report.allProjects,
        categorizedProjects: report.categorizedProjects,
        languages: report.languages,
        velocity: report.velocity,
        rhythm: report.rhythm,
        constellation: report.constellation,
        stack: report.stack,
        contributionData: report.contributionData,
        socialBadges,
        spotlightProjects: report.spotlightProjects,
        resolvedSections,
      };

      {
        const template = getTemplate(templateName);
        const readme = template({
          ...contextBase,
          svgs,
          sectionSvgs,
          sectionSvgsLight,
          svgDir,
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
        copyFileSync(
          `${outputDir}/index-light.svg`,
          `${tplDir}/index-light.svg`,
        );
        for (const section of activeSections) {
          copyFileSync(
            `${outputDir}/${section.filename}`,
            `${tplDir}/${section.filename}`,
          );
          const lightFilename = section.filename.replace(
            /\.svg$/,
            "-light.svg",
          );
          copyFileSync(
            `${outputDir}/${lightFilename}`,
            `${tplDir}/${lightFilename}`,
          );
        }

        const previewSvgs = activeSections.map((s) => ({
          label: s.title,
          path: `./${s.filename}`,
        }));

        const previewSectionSvgs: Record<string, string> = {};
        const previewSectionSvgsLight: Record<string, string> = {};
        for (const [key, filename] of Object.entries(SECTION_KEYS)) {
          if (activeSections.some((s) => s.filename === filename)) {
            previewSectionSvgs[key] = `./${filename}`;
            previewSectionSvgsLight[key] =
              `./${filename.replace(/\.svg$/, "-light.svg")}`;
          }
        }

        const template = getTemplate(templateName);
        const output = template({
          ...contextBase,
          svgs: previewSvgs,
          sectionSvgs: previewSectionSvgs,
          sectionSvgsLight: previewSectionSvgsLight,
          svgDir: ".",
        });

        const previewPath = `${tplDir}/README.md`;
        writeFileSync(previewPath, output);
        core.info(`Wrote ${previewPath} (preview)`);
      }
    }

    // Persist AI outputs so unchanged inputs skip model calls next run.
    aiCache?.save();

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
