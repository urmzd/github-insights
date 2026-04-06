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
  languageCount?: number;
  codeSize?: number;
  languages?: string[];
  summary?: string;
  category?: string;
  isArchived?: boolean;
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
  data?: unknown;
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
  createdAt: string;
  pushedAt: string;
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

// ── Commit contributions by repository ────────────────────────────────────

export interface RepoCommitContribution {
  repository: { name: string; nameWithOwner: string };
  contributions: { totalCount: number };
}

// ── Contribution calendar ──────────────────────────────────────────────────

export interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionData {
  contributions: ContributionsCollection;
  externalRepos: { totalCount: number; nodes: ExternalRepo[] };
  contributionCalendar?: ContributionCalendar;
  commitContributionsByRepository?: RepoCommitContribution[];
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

// ── Language velocity ──────────────────────────────────────────────────────

export interface MonthlyLanguageBucket {
  month: string; // "2025-04"
  languages: { name: string; commits: number; color: string }[];
}

// ── Contribution rhythm ───────────────────────────────────────────────────

export interface ContributionRhythm {
  dayTotals: [number, number, number, number, number, number, number];
  longestStreak: number;
  stats: StatItem[];
}

export type ConstellationGroupBy = "language" | "category";

// ── Project constellation ─────────────────────────────────────────────────

export interface GrowthArcPoint {
  label: string;
  avgComplexity: number;
  repoCount: number;
}

export interface ConstellationBar {
  name: string;
  url: string;
  complexity: number;
  primaryLanguage: string;
  primaryColor: string;
  languages: string[];
  stars: number;
}

export interface UserProfile {
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  socialAccounts: { provider: string; url: string }[];
}

// ── Tech Stack ──────────────────────────────────────────────────────────────

export interface StackProject {
  name: string;
  url: string;
  stars: number;
  primaryLanguage: string;
  primaryColor: string;
  complexity: number;
}

export interface StackLayer {
  name: string; // "AI & Research", "Applications", "Libraries & SDKs", "Infrastructure"
  rank: number; // 0=bottom (infra) → 3=top (AI)
  color: string; // layer accent color
  projects: StackProject[];
}

// ── SVG embed ─────────────────────────────────────────────────────────────

export interface SvgEmbed {
  label: string;
  path: string;
}

// ── Template types ────────────────────────────────────────────────────────

export type TemplateName =
  | "classic"
  | "modern"
  | "minimal"
  | "ecosystem"
  | "showcase";

export type ShowcaseSection =
  | "spotlight"
  | "velocity"
  | "rhythm"
  | "constellation"
  | "impact"
  | "portfolio"
  | "stack";

export interface SpotlightProject extends ProjectItem {
  heatScore: number;
  activityLabel?: string;
}

export type ProjectStatus = "active" | "maintained" | "inactive";

export interface RepoClassificationInput {
  name: string;
  description: string;
  stars: number;
  diskUsageKb: number;
  languages: string[];
  commitsLastYear: number;
  createdAt?: string;
  pushedAt: string;
  topicCount: number;
}

export interface RepoClassificationOutput {
  name: string;
  status: ProjectStatus;
  summary: string;
  category?: string;
  spotlight_rank?: number | null;
}

// ── Insights Report ─────────────────────────────────────────────────────────

export interface InsightsReport {
  username: string;
  displayName: string;
  firstName: string;
  profile: UserProfile;
  languages: LanguageItem[];
  allProjects: ProjectItem[];
  activeProjects: ProjectItem[];
  maintainedProjects: ProjectItem[];
  inactiveProjects: ProjectItem[];
  archivedProjects: ProjectItem[];
  categorizedProjects: Record<string, ProjectItem[]>;
  spotlightProjects: SpotlightProject[];
  velocity: MonthlyLanguageBucket[];
  rhythm: ContributionRhythm;
  constellation: ConstellationBar[];
  stack: StackLayer[];
  contributionData: ContributionData;
  constellationGroupBy: ConstellationGroupBy;
  generatedAt: string;
}

export interface TemplateContext {
  username: string;
  name: string;
  firstName: string;
  pronunciation?: string;
  title?: string;
  bio?: string;
  preamble?: string;
  templateName: TemplateName;
  svgs: SvgEmbed[];
  sectionSvgs: Record<string, string>;
  profile: UserProfile;
  activeProjects: ProjectItem[];
  maintainedProjects: ProjectItem[];
  inactiveProjects: ProjectItem[];
  archivedProjects: ProjectItem[];
  allProjects: ProjectItem[];
  categorizedProjects: Record<string, ProjectItem[]>;
  languages: LanguageItem[];
  velocity: MonthlyLanguageBucket[];
  rhythm: ContributionRhythm;
  constellation: ConstellationBar[];
  stack: StackLayer[];
  contributionData: ContributionData;
  socialBadges: string;
  svgDir: string;
  spotlightProjects: SpotlightProject[];
  resolvedSections: ShowcaseSection[];
}

export type TemplateFunction = (context: TemplateContext) => string;
