import { h, Fragment } from "../jsx-factory.js";
import { THEME, LAYOUT } from "../theme.js";
import { StyleDefs } from "./style-defs.js";
import { renderSectionHeader } from "./section.js";
import { renderBarChart } from "./bar-chart.js";
import type { SectionDef } from "../types.js";

export function wrapSectionSvg(bodySvg: string, height: number): string {
  const { width } = LAYOUT;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <StyleDefs />
      <rect width={width} height={height} rx="12" fill={THEME.bg} />
      {bodySvg}
    </svg>
  );
}

export function generateFullSvg(sections: SectionDef[]): string {
  const { width, padY, sectionGap } = LAYOUT;
  let y = padY;
  let bodySvg = "";

  for (const section of sections) {
    const header = renderSectionHeader(section.title, section.subtitle, y);
    bodySvg += header.svg;
    y += header.height;

    if (section.renderBody) {
      const body = section.renderBody(y);
      bodySvg += body.svg;
      y += body.height + sectionGap;
    } else if (section.items) {
      const bars = renderBarChart(section.items, y, section.options || {});
      bodySvg += bars.svg;
      y += bars.height + sectionGap;
    }
  }

  const totalHeight = y + padY;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={totalHeight}
      viewBox={`0 0 ${width} ${totalHeight}`}
    >
      <StyleDefs />
      <rect width={width} height={totalHeight} rx="12" fill={THEME.bg} />
      {bodySvg}
    </svg>
  );
}
