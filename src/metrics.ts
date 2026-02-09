import { parseManifest } from "./parsers.js";
import { renderContributionCards } from "./components/contribution-cards.js";
import { renderStatCards } from "./components/stat-cards.js";
import { renderProjectCards } from "./components/project-cards.js";
import { renderDonutChart } from "./components/donut-chart.js";
import { renderDomainCloud } from "./components/domain-cloud.js";
import { renderBarChart } from "./components/bar-chart.js";
import { renderSubHeader, renderDivider } from "./components/section.js";
import type {
  RepoNode,
  ManifestMap,
  DomainMap,
  LanguageItem,
  TechItem,
  ComplexityItem,
  DomainItem,
  ContributionData,
  ContributionsByRepo,
  SectionDef,
  RenderResult,
} from "./types.js";

// ── Category Sets ───────────────────────────────────────────────────────────

const EXCLUDED_LANGUAGES = new Set(["Jupyter Notebook"]);

const FRAMEWORK_TOPICS = new Set([
  "react", "nextjs", "next-js", "vue", "vuejs", "angular", "svelte",
  "sveltekit", "astro", "remix", "gatsby", "nuxt", "fastapi", "django",
  "flask", "express", "nestjs", "spring", "spring-boot", "rails",
  "ruby-on-rails", "laravel", "pytorch", "tensorflow", "keras",
  "scikit-learn", "huggingface", "langchain", "axum", "actix", "rocket",
  "gin", "fiber", "echo",
]);

const FRAMEWORK_DEPS = new Set([
  "react", "react-dom", "next", "vue", "angular", "svelte", "@sveltejs/kit",
  "astro", "remix", "gatsby", "nuxt", "fastapi", "django", "flask",
  "express", "nestjs", "@nestjs/core", "torch", "pytorch", "tensorflow",
  "tf", "keras", "scikit-learn", "sklearn", "transformers", "langchain",
  "axum", "actix-web", "rocket", "gin", "fiber", "echo", "hono", "elysia",
  "solid-js", "qwik", "htmx",
]);

const DB_INFRA_TOPICS = new Set([
  "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
  "dynamodb", "cassandra", "elasticsearch", "docker", "kubernetes", "k8s",
  "aws", "gcp", "azure", "terraform", "ansible", "nginx", "graphql",
  "grpc", "kafka", "rabbitmq", "supabase", "firebase", "vercel", "netlify",
]);

const DB_INFRA_DEPS = new Set([
  "pg", "mysql2", "mongoose", "mongodb", "redis", "ioredis", "prisma",
  "@prisma/client", "typeorm", "sequelize", "knex", "drizzle-orm", "sqlx",
  "diesel", "sea-orm", "sqlalchemy", "psycopg2", "pymongo", "boto3",
  "docker", "docker-compose", "supabase", "@supabase/supabase-js",
  "firebase", "firebase-admin", "@google-cloud/storage", "aws-sdk",
  "@aws-sdk/client-s3", "graphql", "apollo-server", "@apollo/client",
  "grpc", "tonic",
]);

const ML_AI_NAMES = new Set([
  "pytorch", "torch", "tensorflow", "tf", "keras", "scikit-learn", "sklearn",
  "huggingface", "transformers", "langchain",
]);

const DATABASE_NAMES = new Set([
  "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "dynamodb",
  "cassandra", "elasticsearch", "pg", "mysql2", "mongoose", "prisma",
  "typeorm", "sequelize", "knex", "drizzle-orm", "sqlx",
  "diesel", "sea-orm", "sqlalchemy", "psycopg2", "pymongo", "ioredis",
]);

// ── Aggregation ─────────────────────────────────────────────────────────────

export const aggregateLanguages = (repos: RepoNode[]): LanguageItem[] => {
  const langBytes = new Map<string, number>();
  const langColors = new Map<string, string>();

  for (const repo of repos) {
    for (const edge of repo.languages?.edges || []) {
      const name = edge.node.name;
      if (EXCLUDED_LANGUAGES.has(name)) continue;
      langBytes.set(name, (langBytes.get(name) || 0) + edge.size);
      if (!langColors.has(name)) langColors.set(name, edge.node.color);
    }
  }

  const total = [...langBytes.values()].reduce((a, b) => a + b, 0);
  return [...langBytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, bytes]) => ({
      name,
      value: bytes,
      percent: ((bytes / total) * 100).toFixed(1),
      color: langColors.get(name) || "#8b949e",
    }));
};

// ── Classification ──────────────────────────────────────────────────────────

export const classifyDependencies = (
  repos: RepoNode[],
  manifests: ManifestMap,
): { frameworks: TechItem[]; dbInfra: TechItem[]; tools: TechItem[] } => {
  const frameworks = new Map<string, Set<string>>();
  const dbInfra = new Map<string, Set<string>>();
  const tools = new Map<string, Set<string>>();

  for (const repo of repos) {
    const topics = (repo.repositoryTopics?.nodes || []).map(
      (n) => n.topic.name,
    );
    for (const topic of topics) {
      if (FRAMEWORK_TOPICS.has(topic)) {
        if (!frameworks.has(topic)) frameworks.set(topic, new Set());
        frameworks.get(topic)!.add(repo.name);
      } else if (DB_INFRA_TOPICS.has(topic)) {
        if (!dbInfra.has(topic)) dbInfra.set(topic, new Set());
        dbInfra.get(topic)!.add(repo.name);
      }
    }

    const files = manifests.get(repo.name) || {};
    const allDeps = Object.entries(files).flatMap(([filename, text]) =>
      parseManifest(filename, text),
    );

    const seen = new Set<string>();
    for (const raw of allDeps) {
      const dep = raw.startsWith("@") ? raw.split("/").pop()! : raw;
      const lower = dep.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);

      if (FRAMEWORK_DEPS.has(lower)) {
        if (!frameworks.has(dep)) frameworks.set(dep, new Set());
        frameworks.get(dep)!.add(repo.name);
      } else if (DB_INFRA_DEPS.has(lower)) {
        if (!dbInfra.has(dep)) dbInfra.set(dep, new Set());
        dbInfra.get(dep)!.add(repo.name);
      } else {
        if (!tools.has(dep)) tools.set(dep, new Set());
        tools.get(dep)!.add(repo.name);
      }
    }
  }

  const toSorted = (map: Map<string, Set<string>>): TechItem[] =>
    [...map.entries()]
      .map(([name, repos]) => ({ name, value: repos.size }))
      .sort((a, b) => b.value - a.value);

  return {
    frameworks: toSorted(frameworks).slice(0, 10),
    dbInfra: toSorted(dbInfra).slice(0, 10),
    tools: toSorted(tools)
      .filter((t) => t.value >= 2)
      .slice(0, 10),
  };
};

// ── Scoring ─────────────────────────────────────────────────────────────────

export const computeComplexityScores = (repos: RepoNode[]): ComplexityItem[] =>
  repos
    .map((repo) => {
      const langCount = (repo.languages?.edges || []).filter(
        (e) => !EXCLUDED_LANGUAGES.has(e.node.name),
      ).length;
      const diskKB = Math.max(repo.diskUsage || 1, 1);
      const codeBytes = Math.max(repo.languages?.totalSize || 1, 1);
      const depCount = (repo.languages?.edges || []).length;

      const score =
        langCount * 15 +
        Math.log10(diskKB) * 20 +
        Math.log10(codeBytes) * 15 +
        Math.min(depCount, 50);

      return {
        name: repo.name,
        url: repo.url,
        description: repo.description || "",
        value: Math.round(score),
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

// ── Sub-classification ──────────────────────────────────────────────────────

export const subClassify = (
  frameworks: TechItem[],
  dbInfra: TechItem[],
): {
  webFrameworks: TechItem[];
  mlAi: TechItem[];
  databases: TechItem[];
  cloudInfra: TechItem[];
} => ({
  webFrameworks: frameworks.filter(
    (f) => !ML_AI_NAMES.has(f.name.toLowerCase()),
  ),
  mlAi: frameworks.filter((f) => ML_AI_NAMES.has(f.name.toLowerCase())),
  databases: dbInfra.filter((d) => DATABASE_NAMES.has(d.name.toLowerCase())),
  cloudInfra: dbInfra.filter(
    (d) => !DATABASE_NAMES.has(d.name.toLowerCase()),
  ),
});

// ── Domain Aggregation ──────────────────────────────────────────────────────

export const aggregateDomains = (domainMap: DomainMap): DomainItem[] => {
  const counts = new Map<string, number>();
  const reposByDomain = new Map<string, string[]>();

  for (const [repo, tags] of domainMap) {
    for (const tag of tags) {
      const normalized = tag.trim();
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
      if (!reposByDomain.has(normalized))
        reposByDomain.set(normalized, []);
      reposByDomain.get(normalized)!.push(repo);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      repos: reposByDomain.get(name) || [],
    }))
    .sort((a, b) => b.count - a.count);
};

// ── Recently Active ─────────────────────────────────────────────────────────

export const computeRecentlyActive = (
  contributionsByRepo: ContributionsByRepo[],
  repos: RepoNode[],
): Set<string> => {
  const recentRepoNames = new Set<string>();
  for (const entry of contributionsByRepo) {
    if (entry.contributions.totalCount > 0) {
      recentRepoNames.add(
        entry.repository.nameWithOwner.split("/").pop()!,
      );
    }
  }

  const activeSet = new Set<string>();
  for (const repo of repos) {
    if (!recentRepoNames.has(repo.name)) continue;
    if (repo.primaryLanguage?.name) {
      activeSet.add(repo.primaryLanguage.name.toLowerCase());
    }
    for (const edge of repo.languages?.edges || []) {
      activeSet.add(edge.node.name.toLowerCase());
    }
    for (const node of repo.repositoryTopics?.nodes || []) {
      activeSet.add(node.topic.name.toLowerCase());
    }
  }

  return activeSet;
};

export const markRecentlyActive = (
  itemLists: { trending?: boolean; name: string }[][],
  recentlyActiveSet: Set<string>,
): void => {
  for (const list of itemLists) {
    for (const item of list) {
      item.trending = recentlyActiveSet.has(item.name.toLowerCase());
    }
  }
};

// ── Section definitions ─────────────────────────────────────────────────────

export const buildSections = ({
  languages,
  webFrameworks,
  mlAi,
  databases,
  cloudInfra,
  complexity,
  domains,
  domainMap,
  contributionData,
}: {
  languages: LanguageItem[];
  webFrameworks: TechItem[];
  mlAi: TechItem[];
  databases: TechItem[];
  cloudInfra: TechItem[];
  complexity: ComplexityItem[];
  domains: DomainItem[];
  domainMap: DomainMap;
  contributionData: ContributionData;
}): SectionDef[] => {
  const sections: SectionDef[] = [];

  // 1. Work Domains
  if (domains && domains.length > 0) {
    sections.push({
      filename: "metrics-domains.svg",
      title: "Work Domains",
      subtitle: "Extracted from project READMEs via AI analysis",
      renderBody: (y: number) => renderDomainCloud(domains, y),
    });
  }

  // 2. Languages
  sections.push({
    filename: "metrics-languages.svg",
    title: "Languages",
    subtitle: "By bytes of code across all public repos",
    renderBody: (y: number) => renderDonutChart(languages, y),
  });

  // 3. Tech Stack
  const techStackParts = [
    { label: "WEB FRAMEWORKS", items: webFrameworks },
    { label: "ML & AI", items: mlAi },
    { label: "DATABASES", items: databases },
    { label: "CLOUD & INFRASTRUCTURE", items: cloudInfra },
  ].filter((p) => p.items.length > 0);

  if (techStackParts.length > 0) {
    sections.push({
      filename: "metrics-tech-stack.svg",
      title: "Tech Stack",
      subtitle: "Detected from topics and dependency manifests",
      renderBody: (y: number): RenderResult => {
        let svg = "";
        let height = 0;

        for (let i = 0; i < techStackParts.length; i++) {
          const part = techStackParts[i];

          if (i > 0) {
            const div = renderDivider(y + height + 6);
            svg += div.svg;
            height += 18;
          }

          const sub = renderSubHeader(part.label, y + height);
          svg += sub.svg;
          height += sub.height + 6;

          const bars = renderBarChart(part.items, y + height);
          svg += bars.svg;
          height += bars.height + 10;
        }

        return { svg, height };
      },
    });
  }

  // 4. Signature Projects
  sections.push({
    filename: "metrics-complexity.svg",
    title: "Signature Projects",
    subtitle:
      "Top projects by complexity score (languages, disk usage, code size)",
    renderBody: (y: number) => renderProjectCards(complexity, domainMap, y),
  });

  // 5. At a Glance
  sections.push({
    filename: "metrics-pulse.svg",
    title: "At a Glance",
    subtitle: "Contribution activity over the past year",
    renderBody: (y: number) => {
      const stats = [
        {
          label: "COMMITS",
          value:
            contributionData.contributions.totalCommitContributions.toLocaleString(),
        },
        {
          label: "PRS",
          value:
            contributionData.contributions.totalPullRequestContributions.toLocaleString(),
        },
        {
          label: "REVIEWS",
          value:
            contributionData.contributions.totalPullRequestReviewContributions.toLocaleString(),
        },
        {
          label: "REPOS",
          value:
            contributionData.contributions.totalRepositoriesWithContributedCommits.toLocaleString(),
        },
      ];
      return renderStatCards(stats, y);
    },
  });

  // 6. Open Source Contributions
  if (contributionData.externalRepos.nodes.length > 0) {
    sections.push({
      filename: "metrics-contributions.svg",
      title: "Open Source Contributions",
      subtitle: "External repositories contributed to (all time)",
      renderBody: (y: number) => {
        const repos = contributionData.externalRepos.nodes.slice(0, 5);
        const highlights = repos.map((r) => ({
          project: r.nameWithOwner,
          detail: [
            r.stargazerCount > 0
              ? `\u2605 ${r.stargazerCount.toLocaleString()}`
              : null,
            r.primaryLanguage?.name,
          ]
            .filter(Boolean)
            .join(" \u00b7 "),
        }));
        return renderContributionCards(highlights, y);
      },
    });
  }

  return sections;
};
