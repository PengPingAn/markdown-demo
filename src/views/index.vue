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
                  v-for="(item, index) in toc"
                  :key="item.id"
                  :class="[
                    `toc-level-${item.level}`,
                    {
                      'toc-active': isActive(item.id),
                      'toc-active-first': isActiveFirst(index),
                      'toc-active-last': isActiveLast(index),
                    },
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
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
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

// 分支高亮逻辑
const activeBranchIds = computed(() => {
  if (!activeId.value || !toc.value.length) return new Set<string>();
  const activeIndex = toc.value.findIndex((item) => item.id === activeId.value);
  if (activeIndex === -1) return new Set<string>();
  const activeLevel = toc.value[activeIndex].level;
  const ids: string[] = [activeId.value];
  for (let i = activeIndex + 1; i < toc.value.length; i++) {
    const item = toc.value[i];
    if (item.level < activeLevel) break;
    if (activeLevel === 1 && item.level === 1) break;
    ids.push(item.id);
  }
  return new Set(ids);
});

const isActive = (id: string) => activeBranchIds.value.has(id);

const activeBranchRange = computed(() => {
  if (!activeId.value || !toc.value.length) return { first: -1, last: -1 };
  const ids = activeBranchIds.value;
  let first = -1,
    last = -1;
  for (let i = 0; i < toc.value.length; i++) {
    if (ids.has(toc.value[i].id)) {
      if (first === -1) first = i;
      last = i;
    }
  }
  return { first, last };
});

const isActiveFirst = (index: number) => index === activeBranchRange.value.first;
const isActiveLast = (index: number) => index === activeBranchRange.value.last;

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
  container.scrollTo({ top: targetScrollTop, behavior: "smooth" }); // 改为 smooth 让目录滚动更自然
};

const updateActiveHeading = () => {
  if (isManualScrolling || !toc.value.length) return;

  const headings = toc.value
    .map((item) => ({ id: item.id, el: document.getElementById(item.id) }))
    .filter((item): item is { id: string; el: HTMLElement } => item.el !== null);

  if (headings.length === 0) return;

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

  const OFFSET = 150;
  let activeHeading: { id: string; el: HTMLElement } | null = null;

  for (let i = headings.length - 1; i >= 0; i--) {
    const heading = headings[i];
    const rect = heading.el.getBoundingClientRect();
    if (rect.top >= 0 && rect.top <= OFFSET) {
      activeHeading = heading;
      break;
    }
  }

  if (!activeHeading) return;

  if (activeHeading.id !== activeId.value) {
    activeId.value = activeHeading.id;
    if (tocScrollTimer) clearTimeout(tocScrollTimer);
    tocScrollTimer = setTimeout(() => scrollActiveIntoToc(), 100);
  }
  updateMasks();
};

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

const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  if (manualScrollReleaseTimer) clearTimeout(manualScrollReleaseTimer);
  isManualScrolling = true;
  activeId.value = id;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  waitForScrollEnd(() => {
    scrollActiveIntoToc();
    updateActiveHeading();
    manualScrollReleaseTimer = setTimeout(() => {
      isManualScrolling = false;
    }, 150);
  });
};

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
.table-of-contents {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 300px;
  align-self: flex-start;
  will-change: top;
  transition: top 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
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
  gap: 0;
}
.toc-list li {
  line-height: 1.4;
  border-left: 3px solid transparent;
  margin: 0;
  /* 增强过渡：所有可动画属性都加上，并延长到 0.35s，使用自定义贝塞尔曲线 */
  transition: all 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}
.toc-link {
  display: block;
  text-decoration: none;
  color: #475569;
  font-size: 0.875rem;
  padding: 5px 0 5px 12px;
  border-radius: 0 8px 8px 0;
  transition: all 0.25s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toc-link:hover {
  color: #2563eb;
  background: rgba(59, 130, 246, 0.08);
  transform: translateX(2px);
}
/* 高亮样式：使用纯色背景，并加入轻微的阴影和位移，增强自然感 */
.toc-active {
  border-left-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.12);
  /* 轻微向右位移，营造“被选中向前”的感觉 */
  transform: translateX(2px);
  box-shadow: -2px 0 6px rgba(59, 130, 246, 0.15);
}
.toc-active .toc-link {
  color: #1e40af;
  font-weight: 500;
}
/* 高亮分支圆角控制 */
.toc-active.toc-active-first {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 0;
}
.toc-active.toc-active-last {
  border-top-right-radius: 0;
  border-bottom-right-radius: 8px;
}
.toc-active.toc-active-first.toc-active-last {
  border-radius: 0 8px 8px 0;
}
/* 缩进层级 */
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
/* 遮罩渐变 */
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
