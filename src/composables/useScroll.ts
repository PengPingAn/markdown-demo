// composables/useScroll.ts
import { ref, onMounted, onUnmounted } from "vue";

export function useScroll() {
  const scrollContainer = ref<Window | HTMLElement>(window);
  const BTN_HEIGHT = 40;

  const getScrollContainer = (): Window | HTMLElement => {
    if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
      return window;
    }
    const app = document.querySelector("#app");
    if (app && app.scrollHeight > app.clientHeight) {
      return app as HTMLElement;
    }
    return window;
  };

  const scrollBy = (delta: number) => {
    if (scrollContainer.value === window) {
      window.scrollBy(0, delta);
    } else {
      (scrollContainer.value as HTMLElement).scrollTop += delta;
    }
  };

  onMounted(() => {
    scrollContainer.value = getScrollContainer();
  });

  return {
    scrollBy,
    BTN_HEIGHT,
  };
}
