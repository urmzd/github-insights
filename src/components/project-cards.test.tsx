import { describe, it, expect } from "vitest";
import { h, Fragment } from "../jsx-factory.js";
import { renderProjectCards } from "./project-cards.js";
import type { ComplexityItem, DomainMap } from "../types.js";

void Fragment;

describe("renderProjectCards", () => {
  const projects: ComplexityItem[] = [
    {
      name: "big-app",
      url: "https://github.com/u/big-app",
      description: "A large app",
      value: 90,
    },
    {
      name: "small-lib",
      url: "https://github.com/u/small-lib",
      description: "",
      value: 45,
    },
  ];
  const domainMap: DomainMap = new Map([["big-app", ["web", "ml"]]]);

  it("returns { svg, height }", () => {
    const result = renderProjectCards(projects, domainMap, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
  });

  it("height is positive for non-empty input", () => {
    const result = renderProjectCards(projects, domainMap, 0);
    expect(result.height).toBeGreaterThan(0);
  });

  it("svg contains project names and scores", () => {
    const result = renderProjectCards(projects, domainMap, 0);
    expect(result.svg).toContain("big-app");
    expect(result.svg).toContain("score 90");
    expect(result.svg).toContain("small-lib");
  });

  it("svg contains domain tags", () => {
    const result = renderProjectCards(projects, domainMap, 0);
    expect(result.svg).toContain("web");
    expect(result.svg).toContain("ml");
  });

  it("handles empty input", () => {
    const result = renderProjectCards([], new Map(), 0);
    expect(result.height).toBe(0);
  });
});
