import { describe, it, expect } from 'vitest'
import { vec3, add3, sub3, scale3, length3, lengthSq3, normalize3, dot3, cross } from './vec3'

describe('vec3', () => {
  it('creates a vector', () => {
    expect(vec3(1, 2, 3)).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('adds', () => {
    expect(add3(vec3(1, 2, 3), vec3(4, 5, 6))).toEqual({ x: 5, y: 7, z: 9 })
  })

  it('subtracts', () => {
    expect(sub3(vec3(5, 7, 9), vec3(1, 2, 3))).toEqual({ x: 4, y: 5, z: 6 })
  })

  it('scales', () => {
    expect(scale3(vec3(1, 2, 3), 2)).toEqual({ x: 2, y: 4, z: 6 })
  })

  it('computes length', () => {
    expect(length3(vec3(2, 3, 6))).toBe(7)
  })

  it('computes length squared', () => {
    expect(lengthSq3(vec3(2, 3, 6))).toBe(49)
  })

  it('normalizes', () => {
    const n = normalize3(vec3(0, 0, 5))
    expect(n).toEqual({ x: 0, y: 0, z: 1 })
  })

  it('normalizes zero vector safely', () => {
    expect(normalize3(vec3(0, 0, 0))).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('computes dot product', () => {
    expect(dot3(vec3(1, 2, 3), vec3(4, 5, 6))).toBe(32)
  })

  it('computes cross product', () => {
    // x cross y = z
    expect(cross(vec3(1, 0, 0), vec3(0, 1, 0))).toEqual({ x: 0, y: 0, z: 1 })
    // y cross x = -z
    expect(cross(vec3(0, 1, 0), vec3(1, 0, 0))).toEqual({ x: 0, y: 0, z: -1 })
  })

  it('cross product orthogonal to both inputs', () => {
    const a = vec3(1, 2, 3)
    const b = vec3(4, 5, 6)
    const c = cross(a, b)
    expect(dot3(a, c)).toBeCloseTo(0)
    expect(dot3(b, c)).toBeCloseTo(0)
  })
})
