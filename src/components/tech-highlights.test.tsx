import { describe, expect, it } from "vitest";
import type { TechHighlight } from "../types.js";
import { renderTechHighlights } from "./tech-highlights.js";

describe("renderTechHighlights", () => {
  it("renders category names in uppercase", () => {
    const highlights: TechHighlight[] = [
      { category: "Frontend", items: ["React", "Vue"], score: 85 },
      { category: "Backend", items: ["Express", "Django"], score: 70 },
    ];
    const { svg } = renderTechHighlights(highlights, 0);
    expect(svg).toContain("FRONTEND");
    expect(svg).toContain("BACKEND");
  });

  it("renders skill items joined with middle dot", () => {
    const highlights: TechHighlight[] = [
      {
        category: "Languages",
        items: ["TypeScript", "Python", "Go"],
        score: 90,
      },
    ];
    const { svg } = renderTechHighlights(highlights, 0);
    expect(svg).toContain("TypeScript");
    expect(svg).toContain("Python");
    expect(svg).toContain("Go");
    expect(svg).toContain("\u00B7");
  });

  it("renders score percentages", () => {
    const highlights: TechHighlight[] = [
      { category: "Web Dev", items: ["React", "Astro"], score: 85 },
      { category: "DevOps", items: ["Docker"], score: 60 },
    ];
    const { svg } = renderTechHighlights(highlights, 0);
    expect(svg).toContain("85%");
    expect(svg).toContain("60%");
  });

  it("returns height > 0 for non-empty input", () => {
    const highlights: TechHighlight[] = [
      { category: "Tools", items: ["Docker", "Kubernetes"], score: 75 },
    ];
    const { height } = renderTechHighlights(highlights, 0);
    expect(height).toBeGreaterThan(0);
  });

  it("returns empty result for empty input", () => {
    const result = renderTechHighlights([], 0);
    expect(result).toEqual({ svg: "", height: 0 });
  });

  it("clamps out-of-range scores", () => {
    const highlights: TechHighlight[] = [
      { category: "Over", items: ["A"], score: 150 },
      { category: "Under", items: ["B"], score: -10 },
    ];
    const { svg } = renderTechHighlights(highlights, 0);
    expect(svg).toContain("100%");
    expect(svg).toContain("0%");
  });
});
