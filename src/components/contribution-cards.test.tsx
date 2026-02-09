import { describe, it, expect } from "vitest";
import { h, Fragment } from "../jsx-factory.js";
import { renderContributionCards } from "./contribution-cards.js";
import type { ContributionHighlight } from "../types.js";

void Fragment;

describe("renderContributionCards", () => {
  const highlights: ContributionHighlight[] = [
    { project: "org/repo-one", detail: "★ 500 · TypeScript" },
    { project: "org/repo-two", detail: "★ 200 · Go" },
  ];

  it("returns { svg, height }", () => {
    const result = renderContributionCards(highlights, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
  });

  it("height accounts for cards and gaps", () => {
    const result = renderContributionCards(highlights, 0);
    // 2 cards of 44px + 1 gap of 8px = 96
    expect(result.height).toBe(2 * 44 + 1 * 8);
  });

  it("svg contains project names", () => {
    const result = renderContributionCards(highlights, 0);
    expect(result.svg).toContain("org/repo-one");
    expect(result.svg).toContain("org/repo-two");
  });

  it("handles empty input", () => {
    const result = renderContributionCards([], 0);
    expect(result.height).toBe(0);
  });
});
