import { describe, expect, it } from "vitest";
import { makeContributionData, makeUserProfile } from "./__fixtures__/repos.js";
import {
  buildSocialBadges,
  extractFirstName,
  getTemplate,
} from "./templates.js";
import type { TemplateContext } from "./types.js";

const makeContext = (
  overrides: Partial<TemplateContext> = {},
): TemplateContext => ({
  username: "urmzd",
  name: "Urmzd Maharramoff",
  firstName: "Urmzd",
  pronunciation: undefined,
  title: "Software Engineer",
  bio: "Building tools",
  preambleContent: "A developer who builds things.",
  shortPreambleContent: "A software developer in Austin, TX.",
  svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
  sectionSvgs: {
    pulse: "metrics/metrics-pulse.svg",
    calendar: "metrics/metrics-calendar.svg",
    expertise: "metrics/metrics-expertise.svg",
  },
  profile: makeUserProfile(),
  activeProjects: [
    {
      name: "resume-generator",
      url: "https://github.com/urmzd/resume-generator",
      description: "CLI tool for professional resumes",
      stars: 42,
    },
  ],
  legacyProjects: [
    {
      name: "flappy-bird",
      url: "https://github.com/urmzd/flappy-bird",
      description: "JavaFX game with design patterns",
      stars: 8,
    },
  ],
  allProjects: [],
  languages: [
    { name: "TypeScript", value: 100, percent: "60.0", color: "#3178c6" },
    { name: "Rust", value: 50, percent: "30.0", color: "#dea584" },
  ],
  techHighlights: [],
  contributionData: makeContributionData(),
  socialBadges:
    "[![Website](https://img.shields.io/badge/Website-4285F4?style=flat&logo=google-chrome&logoColor=white)](https://urmzd.dev)",
  svgDir: "metrics",
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
  it("builds website badge", () => {
    const profile = makeUserProfile({
      twitterUsername: null,
      socialAccounts: [],
    });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("Website");
    expect(badges).toContain("https://urmzd.dev");
  });

  it("builds twitter badge", () => {
    const profile = makeUserProfile({ websiteUrl: null, socialAccounts: [] });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("Twitter");
    expect(badges).toContain("https://x.com/urmzd");
  });

  it("builds LinkedIn badge from social accounts", () => {
    const profile = makeUserProfile({
      websiteUrl: null,
      twitterUsername: null,
    });
    const badges = buildSocialBadges(profile);
    expect(badges).toContain("LinkedIn");
    expect(badges).toContain("https://linkedin.com/in/urmzd");
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

// ── getTemplate ────────────────────────────────────────────────────────────

describe("getTemplate", () => {
  it("returns a function for classic", () => {
    expect(typeof getTemplate("classic")).toBe("function");
  });

  it("returns a function for modern", () => {
    expect(typeof getTemplate("modern")).toBe("function");
  });

  it("returns a function for minimal", () => {
    expect(typeof getTemplate("minimal")).toBe("function");
  });
});

// ── Classic template ───────────────────────────────────────────────────────

describe("classicTemplate", () => {
  it("includes name heading", () => {
    const output = getTemplate("classic")(makeContext());
    expect(output).toContain("# Urmzd Maharramoff");
  });

  it("includes title blockquote", () => {
    const output = getTemplate("classic")(makeContext());
    expect(output).toContain("> Software Engineer");
  });

  it("includes preamble content", () => {
    const output = getTemplate("classic")(makeContext());
    expect(output).toContain("A developer who builds things.");
  });

  it("includes SVG embeds", () => {
    const output = getTemplate("classic")(makeContext());
    expect(output).toContain("![GitHub Metrics](metrics/index.svg)");
  });

  it("includes bio footer", () => {
    const output = getTemplate("classic")(makeContext());
    expect(output).toContain("<sub>Building tools</sub>");
  });

  it("includes attribution", () => {
    const output = getTemplate("classic")(makeContext());
    expect(output).toContain("@urmzd/github-metrics");
  });

  it("includes pronunciation when provided", () => {
    const output = getTemplate("classic")(
      makeContext({ pronunciation: "/ˈʊrm.zəd/" }),
    );
    expect(output).toContain("/ˈʊrm.zəd/");
  });

  it("ends with trailing newline", () => {
    const output = getTemplate("classic")(makeContext());
    expect(output.endsWith("\n")).toBe(true);
  });
});

// ── Modern template ────────────────────────────────────────────────────────

describe("modernTemplate", () => {
  it("includes wave greeting with first name", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output).toContain("# Hi, I'm Urmzd");
  });

  it("includes short preamble", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output).toContain("A software developer in Austin, TX.");
  });

  it("includes active projects section", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output).toContain("## Active Projects");
    expect(output).toContain("resume-generator");
    expect(output).toContain("42 ★");
  });

  it("includes legacy work section", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output).toContain("## Legacy Work");
    expect(output).toContain("flappy-bird");
  });

  it("includes GitHub Stats section with pulse and calendar", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output).toContain("## GitHub Stats");
    expect(output).toContain("metrics/metrics-pulse.svg");
    expect(output).toContain("metrics/metrics-calendar.svg");
  });

  it("includes expertise section", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output).toContain("## Other Areas of Interest");
    expect(output).toContain("metrics/metrics-expertise.svg");
  });

  it("includes social badges", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output).toContain("img.shields.io");
  });

  it("ends with trailing newline", () => {
    const output = getTemplate("modern")(makeContext());
    expect(output.endsWith("\n")).toBe(true);
  });
});

// ── Minimal template ───────────────────────────────────────────────────────

describe("minimalTemplate", () => {
  it("uses first name as heading", () => {
    const output = getTemplate("minimal")(makeContext());
    expect(output).toContain("# Urmzd");
  });

  it("includes short preamble", () => {
    const output = getTemplate("minimal")(makeContext());
    expect(output).toContain("A software developer in Austin, TX.");
  });

  it("includes SVG embeds", () => {
    const output = getTemplate("minimal")(makeContext());
    expect(output).toContain("![GitHub Metrics](metrics/index.svg)");
  });

  it("includes social badges", () => {
    const output = getTemplate("minimal")(makeContext());
    expect(output).toContain("img.shields.io");
  });

  it("includes attribution", () => {
    const output = getTemplate("minimal")(makeContext());
    expect(output).toContain("@urmzd/github-metrics");
  });

  it("ends with trailing newline", () => {
    const output = getTemplate("minimal")(makeContext());
    expect(output.endsWith("\n")).toBe(true);
  });
});
