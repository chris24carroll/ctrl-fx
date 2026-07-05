import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import 'highlight.js/styles/github.min.css'

hljs.registerLanguage('typescript', typescript)

export function highlightSource(el: HTMLElement): void {
  hljs.highlightElement(el)
}
