import { describe, expect, it } from "vitest";
import { generateReadme } from "./readme.js";

describe("generateReadme", () => {
  it("renders minimal readme (name + single SVG)", () => {
    const result = generateReadme({
      name: "octocat",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain(
      "# octocat\n\n![GitHub Metrics](metrics/index.svg)",
    );
    expect(result).toMatch(
      /Last generated on \d{4}-\d{2}-\d{2} using \[@urmzd\/github-metrics\]/,
    );
  });

  it("includes pronunciation when set", () => {
    const result = generateReadme({
      name: "Urmzd",
      pronunciation: "/ˈʊrm.zəd/",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain("# Urmzd <sub><i>(/ˈʊrm.zəd/)</i></sub>");
  });

  it("omits pronunciation when not set", () => {
    const result = generateReadme({
      name: "Urmzd",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).not.toContain("<sub><i>");
    expect(result).toContain("# Urmzd\n");
  });

  it("includes title as blockquote when set", () => {
    const result = generateReadme({
      name: "Urmzd",
      title: "Senior Backend Engineer",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain("> Senior Backend Engineer");
  });

  it("omits title when not set", () => {
    const result = generateReadme({
      name: "Urmzd",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).not.toContain("> ");
  });

  it("includes preamble content when set", () => {
    const result = generateReadme({
      name: "Urmzd",
      preambleContent: "Hello, I build things.",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain("Hello, I build things.");
  });

  it("omits preamble when not set", () => {
    const result = generateReadme({
      name: "Urmzd",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    // Only heading + SVG + attribution + trailing newline
    expect(result).not.toContain("Hello");
    expect(result).toContain("# Urmzd");
    expect(result).toContain("![GitHub Metrics](metrics/index.svg)");
  });

  it("preamble is not wrapped in code fences", () => {
    const result = generateReadme({
      name: "Urmzd",
      preambleContent: "Hello, I build things.",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain("Hello, I build things.");
    expect(result).not.toContain("```");
  });

  it("multi-paragraph preamble preserves structure", () => {
    const preamble =
      "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const result = generateReadme({
      name: "Urmzd",
      preambleContent: preamble,
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain(preamble);
    expect(result).toContain(`# Urmzd\n\n${preamble}\n\n![GitHub Metrics]`);
  });

  it("preamble with markdown features inserted raw", () => {
    const preamble =
      "I am **bold** and have [![Badge](https://img.shields.io)](https://example.com) and a [link](https://example.com).";
    const result = generateReadme({
      name: "Urmzd",
      preambleContent: preamble,
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain("**bold**");
    expect(result).toContain(
      "[![Badge](https://img.shields.io)](https://example.com)",
    );
    expect(result).toContain("[link](https://example.com)");
    expect(result).not.toContain("```");
  });

  it("preamble separated from adjacent sections by blank lines", () => {
    const result = generateReadme({
      name: "Urmzd",
      pronunciation: "/ˈʊrm.zəd/",
      title: "Senior Backend Engineer",
      preambleContent: "Welcome to my profile!",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
      bio: "Building tools for developers",
    });
    expect(result).toContain(
      "> Senior Backend Engineer\n\nWelcome to my profile!",
    );
    expect(result).toContain(
      "Welcome to my profile!\n\n![GitHub Metrics](metrics/index.svg)",
    );
  });

  it("includes bio footer when set", () => {
    const result = generateReadme({
      name: "Urmzd",
      bio: "Building tools for developers",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).toContain("---\n\n<sub>Building tools for developers</sub>");
  });

  it("omits bio when not set", () => {
    const result = generateReadme({
      name: "Urmzd",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result).not.toContain("---");
    // Should only have the attribution <sub>, not a bio <sub>
    const subMatches = result.match(/<sub>/g) || [];
    expect(subMatches).toHaveLength(1);
    expect(result).toContain("Last generated on");
  });

  it("renders multiple SVGs individually", () => {
    const result = generateReadme({
      name: "Urmzd",
      svgs: [
        { label: "Languages", path: "metrics/metrics-languages.svg" },
        { label: "Projects", path: "metrics/metrics-projects.svg" },
        { label: "Expertise", path: "metrics/metrics-expertise.svg" },
      ],
    });
    expect(result).toContain("![Languages](metrics/metrics-languages.svg)");
    expect(result).toContain("![Projects](metrics/metrics-projects.svg)");
    expect(result).toContain("![Expertise](metrics/metrics-expertise.svg)");
  });

  it("renders all sections combined", () => {
    const result = generateReadme({
      name: "Urmzd Maharramoff",
      pronunciation: "/ˈʊrm.zəd/",
      title: "Senior Backend Engineer",
      preambleContent: "Welcome to my profile!",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
      bio: "Building tools for developers",
    });
    expect(result).toContain(
      "# Urmzd Maharramoff <sub><i>(/ˈʊrm.zəd/)</i></sub>",
    );
    expect(result).toContain("> Senior Backend Engineer");
    expect(result).toContain("Welcome to my profile!");
    expect(result).toContain("![GitHub Metrics](metrics/index.svg)");
    expect(result).toContain("---\n\n<sub>Building tools for developers</sub>");
  });

  it("ends with a trailing newline", () => {
    const result = generateReadme({
      name: "octocat",
      svgs: [{ label: "GitHub Metrics", path: "metrics/index.svg" }],
    });
    expect(result.endsWith("\n")).toBe(true);
    expect(result.endsWith("\n\n")).toBe(false);
  });
});
