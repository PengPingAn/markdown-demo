<template>
  <div class="markdown-renderer">
    <!-- 可选的切换按钮 -->
    <div v-if="showToggle" class="toggle-bar">
      <button @click="toggleMode" class="toggle-btn">
        {{ showSource ? "预览" : "源码" }}
      </button>
    </div>

    <!-- 预览模式：渲染后的 HTML -->
    <div
      v-show="!showSource"
      ref="markdownContainer"
      v-html="renderedContent"
      @click="handleExpandClick"
    ></div>

    <!-- 源码模式：可编辑的文本域 -->
    <textarea
      v-show="showSource"
      v-model="editSource"
      class="source-editor"
      placeholder="在此编辑 Markdown 源码..."
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useMarkdown } from "@/composables/useMarkdown";
import { useCodeBlocks } from "@/composables/useCodeBlocks";
import { useTwitterEmbed } from "@/composables/useTwitterEmbed";

const props = withDefaults(
  defineProps<{
    source: string;
    showToggle?: boolean;
  }>(),
  {
    showToggle: true,
  }
);

// 可编辑的源文本，初始为传入的 source
const editSource = ref(props.source);
const showSource = ref(false); // false: 预览模式, true: 源码模式
const renderedContent = ref("");
const markdownContainer = ref<HTMLElement>();

// 代码块处理
const { initCodeBlocks, handleExpandClick, enhanceCodeBlocks } = useCodeBlocks(
  markdownContainer
);
// 推特嵌入处理
const { renderEmbeds } = useTwitterEmbed(markdownContainer);

const { render } = useMarkdown();

const renderContent = async (source: string) => {
  renderedContent.value = await render(source);
};

// 切换模式
const toggleMode = () => {
  showSource.value = !showSource.value;
};

// 当从源码模式切回预览模式时，使用最新的 editSource 重新渲染
watch(showSource, async (newVal) => {
  if (!newVal) {
    await renderContent(editSource.value);
    await nextTick();
    initCodeBlocks();
    enhanceCodeBlocks();
    renderEmbeds();
  }
});

// 监听外部 source 变化，同步到 editSource（外部重置时）
watch(
  () => props.source,
  (newVal) => {
    if (newVal !== editSource.value) {
      editSource.value = newVal;
      // 如果当前是预览模式，也重新渲染
      if (!showSource.value) {
        renderContent(newVal);
      }
    }
  }
);

onMounted(async () => {
  await renderContent(editSource.value);
  if (!showSource.value) {
    await nextTick();
    initCodeBlocks();
    enhanceCodeBlocks();
    renderEmbeds();
  }
});
</script>

<style scoped>
.markdown-renderer {
  position: relative;
}

.toggle-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  text-align: right;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-bottom: 1px solid #e5e7eb;
}

.toggle-btn {
  padding: 4px 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-btn:hover {
  background-color: #2563eb;
}

.source-editor {
  width: 100%;
  min-height: 80vh;
  padding: 16px;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #24292e;
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.source-editor:focus {
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}
</style>

<style src="../styles/markdown/md-style.scss"></style>
