import { describe, expect, it } from "vitest";
import { Fragment, h } from "../jsx-factory.js";
import type { ProjectItem } from "../types.js";
import { renderProjectCards } from "./project-cards.js";

void Fragment;

describe("renderProjectCards", () => {
  const projects: ProjectItem[] = [
    {
      name: "big-app",
      url: "https://github.com/u/big-app",
      description: "A large app",
      stars: 120,
    },
    {
      name: "small-lib",
      url: "https://github.com/u/small-lib",
      description: "",
      stars: 45,
    },
  ];

  it("returns { svg, height }", () => {
    const result = renderProjectCards(projects, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
  });

  it("height is positive for non-empty input", () => {
    const result = renderProjectCards(projects, 0);
    expect(result.height).toBeGreaterThan(0);
  });

  it("svg contains project names and star counts", () => {
    const result = renderProjectCards(projects, 0);
    expect(result.svg).toContain("big-app");
    expect(result.svg).toContain("\u2605 120");
    expect(result.svg).toContain("small-lib");
  });

  it("handles empty input", () => {
    const result = renderProjectCards([], 0);
    expect(result.height).toBe(0);
  });
});
