import { describe, expect, it } from "vitest";
import { Fragment, h } from "../jsx-factory.js";
import type { BarItem } from "../types.js";
import { renderBarChart } from "./bar-chart.js";

void Fragment;

describe("renderBarChart", () => {
  const items: BarItem[] = [
    { name: "TypeScript", value: 75, percent: "75.0", color: "#3178c6" },
    { name: "JavaScript", value: 25, percent: "25.0", color: "#f1e05a" },
  ];

  it("returns { svg, height }", () => {
    const result = renderBarChart(items, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
    expect(typeof result.svg).toBe("string");
    expect(typeof result.height).toBe("number");
  });

  it("height matches item count * row height", () => {
    const result = renderBarChart(items, 0);
    expect(result.height).toBe(items.length * 28);
  });

  it("svg contains item names", () => {
    const result = renderBarChart(items, 0);
    expect(result.svg).toContain("TypeScript");
    expect(result.svg).toContain("JavaScript");
  });

  it("returns empty for empty input", () => {
    const result = renderBarChart([], 0);
    expect(result.svg).toBe("");
    expect(result.height).toBe(0);
  });
});
