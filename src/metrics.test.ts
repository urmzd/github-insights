import { describe, expect, it } from "vitest";
import { makeContributionData, makeRepo } from "./__fixtures__/repos.js";
import {
  aggregateLanguages,
  buildSections,
  collectAllDependencies,
  collectAllTopics,
  getTopProjectsByStars,
} from "./metrics.js";
import type { ManifestMap, TechHighlight } from "./types.js";

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

// ── buildSections ───────────────────────────────────────────────────────────

describe("buildSections", () => {
  const baseSectionsInput = () => ({
    languages: [
      { name: "TypeScript", value: 100, percent: "80.0", color: "#3178c6" },
      { name: "JavaScript", value: 25, percent: "20.0", color: "#f1e05a" },
    ],
    techHighlights: [
      {
        category: "Frontend",
        items: ["React", "TypeScript", "Next.js"],
        score: 90,
      },
      { category: "Backend", items: ["Express", "PostgreSQL"], score: 75 },
    ] as TechHighlight[],
    projects: [
      {
        name: "big-project",
        url: "https://github.com/user/big-project",
        description: "A complex project",
        stars: 85,
      },
    ],
    contributionData: makeContributionData(),
  });

  it("returns correct filenames", () => {
    const sections = buildSections(baseSectionsInput());
    const filenames = sections.map((s) => s.filename);
    expect(filenames).toContain("metrics-languages.svg");
    expect(filenames).toContain("metrics-expertise.svg");
    expect(filenames).toContain("metrics-complexity.svg");
    expect(filenames).toContain("metrics-pulse.svg");
  });

  it("expertise section is conditional on non-empty techHighlights", () => {
    const input = baseSectionsInput();
    input.techHighlights = [];
    const sections = buildSections(input);
    expect(sections.map((s) => s.filename)).not.toContain(
      "metrics-expertise.svg",
    );
  });

  it("contributions section conditional on externalRepos", () => {
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
    expect(sections.map((s) => s.filename)).toContain(
      "metrics-contributions.svg",
    );
  });

  it("contributions section omitted when no external repos", () => {
    const sections = buildSections(baseSectionsInput());
    expect(sections.map((s) => s.filename)).not.toContain(
      "metrics-contributions.svg",
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
