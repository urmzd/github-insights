import { renderContributionCalendar } from "./components/contribution-calendar.js";
import { renderContributionCards } from "./components/contribution-cards.js";
import { renderDonutChart } from "./components/donut-chart.js";
import { renderProjectCards } from "./components/project-cards.js";
import { renderStatCards } from "./components/stat-cards.js";
import { renderTechHighlights } from "./components/tech-highlights.js";
import { parseManifest } from "./parsers.js";
import type {
  ContributionData,
  LanguageItem,
  ManifestMap,
  ProjectItem,
  RepoNode,
  SectionDef,
  TechHighlight,
} from "./types.js";

// ── Category Sets ───────────────────────────────────────────────────────────

const EXCLUDED_LANGUAGES = new Set(["Jupyter Notebook"]);

// ── Section keys ────────────────────────────────────────────────────────────

export const SECTION_KEYS: Record<string, string> = {
  pulse: "metrics-pulse.svg",
  languages: "metrics-languages.svg",
  expertise: "metrics-expertise.svg",
  projects: "metrics-complexity.svg",
  contributions: "metrics-contributions.svg",
  calendar: "metrics-calendar.svg",
};

// ── Aggregation ─────────────────────────────────────────────────────────────

export const aggregateLanguages = (repos: RepoNode[]): LanguageItem[] => {
  const langBytes = new Map<string, number>();
  const langColors = new Map<string, string>();

  for (const repo of repos) {
    for (const edge of repo.languages?.edges || []) {
      const name = edge.node.name;
      if (EXCLUDED_LANGUAGES.has(name)) continue;
      langBytes.set(name, (langBytes.get(name) || 0) + edge.size);
      if (!langColors.has(name)) langColors.set(name, edge.node.color);
    }
  }

  const total = [...langBytes.values()].reduce((a, b) => a + b, 0);
  return [...langBytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, bytes]) => ({
      name,
      value: bytes,
      percent: ((bytes / total) * 100).toFixed(1),
      color: langColors.get(name) || "#8b949e",
    }));
};

// ── Dependency & Topic Collection ────────────────────────────────────────────

export const collectAllDependencies = (
  repos: RepoNode[],
  manifests: ManifestMap,
): string[] => {
  const seen = new Set<string>();
  for (const repo of repos) {
    const files = manifests.get(repo.name) || {};
    for (const [filename, text] of Object.entries(files)) {
      for (const dep of parseManifest(filename, text)) {
        seen.add(dep);
      }
    }
  }
  return [...seen].sort();
};

export const collectAllTopics = (repos: RepoNode[]): string[] => {
  const seen = new Set<string>();
  for (const repo of repos) {
    for (const node of repo.repositoryTopics?.nodes || []) {
      seen.add(node.topic.name);
    }
  }
  return [...seen].sort();
};

// ── Project complexity scoring ──────────────────────────────────────────────

const repoLanguages = (repo: RepoNode): string[] =>
  repo.languages.edges.map((e) => e.node.name);

export const complexityScore = (repo: RepoNode): number => {
  const langCount = repo.languages.edges.length;
  const sizeMb = repo.diskUsage / 1024;
  const stars = repo.stargazerCount;
  const topics = repo.repositoryTopics.nodes.length;

  // Weighted sum: language diversity matters most, then code size, then
  // social proof (stars) and topic breadth as tie-breakers.
  return langCount * 10 + Math.min(sizeMb, 50) * 2 + Math.log2(stars + 1) * 3 + topics * 2;
};

const toProjectItem = (repo: RepoNode): ProjectItem => ({
  name: repo.name,
  url: repo.url,
  description: repo.description || "",
  stars: repo.stargazerCount,
  languageCount: repo.languages.edges.length,
  codeSize: repo.diskUsage,
  languages: repoLanguages(repo),
});

// ── Top Projects by Stars ───────────────────────────────────────────────────

export const getTopProjectsByStars = (repos: RepoNode[]): ProjectItem[] =>
  [...repos]
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 5)
    .map(toProjectItem);

// ── Top Projects by Complexity ─────────────────────────────────────────────

export const getTopProjectsByComplexity = (repos: RepoNode[]): ProjectItem[] => {
  const sorted = [...repos].sort((a, b) => complexityScore(b) - complexityScore(a));
  for (const repo of sorted) {
    console.info(`[complexity] ${repo.name}: ${complexityScore(repo).toFixed(1)} (${repo.languages.edges.length} langs, ${repo.diskUsage}KB)`);
  }
  return sorted.map(toProjectItem);
};

// ── Project recency split ───────────────────────────────────────────────────

const ACTIVE_COMMIT_THRESHOLD = 5;

export const splitProjectsByRecency = (
  repos: RepoNode[],
  contributionData: ContributionData,
): { active: ProjectItem[]; legacy: ProjectItem[] } => {
  const commitMap = new Map<string, number>();
  for (const entry of contributionData.commitContributionsByRepository || []) {
    commitMap.set(entry.repository.name, entry.contributions.totalCount);
  }

  const activeRepos: RepoNode[] = [];
  const legacyRepos: RepoNode[] = [];

  for (const repo of repos) {
    const commits = commitMap.get(repo.name) || 0;
    if (commits >= ACTIVE_COMMIT_THRESHOLD) {
      activeRepos.push(repo);
      console.info(`[active]  ${repo.name} (${commits} commits, complexity=${complexityScore(repo).toFixed(1)})`);
    } else {
      legacyRepos.push(repo);
      console.info(`[legacy]  ${repo.name} (${commits} commits, complexity=${complexityScore(repo).toFixed(1)})`);
    }
  }

  console.info(`Split: ${activeRepos.length} active, ${legacyRepos.length} legacy (threshold: ${ACTIVE_COMMIT_THRESHOLD} commits)`);

  const active: ProjectItem[] = activeRepos
    .sort((a, b) => complexityScore(b) - complexityScore(a))
    .map(toProjectItem);

  const legacy: ProjectItem[] = legacyRepos
    .sort((a, b) => complexityScore(b) - complexityScore(a))
    .map(toProjectItem);

  return { active, legacy };
};

// ── Section definitions ─────────────────────────────────────────────────────

export const buildSections = ({
  languages,
  techHighlights,
  projects,
  contributionData,
}: {
  languages: LanguageItem[];
  techHighlights: TechHighlight[];
  projects: ProjectItem[];
  contributionData: ContributionData;
}): SectionDef[] => {
  const sections: SectionDef[] = [];

  // 1. At a Glance
  sections.push({
    filename: "metrics-pulse.svg",
    title: "At a Glance",
    subtitle: "Contribution activity over the past year",
    renderBody: (y: number) => {
      const stats = [
        {
          label: "COMMITS",
          value:
            contributionData.contributions.totalCommitContributions.toLocaleString(),
        },
        {
          label: "PRS",
          value:
            contributionData.contributions.totalPullRequestContributions.toLocaleString(),
        },
        {
          label: "REVIEWS",
          value:
            contributionData.contributions.totalPullRequestReviewContributions.toLocaleString(),
        },
        {
          label: "REPOS",
          value:
            contributionData.contributions.totalRepositoriesWithContributedCommits.toLocaleString(),
        },
      ];
      return renderStatCards(stats, y);
    },
  });

  // 2. Languages
  sections.push({
    filename: "metrics-languages.svg",
    title: "Languages",
    subtitle: "By bytes of code across all public repos",
    renderBody: (y: number) => renderDonutChart(languages, y),
  });

  // 3. Expertise
  if (techHighlights.length > 0) {
    sections.push({
      filename: "metrics-expertise.svg",
      title: "Expertise",
      subtitle:
        "Curated from dependencies, topics, and languages via AI analysis",
      renderBody: (y: number) => renderTechHighlights(techHighlights, y),
    });
  }

  // 4. Signature Projects
  sections.push({
    filename: "metrics-complexity.svg",
    title: "Signature Projects",
    subtitle: "Top projects by stars",
    renderBody: (y: number) => renderProjectCards(projects, y),
  });

  // 5. Contribution Calendar
  if (contributionData.contributionCalendar) {
    const calendarData = contributionData.contributionCalendar;
    sections.push({
      filename: "metrics-calendar.svg",
      title: "Contribution Calendar",
      subtitle: `${calendarData.totalContributions.toLocaleString()} contributions in the last year`,
      renderBody: (y: number) => renderContributionCalendar(calendarData, y),
    });
  }

  // 6. Open Source Contributions
  if (contributionData.externalRepos.nodes.length > 0) {
    sections.push({
      filename: "metrics-contributions.svg",
      title: "Open Source Contributions",
      subtitle: "External repositories contributed to (all time)",
      renderBody: (y: number) => {
        const repos = contributionData.externalRepos.nodes.slice(0, 5);
        const highlights = repos.map((r) => ({
          project: r.nameWithOwner,
          detail: [
            r.stargazerCount > 0
              ? `\u2605 ${r.stargazerCount.toLocaleString()}`
              : null,
            r.primaryLanguage?.name,
          ]
            .filter(Boolean)
            .join(" \u00b7 "),
        }));
        return renderContributionCards(highlights, y);
      },
    });
  }

  return sections;
};
