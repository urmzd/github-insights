import type { RepoNode, ContributionsByRepo, ContributionData } from "../types.js";
export declare const makeRepo: (overrides?: Partial<RepoNode>) => RepoNode;
export declare const makeContributionsByRepo: (overrides?: Partial<ContributionsByRepo>) => ContributionsByRepo;
export declare const makeContributionData: (overrides?: Partial<ContributionData>) => ContributionData;
