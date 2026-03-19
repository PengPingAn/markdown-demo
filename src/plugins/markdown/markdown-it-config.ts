// utils/markdown-it-config.js
import mingcuteIcon from "@/assets/svg/mingcute.svg";
import errorIcon from "@/assets/svg/error.svg";
import warningIcon from "@/assets/svg/warning.svg";
import svgLeft from "@/assets/svg/carousel-left.svg?raw";
import svgRight from "@/assets/svg/carousel-right.svg?raw";
import svgAlWarning from "@/assets/svg/alerts-warning.svg?raw";
import svgAlError from "@/assets/svg/alerts-error.svg?raw";
import svgAlNote from "@/assets/svg/alerts-note.svg?raw";
import svgDownLine from "@/assets/svg/down-line.svg?raw";
import svgFlip from "@/assets/svg/flip.svg?raw";
import React from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import { useEditorThemeStore } from "@/stores/pinia";
// 用于记录已挂载实例，避免重复渲染
const excalidrawInstances: Record<string, boolean> = {};

// ----------------------------
// 自定义语法插件
// ----------------------------
export const markdownConfig = (md) => {
  // 安全边界计数器
  const MAX_ITERATIONS = 1000;
  const TOKEN_PREFIX = "my_admonition_";
  const ALLOWED_TYPES = ["warning", "error"];

  md.block.ruler.before("fence", "custom_code_block", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max).trim();

    if (!line.startsWith(":::code")) return false;
    if (silent) return true;

    const lang = line.split(" ")[1] || "text";

    let nextLine = startLine + 1;
    while (nextLine < endLine) {
      const lineText = state.src
        .slice(state.bMarks[nextLine] + state.tShift[nextLine], state.eMarks[nextLine])
        .trim();
      if (lineText === ":::") break;
      nextLine++;
    }

    const codeLines = [];
    for (let i = startLine + 1; i < nextLine; i++) {
      const lineStart = state.bMarks[i] + state.tShift[i];
      const lineEnd = state.eMarks[i];
      codeLines.push(state.src.slice(lineStart, lineEnd));
    }
    const codeStr = codeLines.join("\n");

    console.log("Markdown-it plugin captured code:", codeStr); // 🔥 打印这里

    const token = state.push("html_block", "", 0);
    token.content = `
<div class="custom-code-wrapper" data-lang="${lang}" data-code="${encodeURIComponent(codeStr)}">
  <div class="custom-code-content" style="max-height:400px; overflow:auto;"></div>
  <button class="custom-code-toggle">展开全部</button>
</div>
`;

    state.line = nextLine + 1;
    return true;
  });

  // 这里添加 excalidraw 块语法
  md.block.ruler.before("fence", "excalidraw", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max).trim();

    if (!line.startsWith(":::excalidraw")) return false;
    if (silent) return true;

    let nextLine = startLine + 1;
    while (nextLine < endLine) {
      const lineText = state.src
        .slice(state.bMarks[nextLine] + state.tShift[nextLine], state.eMarks[nextLine])
        .trim();
      if (lineText === ":::") break;
      nextLine++;
    }

    // 生成唯一 ID
    const excalidrawId = "excalidraw-" + Math.random().toString(36).slice(2);

    // 在 Markdown HTML token 里输出容器
    const token = state.push("html_block", "", 0);
    token.content = `<div class="md-excalidraw" id="${excalidrawId}" style="height:510px;"></div>`;

    // 等 DOM 渲染完成后挂载 React
    setTimeout(() => {
      const el = document.getElementById(excalidrawId);
      if (el && !excalidrawInstances[excalidrawId]) {
        const root = createRoot(el);

        // 获取 markdown 中的内容
        const contentLines = [];
        for (let i = startLine + 1; i < nextLine; i++) {
          const lineStart = state.bMarks[i] + state.tShift[i];
          const lineEnd = state.eMarks[i];
          contentLines.push(state.src.slice(lineStart, lineEnd));
        }
        const contentStr = contentLines.join("\n");

        let excalidrawData = null;
        try {
          excalidrawData = JSON.parse(contentStr);
        } catch (e) {
          console.error("Excalidraw JSON parse error:", e);
        }

        if (excalidrawData) {
          const containerWidth = el.clientWidth;
          const containerHeight = el.clientHeight;
          const originalWidth = excalidrawData.originalWidth || 1200;
          const originalHeight = excalidrawData.originalHeight || 800;

          // 缩放比例
          const scaleX = containerWidth / originalWidth;
          const scaleY = containerHeight / originalHeight;
          const scale = Math.min(scaleX, scaleY);

          // 居中偏移
          const offsetX = (containerWidth - originalWidth * scale) / 2;
          const offsetY = (containerHeight - originalHeight * scale) / 2;

          const smallData = {
            ...excalidrawData,
            appState: {
              ...excalidrawData.appState,
              zoom: scale,
              offsetLeft: offsetX,
              offsetTop: offsetY,
            },
          };

          const userStore = useEditorThemeStore();
          root.render(
            React.createElement(Excalidraw, {
              initialData: smallData,
              readOnly: true,
              zenModeEnabled: true,
              viewModeEnabled: true,
              langCode: "zh-CN",
              theme: userStore.$state.editorTheme,
            }),
          );
          excalidrawInstances[excalidrawId] = true;
        }
      }
    }, 0);

    state.line = nextLine + 1;
    return true;
  });

  // 1. 注册块级规则
  md.block.ruler.before("fence", "admonition", (state, startLine) => {
    if (startLine >= state.lineMax) return false;

    const startPos = state.bMarks[startLine];
    const maxPos = state.eMarks[startLine];
    const lineText = state.src.slice(startPos, maxPos);

    // 匹配 ::: 类型 [标题]
    const openMatch = lineText.match(/^:::\s+(\w+)(?:\s+(.*))?$/);
    // console.log('----',lineText)
    if (!openMatch) return false;

    const [_, type, title] = openMatch;
    if (!ALLOWED_TYPES.includes(type)) return false; // 只允许 warning 和 error
    let endLine = startLine + 1;
    let iteration = 0;
    let foundEnd = false;

    // 查找结束标记 :::
    while (endLine < state.lineMax && iteration < MAX_ITERATIONS) {
      iteration++;
      const endPos = state.bMarks[endLine];
      const endMaxPos = state.eMarks[endLine];
      const endLineText = state.src.slice(endPos, endMaxPos);

      // 允许缩进和空格
      if (endLineText.trim() === ":::") {
        foundEnd = true;
        break;
      }

      endLine++;
    }

    if (!foundEnd) return false;

    // 2. 创建 token - 关键修复：确保 token 类型正确
    const tokenOpen = state.push(`${TOKEN_PREFIX}open`, "div", 1);
    tokenOpen.attrSet("class", `${type} m-block`);

    // 标题 token
    if (title) {
      const tokenTitle = state.push(`${TOKEN_PREFIX}title`, "", 0);
      tokenTitle.content = title.trim();
    }

    // 内容解析
    state.line = startLine + 1;
    state.md.block.tokenize(state, startLine + 1, endLine);

    // 关闭 token
    state.push(`${TOKEN_PREFIX}close`, "div", -1);

    state.line = endLine + 1;
    return true;
  });

  //列表展开
  md.block.ruler.before("fence", "collapse", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max);

    if (!line.startsWith(":::collapse")) return false;

    const titleMatch = line.match(/title=(.*)/);
    const title = titleMatch ? titleMatch[1].trim() : "展开内容";

    let nextLine = startLine + 1;
    let content = "";

    while (nextLine < endLine) {
      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      const maxPos = state.eMarks[nextLine];
      const lineText = state.src.slice(pos, maxPos);

      if (lineText.startsWith(":::")) break;

      content += lineText + "\n";
      nextLine++;
    }

    if (silent) return true;

    state.line = nextLine + 1;

    const renderedContent = md.render(content);

    const token = state.push("html_block", "", 0);
    token.content = `
          <div class="md-collapse">
            <div class="md-collapse-title"><div class='md-collapse-icon'>${svgDownLine}</div>${title}</div>
            <div class="md-collapse-body">
              <div class="md-collapse-inner open">${renderedContent}</div>
            </div>
          </div>
        `;

    return true;
  });

  //文字翻转
  md.block.ruler.before("fence", "textflip", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max);

    if (!line.startsWith(":::textflip")) return false;

    const titleMatch = line.match(/title=(.*)/);
    const title = titleMatch ? titleMatch[1].trim() : "展开内容";

    let nextLine = startLine + 1;
    let content = "";

    while (nextLine < endLine) {
      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      const maxPos = state.eMarks[nextLine];
      const lineText = state.src.slice(pos, maxPos);

      if (lineText.startsWith(":::")) break;

      content += lineText + "\n";
      nextLine++;
    }

    if (silent) return true;
    state.line = nextLine + 1;

    const renderedContent = md.renderInline(content.trim());

    const token = state.push("html_block", "", 0);
    token.content = `
      <div class="md-flip-card">
        <div class="md-flip-card-inner">
          <div class="md-flip-card-front">${title}<div style="transform: rotateX(180deg);">${svgFlip}</div></div>
          <div class="md-flip-card-back">${renderedContent}<div>${svgFlip}</div></div>

        </div>
      </div>
    `;
    return true;
  });

  //视频插件
  // md.block.ruler.before("fence", "video", (state, startLine, endLine, silent) => {
  //   const start = state.bMarks[startLine] + state.tShift[startLine];
  //   const max = state.eMarks[startLine];
  //   const line = state.src.slice(start, max).trim();

  //   if (!line.startsWith(":::video")) return false;

  //   // 解析参数
  //   const attrRegex = /(\w+)=([^\s]+)/g;
  //   const attrs = {};
  //   let match;
  //   while ((match = attrRegex.exec(line)) !== null) {
  //     attrs[match[1]] = match[2];
  //   }

  //   if (!attrs.src) return false;

  //   let nextLine = startLine + 1;
  //   const lines = [];
  //   while (nextLine < endLine) {
  //     const pos = state.bMarks[nextLine] + state.tShift[nextLine];
  //     const maxPos = state.eMarks[nextLine];
  //     const text = state.src.slice(pos, maxPos).trim();

  //     if (text === ":::") break;

  //     lines.push(text);
  //     nextLine++;
  //   }

  //   if (silent) return true;

  //   state.line = nextLine + 1;

  //   const description = lines.join("\n").trim();

  //   const isExternal =
  //     /^https?:\/\//.test(attrs.src) && /(youtube\.com|bilibili\.com|vimeo\.com)/.test(attrs.src);

  //   const player = isExternal
  //     ? `<iframe
  //              src="${attrs.src}"
  //              class="md-video-iframe"
  //              frameborder="0"
  //              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  //              allowfullscreen
  //            ></iframe>`
  //     : `<video
  //              src="${attrs.src}"
  //              ${attrs.poster ? `poster="${attrs.poster}"` : ""}
  //              controls
  //              preload="metadata"
  //              class="md-video"
  //            ></video>`;

  //   const html = `
  //         <div class="md-video-wrapper">
  //           ${player}
  //           ${
  //             description
  //               ? `<div class="md-video-description">—— ${md.utils.escapeHtml(
  //                   description,
  //                 )} ——</div>`
  //               : ""
  //           }
  //         </div>
  //       `;

  //   const token = state.push("html_block", "", 0);
  //   token.content = html;

  //   return true;
  // });

  //电影/电视链接卡片
  md.block.ruler.before("fence", "card", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max).trim();

    if (!line.startsWith(":::card")) return false;

    const attrRegex = /(\w+)=("[^"]+"|'[^']+'|[^\s]+)/g;
    const attrs: Record<string, string> = {};
    let match;
    while ((match = attrRegex.exec(line)) !== null) {
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      attrs[match[1]] = value;
    }

    if (!attrs.url) return false;

    let nextLine = startLine + 1;
    const lines: string[] = [];

    while (nextLine < endLine) {
      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      const maxPos = state.eMarks[nextLine];
      const text = state.src.slice(pos, maxPos).trim();
      if (text === ":::") break;
      lines.push(text);
      nextLine++;
    }

    if (silent) return true;

    state.line = nextLine + 1;

    const url = md.utils.escapeHtml(attrs.url);
    const title = md.utils.escapeHtml(attrs.title || "");
    const image = md.utils.escapeHtml(attrs.image || "");
    const desc = md.utils.escapeHtml(lines.join("\n").trim());

    // 读取评分，限制1~10
    let ratingNum = 0;
    if (attrs.rating) {
      const r = Number(attrs.rating);
      if (!isNaN(r) && r >= 1 && r <= 10) {
        ratingNum = r;
      }
    }

    const html = `
          <a class="m-card" href="${url}" target="_blank" rel="noopener noreferrer">
            ${
              image
                ? `<div class="m-card-cover" style="background-image: url('${image}')"></div>`
                : ""
            }
            <div class="m-card-content">
              ${
                title
                  ? `<div class="m-card-title-row"><div class="m-card-title">${title}</div></div>`
                  : ""
              }
              ${desc ? `<div class="m-card-desc">${desc}</div>` : ""}
            </div>
            <div class="m-card-overlay"></div>
          </a>
        `;

    const token = state.push("html_block", "", 0);
    token.content = html;

    return true;
  });

  //设置字体大小 单位px
  md.inline.ruler.before("emphasis", "font_size", (state, silent) => {
    const start = state.pos;
    const src = state.src.slice(start);

    const prefixMatch = src.match(/^@size\[(\d+px)\]\{/);
    if (!prefixMatch) return false;

    const fontSize = prefixMatch[1];
    let i = prefixMatch[0].length;
    let braceLevel = 1;
    let content = "";
    while (i < src.length) {
      const char = src[i];
      if (char === "{") braceLevel++;
      else if (char === "}") braceLevel--;
      if (braceLevel === 0) break;
      content += char;
      i++;
    }

    if (braceLevel !== 0) return false; // 没有正确闭合

    if (silent) return true;

    // 开始生成 tokens
    const tokenOpen = state.push("font_size_open", "span", 1);
    tokenOpen.attrs = [["style", `font-size:${fontSize}`]];

    const innerState = new state.md.inline.State(content, state.md, state.env, []);
    innerState.md.inline.tokenize(innerState);
    for (const t of innerState.tokens) {
      state.tokens.push(t);
    }

    const tokenClose = state.push("font_size_close", "span", -1);

    state.pos += prefixMatch[0].length + content.length + 1; // +1 for final }

    return true;
  });

  //NOTE扩展
  md.block.ruler.before("blockquote", "admonition", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max).trim();

    const match = line.match(/^> \[!(\w+)]\s*$/);
    if (!match) return false;

    const type = match[1].toLowerCase();
    const titleMap: Record<string, string> = {
      note: "Note",
      warning: "Warning",
      danger: "Danger",
    };
    const iconMap: Record<string, string> = {
      note: svgAlNote,
      warning: svgAlWarning,
      danger: svgAlError,
    };

    let nextLine = startLine + 1;
    const contentLines: string[] = [];

    while (nextLine < endLine) {
      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      const maxPos = state.eMarks[nextLine];
      const text = state.src.slice(pos, maxPos).trim();
      if (!text.startsWith(">")) break;
      contentLines.push(text.replace(/^>\s?/, ""));
      nextLine++;
    }

    if (silent) return true;
    state.line = nextLine;

    const title = titleMap[type] || "Note";
    const icon = iconMap[type] || "ℹ️";
    const body = md.utils.escapeHtml(contentLines.join("\n"));

    const html = `
      <div class="m-admonition alerts-${type}">
        <div class="m-admonition-title">
          <span class="m-admonition-icon">${icon}</span>
          <span class="m-admonition-label">${title}</span>
        </div>
        <div class="m-admonition-body">${md.renderInline(body)}</div>
      </div>
      `;

    const token = state.push("html_block", "", 0);
    token.content = html;

    return true;
  });

  // [__文本] magicui下划线扩展语法
  md.inline.ruler.before("emphasis", "magic_underline", (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5b /* [ */) return false;
    if (state.src.slice(start + 1, start + 3) !== "__") return false;

    const matchPos = state.src.indexOf("]", start + 3);
    if (matchPos === -1) return false;

    if (!silent) {
      const token = state.push("magic_underline", "", 0);
      token.content = state.src.slice(start + 3, matchPos);
      token.markup = "[__]";
    }

    state.pos = matchPos + 1;
    return true;
  });

  // —— 2. magicui下划线渲染规则 —— //
  md.renderer.rules["magic_underline"] = (tokens, idx) => {
    const token = tokens[idx];
    const text = md.utils.escapeHtml(token.content);

    // 改成 highlighter 样式，并加 rough-notation 属性
    return `<span class="highlighter" data-action="underline" data-color="#FF9800">${text}</span>`;
  };

  // [==文本] magicui高亮扩展语法
  md.inline.ruler.before("emphasis", "magic_highlight", (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5b /* [ */) return false;
    if (state.src.slice(start + 1, start + 3) !== "==") return false;

    const matchPos = state.src.indexOf("]", start + 3);
    if (matchPos === -1) return false;

    if (!silent) {
      const token = state.push("magic_highlight", "", 0);
      token.content = state.src.slice(start + 3, matchPos);
      token.markup = "[==]";
    }

    state.pos = matchPos + 1;
    return true;
  });

  // magicui高亮文本渲染成 highlighter span
  md.renderer.rules["magic_highlight"] = (tokens, idx) => {
    const token = tokens[idx];
    const text = md.utils.escapeHtml(token.content);
    return `<span class="highlighter" data-action="highlight" data-color="#87CEFA">${text}</span>`;
  };

  //有背景颜色的引用
  md.block.ruler.before("fence", "quotation", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const marker = state.src.slice(start, max).trim();

    // ✅ 匹配 ::: quotation color[#xxxxxx]（color 参数可选）
    const match = marker.match(/^::: *quotation(?: +color\[(#[0-9a-fA-F]{3,6})\])?/);
    if (!match) return false;

    const bgColor = match[1]; // 提取 color 参数（可能是 undefined）

    let nextLine = startLine + 1;
    const contentLines: string[] = [];

    while (nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineEnd = state.eMarks[nextLine];
      const lineText = state.src.slice(lineStart, lineEnd).trim();

      // 结束条件（遇到 :::）
      if (lineText === ":::" || lineText.startsWith("::: ")) break;

      contentLines.push(lineText);
      nextLine++;
    }

    if (silent) return true;
    state.line = nextLine + 1;

    const body = md.utils.escapeHtml(contentLines.join("\n"));

    const html = `
    <div class="custom-quotation"${bgColor ? ` style="background-color: ${bgColor};"` : ""}>
      <div class="quotation-body">${md.renderInline(body)}</div>
    </div>
  `;

    const token = state.push("html_block", "", 0);
    token.content = html;

    return true;
  });

  //语法高亮
  md.inline.ruler.before("text", "highlight", (state) => {
    const start = state.pos;
    const match = state.src.slice(start).match(/^==([^=]+?)==/);
    if (!match) return false;

    const token = state.push("highlight", "", 0);
    token.content = match[1];
    token.attrs = [["class", "mark"]];

    state.pos += match[0].length;
    return true;
  });

  //悬浮链接
  md.inline.ruler.before("link", "polaris_link", (state) => {
    const start = state.pos;
    const srcSlice = state.src.slice(start);

    // 优化后的正则表达式
    const match = srcSlice.match(/@Pingan\[([^\]]+)\]\(([^)]+)\)/);
    // console.log('---', srcSlice)
    if (!match) return false;

    // 提取文本和链接
    const text = match[1];
    const url = match[2];

    // 创建 Token
    const token = state.push("polaris_link", "", 0);
    token.attrs = [
      ["href", url],
      ["class", "hover-link"],
      ["target", "_blank"],
    ];
    token.content = text;
    token.meta = {
      icon: mingcuteIcon,
      url: url,
    };
    token.hidden = true;
    // 更新解析位置
    state.pos += match[0].length;
    return true;
  });

  //卡片链接
  md.inline.ruler.before("link", "link_card", (state) => {
    const start = state.pos;
    const srcSlice = state.src.slice(start);

    // 优化正则：匹配 @linkCard[标题][头像](链接)
    const match = srcSlice.match(/@linkCard\s*\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\(([^)]+)\)/);
    if (!match) return false;

    const title = match[1]; // 提取标题
    const avatar = match[2]; // 提取头像URL
    const label = match[3]; // 提取描述
    const url = match[4]; // 提取目标链接

    // 创建自定义 token
    const token = state.push("link_card", "", 0);
    token.meta = { title, avatar, label, url }; // 存储元数据
    token.hidden = true; // 隐藏原始 token

    // 更新解析位置
    state.pos += match[0].length;
    return true;
  });

  // 隐藏语法 将规则提升到最高优先级（在 text 规则之前）
  md.core.ruler.push("tooltip_parser", (state) => {
    const Token = state.Token;

    state.tokens.forEach((blockToken) => {
      if (blockToken.type !== "inline") return;

      const children = <any>[];
      blockToken.children.forEach((token) => {
        if (token.type !== "text") {
          children.push(token);
          return;
        }

        const text = token.content;
        const regex = /\|\|([^|]+?)\|\|/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            const t = new Token("text", "", 0);
            t.content = text.slice(lastIndex, match.index);
            children.push(t);
          }

          const tooltipToken = new Token("tooltip", "", 0);
          tooltipToken.content = match[1];
          tooltipToken.attrs = [
            ["title", "你知道得太多了"],
            ["class", "p-span-tag"],
          ];
          children.push(tooltipToken);

          lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
          const t = new Token("text", "", 0);
          t.content = text.slice(lastIndex);
          children.push(t);
        }
      });

      blockToken.children = children;
    });
  });

  //轮播图
  md.block.ruler.before("fence", "carousel", (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    const maxPos = state.eMarks[startLine];

    if (!state.src.slice(startPos, maxPos).trim().startsWith(":::carousel")) return false;
    if (silent) return true;

    let nextLine = startLine + 1;
    const content: string[] = [];

    while (nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineEnd = state.eMarks[nextLine];
      const lineText = state.src.slice(lineStart, lineEnd).trim();

      if (lineText === ":::") break;

      content.push(lineText);
      nextLine++;
    }

    // ✅ 在这里记录图片数量
    state.env.carouselImageCount = content.length;

    const tokenOpen = state.push("carousel_open", "div", 1);
    tokenOpen.attrs = [["class", "container"]];
    tokenOpen.map = [startLine, nextLine];

    content.forEach((src) => {
      const itemOpen = state.push("container_item_open", "div", 1);
      itemOpen.attrs = [["class", "container-item"]];

      const imgToken = state.push("html_inline", "", 0);
      imgToken.content = `<img src="${src}" alt="" />`;

      const itemClose = state.push("container_item_close", "div", -1);
    });

    const tokenClose = state.push("carousel_close", "div", -1);

    state.line = nextLine + 1;
    return true;
  });

  // 隐藏渲染
  md.renderer.rules.tooltip = (tokens, idx) => {
    const token = tokens[idx];
    // console.log('渲染 tooltip:', token);
    return `<span title="${token.attrs[0][1]}" class="${token.attrs[1][1]}">${token.content}</span>`;
  };

  //高亮渲染
  md.renderer.rules.highlight = (tokens, idx) => {
    const token = tokens[idx];
    return `<mark class="${token.attrs[0][1]}">
                  <span class="mark-span">${token.content}</span>
                </mark>
                `;
  };

  //链接渲染
  md.renderer.rules.polaris_link = (tokens, idx) => {
    const token = tokens[idx];
    return `<span style="display: inline-block;text-indent: 0em;">
                    <a href="${token.attrs[0][1]}" target="_blank" class='hover-link' style='text-decoration: none;display: flex;'>
                        ${token.content}
                        <img src="${token.meta.icon}" style='width:17px;vertical-align: sub;pointer-events: none;background: transparent;' />
                    </a>
                    <span class='p-a-span slide-top'>${token.meta.url}</span>
                </span>`;
  };

  //警告/错误渲染
  md.renderer.rules[`${TOKEN_PREFIX}open`] = function (tokens, idx) {
    const token = tokens[idx];
    const type = token.attrGet("class").split(" ")[0];
    const icon = type.includes("error") ? errorIcon : warningIcon;
    // console.log('强制触发规则!--', token.attrGet('class').split(' '));
    return `<div class="${token.attrGet("class")}">
                    <iframe src="${icon}"></iframe>
                    <div class="admonition-content">`;
  };
  //警告/错误结尾渲染
  md.renderer.rules[`${TOKEN_PREFIX}close`] = () => "</div></div>";

  // link card渲染
  md.renderer.rules.link_card = (tokens, idx) => {
    const { title, avatar, label, url } = tokens[idx].meta;

    // 安全转义防止 XSS
    const escapeHtml = (str) =>
      String(str).replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[m],
      );

    const safeTitle = escapeHtml(title);
    const safeAvatar = escapeHtml(avatar);
    const safeLabel = escapeHtml(label);
    const safeUrl = escapeHtml(url);
    const displayUrl = safeUrl; //.replace(/^https?:\/\//, ''); // 简化URL显示

    return `
            <div class="link-card-container">
              <div class="link-card ${safeAvatar ? "" : "no-avatar"}">
                <a href="${safeUrl}" target="_blank" class="link-content">
                  <p class="link-title">${safeTitle}</p>
                  <p class="link-url">${safeLabel}</p>
                </a>
                ${
                  safeAvatar
                    ? `<div class="link-avatar" 
                            style="background-image: url('${safeAvatar}')"
                            onerror="this.style.backgroundImage='none'"></div>`
                    : ""
                }
              </div>
            </div>`;
  };
  // console.log('Updated inline rulers:', md.block.ruler.__rules__.map(r => r.name));

  //轮播图渲染
  md.renderer.rules.carousel_open = (tokens, idx) => {
    const token = tokens[idx];
    const classAttr = token.attrs?.find((attr) => attr[0] === "class");
    // return `<div class="carousel-wrapper"> <div class="container-btn prev">${svgLeft}</div><div class="${
    //   classAttr ? classAttr[1] : ""
    // }">\n
    //     `;
    return `<div class="carousel-wrapper"> <div class="container-btn prev"><span class="mingcute--left-line"></span></div><div class="${
      classAttr ? classAttr[1] : ""
    }">\n
        `;
  };
  // md.renderer.rules.carousel_close = () => `</div><div class="container-btn next">${svgRight}</div></div>\n`;
  md.renderer.rules.carousel_close = (tokens, idx, options, env, self) => {
    // 你可以从 token 或 env 中记录图片数量（比如 5 张），这里假设为 5：
    const dotCount = env.carouselImageCount;

    const dotsHtml =
      `<div class="container-indicators">` +
      Array(dotCount)
        .fill(0)
        .map((_, i) => `<span class="dot${i === 0 ? " active" : ""}"></span>`)
        .join("") +
      `</div>`;

    // return `</div>${dotsHtml}<div class="container-btn next">${svgRight}</div></div>\n`;
    return `</div>${dotsHtml}<div class="container-btn next"><span class="mingcute--right-line"></span></div></div>\n`;
  };
  md.renderer.rules.container_item_open = (tokens, idx) => {
    const token = tokens[idx];
    const classAttr = token.attrs?.find((attr) => attr[0] === "class");
    return `<div class="${classAttr ? classAttr[1] : ""}">`;
  };
  md.renderer.rules.container_item_close = () => ` </div>`;

  //字体大小渲染
  md.renderer.rules.font_size_open = (tokens, idx) => {
    const attrs = tokens[idx].attrs || [];
    const styleAttr = attrs.map(([k, v]) => `${k}="${v}"`).join(" ");
    return `<span ${styleAttr}>`;
  };
  md.renderer.rules.font_size_close = () => `</span>`;
};
