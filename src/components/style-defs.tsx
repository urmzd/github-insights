import { Fragment, h } from "../jsx-factory.js";
import { FONT, THEME } from "../theme.js";

export function StyleDefs(): string {
  return (
    <defs>
      <style>
        {`
  .t { font-family: ${FONT}; }
  .t-h { font-size: 13px; fill: ${THEME.text}; letter-spacing: 1.5px; font-weight: 600; }
  .t-sub { font-size: 11px; fill: ${THEME.muted}; }
  .t-label { font-size: 12px; fill: ${THEME.secondary}; }
  .t-value { font-size: 11px; fill: ${THEME.muted}; }
  .t-subhdr { font-size: 11px; fill: ${THEME.secondary}; letter-spacing: 1px; font-weight: 600; }
  .t-stat-label { font-size: 10px; fill: ${THEME.secondary}; font-weight: 600; }
  .t-stat-value { font-size: 22px; font-weight: 700; }
  .t-card-title { font-size: 12px; fill: ${THEME.link}; font-weight: 700; }
  .t-card-detail { font-size: 11px; fill: ${THEME.secondary}; }
  .t-pill { font-size: 11px; font-weight: 600; }
  .t-bullet { font-size: 12px; fill: ${THEME.text}; }
`}
      </style>
    </defs>
  );
}

void Fragment;
