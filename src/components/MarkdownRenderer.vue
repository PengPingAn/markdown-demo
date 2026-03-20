<template>
  <div ref="markdownContainer" v-html="renderedContent" @click="handleExpandClick"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useMarkdown } from "@/composables/useMarkdown";
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

const { render } = useMarkdown();

const renderContent = async () => {
  renderedContent.value = await render(props.source);
};

onMounted(async () => {
  await renderContent();
  await nextTick();
  initCodeBlocks();
  enhanceCodeBlocks();
  renderEmbeds();
});

watch(
  () => props.source,
  async () => {
    await renderContent();
    await nextTick();
    initCodeBlocks();
    enhanceCodeBlocks();
    renderEmbeds();
  }
);
</script>

<style src="../styles/markdown/md-style.scss"></style>
