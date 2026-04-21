<template>
  <div class="markdown-page">
    <div class="top-header">
      <EmptyState />
      <div class="text-3xl font-bold text-blue-600">Markdown 自定义语法演示</div>
    </div>

    <div class="two-column-layout">
      <div class="markdown-content-wrapper">
        <!-- <MarkdownRenderer :source="markdownText" @toc-updated="handleTocUpdate" /> -->
        <NoteCard :content="markdownText" @toc-updated="handleTocUpdate" />
      </div>

      <TableOfContents :toc="toc" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import EmptyState from "@/components/EmptyState.vue";
import TableOfContents from "@/components/markdown/TableOfContents.vue";
import NoteCard from "@/components/markdown/NoteCard.vue";
import mdGrammar from "./mdGrammar.md?raw";
import md2 from "./md2.md?raw";
import md3 from "./md3.md?raw";

const markdownText = ref(md2);
const toc = ref<{ id: string; text: string; level: number }[]>([]);

const handleTocUpdate = (newToc: { id: string; text: string; level: number }[]) => {
  toc.value = newToc;
};
</script>

<style scoped>
.markdown-page {
  max-width: 1200px;
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
@media (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
  }
}
</style>

<style>
/* 保留全局滚动偏移样式 */
.markdown-renderer h1,
.markdown-renderer h2,
.markdown-renderer h3,
.markdown-renderer h4,
.markdown-renderer h5,
.markdown-renderer h6 {
  scroll-margin-top: 80px;
}
</style>
