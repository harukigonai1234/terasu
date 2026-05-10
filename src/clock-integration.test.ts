import { describe, it, expect } from 'vitest'

describe('clock + animation loop integration (no mocks)', () => {
  // Simulates exactly what the playground does: a clock object shared between
  // the RAF wrapper and the play/pause button handler.

  function createPlayground() {
    const clock = { t: 0, playing: true, speed: 1 }
    const tParam = { get value() { return clock.t } }
    const frames: number[] = []

    // Simulates the wrappedRAF — called by user's draw(), ticks clock, calls fn
    function wrappedRAF(fn: (timestamp: number) => void) {
      // Simulate one frame
      if (clock.playing) {
        clock.t += 0.016 * clock.speed
      }
      fn(performance.now())
      frames.push(clock.t)
    }

    // Simulates user code: a draw function that calls requestAnimationFrame(draw)
    let drawCount = 0
    const maxFrames = 100

    function runUserCode() {
      function draw() {
        drawCount++
        if (drawCount < maxFrames) {
          wrappedRAF(draw)
        }
      }
      wrappedRAF(draw)
    }

    return { clock, tParam, frames, runUserCode, getDrawCount: () => drawCount }
  }

  it('t advances when playing', () => {
    const { clock, tParam, runUserCode } = createPlayground()
    runUserCode()
    // After 100 frames at 0.016s each: t ≈ 1.6
    expect(tParam.value).toBeGreaterThan(1.5)
    expect(tParam.value).toBeCloseTo(100 * 0.016, 1)
  })

  it('t stops advancing when paused', () => {
    const { clock, tParam, frames, runUserCode, getDrawCount } = createPlayground()

    // Modify: pause after 10 frames
    const origPlaying = clock.playing
    let frameCount = 0
    const origT = clock.t

    // Run manually frame by frame
    function stepFrame() {
      if (clock.playing) {
        clock.t += 0.016 * clock.speed
      }
    }

    // 10 frames playing
    for (let i = 0; i < 10; i++) stepFrame()
    const tAfter10 = clock.t
    expect(tAfter10).toBeCloseTo(0.16, 2)

    // Pause (simulates button click)
    clock.playing = false

    // 10 more frames paused
    for (let i = 0; i < 10; i++) stepFrame()
    expect(clock.t).toBe(tAfter10) // should not have changed
  })

  it('t resumes advancing after unpause', () => {
    const { clock } = createPlayground()

    // Advance 5 frames
    for (let i = 0; i < 5; i++) {
      if (clock.playing) clock.t += 0.016
    }
    expect(clock.t).toBeCloseTo(0.08, 3)

    // Pause
    clock.playing = false
    for (let i = 0; i < 5; i++) {
      if (clock.playing) clock.t += 0.016
    }
    expect(clock.t).toBeCloseTo(0.08, 3) // unchanged

    // Resume
    clock.playing = true
    for (let i = 0; i < 5; i++) {
      if (clock.playing) clock.t += 0.016
    }
    expect(clock.t).toBeCloseTo(0.16, 3) // advanced again
  })

  it('scrubbing t manually works when paused', () => {
    const { clock, tParam } = createPlayground()

    clock.playing = false
    clock.t = 5.0 // user drags slider to t=5

    expect(tParam.value).toBe(5.0)

    // Frames still fire but t doesn't advance
    for (let i = 0; i < 10; i++) {
      if (clock.playing) clock.t += 0.016
    }
    expect(tParam.value).toBe(5.0) // unchanged
  })

  it('speed multiplier affects advancement rate', () => {
    const { clock } = createPlayground()
    clock.speed = 2

    for (let i = 0; i < 10; i++) {
      if (clock.playing) clock.t += 0.016 * clock.speed
    }
    expect(clock.t).toBeCloseTo(0.32, 2) // 2x speed
  })

  it('the shared object pattern: button handler and RAF read same state', () => {
    // This is the exact pattern from the playground:
    // - timeRef.current is one object
    // - const clock = timeRef.current (assigned once in run())
    // - button handler sets timeRef.current.playing = false
    // - RAF wrapper reads clock.playing
    // They should be the same object reference.

    const timeRef = { current: { t: 0, playing: true, speed: 1 } }
    const clock = timeRef.current // assigned in run()

    // Simulate button click
    timeRef.current.playing = false

    // clock and timeRef.current are the same object
    expect(clock.playing).toBe(false)
    expect(clock === timeRef.current).toBe(true)
  })

  it('BUT: if run() reassigns clock, button handler and RAF diverge', () => {
    // This would be the bug: if run() does `clock = { ...timeRef.current }`
    // instead of `clock = timeRef.current`, they become different objects.

    const timeRef = { current: { t: 0, playing: true, speed: 1 } }

    // If run() copies instead of referencing:
    const clock = { ...timeRef.current } // BUG: creates a copy

    // Button handler sets on timeRef.current
    timeRef.current.playing = false

    // But clock is a separate object — doesn't see the change!
    expect(clock.playing).toBe(true) // STILL TRUE — this is the bug
    expect(clock === timeRef.current).toBe(false)
  })
})
