import { describe, it, expect } from "vitest";
import {
  aggregateLanguages,
  collectAllDependencies,
  collectAllTopics,
  computeComplexityScores,
  aggregateDomains,
  computeRecentlyActive,
  markRecentlyActive,
  buildSections,
} from "./metrics.js";
import { makeRepo, makeContributionsByRepo, makeContributionData } from "./__fixtures__/repos.js";
import type { ManifestMap, DomainMap, TechHighlight } from "./types.js";

// ── aggregateLanguages ──────────────────────────────────────────────────────

describe("aggregateLanguages", () => {
  it("returns top 10 sorted by bytes", () => {
    const repos = Array.from({ length: 12 }, (_, i) =>
      makeRepo({
        name: `repo-${i}`,
        languages: {
          totalSize: 1000 * (i + 1),
          edges: [
            { size: 1000 * (i + 1), node: { name: `Lang${i}`, color: `#${String(i).padStart(6, "0")}` } },
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
      ["my-app", { "package.json": JSON.stringify({ dependencies: { express: "^4", lodash: "^4" } }) }],
      ["other", { "package.json": JSON.stringify({ dependencies: { react: "^18" } }) }],
    ]);
    const result = collectAllDependencies(repos, manifests);
    expect(result).toContain("express");
    expect(result).toContain("lodash");
    expect(result).toContain("react");
  });

  it("deduplicates across repos", () => {
    const repos = [makeRepo({ name: "a" }), makeRepo({ name: "b" })];
    const manifests: ManifestMap = new Map([
      ["a", { "package.json": JSON.stringify({ dependencies: { express: "^4" } }) }],
      ["b", { "package.json": JSON.stringify({ dependencies: { express: "^4" } }) }],
    ]);
    const result = collectAllDependencies(repos, manifests);
    expect(result.filter((d) => d === "express")).toHaveLength(1);
  });

  it("returns sorted array", () => {
    const repos = [makeRepo({ name: "app" })];
    const manifests: ManifestMap = new Map([
      ["app", { "package.json": JSON.stringify({ dependencies: { zod: "^3", axios: "^1" } }) }],
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
        repositoryTopics: { nodes: [{ topic: { name: "react" } }, { topic: { name: "typescript" } }] },
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
        repositoryTopics: { nodes: [{ topic: { name: "zod" } }, { topic: { name: "api" } }] },
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

// ── computeComplexityScores ─────────────────────────────────────────────────

describe("computeComplexityScores", () => {
  it("returns top 5", () => {
    const repos = Array.from({ length: 8 }, (_, i) =>
      makeRepo({
        name: `repo-${i}`,
        diskUsage: 1000 * (i + 1),
        languages: {
          totalSize: 5000 * (i + 1),
          edges: Array.from({ length: i + 1 }, (_, j) => ({
            size: 1000,
            node: { name: `Lang${j}`, color: "#000" },
          })),
        },
      }),
    );
    expect(computeComplexityScores(repos)).toHaveLength(5);
  });

  it("applies correct formula", () => {
    const repo = makeRepo({
      name: "calc-test",
      diskUsage: 1000,
      languages: {
        totalSize: 10000,
        edges: [
          { size: 5000, node: { name: "Go", color: "#00ADD8" } },
          { size: 5000, node: { name: "Rust", color: "#dea584" } },
        ],
      },
    });
    const result = computeComplexityScores([repo]);
    const langCount = 2;
    const diskKB = 1000;
    const codeBytes = 10000;
    const depCount = 2;
    const expected =
      langCount * 15 +
      Math.log10(diskKB) * 20 +
      Math.log10(codeBytes) * 15 +
      Math.min(depCount, 50);
    expect(result[0].value).toBe(Math.round(expected));
  });

  it("handles 0 diskUsage (clamps to 1)", () => {
    const repo = makeRepo({
      name: "empty",
      diskUsage: 0,
      languages: { totalSize: 0, edges: [] },
    });
    const result = computeComplexityScores([repo]);
    expect(result[0].value).toBeGreaterThanOrEqual(0);
  });
});

// ── aggregateDomains ────────────────────────────────────────────────────────

describe("aggregateDomains", () => {
  it("counts occurrences and tracks repos per domain", () => {
    const domainMap: DomainMap = new Map([
      ["repo-a", ["web", "ml"]],
      ["repo-b", ["web", "devops"]],
    ]);
    const result = aggregateDomains(domainMap);
    const web = result.find((d) => d.name === "web")!;
    expect(web.count).toBe(2);
    expect(web.repos).toEqual(["repo-a", "repo-b"]);
  });

  it("sorts by count descending", () => {
    const domainMap: DomainMap = new Map([
      ["a", ["rare"]],
      ["b", ["common"]],
      ["c", ["common"]],
      ["d", ["common"]],
    ]);
    const result = aggregateDomains(domainMap);
    expect(result[0].name).toBe("common");
    expect(result[0].count).toBe(3);
  });

  it("returns [] for empty map", () => {
    expect(aggregateDomains(new Map())).toEqual([]);
  });
});

// ── computeRecentlyActive ───────────────────────────────────────────────────

describe("computeRecentlyActive", () => {
  it("collects languages and topics from repos with contributions > 0", () => {
    const contributions = [
      makeContributionsByRepo({
        repository: {
          nameWithOwner: "user/active-repo",
          stargazerCount: 5,
          primaryLanguage: { name: "TypeScript" },
          isPrivate: false,
        },
        contributions: { totalCount: 10 },
      }),
    ];
    const repos = [
      makeRepo({
        name: "active-repo",
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
        repositoryTopics: { nodes: [{ topic: { name: "react" } }] },
        languages: {
          totalSize: 1000,
          edges: [{ size: 1000, node: { name: "TypeScript", color: "#3178c6" } }],
        },
      }),
    ];
    const result = computeRecentlyActive(contributions, repos);
    expect(result.has("typescript")).toBe(true);
    expect(result.has("react")).toBe(true);
  });

  it("ignores repos with 0 contributions", () => {
    const contributions = [
      makeContributionsByRepo({ contributions: { totalCount: 0 } }),
    ];
    const repos = [makeRepo()];
    const result = computeRecentlyActive(contributions, repos);
    expect(result.size).toBe(0);
  });
});

// ── markRecentlyActive ──────────────────────────────────────────────────────

describe("markRecentlyActive", () => {
  it("sets trending=true for matching names (case-insensitive)", () => {
    const items = [
      { name: "TypeScript", value: 100, trending: false },
      { name: "Go", value: 50, trending: false },
    ];
    const active = new Set(["typescript"]);
    markRecentlyActive([items], active);
    expect(items[0].trending).toBe(true);
    expect(items[1].trending).toBe(false);
  });

  it("handles multiple lists", () => {
    const list1: { name: string; value: number; trending?: boolean }[] = [{ name: "react", value: 3 }];
    const list2: { name: string; value: number; trending?: boolean }[] = [{ name: "docker", value: 2 }];
    markRecentlyActive([list1, list2], new Set(["react", "docker"]));
    expect(list1[0].trending).toBe(true);
    expect(list2[0].trending).toBe(true);
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
      { category: "Frontend", items: ["React", "TypeScript", "Next.js"] },
      { category: "Backend", items: ["Express", "PostgreSQL"] },
    ] as TechHighlight[],
    complexity: [
      { name: "big-project", url: "https://github.com/user/big-project", description: "A complex project", value: 85 },
    ],
    domains: [{ name: "web", count: 3, repos: ["a", "b", "c"] }],
    domainMap: new Map([["big-project", ["web"]]]) as DomainMap,
    contributionData: makeContributionData(),
  });

  it("returns correct filenames", () => {
    const sections = buildSections(baseSectionsInput());
    const filenames = sections.map((s) => s.filename);
    expect(filenames).toContain("metrics-domains.svg");
    expect(filenames).toContain("metrics-languages.svg");
    expect(filenames).toContain("metrics-tech-stack.svg");
    expect(filenames).toContain("metrics-complexity.svg");
    expect(filenames).toContain("metrics-pulse.svg");
  });

  it("domains section is conditional on non-empty", () => {
    const input = baseSectionsInput();
    input.domains = [];
    const sections = buildSections(input);
    expect(sections.map((s) => s.filename)).not.toContain("metrics-domains.svg");
  });

  it("tech stack section is conditional on non-empty techHighlights", () => {
    const input = baseSectionsInput();
    input.techHighlights = [];
    const sections = buildSections(input);
    expect(sections.map((s) => s.filename)).not.toContain("metrics-tech-stack.svg");
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
    expect(sections.map((s) => s.filename)).toContain("metrics-contributions.svg");
  });

  it("contributions section omitted when no external repos", () => {
    const sections = buildSections(baseSectionsInput());
    expect(sections.map((s) => s.filename)).not.toContain("metrics-contributions.svg");
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
        expect(() => section.renderBody!(0)).not.toThrow();
      }
    }
  });
});
