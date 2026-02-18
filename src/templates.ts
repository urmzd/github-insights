import type {
  TemplateContext,
  TemplateFunction,
  TemplateName,
  UserProfile,
} from "./types.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function attribution(): string {
  const now = new Date().toISOString().split("T")[0];
  return `<sub>Last generated on ${now} using [@urmzd/github-metrics](https://github.com/urmzd/github-metrics)</sub>`;
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

  if (ctx.preambleContent) {
    parts.push(ctx.preambleContent);
  }

  if (ctx.socialBadges) {
    parts.push(ctx.socialBadges);
  }

  for (const svg of ctx.svgs) {
    parts.push(`![${svg.label}](${svg.path})`);
  }

  if (ctx.bio) {
    parts.push(`---\n\n<sub>${ctx.bio}</sub>`);
  }

  parts.push(attribution());

  return `${parts.join("\n\n")}\n`;
}

// ── Modern template ────────────────────────────────────────────────────────

function modernTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(`# Hi, I'm ${ctx.firstName} 👋`);

  if (ctx.shortPreambleContent) {
    parts.push(ctx.shortPreambleContent);
  }

  if (ctx.socialBadges) {
    parts.push(ctx.socialBadges);
  }

  if (ctx.activeProjects.length > 0) {
    const items = ctx.activeProjects
      .map(
        (p) =>
          `- **${p.name}** - ${p.description || "No description"}${p.stars > 0 ? ` (${p.stars} ★)` : ""}`,
      )
      .join("\n");
    parts.push(`## Active Projects\n\n${items}`);
  }

  if (ctx.legacyProjects.length > 0) {
    const items = ctx.legacyProjects
      .map(
        (p) =>
          `- **${p.name}** - ${p.description || "No description"}${p.stars > 0 ? ` (${p.stars} ★)` : ""}`,
      )
      .join("\n");
    parts.push(`## Legacy Work\n\n${items}`);
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

  parts.push(attribution());

  return `${parts.join("\n\n")}\n`;
}

// ── Minimal template ───────────────────────────────────────────────────────

function minimalTemplate(ctx: TemplateContext): string {
  const parts: string[] = [];

  parts.push(`# ${ctx.firstName}`);

  if (ctx.shortPreambleContent) {
    parts.push(ctx.shortPreambleContent);
  }

  if (ctx.socialBadges) {
    parts.push(ctx.socialBadges);
  }

  for (const svg of ctx.svgs) {
    parts.push(`![${svg.label}](${svg.path})`);
  }

  parts.push(attribution());

  return `${parts.join("\n\n")}\n`;
}

// ── Registry ───────────────────────────────────────────────────────────────

const TEMPLATES: Record<TemplateName, TemplateFunction> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
};

export function getTemplate(name: TemplateName): TemplateFunction {
  return TEMPLATES[name] || TEMPLATES.classic;
}
