<template>
  <!-- <div class="wider md-preview-container">
    <h3 class="mb-3 flex items-center gap-2 text-base font-medium leading-tight">
      <span class="streamline-ultimate-color--notes-paper-text"></span>
      拾要
    </h3>

    <div
      class="space-y-2 text-xs leading-relaxed text-base-content/80 md-view"
      style="max-width: 100%; position: relative"
    >
      {{ abstract }}
    </div>
  </div> -->

  <div class="paper-card-wrapper">
    <!-- 双纸堆叠容器 -->
    <div class="card-stack">
      <!-- 底层纸张（第二张纸，叠在下方） -->
      <div class="paper-back"></div>

      <!-- 上层主卡片（带折角） -->
      <div class="paper-front">
        <!-- 折角区域的阴影和高光增强真实感 -->
        <div class="fold-shadow"></div>
        <div class="fold-highlight"></div>
        <div class="crease-effect"></div>

        <div><h2>这是一个标题</h2></div>

        <div class="wider md-preview-container">
          <h3 class="mb-3 flex items-center gap-2 text-base font-medium leading-tight">
            <span class="streamline-ultimate-color--notes-paper-text"></span>
            拾要
          </h3>

          <div
            class="space-y-2 text-xs leading-relaxed text-base-content/80 md-view"
            style="max-width: 100%; position: relative"
          >
            {{ abstract }}
          </div>
        </div>

        <!-- Markdown 渲染内容区 -->
        <MarkdownRenderer :source="props.content" @toc-updated="handleTocUpdate" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import MarkdownRenderer from "../MarkdownRenderer.vue";

const props = defineProps({
  content: {
    type: String,
    default: null,
  },
});

// 👇 声明可触发的事件
const emit = defineEmits(["toc-updated"]);
const abstract = ref(
  ` ==作者分享了自己自== Claude 4 推出后愈发依赖 AI工具开发项目，如Afilmory、face-mask-web等，甚至在被封号后仍继续购买 AI服务，并比较了 Codex 与 Claude 的优劣。近期作者自己动手开发了 Torrent WebUI并尝试商业模式，开放官网让用户加入等待名单。此外，作者还记录了前往太湖古镇的旅行体验，观看了真人秀和俄罗斯冰秀，对夜晚的烟花和铁花表演印象深刻，认为门票物有所值。最后，简单列举了最近观看的两部电视剧 `
);

// 👇 处理 MarkdownRenderer 的目录更新，并向上传递
const handleTocUpdate = (toc) => {
  emit("toc-updated", toc);
};
</script>

<style scoped>
/* 首字下沉：只作用于 Markdown 正文的第一个普通段落 */
:deep(.markdown-body > p:first-of-type::first-letter) {
  font-size: 200% !important;
  float: left;
  margin-right: 0.2em;
  margin-top: -0.5rem;
}
.wider {
  position: relative;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0) 40%,
    var(--main-gradient-color, rgba(255, 105, 180, 0.2)) 100%
  );
  /* 🔧 修改下面三行 */
  margin-left: -2rem; /* 原无此属性，新增 */
  margin-right: -2rem; /* 原无此属性，新增 */
  padding: 1.5rem 2rem; /* 原为 1.5rem 1rem，将左右内边距改为 2rem */
  margin-top: -2rem;
  transition: all 0.3s ease;
  z-index: 1; /* 原为 -1，改为 1 避免被其他元素遮挡 */
  box-sizing: border-box;
  max-width: none; /* 原为 100%，改为 none 允许超出 */
}
.md-preview-container {
  overflow-x: auto;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 0%,
    black 90%,
    transparent 100%
  );
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 0%,
    black 90%,
    transparent 100%
  );
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
}
.streamline-ultimate-color--notes-paper-text {
  display: inline-block;
  width: 13px;
  height: 13px;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='none'%3E%3Cpath fill='%23ff885e' d='M23 1.957v13.39h-6.696a.957.957 0 0 0-.956.957V23H1.957A.957.957 0 0 1 1 22.044V1.957A.957.957 0 0 1 1.957 1h20.087a.957.957 0 0 1 .956.957'/%3E%3Cpath fill='%23ffbc44' d='M23 15.348L15.348 23v-6.696a.957.957 0 0 1 .956-.956z'/%3E%3Cpath stroke='%23191919' stroke-linecap='round' stroke-linejoin='round' d='M23 1.957v13.39h-6.696a.957.957 0 0 0-.956.957V23H1.957A.957.957 0 0 1 1 22.044V1.957A.957.957 0 0 1 1.957 1h20.087a.957.957 0 0 1 .956.957' stroke-width='1'/%3E%3Cpath stroke='%23191919' stroke-linecap='round' stroke-linejoin='round' d='M23 15.348L15.348 23v-6.696a.957.957 0 0 1 .956-.956zM5.304 10.044l.957-.957a1.354 1.354 0 0 1 1.913 0a1.354 1.354 0 0 0 1.913 0a1.354 1.354 0 0 1 1.913 0a1.353 1.353 0 0 0 1.913 0a1.354 1.354 0 0 1 1.913 0a1.354 1.354 0 0 0 1.913 0l.957-.956M5.304 14.827l.957-.957a1.353 1.353 0 0 1 1.913 0a1.354 1.354 0 0 0 1.913 0' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E");
}

/* 整体背景——保留原有的暖白基底 */
.paper-card-wrapper {
  background-image: radial-gradient(
      circle at 25% 30%,
      rgba(160, 150, 140, 0.05) 1.5%,
      transparent 2%
    ),
    radial-gradient(circle at 70% 85%, rgba(130, 120, 105, 0.04) 1.2%, transparent 1.8%);
  background-size: 48px 48px, 36px 36px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Segoe UI", "Roboto", "Merriweather", Georgia, "Times New Roman", serif;
  margin: 0;
}

/* 卡片堆叠容器 */
.card-stack {
  position: relative;
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  overflow: visible;
  transition: transform 0.25s ease;
}

/* ========= 底层纸 —— 更克制的堆叠跨度 ========= */
.paper-back {
  position: absolute;
  /* 🔧 优化：减小偏移，跨度更小更自然 */
  top: 5px;
  left: 8px;
  right: 0px;
  bottom: -50px;
  background: #fbfaf7;
  background-image: linear-gradient(142deg, #fefcf8 0%, #f6f3ed 100%);
  border-radius: 2px 2px 2px 2px;
  /* 🔧 优化：使用暖褐色半透明阴影，更像纸张投影 */
  box-shadow: 4px 6px 14px rgba(75, 60, 45, 0.06), 1px 2px 4px rgba(60, 45, 30, 0.03),
    inset 0 1px 0 rgba(255, 255, 250, 0.6);
  /* 🔧 优化：旋转角度减小，几乎看不出来但保留错落感 */
  transform: rotate(0.3deg);
  z-index: 0;
  transition: all 0.25s ease;

  z-index: -3;
  height: 820px;
  max-height: 96%;
  transform: translateZ(-8px) translateX(14px) translateY(5px) rotate(1.8deg);
  transform-origin: left top;
  transition-duration: 0ms;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
}

/* 底层纸细腻纹理（亚麻纸纹感） */
.paper-back::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
      45deg,
      rgba(130, 110, 90, 0.03) 0px,
      rgba(130, 110, 90, 0.03) 1px,
      transparent 1px,
      transparent 6px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(150, 135, 110, 0.02) 0px,
      rgba(150, 135, 110, 0.02) 1px,
      transparent 1px,
      transparent 12px
    );
  pointer-events: none;
  border-radius: inherit;
}

/* 底层纸微弱折角痕迹 */
.paper-back::after {
  content: "";
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, transparent 50%, rgba(90, 70, 50, 0.05) 50%);
  pointer-events: none;
  border-radius: 0 0 2px 0;
}

/* ========= 上层主卡片 —— 纸张质感强化 ========= */
.paper-front {
  position: relative;
  background: #ffffff;
  /* 🔧 优化：增强纸张纤维感 */
  background-image: repeating-linear-gradient(
      45deg,
      rgba(190, 175, 150, 0.03) 0px,
      rgba(190, 175, 150, 0.03) 2px,
      transparent 2px,
      transparent 8px
    ),
    radial-gradient(circle at 30% 20%, rgba(210, 195, 175, 0.04) 1px, transparent 1.5px);
  background-size: 16px 16px, 22px 22px;
  border-radius: 2px 2px 2px 2px;
  /* 🔧 优化：更柔和的投影 */
  box-shadow: 0 6px 18px rgba(60, 50, 40, 0.05), 0 2px 4px rgba(40, 30, 20, 0.02),
    inset 0 1px 0 rgba(255, 255, 250, 0.9);
  /* , inset 0 0 0 1px rgba(250, 245, 235, 0.5); */
  padding: 2rem 2rem 2.2rem 2rem;
  z-index: 2;
  transition: box-shadow 0.25s, transform 0.2s;
}

/* 纸张边缘内阴影 —— 模拟纸张厚度 */
.paper-front::before {
  content: "";
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border-radius: 2px;
  background: transparent;
  /* box-shadow: inset 0 0 0 1px rgba(230, 220, 205, 0.3); */
  pointer-events: none;
}

/* ********** 折角效果 —— 尺寸优化 ********** */
.paper-front::after {
  content: "";
  position: absolute;
  bottom: 0;
  right: 0;
  /* 🔧 优化：折角更小更精致 */
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, transparent 48%, #f3f0ea 52%, #fcfaf5 95%);
  box-shadow: -1px -1px 4px rgba(0, 0, 0, 0.02),
    inset -1px -1px 0 rgba(255, 250, 240, 0.4);
  border-radius: 0 0 2px 0;
  z-index: 3;
  pointer-events: none;
  transition: all 0.2s ease;
}

/* 折角阴影渐变 */
.paper-front .fold-shadow {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 48px;
  height: 48px;
  z-index: 2;
  background: radial-gradient(
    ellipse at 70% 70%,
    rgba(80, 65, 45, 0.06) 0%,
    transparent 70%
  );
  pointer-events: none;
  border-radius: 0 0 2px 0;
}

/* 折角高光 */
.paper-front .fold-highlight {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 250, 0.6) 0%,
    rgba(245, 240, 230, 0.1) 60%,
    transparent
  );
  pointer-events: none;
  z-index: 3;
  border-radius: 0 0 2px 0;
}

/* 折痕压线 */
.crease-effect {
  position: absolute;
  bottom: 36px;
  right: 36px;
  width: 20px;
  height: 1.5px;
  background: rgba(100, 80, 60, 0.1);
  transform: rotate(45deg);
  transform-origin: bottom right;
  z-index: 4;
  pointer-events: none;
  border-radius: 2px;
  box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
}

/* 内容区域样式保持原样（略） */

/* 响应式调整 */
@media (max-width: 560px) {
  .paper-front {
    padding: 1.5rem 1.5rem 1.8rem 1.5rem;
  }
  .paper-front::after {
    width: 38px;
    height: 38px;
  }
  .paper-front .fold-shadow,
  .paper-front .fold-highlight {
    width: 38px;
    height: 38px;
  }
  .crease-effect {
    bottom: 28px;
    right: 28px;
    width: 16px;
  }
  .paper-back {
    top: 3px;
    left: -2px;
    right: 2px;
    bottom: -3px;
  }
  .wider {
    margin-left: -1.5rem;
    margin-right: -1.5rem;
    padding: 1.5rem 1.5rem;
  }
}

/* 悬停时微微浮起 */
/* .card-stack:hover .paper-front {
  box-shadow: 0 12px 26px rgba(60, 50, 40, 0.08), 0 2px 5px rgba(40, 30, 20, 0.02);
  transform: translateY(-1px);
}
.card-stack:hover .paper-back {
  transform: rotate(-0.2deg) translate(1px, 2px);
} */

/* 滚动条样式（保留） */
.markdown-body pre::-webkit-scrollbar {
  height: 6px;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1efe8;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb {
  background: #cdc0ab;
  border-radius: 2px;
}
</style>
