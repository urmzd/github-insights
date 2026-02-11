import type { ContributionData, RepoNode } from "../types.js";

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

export const makeContributionData = (
  overrides: Partial<ContributionData> = {},
): ContributionData => ({
  contributions: {
    totalCommitContributions: 100,
    totalPullRequestContributions: 20,
    totalPullRequestReviewContributions: 10,
    totalRepositoriesWithContributedCommits: 8,
  },
  externalRepos: { totalCount: 0, nodes: [] },
  ...overrides,
});
