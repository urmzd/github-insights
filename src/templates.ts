import type {
  ProjectItem,
  TemplateContext,
  TemplateFunction,
  TemplateName,
  UserProfile,
} from "./types.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function attribution(templateName: string): string {
  const now = new Date().toISOString().split("T")[0];
  return `<!-- section: footer -->\n<sub>Last generated on ${now} using [@urmzd/github-insights](https://github.com/urmzd/github-insights) · Template: \`${templateName}\`</sub>`;
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

function inlineMetadata(ctx: TemplateContext): string {
  const parts: string[] = [];
  if (ctx.title) parts.push(`**Role:** ${ctx.title}`);
  const topLangs = ctx.languages.slice(0, 5).map((l) => l.name);
  if (topLangs.length > 0)
    parts.push(`**Top Languages:** ${topLangs.join(", ")}`);
  if (parts.length === 0) return "";
  return parts.join(" | ");
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

// ── Project section helper (modern template) ─────────────────────────────

function renderProjectSection(title: string, projects: ProjectItem[]): string {
  if (projects.length === 0) return "";

  const items = projects
    .map((p) => {
      const desc = p.summary || p.description || "No description";
      const meta: string[] = [];
      if (p.stars > 0) meta.push(`Stars: ${p.stars}`);
      if (p.languages?.length)
        meta.push(`Languages: ${p.languages.slice(0, 3).join(", ")}`);
      const metaLine = meta.length > 0 ? `${meta.join(" \u00b7 ")}` : "";
      return `### [${p.name}](${p.url})\n${desc}${metaLine ? `\n${metaLine}` : ""}`;
    })
    .join("\n\n");

  return `## ${title}\n\n${items}`;
}

// ── Project table helper (ecosystem template) ────────────────────────────

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

// ── Classic template ───────────────────────────────────────────────────────

function classicTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(frontmatter(ctx));

  if (ctx.pronunciation) {
    parts.push(`# ${ctx.name} <sub><i>(${ctx.pronunciation})</i></sub>`);
  } else {
    parts.push(`# ${ctx.name}`);
  }

  if (ctx.title) {
    parts.push(`> ${ctx.title}`);
  }

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  const meta = inlineMetadata(ctx);
  if (meta) parts.push(meta);

  if (ctx.socialBadges) {
    parts.push(`<!-- section: social -->\n${ctx.socialBadges}`);
  }

  if (ctx.svgs.length > 0) {
    const svgLines = ctx.svgs
      .map((svg) => `![${descriptiveAlt(svg.label, ctx.name)}](${svg.path})`)
      .join("\n");
    parts.push(`<!-- section: visualizations -->\n${svgLines}`);
  }

  if (ctx.bio) {
    parts.push(`---\n\n<sub>${ctx.bio}</sub>`);
  }

  parts.push(attribution(ctx.templateName));

  return `${parts.join("\n\n")}\n`;
}

// ── Modern template ────────────────────────────────────────────────────────

function modernTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(frontmatter(ctx));

  parts.push(`# Hi, I'm ${ctx.firstName} 👋`);

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  const meta = inlineMetadata(ctx);
  if (meta) parts.push(meta);

  if (ctx.socialBadges) {
    parts.push(`<!-- section: social -->\n${ctx.socialBadges}`);
  }

  // Projects
  const projectSections: string[] = [];
  const activeSection = renderProjectSection(
    "Active Projects",
    ctx.activeProjects,
  );
  if (activeSection) projectSections.push(activeSection);

  const maintainedSection = renderProjectSection(
    "Maintained Projects",
    ctx.maintainedProjects,
  );
  if (maintainedSection) projectSections.push(maintainedSection);

  const inactiveSection = renderProjectSection(
    "Inactive Projects",
    ctx.inactiveProjects,
  );
  if (inactiveSection) projectSections.push(inactiveSection);

  if (projectSections.length > 0) {
    parts.push(`<!-- section: projects -->\n${projectSections.join("\n\n")}`);
  }

  // Visualizations
  const vizParts: string[] = [];

  // Constellation
  if (ctx.sectionSvgs.constellation) {
    vizParts.push(
      `## Project Map\n\n![${descriptiveAlt("Project Constellation", ctx.name)}](${ctx.sectionSvgs.constellation})`,
    );
  }

  // GitHub Stats section: rhythm + velocity
  const statsImages: string[] = [];
  if (ctx.sectionSvgs.velocity) {
    statsImages.push(
      `![${descriptiveAlt("Language Velocity", ctx.name)}](${ctx.sectionSvgs.velocity})`,
    );
  }
  if (ctx.sectionSvgs.rhythm) {
    statsImages.push(
      `![${descriptiveAlt("Contribution Rhythm", ctx.name)}](${ctx.sectionSvgs.rhythm})`,
    );
  }
  if (statsImages.length > 0) {
    vizParts.push(`## GitHub Stats\n\n${statsImages.join("\n")}`);
  }

  // Impact
  if (ctx.sectionSvgs.impact) {
    vizParts.push(
      `## Open Source Impact\n\n![${descriptiveAlt("Impact Trail", ctx.name)}](${ctx.sectionSvgs.impact})`,
    );
  }

  if (vizParts.length > 0) {
    parts.push(`<!-- section: visualizations -->\n${vizParts.join("\n\n")}`);
  }

  parts.push(attribution(ctx.templateName));

  return `${parts.join("\n\n")}\n`;
}

// ── Minimal template ───────────────────────────────────────────────────────

function minimalTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(frontmatter(ctx));

  parts.push(`# ${ctx.firstName}`);

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  const meta = inlineMetadata(ctx);
  if (meta) parts.push(meta);

  if (ctx.socialBadges) {
    parts.push(`<!-- section: social -->\n${ctx.socialBadges}`);
  }

  if (ctx.svgs.length > 0) {
    const svgLines = ctx.svgs
      .map((svg) => `![${descriptiveAlt(svg.label, ctx.name)}](${svg.path})`)
      .join("\n");
    parts.push(`<!-- section: visualizations -->\n${svgLines}`);
  }

  parts.push(attribution(ctx.templateName));

  return `${parts.join("\n\n")}\n`;
}

// ── Ecosystem template ────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  "Developer Tools",
  "SDKs",
  "Applications",
  "Research & Experiments",
];

function ecosystemTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(frontmatter(ctx));

  parts.push(`# Hi, I'm ${ctx.firstName} 👋`);

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  const meta = inlineMetadata(ctx);
  if (meta) parts.push(meta);

  if (ctx.socialBadges) {
    parts.push(`<!-- section: social -->\n${ctx.socialBadges}`);
  }

  // Projects
  const projectParts: string[] = [];

  // Render project tables grouped by category
  for (const category of CATEGORY_ORDER) {
    const projects = ctx.categorizedProjects[category];
    if (projects && projects.length > 0) {
      projectParts.push(renderProjectTable(category, projects));
    }
  }

  // Render any uncategorized projects that don't match known categories
  for (const [category, projects] of Object.entries(ctx.categorizedProjects)) {
    if (!CATEGORY_ORDER.includes(category)) {
      if (projects.length > 0) {
        projectParts.push(renderProjectTable(category, projects));
      }
    }
  }

  if (projectParts.length > 0) {
    parts.push(`<!-- section: projects -->\n${projectParts.join("\n\n")}`);
  }

  // Visualizations
  const vizParts: string[] = [];

  // Constellation
  if (ctx.sectionSvgs.constellation) {
    vizParts.push(
      `## Project Map\n\n![${descriptiveAlt("Project Constellation", ctx.name)}](${ctx.sectionSvgs.constellation})`,
    );
  }

  // GitHub Stats section: velocity + rhythm
  const statsImages: string[] = [];
  if (ctx.sectionSvgs.velocity) {
    statsImages.push(
      `![${descriptiveAlt("Language Velocity", ctx.name)}](${ctx.sectionSvgs.velocity})`,
    );
  }
  if (ctx.sectionSvgs.rhythm) {
    statsImages.push(
      `![${descriptiveAlt("Contribution Rhythm", ctx.name)}](${ctx.sectionSvgs.rhythm})`,
    );
  }
  if (statsImages.length > 0) {
    vizParts.push(`## GitHub Stats\n\n${statsImages.join("\n")}`);
  }

  // Impact
  if (ctx.sectionSvgs.impact) {
    vizParts.push(
      `## Open Source Impact\n\n![${descriptiveAlt("Impact Trail", ctx.name)}](${ctx.sectionSvgs.impact})`,
    );
  }

  if (vizParts.length > 0) {
    parts.push(`<!-- section: visualizations -->\n${vizParts.join("\n\n")}`);
  }

  parts.push(attribution(ctx.templateName));

  return `${parts.join("\n\n")}\n`;
}

// ── Registry ───────────────────────────────────────────────────────────────

const TEMPLATES: Record<TemplateName, TemplateFunction> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
  ecosystem: ecosystemTemplate,
};

export function getTemplate(name: TemplateName): TemplateFunction {
  return TEMPLATES[name] || TEMPLATES.classic;
}
