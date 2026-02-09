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
  trending?: boolean;
}

export interface TechItem {
  name: string;
  value: number;
  trending?: boolean;
}

export interface ComplexityItem {
  name: string;
  url: string;
  description: string;
  value: number;
  trending?: boolean;
}

export interface DomainItem {
  name: string;
  count: number;
  repos: string[];
}

// ── Bar chart generics ──────────────────────────────────────────────────────

export interface BarItem {
  name: string;
  value: number;
  percent?: string;
  color?: string;
  trending?: boolean;
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

export interface ContributionsByRepo {
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    primaryLanguage: { name: string } | null;
    isPrivate: boolean;
  };
  contributions: { totalCount: number };
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: { contributionDays: ContributionDay[] }[];
}

export interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalIssueContributions: number;
  totalRepositoriesWithContributedCommits: number;
  restrictedContributionsCount: number;
  contributionCalendar: ContributionCalendar;
  commitContributionsByRepository: ContributionsByRepo[];
}

export interface ExternalRepo {
  nameWithOwner: string;
  url: string;
  stargazerCount: number;
  description: string | null;
  primaryLanguage: { name: string } | null;
}

export interface MergedPR {
  title: string;
  mergedAt: string;
  additions: number;
  deletions: number;
  repository: {
    nameWithOwner: string;
    owner: { login: string };
    stargazerCount: number;
  };
}

export interface ContributionData {
  contributions: ContributionsCollection;
  calendar: ContributionCalendar;
  externalRepos: { totalCount: number; nodes: ExternalRepo[] };
  mergedPRs: { totalCount: number; nodes: MergedPR[] };
}

// ── Manifest types ──────────────────────────────────────────────────────────

export type ManifestMap = Map<string, Record<string, string>>;
export type DomainMap = Map<string, string[]>;
export type ReadmeMap = Map<string, string>;
