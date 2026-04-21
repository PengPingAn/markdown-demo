// src/composables/useScrollSpy.ts
import { ref, onMounted, onUnmounted, watch } from "vue";

export function useScrollSpy(toc: ref<{ id: string; level: number }[]>) {
  const activeId = ref("");
  const visibleHeadingRange = ref({ first: -1, last: -1 });

  const getVisibleHeadings = () => {
    const result: { index: number; top: number }[] = [];
    for (let i = 0; i < toc.value.length; i++) {
      const el = document.getElementById(toc.value[i].id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          result.push({ index: i, top: rect.top });
        }
      }
    }
    return result;
  };

  const updateActiveHeading = () => {
    if (!toc.value.length) return;
    const visible = getVisibleHeadings();
    if (visible.length === 0) return;

    const isBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
    if (isBottom) {
      activeId.value = toc.value[toc.value.length - 1].id;
      return;
    }

    visible.sort((a, b) => a.top - b.top);
    activeId.value = toc.value[visible[0].index].id;
  };

  const updateVisibleRange = () => {
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

  const refresh = () => {
    updateVisibleRange();
    updateActiveHeading();
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        refresh();
        ticking = false;
      });
      ticking = true;
    }
  };

  onMounted(() => {
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    refresh();
  });
  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  });

  return { activeId, visibleHeadingRange, refresh };
}
