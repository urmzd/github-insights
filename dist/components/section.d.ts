import type { RenderResult, BarItem } from "../types.js";
export declare function renderSectionHeader(title: string, subtitle: string | undefined, y: number): RenderResult;
export declare function renderSubHeader(text: string, y: number): RenderResult;
export declare function renderDivider(y: number): RenderResult;
export declare function renderSection(title: string, subtitle: string, itemsOrRenderBody: ((y: number) => RenderResult) | BarItem[], options?: Record<string, unknown>): RenderResult;
