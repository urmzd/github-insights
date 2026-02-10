import type { RepoNode, ManifestMap, DomainMap, LanguageItem, TechHighlight, ComplexityItem, DomainItem, ContributionData, ContributionsByRepo, SectionDef } from "./types.js";
export declare const aggregateLanguages: (repos: RepoNode[]) => LanguageItem[];
export declare const collectAllDependencies: (repos: RepoNode[], manifests: ManifestMap) => string[];
export declare const collectAllTopics: (repos: RepoNode[]) => string[];
export declare const computeComplexityScores: (repos: RepoNode[]) => ComplexityItem[];
export declare const aggregateDomains: (domainMap: DomainMap) => DomainItem[];
export declare const computeRecentlyActive: (contributionsByRepo: ContributionsByRepo[], repos: RepoNode[]) => Set<string>;
export declare const markRecentlyActive: (itemLists: {
    trending?: boolean;
    name: string;
}[][], recentlyActiveSet: Set<string>) => void;
export declare const buildSections: ({ languages, techHighlights, complexity, domains, domainMap, contributionData, }: {
    languages: LanguageItem[];
    techHighlights: TechHighlight[];
    complexity: ComplexityItem[];
    domains: DomainItem[];
    domainMap: DomainMap;
    contributionData: ContributionData;
}) => SectionDef[];
