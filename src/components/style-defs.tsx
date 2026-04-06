/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "../jsx-factory.js";
import { FONT, THEME, THEME_LIGHT } from "../theme.js";
import type { ThemeMode } from "../types.js";

export function StyleDefs({ mode }: { mode: ThemeMode }): string {
  const t = mode === "dark" ? THEME : THEME_LIGHT;
  return (
    <defs>
      <style>
        {`
  .t { font-family: ${FONT}; font-variant-numeric: tabular-lining; }
  .t-h { font-size: 14px; fill: ${t.text}; letter-spacing: 2px; font-weight: 600; }
  .t-sub { font-size: 11px; fill: ${t.muted}; }
  .t-label { font-size: 12px; fill: ${t.secondary}; }
  .t-value { font-size: 11px; fill: ${t.muted}; }
  .t-subhdr { font-size: 11px; fill: ${t.secondary}; letter-spacing: 1px; font-weight: 600; }
  .t-stat-label { font-size: 10px; fill: ${t.secondary}; font-weight: 600; }
  .t-stat-value { font-size: 22px; font-weight: 700; }
  .t-card-title { font-size: 12px; fill: ${t.link}; font-weight: 700; }
  .t-card-detail { font-size: 11px; fill: ${t.secondary}; }
  .t-pill { font-size: 11px; font-weight: 600; }
  .t-bullet { font-size: 12px; fill: ${t.text}; }
  .bg-fill { fill: ${t.bg}; }
  .card-fill { fill: ${t.cardBg}; }
  .border-stroke { stroke: ${t.border}; }
  .muted-fill { fill: ${t.muted}; }
  .secondary-fill { fill: ${t.secondary}; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes drawPath {
    from { stroke-dashoffset: var(--path-length); }
    to { stroke-dashoffset: 0; }
  }
  @keyframes radarReveal {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 0.6; }
  }
  .fade-1 { animation: fadeIn 0.6s ease-out 0.1s both; }
  .fade-2 { animation: fadeIn 0.6s ease-out 0.25s both; }
  .fade-3 { animation: fadeIn 0.6s ease-out 0.4s both; }
  .fade-4 { animation: fadeIn 0.6s ease-out 0.55s both; }
  .fade-5 { animation: fadeIn 0.6s ease-out 0.7s both; }
  .fade-6 { animation: fadeIn 0.6s ease-out 0.85s both; }
`}
      </style>
    </defs>
  );
}

void Fragment;
