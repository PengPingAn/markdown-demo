import { annotate } from 'rough-notation'

export function initMarkdownCollapse(container: HTMLElement | Document = document) {
  const handler = (e: Event) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('md-collapse-title')) {
      const body = target.nextElementSibling as HTMLElement
      if (!body) return

      const isOpen = body.classList.contains('open')

      const icon = target.querySelector('.md-collapse-icon')
      if (icon) {
        icon.classList.toggle('rotate')
      }

      if (isOpen) {
        body.style.height = body.scrollHeight + 'px'
        body.offsetHeight
        body.style.height = '0'
        body.classList.remove('open')
      } else {
        body.classList.add('open')
        const height = body.scrollHeight
        body.style.height = '0'
        body.offsetHeight
        body.style.height = height + 'px'
      }

      body.addEventListener(
        'transitionend',
        () => {
          if (body.classList.contains('open')) {
            body.style.height = 'auto'
          }
        },
        { once: true }
      )
    }
  }

  container.addEventListener('click', handler)

  // 返回一个卸载函数，防止重复绑定或内存泄漏
  return () => container.removeEventListener('click', handler)
}

export function initMarkdownHighlighters(container: HTMLElement | Document = document) {
  const annotations: any[] = []
  const svgs: SVGSVGElement[] = []
  const rafIds: number[] = []

  const rand = (min: number, max: number) => Math.random() * (max - min) + min

  const buildUnderlinePath = (width: number, height: number, phase: number) => {
    let path = `M0 ${height / 2}`
    const step = width / 4
    for (let x = step; x <= width; x += step) {
      const y = height / 2 + Math.sin((x / width) * Math.PI * 2 + phase) * 3 + rand(-1, 1)
      path += ` Q ${x - step / 2},${height / 2 + rand(-1, 1)} ${x},${y}`
    }
    return path
  }

  const initRough = (el: HTMLElement) => {
    if (el.dataset._initialized) return // 防重复初始化
    el.dataset._initialized = 'true'

    const action = el.dataset.action || 'highlight'
    const color = el.dataset.color || '#ffd1dc'
    const annotation = annotate(el, {
      type: action as any,
      color,
      strokeWidth: 1.5,
      animationDuration: 600,
      iterations: 2,
      padding: 2,
      multiline: true
    })
    annotation.show()
    annotations.push(annotation)
  }

  const initUnderline = (el: HTMLElement) => {
    if (el.dataset._initialized) return
    el.dataset._initialized = 'true'

    const width = el.offsetWidth
    if (width === 0) return // 元素还没布局
    const height = 12

    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.setAttribute('preserveAspectRatio', 'none')

    const path = document.createElementNS(svgNS, 'path')
    path.setAttribute('stroke', '#ff9800')
    path.setAttribute('stroke-width', '2.5')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')

    svg.appendChild(path)
    el.appendChild(svg)
    svgs.push(svg)

    let phase = 0
    const animate = () => {
      phase += 0.1
      path.setAttribute('d', buildUnderlinePath(width, height, phase))
      rafIds.push(requestAnimationFrame(animate))
    }
    animate()
  }

  // 初始化现有元素
  const initExisting = () => {
    container.querySelectorAll<HTMLElement>('.highlighter').forEach(initRough)
    container.querySelectorAll<HTMLElement>('.mu-underline').forEach(initUnderline)
  }

  initExisting()

  // 监听 DOM 变化，自动初始化新增的元素
  const observer = new MutationObserver(() => {
    initExisting()
  })
  observer.observe(container, { childList: true, subtree: true })

  // 卸载函数
  return () => {
    observer.disconnect()
    rafIds.forEach((id) => cancelAnimationFrame(id))
    svgs.forEach((svg) => svg.remove())
    annotations.forEach((a) => a.hide && a.hide())
    rafIds.length = 0
    svgs.length = 0
    annotations.length = 0
  }
}
