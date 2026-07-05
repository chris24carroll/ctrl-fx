import { highlightSource } from './highlight.ts'

export function showTabs(files: { label: string; source: string }[]) {
  const sourceEl = document.getElementById('source')!

  const tabBar = document.createElement('div')
  tabBar.id = 'tab-bar'

  const codeEl = document.createElement('code')
  const preEl = document.createElement('pre')
  preEl.appendChild(codeEl)

  function show(index: number) {
    codeEl.removeAttribute('data-highlighted')
    codeEl.textContent = files[index].source
    highlightSource(codeEl)
    tabBar.querySelectorAll('button').forEach((btn, i) => {
      btn.classList.toggle('active', i === index)
    })
  }

  files.forEach(({ label }, i) => {
    const btn = document.createElement('button')
    btn.textContent = label
    btn.addEventListener('click', () => show(i))
    tabBar.appendChild(btn)
  })

  sourceEl.appendChild(tabBar)
  sourceEl.appendChild(preEl)
  show(0)
}
