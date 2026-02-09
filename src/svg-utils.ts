export const escapeXml = (str: string | null | undefined): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export const truncate = (
  str: string | null | undefined,
  max: number,
): string => {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
};

export const wrapText = (text: string, maxChars: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export const FIRE_ICON = (x: number, y: number): string =>
  `<g transform="translate(${x}, ${y}) scale(0.7)"><path d="M8 16c3.314 0 6-2 6-5.5 0-1.44-.714-2.89-1.166-3.778C12.024 5.143 10.9 3.5 8 0 5.1 3.5 3.976 5.143 3.166 6.722 2.714 7.61 2 9.06 2 10.5 2 14 4.686 16 8 16m0-1c-2.21 0-4-1.343-4-3.5 0-.93.258-1.695.672-2.528C5.2 7.865 6.1 6.5 8 4c1.9 2.5 2.8 3.865 3.328 4.972.414.833.672 1.598.672 2.528 0 2.157-1.79 3.5-4 3.5" fill="#f0883e"/></g>`;
