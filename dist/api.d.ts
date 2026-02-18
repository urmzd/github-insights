import type { ContributionData, ManifestMap, ProjectItem, ReadmeMap, RepoNode, TechHighlight, UserConfig, UserProfile } from "./types.js";
export declare const fetchAllRepoData: (token: string, username: string) => Promise<RepoNode[]>;
export declare const fetchManifestsForRepos: (token: string, username: string, repos: RepoNode[]) => Promise<ManifestMap>;
export declare const fetchContributionData: (token: string, username: string) => Promise<ContributionData>;
export declare const fetchReadmeForRepos: (token: string, username: string, repos: RepoNode[]) => Promise<ReadmeMap>;
export declare const fetchUserProfile: (token: string, username: string) => Promise<UserProfile>;
export interface PreambleContext {
    username: string;
    profile: UserProfile;
    userConfig: UserConfig;
    languages: {
        name: string;
        percent: string;
    }[];
    techHighlights: TechHighlight[];
    contributionData: ContributionData;
    projects: ProjectItem[];
}
export declare const fetchAIPreamble: (token: string, context: PreambleContext, variant?: "full" | "short") => Promise<string | undefined>;
export declare const fetchExpertiseAnalysis: (token: string, languages: {
    name: string;
    percent: string;
}[], allDeps: string[], allTopics: string[], repos: RepoNode[], readmeMap: ReadmeMap, userConfig?: UserConfig) => Promise<TechHighlight[]>;
