import { execFile } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
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
import { InsightsError } from "./errors.js";
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

// ── Pipeline types ──────────────────────────────────────────────────────────

export type PipelinePhase =
  | "fetch-repos"
  | "fetch-profile"
  | "classify"
  | "transform"
  | "render-svg"
  | "write-files"
  | "generate-readme"
  | "commit-push";

export interface PipelineCallbacks {
  onPhaseStart(phase: PipelinePhase, label: string): void;
  onPhaseComplete(phase: PipelinePhase, summary: string): void;
  onProgress(message: string): void;
  onError(error: Error): void;
}

export interface PipelineConfig {
  token: string;
  username: string;
  outputDir: string;
  commitPush: boolean;
  commitMessage: string;
  commitName: string;
  commitEmail: string;
  configPath?: string;
  readmePath: string;
  templateName: TemplateName;
  requestedSections: string[];
  failFast: boolean;
}

// ── Git helper ──────────────────────────────────────────────────────────────

function git(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("git", args, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function gitQuiet(args: string[]): Promise<number> {
  return new Promise((resolve) => {
    execFile("git", args, (err) => {
      resolve(err ? 1 : 0);
    });
  });
}

// ── Pipeline ────────────────────────────────────────────────────────────────

export async function runPipeline(
  config: PipelineConfig,
  cb: PipelineCallbacks,
): Promise<void> {
  const userConfig = loadUserConfig(config.configPath);

  const templateName: TemplateName =
    config.templateName || userConfig.template || "showcase";
  const requestedSections =
    config.requestedSections.length > 0
      ? config.requestedSections
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

  const prompts = resolvePrompts(userConfig.ai);

  if (!config.token) throw new Error("github-token is required");
  if (!config.username) throw new Error("username is required");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const graphql = makeGraphql(config.token);

  cb.onPhaseStart("fetch-repos", "Fetching repositories");
  const repos = await fetchAllRepoData(graphql, config.username);
  cb.onPhaseComplete("fetch-repos", `${repos.length} public repos`);

  cb.onPhaseStart("fetch-profile", "Fetching contributions & profile");
  const [contributionData, userProfile] = await Promise.all([
    fetchContributionData(graphql, config.username),
    fetchUserProfile(graphql, config.username),
  ]);
  cb.onPhaseComplete(
    "fetch-profile",
    `${contributionData.contributions.totalCommitContributions} commits, ${contributionData.contributions.totalPullRequestContributions} PRs`,
  );

  // ── Classify ──────────────────────────────────────────────────────────────
  const failFast = config.failFast || userConfig.fail_fast || false;

  cb.onPhaseStart("classify", "Classifying projects");
  const languages = aggregateLanguages(repos);
  const complexProjects = getTopProjectsByComplexity(repos);
  const classificationInputs = buildClassificationInputs(
    repos,
    contributionData,
  );

  let aiClassifications: Awaited<
    ReturnType<typeof fetchProjectClassifications>
  > = [];
  try {
    aiClassifications = await fetchProjectClassifications(
      config.token,
      classificationInputs,
      prompts.classification,
    );
  } catch (err) {
    if (failFast) throw err;
    const msg =
      err instanceof InsightsError
        ? `${err.message} [${err.code}]`
        : String(err);
    cb.onProgress(`AI classification unavailable (${msg}), using heuristics`);
  }

  cb.onPhaseComplete(
    "classify",
    `${aiClassifications.length} AI-classified, ${repos.length - aiClassifications.length} heuristic`,
  );

  // ── Transform ─────────────────────────────────────────────────────────────
  cb.onPhaseStart("transform", "Computing metrics");
  const {
    active: activeProjects,
    maintained: maintainedProjects,
    inactive: inactiveProjects,
    archived: archivedProjects,
  } = splitProjectsByRecency(repos, contributionData, aiClassifications);

  const velocity = computeLanguageVelocity(contributionData, repos);
  const rhythm = computeContributionRhythm(contributionData);
  const constellation = computeConstellationLayout(complexProjects, repos);

  const sectionDefs = buildSections({
    velocity,
    rhythm,
    constellation,
    contributionData,
  });

  let activeSections = sectionDefs.filter((s) => s.renderBody);
  if (svgSectionsNeeded.size > 0) {
    const allowedFilenames = new Set(
      [...svgSectionsNeeded].map((key) => SECTION_KEYS[key]).filter(Boolean),
    );
    activeSections = activeSections.filter((s) =>
      allowedFilenames.has(s.filename),
    );
  }
  cb.onPhaseComplete("transform", `${activeSections.length} sections`);

  // ── Render SVGs ───────────────────────────────────────────────────────────
  cb.onPhaseStart("render-svg", "Rendering SVGs");
  mkdirSync(config.outputDir, { recursive: true });

  for (const section of activeSections) {
    if (!section.renderBody) continue;
    const { svg, height } = renderSection(
      section.title,
      section.subtitle,
      section.renderBody,
    );
    writeFileSync(
      `${config.outputDir}/${section.filename}`,
      wrapSectionSvg(svg, height),
    );
    cb.onProgress(`Wrote ${section.filename}`);
  }

  const combinedSvg = generateFullSvg(activeSections);
  writeFileSync(`${config.outputDir}/index.svg`, combinedSvg);
  cb.onPhaseComplete("render-svg", `${activeSections.length + 1} SVG files`);

  // ── Write files ───────────────────────────────────────────────────────────
  cb.onPhaseStart("write-files", "Writing output files");
  const filesWritten: string[] = [`${config.outputDir}/index.svg`];
  for (const s of activeSections) {
    filesWritten.push(`${config.outputDir}/${s.filename}`);
  }
  cb.onPhaseComplete("write-files", `${filesWritten.length} files`);

  // ── README ────────────────────────────────────────────────────────────────
  if (config.readmePath && config.readmePath !== "none") {
    cb.onPhaseStart("generate-readme", "Generating README");
    const svgDir =
      relative(dirname(config.readmePath), config.outputDir) || ".";

    const displayName = userConfig.name || userProfile.name || config.username;
    const socialBadges = buildSocialBadges(userProfile);
    const spotlightProjects = computeSpotlightProjects(
      repos,
      contributionData,
      aiClassifications,
    );

    let preamble = loadPreamble(userConfig.preamble);
    if (!preamble) {
      cb.onProgress("Generating preamble with AI...");
      try {
        preamble = await fetchAIPreamble(
          config.token,
          {
            username: config.username,
            profile: userProfile,
            userConfig,
            languages,
            spotlightProjects,
            complexProjects,
          },
          prompts.preamble,
        );
      } catch (err) {
        if (failFast) throw err;
        const msg =
          err instanceof InsightsError
            ? `${err.message} [${err.code}]`
            : String(err);
        cb.onProgress(`AI preamble unavailable (${msg}), skipping`);
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

    const template = getTemplate(templateName);
    const readme = template({
      username: config.username,
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
    writeFileSync(config.readmePath, readme);

    // Local template preview
    if (!process.env.CI) {
      const tplDir = "examples/default";
      mkdirSync(tplDir, { recursive: true });

      copyFileSync(`${config.outputDir}/index.svg`, `${tplDir}/index.svg`);
      for (const section of activeSections) {
        copyFileSync(
          `${config.outputDir}/${section.filename}`,
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

      const previewReadme = template({
        username: config.username,
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
      writeFileSync(`${tplDir}/README.md`, previewReadme);
      cb.onProgress(`Preview at ${tplDir}/README.md`);
    }

    cb.onPhaseComplete("generate-readme", config.readmePath);
  }

  // ── Commit + Push ─────────────────────────────────────────────────────────
  if (config.commitPush) {
    cb.onPhaseStart("commit-push", "Committing & pushing");
    await git(["config", "user.name", config.commitName]);
    await git(["config", "user.email", config.commitEmail]);

    const filesToAdd = [`${config.outputDir}/`];
    if (config.readmePath && config.readmePath !== "none") {
      filesToAdd.push(config.readmePath);
    }
    await git(["add", ...filesToAdd]);

    const diffResult = await gitQuiet(["diff", "--staged", "--quiet"]);
    if (diffResult !== 0) {
      await git(["commit", "-m", config.commitMessage]);
      await git(["push"]);
      cb.onPhaseComplete("commit-push", "Changes committed and pushed");
    } else {
      cb.onPhaseComplete("commit-push", "No changes to commit");
    }
  }
}
