import { describe, expect, it } from "vitest";
import { Fragment, h } from "../jsx-factory.js";
import { StyleDefs } from "./style-defs.js";

void Fragment;

describe("StyleDefs", () => {
  it("returns a string containing <defs> and <style>", () => {
    const result = StyleDefs();
    expect(result).toContain("<defs>");
    expect(result).toContain("<style>");
  });

  it("contains expected CSS classes", () => {
    const result = StyleDefs();
    expect(result).toContain(".t-h");
    expect(result).toContain(".t-label");
    expect(result).toContain(".t-value");
    expect(result).toContain(".t-pill");
  });

  it("contains font-family declaration", () => {
    const result = StyleDefs();
    expect(result).toContain("font-family:");
  });
});
