import { describe, expect, it } from "vitest";
import { Fragment, h } from "../jsx-factory.js";
import type { SectionDef } from "../types.js";
import { generateFullSvg, wrapSectionSvg } from "./full-svg.js";

void Fragment;

describe("wrapSectionSvg", () => {
  it("returns an svg string", () => {
    const result = wrapSectionSvg("<text>hi</text>", 100);
    expect(result).toContain("<svg");
    expect(result).toContain("</svg>");
    expect(result).toContain("<text>hi</text>");
  });

  it("includes width and height", () => {
    const result = wrapSectionSvg("", 200);
    expect(result).toContain('height="200"');
  });
});

describe("generateFullSvg", () => {
  it("combines multiple sections", () => {
    const sections: SectionDef[] = [
      {
        filename: "a.svg",
        title: "Section A",
        subtitle: "Subtitle A",
        renderBody: (y) => ({
          svg: `<text y="${y}">A body</text>`,
          height: 50,
        }),
      },
      {
        filename: "b.svg",
        title: "Section B",
        subtitle: "Subtitle B",
        items: [{ name: "Go", value: 10 }],
      },
    ];
    const result = generateFullSvg(sections);
    expect(result).toContain("<svg");
    expect(result).toContain("SECTION A");
    expect(result).toContain("SECTION B");
    expect(result).toContain("A body");
    expect(result).toContain("Go");
  });

  it("returns valid svg for empty sections", () => {
    const result = generateFullSvg([]);
    expect(result).toContain("<svg");
    expect(result).toContain("</svg>");
  });
});
