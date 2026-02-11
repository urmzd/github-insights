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

// ── Top Projects by Stars ───────────────────────────────────────────────────

export const getTopProjectsByStars = (repos: RepoNode[]): ProjectItem[] =>
  repos
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 5)
    .map((repo) => ({
      name: repo.name,
      url: repo.url,
      description: repo.description || "",
      stars: repo.stargazerCount,
    }));

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

  // 5. Open Source Contributions
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
