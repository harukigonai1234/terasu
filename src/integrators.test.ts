import { describe, it, expect } from 'vitest'
import { euler, rk4 } from './integrators'

describe('euler', () => {
  it('integrates constant derivative', () => {
    const deriv = () => [1, 2]
    const result = euler(deriv, [0, 0], 0, 0.1)
    expect(result[0]).toBeCloseTo(0.1)
    expect(result[1]).toBeCloseTo(0.2)
  })

  it('integrates exponential growth (with expected error)', () => {
    const deriv = (state: number[]) => [state[0]!]
    let state = [1]
    for (let i = 0; i < 100; i++) {
      state = euler(deriv, state, i * 0.01, 0.01)
    }
    // euler overshoots e^1 ≈ 2.718, but should be in the ballpark
    expect(state[0]!).toBeGreaterThan(2.5)
    expect(state[0]!).toBeLessThan(3.0)
  })
})

describe('rk4', () => {
  it('integrates constant derivative exactly', () => {
    const deriv = () => [1, 2]
    const result = rk4(deriv, [0, 0], 0, 0.1)
    expect(result[0]).toBeCloseTo(0.1)
    expect(result[1]).toBeCloseTo(0.2)
  })

  it('integrates exponential growth accurately', () => {
    const deriv = (state: number[]) => [state[0]!]
    let state = [1]
    for (let i = 0; i < 100; i++) {
      state = rk4(deriv, state, i * 0.01, 0.01)
    }
    // rk4 should nail e^1 ≈ 2.71828 to many decimal places
    expect(state[0]!).toBeCloseTo(Math.E, 6)
  })

  it('integrates simple harmonic oscillator with energy conservation', () => {
    // x'' = -x => state = [x, v], deriv = [v, -x]
    const deriv = (state: number[]) => [state[1]!, -state[0]!]
    let state = [1, 0] // start at x=1, v=0
    const dt = 0.01

    for (let i = 0; i < 1000; i++) {
      state = rk4(deriv, state, i * dt, dt)
    }
    // after t=10 (≈1.6 periods), energy should be conserved
    const energy = 0.5 * (state[0]! * state[0]! + state[1]! * state[1]!)
    expect(energy).toBeCloseTo(0.5, 4)
  })

  it('matches analytical solution for harmonic oscillator', () => {
    const deriv = (state: number[]) => [state[1]!, -state[0]!]
    let state = [1, 0]
    const dt = 0.001
    const T = Math.PI // half period

    const steps = Math.round(T / dt)
    for (let i = 0; i < steps; i++) {
      state = rk4(deriv, state, i * dt, dt)
    }
    // at t=π, x should be -1, v should be 0
    expect(state[0]!).toBeCloseTo(-1, 4)
    expect(state[1]!).toBeCloseTo(0, 3)
  })
})
