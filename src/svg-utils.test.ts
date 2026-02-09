import { describe, it, expect } from "vitest";
import { escapeXml, truncate, wrapText, FIRE_ICON } from "./svg-utils.js";

describe("escapeXml", () => {
  it("escapes & < > \" '", () => {
    expect(escapeXml('Tom & Jerry <"hello"> it\'s')).toBe(
      "Tom &amp; Jerry &lt;&quot;hello&quot;&gt; it&apos;s",
    );
  });

  it('returns "" for null', () => {
    expect(escapeXml(null)).toBe("");
  });

  it('returns "" for undefined', () => {
    expect(escapeXml(undefined)).toBe("");
  });

  it('returns "" for empty string', () => {
    expect(escapeXml("")).toBe("");
  });

  it("returns plain string unchanged", () => {
    expect(escapeXml("hello world")).toBe("hello world");
  });
});

describe("truncate", () => {
  it("returns short string untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long string with ellipsis", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcd\u2026");
  });

  it('returns "" for null', () => {
    expect(truncate(null, 10)).toBe("");
  });

  it('returns "" for undefined', () => {
    expect(truncate(undefined, 10)).toBe("");
  });

  it("returns exact-length string untouched", () => {
    expect(truncate("abcde", 5)).toBe("abcde");
  });
});

describe("wrapText", () => {
  it("returns single line when text fits", () => {
    expect(wrapText("short text", 30)).toEqual(["short text"]);
  });

  it("wraps at word boundary", () => {
    const lines = wrapText("hello world foo bar", 12);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(12);
    }
  });

  it("returns [] for empty string", () => {
    expect(wrapText("", 20)).toEqual([]);
  });
});

describe("FIRE_ICON", () => {
  it("contains correct translate coordinates", () => {
    const icon = FIRE_ICON(100, 50);
    expect(icon).toContain("translate(100, 50)");
  });

  it("contains an svg path", () => {
    expect(FIRE_ICON(0, 0)).toContain("<path");
  });
});
