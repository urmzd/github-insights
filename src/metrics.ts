import { parseManifest } from "./parsers.js";
import { renderContributionCards } from "./components/contribution-cards.js";
import { renderStatCards } from "./components/stat-cards.js";
import { renderProjectCards } from "./components/project-cards.js";
import { renderDonutChart } from "./components/donut-chart.js";
import { renderDomainCloud } from "./components/domain-cloud.js";
import { renderTechHighlights } from "./components/tech-highlights.js";
import type {
  RepoNode,
  ManifestMap,
  DomainMap,
  LanguageItem,
  TechHighlight,
  ComplexityItem,
  DomainItem,
  ContributionData,
  ContributionsByRepo,
  SectionDef,
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

// ── Scoring ─────────────────────────────────────────────────────────────────

export const computeComplexityScores = (repos: RepoNode[]): ComplexityItem[] =>
  repos
    .map((repo) => {
      const langCount = (repo.languages?.edges || []).filter(
        (e) => !EXCLUDED_LANGUAGES.has(e.node.name),
      ).length;
      const diskKB = Math.max(repo.diskUsage || 1, 1);
      const codeBytes = Math.max(repo.languages?.totalSize || 1, 1);
      const depCount = (repo.languages?.edges || []).length;

      const score =
        langCount * 15 +
        Math.log10(diskKB) * 20 +
        Math.log10(codeBytes) * 15 +
        Math.min(depCount, 50);

      return {
        name: repo.name,
        url: repo.url,
        description: repo.description || "",
        value: Math.round(score),
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

// ── Domain Aggregation ──────────────────────────────────────────────────────

export const aggregateDomains = (domainMap: DomainMap): DomainItem[] => {
  const counts = new Map<string, number>();
  const reposByDomain = new Map<string, string[]>();

  for (const [repo, tags] of domainMap) {
    for (const tag of tags) {
      const normalized = tag.trim();
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
      if (!reposByDomain.has(normalized)) reposByDomain.set(normalized, []);
      reposByDomain.get(normalized)!.push(repo);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      repos: reposByDomain.get(name) || [],
    }))
    .sort((a, b) => b.count - a.count);
};

// ── Recently Active ─────────────────────────────────────────────────────────

export const computeRecentlyActive = (
  contributionsByRepo: ContributionsByRepo[],
  repos: RepoNode[],
): Set<string> => {
  const recentRepoNames = new Set<string>();
  for (const entry of contributionsByRepo) {
    if (entry.contributions.totalCount > 0) {
      recentRepoNames.add(entry.repository.nameWithOwner.split("/").pop()!);
    }
  }

  const activeSet = new Set<string>();
  for (const repo of repos) {
    if (!recentRepoNames.has(repo.name)) continue;
    if (repo.primaryLanguage?.name) {
      activeSet.add(repo.primaryLanguage.name.toLowerCase());
    }
    for (const edge of repo.languages?.edges || []) {
      activeSet.add(edge.node.name.toLowerCase());
    }
    for (const node of repo.repositoryTopics?.nodes || []) {
      activeSet.add(node.topic.name.toLowerCase());
    }
  }

  return activeSet;
};

export const markRecentlyActive = (
  itemLists: { trending?: boolean; name: string }[][],
  recentlyActiveSet: Set<string>,
): void => {
  for (const list of itemLists) {
    for (const item of list) {
      item.trending = recentlyActiveSet.has(item.name.toLowerCase());
    }
  }
};

// ── Section definitions ─────────────────────────────────────────────────────

export const buildSections = ({
  languages,
  techHighlights,
  complexity,
  domains,
  domainMap,
  contributionData,
}: {
  languages: LanguageItem[];
  techHighlights: TechHighlight[];
  complexity: ComplexityItem[];
  domains: DomainItem[];
  domainMap: DomainMap;
  contributionData: ContributionData;
}): SectionDef[] => {
  const sections: SectionDef[] = [];

  // 1. Work Domains
  if (domains && domains.length > 0) {
    sections.push({
      filename: "metrics-domains.svg",
      title: "Work Domains",
      subtitle: "Extracted from project READMEs via AI analysis",
      renderBody: (y: number) => renderDomainCloud(domains, y),
    });
  }

  // 2. Languages
  sections.push({
    filename: "metrics-languages.svg",
    title: "Languages",
    subtitle: "By bytes of code across all public repos",
    renderBody: (y: number) => renderDonutChart(languages, y),
  });

  // 3. Tech Stack
  if (techHighlights.length > 0) {
    sections.push({
      filename: "metrics-tech-stack.svg",
      title: "Tech Stack",
      subtitle:
        "Curated from dependencies, topics, and languages via AI analysis",
      renderBody: (y: number) => renderTechHighlights(techHighlights, y),
    });
  }

  // 4. Signature Projects
  sections.push({
    filename: "metrics-complexity.svg",
    title: "Signature Projects",
    subtitle:
      "Top projects by complexity score (languages, disk usage, code size)",
    renderBody: (y: number) => renderProjectCards(complexity, domainMap, y),
  });

  // 5. At a Glance
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
