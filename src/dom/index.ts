import type { AttrArg } from './attrs'
export { attr, cssVars, id, prop, typeAttr, type Attr, type Prop, type AttrArg, type AttrOrNodeIdArgs } from './attrs'
export type {
  A, Abbr, Address, Article, Aside, B, BlockElement, Blockquote, Br,
  Button, ButtonContent, Cite, Code, Dd, Details, Div, Dl, Dt, Element,
  Em, Fieldset, Figcaption, Figure, Footer, Form, H1, H2, H3, H4, H5, H6,
  Header, Hr, I, Img, InlineElement, Input, Kbd, Label, Li, Main, Mark,
  Nav, NonVoidElement, Ol, Option, P, Pre, Q, ReplacedElement, S, Section,
  Select, Small, Span, Strong, Sub, Summary, Sup, Table, Tbody, Td,
  Textarea, Tfoot, Th, Thead, Time, Tr, U, Ul, VoidElement,
} from './elems'
export type {
  Circle, Ellipse, Image, Line, Path, Polygon, Polyline, Rect, Svg,
  SvgGraphicElement, Use,
} from './svg'
export {
  preventDefault,
  stopPropagation,
  stopPropagationAndPreventDefault,
  type TextState,
  type KeyData,
  type ChangeData,
  type MouseMoveData,
  type ScrollData,
  type WheelData,
  type TouchData,
  type EventOptions,
  type EventActions,
  type EventListenerResult,
} from './events'
export { nodeId, type NodeId } from './nodeid'
import {
  component,
  componentElem,
  type Component,
  type ComponentElement,
} from './components'
export { component, type Component, type ComponentElement }
import {
  makeNonVoidElement,
  makeVoidElement,
  type A,
  type Abbr,
  type Address,
  type Article,
  type Aside,
  type B,
  type BlockElement,
  type Blockquote,
  type Br,
  type Button,
  type ButtonContent,
  type Cite,
  type Code,
  type Dd,
  type Details,
  type Dl,
  type Dt,
  type Div,
  type Element,
  type Em,
  type Fieldset,
  type Figcaption,
  type Figure,
  type Footer,
  type Form,
  type H1,
  type H2,
  type H3,
  type H4,
  type H5,
  type H6,
  type Header,
  type Hr,
  type I,
  type Img,
  type InlineElement,
  type Input,
  type Kbd,
  type Label,
  type Li,
  type Main,
  type Mark,
  type Nav,
  type NonVoidElement,
  type Ol,
  type Option,
  type P,
  type Pre,
  type Q,
  type ReplacedElement,
  type S,
  type Section,
  type Select,
  type Small,
  type Span,
  type Strong,
  type Sub,
  type Summary,
  type Sup,
  type Table,
  type Tbody,
  type Td,
  type Textarea,
  type Tfoot,
  type Th,
  type Thead,
  type Time,
  type Tr,
  type U,
  type Ul,
  type VoidElement,
} from './elems'
import type { NodeId } from './nodeid'
import type {
  Circle,
  Ellipse,
  Image,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Svg,
  SvgGraphicElement,
  Use,
} from './svg'
import {
  _,
  fixedView,
  nodeGroup,
  view,
  type NodeGroup,
  type View,
} from './views'
export type { NodeGroup, View }

/** A non-void element with an arbitrary tag name, for custom or non-standard HTML elements. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CustomElement<State, Event> = NonVoidElement<State, Event, string, any>

/** Union of all node types valid in block-level (flow) positions. */
export type FlowContent<State, Event> =
  | PhrasingContent<State, Event>
  | BlockElement<State, Event>
  | ReplacedElement<State, Event>
  | SvgGraphicElement<State, Event>
  | string
  | View<State, unknown, Event>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ComponentElement<any, any, any, any, any>
  | CustomElement<State, Event>

/** Union of inline elements and plain text nodes. */
export type PhrasingContent<State, Event> = InlineElement<State, Event> | string

/** Union of all virtual DOM node types: elements, text, views, and component instances. */
export type Node<State, Event> =
  | Element<State, Event>
  | string
  | View<State, unknown, Event>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ComponentElement<any, any, any, any, any>
  | CustomElement<State, Event>

export type NonTextNode<State, Event> = Exclude<Node<State, Event>, string>

/**
 * Factory that returns all HTML and SVG element builders with `State` and `Event` pre-applied.
 *
 * Each element comes in three forms:
 * - `div(...attrs)(...children)` — full curried form, accepts attributes then children
 * - `div_(...children)` — no-attribute shorthand, equivalent to `div()(...)`
 * - `div__(...attrs)` — no-children shorthand, equivalent to `div(...)()`
 *
 * Call `makeDom<State, Event>()` once at the top of your module and destructure the elements you need:
 * ```ts
 * const { div_, span_, button } = makeDom<State, Event>()
 * ```
 */
export function makeDom<State, Event>() {
  const functions = {
    br: makeVoidElement<State, Event, Br<State, Event>>('br'),
    hr: makeVoidElement<State, Event, Hr<State, Event>>('hr'),
    img: makeVoidElement<State, Event, Img<State, Event>>('img'),
    input: makeVoidElement<State, Event, Input<State, Event>>('input'),

    a: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      A<State, Event>
    >('a'),
    abbr: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Abbr<State, Event>
    >('abbr'),
    address: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Address<State, Event>
    >('address'),
    article: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Article<State, Event>
    >('article'),
    aside: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Aside<State, Event>
    >('aside'),
    b: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      B<State, Event>
    >('b'),
    blockquote: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Blockquote<State, Event>
    >('blockquote'),
    button: makeNonVoidElement<
      State,
      Event,
      ButtonContent<State, Event>,
      Button<State, Event>
    >('button'),
    cite: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Cite<State, Event>
    >('cite'),
    code: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Code<State, Event>
    >('code'),
    dd: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Dd<State, Event>
    >('dd'),
    details: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Details<State, Event>
    >('details'),
    div: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Div<State, Event>
    >('div'),
    dl: makeNonVoidElement<
      State,
      Event,
      Dt<State, Event> | Dd<State, Event>,
      Dl<State, Event>
    >('dl'),
    dt: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Dt<State, Event>
    >('dt'),
    em: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Em<State, Event>
    >('em'),
    fieldset: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Fieldset<State, Event>
    >('fieldset'),
    figcaption: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Figcaption<State, Event>
    >('figcaption'),
    figure: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Figure<State, Event>
    >('figure'),
    footer: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Footer<State, Event>
    >('footer'),
    form: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Form<State, Event>
    >('form'),
    h1: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      H1<State, Event>
    >('h1'),
    h2: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      H2<State, Event>
    >('h2'),
    h3: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      H3<State, Event>
    >('h3'),
    h4: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      H4<State, Event>
    >('h4'),
    h5: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      H5<State, Event>
    >('h5'),
    h6: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      H6<State, Event>
    >('h6'),
    header: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Header<State, Event>
    >('header'),
    i: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      I<State, Event>
    >('i'),
    kbd: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Kbd<State, Event>
    >('kbd'),
    label: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Label<State, Event>
    >('label'),
    li: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Li<State, Event>
    >('li'),
    main: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Main<State, Event>
    >('main'),
    mark: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Mark<State, Event>
    >('mark'),
    nav: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Nav<State, Event>
    >('nav'),
    ol: makeNonVoidElement<State, Event, Li<State, Event>, Ol<State, Event>>(
      'ol',
    ),
    option: makeNonVoidElement<State, Event, string, Option<State, Event>>(
      'option',
    ),
    p: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      P<State, Event>
    >('p'),
    pre: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Pre<State, Event>
    >('pre'),
    q: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Q<State, Event>
    >('q'),
    s: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      S<State, Event>
    >('s'),
    section: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Section<State, Event>
    >('section'),
    select: makeNonVoidElement<
      State,
      Event,
      Option<State, Event>,
      Select<State, Event>
    >('select'),
    small: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Small<State, Event>
    >('small'),
    span: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Span<State, Event>
    >('span'),
    strong: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Strong<State, Event>
    >('strong'),
    sub: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Sub<State, Event>
    >('sub'),
    summary: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Summary<State, Event>
    >('summary'),
    sup: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Sup<State, Event>
    >('sup'),
    table: makeNonVoidElement<
      State,
      Event,
      | Thead<State, Event>
      | Tbody<State, Event>
      | Tfoot<State, Event>
      | Tr<State, Event>,
      Table<State, Event>
    >('table'),
    tbody: makeNonVoidElement<
      State,
      Event,
      Tr<State, Event>,
      Tbody<State, Event>
    >('tbody'),
    td: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Td<State, Event>
    >('td'),
    textarea: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Textarea<State, Event>
    >('textarea'),
    tfoot: makeNonVoidElement<
      State,
      Event,
      Tr<State, Event>,
      Tfoot<State, Event>
    >('tfoot'),
    th: makeNonVoidElement<
      State,
      Event,
      FlowContent<State, Event>,
      Th<State, Event>
    >('th'),
    thead: makeNonVoidElement<
      State,
      Event,
      Tr<State, Event>,
      Thead<State, Event>
    >('thead'),
    time: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      Time<State, Event>
    >('time'),
    tr: makeNonVoidElement<
      State,
      Event,
      Th<State, Event> | Td<State, Event>,
      Tr<State, Event>
    >('tr'),
    u: makeNonVoidElement<
      State,
      Event,
      PhrasingContent<State, Event>,
      U<State, Event>
    >('u'),
    ul: makeNonVoidElement<State, Event, Li<State, Event>, Ul<State, Event>>(
      'ul',
    ),

    svg: makeNonVoidElement<
      State,
      Event,
      SvgGraphicElement<State, Event>,
      Svg<State, Event>
    >('svg/svg'),
    circle: makeVoidElement<State, Event, Circle<State, Event>>('svg/circle'),
    ellipse: makeVoidElement<State, Event, Ellipse<State, Event>>(
      'svg/ellipse',
    ),
    image: makeVoidElement<State, Event, Image<State, Event>>('svg/image'),
    line: makeVoidElement<State, Event, Line<State, Event>>('svg/line'),
    polyline: makeVoidElement<State, Event, Polyline<State, Event>>(
      'svg/polyline',
    ),
    polygon: makeVoidElement<State, Event, Polygon<State, Event>>(
      'svg/polygon',
    ),
    path: makeVoidElement<State, Event, Path<State, Event>>('svg/path'),
    rect: makeVoidElement<State, Event, Rect<State, Event>>('svg/rect'),
    use: makeVoidElement<State, Event, Use<State, Event>>('svg/use'),

    element: (tag: string) =>
      makeNonVoidElement<
        State,
        Event,
        FlowContent<State, Event>,
        NonVoidElement<State, Event, string, FlowContent<State, Event>>
      >(tag) as unknown as (
        ...attrs: readonly (readonly [string, string] | NodeId)[]
      ) => (
        ...children: readonly FlowContent<State, Event>[]
      ) => CustomElement<State, Event>,

    nodeGroup: nodeGroup<State, Event>,
    _: _<State, Event>,
    fixedView: fixedView<State, Event>,
  }

  return {
    ...functions,
    a_: functions.a(),
    a__: (...attrs: AttrArg[]) => functions.a(...attrs)(),
    abbr_: functions.abbr(),
    abbr__: (...attrs: AttrArg[]) => functions.abbr(...attrs)(),
    address_: functions.address(),
    address__: (...attrs: AttrArg[]) => functions.address(...attrs)(),
    article_: functions.article(),
    article__: (...attrs: AttrArg[]) => functions.article(...attrs)(),
    aside_: functions.aside(),
    aside__: (...attrs: AttrArg[]) => functions.aside(...attrs)(),
    b_: functions.b(),
    b__: (...attrs: AttrArg[]) => functions.b(...attrs)(),
    blockquote_: functions.blockquote(),
    blockquote__: (...attrs: AttrArg[]) => functions.blockquote(...attrs)(),
    button_: functions.button(),
    button__: (...attrs: AttrArg[]) => functions.button(...attrs)(),
    cite_: functions.cite(),
    cite__: (...attrs: AttrArg[]) => functions.cite(...attrs)(),
    code_: functions.code(),
    code__: (...attrs: AttrArg[]) => functions.code(...attrs)(),
    dd_: functions.dd(),
    dd__: (...attrs: AttrArg[]) => functions.dd(...attrs)(),
    details_: functions.details(),
    details__: (...attrs: AttrArg[]) => functions.details(...attrs)(),
    div_: functions.div(),
    div__: (...attrs: AttrArg[]) => functions.div(...attrs)(),
    dl_: functions.dl(),
    dl__: (...attrs: AttrArg[]) => functions.dl(...attrs)(),
    dt_: functions.dt(),
    dt__: (...attrs: AttrArg[]) => functions.dt(...attrs)(),
    em_: functions.em(),
    em__: (...attrs: AttrArg[]) => functions.em(...attrs)(),
    fieldset_: functions.fieldset(),
    fieldset__: (...attrs: AttrArg[]) => functions.fieldset(...attrs)(),
    figcaption_: functions.figcaption(),
    figcaption__: (...attrs: AttrArg[]) => functions.figcaption(...attrs)(),
    figure_: functions.figure(),
    figure__: (...attrs: AttrArg[]) => functions.figure(...attrs)(),
    footer_: functions.footer(),
    footer__: (...attrs: AttrArg[]) => functions.footer(...attrs)(),
    form_: functions.form(),
    form__: (...attrs: AttrArg[]) => functions.form(...attrs)(),
    h1_: functions.h1(),
    h1__: (...attrs: AttrArg[]) => functions.h1(...attrs)(),
    h2_: functions.h2(),
    h2__: (...attrs: AttrArg[]) => functions.h2(...attrs)(),
    h3_: functions.h3(),
    h3__: (...attrs: AttrArg[]) => functions.h3(...attrs)(),
    h4_: functions.h4(),
    h4__: (...attrs: AttrArg[]) => functions.h4(...attrs)(),
    h5_: functions.h5(),
    h5__: (...attrs: AttrArg[]) => functions.h5(...attrs)(),
    h6_: functions.h6(),
    h6__: (...attrs: AttrArg[]) => functions.h6(...attrs)(),
    header_: functions.header(),
    header__: (...attrs: AttrArg[]) => functions.header(...attrs)(),
    i_: functions.i(),
    i__: (...attrs: AttrArg[]) => functions.i(...attrs)(),
    kbd_: functions.kbd(),
    kbd__: (...attrs: AttrArg[]) => functions.kbd(...attrs)(),
    label_: functions.label(),
    label__: (...attrs: AttrArg[]) => functions.label(...attrs)(),
    li_: functions.li(),
    li__: (...attrs: AttrArg[]) => functions.li(...attrs)(),
    main_: functions.main(),
    main__: (...attrs: AttrArg[]) => functions.main(...attrs)(),
    mark_: functions.mark(),
    mark__: (...attrs: AttrArg[]) => functions.mark(...attrs)(),
    nav_: functions.nav(),
    nav__: (...attrs: AttrArg[]) => functions.nav(...attrs)(),
    ol_: functions.ol(),
    ol__: (...attrs: AttrArg[]) => functions.ol(...attrs)(),
    option_: functions.option(),
    option__: (...attrs: AttrArg[]) => functions.option(...attrs)(),
    p_: functions.p(),
    p__: (...attrs: AttrArg[]) => functions.p(...attrs)(),
    pre_: functions.pre(),
    pre__: (...attrs: AttrArg[]) => functions.pre(...attrs)(),
    q_: functions.q(),
    q__: (...attrs: AttrArg[]) => functions.q(...attrs)(),
    s_: functions.s(),
    s__: (...attrs: AttrArg[]) => functions.s(...attrs)(),
    section_: functions.section(),
    section__: (...attrs: AttrArg[]) => functions.section(...attrs)(),
    select_: functions.select(),
    select__: (...attrs: AttrArg[]) => functions.select(...attrs)(),
    small_: functions.small(),
    small__: (...attrs: AttrArg[]) => functions.small(...attrs)(),
    span_: functions.span(),
    span__: (...attrs: AttrArg[]) => functions.span(...attrs)(),
    strong_: functions.strong(),
    strong__: (...attrs: AttrArg[]) => functions.strong(...attrs)(),
    sub_: functions.sub(),
    sub__: (...attrs: AttrArg[]) => functions.sub(...attrs)(),
    summary_: functions.summary(),
    summary__: (...attrs: AttrArg[]) => functions.summary(...attrs)(),
    sup_: functions.sup(),
    sup__: (...attrs: AttrArg[]) => functions.sup(...attrs)(),
    svg_: functions.svg(),
    svg__: (...attrs: AttrArg[]) => functions.svg(...attrs)(),
    table_: functions.table(),
    table__: (...attrs: AttrArg[]) => functions.table(...attrs)(),
    tbody_: functions.tbody(),
    tbody__: (...attrs: AttrArg[]) => functions.tbody(...attrs)(),
    td_: functions.td(),
    td__: (...attrs: AttrArg[]) => functions.td(...attrs)(),
    textarea_: functions.textarea(),
    textarea__: (...attrs: AttrArg[]) => functions.textarea(...attrs)(),
    tfoot_: functions.tfoot(),
    tfoot__: (...attrs: AttrArg[]) => functions.tfoot(...attrs)(),
    th_: functions.th(),
    th__: (...attrs: AttrArg[]) => functions.th(...attrs)(),
    thead_: functions.thead(),
    thead__: (...attrs: AttrArg[]) => functions.thead(...attrs)(),
    time_: functions.time(),
    time__: (...attrs: AttrArg[]) => functions.time(...attrs)(),
    tr_: functions.tr(),
    tr__: (...attrs: AttrArg[]) => functions.tr(...attrs)(),
    u_: functions.u(),
    u__: (...attrs: AttrArg[]) => functions.u(...attrs)(),
    ul_: functions.ul(),
    ul__: (...attrs: AttrArg[]) => functions.ul(...attrs)(),
    view<Params>(
      nodeId: NodeId | string,
      nodes: (params: Params) => NodeGroup<State, Event> | Node<State, Event>,
    ) {
      return view<State, Params, Event>(nodeId, nodes)
    },
    componentElem<ComponentState, Params, ComponentEvent>(
      comp: Component<ComponentState, Params, ComponentEvent>,
      nodeId: NodeId,
      params?: Params,
    ) {
      return componentElem<
        State,
        Event,
        ComponentState,
        Params,
        ComponentEvent
      >(comp, nodeId, params)
    },
  }
}

/** Pattern-matches over a `Node` value, calling the appropriate case handler and returning its result. */
export function foldNode<State, Event, A>(
  node: Node<State, Event>,
  cases: {
    onText: (text: string) => A
    onVoidElement: (element: VoidElement<State, Event, string>) => A
    onNonVoidElement: (
      element: NonVoidElement<State, Event, string, Node<State, Event>>,
    ) => A
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onComponent: (component: ComponentElement<any, any, any, any, any>) => A
    onView: (view: View<State, unknown, Event>) => A
  },
): A {
  if (typeof node === 'string') {
    return cases.onText(node)
  }

  switch (node._type) {
    case 'Component':
      return cases.onComponent(node)
    case 'View':
      return cases.onView(node)

    case 'Element':
      switch (node.tag) {
        case 'br':
        case 'hr':
        case 'img':
        case 'input':
        case 'svg/circle':
        case 'svg/ellipse':
        case 'svg/image':
        case 'svg/line':
        case 'svg/polyline':
        case 'svg/polygon':
        case 'svg/path':
        case 'svg/rect':
        case 'svg/use':
          return cases.onVoidElement(node)
        default:
          // CustomElement (tag: string) prevents discriminated narrowing here;
          // all non-void cases reaching this branch have children: Node[]
          return cases.onNonVoidElement(
            node as NonVoidElement<State, Event, string, Node<State, Event>>,
          )
 }
  }
}
