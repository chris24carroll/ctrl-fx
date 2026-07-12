import type { FlowContent, PhrasingContent } from '.'
import { type Effect } from '../effects'
import { applySupport, type SupportsApply } from '../utils/apply'
import { type Attr, type Prop, normalizeAttrArgs, type AttrOrNodeIdArgs } from './attrs'
import {
  eventSupport,
  type ChangeData,
  type EventListener,
  type EventListenerResult,
  type EventOptions,
  type KeyData,
  type MouseMoveData,
  type ScrollData,
  type TextState,
  type TouchData,
  type WheelData,
} from './events'

import { findNodeId, type NodeId } from './nodeid'
import { type Svg, type SvgGraphicElement } from './svg'

/**
 * Base interface for all virtual DOM elements. Provides typed event handler methods that
 * each return `this`, so calls can be chained: `button_('Save').onClick(save).onFocus(highlight)`.
 */
export interface BaseElement<State, Event, Tag> extends SupportsApply {
  readonly _type: 'Element'
  readonly tag: Tag
  readonly nodeId?: NodeId
  readonly attrs: readonly Attr[]
  readonly props: readonly Prop[]
  readonly eventListeners: readonly EventListener<State, Event>[]

  onClick(
    effect: Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onDblClick(
    effect: Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onFocus(
    effect: Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onBlur(
    effect: Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onChange(
    f: (data: ChangeData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onTextInput(
    f: (textState: TextState) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onKeyDown(
    effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onKeyUp(
    effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onMouseEnter(
    effect: Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onMouseLeave(
    effect: Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onMouseMove(
    f: (data: MouseMoveData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onScroll(
    f: (data: ScrollData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onScrollEnd(
    f: (data: ScrollData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onWheel(
    f: (data: WheelData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onTouchStart(
    effect: (
      touchData: readonly TouchData[],
    ) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onTouchMove(
    effect: (
      touchData: readonly TouchData[],
    ) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onTouchEnd(
    effect: (
      touchData: readonly TouchData[],
    ) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onTouchCancel(
    effect: (
      touchData: readonly TouchData[],
    ) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onEvent(
    eventName: string,
    effect: (detail: unknown) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  onSubmit(
    effect: Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): this

  prop(name: string, value: unknown): this
}

/** A virtual DOM element that cannot have children (e.g. `br`, `hr`, `img`, `input`). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VoidElement<State, Event, Tag> extends BaseElement<
  State,
  Event,
  Tag
> {}

/** A virtual DOM element with typed children. */
export interface NonVoidElement<
  State,
  Event,
  Tag,
  Children,
> extends BaseElement<State, Event, Tag> {
  readonly children: readonly Children[]
}

export type ButtonContent<State, Event> =
  | PhrasingContent<State, Event>
  | Svg<State, Event>

export type Button<State, Event> = NonVoidElement<
  State,
  Event,
  'button',
  ButtonContent<State, Event>
>
export type Div<State, Event> = NonVoidElement<
  State,
  Event,
  'div',
  FlowContent<State, Event>
>
export type H1<State, Event> = NonVoidElement<
  State,
  Event,
  'h1',
  FlowContent<State, Event>
>
export type H2<State, Event> = NonVoidElement<
  State,
  Event,
  'h2',
  FlowContent<State, Event>
>
export type H3<State, Event> = NonVoidElement<
  State,
  Event,
  'h3',
  FlowContent<State, Event>
>
export type H4<State, Event> = NonVoidElement<
  State,
  Event,
  'h4',
  FlowContent<State, Event>
>
export type H5<State, Event> = NonVoidElement<
  State,
  Event,
  'h5',
  FlowContent<State, Event>
>
export type H6<State, Event> = NonVoidElement<
  State,
  Event,
  'h6',
  FlowContent<State, Event>
>
export type Header<State, Event> = NonVoidElement<
  State,
  Event,
  'header',
  FlowContent<State, Event>
>
export type Li<State, Event> = NonVoidElement<
  State,
  Event,
  'li',
  FlowContent<State, Event>
>
export type Main<State, Event> = NonVoidElement<
  State,
  Event,
  'main',
  FlowContent<State, Event>
>
export type Nav<State, Event> = NonVoidElement<
  State,
  Event,
  'nav',
  FlowContent<State, Event>
>
export type Ol<State, Event> = NonVoidElement<
  State,
  Event,
  'ol',
  Li<State, Event>
>
export type P<State, Event> = NonVoidElement<
  State,
  Event,
  'p',
  FlowContent<State, Event>
>
export type Ul<State, Event> = NonVoidElement<
  State,
  Event,
  'ul',
  Li<State, Event>
>

export type Address<State, Event> = NonVoidElement<
  State,
  Event,
  'address',
  FlowContent<State, Event>
>
export type Article<State, Event> = NonVoidElement<
  State,
  Event,
  'article',
  FlowContent<State, Event>
>
export type Aside<State, Event> = NonVoidElement<
  State,
  Event,
  'aside',
  FlowContent<State, Event>
>
export type Blockquote<State, Event> = NonVoidElement<
  State,
  Event,
  'blockquote',
  FlowContent<State, Event>
>
export type Dd<State, Event> = NonVoidElement<
  State,
  Event,
  'dd',
  FlowContent<State, Event>
>
export type Details<State, Event> = NonVoidElement<
  State,
  Event,
  'details',
  FlowContent<State, Event>
>
export type Dt<State, Event> = NonVoidElement<
  State,
  Event,
  'dt',
  PhrasingContent<State, Event>
>
export type Dl<State, Event> = NonVoidElement<
  State,
  Event,
  'dl',
  Dt<State, Event> | Dd<State, Event>
>
export type Fieldset<State, Event> = NonVoidElement<
  State,
  Event,
  'fieldset',
  FlowContent<State, Event>
>
export type Figcaption<State, Event> = NonVoidElement<
  State,
  Event,
  'figcaption',
  FlowContent<State, Event>
>
export type Figure<State, Event> = NonVoidElement<
  State,
  Event,
  'figure',
  FlowContent<State, Event>
>
export type Footer<State, Event> = NonVoidElement<
  State,
  Event,
  'footer',
  FlowContent<State, Event>
>
export type Form<State, Event> = NonVoidElement<
  State,
  Event,
  'form',
  FlowContent<State, Event>
>
export type Hr<State, Event> = VoidElement<State, Event, 'hr'>
export type Pre<State, Event> = NonVoidElement<
  State,
  Event,
  'pre',
  PhrasingContent<State, Event>
>
export type Section<State, Event> = NonVoidElement<
  State,
  Event,
  'section',
  FlowContent<State, Event>
>
export type Summary<State, Event> = NonVoidElement<
  State,
  Event,
  'summary',
  PhrasingContent<State, Event>
>
export type Td<State, Event> = NonVoidElement<
  State,
  Event,
  'td',
  FlowContent<State, Event>
>
export type Th<State, Event> = NonVoidElement<
  State,
  Event,
  'th',
  FlowContent<State, Event>
>
export type Tr<State, Event> = NonVoidElement<
  State,
  Event,
  'tr',
  Th<State, Event> | Td<State, Event>
>
export type Tbody<State, Event> = NonVoidElement<
  State,
  Event,
  'tbody',
  Tr<State, Event>
>
export type Tfoot<State, Event> = NonVoidElement<
  State,
  Event,
  'tfoot',
  Tr<State, Event>
>
export type Thead<State, Event> = NonVoidElement<
  State,
  Event,
  'thead',
  Tr<State, Event>
>
export type Table<State, Event> = NonVoidElement<
  State,
  Event,
  'table',
  | Thead<State, Event>
  | Tbody<State, Event>
  | Tfoot<State, Event>
  | Tr<State, Event>
>

export type BlockElement<State, Event> =
  | Address<State, Event>
  | Article<State, Event>
  | Aside<State, Event>
  | Blockquote<State, Event>
  | Button<State, Event>
  | Dd<State, Event>
  | Details<State, Event>
  | Dl<State, Event>
  | Dt<State, Event>
  | Div<State, Event>
  | Fieldset<State, Event>
  | Figcaption<State, Event>
  | Figure<State, Event>
  | Footer<State, Event>
  | Form<State, Event>
  | H1<State, Event>
  | H2<State, Event>
  | H3<State, Event>
  | H4<State, Event>
  | H5<State, Event>
  | H6<State, Event>
  | Header<State, Event>
  | Hr<State, Event>
  | Li<State, Event>
  | Main<State, Event>
  | Nav<State, Event>
  | Ol<State, Event>
  | P<State, Event>
  | Pre<State, Event>
  | Section<State, Event>
  | Summary<State, Event>
  | Table<State, Event>
  | Tbody<State, Event>
  | Td<State, Event>
  | Tfoot<State, Event>
  | Th<State, Event>
  | Thead<State, Event>
  | Tr<State, Event>
  | Ul<State, Event>

export type Br<State, Event> = VoidElement<State, Event, 'br'>
export type Img<State, Event> = VoidElement<State, Event, 'img'>
export type Input<State, Event> = VoidElement<State, Event, 'input'>

export type VoidInlineElement<State, Event> =
  | Br<State, Event>
  | Img<State, Event>
  | Input<State, Event>

export type A<State, Event> = NonVoidElement<
  State,
  Event,
  'a',
  FlowContent<State, Event>
>
export type Abbr<State, Event> = NonVoidElement<
  State,
  Event,
  'abbr',
  PhrasingContent<State, Event>
>
export type B<State, Event> = NonVoidElement<
  State,
  Event,
  'b',
  PhrasingContent<State, Event>
>
export type Cite<State, Event> = NonVoidElement<
  State,
  Event,
  'cite',
  PhrasingContent<State, Event>
>
export type Code<State, Event> = NonVoidElement<
  State,
  Event,
  'code',
  PhrasingContent<State, Event>
>
export type Em<State, Event> = NonVoidElement<
  State,
  Event,
  'em',
  PhrasingContent<State, Event>
>
export type I<State, Event> = NonVoidElement<
  State,
  Event,
  'i',
  PhrasingContent<State, Event>
>
export type Kbd<State, Event> = NonVoidElement<
  State,
  Event,
  'kbd',
  PhrasingContent<State, Event>
>
export type Label<State, Event> = NonVoidElement<
  State,
  Event,
  'label',
  PhrasingContent<State, Event>
>
export type Mark<State, Event> = NonVoidElement<
  State,
  Event,
  'mark',
  PhrasingContent<State, Event>
>
export type Option<State, Event> = NonVoidElement<
  State,
  Event,
  'option',
  string
>
export type Q<State, Event> = NonVoidElement<
  State,
  Event,
  'q',
  PhrasingContent<State, Event>
>
export type S<State, Event> = NonVoidElement<
  State,
  Event,
  's',
  PhrasingContent<State, Event>
>
export type Select<State, Event> = NonVoidElement<
  State,
  Event,
  'select',
  Option<State, Event>
>
export type Small<State, Event> = NonVoidElement<
  State,
  Event,
  'small',
  PhrasingContent<State, Event>
>
export type Span<State, Event> = NonVoidElement<
  State,
  Event,
  'span',
  PhrasingContent<State, Event>
>
export type Strong<State, Event> = NonVoidElement<
  State,
  Event,
  'strong',
  PhrasingContent<State, Event>
>
export type Sub<State, Event> = NonVoidElement<
  State,
  Event,
  'sub',
  PhrasingContent<State, Event>
>
export type Sup<State, Event> = NonVoidElement<
  State,
  Event,
  'sup',
  PhrasingContent<State, Event>
>
export type Textarea<State, Event> = NonVoidElement<
  State,
  Event,
  'textarea',
  string
>
export type Time<State, Event> = NonVoidElement<
  State,
  Event,
  'time',
  PhrasingContent<State, Event>
>
export type U<State, Event> = NonVoidElement<
  State,
  Event,
  'u',
  PhrasingContent<State, Event>
>

export type NonVoidInlineElement<State, Event> =
  | A<State, Event>
  | Abbr<State, Event>
  | B<State, Event>
  | Cite<State, Event>
  | Code<State, Event>
  | Em<State, Event>
  | I<State, Event>
  | Kbd<State, Event>
  | Label<State, Event>
  | Mark<State, Event>
  | Option<State, Event>
  | Q<State, Event>
  | S<State, Event>
  | Select<State, Event>
  | Small<State, Event>
  | Span<State, Event>
  | Strong<State, Event>
  | Sub<State, Event>
  | Sup<State, Event>
  | Textarea<State, Event>
  | Time<State, Event>
  | U<State, Event>

export type InlineElement<State, Event> =
  | VoidInlineElement<State, Event>
  | NonVoidInlineElement<State, Event>

export type Element<State, Event> =
  | BlockElement<State, Event>
  | InlineElement<State, Event>
  | ReplacedElement<State, Event>
  | SvgGraphicElement<State, Event>

export type ReplacedElement<State, Event> = Svg<State, Event>

//| View<State, any, Event>
//| View<State, never, Event>

function propSupport<Elem extends { props: readonly Prop[] }>() {
  return {
    prop(this: Elem, name: string, value: unknown): Elem {
      return {
        ...this,
        props: [...this.props, { name, value }],
        ...propSupport<Elem>(),
      } as Elem
    },
  }
}

export function makeNonVoidElement<
  State,
  Event,
  Children,
  Elem extends NonVoidElement<State, Event, Elem['tag'], Children>,
>(
  tag: Elem['tag'],
): (...attrs: AttrOrNodeIdArgs) => (...children: readonly Children[]) => Elem {
  return (...attrs: AttrOrNodeIdArgs) => {
    return (...children: readonly Children[]) => {
      return {
        _type: 'Element',
        tag,
        nodeId: findNodeId(attrs),
        attrs: normalizeAttrArgs(attrs),
        props: [],
        children,
        eventListeners: [],
        ...eventSupport<State, Event, Elem>(),
        ...propSupport<Elem>(),
        ...applySupport<Elem>(),
      } as NonVoidElement<State, Event, Elem['tag'], Children> as Elem
    }
  }
}

export function makeVoidElement<
  State,
  Event,
  Elem extends VoidElement<State, Event, string>,
>(tag: Elem['tag']): (...attrs: AttrOrNodeIdArgs) => Elem {
  return (...attrs: AttrOrNodeIdArgs) => {
    return {
      _type: 'Element',
      tag,
      nodeId: findNodeId(attrs),
      attrs: normalizeAttrArgs(attrs),
      props: [],
      eventListeners: [],
      ...eventSupport<State, Event, Elem>(),
      ...propSupport<Elem>(),
      ...applySupport<Elem>(),
    } as VoidElement<State, Event, Elem['tag']> as Elem
  }
}
