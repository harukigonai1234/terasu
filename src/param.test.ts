import { describe, it, expect, vi } from 'vitest'
import { createParam, createParamSet } from './param'

describe('createParam', () => {
  it('initializes with value and range', () => {
    const p = createParam('gravity', { value: 9.81, range: [0, 25] })
    expect(p.value).toBe(9.81)
    expect(p.range).toEqual([0, 25])
    expect(p.label).toBe('gravity')
  })

  it('uses custom label when provided', () => {
    const p = createParam('g', { value: 9.81, range: [0, 25], label: 'Gravity', unit: 'm/s²' })
    expect(p.label).toBe('Gravity')
    expect(p.unit).toBe('m/s²')
  })

  it('clamps initial value to range', () => {
    const p = createParam('x', { value: 100, range: [0, 10] })
    expect(p.value).toBe(10)
  })

  it('clamps on set', () => {
    const p = createParam('x', { value: 5, range: [0, 10] })
    p.set(-5)
    expect(p.value).toBe(0)
    p.set(999)
    expect(p.value).toBe(10)
  })

  it('notifies listeners on change', () => {
    const p = createParam('x', { value: 5, range: [0, 10] })
    const listener = vi.fn()
    p.subscribe(listener)
    p.set(7)
    expect(listener).toHaveBeenCalledWith(7, p)
  })

  it('does not notify when value unchanged', () => {
    const p = createParam('x', { value: 5, range: [0, 10] })
    const listener = vi.fn()
    p.subscribe(listener)
    p.set(5)
    expect(listener).not.toHaveBeenCalled()
  })

  it('unsubscribe stops notifications', () => {
    const p = createParam('x', { value: 5, range: [0, 10] })
    const listener = vi.fn()
    const unsub = p.subscribe(listener)
    unsub()
    p.set(8)
    expect(listener).not.toHaveBeenCalled()
  })

  it('value setter triggers listeners', () => {
    const p = createParam('x', { value: 5, range: [0, 10] })
    const listener = vi.fn()
    p.subscribe(listener)
    p.value = 3
    expect(listener).toHaveBeenCalledWith(3, p)
    expect(p.value).toBe(3)
  })

  it('computes default step as 1/100 of range', () => {
    const p = createParam('x', { value: 5, range: [0, 100] })
    expect(p.step).toBe(1)
  })

  it('uses custom step', () => {
    const p = createParam('x', { value: 5, range: [0, 10], step: 0.5 })
    expect(p.step).toBe(0.5)
  })
})

describe('createParamSet', () => {
  it('adds and retrieves params', () => {
    const set = createParamSet()
    const g = set.add('gravity', { value: 9.81, range: [0, 25] })
    expect(set.get('gravity')).toBe(g)
  })

  it('returns all values as a record', () => {
    const set = createParamSet()
    set.add('g', { value: 9.81, range: [0, 25] })
    set.add('L', { value: 1, range: [0.1, 5] })
    expect(set.values()).toEqual({ g: 9.81, L: 1 })
  })

  it('global listener fires when any param changes', () => {
    const set = createParamSet()
    set.add('a', { value: 1, range: [0, 10] })
    set.add('b', { value: 2, range: [0, 10] })
    const listener = vi.fn()
    set.subscribe(listener)

    set.get('a')!.set(5)
    expect(listener).toHaveBeenCalledTimes(1)
    set.get('b')!.set(8)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('unsubscribe from global listener', () => {
    const set = createParamSet()
    set.add('x', { value: 1, range: [0, 10] })
    const listener = vi.fn()
    const unsub = set.subscribe(listener)
    unsub()
    set.get('x')!.set(9)
    expect(listener).not.toHaveBeenCalled()
  })
})
