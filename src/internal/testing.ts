import type { Attr } from '../dom/attrs'
import type { Component } from '../dom/components'
import { pure } from '../effects'
import {
  newTestData,
  type DomElement,
  type DomNode,
  type Interaction,
  type TestableComponent,
  type TestableDom,
  type TestConfig,
  type TestData,
} from '../testing'
import { type NonEmptyArray } from '../utils'
import { exhaustivenessCheck } from '../utils'
import { ComponentManager } from './cmpmgr'
import type { RealElement, RealWindow } from './realdom'
import { noopStyleRegistry } from './styleregistry'
import { makeTestingInterpreter } from './testinginterpreter'

abstract class Node {
  previousSibling: Node | null = null
  nextSibling: Node | null = null
  parentNode: ElementNode | null = null

  remove(): void {
    if (this.previousSibling) {
      this.previousSibling.nextSibling = this.nextSibling
    } else {
      if (this.parentNode) {
        this.parentNode.firstChild = this.nextSibling
      }
    }

    if (this.nextSibling) {
      this.nextSibling.previousSibling = this.previousSibling
    }

    this.parentNode = null
  }

  insertBefore(node: Node | string): Node {
    const newNode = typeof node === 'string' ? new TextNode(node) : node

    if (this.previousSibling) {
      this.previousSibling.nextSibling = newNode
      newNode.previousSibling = this.previousSibling
    } else {
      if (this.parentNode) {
        this.parentNode.firstChild = newNode
      }
    }

    newNode.nextSibling = this
    newNode.parentNode = this.parentNode
    this.previousSibling = newNode
    return newNode
  }

  insertAfter(node: Node | string): Node {
    const newNode = typeof node === 'string' ? new TextNode(node) : node

    if (this.nextSibling) {
      this.nextSibling.previousSibling = newNode
      newNode.nextSibling = this.nextSibling
    }

    newNode.previousSibling = this
    newNode.parentNode = this.parentNode
    this.nextSibling = newNode
    return newNode
  }

  before(...nodes: (Node | string)[]): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: Node = this

    for (let i = nodes.length - 1; i >= 0; i--) {
      current = current.insertBefore(nodes[i])
    }
  }
  after(...nodes: (Node | string)[]): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: Node = this

    for (let i = 0; i < nodes.length; i++) {
      current = current.insertAfter(nodes[i])
    }
  }
}

class TextNode extends Node {
  nodeValue: string
  constructor(nodeValue: string) {
    super()
    this.nodeValue = nodeValue
  }
}

class ElementNode extends Node {
  tagName: string
  attributes: { [key: string]: string } = {}
  firstChild: Node | null = null
  scrollTop: number = 0
  scrollLeft: number = 0

  scrollTo(options: { top?: number; left?: number; behavior?: string }): void {
    if (options.top !== undefined) this.scrollTop = options.top
    if (options.left !== undefined) this.scrollLeft = options.left
  }

  eventListeners: {
    type: string
    listener: (event: Event) => void
    options: { capture?: boolean; passive?: boolean }
  }[] = []

  constructor(tagName: string) {
    super()
    this.tagName = tagName
  }
  removeAttribute(name: string): void {
    delete this.attributes[name]
  }
  setAttribute(name: string, value: string): void {
    this.attributes[name] = value
  }

  lastChild(): Node | null {
    let child = this.firstChild
    while (child && child.nextSibling) {
      child = child.nextSibling
    }
    return child
  }

  append(...nodes: Node[]): void {
    if (nodes.length === 0) {
      return
    }

    let last = this.lastChild()

    if (!last) {
      this.firstChild = nodes[0]
      this.firstChild.parentNode = this
      nodes = nodes.slice(1)
      last = this.firstChild
    }

    last.after(...nodes)
  }

  prepend(...nodes: Node[]): void {
    if (this.firstChild) {
      this.firstChild.before(...nodes)
    } else {
      this.append(...nodes)
    }
  }

  addEventListener(
    type: string,
    listener: (event: Event) => void,
    options: { capture?: boolean; passive?: boolean },
  ): void {
    this.eventListeners.push({
      type,
      listener,
      options,
    })
  }

  removeEventListener(
    type: string,
    listener: (event: Event) => void,
    useCapture: boolean,
  ): void {
    this.eventListeners = this.eventListeners.filter(el => {
      return !(
        el.type === type &&
        el.listener === listener &&
        (useCapture ? el.options.capture : !el.options.capture)
      )
    })
  }

  private matchesSelector(selector: string): boolean {
    const parts = parseSelector(selector)
    return matchesSelectorSequence(this, parts)
  }

  private traverseAndCollect(selector: string, result: ElementNode[]): void {
    if (this.matchesSelector(selector)) {
      result.push(this)
    }
    let child = this.firstChild
    while (child) {
      if (child instanceof ElementNode) {
        child.traverseAndCollect(selector, result)
      }
      child = child.nextSibling
    }
  }

  querySelector(selector: string): ElementNode | null {
    const results = this.querySelectorAll(selector)
    return results.length > 0 ? results[0] : null
  }

  querySelectorAll(selector: string): ElementNode[] {
    const result: ElementNode[] = []
    this.traverseAndCollect(selector, result)
    return result
  }
}

abstract class EventTarget {
  tagName: string
  constructor(tagName: string) {
    this.tagName = tagName
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class HTMLInputELementTarget extends EventTarget {
  value: string
  selectionStart: number | null = null
  selectionEnd: number | null = null
  constructor(value: string) {
    super('INPUT')
    this.value = value
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class HTMLTextareaElementTarget extends EventTarget {
  value: string
  selectionStart: number = 0
  selectionEnd: number = 0
  constructor(value: string) {
    super('TEXTAREA')
    this.value = value
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class HTMLDivElementTarget extends EventTarget {
  innerText: string = ''
  constructor() {
    super('DIV')
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class HTMLOtherTarget extends EventTarget {
  constructor() {
    super('OTHER')
  }
}

abstract class Event {
  readonly type: string
  eventPhase: number
  defaultPrevented: boolean = false
  propagationStopped: boolean = false
  target: EventTarget | null
  constructor(type: string, target: EventTarget | null, eventPhase: number) {
    this.type = type
    this.target = target
    this.eventPhase = eventPhase
  }
  preventDefault(): void {
    this.defaultPrevented = true
  }

  stopImmediatePropagation(): void {
    this.propagationStopped = true
  }
}

class Touch {
  clientX: number
  clientY: number
  pageX: number
  pageY: number

  constructor(clientX: number, clientY: number, pageX: number, pageY: number) {
    this.clientX = clientX
    this.clientY = clientY
    this.pageX = pageX
    this.pageY = pageY
  }
}

class TouchList {
  readonly length: number;

  [index: number]: Touch

  constructor(items: Touch[]) {
    this.length = items.length
    for (let i = 0; i < items.length; i++) {
      this[i] = items[i]
    }
  }

  item(index: number): Touch | null {
    return this[index] ?? null
  }
}

abstract class TouchEvent extends Event {
  constructor(type: string, target: EventTarget | null, eventPhase: number) {
    super(type, target, eventPhase)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TouchStartEvent extends TouchEvent {
  touches: TouchList

  constructor(
    eventPhase: number,
    touches: TouchList,
    target: EventTarget | null,
  ) {
    super('touchstart', target, eventPhase)
    this.touches = touches
    this.eventPhase = eventPhase
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TouchMoveEvent extends TouchEvent {
  touches: TouchList

  constructor(
    eventPhase: number,
    touches: TouchList,
    target: EventTarget | null,
  ) {
    super('touchmove', target, eventPhase)
    this.touches = touches
    this.eventPhase = eventPhase
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TouchEndEvent extends TouchEvent {
  touches: TouchList

  constructor(
    eventPhase: number,
    touches: TouchList,
    target: EventTarget | null,
  ) {
    super('touchend', target, eventPhase)
    this.touches = touches
    this.eventPhase = eventPhase
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TouchCancelEvent extends TouchEvent {
  touches: TouchList

  constructor(
    eventPhase: number,
    touches: TouchList,
    target: EventTarget | null,
  ) {
    super('touchcancel', target, eventPhase)
    this.touches = touches
    this.eventPhase = eventPhase
  }
}

abstract class KeyEvent extends Event {
  key: string
  code: string

  constructor(
    type: string,
    key: string,
    code: string,
    target: EventTarget | null,
    eventPhase: number,
  ) {
    super(type, target, eventPhase)
    this.key = key
    this.code = code
    this.target = target
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class KeyUpEvent extends KeyEvent {
  constructor(
    key: string,
    code: string,
    target: EventTarget | null,
    eventPhase: number,
  ) {
    super('keyup', key, code, target, eventPhase)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class KeyDownEvent extends KeyEvent {
  constructor(
    key: string,
    code: string,
    target: EventTarget | null,
    eventPhase: number,
  ) {
    super('keydown', key, code, target, eventPhase)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class KeyPressEvent extends KeyEvent {
  constructor(
    key: string,
    code: string,
    target: EventTarget | null,
    eventPhase: number,
  ) {
    super('keypress', key, code, target, eventPhase)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class OtherEvent extends Event {
  constructor(target: EventTarget | null, eventPhase: number) {
    super('other', target, eventPhase)
  }
}

class Document {
  head = this.createElement('head')
  body = this.createElement('body')
  visibilityState: 'visible' | 'hidden' = 'visible'

  private documentEventListeners: {
    type: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (event: any) => void
    options: { capture?: boolean; passive?: boolean }
  }[] = []

  createTextNode(text: string): TextNode {
    return new TextNode(text)
  }

  getElementById(id: string): ElementNode | null {
    return this.body.querySelector('#' + id)
  }

  querySelector(selector: string): ElementNode | null {
    return this.body.querySelector(selector)
  }

  createElement(tag: string): ElementNode {
    return new ElementNode(tag)
  }

  addEventListener(
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (event: any) => void,
    options: { capture?: boolean; passive?: boolean },
  ): void {
    this.documentEventListeners.push({ type, listener, options })
  }

  removeEventListener(
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (event: any) => void,
    useCapture: boolean,
  ): void {
    this.documentEventListeners = this.documentEventListeners.filter(
      el =>
        !(
          el.type === type &&
          el.listener === listener &&
          (useCapture ? el.options.capture : !el.options.capture)
        ),
    )
  }
}

export type RealLocation = {
  protocol: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
}

class Window {
  document = new Document()
  innerWidth: number = 1024
  innerHeight: number = 768
  location: RealLocation = {
    protocol: 'http',
    hostname: 'localhost',
    port: '8080',
    pathname: '/',
    search: '',
    hash: '',
  }
  eventListeners: {
    type: string
    listener: (event: Event) => void
    options: { capture?: boolean; passive?: boolean }
  }[] = []

  addEventListener(
    type: string,
    listener: (event: Event) => void,
    options: { capture?: boolean; passive?: boolean },
  ): void {
    this.eventListeners.push({
      type,
      listener,
      options,
    })
  }
  removeEventListener(
    type: string,
    listener: (event: Event) => void,
    useCapture: boolean,
  ): void {
    this.eventListeners = this.eventListeners.filter(el => {
      return !(
        el.type === type &&
        el.listener === listener &&
        (useCapture ? el.options.capture : !el.options.capture)
      )
    })
  }
}

function serializeElement(elem: ElementNode): DomElement {
  const attrs: Attr[] = Object.entries(elem.attributes).map(
    ([name, value]) => ({ name, value }),
  )
  const childNodes: DomNode[] = []
  let child = elem.firstChild
  while (child) {
    if (child instanceof TextNode) {
      childNodes.push(child.nodeValue)
    } else if (child instanceof ElementNode) {
      childNodes.push(serializeElement(child))
    }
    child = child.nextSibling
  }
  return { tag: elem.tagName, attrs, childNodes }
}

function serializeDom(doc: Document): TestableDom {
  return {
    head: serializeElement(doc.head),
    body: serializeElement(doc.body),
  }
}

function dispatchClick(element: ElementNode): void {
  const syntheticEvent = {
    type: 'click',
    target: null,
    eventPhase: 2,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true
    },
    stopImmediatePropagation() {
      this.propagationStopped = true
    },
  }

  for (const entry of element.eventListeners) {
    if (entry.type === 'click') {
      entry.listener(syntheticEvent as unknown as Event)
      if (syntheticEvent.propagationStopped) {
        break
      }
    }
  }
}

function dispatchSubmit(element: ElementNode): void {
  const syntheticEvent = {
    type: 'submit',
    target: null,
    eventPhase: 2,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true
    },
    stopImmediatePropagation() {
      this.propagationStopped = true
    },
  }

  for (const entry of element.eventListeners) {
    if (entry.type === 'submit') {
      entry.listener(syntheticEvent as unknown as Event)
      if (syntheticEvent.propagationStopped) {
        break
      }
    }
  }
}

function dispatchCustomEvent(
  element: ElementNode,
  eventName: string,
  detail: unknown,
): void {
  const syntheticEvent = {
    type: eventName,
    detail,
    target: null,
    eventPhase: 2,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true
    },
    stopImmediatePropagation() {
      this.propagationStopped = true
    },
  }

  for (const entry of element.eventListeners) {
    if (entry.type === eventName) {
      entry.listener(syntheticEvent as unknown as Event)
      if (syntheticEvent.propagationStopped) {
        break
      }
    }
  }
}

function dispatchTextInput(element: ElementNode, value: string): void {
  const syntheticEvent = {
    type: 'input',
    target: { tagName: 'INPUT', value, selectionStart: value.length, selectionEnd: value.length },
    eventPhase: 2,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true
    },
    stopImmediatePropagation() {
      this.propagationStopped = true
    },
  }

  for (const entry of element.eventListeners) {
    if (entry.type === 'input') {
      entry.listener(syntheticEvent as unknown as Event)
      if (syntheticEvent.propagationStopped) {
        break
      }
    }
  }
}

function querySelectorAllInApp(
  window: Window,
  selector: string,
): ElementNode[] {
  const appRoot = window.document.getElementById('app')
  if (!appRoot) return []
  const results: ElementNode[] = []
  let child: Node | null = appRoot.firstChild
  while (child) {
    if (child instanceof ElementNode) {
      results.push(...child.querySelectorAll(selector))
    }
    child = child.nextSibling
  }
  return results
}

function makeWindow(): Window {
  const win = new Window()
  const root = win.document.createElement('div')
  root.setAttribute('id', 'app')
  win.document.body.append(root)
  return win
}

class TestableComponentImpl<
  State,
  Params,
  Event,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Custom = {},
> implements TestableComponent<State, Params, Event, Custom> {
  readonly config: TestConfig
  readonly data: TestData<Custom>
  readonly dom: TestableDom
  private readonly _component: Component<State, Params, Event>
  readonly state: State
  private readonly _window: Window

  constructor(
    component: Component<State, Params, Event>,
    state: State,
    config: TestConfig,
    data: TestData<Custom>,
    dom: TestableDom,
    window: Window,
  ) {
    this._component = component
    this.state = state
    this.config = config
    this.data = data
    this.dom = dom
    this._window = window
  }

  withConfig(
    config: TestConfig,
  ): TestableComponent<State, Params, Event, Custom> {
    return new TestableComponentImpl(
      this._component,
      this.state,
      config,
      this.data,
      this.dom,
      this._window,
    )
  }

  withData(
    data: TestData<Custom>,
  ): TestableComponent<State, Params, Event, Custom> {
    return new TestableComponentImpl(
      this._component,
      this.state,
      this.config,
      data,
      this.dom,
      this._window,
    )
  }

  run(
    ...interactions: Interaction[]
  ): TestableComponent<State, Params, Event, Custom> {
    const win = makeWindow()
    const { interpreter, getData, advanceTime, fireBroadcast } = makeTestingInterpreter(
      this.data,
      win as unknown as RealWindow,
      this.config,
    )

    const currentState = this.state
    const wrappedComponent: Component<State, Params, Event> = {
      ...this._component,
      initialState: (_params: Params) => pure(currentState),
    }

    const appNode = win.document.getElementById('app')! as unknown as RealElement
    const mgr = new ComponentManager(
      wrappedComponent as Component<unknown, unknown, unknown>,
      appNode,
      win as unknown as RealWindow,
      interpreter,
      noopStyleRegistry(),
    )

    for (const interaction of interactions) {
      if ('_type' in interaction) {
        switch (interaction._type) {
          case 'AdvanceTime':
            advanceTime(interaction.milliseconds)
            break
          case 'ReceiveBroadcast':
            fireBroadcast(interaction.channel, interaction.message)
            break
          case 'FireCustomEvent': {
            const qs = interaction.selector
            const cssSelector = qs.selector
            const results = win.document.body.querySelectorAll(cssSelector)
            results.forEach(el =>
              dispatchCustomEvent(el, interaction.eventName, interaction.detail),
            )
            break
          }
          case 'Submit': {
            const qs = interaction.selector
            const cssSelector = qs.selector
            const results = win.document.body.querySelectorAll(cssSelector)
            results.forEach(el => dispatchSubmit(el))
            break
          }
          case 'TextInput': {
            const qs = interaction.selector
            const cssSelector = qs.selector
            const results = win.document.body.querySelectorAll(cssSelector)
            results.forEach(el => dispatchTextInput(el, interaction.value))
            break
          }
          default:
            exhaustivenessCheck(interaction)
        }
      } else {
        switch (interaction.type) {
          case 'Click': {
            const qs = interaction.selector
            const cssSelector = qs.selector
            const results = win.document.body.querySelectorAll(cssSelector)

            switch (qs._type) {
              case 'ExactlyOne':
                if (results.length !== 1)
                  throw new Error(
                    `Expected exactly one element matching '${cssSelector}', found ${results.length}`,
                  )
                break
              case 'OneOrMore':
                if (results.length === 0)
                  throw new Error(
                    `Expected at least one element matching '${cssSelector}', found 0`,
                  )
                break
              case 'ZeroOrOne':
                if (results.length > 1)
                  throw new Error(
                    `Expected zero or one element matching '${cssSelector}', found ${results.length}`,
                  )
                break
              case 'ZeroOrMore':
                break
              default:
                exhaustivenessCheck(qs)
            }

            results.forEach(el => dispatchClick(el))
            break
          }
          default:
            exhaustivenessCheck(interaction.type)
        }
      }
    }

    const stateAfter = mgr.getRootState()
    const newState =
      stateAfter._type === 'Ready' ? (stateAfter.value as State) : currentState

    return new TestableComponentImpl(
      this._component,
      newState,
      this.config,
      getData(),
      serializeDom(win.document),
      win,
    )
  }

  find(selector: string): readonly DomElement[] {
    return querySelectorAllInApp(this._window, selector).map(serializeElement)
  }

  findOne(selector: string): DomElement {
    const results = querySelectorAllInApp(this._window, selector)
    if (results.length !== 1)
      throw new Error(
        `findOne('${selector}'): expected 1 element, found ${results.length}`,
      )
    return serializeElement(results[0])
  }

  findOneOrMore(selector: string): NonEmptyArray<DomElement> {
    const results = querySelectorAllInApp(this._window, selector)
    if (results.length === 0)
      throw new Error(
        `findOneOrMore('${selector}'): expected at least 1 element, found 0`,
      )
    return results.map(serializeElement) as NonEmptyArray<DomElement>
  }

  findMaybeOne(selector: string): DomElement | undefined {
    const results = querySelectorAllInApp(this._window, selector)
    if (results.length > 1)
      throw new Error(
        `findMaybeOne('${selector}'): expected 0 or 1 elements, found ${results.length}`,
      )
    return results.length === 0 ? undefined : serializeElement(results[0])
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function testableComponent<State, Params, Event, Custom = {}>(
  component: Component<State, Params, Event>,
  config: TestConfig,
  data?: TestData<Custom>,
): TestableComponent<State, Params, Event, Custom> {
  const initialData = data || newTestData<Custom>()
  const win = makeWindow()
  const { interpreter, getData } = makeTestingInterpreter(
    initialData,
    win as unknown as RealWindow,
    config,
  )

  const appNode = win.document.getElementById('app')! as unknown as RealElement
  const mgr = new ComponentManager(
    component as Component<unknown, unknown, unknown>,
    appNode,
    win as unknown as RealWindow,
    interpreter,
    noopStyleRegistry(),
  )

  const stateAfter = mgr.getRootState()
  const currentState =
    stateAfter._type === 'Ready'
      ? (stateAfter.value as State)
      : (undefined as State)

  return new TestableComponentImpl(
    component,
    currentState,
    config,
    getData(),
    serializeDom(win.document),
    win,
  )
}

interface SelectorPart {
  tag?: string
  classes: string[]
  attrs: { [key: string]: string }
}

function parseSelector(selector: string): SelectorPart[] {
  const parts = selector.trim().split(/\s+/)
  return parts.map(parsePart)
}

function parsePart(part: string): SelectorPart {
  const attrs: { [key: string]: string } = {}
  const classes: string[] = []
  let tag: string | undefined = undefined

  // Handle #id
  if (part.startsWith('#')) {
    attrs['id'] = part.substring(1)
    return { tag, classes, attrs }
  }

  // Handle .class
  if (part.startsWith('.')) {
    classes.push(part.substring(1))
    return { tag, classes, attrs }
  }

  // Handle tag.class[attr=value]
  const attrRegex = /\[([^\]=]+)=([^\]]+)\]/g
  let match
  while ((match = attrRegex.exec(part)) !== null) {
    attrs[match[1]] = match[2]
  }
  const withoutAttrs = part.replace(attrRegex, '').trim()
  const dotParts = withoutAttrs.split('.')
  tag = dotParts[0] || undefined
  classes.push(...dotParts.slice(1))
  return { tag, classes, attrs }
}

function matchesPart(element: ElementNode, part: SelectorPart): boolean {
  if (part.tag && element.tagName.toLowerCase() !== part.tag.toLowerCase()) {
    return false
  }
  for (const cls of part.classes) {
    const elementClasses = (element.attributes['class'] || '').split(/\s+/)
    if (!elementClasses.includes(cls)) {
      return false
    }
  }
  for (const [attr, value] of Object.entries(part.attrs)) {
    if (element.attributes[attr] !== value) {
      return false
    }
  }
  return true
}

function matchesSelectorSequence(
  element: ElementNode,
  parts: SelectorPart[],
): boolean {
  if (parts.length === 0) return true

  // The rightmost part must match the element itself, not just any ancestor
  if (!matchesPart(element, parts[parts.length - 1])) {
    return false
  }

  if (parts.length === 1) return true

  // Each remaining part (right to left) must be matched by some ancestor
  let ancestor: ElementNode | null = element.parentNode
  for (let i = parts.length - 2; i >= 0; i--) {
    let found = false
    while (ancestor) {
      if (matchesPart(ancestor, parts[i])) {
        found = true
        ancestor = ancestor.parentNode
        break
      }
      ancestor = ancestor.parentNode
    }
    if (!found) return false
  }
  return true
}
