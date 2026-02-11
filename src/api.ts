import * as github from "@actions/github";
import type {
  ContributionData,
  ManifestMap,
  ReadmeMap,
  RepoNode,
  TechHighlight,
} from "./types.js";

const MANIFEST_FILES = [
  "package.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "requirements.txt",
];

type GraphQL = ReturnType<typeof github.getOctokit>["graphql"];

const makeGraphql = (token: string): GraphQL =>
  github.getOctokit(token).graphql;

export const fetchAllRepoData = async (
  token: string,
  username: string,
): Promise<RepoNode[]> => {
  const graphql = makeGraphql(token);
  const data: {
    user: { repositories: { nodes: RepoNode[] } };
  } = await graphql(`{
    user(login: "${username}") {
      repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}, ownerAffiliations: OWNER, privacy: PUBLIC) {
        nodes {
          name
          description
          url
          stargazerCount
          diskUsage
          primaryLanguage { name color }
          isArchived
          isFork
          repositoryTopics(first: 20) {
            nodes { topic { name } }
          }
          languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
            totalSize
            edges { size node { name color } }
          }
        }
      }
    }
  }`);

  return data.user.repositories.nodes.filter((r) => !r.isArchived && !r.isFork);
};

export const fetchManifestsForRepos = async (
  token: string,
  username: string,
  repos: RepoNode[],
): Promise<ManifestMap> => {
  const graphql = makeGraphql(token);
  const manifests: ManifestMap = new Map();
  const batchSize = 10;

  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const aliases = batch
      .map((repo, idx) => {
        const alias = `repo_${idx}`;
        const fileQueries = MANIFEST_FILES.map((file) => {
          const fieldName = file.replace(/[-.]/g, "_");
          return `${fieldName}: object(expression: "HEAD:${file}") { ... on Blob { text } }`;
        }).join("\n            ");
        return `${alias}: repository(owner: "${username}", name: "${repo.name}") {
            ${fileQueries}
          }`;
      })
      .join("\n      ");

    try {
      const data: Record<
        string,
        Record<string, { text?: string } | null>
      > = await graphql(`{ ${aliases} }`);
      batch.forEach((repo, idx) => {
        const repoData = data[`repo_${idx}`];
        if (!repoData) return;
        const files: Record<string, string> = {};
        for (const file of MANIFEST_FILES) {
          const fieldName = file.replace(/[-.]/g, "_");
          const entry = repoData[fieldName] as { text?: string } | null;
          if (entry?.text) {
            files[file] = entry.text;
          }
        }
        if (Object.keys(files).length > 0) {
          manifests.set(repo.name, files);
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: manifest batch fetch failed: ${msg}`);
    }
  }

  return manifests;
};

export const fetchContributionData = async (
  token: string,
  username: string,
): Promise<ContributionData> => {
  const graphql = makeGraphql(token);
  try {
    const now = new Date();
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);

    const data = await graphql(
      `query($from: DateTime!, $to: DateTime!) {
        user(login: "${username}") {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            totalRepositoriesWithContributedCommits
          }
          repositoriesContributedTo(first: 50, includeUserRepositories: false, contributionTypes: [COMMIT, PULL_REQUEST]) {
            totalCount
            nodes { nameWithOwner url stargazerCount description primaryLanguage { name } }
          }
        }
      }`,
      { from: from.toISOString(), to: now.toISOString() },
    );

    const user = (data as Record<string, Record<string, unknown>>).user;
    return {
      contributions: user.contributionsCollection,
      externalRepos: user.repositoriesContributedTo,
    } as ContributionData;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Contribution data fetch failed (non-fatal): ${msg}`);
    return {
      contributions: {
        totalCommitContributions: 0,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
        totalRepositoriesWithContributedCommits: 0,
      },
      externalRepos: { totalCount: 0, nodes: [] },
    };
  }
};

export const fetchReadmeForRepos = async (
  token: string,
  username: string,
  repos: RepoNode[],
): Promise<ReadmeMap> => {
  const graphql = makeGraphql(token);
  const readmeMap: ReadmeMap = new Map();
  const batchSize = 10;

  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const aliases = batch
      .map((repo, idx) => {
        const alias = `repo_${idx}`;
        return `${alias}: repository(owner: "${username}", name: "${repo.name}") {
            readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
          }`;
      })
      .join("\n      ");

    try {
      const data: Record<string, { readme?: { text?: string } } | null> =
        await graphql(`{ ${aliases} }`);
      batch.forEach((repo, idx) => {
        const repoData = data[`repo_${idx}`];
        if (repoData?.readme?.text) {
          readmeMap.set(repo.name, repoData.readme.text);
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: README batch fetch failed: ${msg}`);
    }
  }

  return readmeMap;
};

export const fetchExpertiseAnalysis = async (
  token: string,
  languages: { name: string; percent: string }[],
  allDeps: string[],
  allTopics: string[],
  repos: RepoNode[],
  readmeMap: ReadmeMap,
): Promise<TechHighlight[]> => {
  try {
    const langLines = languages
      .map((l) => `- ${l.name}: ${l.percent}%`)
      .join("\n");

    const repoSummaries = repos
      .slice(0, 20)
      .map((r) => {
        const readme = readmeMap.get(r.name) || "";
        const snippet = readme.slice(0, 500).replace(/\n/g, " ");
        const desc = r.description || "";
        return `- ${r.name}: ${desc} | ${snippet}`;
      })
      .join("\n");

    const prompt = `You are analyzing a developer's GitHub profile to create a curated expertise showcase.

Languages (by code volume):
${langLines}

Dependencies found across repositories:
${allDeps.join(", ")}

Repository topics:
${allTopics.join(", ")}

Repository descriptions and README excerpts:
${repoSummaries}

From this data, produce a curated expertise profile:
- Group the most notable technologies into 3-6 expertise categories
- Use domain-oriented category names (e.g., "Machine Learning", "Web Development", "DevOps", "Backend & APIs", "Data Science", "Systems Programming")
- Include 3-6 of the most relevant technologies/tools per category
- Normalize names to their common display form (e.g., "pg" → "PostgreSQL", "torch" → "PyTorch", "boto3" → "AWS SDK")
- Skip trivial utility libraries (lodash, uuid, etc.) that don't showcase meaningful expertise
- Only include categories where there's meaningful evidence of usage`;

    const res = await fetch(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tech_highlights",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  highlights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        items: { type: "array", items: { type: "string" } },
                      },
                      required: ["category", "items"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["highlights"],
                additionalProperties: false,
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      console.warn(`GitHub Models API error: ${res.status}`);
      return [];
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as { highlights?: TechHighlight[] };
    return (parsed.highlights || []).filter(
      (h) => h.category && Array.isArray(h.items) && h.items.length > 0,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Expertise analysis failed (non-fatal): ${msg}`);
    return [];
  }
};
