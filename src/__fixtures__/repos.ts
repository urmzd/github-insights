import type {
  ContributionCalendar,
  ContributionData,
  RepoNode,
  UserProfile,
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
  pushedAt: new Date().toISOString(),
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

export const makeContributionCalendar = (): ContributionCalendar => ({
  totalContributions: 365,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 0, date: "2025-01-05", color: "#161b22" },
        { contributionCount: 3, date: "2025-01-06", color: "#0e4429" },
        { contributionCount: 5, date: "2025-01-07", color: "#006d32" },
        { contributionCount: 0, date: "2025-01-08", color: "#161b22" },
        { contributionCount: 1, date: "2025-01-09", color: "#0e4429" },
        { contributionCount: 10, date: "2025-01-10", color: "#39d353" },
        { contributionCount: 0, date: "2025-01-11", color: "#161b22" },
      ],
    },
    {
      contributionDays: [
        { contributionCount: 2, date: "2025-01-12", color: "#0e4429" },
        { contributionCount: 0, date: "2025-01-13", color: "#161b22" },
        { contributionCount: 7, date: "2025-01-14", color: "#006d32" },
        { contributionCount: 0, date: "2025-01-15", color: "#161b22" },
        { contributionCount: 4, date: "2025-01-16", color: "#0e4429" },
        { contributionCount: 0, date: "2025-01-17", color: "#161b22" },
        { contributionCount: 0, date: "2025-01-18", color: "#161b22" },
      ],
    },
  ],
});

export const makeUserProfile = (
  overrides: Partial<UserProfile> = {},
): UserProfile => ({
  name: "Urmzd Maharramoff",
  bio: "Building tools for developers",
  company: null,
  location: "Austin, TX",
  websiteUrl: "https://urmzd.dev",
  twitterUsername: "urmzd",
  socialAccounts: [
    { provider: "LINKEDIN", url: "https://linkedin.com/in/urmzd" },
  ],
  ...overrides,
});
