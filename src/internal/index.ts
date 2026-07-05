import type { Uuid } from '..'
import type { Component } from '../dom/components'
import { nodeId, type NodeId } from '../dom/nodeid'
import {
  defaultTestConfig,
  type TestableComponent,
  type TestConfig,
  type TestData,
} from '../testing'
import { testableComponent } from './testing'

export type ComponentPath = {
  readonly nodeId: NodeId
  readonly parentComponentPath: ComponentPath | undefined
  format(): string
}

export function componentPath(
  id: NodeId | string,
  parentComponentPath?: ComponentPath,
): ComponentPath {
  return {
    parentComponentPath,
    nodeId: typeof id === 'string' ? nodeId(id) : id,
    format(): string {
      return formatComponentPath(this)
    },
  }
}

/**
 * Return a string representation of the specified `ComponentPath`
 * @param path
 */
export function formatComponentPath(path: ComponentPath): string {
  const parentStr = path.parentComponentPath
    ? formatComponentPath(path.parentComponentPath)
    : ''

  return parentStr + '/' + encodeURIComponent(path.nodeId.value)
}

export function generateUuid(): Uuid {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID() as Uuid
  } else {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      const v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }) as Uuid
  }
}

export type TimerId = ReturnType<typeof globalThis.setTimeout>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function testComponent<State, Params, Event, Custom = {}>(
  component: Component<State, Params, Event>,
  config?: TestConfig,
  data?: TestData<Custom>,
): TestableComponent<State, Params, Event, Custom> {
  return testableComponent(component, config ?? defaultTestConfig(), data)
}
