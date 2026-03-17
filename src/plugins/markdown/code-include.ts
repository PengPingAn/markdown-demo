import type MarkdownIt from 'markdown-it'
import { getHighlighterSync } from './highlighter'
import { getFileSnippet } from './code-samples'

export function useCodeInclude(md: MarkdownIt) {
  md.core.ruler.after('inline', 'code_include', (state) => {
    state.tokens.forEach((blockToken: any) => {
      if (blockToken.type !== 'inline') return
      const children = []
      for (const token of blockToken.children || []) {
        if (token.type === 'code_inline') {
          const text = token.content.trim()
          const match = text.match(
            /^(?:[a-zA-Z]:\\|\/).+\.(?:ts|tsx|js|jsx|vue|md|scss|css|json)(?:#L\d+(?:-L\d+)?)?$/
          )
          if (match) {
            try {
              const { code, lang } = getFileSnippet(text)
              const h = getHighlighterSync()
              const html = h.codeToHtml(code, { lang })
              const t = new state.Token('html_inline', '', 0)
              t.content = `<div class="code-include">${html}</div>`
              children.push(t)
              continue
            } catch {
              const t = new state.Token('html_inline', '', 0)
              const esc = md.utils.escapeHtml(text)
              t.content = `<pre><code>${esc}</code></pre>`
              children.push(t)
              continue
            }
          }
        }
        children.push(token)
      }
      blockToken.children = children as any
    })
  })
}
