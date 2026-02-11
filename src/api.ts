import * as github from "@actions/github";
import type {
  ContributionData,
  ManifestMap,
  ProjectItem,
  ReadmeMap,
  RepoNode,
  TechHighlight,
  UserConfig,
  UserProfile,
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

export const fetchUserProfile = async (
  token: string,
  username: string,
): Promise<UserProfile> => {
  const graphql = makeGraphql(token);
  try {
    const data = await graphql(`{
      user(login: "${username}") {
        name
        bio
        company
        location
        websiteUrl
        twitterUsername
        socialAccounts(first: 10) { nodes { provider url } }
      }
    }`);

    const user = (data as Record<string, Record<string, unknown>>).user;
    return {
      name: (user.name as string) || null,
      bio: (user.bio as string) || null,
      company: (user.company as string) || null,
      location: (user.location as string) || null,
      websiteUrl: (user.websiteUrl as string) || null,
      twitterUsername: (user.twitterUsername as string) || null,
      socialAccounts: (
        (user.socialAccounts as { nodes: { provider: string; url: string }[] })
          ?.nodes || []
      ),
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
  techHighlights: TechHighlight[];
  contributionData: ContributionData;
  projects: ProjectItem[];
}

export const fetchAIPreamble = async (
  token: string,
  context: PreambleContext,
): Promise<string | undefined> => {
  try {
    const { username, profile, userConfig, languages, techHighlights, contributionData, projects } = context;

    const langLines = languages.map((l) => `- ${l.name}: ${l.percent}%`).join("\n");
    const techLines = techHighlights
      .map((h) => `- ${h.category}: ${h.items.join(", ")} (score: ${h.score})`)
      .join("\n");
    const projectLines = projects
      .slice(0, 10)
      .map((p) => `- ${p.name} (${p.stars} stars): ${p.description}`)
      .join("\n");

    const profileLines = [
      profile.name ? `Name: ${profile.name}` : null,
      profile.bio ? `Bio: ${profile.bio}` : null,
      profile.company ? `Company: ${profile.company}` : null,
      profile.location ? `Location: ${profile.location}` : null,
      userConfig.title ? `Title: ${userConfig.title}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const socialLines = [
      `GitHub: https://github.com/${username}`,
      profile.websiteUrl ? `Website: ${profile.websiteUrl}` : null,
      profile.twitterUsername ? `Twitter/X: https://x.com/${profile.twitterUsername}` : null,
      ...profile.socialAccounts.map((s) => `${s.provider}: ${s.url}`),
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `You are generating a concise markdown preamble for a developer's GitHub profile README.

Profile:
${profileLines}

Languages (by code volume):
${langLines}

Expertise areas:
${techLines}

Notable projects:
${projectLines}

Contribution stats (last year):
- Commits: ${contributionData.contributions.totalCommitContributions}
- Pull requests: ${contributionData.contributions.totalPullRequestContributions}
- Code reviews: ${contributionData.contributions.totalPullRequestReviewContributions}
- Contributed to ${contributionData.externalRepos.totalCount} external repos

Social/contact links available:
${socialLines}

Generate a markdown preamble (2-4 short paragraphs max) that:
- Opens with a brief personal intro drawn from the profile bio/title
- Highlights the developer's primary domains and strengths (from expertise areas + languages)
- Mentions notable projects if applicable
- Ends with a social/contact links section using shields.io badge-style markdown images. Use this format for each badge:
  [![Badge](https://img.shields.io/badge/LABEL-COLOR?style=flat&logo=LOGO&logoColor=white)](URL)
  Only include badges for links that actually exist. Use appropriate colors and logos for each platform (e.g., logo=github for GitHub, logo=x for Twitter/X, logo=linkedin for LinkedIn, etc.).
- Keep tone professional but friendly, no self-aggrandizing
- Do NOT include a heading — the README already has one`;

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
          temperature: 0.3,
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
    );

    if (!res.ok) {
      console.warn(`GitHub Models API error (preamble): ${res.status}`);
      return undefined;
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as { preamble?: string };
    return parsed.preamble || undefined;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`AI preamble generation failed (non-fatal): ${msg}`);
    return undefined;
  }
};

export const fetchExpertiseAnalysis = async (
  token: string,
  languages: { name: string; percent: string }[],
  allDeps: string[],
  allTopics: string[],
  repos: RepoNode[],
  readmeMap: ReadmeMap,
  userConfig: UserConfig = {},
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

    const desiredTitle = userConfig.desired_title || userConfig.title;
    let titleContext = "";
    if (userConfig.title) {
      titleContext = `\nDeveloper context:\n- Current title: ${userConfig.title}`;
      if (desiredTitle && desiredTitle !== userConfig.title) {
        titleContext += `\n- Desired title: ${desiredTitle}`;
      }
      titleContext += `\n- Tailor the expertise categories to highlight skills most relevant to ${desiredTitle}. Prioritize domains and technologies that align with this role.\n`;
    }

    const prompt = `You are analyzing a developer's GitHub profile to create a curated expertise showcase.
${titleContext}
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
- Only include categories where there's meaningful evidence of usage
- Assign each category a proficiency score from 0 to 100 based on evidence strength:
  language code volume, dependency count, topic mentions, and README depth.
  Use the full range (e.g. 80-95 for primary stack, 50-70 for secondary, 30-50 for minor).`;

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
                        score: { type: "number" },
                      },
                      required: ["category", "items", "score"],
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
    return (parsed.highlights || [])
      .filter((h) => h.category && Array.isArray(h.items) && h.items.length > 0)
      .map((h) => ({ ...h, score: Math.max(0, Math.min(100, h.score || 0)) }))
      .sort((a, b) => b.score - a.score);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Expertise analysis failed (non-fatal): ${msg}`);
    return [];
  }
};
