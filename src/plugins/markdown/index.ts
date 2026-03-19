import type MarkdownIt from "markdown-it";
import { markdownConfig } from "./markdown-it-config";
import { useCodeInclude } from "./code-include";
import { videoPlugin } from "./mdVideoPlugin";

export function setupMarkdownPlugins(md: MarkdownIt) {
  md.use(markdownConfig);
  md.use(videoPlugin);
  useCodeInclude(md);
}
