import { describe, it, expect } from "vitest";
import { h, Fragment } from "../jsx-factory.js";
import {
  renderSectionHeader,
  renderSubHeader,
  renderDivider,
  renderSection,
} from "./section.js";

void Fragment;

describe("renderSectionHeader", () => {
  it("returns { svg, height }", () => {
    const result = renderSectionHeader("Title", "Subtitle", 0);
    expect(typeof result.svg).toBe("string");
    expect(typeof result.height).toBe("number");
  });

  it("height is 42 with subtitle", () => {
    expect(renderSectionHeader("T", "S", 0).height).toBe(42);
  });

  it("height is 24 without subtitle", () => {
    expect(renderSectionHeader("T", undefined, 0).height).toBe(24);
  });

  it("svg contains uppercased title", () => {
    const result = renderSectionHeader("Languages", "By bytes", 0);
    expect(result.svg).toContain("LANGUAGES");
  });
});

describe("renderSubHeader", () => {
  it("returns height 14", () => {
    expect(renderSubHeader("WEB FRAMEWORKS", 0).height).toBe(14);
  });

  it("svg contains text", () => {
    expect(renderSubHeader("DATABASES", 0).svg).toContain("DATABASES");
  });
});

describe("renderDivider", () => {
  it("returns height 1", () => {
    expect(renderDivider(100).height).toBe(1);
  });

  it("returns a line element", () => {
    expect(renderDivider(100).svg).toContain("<line");
  });
});

describe("renderSection", () => {
  it("returns { svg, height } with render function", () => {
    const result = renderSection("Title", "Sub", (y) => ({
      svg: `<text y="${y}">body</text>`,
      height: 50,
    }));
    expect(result.svg).toContain("TITLE");
    expect(result.svg).toContain("body");
    expect(result.height).toBeGreaterThan(0);
  });

  it("returns { svg, height } with items array", () => {
    const items = [{ name: "Go", value: 10 }];
    const result = renderSection("Tech", "Detected", items);
    expect(result.svg).toContain("Go");
  });
});
