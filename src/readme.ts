import { readFileSync } from "node:fs";

export interface SvgEmbed {
  label: string;
  path: string;
}

export interface ReadmeOptions {
  name: string;
  pronunciation?: string;
  title?: string;
  preambleContent?: string;
  svgs: SvgEmbed[];
  bio?: string;
}

export function generateReadme(options: ReadmeOptions): string {
  const parts: string[] = [];

  // Heading
  if (options.pronunciation) {
    parts.push(
      `# ${options.name} <sub><i>(${options.pronunciation})</i></sub>`,
    );
  } else {
    parts.push(`# ${options.name}`);
  }

  // Title blockquote
  if (options.title) {
    parts.push(`> ${options.title}`);
  }

  // Preamble
  if (options.preambleContent) {
    parts.push(options.preambleContent);
  }

  // SVG embeds
  for (const svg of options.svgs) {
    parts.push(`![${svg.label}](${svg.path})`);
  }

  // Bio footer
  if (options.bio) {
    parts.push(`---\n\n<sub>${options.bio}</sub>`);
  }

  // Attribution
  parts.push(
    `<sub>Created using [@urmzd/github-metrics](https://github.com/urmzd/github-metrics)</sub>`,
  );

  return `${parts.join("\n\n")}\n`;
}

export function loadPreamble(path?: string): string | undefined {
  const filePath = path || "PREAMBLE.md";
  try {
    return readFileSync(filePath, "utf-8");
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return undefined;
    }
    throw err;
  }
}
