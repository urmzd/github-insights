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
  return `<sub>Last generated on ${now} using [@urmzd/github-insights](https://github.com/urmzd/github-insights) · Template: \`${templateName}\`</sub>`;
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
      if (p.stars > 0) meta.push(`\u2605 ${p.stars}`);
      if (p.languages?.length) meta.push(p.languages.slice(0, 3).join(", "));
      const metaLine = meta.length > 0 ? `${meta.join(" \u00b7 ")}` : "";
      return `### [${p.name}](${p.url})\n${desc}${metaLine ? `\n${metaLine}` : ""}`;
    })
    .join("\n\n");

  return `## ${title}\n\n${items}`;
}

// ── Project table helper (ecosystem template) ────────────────────────────

function renderProjectTable(title: string, projects: ProjectItem[]): string {
  if (projects.length === 0) return "";

  const header = `| Project | Description |\n|---------|-------------|`;
  const rows = projects
    .map((p) => {
      const desc = p.summary || p.description || "No description";
      const safeDesc = desc.replace(/\|/g, "\\|").replace(/\n/g, " ");
      return `| [${p.name}](${p.url}) | ${safeDesc} |`;
    })
    .join("\n");

  return `### ${title}\n\n${header}\n${rows}`;
}

// ── Classic template ───────────────────────────────────────────────────────

function classicTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

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

  if (ctx.socialBadges) {
    parts.push(ctx.socialBadges);
  }

  for (const svg of ctx.svgs) {
    parts.push(`![${svg.label}](${svg.path})`);
  }

  if (ctx.archivedProjects.length > 0) {
    parts.push(renderProjectSection("Archived", ctx.archivedProjects));
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

  parts.push(`# Hi, I'm ${ctx.firstName} 👋`);

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  if (ctx.socialBadges) {
    parts.push(ctx.socialBadges);
  }

  const activeSection = renderProjectSection(
    "Active Projects",
    ctx.activeProjects,
  );
  if (activeSection) parts.push(activeSection);

  const maintainedSection = renderProjectSection(
    "Maintained Projects",
    ctx.maintainedProjects,
  );
  if (maintainedSection) parts.push(maintainedSection);

  const inactiveSection = renderProjectSection(
    "Inactive Projects",
    ctx.inactiveProjects,
  );
  if (inactiveSection) parts.push(inactiveSection);

  const archivedSection = renderProjectSection(
    "Archived",
    ctx.archivedProjects,
  );
  if (archivedSection) parts.push(archivedSection);

  // GitHub Stats section: pulse + calendar
  const statsImages: string[] = [];
  if (ctx.sectionSvgs.pulse) {
    statsImages.push(`![At a Glance](${ctx.sectionSvgs.pulse})`);
  }
  if (ctx.sectionSvgs.calendar) {
    statsImages.push(`![Contributions](${ctx.sectionSvgs.calendar})`);
  }
  if (statsImages.length > 0) {
    parts.push(`## GitHub Stats\n\n${statsImages.join("\n")}`);
  }

  // Other areas of interest: expertise
  if (ctx.sectionSvgs.expertise) {
    parts.push(
      `## Other Areas of Interest\n\n![Expertise](${ctx.sectionSvgs.expertise})`,
    );
  }

  parts.push(attribution(ctx.templateName));

  return `${parts.join("\n\n")}\n`;
}

// ── Minimal template ───────────────────────────────────────────────────────

function minimalTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(`# ${ctx.firstName}`);

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  if (ctx.socialBadges) {
    parts.push(ctx.socialBadges);
  }

  for (const svg of ctx.svgs) {
    parts.push(`![${svg.label}](${svg.path})`);
  }

  if (ctx.archivedProjects.length > 0) {
    parts.push(renderProjectSection("Archived", ctx.archivedProjects));
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

  parts.push(`# Hi, I'm ${ctx.firstName} 👋`);

  if (ctx.preamble) {
    parts.push(ctx.preamble);
  }

  if (ctx.socialBadges) {
    parts.push(ctx.socialBadges);
  }

  // Build a set of archived project names to filter them out of category tables
  const archivedNames = new Set(ctx.archivedProjects.map((p) => p.name));

  // Render project tables grouped by category (excluding archived)
  for (const category of CATEGORY_ORDER) {
    const projects = ctx.categorizedProjects[category]?.filter(
      (p) => !archivedNames.has(p.name),
    );
    if (projects && projects.length > 0) {
      parts.push(renderProjectTable(category, projects));
    }
  }

  // Render any uncategorized projects that don't match known categories (excluding archived)
  for (const [category, projects] of Object.entries(ctx.categorizedProjects)) {
    if (!CATEGORY_ORDER.includes(category)) {
      const nonArchived = projects.filter((p) => !archivedNames.has(p.name));
      if (nonArchived.length > 0) {
        parts.push(renderProjectTable(category, nonArchived));
      }
    }
  }

  // Render all archived projects in one consolidated section
  if (ctx.archivedProjects.length > 0) {
    parts.push(renderProjectTable("Archived", ctx.archivedProjects));
  }

  // GitHub Stats section: pulse + calendar
  const statsImages: string[] = [];
  if (ctx.sectionSvgs.pulse) {
    statsImages.push(`![At a Glance](${ctx.sectionSvgs.pulse})`);
  }
  if (ctx.sectionSvgs.calendar) {
    statsImages.push(`![Contributions](${ctx.sectionSvgs.calendar})`);
  }
  if (statsImages.length > 0) {
    parts.push(`## GitHub Stats\n\n${statsImages.join("\n")}`);
  }

  // Other areas of interest: expertise
  if (ctx.sectionSvgs.expertise) {
    parts.push(
      `## Other Areas of Interest\n\n![Expertise](${ctx.sectionSvgs.expertise})`,
    );
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
