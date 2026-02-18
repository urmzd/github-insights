import type { TemplateFunction, TemplateName, UserProfile } from "./types.js";
export declare function extractFirstName(fullName: string): string;
/** Escape special characters for shields.io badge labels (`-` → `--`, `_` → `__`). */
export declare function shieldsBadgeLabel(text: string): string;
export declare function buildSocialBadges(profile: UserProfile): string;
export declare function getTemplate(name: TemplateName): TemplateFunction;
