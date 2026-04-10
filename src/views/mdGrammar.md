# 一级标题

> [!NOTE]
> 用于传达有助于理解但非关键的信息，适合补充背景、提示或建议。

# 二级标题

> [!NOTE]
> 用于传达有助于理解但非关键的信息，适合补充背景、提示或建议。

## 三级标题

> [!NOTE]
> 用于传达有助于理解但非关键的信息，适合补充背景、提示或建议。

### 四级标题

> [!NOTE]
> 用于传达有助于理解但非关键的信息，适合补充背景、提示或建议。

# X 卡片

:::video src=https://x.com/__oQuery/status/2034516604726427758
推特 推文
:::

# 便签

::: sticky-note

@size[25px]{灵感碎片}

- 三层堆叠纸张设计
- 支持 **Markdown** 语法
- 网格底纹 + 彩色装饰条

> 关于女性、性教育和传统观念。
> 关于父母的经历。电影中虽然是女主的妈妈，但其实我感觉不只是影射母亲，可能是 70 年代所有的家长，都没有真正地活好自己，一直是在别人的迁就下，带着面具生活。

:::

# 引用

::: quotation
这是一段引用回忆的文字。(默认颜色)
可能很长，包含情绪、反思，像日记一样。
:::

# 另一种风格的便签

::: paper-note
**灵感**：设计不只是它看起来怎样，还在于它如何工作。  
— ==乔布斯==

- 保持简单
- 追求本质
  :::

# 影视卡片

:::card url=https://www.themoviedb.org/movie/1462229-3 title="飞驰人生3 " image=https://image.tmdb.org/t/p/w500/cL5vAK6bUHYWTOnypi34mzzWI8X.jpg rating=7.1
巴音布鲁克最后一站收官后，张驰（沈腾 饰）受邀作为车队主教练征战全新赛事“沐尘100拉力赛”，“野生车手”走上国际舞台！面对高手如云的全新赛道，孙宇强（尹正 饰）、记星（张本煜 饰）一如既往协同作战，林臻东（黄景瑜 饰）等实力车手应邀强势集结，一支凝聚了顶配速度与信念的车队就此成立！然而，张驰发现真正的挑战仿佛并非来自比赛本身，赛场之外暗流涌动，让他们飞驰之路充满变数……
:::

# Magic UI 文本效果

[__Magic UI下划线语法]

[==Magic UI高亮语法]

# 行内代码

`inline code`

# 代码块

```ts
<script setup lang="ts">
const route = useRoute()
const albumIdParam = computed(() => route.params.id as string)
@linkCard[标题][https://q2.itc.cn/q_70/images03/20241013/6fe9a539a055473b8677c734558b462f.jpeg][这是一个描述](https://icon-sets.iconify.design/?query=link&search-page=1)

const items = ref<any[]>([])
const currentImageIndex = ref<number>(0)
const showDetail = ref(false)

const pageSize = 40
const offsetRef = ref(0)
const loadingRef = ref(false)
const noMoreRef = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const mapItems = (list: any[]) =>
  list.map((r: any, idx: number) => ({
    id: r.id,
    url: r.url,
    thumbUrl: r.thumbUrl,
    title: r.filename,
    meta: r.storageType === 'aliyun-oss' ? '阿里云' : r.storageType === 'local' ? '本地' : '',
    date: r.createdAt,
    _index: offsetRef.value + idx,
  }))

const fetchMore = async () => {
  if (loadingRef.value || noMoreRef.value) return
  loadingRef.value = true
  try {
    const query: any = { limit: pageSize, offset: offsetRef.value }
    if (albumIdParam.value !== 'all') query.albumId = Number(albumIdParam.value)
    const res: any = await $fetch('/api/photo/query', { query })
    const mapped = mapItems(res.data || [])
    items.value.push(...mapped)
    offsetRef.value += mapped.length
    if (mapped.length < pageSize) noMoreRef.value = true
  } finally {
    loadingRef.value = false
  }

  const res: any = await $fetch('/api/photo/count', { query: { albumId: albumIdParam.value } })
}

const initLoad = async () => {
  items.value = []
  offsetRef.value = 0
  noMoreRef.value = false
  await fetchMore()
}

onMounted(async () => {
  await initLoad()
  observer = new IntersectionObserver(
    async (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting) await fetchMore()
    },
    { root: null, rootMargin: '0px', threshold: 0.1 }
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

onBeforeUnmount(() => {
  if (observer && sentinelRef.value) observer.unobserve(sentinelRef.value)
  observer = null
})

watch(
  () => albumIdParam.value,
  async () => {
    await initLoad()
  }
)

const openImageDetail = (index: number) => {
  currentImageIndex.value = index
  showDetail.value = true
}
const closeDetail = () => (showDetail.value = false)
</script>
```

# 语法高亮

==落日西沉，炊烟袅袅。==

# 链接卡片

@linkCard[标题][https://q2.itc.cn/q_70/images03/20241013/6fe9a539a055473b8677c734558b462f.jpeg][这是一个描述](https://icon-sets.iconify.design/?query=link&search-page=1)

# 折叠卡片

:::collapse title=点我展开内容
==春风若有怜花意，可否许我再少年？==

> _“人间浮躁，尘世喧嚣。不曾想过去桃花源与世界隔绝的人间圣地，只想拥有一片属于自己的宁境。 不曾去过森林，却想在森林中聆听大自然的声音，享受这一片宁静。”_

- 列表
  :::

# 轮播图

:::carousel
https://ss3.baidu.com/9fo3dSag_xI4khGko9WTAnF6hhy/zhidao/pic/item/18d8bc3eb13533fae0a4ef61acd3fd1f41345b6a.jpg
https://pic4.zhimg.com/v2-57ed22547faf8635adb245964aee8a0b_r.jpg
https://www.2008php.com/2013_Website_appreciate/2013-03-17/20130317005445.jpg
https://p7.itc.cn/q_70/images03/20240101/469a5b2a96a346318d190fd0acfe20c3.jpeg
https://pic1.zhimg.com/80/v2-2464893e23ed8c3d2760b446015ef8e8_r.jpg
:::

# 提示框

> [!NOTE]
> 用于传达有助于理解但非关键的信息，适合补充背景、提示或建议。

> [!WARNING]
> 用于强调潜在风险或操作后果，需引起用户足够注意。

> [!Danger]
> 用于突出极其重要或危险的信息，即使用户快速浏览也必须注意到。

# 外部链接嵌套

:::video src=https://player.bilibili.com/player.html?isOutside=true&aid=626357031&bvid=BV1yt4y1Q7SS&cid=210738676&p=1&autoplay=false
敢杀我的马？
:::

:::video src=https://www.youtube.com/embed/LmZD-TU96q4?si=X9ox7r2tjK-n7Zc4
油管视频
:::

# 隐藏文本

||你知道的太多了。||

# 链接

@Pingan[随机头像 API](https://api.multiavatar.com/_随机数.png)

# 提示横幅

::: warning
warning
:::

::: error
error
:::

# 翻转卡片

:::textflip title=我一定会找回你的
守得云开见月明 我们会白头偕老的
:::

# 自定义文字大小

@size[25px]{这是一段文字} 这是默认大小
