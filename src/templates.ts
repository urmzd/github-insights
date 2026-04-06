import type {
  ProjectItem,
  ShowcaseSection,
  TemplateContext,
  TemplateFunction,
  TemplateName,
  UserProfile,
} from "./types.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function attribution(): string {
  const now = new Date().toISOString().split("T")[0];
  return `<!-- section: footer -->\n<sub>Last generated on ${now} using [@urmzd/github-insights](https://github.com/urmzd/github-insights)</sub>`;
}

function frontmatter(ctx: TemplateContext): string {
  const langs = ctx.languages.slice(0, 10).map((l) => l.name);
  const lines = [
    "<!-- ai-metadata",
    `type: github-profile`,
    `name: ${ctx.name}`,
    `username: ${ctx.username}`,
    ...(ctx.title ? [`title: ${ctx.title}`] : []),
    `languages: [${langs.join(", ")}]`,
    `profile: https://github.com/${ctx.username}`,
    "-->",
  ];
  return lines.join("\n");
}

const ALT_TEXT_MAP: Record<string, string> = {
  "GitHub Metrics":
    "Combined visualization of language velocity, contribution rhythm, project constellation, and open source impact for {name}",
  "Language Velocity":
    "Streamgraph of {name}'s programming language usage over the past year",
  "Contribution Rhythm":
    "Radar chart of {name}'s contribution patterns by day of week",
  "Project Constellation":
    "Map of {name}'s projects positioned by language ecosystem and complexity",
  "Impact Trail":
    "Bar chart of {name}'s open source contributions by repository star count",
};

export function descriptiveAlt(label: string, name: string): string {
  const template = ALT_TEXT_MAP[label];
  if (template) return template.replace(/\{name\}/g, name);
  return label;
}

export function extractFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Escape special characters for shields.io badge labels (`-` → `--`, `_` → `__`). */
export function shieldsBadgeLabel(text: string): string {
  return text.replace(/-/g, "--").replace(/_/g, "__");
}

export function buildSocialBadges(profile: UserProfile): string {
  const badges: string[] = [];

  if (profile.websiteUrl) {
    let label: string;
    try {
      label = new URL(profile.websiteUrl).hostname;
    } catch {
      label = "Website";
    }
    badges.push(
      `[![${label}](https://img.shields.io/badge/${shieldsBadgeLabel(label)}-4285F4?style=flat&logo=google-chrome&logoColor=white)](${profile.websiteUrl})`,
    );
  }
  if (profile.twitterUsername) {
    const label = `@${profile.twitterUsername}`;
    badges.push(
      `[![${label}](https://img.shields.io/badge/${shieldsBadgeLabel(label)}-000000?style=flat&logo=x&logoColor=white)](https://x.com/${profile.twitterUsername})`,
    );
  }
  for (const account of profile.socialAccounts) {
    const provider = account.provider.toLowerCase();
    if (provider === "linkedin") {
      const match = account.url.match(/\/in\/([^/?#]+)/);
      const label = match?.[1] || "LinkedIn";
      badges.push(
        `[![${label}](https://img.shields.io/badge/${shieldsBadgeLabel(label)}-0A66C2?style=flat&logo=linkedin&logoColor=white)](${account.url})`,
      );
    } else if (provider === "mastodon") {
      const match = account.url.match(/\/@([^/?#]+)/);
      const label = match ? `@${match[1]}` : "Mastodon";
      badges.push(
        `[![${label}](https://img.shields.io/badge/${shieldsBadgeLabel(label)}-6364FF?style=flat&logo=mastodon&logoColor=white)](${account.url})`,
      );
    } else if (provider === "youtube") {
      const match = account.url.match(/\/(?:@|c(?:hannel)?\/|user\/)([^/?#]+)/);
      const label = match?.[1] || "YouTube";
      badges.push(
        `[![${label}](https://img.shields.io/badge/${shieldsBadgeLabel(label)}-FF0000?style=flat&logo=youtube&logoColor=white)](${account.url})`,
      );
    }
  }

  return badges.join(" ");
}

// ── Project table helper ──────────────────────────────────────────────────

function renderProjectTable(title: string, projects: ProjectItem[]): string {
  if (projects.length === 0) return "";

  const header = `| Project | Description | Stars | Languages |\n|---------|-------------|-------|-----------|`;
  const rows = projects
    .map((p) => {
      const desc = p.summary || p.description || "No description";
      const safeDesc = desc.replace(/\|/g, "\\|").replace(/\n/g, " ");
      const stars = p.stars > 0 ? String(p.stars) : "-";
      const langs = p.languages?.length
        ? p.languages.slice(0, 3).join(", ")
        : "-";
      return `| [${p.name}](${p.url}) | ${safeDesc} | ${stars} | ${langs} |`;
    })
    .join("\n");

  return `### ${title}\n\n${header}\n${rows}`;
}

// ── Section renderers ─────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  "Developer Tools",
  "SDKs",
  "Applications",
  "Research & Experiments",
];

function renderSpotlight(ctx: TemplateContext): string {
  if (ctx.spotlightProjects.length === 0) return "";

  const items = ctx.spotlightProjects
    .map((p) => {
      const desc = p.summary || p.description || "No description";
      const meta: string[] = [];
      if (p.stars > 0) meta.push(`Stars: ${p.stars}`);
      if (p.languages?.length)
        meta.push(`Languages: ${p.languages.slice(0, 3).join(", ")}`);
      if (p.activityLabel) meta.push(`**${p.activityLabel}**`);
      const metaLine = meta.length > 0 ? `${meta.join(" \u00b7 ")}` : "";
      return `### [${p.name}](${p.url})\n${desc}${metaLine ? `\n${metaLine}` : ""}`;
    })
    .join("\n\n");

  return `## Spotlight\n\n${items}`;
}

function renderVelocity(ctx: TemplateContext): string {
  if (!ctx.sectionSvgs.velocity) return "";
  return `## Language Velocity\n\n![${descriptiveAlt("Language Velocity", ctx.name)}](${ctx.sectionSvgs.velocity})`;
}

function renderRhythm(ctx: TemplateContext): string {
  if (!ctx.sectionSvgs.rhythm) return "";
  return `## Contribution Rhythm\n\n![${descriptiveAlt("Contribution Rhythm", ctx.name)}](${ctx.sectionSvgs.rhythm})`;
}

function renderConstellation(ctx: TemplateContext): string {
  if (!ctx.sectionSvgs.constellation) return "";
  return `## Project Map\n\n![${descriptiveAlt("Project Constellation", ctx.name)}](${ctx.sectionSvgs.constellation})`;
}

function renderImpact(ctx: TemplateContext): string {
  if (!ctx.sectionSvgs.impact) return "";
  return `## Open Source Impact\n\n![${descriptiveAlt("Impact Trail", ctx.name)}](${ctx.sectionSvgs.impact})`;
}

function renderStack(ctx: TemplateContext): string {
  if (!ctx.sectionSvgs.stack) return "";
  return `## Tech Stack\n\n![Tech Stack](${ctx.sectionSvgs.stack})`;
}

function renderPortfolio(ctx: TemplateContext): string {
  const tableParts: string[] = [];

  for (const category of CATEGORY_ORDER) {
    const projects = ctx.categorizedProjects[category];
    if (projects && projects.length > 0) {
      tableParts.push(renderProjectTable(category, projects));
    }
  }

  for (const [category, projects] of Object.entries(ctx.categorizedProjects)) {
    if (!CATEGORY_ORDER.includes(category)) {
      if (projects.length > 0) {
        tableParts.push(renderProjectTable(category, projects));
      }
    }
  }

  if (tableParts.length === 0) return "";

  return `## Portfolio\n\n<details>\n<summary>All Projects</summary>\n\n${tableParts.join("\n\n")}\n\n</details>`;
}

// ── Section dispatcher ────────────────────────────────────────────────────

const SECTION_RENDERERS: Record<
  ShowcaseSection,
  (ctx: TemplateContext) => string
> = {
  spotlight: renderSpotlight,
  velocity: renderVelocity,
  rhythm: renderRhythm,
  constellation: renderConstellation,
  impact: renderImpact,
  portfolio: renderPortfolio,
  stack: renderStack,
};

// ── Showcase template ─────────────────────────────────────────────────────

function showcaseTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(frontmatter(ctx));

  if (ctx.pronunciation) {
    parts.push(`# ${ctx.name} <sub><i>(${ctx.pronunciation})</i></sub>`);
  } else {
    parts.push(`# ${ctx.name}`);
  }

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  if (ctx.socialBadges) {
    parts.push(`<!-- section: social -->\n${ctx.socialBadges}`);
  }

  for (const sectionKey of ctx.resolvedSections) {
    const renderer = SECTION_RENDERERS[sectionKey];
    if (renderer) {
      const block = renderer(ctx);
      if (block) {
        parts.push(`<!-- section: ${sectionKey} -->\n${block}`);
      }
    }
  }

  parts.push(attribution());

  return `${parts.join("\n\n")}\n`;
}

// ── Public API ────────────────────────────────────────────────────────────

export function getTemplate(_name?: TemplateName): TemplateFunction {
  return showcaseTemplate;
}
