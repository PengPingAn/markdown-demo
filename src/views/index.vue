<template>
  <div class="p-8 max-w-[1000px] m-auto">
    <div class="text-3xl font-bold text-blue-600">Markdown 自定义语法演示</div>
    <MarkdownRenderer :source="markdownText" />
  </div>
</template>

<script setup lang="ts">
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import mdGrammar from "./mdGrammar.md?raw";
import { ref } from "vue";
import svgRight from "@/assets/svg/carousel-right.svg?raw";

const markdownText = ref(mdGrammar);
</script>
