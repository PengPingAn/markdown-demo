import type MarkdownIt from 'markdown-it'
import {markdownConfig} from './markdown-it-config'
import { useCodeInclude } from './code-include'

export function setupMarkdownPlugins(md: MarkdownIt) {
  md.use(markdownConfig)
  useCodeInclude(md)
}
