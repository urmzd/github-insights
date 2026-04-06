import { renderContributionRhythm } from "./components/contribution-rhythm.js";
import { renderImpactTrail } from "./components/impact-trail.js";
import { renderLanguageVelocity } from "./components/language-velocity.js";
import { renderProjectConstellation } from "./components/project-constellation.js";
import { renderTechStack } from "./components/tech-stack.js";
import { parseManifest } from "./parsers.js";
import type {
  ConstellationBar,
  ConstellationGroupBy,
  ContributionData,
  ContributionRhythm,
  InsightsReport,
  LanguageItem,
  ManifestMap,
  MonthlyLanguageBucket,
  ProjectItem,
  ProjectStatus,
  RepoClassificationInput,
  RepoClassificationOutput,
  RepoNode,
  SectionDef,
  SpotlightProject,
  StackLayer,
  StackProject,
  UserProfile,
} from "./types.js";

// ── Category Sets ───────────────────────────────────────────────────────────

const EXCLUDED_LANGUAGES = new Set([
  "Jupyter Notebook",
  "HTML",
  "CSS",
  "Markdown",
  "Shell",
  "Makefile",
  "Dockerfile",
  "Nix",
  "Just",
  "TeX",
  "SCSS",
  "Less",
]);

// ── Section keys ────────────────────────────────────────────────────────────

export const SECTION_KEYS: Record<string, string> = {
  velocity: "metrics-velocity.svg",
  rhythm: "metrics-rhythm.svg",
  constellation: "metrics-constellation.svg",
  impact: "metrics-impact.svg",
  stack: "metrics-stack.svg",
  spotlight: "",
  portfolio: "",
};

export const SVG_SECTION_KEYS = [
  "velocity",
  "rhythm",
  "constellation",
  "impact",
  "stack",
] as const;

export const TEXT_SECTION_KEYS = ["spotlight", "portfolio"] as const;

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

export const heuristicHeatScore = (
  repo: RepoNode,
  commitsLastYear: number,
): number => {
  const commitBoost = Math.min(commitsLastYear, 50) * 2;
  const daysSincePush =
    (Date.now() - new Date(repo.pushedAt).getTime()) / (24 * 60 * 60 * 1000);
  const recencyBonus = Math.max(0, 90 - daysSincePush) / 3;
  const starBoost = Math.log2(repo.stargazerCount + 1) * 5;
  return commitBoost + recencyBonus + starBoost;
};

const CATEGORY_KEYWORDS: [string, RegExp][] = [
  [
    "Developer Tools",
    /\b(cli|command.?line|tool|build|generator|scaffold|lint|format|action|automation|devtool)\b/i,
  ],
  [
    "SDKs",
    /\b(sdk|lib|library|client|wrapper|binding|plugin|middleware|driver|adapter)\b/i,
  ],
  [
    "Applications",
    /\b(app|application|web|api|server|dashboard|frontend|backend|website|platform|service)\b/i,
  ],
  [
    "Research & Experiments",
    /\b(experiment|research|thesis|academic|ml|machine.?learning|deep.?learning|neural|algorithm|game|clone|learning|course)\b/i,
  ],
];

export const heuristicCategory = (repo: RepoNode): string => {
  const parts = [
    repo.name.replace(/[-_]/g, " "),
    repo.description || "",
    ...repo.repositoryTopics.nodes.map((n) => n.topic.name),
  ];
  const text = parts.join(" ");

  for (const [category, pattern] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }

  const langs = new Set(
    repo.languages.edges.map((e) => e.node.name.toLowerCase()),
  );
  if (langs.has("jupyter notebook") || langs.has("r"))
    return "Research & Experiments";

  return "Other";
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

  const toProjectItemWithSummary = (repo: RepoNode): ProjectItem => {
    const ai = aiMap.get(repo.name);
    return {
      ...toProjectItem(repo),
      summary: ai?.summary || repo.description || undefined,
      category: ai?.category || heuristicCategory(repo),
    };
  };

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

// ── Spotlight (LLM-ranked with heuristic fallback) ───────────────────────────

export const computeSpotlightProjects = (
  repos: RepoNode[],
  contributionData: ContributionData,
  aiClassifications?: RepoClassificationOutput[],
): SpotlightProject[] => {
  const aiMap = new Map<string, RepoClassificationOutput>();
  if (aiClassifications) {
    for (const c of aiClassifications) {
      aiMap.set(c.name, c);
    }
  }

  const commitMap = new Map<string, number>();
  for (const entry of contributionData.commitContributionsByRepository || []) {
    commitMap.set(entry.repository.name, entry.contributions.totalCount);
  }

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const computeActivityLabel = (
    commits: number,
    daysSincePush: number,
  ): string | undefined => {
    if (commits >= 10 && daysSincePush <= 30) return "Active";
    if (commits >= 1 || daysSincePush <= 90) return "Building";
    return undefined;
  };

  // ── AI path: use LLM rankings when available ───────────────────────────
  if (aiMap.size > 0) {
    return repos
      .filter((repo) => {
        const ai = aiMap.get(repo.name);
        return (
          ai?.spotlight_rank != null &&
          ai.spotlight_rank >= 1 &&
          !repo.isArchived
        );
      })
      .sort((a, b) => {
        const rankA = aiMap.get(a.name)?.spotlight_rank ?? 999;
        const rankB = aiMap.get(b.name)?.spotlight_rank ?? 999;
        return rankA - rankB;
      })
      .map((repo) => {
        const ai = aiMap.get(repo.name);
        const commits = commitMap.get(repo.name) || 0;
        const daysSincePush = Math.max(
          0,
          (now - new Date(repo.pushedAt).getTime()) / DAY_MS,
        );

        return {
          ...toProjectItem(repo),
          summary: ai?.summary || undefined,
          category: ai?.category || undefined,
          heatScore: ai?.spotlight_rank ?? 0,
          activityLabel: computeActivityLabel(commits, daysSincePush),
        };
      });
  }

  // ── Heuristic fallback: rank by heat score ─────────────────────────────
  return repos
    .filter((repo) => !repo.isArchived)
    .map((repo) => {
      const commits = commitMap.get(repo.name) || 0;
      return { repo, commits, score: heuristicHeatScore(repo, commits) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ repo, commits, score }) => {
      const daysSincePush = Math.max(
        0,
        (now - new Date(repo.pushedAt).getTime()) / DAY_MS,
      );

      return {
        ...toProjectItem(repo),
        summary: repo.description || undefined,
        category: heuristicCategory(repo),
        heatScore: score,
        activityLabel: computeActivityLabel(commits, daysSincePush),
      };
    });
};

// ── Language Velocity ────────────────────────────────────────────────────────

export const computeLanguageVelocity = (
  contributionData: ContributionData,
  repos: RepoNode[],
): MonthlyLanguageBucket[] => {
  // Build a map of repo name → primary language + color
  const repoLangMap = new Map<string, { name: string; color: string }>();
  for (const repo of repos) {
    if (
      repo.primaryLanguage &&
      !EXCLUDED_LANGUAGES.has(repo.primaryLanguage.name)
    ) {
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

// ── Language helpers ────────────────────────────────────────────────────────

function pickPrimaryLanguage(
  languages: string[] | undefined,
  repo: RepoNode | undefined,
): string {
  const candidates = (languages || []).filter(
    (l) => !EXCLUDED_LANGUAGES.has(l),
  );
  if (candidates.length > 0) return candidates[0];
  if (
    repo?.primaryLanguage &&
    !EXCLUDED_LANGUAGES.has(repo.primaryLanguage.name)
  ) {
    return repo.primaryLanguage.name;
  }
  return "Other";
}

function pickPrimaryColor(
  languages: string[] | undefined,
  repo: RepoNode | undefined,
): string {
  const primary = pickPrimaryLanguage(languages, repo);
  if (primary !== "Other" && repo?.primaryLanguage?.name === primary) {
    return repo.primaryLanguage.color;
  }
  // Try matching from repo language edges
  if (repo?.languages?.edges) {
    const edge = repo.languages.edges.find((e) => e.node.name === primary);
    if (edge) return edge.node.color;
  }
  return repo?.primaryLanguage?.color || "#8b949e";
}

// ── Project Constellation ───────────────────────────────────────────────────

export const computeConstellationLayout = (
  projects: ProjectItem[],
  repos: RepoNode[],
  groupBy: ConstellationGroupBy = "language",
): ConstellationBar[] => {
  if (projects.length === 0) return [];

  const repoMap = new Map<string, RepoNode>();
  for (const repo of repos) {
    repoMap.set(repo.name, repo);
  }

  // Build bars with complexity scores
  const bars: ConstellationBar[] = projects.map((p) => {
    const repo = repoMap.get(p.name);
    const groupKey =
      groupBy === "category"
        ? p.category || (repo ? heuristicCategory(repo) : "Other")
        : pickPrimaryLanguage(p.languages, repo);
    return {
      name: p.name,
      url: p.url,
      complexity: repo ? complexityScore(repo) : 0,
      primaryLanguage: groupKey,
      primaryColor: pickPrimaryColor(p.languages, repo),
      languages: (p.languages || []).filter((l) => !EXCLUDED_LANGUAGES.has(l)),
      stars: p.stars,
    };
  });

  // Group by chosen key
  const groups = new Map<string, ConstellationBar[]>();
  for (const bar of bars) {
    const key = bar.primaryLanguage;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(bar);
  }

  // Sort within each group by complexity (descending)
  for (const group of groups.values()) {
    group.sort((a, b) => b.complexity - a.complexity);
  }

  // Keep all groups — no collapsing to "Other"
  const sortedGroups = [...groups.entries()];

  // Sort groups by max complexity (descending)
  sortedGroups.sort(
    (a, b) => (b[1][0]?.complexity || 0) - (a[1][0]?.complexity || 0),
  );

  // Cap each group at 3, then cap total at 12
  const MAX_PER_GROUP = 3;
  const MAX_BARS = 12;
  const flat = sortedGroups.flatMap(([, group]) =>
    group.slice(0, MAX_PER_GROUP),
  );
  return flat.slice(0, MAX_BARS);
};

// ── Tech Stack Layout ──────────────────────────────────────────────────────

const STACK_LAYER_MAP: Record<
  string,
  { name: string; rank: number; color: string }
> = {
  "Developer Tools": {
    name: "Infrastructure & DevOps",
    rank: 0,
    color: "#3fb950",
  },
  SDKs: { name: "Libraries & SDKs", rank: 1, color: "#58a6ff" },
  Applications: { name: "Applications", rank: 2, color: "#d29922" },
  Other: { name: "Applications", rank: 2, color: "#d29922" },
  "Research & Experiments": {
    name: "AI & Research",
    rank: 3,
    color: "#bc8cff",
  },
};

export const computeStackLayout = (
  projects: ProjectItem[],
  repos: RepoNode[],
): StackLayer[] => {
  const repoMap = new Map<string, RepoNode>();
  for (const repo of repos) {
    repoMap.set(repo.name, repo);
  }

  // Group projects by stack layer
  const layerProjects = new Map<
    number,
    {
      layer: { name: string; rank: number; color: string };
      projects: StackProject[];
    }
  >();

  for (const project of projects) {
    const category =
      project.category ||
      (repoMap.has(project.name)
        ? heuristicCategory(repoMap.get(project.name)!)
        : "Other");
    const layerDef = STACK_LAYER_MAP[category] || STACK_LAYER_MAP["Other"];
    const repo = repoMap.get(project.name);

    const stackProject: StackProject = {
      name: project.name,
      url: project.url,
      stars: project.stars,
      primaryLanguage: pickPrimaryLanguage(project.languages, repo),
      primaryColor: pickPrimaryColor(project.languages, repo),
      complexity: repo ? complexityScore(repo) : 0,
    };

    if (!layerProjects.has(layerDef.rank)) {
      layerProjects.set(layerDef.rank, { layer: layerDef, projects: [] });
    }
    layerProjects.get(layerDef.rank)!.projects.push(stackProject);
  }

  // Sort projects within each layer by complexity desc, cap at 4
  const layers: StackLayer[] = [];
  for (const [, entry] of layerProjects) {
    entry.projects.sort((a, b) => b.complexity - a.complexity);
    layers.push({
      name: entry.layer.name,
      rank: entry.layer.rank,
      color: entry.layer.color,
      projects: entry.projects.slice(0, 4),
    });
  }

  // Sort by rank ascending (bottom = infra, top = AI)
  layers.sort((a, b) => a.rank - b.rank);

  return layers;
};

// ── Insights Report Builder ────────────────────────────────────────────────

export function buildInsightsReport(params: {
  username: string;
  displayName: string;
  profile: UserProfile;
  repos: RepoNode[];
  contributionData: ContributionData;
  aiClassifications: RepoClassificationOutput[];
  constellationGroupBy: ConstellationGroupBy;
  excludeArchived: boolean;
}): InsightsReport {
  const {
    username,
    displayName,
    profile,
    repos,
    contributionData,
    aiClassifications,
    constellationGroupBy,
    excludeArchived,
  } = params;

  const languages = aggregateLanguages(repos);
  const complexProjects = getTopProjectsByComplexity(repos);
  const {
    active: activeProjects,
    maintained: maintainedProjects,
    inactive: inactiveProjects,
    archived: archivedProjects,
  } = splitProjectsByRecency(repos, contributionData, aiClassifications);

  const velocity = computeLanguageVelocity(contributionData, repos);
  const rhythm = computeContributionRhythm(contributionData);
  const constellation = computeConstellationLayout(
    complexProjects,
    repos,
    constellationGroupBy,
  );
  const spotlightProjects = computeSpotlightProjects(
    repos,
    contributionData,
    aiClassifications,
  );

  // Build allProjects and categorizedProjects
  const includeArchived = !excludeArchived;
  const allProjectItems = [
    ...activeProjects,
    ...maintainedProjects,
    ...inactiveProjects,
    ...(includeArchived ? archivedProjects : []),
  ];
  const categorizedProjects: Record<string, ProjectItem[]> = {};
  for (const project of allProjectItems) {
    const cat = project.category || "Other";
    if (!categorizedProjects[cat]) categorizedProjects[cat] = [];
    categorizedProjects[cat].push(project);
  }

  // Stack uses the classified projects (all non-archived)
  const stackProjects = [
    ...activeProjects,
    ...maintainedProjects,
    ...inactiveProjects,
  ];
  const stack = computeStackLayout(stackProjects, repos);

  const firstName = displayName.trim().split(/\s+/)[0] || displayName;

  return {
    username,
    displayName,
    firstName,
    profile,
    languages,
    allProjects: complexProjects,
    activeProjects,
    maintainedProjects,
    inactiveProjects,
    archivedProjects,
    categorizedProjects,
    spotlightProjects,
    velocity,
    rhythm,
    constellation,
    stack,
    contributionData,
    constellationGroupBy,
    generatedAt: new Date().toISOString(),
  };
}

// ── Section definitions ─────────────────────────────────────────────────────

export const buildSections = ({
  velocity,
  rhythm,
  constellation,
  stack,
  contributionData,
  constellationGroupBy = "language",
}: {
  velocity: MonthlyLanguageBucket[];
  rhythm: ContributionRhythm;
  constellation: ConstellationBar[];
  stack?: StackLayer[];
  contributionData: ContributionData;
  constellationGroupBy?: ConstellationGroupBy;
}): SectionDef[] => {
  const sections: SectionDef[] = [];

  // 1. Language Velocity
  if (velocity.length > 0) {
    sections.push({
      filename: "metrics-velocity.svg",
      title: "Language Velocity",
      subtitle: "How language usage has evolved over the past year",
      renderBody: (y: number) => renderLanguageVelocity(velocity, y),
      data: velocity,
    });
  }

  // 2. Contribution Rhythm
  sections.push({
    filename: "metrics-rhythm.svg",
    title: "Contribution Rhythm",
    subtitle: "Activity patterns and statistics over the past year",
    renderBody: (y: number) => renderContributionRhythm(rhythm, y),
    data: rhythm,
  });

  // 3. Project Constellation
  if (constellation.length > 0) {
    sections.push({
      filename: "metrics-constellation.svg",
      title: "Project Constellation",
      subtitle:
        constellationGroupBy === "category"
          ? "Top projects ranked by complexity, grouped by domain"
          : "Top projects ranked by complexity, grouped by primary language",
      renderBody: (y: number) => renderProjectConstellation(constellation, y),
      data: constellation,
    });
  }

  // 4. Impact Trail
  if (contributionData.externalRepos.nodes.length > 0) {
    const impactRepos = contributionData.externalRepos.nodes.slice(0, 8);
    sections.push({
      filename: "metrics-impact.svg",
      title: "Open Source Impact",
      subtitle: "External repositories contributed to",
      renderBody: (y: number) => renderImpactTrail(impactRepos, y),
      data: impactRepos,
    });
  }

  // 5. Tech Stack
  if (stack && stack.length > 0) {
    sections.push({
      filename: "metrics-stack.svg",
      title: "Tech Stack",
      subtitle: "Projects arranged by abstraction layer",
      renderBody: (y: number) => renderTechStack(stack, y),
      data: stack,
    });
  }

  return sections;
};
