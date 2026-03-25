import { renderContributionRhythm } from "./components/contribution-rhythm.js";
import { renderImpactTrail } from "./components/impact-trail.js";
import { renderLanguageVelocity } from "./components/language-velocity.js";
import { renderProjectConstellation } from "./components/project-constellation.js";
import { parseManifest } from "./parsers.js";
import type {
  ConstellationNode,
  ContributionData,
  ContributionRhythm,
  LanguageItem,
  ManifestMap,
  MonthlyLanguageBucket,
  ProjectItem,
  ProjectStatus,
  RepoClassificationInput,
  RepoClassificationOutput,
  RepoNode,
  SectionDef,
} from "./types.js";

// ── Category Sets ───────────────────────────────────────────────────────────

const EXCLUDED_LANGUAGES = new Set(["Jupyter Notebook"]);

// ── Section keys ────────────────────────────────────────────────────────────

export const SECTION_KEYS: Record<string, string> = {
  velocity: "metrics-velocity.svg",
  rhythm: "metrics-rhythm.svg",
  constellation: "metrics-constellation.svg",
  impact: "metrics-impact.svg",
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
  return (
    langCount * 10 +
    Math.min(sizeMb, 50) * 2 +
    Math.log2(stars + 1) * 3 +
    topics * 2
  );
};

const toProjectItem = (repo: RepoNode): ProjectItem => ({
  name: repo.name,
  url: repo.url,
  description: repo.description || "",
  stars: repo.stargazerCount,
  languageCount: repo.languages.edges.length,
  codeSize: repo.diskUsage,
  languages: repoLanguages(repo),
  isArchived: repo.isArchived || undefined,
});

// ── Top Projects by Stars ───────────────────────────────────────────────────

export const getTopProjectsByStars = (repos: RepoNode[]): ProjectItem[] =>
  [...repos]
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 5)
    .map(toProjectItem);

// ── Top Projects by Complexity ─────────────────────────────────────────────

export const getTopProjectsByComplexity = (
  repos: RepoNode[],
): ProjectItem[] => {
  const sorted = [...repos].sort(
    (a, b) => complexityScore(b) - complexityScore(a),
  );
  for (const repo of sorted) {
    console.info(
      `[complexity] ${repo.name}: ${complexityScore(repo).toFixed(1)} (${repo.languages.edges.length} langs, ${repo.diskUsage}KB)`,
    );
  }
  return sorted.map(toProjectItem);
};

// ── Project classification ──────────────────────────────────────────────────

const ACTIVE_COMMIT_THRESHOLD = 5;

export const buildClassificationInputs = (
  repos: RepoNode[],
  contributionData: ContributionData,
): RepoClassificationInput[] => {
  const commitMap = new Map<string, number>();
  for (const entry of contributionData.commitContributionsByRepository || []) {
    commitMap.set(entry.repository.name, entry.contributions.totalCount);
  }

  return repos.map((repo) => ({
    name: repo.name,
    description: repo.description || "",
    stars: repo.stargazerCount,
    diskUsageKb: repo.diskUsage,
    languages: repo.languages.edges.map((e) => e.node.name),
    commitsLastYear: commitMap.get(repo.name) || 0,
    createdAt: repo.createdAt,
    pushedAt: repo.pushedAt,
    topicCount: repo.repositoryTopics.nodes.length,
  }));
};

const heuristicStatus = (
  commits: number,
  createdAt?: string,
): ProjectStatus => {
  const isYoung = createdAt
    ? Date.now() - new Date(createdAt).getTime() < 6 * 30 * 24 * 60 * 60 * 1000
    : false;

  if (isYoung && commits >= ACTIVE_COMMIT_THRESHOLD) return "active";
  if (commits > 0) return "maintained";
  return "inactive";
};

export const splitProjectsByRecency = (
  repos: RepoNode[],
  contributionData: ContributionData,
  aiClassifications?: RepoClassificationOutput[],
): {
  active: ProjectItem[];
  maintained: ProjectItem[];
  inactive: ProjectItem[];
  archived: ProjectItem[];
} => {
  const commitMap = new Map<string, number>();
  for (const entry of contributionData.commitContributionsByRepository || []) {
    commitMap.set(entry.repository.name, entry.contributions.totalCount);
  }

  const aiMap = new Map<string, RepoClassificationOutput>();
  if (aiClassifications) {
    for (const c of aiClassifications) {
      aiMap.set(c.name, c);
    }
  }

  const activeRepos: RepoNode[] = [];
  const maintainedRepos: RepoNode[] = [];
  const inactiveRepos: RepoNode[] = [];
  const archivedRepos: RepoNode[] = [];

  for (const repo of repos) {
    if (repo.isArchived) {
      archivedRepos.push(repo);
      console.info(
        `[archived  ] ${repo.name} (complexity=${complexityScore(repo).toFixed(1)})`,
      );
      continue;
    }

    const commits = commitMap.get(repo.name) || 0;
    const aiEntry = aiMap.get(repo.name);
    const status = aiEntry?.status || heuristicStatus(commits, repo.createdAt);
    const source = aiEntry ? "ai" : "heuristic";

    if (status === "active") {
      activeRepos.push(repo);
    } else if (status === "maintained") {
      maintainedRepos.push(repo);
    } else {
      inactiveRepos.push(repo);
    }

    console.info(
      `[${status.padEnd(10)}] ${repo.name} (${commits} commits, complexity=${complexityScore(repo).toFixed(1)}, source=${source})`,
    );
  }

  console.info(
    `Split: ${activeRepos.length} active, ${maintainedRepos.length} maintained, ${inactiveRepos.length} inactive, ${archivedRepos.length} archived`,
  );

  const sortByComplexity = (a: RepoNode, b: RepoNode) =>
    complexityScore(b) - complexityScore(a);

  const toProjectItemWithSummary = (repo: RepoNode): ProjectItem => ({
    ...toProjectItem(repo),
    summary: aiMap.get(repo.name)?.summary || undefined,
    category: aiMap.get(repo.name)?.category || undefined,
  });

  const active: ProjectItem[] = activeRepos
    .sort(sortByComplexity)
    .map(toProjectItemWithSummary);
  const maintained: ProjectItem[] = maintainedRepos
    .sort(sortByComplexity)
    .map(toProjectItemWithSummary);
  const inactive: ProjectItem[] = inactiveRepos
    .sort(sortByComplexity)
    .map(toProjectItemWithSummary);
  const archived: ProjectItem[] = archivedRepos
    .sort(sortByComplexity)
    .map(toProjectItemWithSummary);

  return { active, maintained, inactive, archived };
};

// ── Language Velocity ────────────────────────────────────────────────────────

export const computeLanguageVelocity = (
  contributionData: ContributionData,
  repos: RepoNode[],
): MonthlyLanguageBucket[] => {
  // Build a map of repo name → primary language + color
  const repoLangMap = new Map<string, { name: string; color: string }>();
  for (const repo of repos) {
    if (repo.primaryLanguage) {
      repoLangMap.set(repo.name, {
        name: repo.primaryLanguage.name,
        color: repo.primaryLanguage.color,
      });
    }
  }

  // Build monthly commit counts per language from commitContributionsByRepository
  const monthlyMap = new Map<
    string,
    Map<string, { commits: number; color: string }>
  >();

  // Use contribution calendar to get month boundaries
  const calendar = contributionData.contributionCalendar;
  if (!calendar) return [];

  // Get the date range from the calendar
  const allDays = calendar.weeks.flatMap((w) => w.contributionDays);
  if (allDays.length === 0) return [];

  // Create 12 monthly buckets from the calendar date range
  const firstDate = new Date(allDays[0].date);
  const lastDate = new Date(allDays[allDays.length - 1].date);

  // Initialize month keys
  const months: string[] = [];
  const d = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  while (d <= lastDate) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(key);
    monthlyMap.set(key, new Map());
    d.setMonth(d.getMonth() + 1);
  }

  // Compute monthly contribution weights from the calendar
  // This gives us the actual activity shape across months
  const monthWeights = new Map<string, number>();
  for (const day of allDays) {
    const date = new Date(day.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthWeights.set(key, (monthWeights.get(key) || 0) + day.contributionCount);
  }
  const totalWeight =
    [...monthWeights.values()].reduce((a, b) => a + b, 0) || 1;

  // Distribute per-repo commits using monthly weights from the calendar
  for (const entry of contributionData.commitContributionsByRepository || []) {
    const repoName = entry.repository.name;
    const lang = repoLangMap.get(repoName);
    if (!lang) continue;

    const totalCommits = entry.contributions.totalCount;
    if (totalCommits === 0) continue;

    for (const monthKey of months) {
      const weight = monthWeights.get(monthKey) || 0;
      const monthCommits = totalCommits * (weight / totalWeight);

      const langMap = monthlyMap.get(monthKey);
      if (!langMap) continue;
      const existing = langMap.get(lang.name);
      if (existing) {
        existing.commits += monthCommits;
      } else {
        langMap.set(lang.name, {
          commits: monthCommits,
          color: lang.color,
        });
      }
    }
  }

  // Convert to output format
  return months.map((month) => {
    const langMap = monthlyMap.get(month) || new Map();
    const languages = [...langMap.entries()]
      .map(([name, data]) => ({
        name,
        commits: Math.round(data.commits),
        color: data.color,
      }))
      .sort((a, b) => b.commits - a.commits);
    return { month, languages };
  });
};

// ── Contribution Rhythm ─────────────────────────────────────────────────────

export const computeContributionRhythm = (
  contributionData: ContributionData,
): ContributionRhythm => {
  const dayTotals: [number, number, number, number, number, number, number] = [
    0, 0, 0, 0, 0, 0, 0,
  ];

  const calendar = contributionData.contributionCalendar;
  let longestStreak = 0;
  let currentStreak = 0;

  if (calendar) {
    for (const week of calendar.weeks) {
      for (const day of week.contributionDays) {
        const dayOfWeek = new Date(day.date).getDay();
        dayTotals[dayOfWeek] += day.contributionCount;

        if (day.contributionCount > 0) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }
  }

  const { contributions } = contributionData;
  const stats = [
    {
      label: "COMMITS",
      value: contributions.totalCommitContributions.toLocaleString(),
    },
    {
      label: "PRS",
      value: contributions.totalPullRequestContributions.toLocaleString(),
    },
    {
      label: "REVIEWS",
      value: contributions.totalPullRequestReviewContributions.toLocaleString(),
    },
    {
      label: "REPOS",
      value:
        contributions.totalRepositoriesWithContributedCommits.toLocaleString(),
    },
    { label: "STREAK", value: `${longestStreak}d` },
  ];

  return { dayTotals, longestStreak, stats };
};

// ── Project Constellation ───────────────────────────────────────────────────

export const computeConstellationLayout = (
  projects: ProjectItem[],
  repos: RepoNode[],
): ConstellationNode[] => {
  if (projects.length === 0) return [];

  const chartWidth = 760;
  const chartHeight = 340;
  const padX = 60;
  const padY = 30;

  // Build repo lookup for disk usage
  const repoMap = new Map<string, RepoNode>();
  for (const repo of repos) {
    repoMap.set(repo.name, repo);
  }

  // Group projects by primary language
  const langGroups = new Map<string, number[]>();
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const lang = p.languages?.[0] || "Other";
    if (!langGroups.has(lang)) langGroups.set(lang, []);
    langGroups.get(lang)?.push(i);
  }

  const langKeys = [...langGroups.keys()].sort();
  const bandWidth = (chartWidth - 2 * padX) / Math.max(langKeys.length, 1);

  // Compute complexity range for y-axis normalization
  const complexities = projects.map((p) => {
    const repo = repoMap.get(p.name);
    return repo ? complexityScore(repo) : 0;
  });
  const minC = Math.min(...complexities);
  const maxC = Math.max(...complexities);
  const rangeC = maxC - minC || 1;

  const nodes: ConstellationNode[] = projects.map((p, i) => {
    const lang = p.languages?.[0] || "Other";
    const bandIndex = langKeys.indexOf(lang);
    const groupIndices = langGroups.get(lang) || [];
    const indexInGroup = groupIndices.indexOf(i);

    // X: center of language band with jitter
    const bandCenter = padX + bandIndex * bandWidth + bandWidth / 2;
    const jitter =
      groupIndices.length > 1
        ? ((indexInGroup - (groupIndices.length - 1) / 2) * bandWidth * 0.4) /
          Math.max(groupIndices.length - 1, 1)
        : 0;
    const x = Math.max(padX, Math.min(chartWidth - padX, bandCenter + jitter));

    // Y: complexity score (inverted so higher complexity = higher on chart)
    const normC = (complexities[i] - minC) / rangeC;
    const y = padY + (1 - normC) * (chartHeight - 2 * padY);

    // Radius: based on disk usage
    const repo = repoMap.get(p.name);
    const diskKb = repo?.diskUsage || 100;
    const radius = Math.max(6, Math.min(22, 3 + Math.log2(diskKb / 100) * 3));

    // Color: primary language color
    const color = repo?.primaryLanguage?.color || "#8b949e";

    return { name: p.name, url: p.url, x, y, radius, color, connections: [] };
  });

  // Connect projects that share 2+ languages
  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const langsA = new Set(projects[i].languages || []);
      const langsB = projects[j].languages || [];
      const shared = langsB.filter((l) => langsA.has(l)).length;
      if (shared >= 2) {
        nodes[i].connections.push(j);
        nodes[j].connections.push(i);
      }
    }
  }

  return nodes;
};

// ── Section definitions ─────────────────────────────────────────────────────

export const buildSections = ({
  velocity,
  rhythm,
  constellation,
  contributionData,
}: {
  velocity: MonthlyLanguageBucket[];
  rhythm: ContributionRhythm;
  constellation: ConstellationNode[];
  contributionData: ContributionData;
}): SectionDef[] => {
  const sections: SectionDef[] = [];

  // 1. Language Velocity
  if (velocity.length > 0) {
    sections.push({
      filename: "metrics-velocity.svg",
      title: "Language Velocity",
      subtitle: "How language usage has evolved over the past year",
      renderBody: (y: number) => renderLanguageVelocity(velocity, y),
    });
  }

  // 2. Contribution Rhythm
  sections.push({
    filename: "metrics-rhythm.svg",
    title: "Contribution Rhythm",
    subtitle: "Activity patterns and statistics over the past year",
    renderBody: (y: number) => renderContributionRhythm(rhythm, y),
  });

  // 3. Project Constellation
  if (constellation.length > 0) {
    sections.push({
      filename: "metrics-constellation.svg",
      title: "Project Constellation",
      subtitle: "Projects mapped by language ecosystem and complexity",
      renderBody: (y: number) => renderProjectConstellation(constellation, y),
    });
  }

  // 4. Impact Trail
  if (contributionData.externalRepos.nodes.length > 0) {
    sections.push({
      filename: "metrics-impact.svg",
      title: "Open Source Impact",
      subtitle: "External repositories contributed to",
      renderBody: (y: number) => {
        const repos = contributionData.externalRepos.nodes.slice(0, 8);
        return renderImpactTrail(repos, y);
      },
    });
  }

  return sections;
};
