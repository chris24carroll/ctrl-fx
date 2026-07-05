import type { NonVoidElement, VoidElement } from './elems'

export type SvgGraphicElement<State, Event> =
  | Circle<State, Event>
  | Ellipse<State, Event>
  | Image<State, Event>
  | Line<State, Event>
  | Polyline<State, Event>
  | Polygon<State, Event>
  | Path<State, Event>
  | Rect<State, Event>
  | Use<State, Event>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Circle<State, Event> extends VoidElement<
  State,
  Event,
  'svg/circle'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Ellipse<State, Event> extends VoidElement<
  State,
  Event,
  'svg/ellipse'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Image<State, Event> extends VoidElement<
  State,
  Event,
  'svg/image'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Line<State, Event> extends VoidElement<
  State,
  Event,
  'svg/line'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Polyline<State, Event> extends VoidElement<
  State,
  Event,
  'svg/polyline'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Polygon<State, Event> extends VoidElement<
  State,
  Event,
  'svg/polygon'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Path<State, Event> extends VoidElement<
  State,
  Event,
  'svg/path'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Rect<State, Event> extends VoidElement<
  State,
  Event,
  'svg/rect'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Use<State, Event> extends VoidElement<
  State,
  Event,
  'svg/use'
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Svg<State, Event> extends NonVoidElement<
  State,
  Event,
  'svg/svg',
  SvgGraphicElement<State, Event>
> {}
