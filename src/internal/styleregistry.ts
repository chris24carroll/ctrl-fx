export type StyleRegistry = {
  injectStyle(css: string): void
}

export function realStyleRegistry(): StyleRegistry {
  const injected = new Set<string>()
  return {
    injectStyle(css: string) {
      if (injected.has(css)) return
      injected.add(css)
      const el = globalThis.document.createElement('style')
      el.textContent = css
      globalThis.document.head.appendChild(el)
    },
  }
}

export function noopStyleRegistry(): StyleRegistry {
  return {
    injectStyle(_css: string) {},
  }
}
