import * as github from "@actions/github";
import type { UserConfig } from "./config.js";
import { interpolate, type PromptValves } from "./prompts.js";
import type {
  ContributionData,
  ManifestMap,
  ProjectItem,
  ReadmeMap,
  RepoClassificationInput,
  RepoClassificationOutput,
  RepoNode,
  UserProfile,
} from "./types.js";

const MAX_RETRIES = 3;

const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  label: string,
): Promise<Response | null> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429) return res;

    if (attempt === MAX_RETRIES) {
      console.warn(`${label}: rate limited after ${MAX_RETRIES + 1} attempts`);
      return null;
    }

    const retryAfter = res.headers.get("retry-after");
    const waitSec = retryAfter ? Math.min(Number(retryAfter) || 10, 60) : 10;
    console.warn(
      `${label}: rate limited, retrying in ${waitSec}s (attempt ${attempt + 1}/${MAX_RETRIES})`,
    );
    await new Promise((r) => setTimeout(r, waitSec * 1000));
  }
  return null;
};

const MANIFEST_FILES = [
  "package.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "requirements.txt",
];

export type GraphQL = ReturnType<typeof github.getOctokit>["graphql"];

export const makeGraphql = (token: string): GraphQL =>
  github.getOctokit(token).graphql;

export const fetchAllRepoData = async (
  graphql: GraphQL,
  username: string,
): Promise<RepoNode[]> => {
  const data: {
    user: { repositories: { nodes: RepoNode[] } };
  } = await graphql(
    `query($username: String!) {
    user(login: $username) {
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
          createdAt
          pushedAt
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
  }`,
    { username },
  );

  return data.user.repositories.nodes.filter((r) => !r.isFork);
};

export const fetchManifestsForRepos = async (
  graphql: GraphQL,
  username: string,
  repos: RepoNode[],
): Promise<ManifestMap> => {
  const manifests: ManifestMap = new Map();
  const batchSize = 10;

  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const varDefs = batch.map((_, idx) => `$name_${idx}: String!`).join(", ");
    const aliases = batch
      .map((_, idx) => {
        const alias = `repo_${idx}`;
        const fileQueries = MANIFEST_FILES.map((file) => {
          const fieldName = file.replace(/[-.]/g, "_");
          return `${fieldName}: object(expression: "HEAD:${file}") { ... on Blob { text } }`;
        }).join("\n            ");
        return `${alias}: repository(owner: $owner, name: $name_${idx}) {
            ${fileQueries}
          }`;
      })
      .join("\n      ");

    const variables: Record<string, string> = { owner: username };
    batch.forEach((repo, idx) => {
      variables[`name_${idx}`] = repo.name;
    });

    try {
      const data: Record<
        string,
        Record<string, { text?: string } | null>
      > = await graphql(
        `query($owner: String!, ${varDefs}) { ${aliases} }`,
        variables,
      );
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
  graphql: GraphQL,
  username: string,
): Promise<ContributionData> => {
  try {
    const now = new Date();
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);

    const data = await graphql(
      `query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            totalRepositoriesWithContributedCommits
            commitContributionsByRepository(maxRepositories: 100) {
              repository { name nameWithOwner }
              contributions { totalCount }
            }
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  color
                }
              }
            }
          }
          repositoriesContributedTo(first: 50, includeUserRepositories: false, contributionTypes: [COMMIT, PULL_REQUEST]) {
            totalCount
            nodes { nameWithOwner url stargazerCount description primaryLanguage { name } }
          }
        }
      }`,
      { username, from: from.toISOString(), to: now.toISOString() },
    );

    const user = (data as Record<string, Record<string, unknown>>).user;
    const collection = user.contributionsCollection as Record<string, unknown>;
    return {
      contributions: {
        totalCommitContributions: collection.totalCommitContributions,
        totalPullRequestContributions: collection.totalPullRequestContributions,
        totalPullRequestReviewContributions:
          collection.totalPullRequestReviewContributions,
        totalRepositoriesWithContributedCommits:
          collection.totalRepositoriesWithContributedCommits,
      },
      externalRepos: user.repositoriesContributedTo,
      contributionCalendar: collection.contributionCalendar,
      commitContributionsByRepository:
        collection.commitContributionsByRepository,
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
  graphql: GraphQL,
  username: string,
  repos: RepoNode[],
): Promise<ReadmeMap> => {
  const readmeMap: ReadmeMap = new Map();
  const batchSize = 10;

  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const varDefs = batch.map((_, idx) => `$name_${idx}: String!`).join(", ");
    const aliases = batch
      .map((_, idx) => {
        const alias = `repo_${idx}`;
        return `${alias}: repository(owner: $owner, name: $name_${idx}) {
            readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
          }`;
      })
      .join("\n      ");

    const variables: Record<string, string> = { owner: username };
    batch.forEach((repo, idx) => {
      variables[`name_${idx}`] = repo.name;
    });

    try {
      const data: Record<string, { readme?: { text?: string } } | null> =
        await graphql(
          `query($owner: String!, ${varDefs}) { ${aliases} }`,
          variables,
        );
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

export const fetchUserProfile = async (
  graphql: GraphQL,
  username: string,
): Promise<UserProfile> => {
  try {
    const data = await graphql(
      `query($username: String!) {
      user(login: $username) {
        name
        bio
        company
        location
        websiteUrl
        twitterUsername
        socialAccounts(first: 10) { nodes { provider url } }
      }
    }`,
      { username },
    );

    const user = (data as Record<string, Record<string, unknown>>).user;
    return {
      name: (user.name as string) || null,
      bio: (user.bio as string) || null,
      company: (user.company as string) || null,
      location: (user.location as string) || null,
      websiteUrl: (user.websiteUrl as string) || null,
      twitterUsername: (user.twitterUsername as string) || null,
      socialAccounts:
        (user.socialAccounts as { nodes: { provider: string; url: string }[] })
          ?.nodes || [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`User profile fetch failed (non-fatal): ${msg}`);
    return {
      name: null,
      bio: null,
      company: null,
      location: null,
      websiteUrl: null,
      twitterUsername: null,
      socialAccounts: [],
    };
  }
};

export interface PreambleContext {
  username: string;
  profile: UserProfile;
  userConfig: UserConfig;
  languages: { name: string; percent: string }[];
  spotlightProjects: ProjectItem[];
  complexProjects: ProjectItem[];
}

export const fetchAIPreamble = async (
  token: string,
  context: PreambleContext,
  valves: PromptValves,
): Promise<string | undefined> => {
  try {
    const { profile, userConfig, languages, spotlightProjects, complexProjects } =
      context;

    const langLines = languages
      .map((l) => `- ${l.name}: ${l.percent}%`)
      .join("\n");

    const formatProject = (p: ProjectItem): string => {
      const langs = p.languages?.length ? ` [${p.languages.join(", ")}]` : "";
      const size = p.codeSize ? ` ~${Math.round(p.codeSize / 1024)}MB` : "";
      const desc = p.summary || p.description;
      return `- ${p.name} (${p.stars} stars${size})${langs}: ${desc}`;
    };

    const spotlightLines = spotlightProjects.map(formatProject).join("\n");
    const complexProjectLines = complexProjects.map(formatProject).join("\n");

    const profileLines = [
      profile.name ? `Name: ${profile.name}` : null,
      profile.bio ? `Bio: ${profile.bio}` : null,
      profile.company ? `Company: ${profile.company}` : null,
      profile.location ? `Location: ${profile.location}` : null,
      userConfig.title ? `Current title: ${userConfig.title}` : null,
      userConfig.desired_title
        ? `Desired title: ${userConfig.desired_title}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = interpolate(valves.user, {
      profile: profileLines,
      languages: langLines,
      complexProjects: complexProjectLines || "None",
      activeProjects: spotlightLines || "None",
    });

    const res = await fetchWithRetry(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: valves.model,
          messages: [
            { role: "system", content: valves.system },
            { role: "user", content: prompt },
          ],
          temperature: valves.temperature,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "preamble",
              strict: true,
              schema: {
                type: "object",
                properties: { preamble: { type: "string" } },
                required: ["preamble"],
                additionalProperties: false,
              },
            },
          },
        }),
      },
      "Preamble",
    );

    if (!res?.ok) {
      if (res)
        console.warn(`GitHub Models API error (preamble): ${res.status}`);
      return undefined;
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as { preamble?: string };
    const raw = parsed.preamble || undefined;
    if (!raw) return undefined;

    const cleaned = raw
      // Strip conversational preface (safety net)
      .replace(
        /^(?:certainly|sure|of course|here(?:'s| is| are)|absolutely|great)[\s\S]*?(?::\s*\n|\.\s*\n)/i,
        "",
      )
      // Strip wrapping code fences
      .replace(/^```(?:markdown|md)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    // Reject degenerate output (conversational filler with no real content)
    const minLength = 20;
    if (cleaned.length < minLength) {
      console.warn(
        `AI preamble too short after cleaning (${cleaned.length} chars), discarding`,
      );
      return undefined;
    }

    return cleaned;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`AI preamble generation failed (non-fatal): ${msg}`);
    return undefined;
  }
};

export const fetchProjectClassifications = async (
  token: string,
  repos: RepoClassificationInput[],
  valves: PromptValves,
): Promise<RepoClassificationOutput[]> => {
  try {
    const repoData = JSON.stringify(repos, null, 2);

    const prompt = interpolate(valves.user, { repoData });

    const res = await fetchWithRetry(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: valves.model,
          messages: [
            { role: "system", content: valves.system },
            { role: "user", content: prompt },
          ],
          temperature: valves.temperature,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "project_classifications",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  classifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        status: {
                          type: "string",
                          enum: ["active", "maintained", "inactive"],
                        },
                        summary: { type: "string" },
                        category: {
                          type: "string",
                          enum: [
                            "Developer Tools",
                            "SDKs",
                            "Applications",
                            "Research & Experiments",
                          ],
                        },
                        spotlight_rank: {
                          type: ["integer", "null"],
                        },
                      },
                      required: [
                        "name",
                        "status",
                        "summary",
                        "category",
                        "spotlight_rank",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["classifications"],
                additionalProperties: false,
              },
            },
          },
        }),
      },
      "Classifications",
    );

    if (!res?.ok) {
      if (res)
        console.warn(
          `GitHub Models API error (classifications): ${res.status}`,
        );
      return [];
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as {
      classifications?: RepoClassificationOutput[];
    };
    return (parsed.classifications || [])
      .filter(
        (c) =>
          c.name &&
          (c.status === "active" ||
            c.status === "maintained" ||
            c.status === "inactive"),
      )
      .map((c) => ({ ...c, summary: c.summary || "" }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Project classification failed (non-fatal): ${msg}`);
    return [];
  }
};
