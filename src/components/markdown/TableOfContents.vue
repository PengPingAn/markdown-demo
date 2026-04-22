<template>
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
        <div class="toc-mask toc-mask-bottom" :class="{ visible: showBottomMask }"></div>
      </div>
    </div>

    <div class="flex items-center gap-2 m-[5px]">
      <AnimatedCircularProgressBar
        :max="100"
        :min="0"
        :value="scrollPercentage"
        :showPercentage="false"
        :circleStrokeWidth="13"
        :gaugePrimaryColor="'#acacac'"
      />
      <span style="color: #aeafaf; font-size: 13px">{{ scrollPercentage }}%</span>
    </div>

    <Transition name="fade-slide">
      <div
        v-show="visible"
        class="back-top flex text-[#94a3b8] items-center gap-1 text-[10px] cursor-pointer"
        @click="scrollToTop"
      >
        <span class="octicon--move-to-top-16"></span>
        <span>回到顶部</span>
      </div>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import AnimatedCircularProgressBar from "@/components/AnimatedCircularProgressBar.vue";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const props = defineProps<{
  toc: TocItem[];
}>();

// DOM 引用
const tocAsideRef = ref<HTMLElement | null>(null);
const tocScrollContainer = ref<HTMLElement | null>(null);
const indicatorRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const activeId = ref("");
const showTopMask = ref(false);
const showBottomMask = ref(false);
const scrollPercentage = ref<number>(0);
const visible = ref(false);
const visibleHeadingRange = ref({ first: -1, last: -1 });

// 定时器
let scrollTimer: number | null = null;
let tocScrollTimer: number | null = null;
let isManualScrolling = false;
let manualScrollReleaseTimer: number | null = null;
let ticking = false;
let but_ticking = false;

// ========== 辅助函数 ==========
const setItemRef = (el: any, index: number) => {
  if (el) itemRefs.value[index] = el;
};

// 获取所有可见的正文标题
interface VisibleHeading {
  index: number;
  top: number;
  bottom: number;
}

const getVisibleHeadings = (): VisibleHeading[] => {
  const result: VisibleHeading[] = [];
  for (let i = 0; i < props.toc.length; i++) {
    const headingEl = document.getElementById(props.toc[i].id);
    if (headingEl) {
      const rect = headingEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        result.push({ index: i, top: rect.top, bottom: rect.bottom });
      }
    }
  }
  return result;
};

// ========== 高亮分支逻辑 ==========
const activeBranchIds = computed(() => {
  if (!activeId.value || !props.toc.length) return new Set<string>();
  const activeIndex = props.toc.findIndex((item) => item.id === activeId.value);
  if (activeIndex === -1) return new Set<string>();
  const activeLevel = props.toc[activeIndex].level;
  const ids: string[] = [activeId.value];
  for (let i = activeIndex + 1; i < props.toc.length; i++) {
    const item = props.toc[i];
    if (item.level < activeLevel) break;
    if (activeLevel === 1 && item.level === 1) break;
    ids.push(item.id);
  }
  return new Set(ids);
});

const isActive = (id: string) => activeBranchIds.value.has(id);

const activeBranchRange = computed(() => {
  if (!activeId.value || !props.toc.length) return { first: -1, last: -1 };
  const ids = activeBranchIds.value;
  let first = -1,
    last = -1;
  for (let i = 0; i < props.toc.length; i++) {
    if (ids.has(props.toc[i].id)) {
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

// ========== 更新逻辑 ==========
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

  const container = tocScrollContainer.value;
  const containerRect = container.getBoundingClientRect();
  const firstRect = firstEl.getBoundingClientRect();
  const lastRect = lastEl.getBoundingClientRect();

  const scrollTop = container.scrollTop;
  const relativeTop = firstRect.top - containerRect.top + scrollTop;
  const height = lastRect.bottom - firstRect.top;

  indicatorRef.value.style.top = `${relativeTop}px`;
  indicatorRef.value.style.height = `${height}px`;
  indicatorRef.value.style.opacity = "1";
};

const updateActiveHeading = () => {
  if (isManualScrolling || !props.toc.length) return;

  const visible = getVisibleHeadings();
  if (visible.length === 0) return;

  const isBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
  if (isBottom) {
    const lastVisible = visible[visible.length - 1];
    const lastId = props.toc[lastVisible.index].id;
    if (lastId !== activeId.value) {
      activeId.value = lastId;
      if (tocScrollTimer) clearTimeout(tocScrollTimer);
      tocScrollTimer = setTimeout(() => scrollActiveIntoToc(), 100);
    }
    return;
  }

  const sorted = [...visible].sort((a, b) => a.top - b.top);
  const firstVisible = sorted[0];
  const targetId = props.toc[firstVisible.index].id;
  if (targetId !== activeId.value) {
    activeId.value = targetId;
    if (tocScrollTimer) clearTimeout(tocScrollTimer);
    tocScrollTimer = setTimeout(() => scrollActiveIntoToc(), 100);
  }
};

const updateMasks = () => {
  if (!tocScrollContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = tocScrollContainer.value;
  showTopMask.value = scrollTop > 5;
  showBottomMask.value = scrollTop + clientHeight < scrollHeight - 5;
};

const refresh = () => {
  updateVisibleHeadingRange();
  updateActiveHeading();
  updateIndicatorPosition();
  updateMasks();
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

// 滚动百分比计算（基于正文内容区域）
const calculateScrollPercentage = () => {
  const contentWrapper = document.querySelector(".markdown-content-wrapper");
  if (!contentWrapper) return;

  const rect = contentWrapper.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const componentHeight = rect.height;

  const visibleStart = Math.max(0, -rect.top);
  const visibleEnd = Math.min(componentHeight, windowHeight - rect.top);
  const visibleHeight = Math.max(0, visibleEnd - visibleStart);

  const maxScroll = componentHeight - visibleHeight;
  scrollPercentage.value =
    maxScroll > 0 && isFinite(visibleStart)
      ? Math.min(100, Math.round((visibleStart / maxScroll) * 100))
      : 0;
};

// 侧边栏粘性定位
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

// 回到顶部显示逻辑
const handleShowBackTop = () => {
  visible.value = window.scrollY > 1000;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ========== 事件监听 ==========
const onWindowScroll = () => {
  if (isManualScrolling) return;
  if (!ticking) {
    requestAnimationFrame(() => {
      refresh();
      updateStickyTop();
      calculateScrollPercentage();
      ticking = false;
    });
    ticking = true;
  }
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    refresh();
    updateStickyTop();
    calculateScrollPercentage();
  }, 150);

  if (!but_ticking) {
    requestAnimationFrame(() => {
      handleShowBackTop();
      but_ticking = false;
    });
    but_ticking = true;
  }
};

const onTocScroll = () => {
  updateMasks();
  updateIndicatorPosition();
};

const onResize = () => refresh();

// 监听 toc 变化，重置 refs 数组
watch(
  () => props.toc,
  (newToc) => {
    itemRefs.value = new Array(newToc.length).fill(null);
    nextTick(() => refresh());
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener("scroll", onWindowScroll, { passive: true });
  window.addEventListener("resize", onResize);
  nextTick(() => {
    if (tocScrollContainer.value) {
      tocScrollContainer.value.addEventListener("scroll", onTocScroll, { passive: true });
      updateMasks();
    }
    refresh();
    updateStickyTop();
    calculateScrollPercentage();
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

<style scoped>
/* 保持原有样式完全不变 */
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
/* .toc-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
} */
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
  transform: translateX(2px);
}
.toc-active {
  background-color: rgba(59, 130, 246, 0.12);
  transform: translateX(2px);
  box-shadow: -2px 0 6px rgba(59, 130, 246, 0.15);
  border-left-color: #3b82f6;
}
.toc-active .toc-link {
  color: oklch(54.6% 0.245 262.881);
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
  .table-of-contents {
    position: relative;
    top: 0 !important;
    width: 100%;
  }
  .toc-scroll-container {
    max-height: 260px;
  }
}
.octicon--move-to-top-16 {
  display: inline-block;
  width: 12px;
  height: 12px;
  background-color: #999;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='black' d='M3 2.25a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 2.25m5.53 2.97l3.75 3.75a.749.749 0 1 1-1.06 1.06L8.75 7.561v6.689a.75.75 0 0 1-1.5 0V7.561L4.78 10.03a.749.749 0 1 1-1.06-1.06l3.75-3.75a.75.75 0 0 1 1.06 0'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='black' d='M3 2.25a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 2.25m5.53 2.97l3.75 3.75a.749.749 0 1 1-1.06 1.06L8.75 7.561v6.689a.75.75 0 0 1-1.5 0V7.561L4.78 10.03a.749.749 0 1 1-1.06-1.06l3.75-3.75a.75.75 0 0 1 1.06 0'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  transition: background-color 0.2s ease, transform 0.2s ease;
}
.flex {
  transition: color 0.2s ease;
}
.flex:hover .octicon--move-to-top-16 {
  background-color: #3a3b3b;
  transform: translateY(-1px) scale(1.05);
}
.flex:hover {
  color: #000;
}
.flex:active .octicon--move-to-top-16 {
  transform: translateY(0) scale(0.95);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
