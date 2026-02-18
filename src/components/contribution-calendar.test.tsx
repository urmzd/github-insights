import { describe, expect, it } from "vitest";
import { makeContributionCalendar } from "../__fixtures__/repos.js";
import { Fragment, h } from "../jsx-factory.js";
import { renderContributionCalendar } from "./contribution-calendar.js";

void Fragment;

describe("renderContributionCalendar", () => {
  const calendar = makeContributionCalendar();

  it("returns { svg, height }", () => {
    const result = renderContributionCalendar(calendar, 0);
    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("height");
    expect(typeof result.svg).toBe("string");
    expect(result.height).toBeGreaterThan(0);
  });

  it("renders rect cells for each contribution day", () => {
    const { svg } = renderContributionCalendar(calendar, 0);
    // 2 weeks x 7 days = 14 rects
    const rectCount = (svg.match(/<rect /g) || []).length;
    expect(rectCount).toBe(14);
  });

  it("includes month labels", () => {
    const { svg } = renderContributionCalendar(calendar, 0);
    expect(svg).toContain("Jan");
  });

  it("includes day labels", () => {
    const { svg } = renderContributionCalendar(calendar, 0);
    expect(svg).toContain("Mon");
    expect(svg).toContain("Wed");
    expect(svg).toContain("Fri");
  });

  it("uses colors from the calendar data", () => {
    const { svg } = renderContributionCalendar(calendar, 0);
    expect(svg).toContain("#0e4429");
    expect(svg).toContain("#006d32");
    expect(svg).toContain("#39d353");
  });
});
