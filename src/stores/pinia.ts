import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isLoading: false,
    isLoading2: false,
    isFull: false,
    isMaxHeight: false
  }),
  actions: {
    start() {
      this.isLoading = true
    },
    end() {
      this.isLoading = false
    },
    open(options?: { isFull?: boolean; isMaxHeight?: boolean }) {
      this.isLoading2 = true
      this.isFull = options?.isFull ?? false
      this.isMaxHeight = options?.isMaxHeight ?? false
    },
    close() {
      this.isLoading2 = false
      this.isFull = false
      this.isMaxHeight = false
    }
  }
})

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: '',
    webSite: '',
    browser: '',
    os: '',
    address: ''
  }),
  actions: {
    setUser(name: string, email: string, webSite: string) {
      this.name = name
      this.email = email
      this.webSite = webSite
    }
  },
  persist: true // 开启持久化
})

export const useEditorThemeStore = defineStore('editorTheme', {
  state: () => ({
    editorTheme: 'light'
  }),
  actions: {
    setUser(editorTheme: string) {
      this.editorTheme = editorTheme
    }
  },
  persist: true // 开启持久化
})

export const useWebSocketStore = defineStore('webSocket', {
  state: () => ({
    socketId: ''
  }),
  actions: {
    setUser(socketId: string) {
      this.socketId = socketId
    }
  },
  persist: true // 开启持久化
})

export const useHeaderStore = defineStore('header', {
  state: () => ({
    titleType: 0,
    isInArticlePage: false, // 是否进入文章页面
    articleTitle: '',
    articleCategory: ''
  }),
  actions: {
    setInArticlePage(flag: boolean, type: number = 0) {
      this.isInArticlePage = flag
      this.titleType = type
    },
    setInArticleTitle(title: string) {
      this.articleTitle = title
    },
    setInArticleCategory(category: string) {
      this.articleCategory = category
    }
  },
  persist: true // 可选：是否希望刷新后还保持状态
})
export const useUserInfoStore = defineStore('userInfo', {
  state: () => ({
    account: '' as string | null,
    head: '' as string | null,
    userId: '' as string | null,
    userName: '' as string | null
  }),
  actions: {
    setUserInfo(account: string | null = null, userId: string | null = null) {
      this.account = account
      this.userId = userId
    }
  },
  persist: true // 刷新后保持状态
})

export const useArticleListStore = defineStore('articleList', () => {
  const topArticles: Ref<any[]> = ref([])
  const articles: Ref<any[]> = ref([])
  const groupedArticles: Ref<{ year: number; list: any[] }[]> = ref([])
  const totalNum: Ref<number> = ref(0)
  const finished: Ref<boolean> = ref(false)
  const pageIndex: Ref<number> = ref(1)
  const scrollTop: Ref<number> = ref(0)

  const reset = () => {
    topArticles.value = []
    articles.value = []
    groupedArticles.value = []
    totalNum.value = 0
    finished.value = false
    pageIndex.value = 1
    scrollTop.value = 0
  }

  return {
    topArticles,
    articles,
    groupedArticles,
    totalNum,
    finished,
    pageIndex,
    scrollTop,
    reset
  }
})

export const useHomePageStore = defineStore('homePage', () => {
  const articles: Ref<any[]> = ref([])
  const firstRow: Ref<any[]> = ref([])
  const secondRow: Ref<any[]> = ref([])
  const tags: Ref<any[]> = ref([])
  const scrollTop: Ref<number> = ref(0)

  const reset = () => {
    articles.value = []
    firstRow.value = []
    secondRow.value = []
    tags.value = []
    scrollTop.value = 0
  }

  return {
    articles,
    firstRow,
    secondRow,
    tags,
    scrollTop,
    reset
  }
})
