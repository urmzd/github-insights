import { describe, expect, it } from "vitest";
import { parseUserConfig } from "./config.js";

describe("parseUserConfig", () => {
  it("parses both fields", () => {
    const raw = `title = "Senior Backend Engineer"\ndesired_title = "Staff Engineer"`;
    expect(parseUserConfig(raw)).toEqual({
      title: "Senior Backend Engineer",
      desired_title: "Staff Engineer",
    });
  });

  it("parses title only", () => {
    const raw = `title = "Software Engineer"`;
    expect(parseUserConfig(raw)).toEqual({ title: "Software Engineer" });
  });

  it("returns empty config for empty string", () => {
    expect(parseUserConfig("")).toEqual({});
  });

  it("trims whitespace-only values", () => {
    const raw = `title = "  "\ndesired_title = "Staff Engineer"`;
    expect(parseUserConfig(raw)).toEqual({ desired_title: "Staff Engineer" });
  });

  it("trims surrounding whitespace from values", () => {
    const raw = `title = "  Senior Engineer  "`;
    expect(parseUserConfig(raw)).toEqual({ title: "Senior Engineer" });
  });

  it("ignores unknown fields", () => {
    const raw = `title = "SWE"\nfoo = "bar"\nbaz = 42`;
    expect(parseUserConfig(raw)).toEqual({ title: "SWE" });
  });

  it("throws on invalid TOML", () => {
    expect(() => parseUserConfig("title = ")).toThrow();
  });

  it("parses name", () => {
    const raw = `name = "Urmzd Maharramoff"`;
    expect(parseUserConfig(raw)).toEqual({ name: "Urmzd Maharramoff" });
  });

  it("parses pronunciation", () => {
    const raw = `pronunciation = "/ˈʊrm.zəd/"`;
    expect(parseUserConfig(raw)).toEqual({ pronunciation: "/ˈʊrm.zəd/" });
  });

  it("parses bio", () => {
    const raw = `bio = "Building tools for developers"`;
    expect(parseUserConfig(raw)).toEqual({ bio: "Building tools for developers" });
  });

  it("parses preamble", () => {
    const raw = `preamble = "PREAMBLE.md"`;
    expect(parseUserConfig(raw)).toEqual({ preamble: "PREAMBLE.md" });
  });

  it("skips whitespace-only name", () => {
    const raw = `name = "   "`;
    expect(parseUserConfig(raw)).toEqual({});
  });

  it("parses all fields together", () => {
    const raw = [
      `name = "Urmzd Maharramoff"`,
      `pronunciation = "/ˈʊrm.zəd/"`,
      `title = "Senior Backend Engineer"`,
      `desired_title = "Staff Engineer"`,
      `bio = "Building tools for developers"`,
      `preamble = "PREAMBLE.md"`,
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
});
