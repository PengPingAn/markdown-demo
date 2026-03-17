import { createHighlighter } from 'shiki'

export async function initMarkdownCustomCode(container: HTMLElement | Document = document) {
  const highlighter = await createHighlighter({ themes: ['nord'] })

  const wrappers = container.querySelectorAll('.custom-code-wrapper')
  console.log('-------------------', wrappers)

  wrappers.forEach((wrapper) => {
    const contentEl = wrapper.querySelector('.custom-code-content') as HTMLElement
    const btn = wrapper.querySelector('button') as HTMLElement
    if (!contentEl || !btn) {
      console.log('Wrapper missing content or button:', wrapper)
      return
    }

    const code = decodeURIComponent(wrapper.dataset.code || '')
    const lang = wrapper.dataset.lang || 'text'

    console.log('Front-end rendering code:', code) // 🔥 打印这里

    contentEl.innerHTML = highlighter.codeToHtml(code, { lang })

    contentEl.style.maxHeight = '400px'
    contentEl.style.overflow = 'auto'

    let expanded = false
    btn.addEventListener('click', () => {
      expanded = !expanded
      contentEl.style.maxHeight = expanded ? 'none' : '400px'
      btn.textContent = expanded ? '收起' : '展开全部'
    })
  })
}
