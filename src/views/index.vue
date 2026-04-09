<template>
  <div class="markdown-page">
    <div class="top-header">
      <EmptyState />
      <div class="text-3xl font-bold text-blue-600">Markdown 自定义语法演示</div>
    </div>

    <div class="two-column-layout">
      <div class="markdown-content-wrapper">
        <MarkdownRenderer :source="markdownText" @toc-updated="handleTocUpdate" />
      </div>

      <aside class="table-of-contents" ref="tocAsideRef" v-if="toc.length">
        <div class="toc-card">
          <div class="toc-divider"></div>
          <div class="toc-scroll-wrapper">
            <div class="toc-scroll-container" ref="tocScrollContainer">
              <ul class="toc-list">
                <li
                  v-for="item in toc"
                  :key="item.id"
                  :class="[
                    `toc-level-${item.level}`,
                    { 'toc-active': activeId === item.id },
                  ]"
                >
                  <a
                    href="#"
                    @click.prevent="scrollTo(item.id)"
                    class="toc-link"
                    :title="item.text"
                  >
                    {{ item.text }}
                  </a>
                </li>
              </ul>
            </div>
            <div class="toc-mask toc-mask-top" :class="{ visible: showTopMask }"></div>
            <div
              class="toc-mask toc-mask-bottom"
              :class="{ visible: showBottomMask }"
            ></div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import EmptyState from "@/components/EmptyState.vue";
import mdGrammar from "./mdGrammar.md?raw";
import md2 from "./md2.md?raw";

const markdownText = ref(md2);
const toc = ref<{ id: string; text: string; level: number }[]>([]);
const activeId = ref("");
const tocScrollContainer = ref<HTMLElement | null>(null);
const tocAsideRef = ref<HTMLElement | null>(null);
const showTopMask = ref(false);
const showBottomMask = ref(false);

let scrollTimer: number | null = null;
let tocScrollTimer: number | null = null;
let isManualScrolling = false;
let manualScrollReleaseTimer: number | null = null;
let ticking = false;

// 动态 sticky top
const updateStickyTop = () => {
  if (!tocAsideRef.value) return;
  const scrollY = window.scrollY;
  const startTop = 300;
  const endTop = 80;
  const maxScroll = 300;
  let top = startTop - (scrollY / maxScroll) * (startTop - endTop);
  top = Math.min(startTop, Math.max(endTop, top));
  tocAsideRef.value.style.top = `${top}px`;
};

const handleTocUpdate = (newToc: { id: string; text: string; level: number }[]) => {
  toc.value = newToc;
};

const updateMasks = () => {
  if (!tocScrollContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = tocScrollContainer.value;
  showTopMask.value = scrollTop > 5;
  showBottomMask.value = scrollTop + clientHeight < scrollHeight - 5;
};

const scrollActiveIntoToc = () => {
  if (!tocScrollContainer.value) return;
  const activeItem = tocScrollContainer.value.querySelector(".toc-active");
  if (!activeItem) return;
  const container = tocScrollContainer.value;
  const containerRect = container.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();
  const itemTopRelative = itemRect.top - containerRect.top;
  const itemHeight = itemRect.height;
  const containerHeight = container.clientHeight;
  let targetScrollTop =
    container.scrollTop + itemTopRelative - containerHeight / 2 + itemHeight / 2;
  const maxScrollTop = container.scrollHeight - containerHeight;
  targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
  container.scrollTo({ top: targetScrollTop, behavior: "instant" });
};

// 核心：高亮当前视口中可见的标题
const updateActiveHeading = () => {
  if (isManualScrolling || !toc.value.length) return;

  const headings = toc.value
    .map((item) => ({ id: item.id, el: document.getElementById(item.id) }))
    .filter((item): item is { id: string; el: HTMLElement } => item.el !== null);

  if (headings.length === 0) return;

  // 滚动到底部检测
  const isBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
  if (isBottom) {
    const lastId = headings[headings.length - 1].id;
    if (lastId !== activeId.value) {
      activeId.value = lastId;
      if (tocScrollTimer) clearTimeout(tocScrollTimer);
      tocScrollTimer = setTimeout(() => scrollActiveIntoToc(), 100);
    }
    updateMasks();
    return;
  }

  const OFFSET = 150; // 标题距离视口顶部小于此值时激活
  let activeHeading = headings[0]; // 默认第一个

  // 从后向前遍历，找到第一个标题顶部 <= OFFSET 的
  for (let i = headings.length - 1; i >= 0; i--) {
    const heading = headings[i];
    const rect = heading.el.getBoundingClientRect();
    if (rect.top <= OFFSET) {
      activeHeading = heading;
      break;
    }
  }

  if (activeHeading.id !== activeId.value) {
    activeId.value = activeHeading.id;
    if (tocScrollTimer) clearTimeout(tocScrollTimer);
    tocScrollTimer = setTimeout(() => scrollActiveIntoToc(), 100);
  }
  updateMasks();
};

// 等待滚动结束
const waitForScrollEnd = (callback: () => void) => {
  if ("onscrollend" in window) {
    const handler = () => {
      window.removeEventListener("scrollend", handler);
      callback();
    };
    window.addEventListener("scrollend", handler);
    setTimeout(() => {
      window.removeEventListener("scrollend", handler);
      callback();
    }, 500);
  } else {
    setTimeout(callback, 300);
  }
};

// 点击跳转
const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  if (manualScrollReleaseTimer) clearTimeout(manualScrollReleaseTimer);
  isManualScrolling = true;
  activeId.value = id;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  waitForScrollEnd(() => {
    scrollActiveIntoToc();
    // 滚动结束后更新高亮，确保与当前视口同步
    updateActiveHeading();
    manualScrollReleaseTimer = setTimeout(() => {
      isManualScrolling = false;
    }, 150);
  });
};

// 滚动事件（节流）
const onWindowScroll = () => {
  if (isManualScrolling) return;
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveHeading();
      updateStickyTop();
      ticking = false;
    });
    ticking = true;
  }
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    updateActiveHeading();
    updateStickyTop();
  }, 150);
};

const onTocScroll = () => {
  updateMasks();
};

onMounted(() => {
  window.addEventListener("scroll", onWindowScroll, { passive: true });
  updateActiveHeading();
  updateStickyTop();
  nextTick(() => {
    if (tocScrollContainer.value) {
      tocScrollContainer.value.addEventListener("scroll", onTocScroll, { passive: true });
      updateMasks();
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onWindowScroll);
  if (scrollTimer) clearTimeout(scrollTimer);
  if (tocScrollTimer) clearTimeout(tocScrollTimer);
  if (manualScrollReleaseTimer) clearTimeout(manualScrollReleaseTimer);
  if (tocScrollContainer.value) {
    tocScrollContainer.value.removeEventListener("scroll", onTocScroll);
  }
});
</script>

<style lang="css" scoped>
.markdown-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}
.top-header {
  margin-bottom: 2rem;
  text-align: center;
}
.two-column-layout {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.markdown-content-wrapper {
  flex: 1;
  min-width: 0;
}
/* 目录容器：优化过渡动画 */
.table-of-contents {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 300px; /* 初始值，会被 JS 动态覆盖 */
  align-self: flex-start;
  will-change: top; /* 提示浏览器优化 top 变化 */
  transition: top 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1); /* 更流畅的缓动曲线 */
}
.toc-card {
  transition: box-shadow 0.2s;
}
.toc-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}
.toc-divider {
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #e2e8f0 80%);
  border-radius: 2px;
  margin: 0.5rem 0 1rem 0;
  width: 40px;
}
.toc-scroll-wrapper {
  position: relative;
}
.toc-scroll-container {
  max-height: 270px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.toc-scroll-container::-webkit-scrollbar {
  display: none;
}
.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.toc-list li {
  line-height: 1.4;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}
.toc-link {
  display: block;
  text-decoration: none;
  color: #475569;
  font-size: 0.875rem;
  padding: 5px 0 5px 12px;
  border-radius: 0 8px 8px 0;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toc-link:hover {
  color: #2563eb;
  background: rgba(59, 130, 246, 0.08);
  transform: translateX(2px);
}
.toc-active {
  border-left-color: #3b82f6;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.12), transparent);
}
.toc-active .toc-link {
  color: #1e40af;
  font-weight: 500;
}
.toc-level-1 {
  padding-left: 0;
}
.toc-level-2 {
  padding-left: 0.75rem;
}
.toc-level-3 {
  padding-left: 1.5rem;
}
.toc-level-4 {
  padding-left: 2.25rem;
}
.toc-level-5 {
  padding-left: 3rem;
}
.toc-level-6 {
  padding-left: 3.75rem;
}
.toc-mask {
  position: absolute;
  left: 0;
  right: 0;
  height: 32px;
  pointer-events: none;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.toc-mask.visible {
  opacity: 1;
}
.toc-mask-top {
  top: 0;
  background: linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0));
}
.toc-mask-bottom {
  bottom: 0;
  background: linear-gradient(to top, #ffffff, rgba(255, 255, 255, 0));
}
@media (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
  }
  .table-of-contents {
    position: relative;
    top: 0 !important;
    width: 100%;
  }
  .toc-scroll-container {
    max-height: 260px;
  }
}
</style>

<style lang="css">
.markdown-renderer h1,
.markdown-renderer h2,
.markdown-renderer h3,
.markdown-renderer h4,
.markdown-renderer h5,
.markdown-renderer h6 {
  scroll-margin-top: 80px;
}
</style>
