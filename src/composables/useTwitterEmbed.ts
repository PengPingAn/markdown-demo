// src/composables/useTwitterEmbed.ts
import { ref } from "vue";

const loadTwitterScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.twttr) {
      resolve();
      return;
    }
    const existingScript = document.querySelector('script[src*="widgets.js"]');
    if (existingScript) {
      const check = () => {
        if (window.twttr) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => {
      const check = () => {
        if (window.twttr) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    };
    script.onerror = () => reject(new Error("推特脚本加载失败"));
    document.head.appendChild(script);
  });
};

const waitForContainer = (element: Element, maxAttempts = 10): Promise<void> => {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      const rect = element.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        resolve();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, 100);
      } else {
        console.warn("[Twitter] 容器可能不可见，继续尝试渲染");
        resolve();
      }
    };
    check();
  });
};

export function useTwitterEmbed(containerRef: { value: HTMLElement | null }) {
  const isScriptLoaded = ref(false);
  const error = ref<string | null>(null);

  const renderEmbeds = async (): Promise<void> => {
    if (!containerRef.value) return;

    try {
      await loadTwitterScript();
      isScriptLoaded.value = true;
      console.log("[Twitter] 脚本加载成功");
    } catch (e: any) {
      error.value = e.message || "推特脚本加载失败";
      console.error("[Twitter] 脚本加载失败", e);
      const placeholders = containerRef.value.querySelectorAll(".twitter-embed-placeholder");
      placeholders.forEach((placeholder) => {
        const tweetUrl = placeholder.getAttribute("data-tweet-url");
        if (tweetUrl) {
          placeholder.innerHTML = `<a href="${tweetUrl}" target="_blank" rel="noopener noreferrer">查看推文 (加载失败)</a>`;
        }
      });
      return;
    }

    const placeholders = containerRef.value.querySelectorAll(".twitter-embed-placeholder");
    if (placeholders.length === 0) {
      console.log("[Twitter] 没有找到占位符");
      return;
    }

    for (const placeholder of placeholders) {
      const tweetId = placeholder.getAttribute("data-tweet-id");
      const tweetUrl = placeholder.getAttribute("data-tweet-url");
      if (!tweetId) {
        console.warn("[Twitter] 占位符缺少 data-tweet-id", placeholder);
        continue;
      }

      // 清空占位符，确保干净
      placeholder.innerHTML = "";

      await waitForContainer(placeholder);

      let retries = 3;
      let success = false;
      while (retries > 0 && !success) {
        try {
          console.log(`[Twitter] 尝试渲染推文 ${tweetId}，剩余重试 ${retries}`);
          // 仅使用 align 选项，与手动调用完全一致
          await window.twttr.widgets.createTweet(tweetId, placeholder, {
            align: "center",
          });

          // 等待推特完成渲染（约500ms）
          await new Promise((resolve) => setTimeout(resolve, 500));

          // 验证是否成功渲染出卡片（检查 iframe 或特定类）
          const hasIframe = placeholder.querySelector("iframe");
          const hasTweetClass = placeholder.querySelector(".twitter-tweet-rendered");
          if (hasIframe || hasTweetClass) {
            console.log(`[Twitter] 推文 ${tweetId} 渲染成功，检测到 iframe`);
            success = true;
          } else {
            console.warn(`[Twitter] 推文 ${tweetId} 可能渲染为链接卡片，准备重试`);
            throw new Error("可能渲染为链接卡片");
          }
        } catch (err) {
          console.error(`[Twitter] 推文 ${tweetId} 渲染失败 (重试剩余 ${retries})`, err);
          retries--;
          if (retries > 0) {
            placeholder.innerHTML = ""; // 清空后重试
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      }

      if (!success) {
        placeholder.innerHTML = `
          <div style="padding: 1em; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; text-align: center;">
            <p style="margin: 0 0 0.5em; color: #666;">😵 推文加载失败，请稍后重试</p>
            <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" style="color: #1da1f2;">在 Twitter 上查看</a>
          </div>
        `;
      }
    }
  };

  return {
    renderEmbeds,
    isScriptLoaded,
    error,
  };
}
