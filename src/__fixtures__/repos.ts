import type {
  RepoNode,
  ContributionsByRepo,
  ContributionData,
} from "../types.js";

export const makeRepo = (overrides: Partial<RepoNode> = {}): RepoNode => ({
  name: "test-repo",
  description: "A test repository",
  url: "https://github.com/user/test-repo",
  stargazerCount: 10,
  diskUsage: 1024,
  primaryLanguage: { name: "TypeScript", color: "#3178c6" },
  isArchived: false,
  isFork: false,
  repositoryTopics: { nodes: [] },
  languages: {
    totalSize: 50000,
    edges: [
      { size: 30000, node: { name: "TypeScript", color: "#3178c6" } },
      { size: 20000, node: { name: "JavaScript", color: "#f1e05a" } },
    ],
  },
  ...overrides,
});

export const makeContributionsByRepo = (
  overrides: Partial<ContributionsByRepo> = {},
): ContributionsByRepo => ({
  repository: {
    nameWithOwner: "user/test-repo",
    stargazerCount: 10,
    primaryLanguage: { name: "TypeScript" },
    isPrivate: false,
  },
  contributions: { totalCount: 5 },
  ...overrides,
});

export const makeContributionData = (
  overrides: Partial<ContributionData> = {},
): ContributionData => ({
  contributions: {
    totalCommitContributions: 100,
    totalPullRequestContributions: 20,
    totalPullRequestReviewContributions: 10,
    totalIssueContributions: 5,
    totalRepositoriesWithContributedCommits: 8,
    restrictedContributionsCount: 0,
    contributionCalendar: {
      totalContributions: 135,
      weeks: [],
    },
    commitContributionsByRepository: [],
  },
  calendar: {
    totalContributions: 135,
    weeks: [],
  },
  externalRepos: { totalCount: 0, nodes: [] },
  mergedPRs: { totalCount: 0, nodes: [] },
  ...overrides,
});
