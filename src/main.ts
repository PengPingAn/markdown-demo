import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css' 

import App from './App.vue'
import router from './router'

import { initMarkdownCollapse, initMarkdownHighlighters } from './plugins/markdown/mdCollapse'
import { initMarkdownCarousel } from './plugins/markdown/mdCarousel'
import {
  initHoverCard,
  initCardHoverEffect,
  initFlipCardEffect
} from './plugins/markdown/mdHoverLink'
import { initMarkdownCustomCode } from './plugins/markdown/markdown-code-block'
import { initHighlighter } from './plugins/markdown/highlighter' 

const app = createApp(App)

app.use(createPinia())
app.use(router)


let disposeHoverCard: (() => void) | null = null
let disposeCarousel: (() => void) | null = null
let disposeCollapse: (() => void) | null = null
let disposeFlipCard: (() => void) | null = null
let disposeFlipUnderline: (() => void) | null = null
let disposeCodeBlock: (() => void) | null = null

router.afterEach(() => {
  nextTick(() => {
    // 先卸载旧的绑定
    disposeCarousel?.()
    disposeHoverCard?.()
    disposeCollapse?.()
    disposeFlipCard?.()
    disposeFlipUnderline?.()
    if (typeof disposeCodeBlock === 'function') disposeCodeBlock()

    // 初始化新绑定
    disposeCarousel = initMarkdownCarousel()
    disposeHoverCard = initHoverCard()
    disposeCollapse = initMarkdownCollapse()
    disposeFlipUnderline = initMarkdownHighlighters()
    initCardHoverEffect()

    // 初始化翻转卡片效果
    disposeFlipCard = initFlipCardEffect()

    requestAnimationFrame(() => {
      setTimeout(() => {
        disposeFlipCard = initFlipCardEffect()
      }, 30)
    })

    nextTick(() => {
      const container = document.querySelector('.md-editor-preview') as HTMLElement
      if (container) {
        disposeCodeBlock = initMarkdownCustomCode(container) || (() => {})
      }
    })
  })
})

initHighlighter().then(() => {
  app.mount('#app')
})
