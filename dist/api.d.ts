import type { RepoNode, ManifestMap, ReadmeMap, DomainMap, ContributionData, TechHighlight } from "./types.js";
export declare const fetchAllRepoData: (token: string, username: string) => Promise<RepoNode[]>;
export declare const fetchManifestsForRepos: (token: string, username: string, repos: RepoNode[]) => Promise<ManifestMap>;
export declare const fetchContributionData: (token: string, username: string) => Promise<ContributionData>;
export declare const fetchReadmeForRepos: (token: string, username: string, repos: RepoNode[]) => Promise<ReadmeMap>;
export declare const fetchDomainAnalysis: (token: string, repos: RepoNode[], readmeMap: ReadmeMap) => Promise<DomainMap>;
export declare const fetchTechAnalysis: (token: string, languages: {
    name: string;
    percent: string;
}[], allDeps: string[], allTopics: string[]) => Promise<TechHighlight[]>;
