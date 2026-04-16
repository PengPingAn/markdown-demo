<!-- src/components/TechIcon.vue -->
<template>
  <component :is="iconComponent" v-if="iconComponent" :size="size" class="tech-icon" />
  <span v-else class="tech-icon-fallback">{{ fallbackText }}</span>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";

const props = defineProps<{
  language: string;
  size?: number | string;
}>();

const sizeValue =
  typeof props.size === "number" ? `${props.size}px` : props.size || "20px";

const languageIconMap: Record<string, () => Promise<any>> = {
  // TypeScript 和 JavaScript 系列
  ts: () => import("@devicon/vue/typescript/original"),
  typescript: () => import("@devicon/vue/typescript/original"),
  js: () => import("@devicon/vue/javascript/original"),
  javascript: () => import("@devicon/vue/javascript/original"),
  jsx: () => import("@devicon/vue/javascript/original"),

  // 前端框架
  vue: () => import("@devicon/vue/vuejs/original"),
  vuejs: () => import("@devicon/vue/vuejs/original"),
  react: () => import("@devicon/vue/react/original"),
  reactjs: () => import("@devicon/vue/react/original"),
  angular: () => import("@devicon/vue/angularjs/original"),

  // CSS 相关
  html: () => import("@devicon/vue/html5/original"),
  html5: () => import("@devicon/vue/html5/original"),
  css: () => import("@devicon/vue/css3/original"),
  css3: () => import("@devicon/vue/css3/original"),
  scss: () => import("@devicon/vue/sass/original"),
  sass: () => import("@devicon/vue/sass/original"),
  tailwind: () => import("@devicon/vue/tailwindcss/original"),
  tailwindcss: () => import("@devicon/vue/tailwindcss/original"),

  // 其他语言和工具
  py: () => import("@devicon/vue/python/original"),
  python: () => import("@devicon/vue/python/original"),
  json: () => import("@devicon/vue/json/original"),
  java: () => import("@devicon/vue/java/original"),
  go: () => import("@devicon/vue/go/original"),
  rust: () => import("@devicon/vue/rust/original"),
  cpp: () => import("@devicon/vue/cplusplus/original"),
  csharp: () => import("@devicon/vue/csharp/original"),
  php: () => import("@devicon/vue/php/original"),
  ruby: () => import("@devicon/vue/ruby/original"),
  swift: () => import("@devicon/vue/swift/original"),
  kotlin: () => import("@devicon/vue/kotlin/original"),
  docker: () => import("@devicon/vue/docker/original"),
  git: () => import("@devicon/vue/git/original"),
  mysql: () => import("@devicon/vue/mysql/original"),
  postgresql: () => import("@devicon/vue/postgresql/original"),
  mongodb: () => import("@devicon/vue/mongodb/original"),

  // 默认 fallback
  default: () => import("@devicon/vue/devicon/original"),
};

const iconComponent = computed(() => {
  const lang = props.language.toLowerCase();
  const importer = languageIconMap[lang] || languageIconMap.default;
  return defineAsyncComponent(importer);
});

const fallbackText = computed(() => {
  const lang = props.language.toLowerCase();
  const fallbackMap: Record<string, string> = {
    ts: "TS",
    js: "JS",
    vue: "Vue",
    react: "React",
    html: "HTML",
    css: "CSS",
    py: "Python",
    json: "JSON",
  };
  return fallbackMap[lang] || lang.slice(0, 2).toUpperCase();
});
</script>

<style scoped>
.tech-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tech-icon-fallback {
  font-family: monospace;
  font-weight: 600;
  font-size: 0.75rem;
}
</style>
