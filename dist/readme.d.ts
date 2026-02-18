import type { SvgEmbed } from "./types.js";
export type { SvgEmbed };
export interface ReadmeOptions {
    name: string;
    pronunciation?: string;
    title?: string;
    preambleContent?: string;
    svgs: SvgEmbed[];
    bio?: string;
}
export declare function generateReadme(options: ReadmeOptions): string;
export declare function loadPreamble(path?: string): string | undefined;
