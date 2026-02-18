import type { ContributionCalendar, ContributionData, RepoNode, UserProfile } from "../types.js";
export declare const makeRepo: (overrides?: Partial<RepoNode>) => RepoNode;
export declare const makeContributionData: (overrides?: Partial<ContributionData>) => ContributionData;
export declare const makeContributionCalendar: () => ContributionCalendar;
export declare const makeUserProfile: (overrides?: Partial<UserProfile>) => UserProfile;
