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

const BTN_HEIGHT = 40;

const getScrollContainer = (): HTMLElement | Window => {
  if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
    return window;
  }
  const app = document.querySelector("#app");
  if (app && app.scrollHeight > app.clientHeight) {
    return app as HTMElement;
  }
  return window;
};

const scrollContainer = getScrollContainer();

const scrollBy = (delta: number) => {
  if (scrollContainer === window) {
    window.scrollBy(0, delta);
  } else {
    (scrollContainer as HTMLElement).scrollTop += delta;
  }
};

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
          // 【修改】新增 div.code-block-expand-wrapper 包裹按钮，负责羽化背景
          return `
            <div class="code-block-wrapper">
              <div class="code-block-container">
                ${highlightedCode}
              </div>
              <div class="code-block-expand-wrapper">
                <button class="code-block-expand-btn"><span class="icon-park--to-bottom"></span> 展开</button>
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
  });

  setupMarkdownPlugins(md);
  return md;
};

const renderContent = async () => {
  await getInitPromise();
  const md = createMarkdownIt();
  const rawHtml = md.render(props.source);
  renderedContent.value = DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ["style", "class"],
  });
};

const initCodeBlocks = () => {
  if (!markdownContainer.value) return;
  const wrappers = markdownContainer.value.querySelectorAll(".code-block-wrapper");
  wrappers.forEach((wrapper) => {
    const container = wrapper.querySelector(".code-block-container") as HTMLElement;
    const btnWrapper = wrapper.querySelector(".code-block-expand-wrapper") as HTMLElement;
    const btn = wrapper.querySelector(".code-block-expand-btn") as HTMLElement;
    if (!container || !btnWrapper || !btn) return;

    container.style.height = "";
    container.style.overflowY = "";

    const fullHeight = container.scrollHeight;
    if (fullHeight <= 400) {
      btnWrapper.style.display = "none";
      container.style.height = "auto";
      container.style.overflowY = "hidden";
    } else {
      btnWrapper.style.display = "flex";
      container.style.height = "400px";
      container.style.overflowY = "auto";
      container.dataset.fullHeight = String(fullHeight);
    }
  });
};

const handleCodeBlockClick = (e: Event) => {
  const btn = (e.target as HTMLElement).closest(".code-block-expand-btn");
  if (!btn) return;

  const wrapper = btn.closest(".code-block-wrapper");
  if (!wrapper) return;

  const container = wrapper.querySelector(".code-block-container") as HTMLElement;
  const isExpanded = wrapper.classList.contains("expanded");
  const currentHeight = container.offsetHeight;

  if (isExpanded) {
    // 折叠
    const targetHeight = 400;
    const delta = targetHeight - currentHeight;

    requestAnimationFrame(() => {
      wrapper.classList.remove("expanded");
      btn.innerHTML = '<span class="icon-park--to-bottom"></span> 展开';
      container.style.height = targetHeight + "px";
      container.style.overflowY = "auto";
      if (delta !== 0) {
        scrollBy(delta);
      }
    });
  } else {
    // 展开
    const fullHeight = parseInt(
      container.dataset.fullHeight || String(container.scrollHeight)
    );
    requestAnimationFrame(() => {
      wrapper.classList.add("expanded");
      btn.innerHTML = '<span class="icon-park--to-top"></span> 收起';
      container.style.height = fullHeight + "px";
      container.style.overflowY = "hidden";
    });
  }
};

const enhanceCodeBlocks = () => {
  if (!markdownContainer.value) return;
  const wrappers = markdownContainer.value.querySelectorAll(".code-block-wrapper");
  wrappers.forEach((wrapper) => {
    if (wrapper.querySelector(".code-block-actions")) return;

    const pre = wrapper.querySelector("pre");
    if (!pre) return;

    const lang = pre.getAttribute("data-language") || "text";
    const code = pre.querySelector("code")?.innerText || pre.innerText || "";

    const actions = document.createElement("div");
    actions.className = "code-block-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "code-block-copy";
    copyBtn.setAttribute("aria-label", "复制代码");
    copyBtn.innerHTML = `
      <svg class="copy-icon" viewBox="0 0 24 24" width="18" height="18">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
      <span class="copy-feedback">复制</span>
    `;

    const langTag = document.createElement("span");
    langTag.className = "code-block-lang";
    langTag.textContent = lang.toLowerCase();

    actions.appendChild(copyBtn);
    actions.appendChild(langTag);
    wrapper.appendChild(actions);

    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
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
        .catch(() => {
          const feedback = copyBtn.querySelector(".copy-feedback");
          feedback.textContent = "失败";
          setTimeout(() => {
            feedback.textContent = "复制";
          }, 1500);
        });
    });
  });
};

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
    nextTick(() => {
      initCodeBlocks();
      enhanceCodeBlocks();
    });
  }
);

onUnmounted(() => {
  markdownContainer.value?.removeEventListener("click", handleCodeBlockClick);
});
</script>

<style src="../styles/markdown/md-style.scss"></style>

<style scoped>
/* 外层容器：相对定位，清除多余空白 */
.markdown-body :deep(.code-block-wrapper) {
  line-height: 0;
  font-size: 0;
  position: relative;
  border-radius: 7px;
  overflow: hidden;
  background-color: #edf1f2;
}

/* 代码容器：负责滚动和高度过渡，添加底部内边距为按钮 wrapper 留出空间 */
.markdown-body :deep(.code-block-container) {
  transition: height 0.2s linear;
  overflow-x: auto;
  overflow-y: hidden;
  line-height: 0;
  font-size: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  box-sizing: border-box;
}

/* 恢复 pre 的正常显示 */
.markdown-body :deep(.code-block-container pre) {
  line-height: 1.6;
  font-size: 0.9rem;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  margin: 0;
  padding: 0.5rem;
  width: max-content;
  background: transparent !important;
}

/* 折叠状态：隐藏横向滚动条 */
.markdown-body :deep(.code-block-wrapper:not(.expanded) .code-block-container) {
  overflow-x: auto;
}

/* 展开状态：允许横向滚动 */
.markdown-body :deep(.code-block-wrapper.expanded .code-block-container) {
  overflow-x: auto;
}

/* 代码块滚动条样式 */
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

/* 【修改】按钮外层 wrapper：绝对定位在底部，负责羽化渐变背景 */
.markdown-body :deep(.code-block-expand-wrapper) {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 48px;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.95) 60%);
  pointer-events: none; /* 让点击穿透到底下的按钮，但按钮会填满整个区域，所以不影响 */
  z-index: 2;
  display: flex;
  justify-content: center;
}

/* 按钮本身：填充整个 wrapper，透明背景，负责内容和点击 */
.markdown-body :deep(.code-block-expand-btn) {
  height: 100%;
  border: none;
  background: transparent;
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: center;
  transition: color 0.2s;
  text-decoration: none;
  pointer-events: auto; /* 允许点击 */
  align-items: center;
}
.markdown-body :deep(.code-block-expand-btn:hover) {
  color: #111827;
}
/* 悬停时加深渐变（通过 wrapper 的 hover 实现） */
.markdown-body :deep(.code-block-expand-wrapper:hover) {
  background: linear-gradient(transparent, rgba(255, 255, 255, 1) 60%);
}

/* 操作层：绝对定位覆盖 wrapper，用于放置复制按钮和语言标签 */
.markdown-body :deep(.code-block-actions) {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  bottom: 0.5rem;
  left: 0.75rem;
  pointer-events: none;
  z-index: 3;
}

/* 复制按钮：右上角 */
.markdown-body :deep(.code-block-copy) {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: auto;
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
}
.markdown-body :deep(.code-block-wrapper:hover .code-block-copy) {
  opacity: 0.9;
}
.markdown-body :deep(.code-block-copy:hover) {
  opacity: 1 !important;
  background: #ffffff;
  border-color: #9ca3af;
}

/* 复制反馈文字 */
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
  background: rgba(0, 0, 0, 0.6);
  color: white;
}
.markdown-body :deep(.code-block-copy.copied .copy-feedback) {
  opacity: 1;
}

/* 语言标签：右下角 */
.markdown-body :deep(.code-block-lang) {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 0.7rem;
  color: #6b7280;
  backdrop-filter: blur(2px);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.02em;
  text-transform: lowercase;
  border: 1px solid rgba(0, 0, 0, 0.03);
  pointer-events: none;
}
</style>
