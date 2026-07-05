export type NodeId = {
  _tag: 'node_id'
  value: string
  eq(that: NodeId): boolean
}

export function nodeId(value: string): NodeId {
  return {
    _tag: 'node_id',
    value,
    eq(that: NodeId): boolean {
      return this.value === that.value
    },
  }
}

export function isNodeId(value: unknown): value is NodeId {
  if (value) {
    if (typeof value === 'object') {
      if (Object.prototype.hasOwnProperty.call(value, '_tag')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tag = (value as { _tag: any })['_tag']
        if (tag) {
          return tag === 'node_id'
        }
      }
    }
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findNodeId(items: any[]): NodeId | undefined {
  return items.find(isNodeId)
}
