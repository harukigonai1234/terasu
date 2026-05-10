import { describe, it, expect } from 'vitest'
import { createClock } from './clock'

describe('createClock', () => {
  it('starts at t=0', () => {
    const clock = createClock()
    expect(clock.value).toBe(0)
  })

  it('advances when playing', () => {
    const clock = createClock()
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.016)
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.032)
  })

  it('does not advance when paused', () => {
    const clock = createClock({ playing: false })
    clock.tick(0.016)
    expect(clock.value).toBe(0)
  })

  it('can be paused and resumed', () => {
    const clock = createClock()
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.016)

    clock.playing = false
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.016) // unchanged

    clock.playing = true
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.032) // resumed
  })

  it('speed multiplier scales time advancement', () => {
    const clock = createClock({ speed: 2 })
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.032) // 2x speed
  })

  it('speed can be changed at runtime', () => {
    const clock = createClock()
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.016)

    clock.speed = 0.5
    clock.tick(0.016)
    expect(clock.value).toBeCloseTo(0.024) // 0.016 + 0.008
  })

  it('speed of 0 freezes time while still playing', () => {
    const clock = createClock({ speed: 0 })
    clock.tick(0.016)
    expect(clock.value).toBe(0)
  })

  it('reset returns to t=0', () => {
    const clock = createClock()
    clock.tick(0.016)
    clock.tick(0.016)
    expect(clock.value).toBeGreaterThan(0)
    clock.reset()
    expect(clock.value).toBe(0)
  })

  it('continues advancing after reset', () => {
    const clock = createClock()
    clock.tick(1)
    clock.reset()
    clock.tick(0.5)
    expect(clock.value).toBeCloseTo(0.5)
  })

  it('defaults to playing=true and speed=1', () => {
    const clock = createClock()
    expect(clock.playing).toBe(true)
    expect(clock.speed).toBe(1)
  })

  it('accepts initial config', () => {
    const clock = createClock({ playing: false, speed: 3 })
    expect(clock.playing).toBe(false)
    expect(clock.speed).toBe(3)
  })
})
