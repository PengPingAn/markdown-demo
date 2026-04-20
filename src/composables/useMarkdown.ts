// composables/useMarkdown.ts
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { getHighlighterSync, initHighlighter } from "../plugins/markdown/highlighter";
import { setupMarkdownPlugins } from "../plugins/markdown";
import { getLanguageIconSvg } from "../plugins/markdown/languageIconMap";

// 辅助函数：解析语言和文件名
function parseLangAndFileName(info: string): { baseLang: string; fileName: string | null } {
  const trimmed = info.trim();
  if (!trimmed) return { baseLang: "text", fileName: null };
  const parts = trimmed.split(/\s+/);
  const baseLang = parts[0];
  const fileName = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return { baseLang, fileName };
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

export function useMarkdown() {
  const createMarkdownIt = () => {
    const md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
    });

    md.renderer.rules.fence = (tokens, idx, _options, _env, self) => {
      const token = tokens[idx];
      const info = token.info.trim();
      const { baseLang, fileName } = parseLangAndFileName(info);
      let code = token.content.replace(/\n$/, "");

      // 高亮代码（同步）
      let highlightedCode = "";
      try {
        const highlighter = getHighlighterSync();

        // if (baseLang && baseLang !== "text") {
        const theme = "vitesse-light"; // 可根据需要调整
        highlightedCode = highlighter.codeToHtml(code, { lang: baseLang, theme });
        highlightedCode = highlightedCode.replace(
          /<pre(\s|>)/,
          `<pre data-language="${baseLang}" data-filename="${fileName || ""}"$1`,
        );
        // } else {
        //   highlightedCode = `<pre class='shiki'><code>${escapeHtml(code)}</code></pre>`;
        // }
      } catch (e) {
        console.log(baseLang);
        console.error("Shiki highlighting failed:", e);
        highlightedCode = `<pre class='shiki'><code>${escapeHtml(code)}</code></pre>`;
      }

      if (fileName && fileName.trim() !== "") {
        // 直接获取 SVG 字符串（同步，无异步）
        const iconSvg = getLanguageIconSvg(baseLang);

        return `
          <div class="code-block-wrapper has-header">
            <div class="code-block-tab-bar">
              <div class="code-block-tab active">
                <span class="tab-icon">${iconSvg}</span>
                <span class="tab-filename">${escapeHtml(fileName)}</span>
              </div>
              <div class="tab-actions">
                <button class="code-block-copy tab-copy-btn" aria-label="复制代码">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  <span class="copy-feedback">复制</span>
                </button>
              </div>
            </div>
            <div class="code-block-container">${highlightedCode}</div>
            <div class="code-block-expand-wrapper">
              <button class="code-block-expand-btn"><span class="icon-park--to-bottom"></span> 展开</button>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="code-block-wrapper">
            <div class="code-block-container">${highlightedCode}</div>
            <div class="code-block-expand-wrapper">
              <button class="code-block-expand-btn"><span class="icon-park--to-bottom"></span> 展开</button>
            </div>
          </div>
        `;
      }
    };

    setupMarkdownPlugins(md);
    return md;
  };

  const render = async (source: string): Promise<string> => {
    await initHighlighter();
    const md = createMarkdownIt();
    const rawHtml = md.render(source);

    // DOMPurify 配置：允许 SVG 标签和属性
    const purifyConfig = {
      ADD_TAGS: [
        "svg",
        "path",
        "circle",
        "polyline",
        "line",
        "rect",
        "g",
        "defs",
        "iframe",
        "blockquote",
        "div",
      ],
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
        "data-language",
        "data-filename",
        "viewBox",
        "fill",
        "d",
        "xmlns",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
      ],
    };
    return DOMPurify.sanitize(rawHtml, purifyConfig);
  };

  return { render };
}
