import { describe, expect, it } from 'vitest'
import {
  adjustCountsAndGetListenerTypesToRemoveAndAdd,
  makeListenerCounts,
} from './eventmgr'
import { eventTypes, type EventType } from '../dom/events'

describe('adjustCountsAndGetListenerTypesToRemove', () => {
  it('should properly adjust listener counts', () => {
    const counts = makeListenerCounts(eventTypes)
    counts.click.regular = 3
    counts.touchend.regular = 1

    const currListeners: { _type: EventType }[] = [
      { _type: 'click' },
      { _type: 'click' },
      { _type: 'touchend' },
    ]

    const newListeners: { _type: EventType }[] = [
      { _type: 'keydown' },
      { _type: 'click' },
    ]

    const adjustments = adjustCountsAndGetListenerTypesToRemoveAndAdd(
      counts,
      currListeners,
      newListeners,
    )

    expect(adjustments.toRemove.size).toStrictEqual(1)
    expect(adjustments.toRemove.has('touchend')).toStrictEqual(true)
    expect(adjustments.toAdd.size).toStrictEqual(1)
    expect(adjustments.toAdd.has('keydown')).toStrictEqual(true)
    expect(counts.click.regular).toStrictEqual(2)
    expect(counts.keydown.regular).toStrictEqual(1)
    expect(counts.keyup.regular).toStrictEqual(0)
    expect(counts.textinput.regular).toStrictEqual(0)
    expect(counts.touchcancel.regular).toStrictEqual(0)
    expect(counts.touchmove.regular).toStrictEqual(0)
    expect(counts.touchstart.regular).toStrictEqual(0)
    expect(counts.touchend.regular).toStrictEqual(0)
  })
})
