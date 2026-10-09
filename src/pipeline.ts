import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
import { type AIEndpoint, isAIDisabled, probeAIEndpoint } from "./ai.js";
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
import { ErrorCode, InsightsError } from "./errors.js";
import {
  buildExamplesGallery,
  buildExamplesHtmlGallery,
  EXAMPLE_TEMPLATE_PRESETS,
} from "./examples.js";
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
import type {
  RepoClassificationOutput,
  SectionDef,
  TemplateName,
} from "./types.js";

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
  /** One-off notice the user should see even in quiet mode (e.g. AI disabled). */
  onNotice(message: string): void;
  onError(error: Error): void;
}

export interface PipelineConfig {
  token: string;
  /** OpenAI-compatible endpoint for AI summaries and classification. */
  ai: AIEndpoint;
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
  exportJson: boolean;
  cache?: boolean;
  examplesDir?: string;
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

  const prompts = resolvePrompts(userConfig.ai, config.ai);

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
  const exportJson = config.exportJson || userConfig.export_json || false;
  const cacheEnabled = config.cache !== false && userConfig.cache !== false;
  const aiCache = cacheEnabled
    ? AICache.load(`${config.outputDir}/.ai-cache.json`)
    : undefined;

  // Checked lazily (cache hits need no endpoint) and at most once, so an
  // unreachable or unset endpoint yields a single notice, not one per task.
  let aiGate: Promise<boolean> | undefined;
  const aiAvailable = (): Promise<boolean> => {
    aiGate ??= (async () => {
      const reason = isAIDisabled(config.ai)
        ? "no AI endpoint configured (ai-base-url is empty)"
        : await probeAIEndpoint(config.ai);
      if (!reason) return true;
      if (failFast) {
        throw new InsightsError(
          `AI unavailable: ${reason}`,
          ErrorCode.AI_UNAVAILABLE,
        );
      }
      cb.onNotice(
        `AI disabled: ${reason}. Generating SVGs without AI summaries or classification.`,
      );
      return false;
    })();
    return aiGate;
  };

  cb.onPhaseStart("classify", "Classifying projects");
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
    cb.onProgress("Classification inputs unchanged, using cached AI results");
  } else if (await aiAvailable()) {
    try {
      aiClassifications = await fetchProjectClassifications(
        config.ai,
        classificationInputs,
        prompts.classification,
      );
      aiCache?.set("classifications", classificationHash, aiClassifications);
    } catch (err) {
      if (failFast) throw err;
      const msg =
        err instanceof InsightsError
          ? `${err.message} [${err.code}]`
          : String(err);
      cb.onProgress(`AI classification unavailable (${msg}), using heuristics`);
    }
  }

  cb.onPhaseComplete(
    "classify",
    `${aiClassifications.length} AI-classified${cachedClassifications ? " (cached)" : ""}, ${repos.length - aiClassifications.length} heuristic`,
  );

  // ── Transform ─────────────────────────────────────────────────────────────
  cb.onPhaseStart("transform", "Computing metrics");
  const displayName = userConfig.name || userProfile.name || config.username;
  const constellationGroupBy = userConfig.constellation_group_by || "language";

  const report = buildInsightsReport({
    username: config.username,
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

  const getActiveSectionsFor = (sections: readonly string[]): SectionDef[] => {
    const svgSectionsNeeded = new Set(
      sections.filter((s) =>
        (SVG_SECTION_KEYS as readonly string[]).includes(s),
      ),
    );
    let sectionsForPreset = sectionDefs.filter((s) => s.renderBody);
    if (svgSectionsNeeded.size === 0) return sectionsForPreset;

    const allowedFilenames = new Set(
      [...svgSectionsNeeded].map((key) => SECTION_KEYS[key]).filter(Boolean),
    );
    sectionsForPreset = sectionsForPreset.filter((s) =>
      allowedFilenames.has(s.filename),
    );
    return sectionsForPreset;
  };

  const activeSections = getActiveSectionsFor(resolvedSections);
  cb.onPhaseComplete("transform", `${activeSections.length} sections`);

  const writeSvgSet = (
    targetDir: string,
    sections: SectionDef[],
    options: { includeJson?: boolean; logFiles?: boolean } = {},
  ): void => {
    mkdirSync(targetDir, { recursive: true });

    for (const section of sections) {
      if (!section.renderBody) continue;
      const { svg, height } = renderSection(
        section.title,
        section.subtitle,
        section.renderBody,
      );
      writeFileSync(
        `${targetDir}/${section.filename}`,
        wrapSectionSvg(svg, height, "dark"),
      );
      const lightFilename = section.filename.replace(/\.svg$/, "-light.svg");
      writeFileSync(
        `${targetDir}/${lightFilename}`,
        wrapSectionSvg(svg, height, "light"),
      );
      if (options.includeJson && section.data !== undefined) {
        const jsonFilename = section.filename.replace(/\.svg$/, ".json");
        writeFileSync(
          `${targetDir}/${jsonFilename}`,
          JSON.stringify(section.data, null, 2),
        );
        if (options.logFiles) cb.onProgress(`Wrote ${jsonFilename}`);
      }
      if (options.logFiles) cb.onProgress(`Wrote ${section.filename} (+light)`);
    }

    writeFileSync(`${targetDir}/index.svg`, generateFullSvg(sections, "dark"));
    writeFileSync(
      `${targetDir}/index-light.svg`,
      generateFullSvg(sections, "light"),
    );
  };

  // ── Render SVGs ───────────────────────────────────────────────────────────
  cb.onPhaseStart("render-svg", "Rendering SVGs");
  writeSvgSet(config.outputDir, activeSections, {
    includeJson: exportJson,
    logFiles: true,
  });
  cb.onPhaseComplete(
    "render-svg",
    `${activeSections.length * 2 + 2} SVG files`,
  );

  // ── Write files ───────────────────────────────────────────────────────────
  cb.onPhaseStart("write-files", "Writing output files");
  const filesWritten: string[] = [`${config.outputDir}/index.svg`];
  for (const s of activeSections) {
    filesWritten.push(`${config.outputDir}/${s.filename}`);
  }
  cb.onPhaseComplete("write-files", `${filesWritten.length} files`);

  // ── README + local examples ──────────────────────────────────────────────
  const shouldWriteReadme = Boolean(
    config.readmePath && config.readmePath !== "none",
  );
  const shouldWriteExamples = Boolean(
    !process.env.CI && config.examplesDir && config.examplesDir !== "none",
  );

  if (shouldWriteReadme || shouldWriteExamples) {
    cb.onPhaseStart(
      "generate-readme",
      shouldWriteReadme ? "Generating README" : "Generating examples",
    );

    const socialBadges = buildSocialBadges(userProfile);
    let preamble = loadPreamble(userConfig.preamble);
    if (!preamble) {
      const preambleContext = {
        username: config.username,
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
        cb.onProgress("Preamble inputs unchanged, using cached AI preamble");
      } else if (await aiAvailable()) {
        cb.onProgress("Generating preamble with AI...");
        try {
          preamble = await fetchAIPreamble(
            config.ai,
            preambleContext,
            prompts.preamble,
          );
          aiCache?.set("preamble", preambleHash, preamble);
        } catch (err) {
          if (failFast) throw err;
          const msg =
            err instanceof InsightsError
              ? `${err.message} [${err.code}]`
              : String(err);
          cb.onProgress(`AI preamble unavailable (${msg}), using fallback`);
        }
      }
    }
    preamble ||= userConfig.bio || userProfile.bio || "";

    const buildSvgRefs = (sections: SectionDef[], svgDir: string) => {
      const svgs = sections.map((s) => ({
        label: s.title,
        path: `${svgDir}/${s.filename}`,
      }));

      const sectionSvgs: Record<string, string> = {};
      const sectionSvgsLight: Record<string, string> = {};
      for (const [key, filename] of Object.entries(SECTION_KEYS)) {
        if (sections.some((s) => s.filename === filename)) {
          sectionSvgs[key] = `${svgDir}/${filename}`;
          sectionSvgsLight[key] =
            `${svgDir}/${filename.replace(/\.svg$/, "-light.svg")}`;
        }
      }

      return { svgs, sectionSvgs, sectionSvgsLight };
    };

    const contextBase = {
      username: config.username,
      name: displayName,
      firstName: extractFirstName(displayName),
      pronunciation: userConfig.pronunciation,
      title: userConfig.title,
      bio: userConfig.bio,
      preamble,
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
    };

    const renderReadme = (
      readmeTemplateName: TemplateName,
      sections: SectionDef[],
      readmeSections: ReturnType<typeof resolveTemplateSections>,
      svgDir: string,
    ): string => {
      const template = getTemplate(readmeTemplateName);
      const svgRefs = buildSvgRefs(sections, svgDir);
      return template({
        ...contextBase,
        ...svgRefs,
        templateName: readmeTemplateName,
        resolvedSections: readmeSections,
        svgDir,
      });
    };

    if (shouldWriteReadme) {
      const svgDir =
        relative(dirname(config.readmePath), config.outputDir) || ".";
      const readme = renderReadme(
        templateName,
        activeSections,
        resolvedSections,
        svgDir,
      );
      writeFileSync(config.readmePath, readme);
    }

    if (shouldWriteExamples && config.examplesDir) {
      const examplePresets = EXAMPLE_TEMPLATE_PRESETS.map((presetName) => {
        const presetSections = resolveTemplateSections(presetName);
        const presetActiveSections = getActiveSectionsFor(presetSections);
        const presetDir = `${config.examplesDir}/${presetName}`;

        writeSvgSet(presetDir, presetActiveSections);
        writeFileSync(
          `${presetDir}/README.md`,
          renderReadme(presetName, presetActiveSections, presetSections, "."),
        );
        cb.onProgress(`Preview at ${presetDir}/README.md`);

        return { name: presetName, sections: presetSections };
      });

      writeFileSync(
        `${config.examplesDir}/README.md`,
        buildExamplesGallery({
          username: config.username,
          configPath: config.configPath,
          presets: examplePresets,
        }),
      );
      writeFileSync(
        `${config.examplesDir}/index.html`,
        buildExamplesHtmlGallery({
          username: config.username,
          configPath: config.configPath,
          presets: examplePresets,
        }),
      );
      cb.onProgress(`Gallery at ${config.examplesDir}/README.md`);
      cb.onProgress(`Browser gallery at ${config.examplesDir}/index.html`);
    }

    const outputs = [
      ...(shouldWriteReadme ? [config.readmePath] : []),
      ...(shouldWriteExamples && config.examplesDir
        ? [
            `${config.examplesDir}/README.md`,
            `${config.examplesDir}/index.html`,
          ]
        : []),
    ];
    cb.onPhaseComplete("generate-readme", outputs.join(", "));
  }

  // Persist AI outputs so unchanged inputs skip model calls next run.
  aiCache?.save();

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
