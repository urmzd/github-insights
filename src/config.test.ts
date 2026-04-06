import { describe, expect, it } from "vitest";
import { parseUserConfig, resolveTemplateSections } from "./config.js";

describe("parseUserConfig", () => {
  it("parses both fields", () => {
    const raw = `title: "Senior Backend Engineer"\ndesired_title: "Staff Engineer"`;
    expect(parseUserConfig(raw)).toEqual({
      title: "Senior Backend Engineer",
      desired_title: "Staff Engineer",
    });
  });

  it("parses title only", () => {
    const raw = `title: "Software Engineer"`;
    expect(parseUserConfig(raw)).toEqual({ title: "Software Engineer" });
  });

  it("returns empty config for empty string", () => {
    expect(parseUserConfig("")).toEqual({});
  });

  it("trims whitespace-only values", () => {
    const raw = `title: "  "\ndesired_title: "Staff Engineer"`;
    expect(parseUserConfig(raw)).toEqual({ desired_title: "Staff Engineer" });
  });

  it("trims surrounding whitespace from values", () => {
    const raw = `title: "  Senior Engineer  "`;
    expect(parseUserConfig(raw)).toEqual({ title: "Senior Engineer" });
  });

  it("ignores unknown fields", () => {
    const raw = `title: "SWE"\nfoo: "bar"\nbaz: 42`;
    expect(parseUserConfig(raw)).toEqual({ title: "SWE" });
  });

  it("throws on invalid YAML", () => {
    expect(() => parseUserConfig("title: [invalid")).toThrow();
  });

  it("parses name", () => {
    const raw = `name: "Urmzd Maharramoff"`;
    expect(parseUserConfig(raw)).toEqual({ name: "Urmzd Maharramoff" });
  });

  it("parses pronunciation", () => {
    const raw = `pronunciation: "/ˈʊrm.zəd/"`;
    expect(parseUserConfig(raw)).toEqual({ pronunciation: "/ˈʊrm.zəd/" });
  });

  it("parses bio", () => {
    const raw = `bio: "Building tools for developers"`;
    expect(parseUserConfig(raw)).toEqual({
      bio: "Building tools for developers",
    });
  });

  it("parses preamble", () => {
    const raw = `preamble: "PREAMBLE.md"`;
    expect(parseUserConfig(raw)).toEqual({ preamble: "PREAMBLE.md" });
  });

  it("skips whitespace-only name", () => {
    const raw = `name: "   "`;
    expect(parseUserConfig(raw)).toEqual({});
  });

  it("parses template field", () => {
    const raw = `template: "modern"`;
    expect(parseUserConfig(raw)).toEqual({ template: "modern" });
  });

  it("normalizes template to lowercase", () => {
    const raw = `template: "Modern"`;
    expect(parseUserConfig(raw)).toEqual({ template: "modern" });
  });

  it("ignores unknown template values", () => {
    const raw = `template: "fancy"`;
    expect(parseUserConfig(raw)).toEqual({});
  });

  it("parses valid sections array", () => {
    const raw = `sections:\n  - velocity\n  - rhythm`;
    expect(parseUserConfig(raw)).toEqual({
      sections: ["velocity", "rhythm"],
    });
  });

  it("filters out invalid section keys", () => {
    const raw = `sections:\n  - velocity\n  - invalid\n  - rhythm`;
    expect(parseUserConfig(raw)).toEqual({
      sections: ["velocity", "rhythm"],
    });
  });

  it("filters out non-string sections entries", () => {
    const raw = `sections:\n  - velocity\n  - 42\n  - rhythm`;
    expect(parseUserConfig(raw)).toEqual({
      sections: ["velocity", "rhythm"],
    });
  });

  it("ignores empty sections array", () => {
    const raw = `sections: []`;
    expect(parseUserConfig(raw)).toEqual({});
  });

  it("parses all fields together", () => {
    const raw = [
      `name: "Urmzd Maharramoff"`,
      `pronunciation: "/ˈʊrm.zəd/"`,
      `title: "Senior Backend Engineer"`,
      `desired_title: "Staff Engineer"`,
      `bio: "Building tools for developers"`,
      `preamble: "PREAMBLE.md"`,
    ].join("\n");
    expect(parseUserConfig(raw)).toEqual({
      name: "Urmzd Maharramoff",
      pronunciation: "/ˈʊrm.zəd/",
      title: "Senior Backend Engineer",
      desired_title: "Staff Engineer",
      bio: "Building tools for developers",
      preamble: "PREAMBLE.md",
    });
  });

  it("parses constellation_group_by as language", () => {
    const raw = `constellation_group_by: language`;
    expect(parseUserConfig(raw)).toEqual({
      constellation_group_by: "language",
    });
  });

  it("parses constellation_group_by as category", () => {
    const raw = `constellation_group_by: category`;
    expect(parseUserConfig(raw)).toEqual({
      constellation_group_by: "category",
    });
  });

  it("drops invalid constellation_group_by", () => {
    const raw = `constellation_group_by: "invalid"`;
    expect(parseUserConfig(raw)).toEqual({});
  });

  it("parses ecosystem template", () => {
    const raw = `template: "ecosystem"`;
    expect(parseUserConfig(raw)).toEqual({ template: "ecosystem" });
  });

  it("parses showcase template", () => {
    const raw = `template: "showcase"`;
    expect(parseUserConfig(raw)).toEqual({ template: "showcase" });
  });

  it("parses stack section", () => {
    const raw = `sections:\n  - stack`;
    expect(parseUserConfig(raw)).toEqual({
      sections: ["stack"],
    });
  });

  it("parses TOML format when specified", () => {
    const raw = `title = "Senior Backend Engineer"`;
    expect(parseUserConfig(raw, "toml")).toEqual({
      title: "Senior Backend Engineer",
    });
  });
});

// ── resolveTemplateSections ──────────────────────────────────────────────────

describe("resolveTemplateSections", () => {
  it("returns explicit sections when provided", () => {
    const result = resolveTemplateSections("classic", ["spotlight", "rhythm"]);
    expect(result).toEqual(["spotlight", "rhythm"]);
  });

  it("maps classic template to preset", () => {
    const result = resolveTemplateSections("classic");
    expect(result).toEqual(["velocity", "rhythm", "constellation", "impact"]);
  });

  it("maps modern template to preset", () => {
    const result = resolveTemplateSections("modern");
    expect(result).toEqual([
      "spotlight",
      "velocity",
      "rhythm",
      "constellation",
      "impact",
    ]);
  });

  it("maps minimal template to preset", () => {
    const result = resolveTemplateSections("minimal");
    expect(result).toEqual(["velocity", "rhythm"]);
  });

  it("maps ecosystem template to preset", () => {
    const result = resolveTemplateSections("ecosystem");
    expect(result).toEqual([
      "spotlight",
      "velocity",
      "rhythm",
      "constellation",
      "stack",
      "portfolio",
      "impact",
    ]);
  });

  it("defaults to showcase preset when no template specified", () => {
    const result = resolveTemplateSections(undefined);
    expect(result).toEqual([
      "spotlight",
      "velocity",
      "rhythm",
      "constellation",
      "portfolio",
      "impact",
    ]);
  });

  it("filters out invalid section keys", () => {
    const result = resolveTemplateSections(undefined, [
      "spotlight",
      "invalid",
      "rhythm",
    ]);
    expect(result).toEqual(["spotlight", "rhythm"]);
  });

  it("falls back to default when all explicit sections are invalid", () => {
    const result = resolveTemplateSections(undefined, ["invalid", "nope"]);
    expect(result).toEqual([
      "spotlight",
      "velocity",
      "rhythm",
      "constellation",
      "portfolio",
      "impact",
    ]);
  });
});
