<template>
  <div ref="markdownContainer" v-html="renderedContent" class="markdown-body"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from "vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { setupMarkdownPlugins } from "@/plugins/markdown";
import { getInitPromise, getHighlighterSync } from "@/plugins/markdown/highlighter";

const props = defineProps<{
  source: string;
}>();

const renderedContent = ref("");
const markdownContainer = ref<HTMLElement>();

// 固定按钮高度（与 CSS 一致）
const BTN_HEIGHT = 40;

// 获取实际滚动容器（若你的项目滚动容器不是 window，请修改此处）
const getScrollContainer = (): HTMLElement | Window => {
  if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
    return window;
  }
  const app = document.querySelector("#app");
  if (app && app.scrollHeight > app.clientHeight) {
    return app as HTMLElement;
  }
  return window;
};

const scrollContainer = getScrollContainer();

// 统一滚动方法
const scrollBy = (delta: number) => {
  if (scrollContainer === window) {
    window.scrollBy(0, delta);
  } else {
    (scrollContainer as HTMLElement).scrollTop += delta;
  }
};

// 创建 markdown-it 实例
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
          return `
            <div class="code-block-wrapper">
              <div class="code-block-container">
                ${highlightedCode}
                <button class="code-block-expand-btn">展开全部</button>
              </div>
            </div>
          `;
        } else {
          return `<pre><code class="language-${lang || "text"}">${md.utils.escapeHtml(
            code
          )}</code></pre>`;
        }
      } catch (e) {
        console.error("Shiki highlighting failed:", e);
        return `<pre><code class="language-${lang || "text"}">${md.utils.escapeHtml(
          code
        )}</code></pre>`;
      }
    },

    // highlight: (code, lang) => {
    //   try {
    //     const highlighter = getHighlighterSync(); // 此时一定已初始化
    //     if (lang && highlighter.getLoadedLanguages().includes(lang)) {
    //       return highlighter.codeToHtml(code, {
    //         lang,
    //         theme: "github-dark",
    //         decorations: [
    //           {
    //             // 行和字符索引都从 0 开始
    //             start: { line: 1, character: 0 },
    //             end: { line: 1, character: 11 },
    //             properties: { class: "highlighted-word" },
    //           },
    //         ],
    //       });
    //     }
    //     // 语言不支持，使用默认转义
    //     return `<pre><code class="language-${lang || "text"}">${md.utils.escapeHtml(
    //       code
    //     )}</code></pre>`;
    //   } catch (e) {
    //     console.error("Shiki highlighting failed:", e);
    //     return `<pre><code class="language-${lang || "text"}">${md.utils.escapeHtml(
    //       code
    //     )}</code></pre>`;
    //   }
    // },
  });

  setupMarkdownPlugins(md);
  return md;
};

// 渲染内容
const renderContent = async () => {
  await getInitPromise();
  const md = createMarkdownIt();
  const rawHtml = md.render(props.source);
  renderedContent.value = DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ["style", "class"],
  });
};

// 初始化代码块状态
const initCodeBlocks = () => {
  if (!markdownContainer.value) return;
  const wrappers = markdownContainer.value.querySelectorAll(".code-block-wrapper");
  wrappers.forEach((wrapper) => {
    const container = wrapper.querySelector(".code-block-container") as HTMLElement;
    const btn = wrapper.querySelector(".code-block-expand-btn") as HTMLElement;
    if (!container || !btn) return;

    // 重置样式
    container.style.height = "";
    container.style.overflowY = "";

    const fullHeight = container.scrollHeight;
    if (fullHeight <= 400) {
      btn.style.display = "none";
      container.style.height = "auto";
      container.style.overflowY = "hidden";
    } else {
      btn.style.display = "block";
      container.style.height = "400px";
      container.style.overflowY = "auto";
      container.dataset.fullHeight = String(fullHeight);
    }
  });
};

// 事件处理：同步 rAF 更新 + 滚动补偿
const handleCodeBlockClick = (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target.classList.contains("code-block-expand-btn")) return;

  const wrapper = target.closest(".code-block-wrapper");
  if (!wrapper) return;

  const container = wrapper.querySelector(".code-block-container") as HTMLElement;
  const isExpanded = wrapper.classList.contains("expanded");

  // 当前容器高度
  const currentHeight = container.offsetHeight;

  if (isExpanded) {
    // 折叠：底部固定 → 需要滚动补偿
    const targetHeight = 400;
    const delta = targetHeight - currentHeight; // 负数

    // 使用 rAF 批量更新，确保同一帧渲染
    requestAnimationFrame(() => {
      wrapper.classList.remove("expanded");
      target.textContent = "展开全部";
      container.style.height = targetHeight + "px";
      container.style.overflowY = "auto";
      // 立即滚动补偿
      if (delta !== 0) {
        scrollBy(delta);
      }
    });
  } else {
    // 展开：顶部固定 → 无需滚动补偿
    const fullHeight = parseInt(
      container.dataset.fullHeight || String(container.scrollHeight)
    );
    requestAnimationFrame(() => {
      wrapper.classList.add("expanded");
      target.textContent = "收起";
      container.style.height = fullHeight + "px";
      container.style.overflowY = "hidden";
      // 不滚动
    });
  }
};

// 增强代码块：添加悬浮复制按钮和右下角语言标签
const enhanceCodeBlocks = () => {
  if (!markdownContainer.value) return;
  const wrappers = markdownContainer.value.querySelectorAll(".code-block-wrapper");
  wrappers.forEach((wrapper) => {
    // 避免重复添加
    if (wrapper.querySelector(".code-block-actions")) return;

    const pre = wrapper.querySelector("pre");
    if (!pre) return;

    // 获取语言（Shiki 会生成 data-language 属性）
    const lang = pre.getAttribute("data-language") || "text";
    // 获取代码文本（用于复制）
    const code = pre.querySelector("code")?.innerText || pre.innerText || "";

    // 创建操作容器（用于定位两个元素）
    const actions = document.createElement("div");
    actions.className = "code-block-actions";

    // 复制按钮
    const copyBtn = document.createElement("button");
    copyBtn.className = "code-block-copy";
    copyBtn.setAttribute("aria-label", "复制代码");
    copyBtn.innerHTML = `
      <svg class="copy-icon" viewBox="0 0 24 24" width="18" height="18">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
      <span class="copy-feedback">复制</span>
    `;

    // 语言标签
    const langTag = document.createElement("span");
    langTag.className = "code-block-lang";
    langTag.textContent = lang.toLowerCase();

    // 组装
    actions.appendChild(copyBtn);
    actions.appendChild(langTag);
    wrapper.appendChild(actions);

    // 复制功能
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // 防止触发折叠按钮
      navigator.clipboard
        .writeText(code)
        .then(() => {
          const feedback = copyBtn.querySelector(".copy-feedback");
          feedback.textContent = "已复制";
          copyBtn.classList.add("copied");
          setTimeout(() => {
            feedback.textContent = "复制";
            copyBtn.classList.remove("copied");
          }, 1500);
        })
        .catch((err) => {
          console.error("复制失败:", err);
          const feedback = copyBtn.querySelector(".copy-feedback");
          feedback.textContent = "失败";
          setTimeout(() => {
            feedback.textContent = "复制";
          }, 1500);
        });
    });
  });
};

// 生命周期
onMounted(async () => {
  await renderContent();
  initCodeBlocks();
  markdownContainer.value?.addEventListener("click", handleCodeBlockClick);
  enhanceCodeBlocks();
});

watch(
  () => props.source,
  async () => {
    await renderContent();
    nextTick(initCodeBlocks);
    enhanceCodeBlocks();
  }
);

onUnmounted(() => {
  markdownContainer.value?.removeEventListener("click", handleCodeBlockClick);
});
</script>

<style src="../styles/markdown/md-style.scss"></style>

<style scoped>
/* 消除外层容器继承的行高和字体导致的空白 */
.markdown-body :deep(.code-block-wrapper) {
  line-height: 0;
  font-size: 0;
}

.markdown-body :deep(.code-block-container) {
  line-height: 0;
  font-size: 0;
  transition: height 0.2s linear;
  transition: height 0.2s linear;
  overflow-x: auto; /* 横向滚动始终启用 */
  overflow-y: hidden; /* 纵向滚动由 JS 动态控制 */
  line-height: 0;
  font-size: 0;
}

/* 恢复 pre 的正常显示，确保代码可读 */
.markdown-body :deep(.code-block-container pre) {
  line-height: 1.5; /* 使用全局 pre 的 line-height 值 */
  font-size: 1rem; /* 使用全局 pre 的 font-size 值 */
  margin: 0; /* 如果全局 pre 有 margin，可保留具体值 */
  padding: 1rem;
  width: max-content;
}

/* 按钮样式：保持透明，仅布局 */
.markdown-body :deep(.code-block-expand-btn) {
  display: block;
  width: 100%;
  height: 40px;
  line-height: 40px; /* 按钮内文字需要行高 */
  font-size: 14px;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  text-align: center;
  box-sizing: border-box;
}

.markdown-body :deep(.code-block-expand-btn:hover) {
  background: rgba(0, 0, 0, 0.02);
  text-decoration: underline;
}
/* 代码块容器滚动条样式：不额外占用宽度 */
.markdown-body :deep(.code-block-container) {
  scrollbar-width: thin; /* Firefox 薄滚动条 */
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent; /* Firefox 滑块颜色，轨道透明 */
  margin-top: 0.5rem;
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  font-size: 14px;
}

.code-block-lang {
  font-weight: 500;
  color: #24292e;
}

.code-block-copy {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #0366d6;
}

.code-block-copy:hover {
  text-decoration: underline;
}

/* WebKit 内核浏览器（Chrome、Safari、Edge）滚动条样式 */
.markdown-body :deep(.code-block-container::-webkit-scrollbar) {
  width: 6px; /* 纵向滚动条宽度 */
  height: 6px; /* 横向滚动条高度 */
}

.markdown-body :deep(.code-block-container::-webkit-scrollbar-track) {
  background: transparent; /* 轨道透明 */
}

.markdown-body :deep(.code-block-container::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.3); /* 半透明滑块 */
  border-radius: 3px;
}

.markdown-body :deep(.code-block-container::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.5); /* 悬停时稍微加深 */
}

/* 只作用于代码块，不影响全局 .markdown-body */

/* 代码块外层容器：圆角、边框、投影 */
.markdown-body :deep(.code-block-wrapper) {
  border-radius: 7px;
  overflow: hidden;
  background-color: #edf1f2;
  position: relative; /* 为内部绝对定位元素提供基准 */
}

/* 代码块容器：用于高度过渡和滚动 */
.markdown-body :deep(.code-block-container) {
  transition: height 0.2s linear;
  overflow-y: hidden; /* 由 JS 动态控制 */
  line-height: 0; /* 清除额外空白 */
  font-size: 0;
}

/* 恢复 pre 的正常显示，继承 Shiki 内联样式 */
.markdown-body :deep(.code-block-container pre) {
  margin: 0;
  line-height: 1.6;
  font-size: 0.9rem;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  background: transparent !important; /* 让 Shiki 背景透出 */
}

/* 操作按钮容器：绝对定位，覆盖在代码块上方，不占用文档流 */
.markdown-body :deep(.code-block-actions) {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  bottom: 0.5rem;
  left: 0.75rem;
  pointer-events: none; /* 让点击穿透到下面的元素，但按钮本身需要响应事件 */
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

/* 复制按钮：默认透明隐藏，悬浮渐显 */
.markdown-body :deep(.code-block-copy) {
  pointer-events: auto; /* 允许点击 */
  opacity: 0;
  transition: opacity 0.2s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.3rem;
  cursor: pointer;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-left: auto; /* 靠右 */
}

.markdown-body :deep(.code-block-wrapper:hover .code-block-copy) {
  opacity: 0.9;
}

.markdown-body :deep(.code-block-copy:hover) {
  opacity: 1 !important;
  background: #ffffff;
  border-color: #9ca3af;
}

/* 复制反馈文字（默认隐藏，仅用于状态提示） */
.markdown-body :deep(.copy-feedback) {
  position: absolute;
  right: 2.2rem;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}

.markdown-body :deep(.code-block-copy.copied .copy-feedback) {
  opacity: 1;
}

/* 语言标签：右下角，半透明，不可点击 */
.markdown-body :deep(.code-block-lang) {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.7rem;
  color: #6b7280;
  backdrop-filter: blur(2px);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.02em;
  text-transform: lowercase;
  border: 1px solid rgba(0, 0, 0, 0.03);
  pointer-events: none; /* 不影响点击 */
}

/* 展开按钮：底部居中 */
.markdown-body :deep(.code-block-expand-btn) {
  display: block;
  width: 100%;
  height: 36px;
  line-height: 36px;
  padding: 0;
  margin: 0;
  border: none;
  border-top: 1px solid #e5e7eb;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
  transition: background 0.2s, color 0.2s;
  box-sizing: border-box;
}

.markdown-body :deep(.code-block-expand-btn:hover) {
  background: #f9fafb;
  color: #1f2937;
}

/* 滚动条样式：细条悬浮 */
.markdown-body :deep(.code-block-container) {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.markdown-body :deep(.code-block-container::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
  background: transparent;
}

.markdown-body :deep(.code-block-container::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  border: 1px solid transparent;
  background-clip: padding-box;
}

.markdown-body :deep(.code-block-container::-webkit-scrollbar-thumb:hover) {
  background: rgba(65, 54, 54, 0.35);
}

.markdown-body :deep(.code-block-container::-webkit-scrollbar-track) {
  background: transparent;
}

/* 展开按钮：绝对定位在底部，带羽化渐变，不占用文档流 */
.markdown-body :deep(.code-block-expand-btn) {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 48px; /* 按钮高度，可调 */
  border: none;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.95) 60%);
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  transition: background 0.2s;
  border: none;
  outline: none;
  pointer-events: auto; /* 允许点击 */
  z-index: 2;
}

/* 悬停时加深渐变 */
.markdown-body :deep(.code-block-expand-btn:hover) {
  background: linear-gradient(transparent, rgba(255, 255, 255, 1) 60%);
  color: #111827;
}

/* 展开状态下按钮样式：纯色背景，表示可以收起 */
/* .markdown-body :deep(.code-block-wrapper.expanded .code-block-expand-btn) {
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #e5e7eb;
  align-items: center;
  padding-bottom: 0;
} */
</style>
