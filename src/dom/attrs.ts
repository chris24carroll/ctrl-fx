import { isNodeId, type NodeId } from './nodeid'

/** A virtual DOM attribute: a name/value pair set on the real DOM element via
 * `setAttribute`. */
export interface Attr {
  readonly name: string
  readonly value?: string
}

/** Creates an `Attr`. */
export function attr(name: string, value: string): Attr {
  return {
    name,
    value,
  }
}

/** A JavaScript property set directly on the DOM element object, as opposed to
 * an HTML attribute. */
export interface Prop {
  readonly name: string
  readonly value: unknown
}

/** Creates a `Prop`. */
export function prop(name: string, value: unknown): Prop {
  return { name, value }
}

export type AttrArg = Attr | [string, string] | string

export function normalizeAttrArg(arg: AttrArg): Attr {
  if (Array.isArray(arg)) {
    return { name: arg[0], value: arg[1] }
  } else if (typeof arg === 'object') {
    return arg
  } else {
    return { name: arg }
  }
}

export type AttrOrNodeIdArgs = [NodeId, ...AttrArg[]] | [...AttrArg[]]

export function normalizeAttrArgs(args: AttrOrNodeIdArgs): Attr[] {
  const attrs: Attr[] = []
  args.forEach(arg => {
    if (!isNodeId(arg)) {
      attrs.push(normalizeAttrArg(arg))
    }
  })
  return attrs
}

export interface SupportsAttrs {
  readonly attrs: readonly Attr[]
  idAttr(): string | undefined
}

/*
export function withCommonAttrAccesssorSupport<T extends SupportsAttrs>() {
  return {
    idAttr(this: T): string | undefined {
      return option(this.attrs.find(attr => attr.name === 'id'))
        .flatMap(a => {
          return a.value
        }).getOrElse(undefined)
    }
  }
}
  */

export function getId(attrs: readonly Attr[]): string | undefined {
  const id = attrs.find(a => a.name.toLowerCase() === 'id')
  return id ? id.value : undefined
}

/** Shorthand for `attr('aria-label', value)`. */
export function ariaLabel(value: string): Attr {
  return attr('aria-label', value)
}

/** Shorthand for `attr('aria-hidden', value)`. */
export function ariaHidden(value: string): Attr {
  return attr('aria-hidden', value)
}

/** Shorthand for `attr('id', value)`. */
export function id(value: string): Attr {
  return attr('id', value)
}

export function width(value: string): Attr {
  return attr('width', value)
}

export function height(value: string): Attr {
  return attr('height', value)
}

export function transform(value: string): Attr {
  return attr('transform', value)
}

export function viewBox(value: string): Attr {
  return attr('viewBox', value)
}

export function fill(value: string): Attr {
  return attr('fill', value)
}

export function focusable(value: string): Attr {
  return attr('focusable', value)
}

export function xmlns(value: string): Attr {
  return attr('xmlns', value)
}

export function d(value: string): Attr {
  return attr('d', value)
}

export function stroke(value: string): Attr {
  return attr('stroke', value)
}

export function strokeWidth(value: string): Attr {
  return attr('stroke-width', value)
}

export function strokeLinecap(value: string): Attr {
  return attr('stroke-linecap', value)
}

export function strokeLinejoin(value: string): Attr {
  return attr('stroke-linejoin', value)
}

export function cx(value: string): Attr {
  return attr('cx', value)
}

export function cy(value: string): Attr {
  return attr('cy', value)
}

export function r(value: string): Attr {
  return attr('r', value)
}

export function role(value: string): Attr {
  return attr('role', value)
}

/** Shorthand for `attr('type', value)`. */
export function typeAttr(value: string): Attr {
  return attr('type', value)
}

/** Shorthand for `attr('class', value)`. */
export function cls(value: string): Attr {
  return attr('class', value)
}

/**
 * Each argument is either a plain class name (always applied), `[boolean,
 * string]` (applied when the boolean is true), or `[boolean, string, string]`
 * (first class when true, second when false). All selected names are joined
 * with a space into a single `class` attribute.
 */
export type classListArg =
  | string
  | [boolean, string]
  | [boolean, string, string]

/** Builds a `class` attribute from a list of conditional class entries. See
 * `classListArg`. */
export function classList(...classes: classListArg[]): Attr {
  const allClasses: string[] = []
  classes.forEach(cls => {
    if (typeof cls === 'string') {
      allClasses.push(cls)
    } else {
      if (cls.length == 2) {
        if (cls[0]) {
          allClasses.push(cls[1])
        }
      } else {
        if (cls[0]) {
          allClasses.push(cls[1])
        } else {
          allClasses.push(cls[2])
        }
      }
    }
  })

  return cls(allClasses.join(' '))
}

export function attrs(attrMap: Record<string, string>): readonly Attr[] {
  return Object.entries(attrMap).map(([k, v]) => {
    return attr(k, v)
  })
}

/** Converts a map of CSS custom property names to values into a `style`
 * attribute. */
export function cssVars(vars: Record<string, string>): Attr {
  return attr(
    'style',
    Object.entries(vars)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; '),
  )
}
