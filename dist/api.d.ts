import * as github from "@actions/github";
import type { ContributionData, ManifestMap, ProjectItem, ReadmeMap, RepoClassificationInput, RepoClassificationOutput, RepoNode, UserConfig, UserProfile } from "./types.js";
export type GraphQL = ReturnType<typeof github.getOctokit>["graphql"];
export declare const makeGraphql: (token: string) => GraphQL;
export declare const fetchAllRepoData: (graphql: GraphQL, username: string) => Promise<RepoNode[]>;
export declare const fetchManifestsForRepos: (graphql: GraphQL, username: string, repos: RepoNode[]) => Promise<ManifestMap>;
export declare const fetchContributionData: (graphql: GraphQL, username: string) => Promise<ContributionData>;
export declare const fetchReadmeForRepos: (graphql: GraphQL, username: string, repos: RepoNode[]) => Promise<ReadmeMap>;
export declare const fetchUserProfile: (graphql: GraphQL, username: string) => Promise<UserProfile>;
export interface PreambleContext {
    username: string;
    profile: UserProfile;
    userConfig: UserConfig;
    languages: {
        name: string;
        percent: string;
    }[];
    activeProjects: ProjectItem[];
    complexProjects: ProjectItem[];
}
export declare const fetchAIPreamble: (token: string, context: PreambleContext) => Promise<string | undefined>;
export declare const fetchProjectClassifications: (token: string, repos: RepoClassificationInput[]) => Promise<RepoClassificationOutput[]>;
