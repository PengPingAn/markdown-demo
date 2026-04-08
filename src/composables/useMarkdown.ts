import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { getInitPromise, getHighlighterSync } from "@/plugins/markdown/highlighter";
import { setupMarkdownPlugins } from "@/plugins/markdown";

const languageThemeMap: Record<string, string> = {
  ts: "vitesse-light", // TypeScript 使用浅色主题
  js: "vitesse-light", // JavaScript 也用浅色
  py: "github-light", // Python 用深色主题
  python: "github-light",
  html: "vitesse-light",
  css: "vitesse-light",
  // 其他语言...
};

export function useMarkdown() {
  const createMarkdownIt = () => {
    const md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
      highlight: (code: any, lang: any) => {
        try {
          // 修复空白行问题：去除末尾换行符
          const cleanCode = code.replace(/\n$/, "");
          const highlighter = getHighlighterSync();

          if (lang) {
            const theme = languageThemeMap[lang] || "vitesse-light";

            const highlightedCode = highlighter.codeToHtml(cleanCode, {
              lang,
              theme,
            });
            // 在 <pre 标签中插入 data-language 属性
            const preWithLang = highlightedCode.replace(
              /<pre(\s|>)/,
              `<pre data-language="${lang}"$1`,
            );
            return `
              <div class="code-block-wrapper">
                <div class="code-block-container">
                  ${preWithLang}
                </div>
                <div class="code-block-expand-wrapper">
                  <button class="code-block-expand-btn"><span class="icon-park--to-bottom"></span> 展开</button>
                </div>
              </div>
            `;
          } else {
            return `<pre data-language="${lang || "text"}" class="shiki"><code class="language-${lang || "text"}">${md.utils.escapeHtml(
              cleanCode,
            )}</code></pre>`;
          }
        } catch (e) {
          console.error("Shiki highlighting failed:", e);
          const cleanCode = code.replace(/\n$/, "");
          return `<pre data-language="${lang || "text"}" class="shiki"><code class="language-${lang || "text"}">${md.utils.escapeHtml(
            cleanCode,
          )}</code></pre>`;
        }
      },
    });

    setupMarkdownPlugins(md);
    return md;
  };

  const render = async (source: string): Promise<string> => {
    await getInitPromise();
    const md = createMarkdownIt();
    const rawHtml = md.render(source);

    const purifyConfig = {
      ADD_TAGS: ["iframe", "blockquote", "script", "div"],
      ADD_ATTR: [
        "style",
        "class",
        "src",
        "allowfullscreen",
        "frameborder",
        "allow",
        "async",
        "charset",
        "poster",
        "referrerpolicy",
        "title",
        "data-tweet-id",
        "data-tweet-url",
        "target",
        "rel",
      ],
    };

    return DOMPurify.sanitize(rawHtml, purifyConfig);
  };

  return {
    render,
  };
}
