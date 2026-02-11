// ── Render result ───────────────────────────────────────────────────────────

export interface RenderResult {
  svg: string;
  height: number;
}

// ── Language / Tech items ───────────────────────────────────────────────────

export interface LanguageItem {
  name: string;
  value: number;
  percent: string;
  color: string;
}

export interface TechItem {
  name: string;
  value: number;
}

export interface ProjectItem {
  name: string;
  url: string;
  description: string;
  stars: number;
}

// ── Bar chart generics ──────────────────────────────────────────────────────

export interface BarItem {
  name: string;
  value: number;
  percent?: string;
  color?: string;
}

// ── Stat cards ──────────────────────────────────────────────────────────────

export interface StatItem {
  label: string;
  value: string;
}

// ── Contribution cards ──────────────────────────────────────────────────────

export interface ContributionHighlight {
  project: string;
  detail: string;
}

// ── Section definition ──────────────────────────────────────────────────────

export interface SectionDef {
  filename: string;
  title: string;
  subtitle: string;
  renderBody?: (y: number) => RenderResult;
  items?: BarItem[];
  options?: Record<string, unknown>;
}

// ── GitHub API types ────────────────────────────────────────────────────────

export interface RepoLanguageEdge {
  size: number;
  node: { name: string; color: string };
}

export interface RepoNode {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  diskUsage: number;
  primaryLanguage: { name: string; color: string } | null;
  isArchived: boolean;
  isFork: boolean;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  languages: {
    totalSize: number;
    edges: RepoLanguageEdge[];
  };
}

export interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoriesWithContributedCommits: number;
}

export interface ExternalRepo {
  nameWithOwner: string;
  url: string;
  stargazerCount: number;
  description: string | null;
  primaryLanguage: { name: string } | null;
}

export interface ContributionData {
  contributions: ContributionsCollection;
  externalRepos: { totalCount: number; nodes: ExternalRepo[] };
}

// ── Manifest types ──────────────────────────────────────────────────────────

export type ManifestMap = Map<string, Record<string, string>>;
export type ReadmeMap = Map<string, string>;

// ── Package parser ─────────────────────────────────────────────────────────

export interface PackageParser {
  /** Filenames this parser handles (e.g. ["package.json"]) */
  filenames: string[];
  /** Extract dependency names from file content */
  parseDependencies(text: string): string[];
}

export interface TechHighlight {
  category: string;
  items: string[];
  score: number; // 0-100 proficiency level
}
