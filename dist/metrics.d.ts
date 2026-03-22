import type { ConstellationNode, ContributionData, ContributionRhythm, LanguageItem, ManifestMap, MonthlyLanguageBucket, ProjectItem, RepoClassificationInput, RepoClassificationOutput, RepoNode, SectionDef } from "./types.js";
export declare const SECTION_KEYS: Record<string, string>;
export declare const aggregateLanguages: (repos: RepoNode[]) => LanguageItem[];
export declare const collectAllDependencies: (repos: RepoNode[], manifests: ManifestMap) => string[];
export declare const collectAllTopics: (repos: RepoNode[]) => string[];
export declare const complexityScore: (repo: RepoNode) => number;
export declare const getTopProjectsByStars: (repos: RepoNode[]) => ProjectItem[];
export declare const getTopProjectsByComplexity: (repos: RepoNode[]) => ProjectItem[];
export declare const buildClassificationInputs: (repos: RepoNode[], contributionData: ContributionData) => RepoClassificationInput[];
export declare const splitProjectsByRecency: (repos: RepoNode[], contributionData: ContributionData, aiClassifications?: RepoClassificationOutput[]) => {
    active: ProjectItem[];
    maintained: ProjectItem[];
    inactive: ProjectItem[];
    archived: ProjectItem[];
};
export declare const computeLanguageVelocity: (contributionData: ContributionData, repos: RepoNode[]) => MonthlyLanguageBucket[];
export declare const computeContributionRhythm: (contributionData: ContributionData) => ContributionRhythm;
export declare const computeConstellationLayout: (projects: ProjectItem[], repos: RepoNode[]) => ConstellationNode[];
export declare const buildSections: ({ velocity, rhythm, constellation, projects, contributionData, }: {
    velocity: MonthlyLanguageBucket[];
    rhythm: ContributionRhythm;
    constellation: ConstellationNode[];
    projects: ProjectItem[];
    contributionData: ContributionData;
}) => SectionDef[];
