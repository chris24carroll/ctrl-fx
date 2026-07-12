import { componentPath, type ComponentPath } from '.'
import type { Attr, Prop } from '../dom/attrs'
import type { Component, ComponentEventListener } from '../dom/components'
import type { ContainerListener, EventListener } from '../dom/events'
import type { NodeId } from '../dom/nodeid'
import type { View } from '../dom/views'
import { exhaustivenessCheck } from '../utils'
import type {
  RealDocument,
  RealElement,
  RealNode,
  RealTextNode,
} from './realdom'

export type ComponentState =
  | { _type: 'Uninitialized' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { _type: 'Ready'; value: any }

export type InternalNode =
  | InternalTextNode
  | InternalElementNode
  | ComponentNode
  | ViewNode

export type RootNode = {
  _type: 'RootNode'
  realNode: RealElement
  firstChild?: InternalNode
  prepend(node: InternalNode): void
  append(node: InternalNode): void
}

export function rootNode(realNode: RealElement): RootNode {
  return {
    _type: 'RootNode',
    realNode,
    prepend(node: InternalNode) {
      addNewChild(this, node, 'left')
    },
    append(node: InternalNode) {
      addNewChild(this, node, 'right')
    },
  }
}

export type ParentNode = InternalElementNode | ComponentNode | ViewNode

export type InternalTextNode = {
  readonly _type: 'InternalTextNode'
  text: string
  prevSibling?: InternalNode
  nextSibling?: InternalNode
  parent?: ParentNode
  realNode: RealTextNode
  before(node: InternalNode): void
  after(node: InternalNode): void
}

export type InternalElementNode = {
  readonly _type: 'InternalElementNode'
  tag: string
  nodeId?: NodeId
  attrs: readonly Attr[]
  props: readonly Prop[]
  eventListeners: readonly EventListener<unknown, unknown>[]
  prevSibling?: InternalNode
  nextSibling?: InternalNode
  parent?: ParentNode
  realNode: RealElement
  firstChild?: InternalNode
  before(node: InternalNode): void
  after(node: InternalNode): void
  prepend(node: InternalNode): void
  append(node: InternalNode): void
}

export type ComponentNode = {
  readonly _type: 'ComponentNode'
  component: Component<unknown, unknown, unknown>
  nodeId: NodeId
  state: ComponentState
  containerListeners: readonly ContainerListener<unknown, unknown>[]
  componentEventListeners: readonly ComponentEventListener<
    unknown,
    unknown,
    unknown
  >[]
  prevSibling?: InternalNode
  nextSibling?: InternalNode
  parent?: ParentNode | RootNode
  firstChild?: InternalNode
  before(node: InternalNode): void
  after(node: InternalNode): void
  prepend(node: InternalNode): void
  append(node: InternalNode): void
}

export function componentNode(
  component: Component<unknown, unknown, unknown>,
  nodeId: NodeId,
): ComponentNode {
  return {
    _type: 'ComponentNode',
    component,
    nodeId,
    state: { _type: 'Uninitialized' },
    containerListeners: [],
    componentEventListeners: [],
    before(node: InternalNode) {
      moveNodeNextTo(node, this, 'left')
    },
    after(node: InternalNode) {
      moveNodeNextTo(node, this, 'right')
    },
    prepend(node: InternalNode) {
      addNewChild(this, node, 'left')
    },
    append(node: InternalNode) {
      addNewChild(this, node, 'right')
    },
  }
}

export type ViewNode = {
  readonly _type: 'ViewNode'
  readonly nodeId: NodeId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
  containerListeners: readonly ContainerListener<unknown, unknown>[]
  prevSibling?: InternalNode
  nextSibling?: InternalNode
  parent?: ParentNode
  firstChild?: InternalNode
  before(node: InternalNode): void
  after(node: InternalNode): void
  prepend(node: InternalNode): void
  append(node: InternalNode): void
}

export function viewNode(view: View<unknown, unknown, unknown>): ViewNode {
  return {
    _type: 'ViewNode',
    nodeId: view.nodeId,
    params: view.params,
    containerListeners: [],
    after(nodeToMove: InternalNode): void {
      moveNodeNextTo(nodeToMove, this, 'right')
    },
    before(nodeToMove: InternalNode): void {
      moveNodeNextTo(nodeToMove, this, 'left')
    },
    prepend(node: InternalNode) {
      addNewChild(this, node, 'left')
    },
    append(node: InternalNode) {
      addNewChild(this, node, 'right')
    },
  }
}

export function internalTextNode(
  document: RealDocument,
  text: string,
): InternalTextNode {
  return {
    _type: 'InternalTextNode',
    text,
    realNode: document.createTextNode(text),
    after(nodeToMove: InternalNode): void {
      moveNodeNextTo(nodeToMove, this, 'right')
    },
    before(nodeToMove: InternalNode): void {
      moveNodeNextTo(nodeToMove, this, 'left')
    },
  }
}

export function internalElementNode(
  document: RealDocument,
  tag: string,
  nodeId: NodeId | undefined,
  attrs: readonly Attr[],
  eventListeners: readonly EventListener<unknown, unknown>[],
  props: readonly Prop[] = [],
): InternalElementNode {
  const realNode = document.createElement(tag)
  attrs.forEach(a => {
    realNode.setAttribute(a.name, a.value ? a.value : '')
  })
  props.forEach(p => {
    ;(realNode as unknown as Record<string, unknown>)[p.name] = p.value
  })

  return {
    _type: 'InternalElementNode',
    tag,
    nodeId,
    attrs,
    props,
    eventListeners,
    realNode,
    after(nodeToMove: InternalNode): void {
      moveNodeNextTo(nodeToMove, this, 'right')
    },
    before(nodeToMove: InternalNode): void {
      moveNodeNextTo(nodeToMove, this, 'left')
    },
    prepend(node: InternalNode) {
      addNewChild(this, node, 'left')
    },
    append(node: InternalNode) {
      addNewChild(this, node, 'right')
    },
  }
}

export function detach(
  node: InternalNode,
  leaveRealNodeAttached: boolean = false,
): void {
  // first remember the node's siblings
  const origPrevSibling = node.prevSibling
  const origNextSibling = node.nextSibling

  // if the nodeToMove is a first child, we need to update the parent
  if (!origPrevSibling) {
    if (node.parent) {
      node.parent.firstChild = origNextSibling
    }
  }

  // update the siblings to skip the nodeToMove
  if (origPrevSibling) {
    origPrevSibling.nextSibling = origNextSibling
  }

  if (origNextSibling) {
    origNextSibling.prevSibling = origPrevSibling
  }

  if (!leaveRealNodeAttached) {
    switch (node._type) {
      case 'InternalElementNode':
      case 'InternalTextNode': {
        node.realNode.remove()
        break
      }

      case 'ComponentNode':
      case 'ViewNode':
        break

      default:
        exhaustivenessCheck(node)
    }
  }

  node.prevSibling = undefined
  node.nextSibling = undefined
  node.parent = undefined
}

export type Position = 'left' | 'right'

export function moveNodeNextTo(
  nodeToMove: InternalNode,
  anchorNode: InternalNode,
  direction: Position,
): void {
  detach(nodeToMove, true)

  // update the new surrounding nodes and point to them
  switch (direction) {
    case 'right': {
      nodeToMove.nextSibling = anchorNode.nextSibling
      anchorNode.nextSibling = nodeToMove
      nodeToMove.prevSibling = anchorNode
      if (nodeToMove.nextSibling) {
        nodeToMove.nextSibling.prevSibling = nodeToMove
      }
      break
    }
    case 'left': {
      nodeToMove.prevSibling = anchorNode.prevSibling
      anchorNode.prevSibling = nodeToMove
      nodeToMove.nextSibling = anchorNode
      if (nodeToMove.prevSibling) {
        nodeToMove.prevSibling.nextSibling = nodeToMove
      } else if (anchorNode.parent) {
        anchorNode.parent.firstChild = nodeToMove
      }
      break
    }
    default: {
      exhaustivenessCheck(direction)
    }
  }

  // point to the potentially new parent
  nodeToMove.parent = anchorNode.parent

  const realNodesToMove = realNodesFor(nodeToMove)

  let realAnchorNode = getRealAnchorNode(anchorNode, direction)

  realNodesToMove.forEach(node => {
    switch (direction) {
      case 'right': {
        if (!realAnchorNode) {
          const realParent = realParentNode(anchorNode)
          if (realParent) {
            realParent.append(node)
          }
        } else {
          realAnchorNode.after(node)
        }
        realAnchorNode = node
        break
      }
      case 'left': {
        if (!realAnchorNode) {
          const realParent = realParentNode(anchorNode)
          if (realParent) {
            realParent.prepend(node)
          }
        } else {
          realAnchorNode.before(node)
        }
        realAnchorNode = node
        break
      }
      default: {
        exhaustivenessCheck(direction)
      }
    }
  })
}

function addNewChild(
  parent: ParentNode | RootNode,
  child: InternalNode,
  position: Position,
): void {
  detach(child, true)

  child.parent = parent

  if (position === 'left') {
    child.nextSibling = parent.firstChild
    parent.firstChild = child
  } else {
    if (parent.firstChild) {
      const curLastChild = lastNode(parent.firstChild)
      curLastChild.nextSibling = child
      child.prevSibling = curLastChild
    } else {
      parent.firstChild = child
    }
  }

  const realChildNodes = realNodesFor(child)

  if (parent._type === 'RootNode') {
    if (position === 'left') {
      parent.realNode.prepend(...realChildNodes)
    } else {
      parent.realNode.append(...realChildNodes)
    }
    return
  }

  // InternalElementNode has its own real DOM node — use it directly.
  // getRealSibling looks at the vdom siblings of the parent, not the parent's
  // children, so calling it here would insert the new child as a DOM sibling
  // of the parent rather than as a child.
  if (parent._type === 'InternalElementNode') {
    if (position === 'left') {
      parent.realNode.prepend(...realChildNodes)
    } else {
      parent.realNode.append(...realChildNodes)
    }
    return
  }

  // ComponentNode / ViewNode have no real DOM element of their own, so find
  // the adjacent real sibling to anchor the insertion.
  const realSibling = getRealSibling(parent, position)
  if (realSibling) {
    if (position === 'left') {
      realSibling.realNode.before(...realChildNodes)
    } else {
      realSibling.realNode.after(...realChildNodes)
    }
  } else {
    const realParent = realParentNode(parent)
    if (realParent) {
      if (position === 'left') {
        realParent.prepend(...realChildNodes)
      } else {
        realParent.append(...realChildNodes)
      }
    }
  }
}

function realNodesFor(node: InternalNode): readonly RealNode[] {
  switch (node._type) {
    case 'InternalElementNode':
    case 'InternalTextNode': {
      return [node.realNode]
    }

    case 'ComponentNode':
    case 'ViewNode': {
      const realNodes: RealNode[] = []
      let next = node.firstChild
      while (next) {
        realNodes.push(...realNodesFor(next))
        next = next.nextSibling
      }
      return realNodes
    }

    default: {
      exhaustivenessCheck(node)
    }
  }
}

/**
 * Return the RealNode to use when inserting an InternalNode after or before the
 * specified anchorNode
 *
 * This gets tricky, since a component or viewnode may represent zero or more
 * RealNodes. And since components and views can have components and views as
 * siblings and parents we have to potentially look through a lot of nodes until
 * we find one that represents a single RealNode.
 */
function getRealAnchorNode(
  anchorNode: InternalNode,
  insertionDirection: Position,
): RealNode | undefined {
  let curInitialNodeForLevel = anchorNode

  while (curInitialNodeForLevel) {
    let curNode: InternalNode | undefined = curInitialNodeForLevel

    while (curNode) {
      if (
        curNode._type === 'InternalTextNode' ||
        curNode._type === 'InternalElementNode'
      ) {
        return curNode.realNode
      }

      let curChild =
        insertionDirection === 'right'
          ? curNode.firstChild
            ? lastNode(curNode.firstChild)
            : null
          : curNode.firstChild

      while (curChild) {
        if (
          curChild._type === 'InternalElementNode' ||
          curChild._type === 'InternalTextNode'
        ) {
          return curChild.realNode
        }

        curChild =
          insertionDirection === 'right'
            ? curChild.prevSibling
            : curChild.nextSibling
      }

      curNode =
        insertionDirection === 'right'
          ? curNode.prevSibling
          : curNode.nextSibling
    }

    switch (curInitialNodeForLevel.parent?._type) {
      case 'InternalElementNode':
      case 'RootNode':
        return undefined

      case 'ComponentNode':
      case 'ViewNode': {
        curInitialNodeForLevel = curInitialNodeForLevel.parent
      }
    }
  }
  return undefined
}

function lastNode(node: InternalNode): InternalNode {
  let result = node
  while (result.nextSibling) {
    result = result.nextSibling
  }
  return result
}

function realParentNode(node: InternalNode): RealElement | undefined {
  return realClosestAncestor(node)?.realNode
}

export function realClosestAncestor(
  node: InternalNode,
): InternalElementNode | RootNode | undefined {
  const parent = node.parent
  if (!parent) {
    return undefined
  }

  switch (parent._type) {
    case 'InternalElementNode':
      return parent
    case 'ComponentNode':
      return realClosestAncestor(parent)
    case 'RootNode':
      return parent
    case 'ViewNode':
      return realClosestAncestor(parent)
  }
}

function getRealSibling(
  node: InternalNode,
  position: Position,
): InternalElementNode | InternalTextNode | undefined {
  let startNodeForCurrentLevel: InternalNode | undefined = node

  while (startNodeForCurrentLevel) {
    const sibling =
      position === 'left'
        ? startNodeForCurrentLevel.prevSibling
        : startNodeForCurrentLevel.nextSibling

    if (sibling) {
      const realSibling = getRealSiblingLookingLaterally(sibling, position)
      if (realSibling) {
        return realSibling
      }
    }

    const parent: RootNode | ParentNode | undefined =
      startNodeForCurrentLevel.parent

    if (!parent) {
      return undefined
    }

    switch (parent._type) {
      case 'InternalElementNode':
      case 'RootNode': {
        return undefined
      }

      case 'ComponentNode':
      case 'ViewNode': {
        startNodeForCurrentLevel = parent
        continue
      }

      default:
        exhaustivenessCheck(parent)
    }
  }

  return undefined
}

function getRealSiblingLookingLaterally(
  nextNode: InternalNode | undefined,
  position: Position,
): InternalElementNode | InternalTextNode | undefined {
  while (nextNode) {
    switch (nextNode._type) {
      case 'InternalElementNode':
      case 'InternalTextNode':
        return nextNode
      case 'ComponentNode':
      case 'ViewNode':
        if (nextNode.firstChild) {
          const child =
            position === 'left'
              ? lastNode(nextNode.firstChild)
              : nextNode.firstChild

          const rslt = getRealSiblingLookingLaterally(child, position)
          if (rslt) {
            return rslt
          }
        }

        nextNode =
          position === 'left' ? nextNode.prevSibling : nextNode.nextSibling
        continue
    }
  }

  return undefined
}

export function updateText(node: InternalTextNode, newText: string): void {
  if (node.text === newText) {
    return
  }

  node.text = newText
  node.realNode.nodeValue = newText
}

export function updateAttrs(
  node: InternalElementNode,
  newAttrs: readonly Attr[],
) {
  const oldAttrsMap = new Map(node.attrs.map(a => [a.name, a]))
  const newAttrsMap = new Map(newAttrs.map(a => [a.name, a]))

  node.attrs.forEach(oldAttr => {
    if (!newAttrsMap.has(oldAttr.name)) {
      node.realNode.removeAttribute(oldAttr.name)
    }
  })

  newAttrs.forEach(newAttr => {
    const oldAttr = oldAttrsMap.get(newAttr.name)
    if (!oldAttr || newAttr.value !== oldAttr.value) {
      node.realNode.setAttribute(
        newAttr.name,
        newAttr.value ? newAttr.value : '',
      )
    }
  })

  node.attrs = newAttrs
}

export function updateProps(
  node: InternalElementNode,
  newProps: readonly Prop[],
): void {
  const newPropsMap = new Map(newProps.map(p => [p.name, p.value]))
  node.props.forEach(oldProp => {
    if (!newPropsMap.has(oldProp.name)) {
      ;(node.realNode as unknown as Record<string, unknown>)[oldProp.name] =
        undefined
    }
  })
  newProps.forEach(p => {
    ;(node.realNode as unknown as Record<string, unknown>)[p.name] = p.value
  })
  node.props = newProps
}

export function closestComponentPath(
  node: InternalNode,
): ComponentPath | undefined {
  const closestForParent =
    node.parent && node.parent._type !== 'RootNode'
      ? closestComponentPath(node.parent)
      : undefined

  switch (node._type) {
    case 'InternalElementNode':
    case 'InternalTextNode':
    case 'ViewNode':
      return closestForParent
    case 'ComponentNode':
      return componentPath(node.nodeId, closestForParent)
  }
}
