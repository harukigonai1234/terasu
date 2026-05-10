import { describe, it, expect } from 'vitest'
import { createTimeEvolution } from './time-evolution'
import { createParticle, constantForce } from './particle'
import { vec2 } from './vec2'

describe('createTimeEvolution', () => {
  it('initializes at t=0, paused', () => {
    const time = createTimeEvolution()
    expect(time.t).toBe(0)
    expect(time.running).toBe(false)
  })

  it('steps forward', () => {
    const time = createTimeEvolution({ dt: 0.1 })
    time.step()
    expect(time.t).toBeCloseTo(0.1)
  })

  it('advances particles on step', () => {
    const time = createTimeEvolution({ dt: 0.01 })
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(10, 0) })
    time.addParticle(p)
    time.stepN(100) // 1 second
    expect(p.state.position.x).toBeCloseTo(10, 1)
    expect(time.t).toBeCloseTo(1, 5)
  })

  it('applies forces during evolution', () => {
    const time = createTimeEvolution({ dt: 0.001 })
    const p = createParticle({ position: vec2(0, 100), mass: 1 })
    p.addForce(constantForce(vec2(0, -10)))
    time.addParticle(p)
    time.stepN(1000) // 1 second of freefall
    // y = 100 - 0.5*10*1^2 = 95
    expect(p.state.position.y).toBeCloseTo(95, 0)
  })

  it('play and pause change running state', () => {
    const time = createTimeEvolution()
    expect(time.running).toBe(false)
    time.play()
    expect(time.running).toBe(true)
    time.pause()
    expect(time.running).toBe(false)
  })

  it('reset returns to t=0 and clears trails', () => {
    const time = createTimeEvolution({ dt: 0.01 })
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
    p.trailEnabled = true
    time.addParticle(p)
    time.stepN(50)
    expect(time.t).toBeGreaterThan(0)
    expect(p.trail.length).toBeGreaterThan(0)

    time.reset()
    expect(time.t).toBe(0)
    expect(p.trail).toHaveLength(0)
  })

  it('speed multiplier scales effective dt', () => {
    const time = createTimeEvolution({ dt: 0.01, speed: 2.0 })
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(10, 0) })
    time.addParticle(p)
    time.stepN(50) // 50 steps at effective dt=0.02 → t=1.0
    expect(time.t).toBeCloseTo(1.0)
    expect(p.state.position.x).toBeCloseTo(10, 1)
  })

  it('scrubTo re-integrates to target time', () => {
    const time = createTimeEvolution({ dt: 0.01 })
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(5, 0) })
    time.addParticle(p)
    // First advance normally
    time.stepN(100)
    expect(time.t).toBeCloseTo(1.0)
    // Reset and scrub to t=0.5
    p.reset({ position: vec2(0, 0), velocity: vec2(5, 0) })
    time.scrubTo(0.5)
    expect(time.t).toBeCloseTo(0.5)
    expect(p.state.position.x).toBeCloseTo(2.5, 1)
  })

  it('multiple particles evolve independently', () => {
    const time = createTimeEvolution({ dt: 0.01 })
    const p1 = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
    const p2 = createParticle({ position: vec2(0, 0), velocity: vec2(0, 2) })
    time.addParticle(p1)
    time.addParticle(p2)
    time.stepN(100)
    expect(p1.state.position.x).toBeCloseTo(1, 1)
    expect(p1.state.position.y).toBeCloseTo(0, 5)
    expect(p2.state.position.x).toBeCloseTo(0, 5)
    expect(p2.state.position.y).toBeCloseTo(2, 1)
  })
})
