// export function initMarkdownCarousel(
//     container: HTMLElement | Document = document,
//     autoplayInterval = 3000 // 默认每 3 秒切换
// ) {
//     const wrappers = container.querySelectorAll<HTMLElement>('.carousel-wrapper');
//     const cleanupFns: (() => void)[] = [];

//     wrappers.forEach(wrapper => {
//         const containerEl = wrapper.querySelector<HTMLElement>('.container');
//         const btnPrev = wrapper.querySelector<HTMLElement>('.container-btn.prev');
//         const btnNext = wrapper.querySelector<HTMLElement>('.container-btn.next');
//         const dots = wrapper.querySelectorAll<HTMLElement>('.container-indicators .dot');

//         if (!containerEl || !btnPrev || !btnNext) return;

//         const totalItems = wrapper.querySelectorAll('.container-item').length;
//         let autoplayTimer: ReturnType<typeof setInterval> | null = null;
//         let autoplayDirection: 1 | -1 = 1;
//         let interactionTimeout: ReturnType<typeof setTimeout> | null = null;

//         const getCurrentIndex = () => {
//             return Math.round(containerEl.scrollLeft / containerEl.clientWidth);
//         };

//         const scrollToIndex = (index: number) => {
//             const scrollAmount = containerEl.clientWidth * index;
//             containerEl.scrollTo({ left: scrollAmount, behavior: 'smooth' });
//         };

//         const scroll = (direction: 1 | -1) => {
//             const index = getCurrentIndex();
//             let newIndex = index + direction;

//             if (newIndex < 0) newIndex = 0;
//             if (newIndex >= totalItems) newIndex = totalItems - 1;

//             scrollToIndex(newIndex);
//             resetAutoplay(); // 用户操作时重置自动播放
//         };

//         const updateButtonVisibility = () => {
//             const index = getCurrentIndex();
//             btnPrev.style.display = index === 0 ? 'none' : '';
//             btnNext.style.display = index === totalItems - 1 ? 'none' : '';
//         };

//         const updateActiveDot = () => {
//             const index = getCurrentIndex();
//             dots.forEach((dot, i) => {
//                 dot.classList.toggle('active', i === index);
//             });
//         };

//         const onScroll = () => {
//             requestAnimationFrame(() => {
//                 updateButtonVisibility();
//                 updateActiveDot();
//             });

//             // 用户滚动也算互动
//             resetAutoplay();
//         };

//         const startAutoplay = () => {
//             if (autoplayTimer) return;
//             autoplayTimer = setInterval(() => {
//                 const index = getCurrentIndex();

//                 let nextIndex = index + autoplayDirection;

//                 if (nextIndex >= totalItems) {
//                     autoplayDirection = -1;
//                     nextIndex = totalItems - 2; // 倒数第二张
//                 } else if (nextIndex < 0) {
//                     autoplayDirection = 1;
//                     nextIndex = 1; // 第二张
//                 }

//                 scrollToIndex(nextIndex);
//             }, autoplayInterval);
//         };

//         const stopAutoplay = () => {
//             if (autoplayTimer) {
//                 clearInterval(autoplayTimer);
//                 autoplayTimer = null;
//             }
//         };

//         const resetAutoplay = () => {
//             if (interactionTimeout) clearTimeout(interactionTimeout);
//             stopAutoplay();
//             interactionTimeout = setTimeout(() => {
//                 startAutoplay();
//             }, 4000); // 停止 4 秒后继续自动播放
//         };

//         // 初始化
//         updateButtonVisibility();
//         updateActiveDot();
//         startAutoplay();

//         // 事件绑定
//         const prevHandler = () => scroll(-1);
//         const nextHandler = () => scroll(1);

//         btnPrev.addEventListener('click', prevHandler);
//         btnNext.addEventListener('click', nextHandler);
//         containerEl.addEventListener('scroll', onScroll);

//         cleanupFns.push(() => {
//             btnPrev.removeEventListener('click', prevHandler);
//             btnNext.removeEventListener('click', nextHandler);
//             containerEl.removeEventListener('scroll', onScroll);
//             stopAutoplay();
//         });
//     });

//     return () => {
//         cleanupFns.forEach(fn => fn());
//     };
// }

const initializedCarousels = new WeakSet<HTMLElement>()

function initSingleCarousel(wrapper: HTMLElement, autoplayInterval = 3000) {
  if (initializedCarousels.has(wrapper)) return
  initializedCarousels.add(wrapper)

  const containerEl = wrapper.querySelector<HTMLElement>('.container')
  const btnPrev = wrapper.querySelector<HTMLElement>('.container-btn.prev')
  const btnNext = wrapper.querySelector<HTMLElement>('.container-btn.next')
  const dots = wrapper.querySelectorAll<HTMLElement>('.container-indicators .dot')
  const items = wrapper.querySelectorAll<HTMLElement>('.container-item')

  if (!containerEl || !btnPrev || !btnNext) return

  const shouldAutoplay = wrapper.getAttribute('data-autoplay') !== 'false'

  const totalItems = items.length
  let autoplayTimer: ReturnType<typeof setInterval> | null = null
  let autoplayDirection: 1 | -1 = 1
  let interactionTimeout: ReturnType<typeof setTimeout> | null = null

  if (totalItems === 1) {
    containerEl.style.justifyContent = 'center'
    btnPrev.style.display = 'none'
    btnNext.style.display = 'none'
  }

  const getItemFullWidth = () => {
    const style = getComputedStyle(items[0])
    const width = items[0].offsetWidth
    const marginLeft = parseFloat(style.marginLeft)
    const marginRight = parseFloat(style.marginRight)
    return width + marginLeft + marginRight
  }

  const getContainerWidth = () => containerEl.clientWidth

  const getCurrentIndex = () => {
    const scrollLeft = containerEl.scrollLeft
    const containerWidth = getContainerWidth()
    const itemFullWidth = getItemFullWidth()
    const index = Math.round((scrollLeft + containerWidth / 2 - itemFullWidth / 2) / itemFullWidth)
    return Math.min(Math.max(index, 0), totalItems - 1)
  }

  const scrollToIndex = (index: number) => {
    updateActiveClasses(index)
    updateButtonVisibility(index)
    updateActiveDot(index)

    const containerWidth = getContainerWidth()
    const itemFullWidth = getItemFullWidth()
    const scrollLeft = Math.round(index * itemFullWidth - containerWidth / 2 + itemFullWidth / 2)

    containerEl.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }

  const updateButtonVisibility = (index: number) => {
    btnPrev.style.display = index === 0 ? 'none' : ''
    btnNext.style.display = index === totalItems - 1 ? 'none' : ''
  }

  const updateActiveDot = (index: number) => {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index)
    })
  }

  const updateActiveClasses = (index: number) => {
    items.forEach((item, i) => {
      item.classList.remove('active', 'peek-prev', 'peek-next')
      if (i === index) {
        item.classList.add('active')
      } else if (i === index - 1) {
        item.classList.add('peek-prev')
      } else if (i === index + 1) {
        item.classList.add('peek-next')
      }
    })
  }

  const scroll = (direction: 1 | -1) => {
    const index = getCurrentIndex()
    let newIndex = index + direction
    newIndex = Math.min(Math.max(newIndex, 0), totalItems - 1)
    scrollToIndex(newIndex)
    resetAutoplay()
  }

  const onScroll = () => {
    requestAnimationFrame(() => {
      const index = getCurrentIndex()
      updateActiveClasses(index)
      updateButtonVisibility(index)
      updateActiveDot(index)
    })
    resetAutoplay()
  }

  const startAutoplay = () => {
    if (autoplayTimer || !shouldAutoplay) return
    autoplayTimer = setInterval(() => {
      const index = getCurrentIndex()
      let nextIndex = index + autoplayDirection
      if (nextIndex >= totalItems) {
        autoplayDirection = -1
        nextIndex = totalItems - 2
      } else if (nextIndex < 0) {
        autoplayDirection = 1
        nextIndex = 1
      }
      scrollToIndex(nextIndex)
    }, autoplayInterval)
  }

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer)
      autoplayTimer = null
    }
  }

  const resetAutoplay = () => {
    if (interactionTimeout) clearTimeout(interactionTimeout)
    stopAutoplay()
    interactionTimeout = setTimeout(() => {
      if (shouldAutoplay) {
        startAutoplay()
      }
    }, 4000)
  }

  btnPrev.addEventListener('click', () => scroll(-1))
  btnNext.addEventListener('click', () => scroll(1))
  containerEl.addEventListener('scroll', onScroll)
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      scrollToIndex(i)
      resetAutoplay()
    })
  })

  scrollToIndex(0)
  startAutoplay()
}

export function initMarkdownCarousel(
  container: HTMLElement | Document = document,
  autoplayInterval = 3000
) {
  const wrappers = container.querySelectorAll<HTMLElement>('.carousel-wrapper')
  wrappers.forEach((wrapper) => initSingleCarousel(wrapper, autoplayInterval))

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return

        if (node.matches('.carousel-wrapper')) {
          initSingleCarousel(node, autoplayInterval)
        } else {
          node
            .querySelectorAll?.('.carousel-wrapper')
            .forEach((el) => initSingleCarousel(el as HTMLElement, autoplayInterval))
        }
      })
    })
  })

  observer.observe(container, {
    childList: true,
    subtree: true
  })
}

//    justify-content: center;
