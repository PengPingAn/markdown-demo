
`inline code`

```javascript
const route = useRoute()
```

```javascript
<script setup lang="ts">
const route = useRoute()
const albumIdParam = computed(() => route.params.id as string)

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

``` ts
==落日西沉，炊烟袅袅。==
```

==落日西沉，炊烟袅袅。==

``` ts
@linkCard[标题][https://q2.itc.cn/q_70/images03/20241013/6fe9a539a055473b8677c734558b462f.jpeg][这是一个描述](https://icon-sets.iconify.design/?query=link&search-page=1)
```

@linkCard[标题][https://q2.itc.cn/q_70/images03/20241013/6fe9a539a055473b8677c734558b462f.jpeg][这是一个描述](https://icon-sets.iconify.design/?query=link&search-page=1)

``` ts
:::collapse title=点我展开内容
==春风若有怜花意，可否许我再少年？==

> *“人间浮躁，尘世喧嚣。不曾想过去桃花源与世界隔绝的人间圣地，只想拥有一片属于自己的宁境。 不曾去过森林，却想在森林中聆听大自然的声音，享受这一片宁静。”*

- 列表
:::
```

:::collapse title=点我展开内容
==春风若有怜花意，可否许我再少年？==

> _“人间浮躁，尘世喧嚣。不曾想过去桃花源与世界隔绝的人间圣地，只想拥有一片属于自己的宁境。 不曾去过森林，却想在森林中聆听大自然的声音，享受这一片宁静。”_

- 列表
  :::

``` ts
:::carousel
https://ss3.baidu.com/9fo3dSag_xI4khGko9WTAnF6hhy/zhidao/pic/item/18d8bc3eb13533fae0a4ef61acd3fd1f41345b6a.jpg
https://pic4.zhimg.com/v2-57ed22547faf8635adb245964aee8a0b_r.jpg
https://www.2008php.com/2013_Website_appreciate/2013-03-17/20130317005445.jpg
https://p7.itc.cn/q_70/images03/20240101/469a5b2a96a346318d190fd0acfe20c3.jpeg
https://pic1.zhimg.com/80/v2-2464893e23ed8c3d2760b446015ef8e8_r.jpg
:::
```

:::carousel
https://ss3.baidu.com/9fo3dSag_xI4khGko9WTAnF6hhy/zhidao/pic/item/18d8bc3eb13533fae0a4ef61acd3fd1f41345b6a.jpg
https://pic4.zhimg.com/v2-57ed22547faf8635adb245964aee8a0b_r.jpg
https://www.2008php.com/2013_Website_appreciate/2013-03-17/20130317005445.jpg
https://p7.itc.cn/q_70/images03/20240101/469a5b2a96a346318d190fd0acfe20c3.jpeg
https://pic1.zhimg.com/80/v2-2464893e23ed8c3d2760b446015ef8e8_r.jpg
:::

``` ts
:::card url=https://www.disneyplus.com/en-jp/browse/entity-b29d5852-c94c-4d05-beb9-bfd2f227fd12 title="血谜拼图（나인 퍼즐）" image=https://image.tmdb.org/t/p/w500/xWH7Tyg5FXh90hN3IPUeBYpprqk.jpg rating=7
异罗是叔叔死亡的唯一目击者，她为了查明案件真相而成为犯罪侧写师。重案组刑警瀚泉执着地怀疑异罗就是嫌犯。伴随着时隔十年送达的拼图，命案再度发生。异罗及瀚泉能阻止这起拼图连环杀人案吗？
:::
```

:::card url=https://www.disneyplus.com/en-jp/browse/entity-b29d5852-c94c-4d05-beb9-bfd2f227fd12 title="血谜拼图（나인 퍼즐）" image=https://image.tmdb.org/t/p/w500/xWH7Tyg5FXh90hN3IPUeBYpprqk.jpg rating=7
异罗是叔叔死亡的唯一目击者，她为了查明案件真相而成为犯罪侧写师。重案组刑警瀚泉执着地怀疑异罗就是嫌犯。伴随着时隔十年送达的拼图，命案再度发生。异罗及瀚泉能阻止这起拼图连环杀人案吗？
:::

``` ts
> [!NOTE]
> 用于传达有助于理解但非关键的信息，适合补充背景、提示或建议。

> [!WARNING]
> 用于强调潜在风险或操作后果，需引起用户足够注意。

> [!Danger]
> 用于突出极其重要或危险的信息，即使用户快速浏览也必须注意到。
```

> [!NOTE]
> 用于传达有助于理解但非关键的信息，适合补充背景、提示或建议。

> [!WARNING]
> 用于强调潜在风险或操作后果，需引起用户足够注意。

> [!Danger]
> 用于突出极其重要或危险的信息，即使用户快速浏览也必须注意到。

``` ts
:::video src=https://player.bilibili.com/player.html?isOutside=true&aid=626357031&bvid=BV1yt4y1Q7SS&cid=210738676&p=1&autoplay=false
敢杀我的马？
:::
```

:::video src=https://player.bilibili.com/player.html?isOutside=true&aid=626357031&bvid=BV1yt4y1Q7SS&cid=210738676&p=1&autoplay=false
敢杀我的马？
:::

``` ts
||你知道的太多了。||
```

||你知道的太多了。||

``` ts
@Pingan[随机头像API](https://api.multiavatar.com/_随机数.png)
```

@Pingan[随机头像 API](https://api.multiavatar.com/_随机数.png)

``` ts
::: warning
warning
:::

::: error
error
:::
```

::: warning
warning
:::

::: error
error
:::

``` ts
:::textflip title=我一定会找回你的
守得云开见月明 我们会白头偕老的
:::
```

:::textflip title=我一定会找回你的
守得云开见月明 我们会白头偕老的
:::

``` ts
@size[25px]{这是一段文字} 这是默认大小
```

@size[25px]{这是一段文字} 这是默认大小

``` ts
::: quotation
这是一段引用回忆的文字。(默认颜色)
可能很长，包含情绪、反思，像日记一样。
:::

::: quotation color[#bdeedf]
这是一段引用回忆的文字。(自定义颜色)
可能很长，包含情绪、反思，像日记一样。
:::
```

::: quotation
这是一段引用回忆的文字。(默认颜色)
可能很长，包含情绪、反思，像日记一样。
:::

::: quotation color[#bdeedf]
这是一段引用回忆的文字。(自定义颜色)
可能很长，包含情绪、反思，像日记一样。
:::

``` ts
[__Magic UI下划线语法]

[==Magic UI高亮语法]
```

[__Magic UI下划线语法]

[==Magic UI高亮语法]
