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

/**
 * 创建骨架屏 DOM 元素
 */
const createSkeleton = (): HTMLElement => {
  const skeleton = document.createElement("div");
  skeleton.className = "twitter-skeleton-dom";
  skeleton.style.cssText = `
    position: absolute;
    top: -1rem;
    left: 0;
    width: 100%;
    height: 100%;
    background: #f0f2f5;
    border-radius: 12px;
    overflow: hidden;
  `;

  const animation = document.createElement("div");
  animation.className = "skeleton-animation-dom";
  animation.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    animation: skeleton-loading-dom 1.5s infinite;
  `;
  skeleton.appendChild(animation);
  return skeleton;
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

    // 1. 为所有占位符清空内容并插入骨架屏
    const items: { placeholder: Element; tweetId: string; tweetUrl: string }[] = [];
    placeholders.forEach((placeholder) => {
      const tweetId = placeholder.getAttribute("data-tweet-id");
      const tweetUrl = placeholder.getAttribute("data-tweet-url");
      if (!tweetId) {
        console.warn("[Twitter] 占位符缺少 data-tweet-id", placeholder);
        return;
      }
      placeholder.innerHTML = "";
      const skeleton = createSkeleton();
      placeholder.appendChild(skeleton);
      items.push({ placeholder, tweetId, tweetUrl });
    });

    // 2. 等待所有容器可见（可并行等待）
    await Promise.all(items.map((item) => waitForContainer(item.placeholder)));

    // 3. 并发执行所有推文渲染
    const results = await Promise.allSettled(
      items.map(async ({ placeholder, tweetId, tweetUrl }) => {
        let retries = 3;
        while (retries > 0) {
          try {
            await window.twttr.widgets.createTweet(tweetId, placeholder, {
              align: "center",
            });
            await new Promise((resolve) => setTimeout(resolve, 500)); // 等待渲染
            const hasIframe = placeholder.querySelector("iframe");
            const hasTweetClass = placeholder.querySelector(".twitter-tweet-rendered");
            if (hasIframe || hasTweetClass) {
              // 成功：移除骨架屏
              const skeleton = placeholder.querySelector(".twitter-skeleton-dom");
              if (skeleton) skeleton.remove();
              return { success: true, tweetId };
            } else {
              throw new Error("可能渲染为链接卡片");
            }
          } catch (err) {
            retries--;
            if (retries === 0) {
              // 失败：移除骨架屏，显示错误信息
              const skeleton = placeholder.querySelector(".twitter-skeleton-dom");
              if (skeleton) skeleton.remove();
              placeholder.innerHTML = `
              <div style="padding: 1em; border: 1px solid #ccc; border-radius: 12px; background: #f9f9f9; text-align: center;">
                <p style="margin: 0 0 0.5em; color: #666;">😵 推文加载失败，请稍后重试</p>
                <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" style="color: #1da1f2;">在 Twitter 上查看</a>
              </div>
            `;
              return { success: false, tweetId };
            }
            // 重试前重新插入骨架屏（因为 createTweet 可能覆盖了内容）
            placeholder.innerHTML = "";
            const newSkeleton = createSkeleton();
            placeholder.appendChild(newSkeleton);
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      }),
    );

    // 4. 可选：统一处理结果日志
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`[Twitter] 推文 ${items[index].tweetId} 处理完成`, result.value);
      } else {
        console.error(`[Twitter] 推文 ${items[index].tweetId} 处理异常`, result.reason);
      }
    });
  };

  return {
    renderEmbeds,
    isScriptLoaded,
    error,
  };
}
