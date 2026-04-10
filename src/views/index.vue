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
              <div class="toc-indicator" ref="indicatorRef"></div>
              <ul class="toc-list">
                <li
                  v-for="(item, index) in toc"
                  :key="item.id"
                  :ref="(el) => setItemRef(el, index)"
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
import { ref, onMounted, onUnmounted, nextTick, computed, watchEffect } from "vue";
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
const indicatorRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const setItemRef = (el: any, index: number) => {
  if (el) itemRefs.value[index] = el;
};

let scrollTimer: number | null = null;
let tocScrollTimer: number | null = null;
let isManualScrolling = false;
let manualScrollReleaseTimer: number | null = null;
let ticking = false;

// ===================== 分支高亮逻辑（背景高亮） =====================
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

const activeFirstElement = computed(() => {
  const firstIndex = activeBranchRange.value.first;
  if (firstIndex === -1) return null;
  return itemRefs.value[firstIndex] || null;
});

// ===================== 正文标题可见性（用于竖条覆盖和激活） =====================
interface VisibleHeading {
  index: number;
  top: number;
  bottom: number;
}

const getVisibleHeadings = (): VisibleHeading[] => {
  const result: VisibleHeading[] = [];
  for (let i = 0; i < toc.value.length; i++) {
    const headingEl = document.getElementById(toc.value[i].id);
    if (headingEl) {
      const rect = headingEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        result.push({ index: i, top: rect.top, bottom: rect.bottom });
      }
    }
  }
  return result;
};

// 竖条覆盖的范围（基于所有可见正文标题）
const visibleHeadingRange = ref({ first: -1, last: -1 });

const updateVisibleHeadingRange = () => {
  const visible = getVisibleHeadings();
  if (visible.length) {
    const indices = visible.map((v) => v.index);
    visibleHeadingRange.value = {
      first: Math.min(...indices),
      last: Math.max(...indices),
    };
  } else {
    visibleHeadingRange.value = { first: -1, last: -1 };
  }
};

// 竖条指示器位置更新
const updateIndicatorPosition = () => {
  if (!indicatorRef.value || !tocScrollContainer.value) return;

  let firstIdx = visibleHeadingRange.value.first;
  let lastIdx = visibleHeadingRange.value.last;
  let firstEl: HTMLElement | null = null;
  let lastEl: HTMLElement | null = null;

  if (firstIdx !== -1 && lastIdx !== -1) {
    firstEl = itemRefs.value[firstIdx] || null;
    lastEl = itemRefs.value[lastIdx] || null;
  }

  if (!firstEl || !lastEl) {
    firstEl = activeFirstElement.value;
    lastEl = firstEl;
  }

  if (!firstEl || !lastEl) {
    indicatorRef.value.style.opacity = "0";
    return;
  }

  const containerRect = tocScrollContainer.value.getBoundingClientRect();
  const firstRect = firstEl.getBoundingClientRect();
  const lastRect = lastEl.getBoundingClientRect();
  const relativeTop = firstRect.top - containerRect.top;
  const height = lastRect.bottom - firstRect.top;
  indicatorRef.value.style.top = `${relativeTop}px`;
  indicatorRef.value.style.height = `${height}px`;
  indicatorRef.value.style.opacity = "1";
};

// ===================== 核心：更新当前激活的标题（背景高亮） =====================
// 激活策略：选择第一个进入视口的标题（即 top 最小的可见标题）
const updateActiveHeading = () => {
  if (isManualScrolling || !toc.value.length) return;

  const visible = getVisibleHeadings();
  if (visible.length === 0) return;

  // 滚动到底部检测
  const isBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
  if (isBottom) {
    const lastVisible = visible[visible.length - 1];
    const lastId = toc.value[lastVisible.index].id;
    if (lastId !== activeId.value) {
      activeId.value = lastId;
      if (tocScrollTimer) clearTimeout(tocScrollTimer);
      tocScrollTimer = setTimeout(() => scrollActiveIntoToc(), 100);
    }
    return;
  }

  // 按 top 升序排序，取第一个（最靠近视口顶部）
  const sorted = [...visible].sort((a, b) => a.top - b.top);
  const firstVisible = sorted[0];
  const targetId = toc.value[firstVisible.index].id;
  if (targetId !== activeId.value) {
    activeId.value = targetId;
    if (tocScrollTimer) clearTimeout(tocScrollTimer);
    tocScrollTimer = setTimeout(() => scrollActiveIntoToc(), 100);
  }
};

// 统一刷新
const refresh = () => {
  updateVisibleHeadingRange();
  updateActiveHeading();
  updateIndicatorPosition();
  updateMasks();
};

// ===================== 其他功能 =====================
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
  itemRefs.value = new Array(newToc.length).fill(null);
  nextTick(() => refresh());
};

const updateMasks = () => {
  if (!tocScrollContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = tocScrollContainer.value;
  showTopMask.value = scrollTop > 5;
  showBottomMask.value = scrollTop + clientHeight < scrollHeight - 5;
};

const scrollActiveIntoToc = () => {
  if (!tocScrollContainer.value) return;
  const activeItem = activeFirstElement.value;
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
  container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
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
    refresh();
    manualScrollReleaseTimer = setTimeout(() => {
      isManualScrolling = false;
    }, 150);
  });
};

const onWindowScroll = () => {
  if (isManualScrolling) return;
  if (!ticking) {
    requestAnimationFrame(() => {
      refresh();
      updateStickyTop();
      ticking = false;
    });
    ticking = true;
  }
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    refresh();
    updateStickyTop();
  }, 150);
};

const onTocScroll = () => {
  updateMasks();
  updateIndicatorPosition();
};

const onResize = () => refresh();

onMounted(() => {
  window.addEventListener("scroll", onWindowScroll, { passive: true });
  window.addEventListener("resize", onResize);
  refresh();
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
  window.removeEventListener("resize", onResize);
  if (scrollTimer) clearTimeout(scrollTimer);
  if (tocScrollTimer) clearTimeout(tocScrollTimer);
  if (manualScrollReleaseTimer) clearTimeout(manualScrollReleaseTimer);
  if (tocScrollContainer.value) {
    tocScrollContainer.value.removeEventListener("scroll", onTocScroll);
  }
});
</script>

<style lang="css" scoped>
/* 样式与上一版本完全相同，此处省略以保持简洁，请复制上一版本的样式 */
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
  position: relative;
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
  position: relative;
  max-height: 270px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.toc-scroll-container::-webkit-scrollbar {
  display: none;
}
.toc-indicator {
  position: absolute;
  left: 0;
  width: 0.15em;
  background-color: #6dde9b;
  border-radius: 6px;
  transition: top 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1),
    height 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.2s;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 20%,
    #000 80%,
    transparent
  );
  mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent);
}
.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  z-index: 1;
}
.toc-list li {
  line-height: 1.4;
  border-left: 3px solid transparent;
  margin: 0;
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
.toc-active {
  background-color: rgba(59, 130, 246, 0.12);
  transform: translateX(2px);
  box-shadow: -2px 0 6px rgba(59, 130, 246, 0.15);
  border-left-color: #3b82f6;
}
.toc-active .toc-link {
  color: #1e40af;
  font-weight: 500;
}
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
