import type { ContributionData, LanguageItem, ManifestMap, ProjectItem, RepoNode, SectionDef, TechHighlight } from "./types.js";
export declare const SECTION_KEYS: Record<string, string>;
export declare const aggregateLanguages: (repos: RepoNode[]) => LanguageItem[];
export declare const collectAllDependencies: (repos: RepoNode[], manifests: ManifestMap) => string[];
export declare const collectAllTopics: (repos: RepoNode[]) => string[];
export declare const getTopProjectsByStars: (repos: RepoNode[]) => ProjectItem[];
export declare const splitProjectsByRecency: (repos: RepoNode[], thresholdDays?: number) => {
    active: ProjectItem[];
    legacy: ProjectItem[];
};
export declare const buildSections: ({ languages, techHighlights, projects, contributionData, }: {
    languages: LanguageItem[];
    techHighlights: TechHighlight[];
    projects: ProjectItem[];
    contributionData: ContributionData;
}) => SectionDef[];
