import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { getInitPromise, getHighlighterSync } from "@/plugins/markdown/highlighter";
import { setupMarkdownPlugins } from "@/plugins/markdown";

export function useMarkdown() {
  const createMarkdownIt = () => {
    const md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
      highlight: (code, lang) => {
        try {
          const highlighter = getHighlighterSync();
          if (lang && highlighter.getLoadedLanguages().includes(lang)) {
            const highlightedCode = highlighter.codeToHtml(code, {
              lang,
              theme: "vitesse-light",
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
              code,
            )}</code></pre>`;
          }
        } catch (e) {
          console.error("Shiki highlighting failed:", e);
          return `<pre data-language="${lang || "text"}" class="shiki"><code class="language-${lang || "text"}">${md.utils.escapeHtml(
            code,
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

    // 基础净化配置
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
