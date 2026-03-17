import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [    {
      path: "/", // 访问根路径时渲染该页面
      name: "home", // 可选，用于路由命名
      component: IndexView, // 指向 views/index.vue
    },],
})

export default router
