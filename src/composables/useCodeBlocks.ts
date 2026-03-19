// composables/useCodeBlocks.ts
import { ref, onMounted, onUnmounted, watchEffect } from "vue";
import { useScroll } from "./useScroll";

export function useCodeBlocks(containerRef: Ref<HTMLElement | undefined>) {
  const { scrollBy, BTN_HEIGHT } = useScroll();

  // 初始化代码块高度
  const initCodeBlocks = () => {
    if (!containerRef.value) return;
    const wrappers = containerRef.value.querySelectorAll(".code-block-wrapper");
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

  // 处理展开/折叠点击
  const handleExpandClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest(".code-block-expand-btn");
    if (!btn) return;

    const wrapper = btn.closest(".code-block-wrapper");
    if (!wrapper) return;

    const container = wrapper.querySelector(".code-block-container") as HTMLElement;
    const isExpanded = wrapper.classList.contains("expanded");
    const currentHeight = container.offsetHeight;

    if (isExpanded) {
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
      const fullHeight = parseInt(container.dataset.fullHeight || String(container.scrollHeight));
      requestAnimationFrame(() => {
        wrapper.classList.add("expanded");
        btn.innerHTML = '<span class="icon-park--to-top"></span> 收起';
        container.style.height = fullHeight + "px";
        container.style.overflowY = "hidden";
      });
    }
  };

  // 增强代码块：添加复制按钮和语言标签
  const enhanceCodeBlocks = () => {
    if (!containerRef.value) return;
    const wrappers = containerRef.value.querySelectorAll(".code-block-wrapper");
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
            if (feedback) {
              feedback.textContent = "已复制";
              copyBtn.classList.add("copied");
              setTimeout(() => {
                feedback.textContent = "复制";
                copyBtn.classList.remove("copied");
              }, 1500);
            }
          })
          .catch(() => {
            const feedback = copyBtn.querySelector(".copy-feedback");
            if (feedback) {
              feedback.textContent = "失败";
              setTimeout(() => {
                feedback.textContent = "复制";
              }, 1500);
            }
          });
      });
    });
  };

  // 清理事件监听（如果需要）
  const cleanup = () => {
    // 如果有需要解绑的事件，可在这里处理
  };

  return {
    initCodeBlocks,
    handleExpandClick,
    enhanceCodeBlocks,
    cleanup,
  };
}
