import { describe, expect, it } from "vitest";
import { Fragment, h } from "../jsx-factory.js";
import type { StatItem } from "../types.js";
import { renderStatCards } from "./stat-cards.js";

void Fragment;

describe("renderStatCards", () => {
  const stats: StatItem[] = [
    { label: "COMMITS", value: "500" },
    { label: "PRS", value: "42" },
  ];

  it("returns { svg, height }", () => {
    const result = renderStatCards(stats, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
  });

  it("height is card height (72)", () => {
    const result = renderStatCards(stats, 0);
    expect(result.height).toBe(72);
  });

  it("svg contains labels and values", () => {
    const result = renderStatCards(stats, 0);
    expect(result.svg).toContain("COMMITS");
    expect(result.svg).toContain("500");
    expect(result.svg).toContain("PRS");
    expect(result.svg).toContain("42");
  });
});
