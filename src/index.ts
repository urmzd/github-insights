import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { writeFileSync, mkdirSync } from "fs";
import {
  fetchAllRepoData,
  fetchManifestsForRepos,
  fetchContributionData,
  fetchReadmeForRepos,
  fetchDomainAnalysis,
} from "./api.js";
import {
  aggregateLanguages,
  classifyDependencies,
  computeComplexityScores,
  subClassify,
  computeRecentlyActive,
  markRecentlyActive,
  aggregateDomains,
  buildSections,
} from "./metrics.js";
import { renderSection } from "./components/section.js";
import { wrapSectionSvg, generateFullSvg } from "./components/full-svg.js";

async function run(): Promise<void> {
  try {
    const token =
      core.getInput("github-token") || process.env.GITHUB_TOKEN || "";
    const username =
      core.getInput("username") || process.env.GITHUB_REPOSITORY_OWNER || "";
    const outputDir = core.getInput("output-dir") || "metrics";
    const commitPush = (core.getInput("commit-push") || "true") === "true";
    const commitMessage =
      core.getInput("commit-message") || "chore: update metrics";
    const commitName = core.getInput("commit-name") || "github-actions[bot]";
    const commitEmail =
      core.getInput("commit-email") ||
      "41898282+github-actions[bot]@users.noreply.github.com";

    if (!token) {
      core.setFailed("github-token is required");
      return;
    }
    if (!username) {
      core.setFailed("username is required");
      return;
    }

    // ── Fetch ─────────────────────────────────────────────────────────────
    core.info("Fetching repo data...");
    const repos = await fetchAllRepoData(token, username);
    core.info(`Found ${repos.length} public repos`);

    core.info("Fetching dependency manifests...");
    const manifests = await fetchManifestsForRepos(token, username, repos);
    core.info(`Fetched manifests for ${manifests.size} repos`);

    core.info("Fetching contribution data...");
    const contributionData = await fetchContributionData(token, username);
    core.info(
      `Contributions: ${contributionData.contributions.totalCommitContributions} commits, ${contributionData.contributions.totalPullRequestContributions} PRs`,
    );

    core.info("Fetching READMEs...");
    const readmeMap = await fetchReadmeForRepos(token, username, repos);
    core.info(`Fetched READMEs for ${readmeMap.size} repos`);

    core.info("Fetching domain analysis from GitHub Models...");
    const domainMap = await fetchDomainAnalysis(token, repos, readmeMap);
    core.info(`Domain analysis: ${domainMap.size} repos tagged`);

    // ── Transform ─────────────────────────────────────────────────────────
    const languages = aggregateLanguages(repos);
    const categories = classifyDependencies(repos, manifests);
    const complexity = computeComplexityScores(repos);

    const recentlyActiveSet = computeRecentlyActive(
      contributionData.contributions.commitContributionsByRepository,
      repos,
    );

    markRecentlyActive(
      [languages, categories.frameworks, categories.dbInfra, complexity],
      recentlyActiveSet,
    );

    const domains = aggregateDomains(domainMap);

    const { webFrameworks, mlAi, databases, cloudInfra } = subClassify(
      categories.frameworks,
      categories.dbInfra,
    );

    const sectionDefs = buildSections({
      languages,
      webFrameworks,
      mlAi,
      databases,
      cloudInfra,
      complexity,
      domains,
      domainMap,
      contributionData,
    });

    const activeSections = sectionDefs.filter(
      (s) => s.renderBody || (s.items && s.items.length > 0),
    );

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

    // ── Commit + Push ─────────────────────────────────────────────────────
    if (commitPush) {
      await exec.exec("git", ["config", "user.name", commitName]);
      await exec.exec("git", ["config", "user.email", commitEmail]);
      await exec.exec("git", ["add", `${outputDir}/`]);

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
