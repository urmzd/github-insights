import type { PackageParser } from "./types.js";
export declare const NodePackageParser: PackageParser;
export declare const CargoParser: PackageParser;
export declare const GoModParser: PackageParser;
export declare const PyprojectParser: PackageParser;
export declare const RequirementsTxtParser: PackageParser;
export declare const PARSERS: PackageParser[];
export declare const parseManifest: (filename: string, text: string) => string[];
