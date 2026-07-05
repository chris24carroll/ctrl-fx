export type RealElement = {
  readonly previousSibling: RealNode | null
  readonly tagName: string
  readonly scrollTop: number
  readonly scrollLeft: number
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
  scrollTo(options: { top?: number; left?: number; behavior?: string }): void
  addEventListener(
    type: string,
    listener: (event: RealEvent) => void,
    options: { capture?: boolean; passive?: boolean },
  ): void
  removeEventListener(
    type: string,
    listener: (event: RealEvent) => void,
    useCapture: boolean,
  ): void
  remove(): void
  before(...nodes: RealNode[]): void
  after(...nodes: RealNode[]): void
  append(...nodes: RealNode[]): void
  prepend(...nodes: RealNode[]): void
}

export type RealTextNode = {
  remove(): void
  before(...nodes: (RealNode | string)[]): void
  after(...nodes: (RealNode | string)[]): void
  readonly previousSibling: RealNode | null
  nodeValue: string
}

export type RealNode = RealElement | RealTextNode

export type RealHTMLInputElement = {
  tagName: 'INPUT'
  value: string
  checked: boolean
  selectionStart: number | null
  selectionEnd: number | null
}

export type RealHTMLSelectElement = {
  tagName: 'SELECT'
  value: string
}

export type RealHTMLTextAreaElement = {
  tagName: 'TEXTAREA'
  value: string
  selectionStart: number
  selectionEnd: number
}

export type RealHTMLDivElement = {
  tagName: 'DIV'
  innerText: string
}

export type RealHTMLOtherElement = {
  tagName: 'OTHER'
}

export type RealEventTarget =
  | RealHTMLDivElement
  | RealHTMLInputElement
  | RealHTMLSelectElement
  | RealHTMLTextAreaElement
  | RealHTMLOtherElement

export type RealTouch = {
  clientX: number
  clientY: number
  pageX: number
  pageY: number
}

export type RealTouchList = {
  readonly length: number
  item(index: number): RealTouch | null
  [index: number]: Touch
}

export type RealTouchStartEvent = {
  type: 'touchstart'
  touches: RealTouchList
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}
export type RealTouchMoveEvent = {
  type: 'touchmove'
  touches: RealTouchList
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}
export type RealTouchEndEvent = {
  type: 'touchend'
  touches: RealTouchList
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}
export type RealTouchCancelEvent = {
  type: 'touchcancel'
  touches: RealTouchList
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealTouchEvent =
  | RealTouchStartEvent
  | RealTouchMoveEvent
  | RealTouchEndEvent
  | RealTouchCancelEvent

export type RealKeyUpEvent = {
  type: 'keyup'
  key: string
  code: string
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}
export type RealKeyDownEvent = {
  type: 'keydown'
  key: string
  code: string
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}
export type RealKeyPressEvent = {
  type: 'keypress'
  key: string
  code: string
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealKeyboardEvent =
  | RealKeyUpEvent
  | RealKeyDownEvent
  | RealKeyPressEvent

export type RealFocusEvent = {
  type: 'focus'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealBlurEvent = {
  type: 'blur'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealDblClickEvent = {
  type: 'dblclick'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealMouseMoveEvent = {
  type: 'mousemove'
  clientX: number
  clientY: number
  pageX: number
  pageY: number
  movementX: number
  movementY: number
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealWheelEvent = {
  type: 'wheel'
  deltaX: number
  deltaY: number
  deltaZ: number
  deltaMode: number
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealMouseEnterEvent = {
  type: 'mouseenter'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealMouseLeaveEvent = {
  type: 'mouseleave'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealScrollEvent = {
  type: 'scroll'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealScrollEndEvent = {
  type: 'scrollend'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealChangeEvent = {
  type: 'change'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type OtherEvent = {
  type: 'other'
  target: RealEventTarget | null
  preventDefault(): void
  stopImmediatePropagation(): void
  eventPhase: number
}

export type RealEvent =
  | RealTouchEvent
  | RealKeyboardEvent
  | RealFocusEvent
  | RealBlurEvent
  | RealDblClickEvent
  | RealMouseEnterEvent
  | RealMouseLeaveEvent
  | RealMouseMoveEvent
  | RealScrollEvent
  | RealScrollEndEvent
  | RealWheelEvent
  | RealChangeEvent
  | OtherEvent

export type RealDocument = {
  createTextNode(text: string): RealTextNode
  getElementById(id: string): RealElement | null
  querySelector(selector: string): RealElement | null
  createElement(tag: string): RealElement
  readonly visibilityState: 'visible' | 'hidden'
  addEventListener(
    type: string,
    listener: (event: RealEvent) => void,
    options: { capture?: boolean; passive?: boolean },
  ): void
  removeEventListener(
    type: string,
    listener: (event: RealEvent) => void,
    useCapture: boolean,
  ): void
}

export type RealLocation = {
  protocol: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
}

export type RealWindow = {
  document: RealDocument
  addEventListener(
    type: string,
    listener: (event: RealEvent) => void,
    options: { capture?: boolean; passive?: boolean },
  ): void
  removeEventListener(
    type: string,
    listener: (event: RealEvent) => void,
    useCapture: boolean,
  ): void
  dispatchEvent(event: Event): void
  innerWidth: number
  innerHeight: number
  location: RealLocation
}
