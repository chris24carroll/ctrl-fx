import type { Component } from './dom/components'
import { ComponentManager } from './internal/cmpmgr'
import { domInterpreter } from './internal/dominterpreter'
import type { RealElement, RealWindow } from './internal/realdom'
import { realStyleRegistry } from './internal/styleregistry'

/** Options for `defineWebComponent`. */
export type WebComponentOptions<Event> = {
  /** Maps a typed component event to a DOM custom-event name. */
  events?: (event: Event) => string
}

/**
 * Registers a ctrl-fx Component as a native custom element. Component events are dispatched as
 * CustomEvents using the name returned by `options.events`.
 * @param tagName the custom element tag name (must contain a hyphen)
 * @param component the ctrl-fx component to mount
 * @param options optional configuration
 */
export function defineWebComponent<State, Event>(
  tagName: string,
  component: Component<State, void, Event>,
  options?: WebComponentOptions<Event>,
): void {
  class CtrlFxElement extends HTMLElement {
    private _mgr: ComponentManager | null = null

    connectedCallback(): void {
      const shadow = this.attachShadow({ mode: 'open' })
      const mount = document.createElement('div')
      shadow.appendChild(mount)

      this._mgr = new ComponentManager(
        component as Component<unknown, unknown, unknown>,
        mount as unknown as RealElement,
        globalThis.window as unknown as RealWindow,
        domInterpreter,
        realStyleRegistry(),
        (event: unknown) => {
          const eventName = options?.events
            ? options.events(event as Event)
            : 'event'
          this.dispatchEvent(
            new CustomEvent(eventName, {
              detail: event,
              bubbles: true,
              composed: true,
            }),
          )
        },
      )
    }

    disconnectedCallback(): void {
      this._mgr?.destroy()
      this._mgr = null
    }
  }

  customElements.define(tagName, CtrlFxElement)
}
