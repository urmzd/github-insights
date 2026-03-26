import { describe, expect, it } from "vitest";
import { makeContributionData, makeUserProfile } from "./__fixtures__/repos.js";
import {
  buildSocialBadges,
  descriptiveAlt,
  extractFirstName,
  getTemplate,
  shieldsBadgeLabel,
} from "./templates.js";
import type {
  ShowcaseSection,
  SpotlightProject,
  TemplateContext,
} from "./types.js";

const makeSpotlight = (
  overrides: Partial<SpotlightProject> = {},
): SpotlightProject => ({
  name: "hot-project",
  url: "https://github.com/urmzd/hot-project",
  description: "A trending project",
  stars: 15,
  heatScore: 80,
  activityLabel: "Active",
  languages: ["Rust", "TypeScript"],
  ...overrides,
});

const makeContext = (
  overrides: Partial<TemplateContext> = {},
): TemplateContext => ({
  username: "urmzd",
  name: "Urmzd Maharramoff",
  firstName: "Urmzd",
  pronunciation: undefined,
  title: "Software Engineer",
  bio: "Building tools",
  preamble: "A software developer in Austin, TX.",
  svgs: [{ label: "GitHub Metrics", path: "assets/insights/index.svg" }],
  sectionSvgs: {
    velocity: "assets/insights/metrics-velocity.svg",
    rhythm: "assets/insights/metrics-rhythm.svg",
    constellation: "assets/insights/metrics-constellation.svg",
    impact: "assets/insights/metrics-impact.svg",
  },
  profile: makeUserProfile(),
  activeProjects: [
    {
      name: "resume-generator",
      url: "https://github.com/urmzd/resume-generator",
      description: "CLI tool for professional resumes",
      stars: 42,
      category: "Applications",
    },
  ],
  maintainedProjects: [
    {
      name: "flappy-bird",
      url: "https://github.com/urmzd/flappy-bird",
      description: "JavaFX game with design patterns",
      stars: 8,
      category: "Research & Experiments",
    },
  ],
  inactiveProjects: [],
  archivedProjects: [],
  allProjects: [],
  templateName: "showcase",
  categorizedProjects: {
    Applications: [
      {
        name: "resume-generator",
        url: "https://github.com/urmzd/resume-generator",
        description: "CLI tool for professional resumes",
        stars: 42,
        category: "Applications",
      },
    ],
    "Research & Experiments": [
      {
        name: "flappy-bird",
        url: "https://github.com/urmzd/flappy-bird",
        description: "JavaFX game with design patterns",
        stars: 8,
        category: "Research & Experiments",
      },
    ],
  },
  languages: [
    { name: "TypeScript", value: 100, percent: "60.0", color: "#3178c6" },
    { name: "Rust", value: 50, percent: "30.0", color: "#dea584" },
  ],
  velocity: [],
  rhythm: { dayTotals: [0, 0, 0, 0, 0, 0, 0], longestStreak: 0, stats: [] },
  constellation: [],
  contributionData: makeContributionData(),
  socialBadges:
    "[![urmzd.dev](https://img.shields.io/badge/urmzd.dev-4285F4?style=flat&logo=google-chrome&logoColor=white)](https://urmzd.dev)",
  svgDir: "assets/insights",
  spotlightProjects: [makeSpotlight()],
  resolvedSections: [
    "spotlight",
    "velocity",
    "rhythm",
    "constellation",
    "portfolio",
    "impact",
  ],
  ...overrides,
});

// ── extractFirstName ───────────────────────────────────────────────────────

describe("extractFirstName", () => {
  it("returns first word of full name", () => {
    expect(extractFirstName("Urmzd Maharramoff")).toBe("Urmzd");
  });

  it("returns whole name if single word", () => {
    expect(extractFirstName("Urmzd")).toBe("Urmzd");
  });

  it("handles extra whitespace", () => {
    expect(extractFirstName("  Urmzd  Maharramoff  ")).toBe("Urmzd");
  });
});

// ── buildSocialBadges ──────────────────────────────────────────────────────

describe("buildSocialBadges", () => {
  it("builds website badge with hostname", () => {
    const profile = makeUserProfile({
      twitterUsername: null,
      socialAccounts: [],
    });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("urmzd.dev");
    expect(badges).toContain("https://urmzd.dev");
    expect(badges).not.toContain("Website");
  });

  it("builds twitter badge with @username", () => {
    const profile = makeUserProfile({ websiteUrl: null, socialAccounts: [] });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("@urmzd");
    expect(badges).toContain("https://x.com/urmzd");
  });

  it("builds LinkedIn badge with handle from URL", () => {
    const profile = makeUserProfile({
      websiteUrl: null,
      twitterUsername: null,
    });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("[![urmzd]");
    expect(badges).toContain("https://linkedin.com/in/urmzd");
  });

  it("builds Mastodon badge with @user from URL", () => {
    const profile = makeUserProfile({
      websiteUrl: null,
      twitterUsername: null,
      socialAccounts: [
        { provider: "MASTODON", url: "https://mastodon.social/@urmzd" },
      ],
    });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("@urmzd");
    expect(badges).toContain("mastodon.social/@urmzd");
  });

  it("builds YouTube badge with channel name from URL", () => {
    const profile = makeUserProfile({
      websiteUrl: null,
      twitterUsername: null,
      socialAccounts: [
        { provider: "YOUTUBE", url: "https://youtube.com/@mychannel" },
      ],
    });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("mychannel");
    expect(badges).toContain("youtube.com/@mychannel");
  });

  it("returns empty string when no social info", () => {
    const profile = makeUserProfile({
      websiteUrl: null,
      twitterUsername: null,
      socialAccounts: [],
    });
    expect(buildSocialBadges(profile)).toBe("");
  });
});

// ── shieldsBadgeLabel ────────────────────────────────────────────────────────

describe("shieldsBadgeLabel", () => {
  it("escapes hyphens", () => {
    expect(shieldsBadgeLabel("my-site")).toBe("my--site");
  });

  it("escapes underscores", () => {
    expect(shieldsBadgeLabel("my_name")).toBe("my__name");
  });

  it("leaves plain text unchanged", () => {
    expect(shieldsBadgeLabel("urmzd.dev")).toBe("urmzd.dev");
  });
});

// ── getTemplate ────────────────────────────────────────────────────────────

describe("getTemplate", () => {
  it("returns a function", () => {
    expect(typeof getTemplate("showcase")).toBe("function");
  });

  it("returns the same function regardless of template name", () => {
    expect(getTemplate("classic")).toBe(getTemplate("showcase"));
  });
});

// ── showcaseTemplate ───────────────────────────────────────────────────────

describe("showcaseTemplate", () => {
  it("includes name heading", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("# Urmzd Maharramoff");
  });

  it("includes pronunciation when provided", () => {
    const output = getTemplate("showcase")(
      makeContext({ pronunciation: "/ˈʊrm.zəd/" }),
    );
    expect(output).toContain("/ˈʊrm.zəd/");
  });

  it("includes preamble", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("A software developer in Austin, TX.");
  });

  it("includes inline metadata", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("**Top Languages:** TypeScript, Rust");
  });

  it("includes social badges", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("img.shields.io");
  });

  it("includes attribution", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("@urmzd/github-insights");
  });

  it("ends with trailing newline", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output.endsWith("\n")).toBe(true);
  });

  // Section rendering
  it("renders spotlight section with project cards", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("## Spotlight");
    expect(output).toContain(
      "### [hot-project](https://github.com/urmzd/hot-project)",
    );
    expect(output).toContain("**Active**");
    expect(output).toContain("Stars: 15");
  });

  it("renders velocity section", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("## Language Velocity");
    expect(output).toContain("assets/insights/metrics-velocity.svg");
  });

  it("renders rhythm section", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("## Contribution Rhythm");
    expect(output).toContain("assets/insights/metrics-rhythm.svg");
  });

  it("renders constellation section", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("## Project Map");
    expect(output).toContain("assets/insights/metrics-constellation.svg");
  });

  it("renders impact section", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("## Open Source Impact");
    expect(output).toContain("assets/insights/metrics-impact.svg");
  });

  it("renders portfolio section with collapsible details", () => {
    const output = getTemplate("showcase")(makeContext());
    expect(output).toContain("## Portfolio");
    expect(output).toContain("<details>");
    expect(output).toContain("<summary>All Projects</summary>");
    expect(output).toContain("### Applications");
    expect(output).toContain("### Research & Experiments");
    expect(output).toContain("</details>");
  });

  it("omits sections not in resolvedSections", () => {
    const output = getTemplate("showcase")(
      makeContext({
        resolvedSections: ["spotlight", "rhythm"],
      }),
    );
    expect(output).toContain("## Spotlight");
    expect(output).toContain("## Contribution Rhythm");
    expect(output).not.toContain("## Language Velocity");
    expect(output).not.toContain("## Project Map");
    expect(output).not.toContain("## Portfolio");
    expect(output).not.toContain("## Open Source Impact");
  });

  it("renders sections in the order specified", () => {
    const output = getTemplate("showcase")(
      makeContext({
        resolvedSections: ["impact", "spotlight"],
      }),
    );
    const impactIdx = output.indexOf("## Open Source Impact");
    const spotlightIdx = output.indexOf("## Spotlight");
    expect(impactIdx).toBeLessThan(spotlightIdx);
  });

  it("omits spotlight section when no spotlight projects", () => {
    const output = getTemplate("showcase")(
      makeContext({ spotlightProjects: [] }),
    );
    expect(output).not.toContain("## Spotlight");
  });

  it("omits portfolio section when no categorized projects", () => {
    const output = getTemplate("showcase")(
      makeContext({ categorizedProjects: {} }),
    );
    expect(output).not.toContain("## Portfolio");
  });

  it("uses AI summary when available in spotlight", () => {
    const output = getTemplate("showcase")(
      makeContext({
        spotlightProjects: [
          makeSpotlight({ summary: "AI-generated summary of the project." }),
        ],
      }),
    );
    expect(output).toContain("AI-generated summary of the project.");
  });

  it("shows Building activity label", () => {
    const output = getTemplate("showcase")(
      makeContext({
        spotlightProjects: [makeSpotlight({ activityLabel: "Building" })],
      }),
    );
    expect(output).toContain("**Building**");
  });
});
