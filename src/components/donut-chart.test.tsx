import { describe, it, expect } from "vitest";
import { h, Fragment } from "../jsx-factory.js";
import { renderDonutChart } from "./donut-chart.js";
import type { LanguageItem } from "../types.js";

void Fragment;

describe("renderDonutChart", () => {
  const items: LanguageItem[] = [
    { name: "TypeScript", value: 60000, percent: "60.0", color: "#3178c6" },
    { name: "Python", value: 40000, percent: "40.0", color: "#3572A5" },
  ];

  it("returns { svg, height }", () => {
    const result = renderDonutChart(items, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
  });

  it("height is at least 180", () => {
    const result = renderDonutChart(items, 0);
    expect(result.height).toBeGreaterThanOrEqual(180);
  });

  it("svg contains language names", () => {
    const result = renderDonutChart(items, 0);
    expect(result.svg).toContain("TypeScript");
    expect(result.svg).toContain("Python");
  });

  it("svg contains percentages", () => {
    const result = renderDonutChart(items, 0);
    expect(result.svg).toContain("60.0%");
    expect(result.svg).toContain("40.0%");
  });
});
