// plugins/markdown/highlighter.ts
import * as shiki from "shiki";
import type { Highlighter } from "shiki";

let highlighter: Highlighter | null = null;
let initPromise: Promise<Highlighter> | null = null;

export async function initHighlighter() {
  if (!initPromise) {
    initPromise = (async () => {
      highlighter = await shiki.createHighlighter({
        themes: [
          "vitesse-light",
          "vitesse-dark",
          "github-dark",
          "andromeeda",
          "github-light",
          "nord",
          "aurora-x",
          "ayu-light",
          "catppuccin-latte",
        ],
        langs: [
          "javascript",
          "typescript",
          "html",
          "css",
          "json",
          "markdown",
          "bash",
          "shell",
          "vue",
          "scss",
          "c#",
          "text",
          "python",
        ],
      });
      return highlighter;
    })();
  }
  return initPromise;
}

export function getHighlighterSync(): Highlighter {
  if (!highlighter) {
    throw new Error("Highlighter not initialized yet");
  }
  return highlighter;
}

// 新增：获取初始化 Promise，用于等待
export function getInitPromise() {
  return initPromise;
}
