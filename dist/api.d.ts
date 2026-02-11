import type { ContributionData, ManifestMap, ReadmeMap, RepoNode, TechHighlight } from "./types.js";
export declare const fetchAllRepoData: (token: string, username: string) => Promise<RepoNode[]>;
export declare const fetchManifestsForRepos: (token: string, username: string, repos: RepoNode[]) => Promise<ManifestMap>;
export declare const fetchContributionData: (token: string, username: string) => Promise<ContributionData>;
export declare const fetchReadmeForRepos: (token: string, username: string, repos: RepoNode[]) => Promise<ReadmeMap>;
export declare const fetchExpertiseAnalysis: (token: string, languages: {
    name: string;
    percent: string;
}[], allDeps: string[], allTopics: string[], repos: RepoNode[], readmeMap: ReadmeMap) => Promise<TechHighlight[]>;
