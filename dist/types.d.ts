export interface RenderResult {
    svg: string;
    height: number;
}
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
export interface BarItem {
    name: string;
    value: number;
    percent?: string;
    color?: string;
}
export interface StatItem {
    label: string;
    value: string;
}
export interface ContributionHighlight {
    project: string;
    detail: string;
}
export interface SectionDef {
    filename: string;
    title: string;
    subtitle: string;
    renderBody?: (y: number) => RenderResult;
}
export interface RepoLanguageEdge {
    size: number;
    node: {
        name: string;
        color: string;
    };
}
export interface RepoNode {
    name: string;
    description: string | null;
    url: string;
    stargazerCount: number;
    diskUsage: number;
    primaryLanguage: {
        name: string;
        color: string;
    } | null;
    isArchived: boolean;
    isFork: boolean;
    createdAt: string;
    pushedAt: string;
    repositoryTopics: {
        nodes: {
            topic: {
                name: string;
            };
        }[];
    };
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
    primaryLanguage: {
        name: string;
    } | null;
}
export interface RepoCommitContribution {
    repository: {
        name: string;
        nameWithOwner: string;
    };
    contributions: {
        totalCount: number;
    };
}
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
    externalRepos: {
        totalCount: number;
        nodes: ExternalRepo[];
    };
    contributionCalendar?: ContributionCalendar;
    commitContributionsByRepository?: RepoCommitContribution[];
}
export type ManifestMap = Map<string, Record<string, string>>;
export type ReadmeMap = Map<string, string>;
export interface PackageParser {
    /** Filenames this parser handles (e.g. ["package.json"]) */
    filenames: string[];
    /** Extract dependency names from file content */
    parseDependencies(text: string): string[];
}
export interface MonthlyLanguageBucket {
    month: string;
    languages: {
        name: string;
        commits: number;
        color: string;
    }[];
}
export interface ContributionRhythm {
    dayTotals: [number, number, number, number, number, number, number];
    longestStreak: number;
    stats: StatItem[];
}
export interface GrowthArcPoint {
    label: string;
    avgComplexity: number;
    repoCount: number;
}
export interface ConstellationNode {
    name: string;
    url: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    connections: number[];
}
export interface UserConfig {
    title?: string;
    desired_title?: string;
    name?: string;
    pronunciation?: string;
    bio?: string;
    preamble?: string;
    template?: TemplateName;
    sections?: string[];
}
export interface UserProfile {
    name: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    websiteUrl: string | null;
    twitterUsername: string | null;
    socialAccounts: {
        provider: string;
        url: string;
    }[];
}
export interface SvgEmbed {
    label: string;
    path: string;
}
export type TemplateName = "classic" | "modern" | "minimal" | "ecosystem" | "showcase";
export type ShowcaseSection = "spotlight" | "velocity" | "rhythm" | "constellation" | "impact" | "portfolio";
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
    constellation: ConstellationNode[];
    contributionData: ContributionData;
    socialBadges: string;
    svgDir: string;
    spotlightProjects: SpotlightProject[];
    resolvedSections: ShowcaseSection[];
}
export type TemplateFunction = (context: TemplateContext) => string;
