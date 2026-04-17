import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outDir = resolve("dist/lib");
const target = resolve(outDir, "index.d.ts");

const content = `import type { DefineComponent } from "vue";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface MarkdownRendererProps {
  source: string;
  showToggle?: boolean;
}

export interface MarkdownRendererEmits {
  (event: "toc-updated", toc: TocItem[]): void;
}

export interface UseMarkdownResult {
  render(source: string): Promise<string>;
}

export declare const MarkdownRenderer: DefineComponent<MarkdownRendererProps, {}, {}, {}, {}, {}, {}, MarkdownRendererEmits>;
export default MarkdownRenderer;

export declare function useMarkdown(): UseMarkdownResult;
export declare function setupMarkdownPlugins(md: any): void;
export declare const markdownConfig: (md: any, options?: Record<string, unknown>) => void;
export declare function videoPlugin(md: any): void;
export declare function initHighlighter(): Promise<any>;
export declare function getHighlighterSync(): any;
export declare function getInitPromise(): Promise<any> | null;
`;

await mkdir(outDir, { recursive: true });
await writeFile(target, content, "utf8");

console.log(`Wrote ${target}`);
