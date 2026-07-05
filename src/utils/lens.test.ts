import { describe, expect, it } from 'vitest'
import { composeLenses, lensFromPath, lensFromProp } from './lens'

type Address = { street: string; city: string }
type Person = { name: string; age: number; address: Address }

const nameLens = lensFromProp<Person>()('name')
const ageLens = lensFromProp<Person>()('age')
const addressLens = lensFromProp<Person>()('address')
const streetLens = lensFromProp<Address>()('street')

const person: Person = { name: 'Alice', age: 30, address: { street: '1 Main', city: 'Springfield' } }

describe('lensFromProp', () => {
  it('gets the correct field', () => {
    expect(nameLens.get(person)).toBe('Alice')
    expect(ageLens.get(person)).toBe(30)
  })

  it('set returns updated object without mutating', () => {
    const updated = nameLens.set(person, 'Bob')
    expect(updated.name).toBe('Bob')
    expect(person.name).toBe('Alice')
  })

  it('set preserves other fields', () => {
    const updated = nameLens.set(person, 'Bob')
    expect(updated.age).toBe(30)
    expect(updated.address).toBe(person.address)
  })
})

describe('composeLenses', () => {
  const personStreetLens = composeLenses(addressLens, streetLens)

  it('gets nested value', () => {
    expect(personStreetLens.get(person)).toBe('1 Main')
  })

  it('sets nested value without mutating outer', () => {
    const updated = personStreetLens.set(person, '42 Oak')
    expect(updated.address.street).toBe('42 Oak')
    expect(person.address.street).toBe('1 Main')
  })

  it('preserves unrelated fields when setting nested value', () => {
    const updated = personStreetLens.set(person, '42 Oak')
    expect(updated.name).toBe('Alice')
    expect(updated.address.city).toBe('Springfield')
  })
})

describe('lensFromPath', () => {
  const streetPath = lensFromPath<Person>()('address', 'street')

  it('gets deeply nested value', () => {
    expect(streetPath.get(person)).toBe('1 Main')
  })

  it('sets deeply nested value', () => {
    const updated = streetPath.set(person, '99 Pine')
    expect(updated.address.street).toBe('99 Pine')
    expect(person.address.street).toBe('1 Main')
  })

  it('preserves sibling fields when setting', () => {
    const updated = streetPath.set(person, '99 Pine')
    expect(updated.address.city).toBe('Springfield')
    expect(updated.name).toBe('Alice')
  })

  it('single-key path works like lensFromProp', () => {
    const singleKey = lensFromPath<Person>()('name')
    expect(singleKey.get(person)).toBe('Alice')
    const updated = singleKey.set(person, 'Carol')
    expect(updated.name).toBe('Carol')
  })
})
