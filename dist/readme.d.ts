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
export declare function generateReadme(options: ReadmeOptions): string;
export declare function loadPreamble(path?: string): string | undefined;
