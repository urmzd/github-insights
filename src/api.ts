import * as github from "@actions/github";
import type {
  ContributionData,
  ManifestMap,
  ProjectItem,
  ReadmeMap,
  RepoClassificationInput,
  RepoClassificationOutput,
  RepoNode,
  TechHighlight,
  UserConfig,
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

  return data.user.repositories.nodes.filter((r) => !r.isArchived && !r.isFork);
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
  techHighlights: TechHighlight[];
  activeProjects: ProjectItem[];
  complexProjects: ProjectItem[];
}

export const fetchAIPreamble = async (
  token: string,
  context: PreambleContext,
): Promise<string | undefined> => {
  try {
    const {
      profile,
      userConfig,
      languages,
      techHighlights,
      activeProjects,
      complexProjects,
    } = context;

    const langLines = languages
      .map((l) => `- ${l.name}: ${l.percent}%`)
      .join("\n");
    const techLines = techHighlights
      .map((h) => `- ${h.category}: ${h.items.join(", ")} (score: ${h.score})`)
      .join("\n");

    const formatProject = (p: ProjectItem): string => {
      const langs = p.languages?.length ? ` [${p.languages.join(", ")}]` : "";
      const size = p.codeSize ? ` ~${Math.round(p.codeSize / 1024)}MB` : "";
      return `- ${p.name} (${p.stars} stars${size})${langs}: ${p.description}`;
    };

    const activeProjectLines = activeProjects.map(formatProject).join("\n");
    const complexProjectLines = complexProjects.map(formatProject).join("\n");

    const profileLines = [
      profile.name ? `Name: ${profile.name}` : null,
      profile.bio ? `Bio: ${profile.bio}` : null,
      profile.company ? `Company: ${profile.company}` : null,
      profile.location ? `Location: ${profile.location}` : null,
      userConfig.title ? `Title: ${userConfig.title}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `You are generating a very short tagline for a developer's GitHub profile README.

Profile:
${profileLines}

Languages (by code volume):
${langLines}

Expertise areas:
${techLines}

Most technically complex projects (by language diversity, codebase size, and depth):
${complexProjectLines || "None"}

Active projects (recently committed to):
${activeProjectLines || "None"}

Generate 1-2 sentences that:
- Write in first person (use I/my). Describe what you work on
- Lead with the most technically impressive or complex work — projects with multiple languages, large codebases, or deep domain expertise
- Reference their top 2-3 languages or technologies naturally
- Keep tone professional but friendly
- Do NOT include social links, badges, or contact info
- Do NOT include a heading — the README already has one
- Do NOT wrap your response in code fences or backtick blocks — output raw markdown only
- Do NOT include any conversational preface (e.g., "Certainly!", "Here's...", "Sure!") — start directly with the tagline`;

    const res = await fetchWithRetry(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content:
                "You are a markdown content generator. Output ONLY the requested markdown content. " +
                "Never include conversational text, confirmations, or commentary like " +
                '"Certainly", "Here\'s", "Sure", "Of course", etc. ' +
                "Start directly with the substantive content.",
            },
            { role: "user", content: prompt },
          ],
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

    const res = await fetchWithRetry(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
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
      "Expertise",
    );

    if (!res?.ok) {
      if (res) console.warn(`GitHub Models API error: ${res.status}`);
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

export const fetchProjectClassifications = async (
  token: string,
  repos: RepoClassificationInput[],
): Promise<RepoClassificationOutput[]> => {
  try {
    const repoData = JSON.stringify(repos, null, 2);

    const prompt = `You are classifying GitHub repositories by their maintenance status, purpose category, and generating a brief summary for each.

For each repository, determine its status, category, and write a 1-2 sentence summary:

Status (project lifecycle — pick exactly one):
- "active": The project is young and under active development. It was created or significantly reworked recently, AND has frequent, sustained commits indicating ongoing feature work or rapid iteration. A mature project with a recent burst of commits is NOT active — it's maintained.
- "maintained": The project is established and functional. It may receive occasional updates — bug fixes, dependency bumps, documentation, or even periodic feature additions — but the core is stable. Most working projects fall here. An old project with recent commits is maintained, not active.
- "inactive": The project has no meaningful recent activity. It may be a completed experiment, archived, or abandoned.

Category (project purpose — pick exactly one):
- "Developer Tools": CLIs, build tools, code generators, automation utilities, GitHub Actions
- "SDKs": Libraries and SDKs meant to be imported by other projects
- "Applications": End-user applications, desktop apps, web apps, APIs
- "Research & Experiments": Academic projects, ML experiments, algorithm research, educational repos, game clones

Repository data:
${repoData}

Classification guidelines:
- commitsLastYear is the number of commits in the past 12 months
- pushedAt is the last push date (any git push, not just commits)
- The key distinction between active and maintained is project MATURITY, not just commit recency
- A project created in the last ~6 months with sustained commits → active
- A project older than ~1 year with any level of recent commits → maintained (unless it was clearly rearchitected/rewritten recently)
- commitsLastYear alone does NOT determine active vs maintained — a 3-year-old project with 50 commits/year is maintained, not active
- A repo with 0 commits but a very recent pushedAt might still be maintained (rebases, CI fixes)
- Profile READMEs (e.g. repos named after the username) should be "maintained" (they get auto-generated updates but aren't actively developed)
- SDKs and tools that are stable and working are "maintained" even with frequent commits — unless they're brand new
- For category, judge by what the repo IS, not by its activity level. A game clone is "Research & Experiments" even if actively developed. A CLI tool is "Developer Tools" even if inactive.

Summary guidelines:
- Write 1-2 factual sentences describing what the project IS and what technologies it uses
- Do NOT mention commit counts, activity status, maintenance status, or how recently it was updated — that information is already conveyed by the section heading
- Do NOT hallucinate features or details not present in the input data
- Base the summary only on: name, description, languages, stars, and disk usage`;

    const res = await fetchWithRetry(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
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
                      },
                      required: ["name", "status", "summary", "category"],
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
