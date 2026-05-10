import { describe, it, expect } from 'vitest'
import { createParticle, springForce, constantForce } from './particle'
import { vectorField } from './field'
import { vec2, length } from './vec2'

describe('createParticle', () => {
  it('initializes with position and zero velocity', () => {
    const p = createParticle({ position: vec2(1, 2) })
    expect(p.state.position).toEqual({ x: 1, y: 2 })
    expect(p.state.velocity).toEqual({ x: 0, y: 0 })
    expect(p.mass).toBe(1)
    expect(p.charge).toBe(0)
  })

  it('initializes with explicit velocity', () => {
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(3, 4) })
    expect(p.state.velocity).toEqual({ x: 3, y: 4 })
  })

  it('free particle moves in straight line', () => {
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
    for (let i = 0; i < 100; i++) p.step(0.01, i * 0.01)
    expect(p.state.position.x).toBeCloseTo(1, 2)
    expect(p.state.position.y).toBeCloseTo(0, 2)
  })

  it('records trail when enabled', () => {
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
    p.trailEnabled = true
    p.step(0.1, 0)
    p.step(0.1, 0.1)
    p.step(0.1, 0.2)
    expect(p.trail).toHaveLength(3)
  })

  it('does not record trail when disabled', () => {
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
    p.step(0.1, 0)
    p.step(0.1, 0.1)
    expect(p.trail).toHaveLength(0)
  })

  it('reset restores initial state and clears trail', () => {
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
    p.trailEnabled = true
    for (let i = 0; i < 10; i++) p.step(0.1, i * 0.1)
    p.reset({ position: vec2(0, 0), velocity: vec2(1, 0) })
    expect(p.state.position).toEqual({ x: 0, y: 0 })
    expect(p.trail).toHaveLength(0)
  })
})

describe('forces', () => {
  it('constant force produces uniform acceleration', () => {
    const p = createParticle({ position: vec2(0, 0), mass: 1 })
    p.addForce(constantForce(vec2(0, -10)))
    // freefall for 1 second: y = -0.5*g*t^2 = -5
    for (let i = 0; i < 1000; i++) p.step(0.001, i * 0.001)
    expect(p.state.position.y).toBeCloseTo(-5, 1)
    expect(p.state.velocity.y).toBeCloseTo(-10, 1)
  })

  it('spring force produces oscillation', () => {
    const p = createParticle({ position: vec2(1, 0), mass: 1 })
    p.addForce(springForce(vec2(0, 0), 1))
    // omega = sqrt(k/m) = 1, period = 2pi, half period = pi
    const dt = 0.001
    const steps = Math.round(Math.PI / dt)
    for (let i = 0; i < steps; i++) p.step(dt, i * dt)
    expect(p.state.position.x).toBeCloseTo(-1, 1)
    expect(p.state.position.y).toBeCloseTo(0, 1)
  })

  it('spring force conserves energy (Verlet)', () => {
    const k = 4
    const p = createParticle({ position: vec2(2, 0), mass: 1 })
    p.addForce(springForce(vec2(0, 0), k))

    const energy = () => {
      const KE = 0.5 * (p.state.velocity.x ** 2 + p.state.velocity.y ** 2)
      const PE = 0.5 * k * (p.state.position.x ** 2 + p.state.position.y ** 2)
      return KE + PE
    }

    const E0 = energy()
    for (let i = 0; i < 10000; i++) p.step(0.001, i * 0.001)
    expect(energy()).toBeCloseTo(E0, 2)
  })

  it('particle in vector field responds to gravity-type force', () => {
    // uniform downward field
    const field = vectorField(() => vec2(0, -10))
    const p = createParticle({ position: vec2(0, 0), mass: 2 })
    p.inField(field, 'gravity')
    // F = m * field = 2 * (0, -10) = (0, -20), a = (0, -10)
    for (let i = 0; i < 1000; i++) p.step(0.001, i * 0.001)
    expect(p.state.position.y).toBeCloseTo(-5, 1)
  })

  it('charged particle in electric field', () => {
    // uniform E field in x
    const E = vectorField(() => vec2(100, 0))
    const p = createParticle({ position: vec2(0, 0), mass: 1, charge: 2 })
    p.inField(E, 'lorentz')
    // F = qE = 200, a = 200, x = 0.5*200*t^2
    for (let i = 0; i < 100; i++) p.step(0.01, i * 0.01)
    // t=1: x = 100
    expect(p.state.position.x).toBeCloseTo(100, 0)
  })

  it('multiple forces combine', () => {
    const p = createParticle({ position: vec2(0, 0), mass: 1 })
    p.addForce(constantForce(vec2(1, 0)))
    p.addForce(constantForce(vec2(0, 1)))
    for (let i = 0; i < 100; i++) p.step(0.01, i * 0.01)
    // diagonal motion: x and y should be equal
    expect(p.state.position.x).toBeCloseTo(p.state.position.y, 5)
  })
})

describe('circular orbit', () => {
  it('particle orbits under central force', () => {
    // circular orbit: v = sqrt(GM/r), here GM=1, r=1, v=1
    const p = createParticle({ position: vec2(1, 0), velocity: vec2(0, 1), mass: 1 })
    // central force: F = -r_hat / r^2
    p.addForce((state) => {
      const r2 = state.position.x ** 2 + state.position.y ** 2
      if (r2 < 1e-10) return vec2(0, 0)
      const r = Math.sqrt(r2)
      return vec2(-state.position.x / (r2 * r), -state.position.y / (r2 * r))
    })

    // after one full orbit (t = 2pi), should return near start
    const dt = 0.001
    const steps = Math.round(2 * Math.PI / dt)
    for (let i = 0; i < steps; i++) p.step(dt, i * dt)

    expect(p.state.position.x).toBeCloseTo(1, 1)
    expect(p.state.position.y).toBeCloseTo(0, 1)
    // radius should stay ~1 throughout
    expect(length(p.state.position)).toBeCloseTo(1, 1)
  })
})
