// Stand-in for a third-party web component (e.g. from a design system).
// ctrl-fx treats it as a black box: set properties, listen for custom events.
export class RatingStars extends HTMLElement {
  private _value = 0

  get value(): number {
    return this._value
  }

  set value(v: number) {
    this._value = v
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  private render(): void {
    this.innerHTML = ''
    for (let n = 1; n <= 5; n++) {
      const btn = document.createElement('button')
      btn.textContent = n <= this._value ? '★' : '☆'
      btn.setAttribute('aria-label', `Rate ${n} out of 5`)
      btn.addEventListener('click', () => {
        this.value = n
        this.dispatchEvent(
          new CustomEvent('rating-change', {
            detail: { value: n },
            bubbles: true,
            composed: true,
          }),
        )
      })
      this.appendChild(btn)
    }
  }
}

customElements.define('rating-stars', RatingStars)
