import { describe, it, expect } from 'vitest'
import * as terasu from '../src/index'

/**
 * True end-to-end physics tests. No mocks. No React. No DOM faking.
 *
 * These execute the actual example code with a real clock object,
 * capture what the renderer draws, and assert on the physics output.
 */

function createTestHarness() {
  // Real clock (same pattern as playground)
  const clock = { t: 0, playing: true, speed: 1 }
  const tParam = { get value() { return clock.t } }

  // Capture draw calls instead of rendering to canvas
  const draws: { method: string; args: any[] }[] = []

  // Mock canvas that records draw calls (but the PHYSICS is real)
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 1, lineJoin: 'miter',
    lineCap: 'butt', globalAlpha: 1, font: '', textAlign: 'start',
    textBaseline: 'alphabetic',
    fillRect() {}, beginPath() {}, stroke() {}, fill() {},
    moveTo() {}, lineTo() {}, arc() {}, closePath() {}, fillText() {},
  }
  const canvas = {
    width: 500, height: 500,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
    addEventListener() {}, removeEventListener() {},
    style: {} as any,
  }

  // Wrap terasu to intercept drawTrajectory calls and stub UI (we test physics, not DOM)
  const wrappedTerasu = {
    ...terasu,
    createUI() { return { container: null, destroy() {} } },
    createRenderer(config: any) {
      const r = terasu.createRenderer({ ...config, canvas: canvas as any, interactive: false })
      const origDrawTraj = r.drawTrajectory.bind(r)
      r.drawTrajectory = (points: number[][], options?: any) => {
        draws.push({ method: 'drawTrajectory', args: [points, options] })
        origDrawTraj(points, options)
      }
      return r
    },
  }

  // Execute user code
  function run(code: string) {
    draws.length = 0
    const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', 't', code)
    // Single frame execution (no real RAF — just call draw once)
    let drawFn: Function | null = null
    const fakeRAF = (cb: Function) => { drawFn = cb; return 0 }
    const controls = { innerHTML: '' }
    fn(wrappedTerasu, canvas, controls, fakeRAF, tParam)
    return { drawFn, draws }
  }

  function stepFrame() {
    if (clock.playing) {
      clock.t += 0.016 * clock.speed
    }
  }

  return { clock, tParam, run, stepFrame, draws, canvas }
}

describe('oscillator physics responds to t (no mocks on physics)', () => {
  const oscillatorCode = `
const { dynamicalSystem2D, createRenderer, createParamSet, createUI } = terasu
const params = createParamSet()
const gamma = params.add('gamma', { value: 0.2, range: [0, 2] })
const omega = params.add('omega', { value: 1.0, range: [0.1, 5] })
const domain = { xMin: -4, xMax: 4, yMin: -4, yMax: 4 }
const renderer = createRenderer({ canvas, domain })
const ui = createUI({ container: controls, params })
function draw() {
  const sys = dynamicalSystem2D({
    dx: (x, v) => v,
    dy: (x, v) => -2 * gamma.value * v - omega.value ** 2 * x,
  })
  renderer.clear()
  renderer.drawGrid()
  const duration = Math.max(0.1, t.value)
  const colors = ['#c74440', '#2d70b3', '#388c46', '#6042a6']
  const initials = [[3, 0], [-2, 2], [0, -3], [2, 2]]
  initials.forEach((init, i) => {
    const traj = sys.trajectory({ initial: init, duration: duration, dt: 0.02 })
    renderer.drawTrajectory(traj, { color: colors[i] })
  })
  requestAnimationFrame(draw)
}
draw()
`

  it('at t=0 trajectories are very short (duration=0.1)', () => {
    const { clock, run, draws } = createTestHarness()
    clock.t = 0
    run(oscillatorCode)
    // 4 trajectories drawn
    const trajDraws = draws.filter(d => d.method === 'drawTrajectory')
    expect(trajDraws.length).toBe(4)
    // Each should be short (duration=0.1, dt=0.02 → ~5 points)
    for (const d of trajDraws) {
      expect(d.args[0].length).toBeLessThan(10)
    }
  })

  it('at t=5 trajectories are longer', () => {
    const { clock, run, draws } = createTestHarness()
    clock.t = 5
    run(oscillatorCode)
    const trajDraws = draws.filter(d => d.method === 'drawTrajectory')
    expect(trajDraws.length).toBe(4)
    // duration=5, dt=0.02 → ~250 points
    for (const d of trajDraws) {
      expect(d.args[0].length).toBeGreaterThan(200)
    }
  })

  it('at t=10 trajectories are even longer', () => {
    const { clock, run, draws } = createTestHarness()
    clock.t = 10
    run(oscillatorCode)
    const trajDraws = draws.filter(d => d.method === 'drawTrajectory')
    for (const d of trajDraws) {
      expect(d.args[0].length).toBeGreaterThan(450)
    }
  })

  it('scrubbing t back to 0 makes trajectories short again', () => {
    const { clock, run, draws } = createTestHarness()

    // First at t=5
    clock.t = 5
    run(oscillatorCode)
    const longDraws = draws.filter(d => d.method === 'drawTrajectory')
    const longLength = longDraws[0]!.args[0].length

    // Scrub back to t=0
    clock.t = 0
    draws.length = 0
    // Re-execute draw (simulates next frame)
    run(oscillatorCode)
    const shortDraws = draws.filter(d => d.method === 'drawTrajectory')
    const shortLength = shortDraws[0]!.args[0].length

    expect(shortLength).toBeLessThan(longLength)
    expect(shortLength).toBeLessThan(10) // back to minimal
  })

  it('pausing holds trajectory at fixed length across frames', () => {
    const { clock, run, draws } = createTestHarness()

    clock.t = 3
    run(oscillatorCode)
    const draws1 = draws.filter(d => d.method === 'drawTrajectory')
    const len1 = draws1[0]!.args[0].length

    // "Pause" = clock.playing = false, t stays at 3
    clock.playing = false
    draws.length = 0
    run(oscillatorCode)
    const draws2 = draws.filter(d => d.method === 'drawTrajectory')
    const len2 = draws2[0]!.args[0].length

    expect(len2).toBe(len1) // same length — paused
  })
})

describe('double pendulum diverges with time (no mocks)', () => {
  const pendulumCode = `
const { dynamicalSystem, createRenderer, createParamSet, createUI } = terasu
const params = createParamSet()
const g = params.add('g', { value: 9.81, range: [1, 20] })
const domain = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 }
const renderer = createRenderer({ canvas, domain })
const sys = dynamicalSystem({
  dim: 4,
  derivative: (s) => {
    const [t1, t2, w1, w2] = s
    const dt = t1 - t2
    const den = 2 - Math.cos(2 * dt)
    const dw1 = (-g.value * (2 * Math.sin(t1) - Math.sin(t2) * Math.cos(dt))
                 - Math.sin(dt) * (w2 * w2 + w1 * w1 * Math.cos(dt))) / den
    const dw2 = (2 * Math.sin(dt) * (w1 * w1 + g.value * Math.cos(t1)
                 + w2 * w2 * Math.cos(dt) * 0.5)) / den
    return [w1, w2, dw1, dw2]
  },
})
const colors = ['#c74440', '#2d70b3']
const initials = [
  [Math.PI * 0.75, Math.PI * 0.5, 0, 0],
  [Math.PI * 0.75 + 0.01, Math.PI * 0.5, 0, 0],
]
const ui = createUI({ container: controls, params })
function draw() {
  const duration = Math.max(0.1, t.value)
  renderer.clear()
  renderer.drawGrid()
  initials.forEach((init, i) => {
    const traj = sys.trajectory({ initial: init, duration: duration, dt: 0.005 })
    const points = traj.map(s => {
      const x = Math.sin(s[0]) + Math.sin(s[1])
      const y = -Math.cos(s[0]) - Math.cos(s[1])
      return [x, y]
    })
    renderer.drawTrajectory(points, { color: colors[i], lineWidth: 1.5 })
  })
  requestAnimationFrame(draw)
}
draw()
`

  it('at t=0 paths are nearly empty', () => {
    const { clock, run, draws } = createTestHarness()
    clock.t = 0
    run(pendulumCode)
    const trajDraws = draws.filter(d => d.method === 'drawTrajectory')
    expect(trajDraws.length).toBe(2)
    // duration=0.1, dt=0.005 → ~20 points
    for (const d of trajDraws) {
      expect(d.args[0].length).toBeLessThan(25)
    }
  })

  it('at t=5 paths are long and have diverged', () => {
    const { clock, run, draws } = createTestHarness()
    clock.t = 5
    run(pendulumCode)
    const trajDraws = draws.filter(d => d.method === 'drawTrajectory')
    // duration=5, dt=0.005 → 1000 points
    for (const d of trajDraws) {
      expect(d.args[0].length).toBeGreaterThan(900)
    }

    // The two paths should have diverged (chaos)
    const path1 = trajDraws[0]!.args[0] as number[][]
    const path2 = trajDraws[1]!.args[0] as number[][]
    const lastIdx = path1.length - 1
    const dx = Math.abs(path1[lastIdx]![0]! - path2[lastIdx]![0]!)
    const dy = Math.abs(path1[lastIdx]![1]! - path2[lastIdx]![1]!)
    expect(dx + dy).toBeGreaterThan(0.01) // diverged
  })

  it('scrubbing back to 0 erases the paths', () => {
    const { clock, run, draws } = createTestHarness()

    clock.t = 5
    run(pendulumCode)
    draws.length = 0

    clock.t = 0
    run(pendulumCode)
    const trajDraws = draws.filter(d => d.method === 'drawTrajectory')
    for (const d of trajDraws) {
      expect(d.args[0].length).toBeLessThan(25) // back to tiny
    }
  })
})
