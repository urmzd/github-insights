import { describe, it, expect } from "vitest";
import { renderTechHighlights } from "./tech-highlights.js";
import type { TechHighlight } from "../types.js";

describe("renderTechHighlights", () => {
  it("renders sub-headers for each category", () => {
    const highlights: TechHighlight[] = [
      { category: "Frontend", items: ["React", "Vue"] },
      { category: "Backend", items: ["Express", "Django"] },
    ];
    const { svg } = renderTechHighlights(highlights, 0);
    expect(svg).toContain("FRONTEND");
    expect(svg).toContain("BACKEND");
  });

  it("renders pill text for each item", () => {
    const highlights: TechHighlight[] = [
      { category: "Languages", items: ["TypeScript", "Python", "Go"] },
    ];
    const { svg } = renderTechHighlights(highlights, 0);
    expect(svg).toContain("TypeScript");
    expect(svg).toContain("Python");
    expect(svg).toContain("Go");
  });

  it("returns height > 0", () => {
    const highlights: TechHighlight[] = [
      { category: "Tools", items: ["Docker", "Kubernetes"] },
    ];
    const { height } = renderTechHighlights(highlights, 0);
    expect(height).toBeGreaterThan(0);
  });

  it("returns empty result for empty input", () => {
    const result = renderTechHighlights([], 0);
    expect(result).toEqual({ svg: "", height: 0 });
  });
});
