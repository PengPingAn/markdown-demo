<template>
  <div ref="markdownContainer" v-html="renderedContent" @click="handleExpandClick"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { setupMarkdownPlugins } from "@/plugins/markdown";
import { getInitPromise, getHighlighterSync } from "@/plugins/markdown/highlighter";
import { useCodeBlocks } from "@/composables/useCodeBlocks";
import { useTwitterEmbed } from "@/composables/useTwitterEmbed";

const props = defineProps<{
  source: string;
}>();

const renderedContent = ref("");
const markdownContainer = ref<HTMLElement>();

// 代码块处理
const { initCodeBlocks, handleExpandClick, enhanceCodeBlocks } = useCodeBlocks(
  markdownContainer
);

// 推特嵌入处理
const { renderEmbeds } = useTwitterEmbed(markdownContainer);

// 创建 markdown-it 实例
const createMarkdownIt = () => {
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: (code, lang) => {
      try {
        const highlighter = getHighlighterSync();
        if (lang && highlighter.getLoadedLanguages().includes(lang)) {
          const highlightedCode = highlighter.codeToHtml(code, {
            lang,
            theme: "vitesse-light",
          });
          return `
            <div class="code-block-wrapper">
              <div class="code-block-container">
                ${highlightedCode}
              </div>
              <div class="code-block-expand-wrapper">
                <button class="code-block-expand-btn"><span class="icon-park--to-bottom"></span> 展开</button>
              </div>
            </div>
          `;
        } else {
          return `<pre><code class="language-${lang || "text"}">${md.utils.escapeHtml(
            code
          )}</code></pre>`;
        }
      } catch (e) {
        console.error("Shiki highlighting failed:", e);
        return `<pre><code class="language-${lang || "text"}">${md.utils.escapeHtml(
          code
        )}</code></pre>`;
      }
    },
  });

  setupMarkdownPlugins(md);
  return md;
};

// 渲染内容
const renderContent = async () => {
  await getInitPromise();
  const md = createMarkdownIt();
  const rawHtml = md.render(props.source);

  // DOMPurify 配置：允许推特占位符所需的自定义属性
  renderedContent.value = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["iframe", "div"],
    ADD_ATTR: [
      "style",
      "class",
      "src",
      "allowfullscreen",
      "frameborder",
      "allow",
      "poster",
      "referrerpolicy",
      "title",
      "data-tweet-id",
      "data-tweet-url",
    ],
  });
};

// 初始化
onMounted(async () => {
  await renderContent();
  initCodeBlocks();
  enhanceCodeBlocks();
  await renderEmbeds();
});

// 监听源内容变化
watch(
  () => props.source,
  async () => {
    await renderContent();
    nextTick(async () => {
      initCodeBlocks();
      enhanceCodeBlocks();
      await renderEmbeds();
    });
  }
);
</script>

<style src="../styles/markdown/md-style.scss"></style>
