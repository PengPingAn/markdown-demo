# markdown-demo

一个同时支持本地演示和 npm 发布的 Vue 3 Markdown 渲染组件仓库。

## 现在的结构

- `pnpm dev`: 继续启动本地 demo 站点
- `pnpm build`: 同时构建 demo 和 npm library
- `pnpm build:lib`: 仅构建可发布到 npm 的库产物

库产物输出到 `dist/lib`，demo 站点产物仍然输出到 `dist`，两者互不影响。

## npm 发布内容

当前包对外暴露：

- `markdown-demo`: 组件与工具函数入口
- `markdown-demo/style.css`: 样式入口

主入口导出：

- `MarkdownRenderer`
- `useMarkdown`
- `setupMarkdownPlugins`
- `markdownConfig`
- `videoPlugin`
- `initHighlighter`

## 本地开发

```sh
pnpm install
pnpm dev
```

## 构建

```sh
pnpm build
```

只构建 npm 包：

```sh
pnpm build:lib
```

## 在其它项目中使用

```ts
import { MarkdownRenderer } from "markdown-demo";
import "markdown-demo/style.css";
```

```vue
<script setup lang="ts">
import { MarkdownRenderer } from "markdown-demo";
import "markdown-demo/style.css";

const source = `# Hello\n\n:::warning 注意\n这里是内容\n:::`;
</script>

<template>
  <MarkdownRenderer :source="source" :show-toggle="false" />
</template>
```

如果你只想复用 markdown-it 插件：

```ts
import MarkdownIt from "markdown-it";
import { setupMarkdownPlugins, initHighlighter } from "markdown-demo";

await initHighlighter();

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

setupMarkdownPlugins(md);
const html = md.render("# Hello");
```

## 发布前需要确认

- 将 `package.json` 里的 `name` 改成你最终要发布的 npm 包名
- 如果要公开发布，确认该包名在 npm 上可用
- 如需私有作用域发布，可改成 `@your-scope/package-name`
