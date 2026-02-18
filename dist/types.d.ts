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
    items?: BarItem[];
    options?: Record<string, unknown>;
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
}
export type ManifestMap = Map<string, Record<string, string>>;
export type ReadmeMap = Map<string, string>;
export interface PackageParser {
    /** Filenames this parser handles (e.g. ["package.json"]) */
    filenames: string[];
    /** Extract dependency names from file content */
    parseDependencies(text: string): string[];
}
export interface TechHighlight {
    category: string;
    items: string[];
    score: number;
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
export type TemplateName = "classic" | "modern" | "minimal";
export interface TemplateContext {
    username: string;
    name: string;
    firstName: string;
    pronunciation?: string;
    title?: string;
    bio?: string;
    preambleContent?: string;
    shortPreambleContent?: string;
    svgs: SvgEmbed[];
    sectionSvgs: Record<string, string>;
    profile: UserProfile;
    activeProjects: ProjectItem[];
    legacyProjects: ProjectItem[];
    allProjects: ProjectItem[];
    languages: LanguageItem[];
    techHighlights: TechHighlight[];
    contributionData: ContributionData;
    socialBadges: string;
    svgDir: string;
}
export type TemplateFunction = (context: TemplateContext) => string;
