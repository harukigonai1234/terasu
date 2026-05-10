import { describe, it, expect } from 'vitest'
import { scalarField, vectorField, Domain } from './field'
import { vec2 } from './vec2'

const unitDomain: Domain = { xMin: -1, xMax: 1, yMin: -1, yMax: 1 }

describe('scalarField', () => {
  it('evaluates a scalar field at a point', () => {
    const f = scalarField((p) => p.x * p.x + p.y * p.y)
    expect(f.fn(vec2(3, 4))).toBe(25)
  })

  it('samples a scalar field over a domain', () => {
    const f = scalarField((p) => p.x + p.y)
    const sample = f.sample(unitDomain, 3)

    expect(sample.resolution).toBe(3)
    expect(sample.values).toHaveLength(3)
    expect(sample.values[0]).toHaveLength(3)

    // bottom-left corner: (-1) + (-1) = -2
    expect(sample.values[0]![0]).toBeCloseTo(-2)
    // top-right corner: (1) + (1) = 2
    expect(sample.values[2]![2]).toBeCloseTo(2)
    // center: (0) + (0) = 0
    expect(sample.values[1]![1]).toBeCloseTo(0)
  })

  it('supports time-dependent fields', () => {
    const f = scalarField((p, t = 0) => Math.sin(p.x - t))
    expect(f.fn(vec2(0, 0), 0)).toBeCloseTo(0)
    expect(f.fn(vec2(Math.PI / 2, 0), 0)).toBeCloseTo(1)
    expect(f.fn(vec2(Math.PI / 2, 0), Math.PI / 2)).toBeCloseTo(0)
  })
})

describe('vectorField', () => {
  it('evaluates a vector field at a point', () => {
    const f = vectorField((p) => vec2(-p.y, p.x))
    const v = f.fn(vec2(1, 0))
    expect(v.x).toBeCloseTo(0)
    expect(v.y).toBeCloseTo(1)
  })

  it('samples a vector field over a domain', () => {
    const f = vectorField((p) => vec2(p.x, p.y))
    const sample = f.sample(unitDomain, 3)

    expect(sample.resolution).toBe(3)
    expect(sample.values).toHaveLength(3)

    // center should be zero vector
    expect(sample.values[1]![1]).toEqual({ x: 0, y: 0 })
    // top-right should be (1, 1)
    expect(sample.values[2]![2]!.x).toBeCloseTo(1)
    expect(sample.values[2]![2]!.y).toBeCloseTo(1)
  })

  it('can model a coulomb-like field', () => {
    const f = vectorField((p) => {
      const r2 = p.x * p.x + p.y * p.y
      if (r2 < 0.001) return vec2(0, 0)
      const r = Math.sqrt(r2)
      return vec2(p.x / (r2 * r), p.y / (r2 * r))
    })

    // field should point radially outward and fall off with r^2
    const atR1 = f.fn(vec2(1, 0))
    const atR2 = f.fn(vec2(2, 0))
    expect(atR1.x).toBeCloseTo(1)
    expect(atR2.x).toBeCloseTo(0.25)
  })
})
