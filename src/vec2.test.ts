import { describe, it, expect } from 'vitest'
import { vec2, add, sub, scale, length, lengthSq, normalize, dot } from './vec2'

describe('vec2', () => {
  it('creates a vector', () => {
    const v = vec2(3, 4)
    expect(v).toEqual({ x: 3, y: 4 })
  })

  it('adds two vectors', () => {
    expect(add(vec2(1, 2), vec2(3, 4))).toEqual({ x: 4, y: 6 })
  })

  it('subtracts two vectors', () => {
    expect(sub(vec2(5, 7), vec2(2, 3))).toEqual({ x: 3, y: 4 })
  })

  it('scales a vector', () => {
    expect(scale(vec2(2, 3), 4)).toEqual({ x: 8, y: 12 })
  })

  it('computes length', () => {
    expect(length(vec2(3, 4))).toBe(5)
  })

  it('computes length squared', () => {
    expect(lengthSq(vec2(3, 4))).toBe(25)
  })

  it('normalizes a vector', () => {
    const n = normalize(vec2(3, 4))
    expect(n.x).toBeCloseTo(0.6)
    expect(n.y).toBeCloseTo(0.8)
  })

  it('normalizes zero vector safely', () => {
    expect(normalize(vec2(0, 0))).toEqual({ x: 0, y: 0 })
  })

  it('computes dot product', () => {
    expect(dot(vec2(1, 2), vec2(3, 4))).toBe(11)
  })
})
