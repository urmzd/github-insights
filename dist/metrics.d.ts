import type { RepoNode, ManifestMap, DomainMap, LanguageItem, TechItem, ComplexityItem, DomainItem, ContributionData, ContributionsByRepo, SectionDef } from "./types.js";
export declare const aggregateLanguages: (repos: RepoNode[]) => LanguageItem[];
export declare const classifyDependencies: (repos: RepoNode[], manifests: ManifestMap) => {
    frameworks: TechItem[];
    dbInfra: TechItem[];
    tools: TechItem[];
};
export declare const computeComplexityScores: (repos: RepoNode[]) => ComplexityItem[];
export declare const subClassify: (frameworks: TechItem[], dbInfra: TechItem[]) => {
    webFrameworks: TechItem[];
    mlAi: TechItem[];
    databases: TechItem[];
    cloudInfra: TechItem[];
};
export declare const aggregateDomains: (domainMap: DomainMap) => DomainItem[];
export declare const computeRecentlyActive: (contributionsByRepo: ContributionsByRepo[], repos: RepoNode[]) => Set<string>;
export declare const markRecentlyActive: (itemLists: {
    trending?: boolean;
    name: string;
}[][], recentlyActiveSet: Set<string>) => void;
export declare const buildSections: ({ languages, webFrameworks, mlAi, databases, cloudInfra, complexity, domains, domainMap, contributionData, }: {
    languages: LanguageItem[];
    webFrameworks: TechItem[];
    mlAi: TechItem[];
    databases: TechItem[];
    cloudInfra: TechItem[];
    complexity: ComplexityItem[];
    domains: DomainItem[];
    domainMap: DomainMap;
    contributionData: ContributionData;
}) => SectionDef[];
