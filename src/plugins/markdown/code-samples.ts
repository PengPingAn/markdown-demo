const files = import.meta.glob('/src/**/*.{ts,tsx,js,jsx,vue,md,scss,css,json}', {
  as: 'raw',
  eager: true
}) as Record<string, string>

function normalizePath(input: string) {
  let p = input.replace(/\\/g, '/')
  const m = p.match(/[/\\]src[/\\].*$/i)
  if (m) {
    p = m[0].replace(/\\/g, '/')
  }
  if (!p.startsWith('/')) p = '/' + p
  return p
}

function extToLang(path: string) {
  const ext = path.split('.').pop() || ''
  const map: Record<string, string> = {
    ts: 'ts',
    tsx: 'tsx',
    js: 'js',
    jsx: 'jsx',
    vue: 'vue',
    md: 'md',
    scss: 'scss',
    css: 'css',
    json: 'json'
  }
  return map[ext] || ext || 'text'
}

export function getFileSnippet(spec: string) {
  const [rawPath, range] = spec.split('#')
  const norm = normalizePath(rawPath)
  const content = files[norm]
  if (!content) return { code: `未找到文件: ${norm}`, lang: 'text' }
  const lines = content.split(/\r?\n/)
  if (!range || !/^L\d+(-L\d+)?$/i.test(range)) {
    return { code: content, lang: extToLang(norm) }
  }
  const [s, e] = range.replace(/^L/i, '').split('-L')
  const start = Math.max(parseInt(s, 10), 1)
  const end = e ? Math.min(parseInt(e, 10), lines.length) : start
  const slice = lines.slice(start - 1, end).join('\n')
  return { code: slice, lang: extToLang(norm) }
}
