<template>
  <div class="markdown-renderer prose">
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

// 定义事件：目录更新时触发
const emit = defineEmits<{
  (e: "toc-updated", toc: { id: string; text: string; level: number }[]): void;
}>();

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

// 目录数据
const tocItems = ref<{ id: string; text: string; level: number }[]>([]);

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

// 从 Markdown 源码中提取标题生成目录
const extractToc = (markdown: string) => {
  const lines = markdown.split(/\r?\n/);
  const items: { id: string; text: string; level: number }[] = [];
  const headingRegex = /^(#{1,6})\s+(.*)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim();
      // 去除内联格式，生成纯文本用于 id
      const plainText = rawText
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`(.*?)`/g, "$1");
      let id = plainText
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "");
      // 处理重复 id
      let finalId = id;
      let suffix = 1;
      while (items.some((item) => item.id === finalId)) {
        finalId = `${id}-${suffix++}`;
      }
      items.push({ id: finalId, text: rawText, level });
    }
  }
  return items;
};

// 更新目录并发送给父组件
const updateToc = () => {
  const newToc = extractToc(editSource.value);
  tocItems.value = newToc;
  emit("toc-updated", newToc);
};

// 为渲染后的 DOM 中的标题元素添加对应 id
const addHeadingIds = () => {
  if (!markdownContainer.value) return;
  const headings = markdownContainer.value.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach((heading) => {
    const text = heading.textContent || "";
    const plainText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1");
    let id = plainText
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    // 保证唯一性（简单处理，若冲突则加后缀）
    let finalId = id;
    let suffix = 1;
    while (markdownContainer.value!.querySelector(`#${finalId}`)) {
      finalId = `${id}-${suffix++}`;
    }
    heading.id = finalId;
  });
};

// 切换模式
const toggleMode = () => {
  showSource.value = !showSource.value;
};

// 监听模式切换和内容变化
watch(showSource, async (newVal) => {
  if (!newVal) {
    await renderContent(editSource.value);
    await nextTick();
    addHeadingIds();
    initCodeBlocks();
    enhanceCodeBlocks();
    renderEmbeds();
  }
});

// 监听 editSource 变化，实时更新目录并重新渲染预览
watch(editSource, async (newVal) => {
  updateToc(); // 更新目录并发送
  if (!showSource.value) {
    await renderContent(newVal);
    await nextTick();
    addHeadingIds();
    initCodeBlocks();
    enhanceCodeBlocks();
    renderEmbeds();
  }
});

// 监听外部 source 变化，同步到 editSource
watch(
  () => props.source,
  (newVal) => {
    if (newVal !== editSource.value) {
      editSource.value = newVal;
      updateToc(); // 外部内容变化时也更新目录
      if (!showSource.value) {
        renderContent(newVal).then(() => {
          nextTick(() => {
            addHeadingIds();
            initCodeBlocks();
            enhanceCodeBlocks();
            renderEmbeds();
          });
        });
      }
    }
  }
);

onMounted(async () => {
  updateToc(); // 初始提取目录并发送
  await renderContent(editSource.value);
  if (!showSource.value) {
    await nextTick();
    addHeadingIds();
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
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
