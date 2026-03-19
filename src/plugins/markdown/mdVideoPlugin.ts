// src/plugins/markdown/mdVideoPlugin.ts
import MarkdownIt from "markdown-it";

// ---------- 辅助函数：提取推文 ID ----------
function extractTweetId(url: string): string | null {
  const patterns = [/twitter\.com\/\w+\/status\/(\d+)/, /x\.com\/\w+\/status\/(\d+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ---------- 辅助函数：解析 YouTube ----------
function parseYouTubeUrl(url: string): { videoId: string; queryString: string } | null {
  try {
    const urlObj = new URL(url);
    let videoId = "";

    if (url.includes("/embed/")) {
      const match = urlObj.pathname.match(/\/embed\/([^/?]+)/);
      videoId = match ? match[1] : "";
    } else if (url.includes("youtube.com/watch")) {
      videoId = urlObj.searchParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = urlObj.pathname.split("/").pop() || "";
    }

    if (!videoId) return null;

    urlObj.searchParams.delete("v");
    const queryString = urlObj.searchParams.toString();
    return { videoId, queryString: queryString ? "?" + queryString : "" };
  } catch {
    // 正则回退
    let videoId = "";
    let queryString = "";
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
      const qIndex = url.indexOf("?");
      if (qIndex !== -1) {
        const params = new URLSearchParams(url.slice(qIndex + 1));
        params.delete("v");
        queryString = params.toString();
      }
    } else {
      const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
      if (shortMatch) {
        videoId = shortMatch[1];
        const qIndex = url.indexOf("?");
        if (qIndex !== -1) {
          queryString = url.slice(qIndex + 1);
        }
      }
    }
    if (!videoId) return null;
    return { videoId, queryString: queryString ? "?" + queryString : "" };
  }
}

// ---------- 辅助函数：解析 Vimeo ----------
function parseVimeoUrl(url: string): { videoId: string; queryString: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const videoId = pathParts[pathParts.length - 1]?.split("?")[0] || "";
    if (!videoId) return null;
    const queryString = urlObj.searchParams.toString();
    return { videoId, queryString: queryString ? "?" + queryString : "" };
  } catch {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) {
      const videoId = match[1];
      const qIndex = url.indexOf("?");
      const queryString = qIndex !== -1 ? url.slice(qIndex + 1) : "";
      return { videoId, queryString: queryString ? "?" + queryString : "" };
    }
    return null;
  }
}

// ---------- 生成嵌入代码 ----------
function getEmbedCode(src: string, attrs: Record<string, string>, md: MarkdownIt): string {
  const url = src;
  const escapedSrc = md.utils.escapeHtml(src);

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const parsed = parseYouTubeUrl(url);
    if (parsed) {
      const embedUrl = `https://www.youtube.com/embed/${parsed.videoId}${parsed.queryString}`;
      return `<iframe src="${md.utils.escapeHtml(embedUrl)}" class="md-video-iframe" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }
    return `<div class="md-video-error">无法解析 YouTube 视频链接</div>`;
  }

  // Vimeo
  if (url.includes("vimeo.com")) {
    const parsed = parseVimeoUrl(url);
    if (parsed) {
      const embedUrl = `https://player.vimeo.com/video/${parsed.videoId}${parsed.queryString}`;
      return `<iframe src="${md.utils.escapeHtml(embedUrl)}" class="md-video-iframe" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
    return `<div class="md-video-error">无法解析 Vimeo 视频链接</div>`;
  }

  // Bilibili
  if (url.includes("bilibili.com")) {
    return `<iframe src="${escapedSrc}" class="md-video-iframe" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Twitter / X
  if (url.includes("twitter.com") || url.includes("x.com")) {
    const tweetId = extractTweetId(url);
    if (tweetId) {
      // 生成占位符，不包含脚本
      return `<div class="twitter-embed-placeholder" data-tweet-id="${tweetId}" data-tweet-url="${escapedSrc}"></div>`;
    } else {
      return `<div class="md-video-error">无法解析推特链接</div>`;
    }
  }

  // 其他外部链接（暂不支持）
  if (/^https?:\/\//.test(src)) {
    return `<div class="md-video-error">暂不支持嵌入该链接</div>`;
  }

  // 本地视频
  return `<video src="${escapedSrc}" ${attrs.poster ? `poster="${md.utils.escapeHtml(attrs.poster)}"` : ""} controls preload="metadata" class="md-video"></video>`;
}

// ---------- 插件主函数 ----------
export function videoPlugin(md: MarkdownIt) {
  md.block.ruler.before("fence", "video", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max).trim();

    if (!line.startsWith(":::video")) return false;

    const attrRegex = /(\w+)\s*=\s*([^\s]+)/g;
    const attrs: Record<string, string> = {};
    let match;
    while ((match = attrRegex.exec(line)) !== null) {
      attrs[match[1]] = match[2];
    }

    if (!attrs.src) return false;

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
    const description = lines.join("\n").trim();
    const player = getEmbedCode(attrs.src, attrs, md);
    const html = `
      <div class="md-video-wrapper">
        ${player}
        ${description ? `<div class="md-video-description">—— ${md.utils.escapeHtml(description)} ——</div>` : ""}
      </div>
    `;

    const token = state.push("html_block", "", 0);
    token.content = html;
    return true;
  });
}
