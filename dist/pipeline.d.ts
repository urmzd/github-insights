import type { TemplateName } from "./types.js";
export type PipelinePhase = "fetch-repos" | "fetch-profile" | "classify" | "transform" | "render-svg" | "write-files" | "generate-readme" | "commit-push";
export interface PipelineCallbacks {
    onPhaseStart(phase: PipelinePhase, label: string): void;
    onPhaseComplete(phase: PipelinePhase, summary: string): void;
    onProgress(message: string): void;
    onError(error: Error): void;
}
export interface PipelineConfig {
    token: string;
    username: string;
    outputDir: string;
    commitPush: boolean;
    commitMessage: string;
    commitName: string;
    commitEmail: string;
    configPath?: string;
    readmePath: string;
    templateName: TemplateName;
    requestedSections: string[];
}
export declare function runPipeline(config: PipelineConfig, cb: PipelineCallbacks): Promise<void>;
