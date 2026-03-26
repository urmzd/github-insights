import { describe, expect, it } from "vitest";
import {
  makeContributionCalendar,
  makeContributionData,
  makeRepo,
} from "./__fixtures__/repos.js";
import {
  aggregateLanguages,
  buildSections,
  collectAllDependencies,
  collectAllTopics,
  computeSpotlightProjects,
  getTopProjectsByStars,
  SECTION_KEYS,
  splitProjectsByRecency,
} from "./metrics.js";
import type {
  ContributionRhythm,
  ManifestMap,
  MonthlyLanguageBucket,
} from "./types.js";

// ── aggregateLanguages ──────────────────────────────────────────────────────

describe("aggregateLanguages", () => {
  it("returns top 10 sorted by bytes", () => {
    const repos = Array.from({ length: 12 }, (_, i) =>
      makeRepo({
        name: `repo-${i}`,
        languages: {
          totalSize: 1000 * (i + 1),
          edges: [
            {
              size: 1000 * (i + 1),
              node: {
                name: `Lang${i}`,
                color: `#${String(i).padStart(6, "0")}`,
              },
            },
          ],
        },
      }),
    );
    const result = aggregateLanguages(repos);
    expect(result).toHaveLength(10);
    expect(result[0].name).toBe("Lang11");
  });

  it("computes correct percentages", () => {
    const repos = [
      makeRepo({
        languages: {
          totalSize: 100,
          edges: [
            { size: 75, node: { name: "TypeScript", color: "#3178c6" } },
            { size: 25, node: { name: "JavaScript", color: "#f1e05a" } },
          ],
        },
      }),
    ];
    const result = aggregateLanguages(repos);
    expect(result[0].percent).toBe("75.0");
    expect(result[1].percent).toBe("25.0");
  });

  it("excludes Jupyter Notebook", () => {
    const repos = [
      makeRepo({
        languages: {
          totalSize: 200,
          edges: [
            { size: 100, node: { name: "Jupyter Notebook", color: "#DA5B0B" } },
            { size: 100, node: { name: "Python", color: "#3572A5" } },
          ],
        },
      }),
    ];
    const result = aggregateLanguages(repos);
    expect(result.map((l) => l.name)).not.toContain("Jupyter Notebook");
    expect(result[0].percent).toBe("100.0");
  });

  it("aggregates across repos", () => {
    const repos = [
      makeRepo({
        name: "a",
        languages: {
          totalSize: 50,
          edges: [{ size: 50, node: { name: "Go", color: "#00ADD8" } }],
        },
      }),
      makeRepo({
        name: "b",
        languages: {
          totalSize: 100,
          edges: [{ size: 100, node: { name: "Go", color: "#00ADD8" } }],
        },
      }),
    ];
    const result = aggregateLanguages(repos);
    expect(result[0].name).toBe("Go");
    expect(result[0].value).toBe(150);
  });

  it("returns [] for empty repos", () => {
    expect(aggregateLanguages([])).toEqual([]);
  });
});

// ── collectAllDependencies ──────────────────────────────────────────────────

describe("collectAllDependencies", () => {
  it("collects deps from manifests across repos", () => {
    const repos = [makeRepo({ name: "my-app" }), makeRepo({ name: "other" })];
    const manifests: ManifestMap = new Map([
      [
        "my-app",
        {
          "package.json": JSON.stringify({
            dependencies: { express: "^4", lodash: "^4" },
          }),
        },
      ],
      [
        "other",
        { "package.json": JSON.stringify({ dependencies: { react: "^18" } }) },
      ],
    ]);
    const result = collectAllDependencies(repos, manifests);
    expect(result).toContain("express");
    expect(result).toContain("lodash");
    expect(result).toContain("react");
  });

  it("deduplicates across repos", () => {
    const repos = [makeRepo({ name: "a" }), makeRepo({ name: "b" })];
    const manifests: ManifestMap = new Map([
      [
        "a",
        { "package.json": JSON.stringify({ dependencies: { express: "^4" } }) },
      ],
      [
        "b",
        { "package.json": JSON.stringify({ dependencies: { express: "^4" } }) },
      ],
    ]);
    const result = collectAllDependencies(repos, manifests);
    expect(result.filter((d) => d === "express")).toHaveLength(1);
  });

  it("returns sorted array", () => {
    const repos = [makeRepo({ name: "app" })];
    const manifests: ManifestMap = new Map([
      [
        "app",
        {
          "package.json": JSON.stringify({
            dependencies: { zod: "^3", axios: "^1" },
          }),
        },
      ],
    ]);
    const result = collectAllDependencies(repos, manifests);
    expect(result).toEqual([...result].sort());
  });

  it("returns [] when no manifests", () => {
    const repos = [makeRepo({ name: "empty" })];
    const manifests: ManifestMap = new Map();
    expect(collectAllDependencies(repos, manifests)).toEqual([]);
  });
});

// ── collectAllTopics ────────────────────────────────────────────────────────

describe("collectAllTopics", () => {
  it("collects topics across repos", () => {
    const repos = [
      makeRepo({
        name: "a",
        repositoryTopics: {
          nodes: [
            { topic: { name: "react" } },
            { topic: { name: "typescript" } },
          ],
        },
      }),
      makeRepo({
        name: "b",
        repositoryTopics: { nodes: [{ topic: { name: "python" } }] },
      }),
    ];
    const result = collectAllTopics(repos);
    expect(result).toContain("react");
    expect(result).toContain("typescript");
    expect(result).toContain("python");
  });

  it("deduplicates topics", () => {
    const repos = [
      makeRepo({
        name: "a",
        repositoryTopics: { nodes: [{ topic: { name: "react" } }] },
      }),
      makeRepo({
        name: "b",
        repositoryTopics: { nodes: [{ topic: { name: "react" } }] },
      }),
    ];
    const result = collectAllTopics(repos);
    expect(result.filter((t) => t === "react")).toHaveLength(1);
  });

  it("returns sorted array", () => {
    const repos = [
      makeRepo({
        repositoryTopics: {
          nodes: [{ topic: { name: "zod" } }, { topic: { name: "api" } }],
        },
      }),
    ];
    const result = collectAllTopics(repos);
    expect(result).toEqual([...result].sort());
  });

  it("returns [] for repos with no topics", () => {
    const repos = [makeRepo()];
    expect(collectAllTopics(repos)).toEqual([]);
  });
});

// ── getTopProjectsByStars ───────────────────────────────────────────────────

describe("getTopProjectsByStars", () => {
  it("returns top 5 sorted by stars", () => {
    const repos = Array.from({ length: 8 }, (_, i) =>
      makeRepo({
        name: `repo-${i}`,
        stargazerCount: (i + 1) * 10,
      }),
    );
    const result = getTopProjectsByStars(repos);
    expect(result).toHaveLength(5);
    expect(result[0].name).toBe("repo-7");
    expect(result[0].stars).toBe(80);
  });

  it("maps fields correctly", () => {
    const repos = [
      makeRepo({
        name: "my-project",
        url: "https://github.com/user/my-project",
        description: "A cool project",
        stargazerCount: 42,
      }),
    ];
    const result = getTopProjectsByStars(repos);
    expect(result[0]).toEqual({
      name: "my-project",
      url: "https://github.com/user/my-project",
      description: "A cool project",
      stars: 42,
      languageCount: 2,
      codeSize: 1024,
      languages: ["TypeScript", "JavaScript"],
    });
  });

  it("handles null description", () => {
    const repos = [makeRepo({ description: null, stargazerCount: 5 })];
    const result = getTopProjectsByStars(repos);
    expect(result[0].description).toBe("");
  });

  it("returns [] for empty repos", () => {
    expect(getTopProjectsByStars([])).toEqual([]);
  });
});

// ── splitProjectsByRecency ──────────────────────────────────────────────────

describe("splitProjectsByRecency", () => {
  it("classifies repos into active, maintained, and inactive", () => {
    const repos = [
      makeRepo({
        name: "active-repo",
        stargazerCount: 20,
        createdAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
      makeRepo({ name: "maintained-repo", stargazerCount: 15 }),
      makeRepo({ name: "inactive-repo", stargazerCount: 10 }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: {
            name: "active-repo",
            nameWithOwner: "user/active-repo",
          },
          contributions: { totalCount: 10 },
        },
        {
          repository: {
            name: "maintained-repo",
            nameWithOwner: "user/maintained-repo",
          },
          contributions: { totalCount: 3 },
        },
      ],
    });
    const { active, maintained, inactive } = splitProjectsByRecency(
      repos,
      contribData,
    );
    expect(active.map((p) => p.name)).toContain("active-repo");
    expect(maintained.map((p) => p.name)).toContain("maintained-repo");
    expect(inactive.map((p) => p.name)).toContain("inactive-repo");
  });

  it("sorts active repos by complexity descending", () => {
    const recentDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const repos = [
      makeRepo({
        name: "simple-repo",
        stargazerCount: 100,
        diskUsage: 512,
        createdAt: recentDate,
        languages: {
          totalSize: 10000,
          edges: [
            { size: 10000, node: { name: "JavaScript", color: "#f1e05a" } },
          ],
        },
      }),
      makeRepo({
        name: "complex-repo",
        stargazerCount: 1,
        diskUsage: 50000,
        createdAt: recentDate,
        languages: {
          totalSize: 100000,
          edges: [
            { size: 40000, node: { name: "TypeScript", color: "#3178c6" } },
            { size: 30000, node: { name: "Rust", color: "#dea584" } },
            { size: 20000, node: { name: "Python", color: "#3572A5" } },
            { size: 10000, node: { name: "Go", color: "#00ADD8" } },
          ],
        },
      }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: {
            name: "simple-repo",
            nameWithOwner: "user/simple-repo",
          },
          contributions: { totalCount: 50 },
        },
        {
          repository: {
            name: "complex-repo",
            nameWithOwner: "user/complex-repo",
          },
          contributions: { totalCount: 10 },
        },
      ],
    });
    const { active } = splitProjectsByRecency(repos, contribData);
    expect(active[0].name).toBe("complex-repo");
    expect(active[1].name).toBe("simple-repo");
  });

  it("sorts inactive repos by complexity descending", () => {
    const repos = [
      makeRepo({ name: "low-stars", stargazerCount: 5 }),
      makeRepo({ name: "high-stars", stargazerCount: 50 }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [],
    });
    const { inactive } = splitProjectsByRecency(repos, contribData);
    expect(inactive[0].name).toBe("high-stars");
    expect(inactive[1].name).toBe("low-stars");
  });

  it("returns all qualifying repos without a cap", () => {
    const recentDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const repos = Array.from({ length: 8 }, (_, i) =>
      makeRepo({ name: `repo-${i}`, stargazerCount: i, createdAt: recentDate }),
    );
    const contribData = makeContributionData({
      commitContributionsByRepository: repos.map((r) => ({
        repository: { name: r.name, nameWithOwner: `user/${r.name}` },
        contributions: { totalCount: 10 },
      })),
    });
    // All 8 repos have 10 commits (above threshold) → all active
    const { active } = splitProjectsByRecency(repos, contribData);
    expect(active).toHaveLength(8);
  });

  it("classifies repos below active threshold but with commits as maintained", () => {
    const repos = [makeRepo({ name: "one-off-repo", stargazerCount: 50 })];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: {
            name: "one-off-repo",
            nameWithOwner: "user/one-off-repo",
          },
          contributions: { totalCount: 1 },
        },
      ],
    });
    const { maintained } = splitProjectsByRecency(repos, contribData);
    expect(maintained.map((p) => p.name)).toEqual(["one-off-repo"]);
  });

  it("old repo with many commits is maintained, not active", () => {
    const repos = [
      makeRepo({
        name: "old-sdk",
        stargazerCount: 100,
        createdAt: new Date(
          Date.now() - 3 * 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: { name: "old-sdk", nameWithOwner: "user/old-sdk" },
          contributions: { totalCount: 50 },
        },
      ],
    });
    const { active, maintained } = splitProjectsByRecency(repos, contribData);
    expect(active).toEqual([]);
    expect(maintained.map((p) => p.name)).toEqual(["old-sdk"]);
  });

  it("returns empty arrays for no repos", () => {
    const contribData = makeContributionData();
    const { active, maintained, inactive } = splitProjectsByRecency(
      [],
      contribData,
    );
    expect(active).toEqual([]);
    expect(maintained).toEqual([]);
    expect(inactive).toEqual([]);
  });

  it("treats all repos as inactive when commitContributionsByRepository is missing", () => {
    const repos = [
      makeRepo({ name: "repo-a", stargazerCount: 30 }),
      makeRepo({ name: "repo-b", stargazerCount: 10 }),
    ];
    const contribData = makeContributionData();
    // default makeContributionData has no commitContributionsByRepository
    const { active, maintained, inactive } = splitProjectsByRecency(
      repos,
      contribData,
    );
    expect(active).toEqual([]);
    expect(maintained).toEqual([]);
    expect(inactive).toHaveLength(2);
    expect(inactive[0].name).toBe("repo-a");
  });

  it("uses AI classifications when provided, overriding heuristic", () => {
    const repos = [
      makeRepo({ name: "sdk-repo", stargazerCount: 20 }),
      makeRepo({ name: "old-repo", stargazerCount: 5 }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: { name: "sdk-repo", nameWithOwner: "user/sdk-repo" },
          contributions: { totalCount: 2 }, // heuristic would say "maintained"
        },
      ],
    });
    const aiClassifications = [
      {
        name: "sdk-repo",
        status: "active" as const,
        summary: "SDK for API integration",
      }, // AI overrides to active
      {
        name: "old-repo",
        status: "inactive" as const,
        summary: "Legacy project",
      },
    ];
    const { active, maintained, inactive } = splitProjectsByRecency(
      repos,
      contribData,
      aiClassifications,
    );
    expect(active.map((p) => p.name)).toEqual(["sdk-repo"]);
    expect(maintained).toEqual([]);
    expect(inactive.map((p) => p.name)).toEqual(["old-repo"]);
  });

  it("propagates AI summary to ProjectItem", () => {
    const repos = [makeRepo({ name: "my-repo", stargazerCount: 10 })];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: { name: "my-repo", nameWithOwner: "user/my-repo" },
          contributions: { totalCount: 10 },
        },
      ],
    });
    const aiClassifications = [
      {
        name: "my-repo",
        status: "active" as const,
        summary: "A great project for testing",
      },
    ];
    const { active } = splitProjectsByRecency(
      repos,
      contribData,
      aiClassifications,
    );
    expect(active[0].summary).toBe("A great project for testing");
  });
});

// ── SECTION_KEYS ───────────────────────────────────────────────────────────

describe("SECTION_KEYS", () => {
  it("maps all known section names to filenames", () => {
    expect(SECTION_KEYS.velocity).toBe("metrics-velocity.svg");
    expect(SECTION_KEYS.rhythm).toBe("metrics-rhythm.svg");
    expect(SECTION_KEYS.constellation).toBe("metrics-constellation.svg");
    expect(SECTION_KEYS.impact).toBe("metrics-impact.svg");
  });
});

// ── buildSections ───────────────────────────────────────────────────────────

describe("buildSections", () => {
  const makeRhythm = (): ContributionRhythm => ({
    dayTotals: [10, 20, 15, 25, 18, 12, 5],
    longestStreak: 7,
    stats: [
      { label: "COMMITS", value: "100" },
      { label: "PRS", value: "10" },
    ],
  });

  const makeVelocity = (): MonthlyLanguageBucket[] => [
    {
      month: "2025-01",
      languages: [{ name: "TypeScript", commits: 50, color: "#3178c6" }],
    },
    {
      month: "2025-02",
      languages: [{ name: "TypeScript", commits: 60, color: "#3178c6" }],
    },
  ];

  const baseSectionsInput = () => ({
    velocity: makeVelocity(),
    rhythm: makeRhythm(),
    constellation: [
      {
        name: "big-project",
        url: "https://github.com/user/big-project",
        x: 100,
        y: 100,
        radius: 10,
        color: "#3178c6",
        connections: [],
      },
    ],
    contributionData: makeContributionData(),
  });

  it("returns correct filenames", () => {
    const sections = buildSections(baseSectionsInput());
    const filenames = sections.map((s) => s.filename);
    expect(filenames).toContain("metrics-velocity.svg");
    expect(filenames).toContain("metrics-rhythm.svg");
    expect(filenames).toContain("metrics-constellation.svg");
  });

  it("velocity section is conditional on non-empty velocity data", () => {
    const input = baseSectionsInput();
    input.velocity = [];
    const sections = buildSections(input);
    expect(sections.map((s) => s.filename)).not.toContain(
      "metrics-velocity.svg",
    );
  });

  it("impact section conditional on externalRepos", () => {
    const input = baseSectionsInput();
    input.contributionData = makeContributionData({
      externalRepos: {
        totalCount: 1,
        nodes: [
          {
            nameWithOwner: "org/repo",
            url: "https://github.com/org/repo",
            stargazerCount: 100,
            description: "A popular repo",
            primaryLanguage: { name: "Go" },
          },
        ],
      },
    });
    const sections = buildSections(input);
    expect(sections.map((s) => s.filename)).toContain("metrics-impact.svg");
  });

  it("impact section omitted when no external repos", () => {
    const sections = buildSections(baseSectionsInput());
    expect(sections.map((s) => s.filename)).not.toContain("metrics-impact.svg");
  });

  it("constellation section conditional on non-empty nodes", () => {
    const input = baseSectionsInput();
    input.constellation = [];
    const sections = buildSections(input);
    expect(sections.map((s) => s.filename)).not.toContain(
      "metrics-constellation.svg",
    );
  });

  it("each renderBody(0) does not throw", () => {
    const input = baseSectionsInput();
    input.contributionData = makeContributionData({
      externalRepos: {
        totalCount: 1,
        nodes: [
          {
            nameWithOwner: "org/repo",
            url: "https://github.com/org/repo",
            stargazerCount: 50,
            description: null,
            primaryLanguage: null,
          },
        ],
      },
    });
    const sections = buildSections(input);
    for (const section of sections) {
      if (section.renderBody) {
        expect(() => section.renderBody?.(0)).not.toThrow();
      }
    }
  });
});

// ── computeSpotlightProjects ──────────────────────────────────────────────

describe("computeSpotlightProjects", () => {
  it("returns top N projects sorted by heat score", () => {
    const repos = [
      makeRepo({
        name: "active-repo",
        stargazerCount: 5,
        pushedAt: new Date().toISOString(),
      }),
      makeRepo({
        name: "stale-repo",
        stargazerCount: 100,
        pushedAt: new Date(
          Date.now() - 180 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: {
            name: "active-repo",
            nameWithOwner: "user/active-repo",
          },
          contributions: { totalCount: 30 },
        },
        {
          repository: { name: "stale-repo", nameWithOwner: "user/stale-repo" },
          contributions: { totalCount: 0 },
        },
      ],
    });

    const result = computeSpotlightProjects(repos, contribData, undefined, 5);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("active-repo");
    expect(result[0].heatScore).toBeGreaterThan(result[1].heatScore);
  });

  it("assigns Active label for high commit repos pushed recently", () => {
    const repos = [
      makeRepo({ name: "hot", pushedAt: new Date().toISOString() }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: { name: "hot", nameWithOwner: "user/hot" },
          contributions: { totalCount: 20 },
        },
      ],
    });

    const result = computeSpotlightProjects(repos, contribData);
    expect(result[0].activityLabel).toBe("Active");
  });

  it("assigns Building label for low-commit repos", () => {
    const repos = [
      makeRepo({ name: "new", pushedAt: new Date().toISOString() }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: { name: "new", nameWithOwner: "user/new" },
          contributions: { totalCount: 3 },
        },
      ],
    });

    const result = computeSpotlightProjects(repos, contribData);
    expect(result[0].activityLabel).toBe("Building");
  });

  it("excludes archived repos", () => {
    const repos = [
      makeRepo({ name: "archived", isArchived: true }),
      makeRepo({ name: "active" }),
    ];
    const contribData = makeContributionData({
      commitContributionsByRepository: [
        {
          repository: { name: "archived", nameWithOwner: "user/archived" },
          contributions: { totalCount: 50 },
        },
        {
          repository: { name: "active", nameWithOwner: "user/active" },
          contributions: { totalCount: 5 },
        },
      ],
    });

    const result = computeSpotlightProjects(repos, contribData);
    expect(result.every((p) => p.name !== "archived")).toBe(true);
  });

  it("handles repos with zero commits but recent push", () => {
    const repos = [
      makeRepo({
        name: "fresh",
        stargazerCount: 0,
        pushedAt: new Date().toISOString(),
      }),
    ];
    const contribData = makeContributionData();

    const result = computeSpotlightProjects(repos, contribData);
    expect(result.length).toBe(1);
    expect(result[0].heatScore).toBeGreaterThan(0);
    expect(result[0].activityLabel).toBe("Building");
  });

  it("respects topN limit", () => {
    const repos = Array.from({ length: 10 }, (_, i) =>
      makeRepo({ name: `repo-${i}`, pushedAt: new Date().toISOString() }),
    );
    const contribData = makeContributionData();

    const result = computeSpotlightProjects(repos, contribData, undefined, 3);
    expect(result.length).toBe(3);
  });
});
