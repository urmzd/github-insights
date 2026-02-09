import { describe, it, expect } from "vitest";
import { h, Fragment } from "../jsx-factory.js";
import { renderDomainCloud } from "./domain-cloud.js";
import type { DomainItem } from "../types.js";

void Fragment;

describe("renderDomainCloud", () => {
  const domains: DomainItem[] = [
    { name: "web development", count: 5, repos: ["a", "b", "c", "d", "e"] },
    { name: "machine learning", count: 3, repos: ["a", "b", "c"] },
    { name: "devops", count: 1, repos: ["a"] },
  ];

  it("returns { svg, height }", () => {
    const result = renderDomainCloud(domains, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
  });

  it("height is positive", () => {
    const result = renderDomainCloud(domains, 0);
    expect(result.height).toBeGreaterThan(0);
  });

  it("svg contains domain names", () => {
    const result = renderDomainCloud(domains, 0);
    expect(result.svg).toContain("web development");
    expect(result.svg).toContain("machine learning");
    expect(result.svg).toContain("devops");
  });
});
