import { describe, it, expect } from 'vitest'
import { dynamicalSystem, dynamicalSystem2D } from './dynamical-system'
import { Domain } from './field'
import { vec2 } from './vec2'

const unitDomain: Domain = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 }

describe('dynamicalSystem2D', () => {
  it('creates a system from dx/dy functions', () => {
    const sys = dynamicalSystem2D({
      dx: (x, y) => -y,
      dy: (x, y) => x,
    })
    expect(sys.dim).toBe(2)
  })

  it('computes a trajectory for simple harmonic oscillator', () => {
    const sys = dynamicalSystem2D({
      dx: (x, y) => y,
      dy: (x, y) => -x,
    })

    const traj = sys.trajectory({ initial: [1, 0], duration: Math.PI, dt: 0.001 })

    // after half period, should be at (-1, 0)
    const last = traj[traj.length - 1]!
    expect(last[0]).toBeCloseTo(-1, 2)
    expect(last[1]).toBeCloseTo(0, 2)
  })

  it('trajectory length matches expected steps', () => {
    const sys = dynamicalSystem2D({
      dx: (_x, _y) => 1,
      dy: (_x, _y) => 0,
    })

    const traj = sys.trajectory({ initial: [0, 0], duration: 1, dt: 0.1 })
    expect(traj).toHaveLength(11) // initial + 10 steps
  })

  it('supports params', () => {
    const sys = dynamicalSystem2D({
      dx: (_x, y, _p) => y,
      dy: (x, _y, p) => -(p.k ?? 1) * x,
      params: { k: 4 },
    })

    // with k=4, omega=2, half period = π/2
    const traj = sys.trajectory({ initial: [1, 0], duration: Math.PI / 2, dt: 0.001 })
    const last = traj[traj.length - 1]!
    expect(last![0]).toBeCloseTo(-1, 2)
  })

  it('produces a phase portrait as a vector field', () => {
    const sys = dynamicalSystem2D({
      dx: (x, y) => y,
      dy: (x, y) => -x,
    })

    const field = sys.phasePortrait(unitDomain)
    expect(field.kind).toBe('vector')

    // at (1, 0), flow should be (0, -1)
    const v = field.fn(vec2(1, 0))
    expect(v.x).toBeCloseTo(0)
    expect(v.y).toBeCloseTo(-1)
  })

  it('supports euler integrator', () => {
    const sys = dynamicalSystem2D({
      dx: (_x, _y) => 1,
      dy: (_x, _y) => 2,
    })

    const traj = sys.trajectory({ initial: [0, 0], duration: 1, dt: 0.1, integrator: 'euler' })
    const last = traj[traj.length - 1]!
    expect(last[0]).toBeCloseTo(1, 5)
    expect(last[1]).toBeCloseTo(2, 5)
  })
})

describe('dynamicalSystem (generic)', () => {
  it('handles higher-dimensional systems', () => {
    // double spring: x1'' = -x1 + (x2-x1), x2'' = -(x2-x1)
    // state = [x1, x2, v1, v2]
    const sys = dynamicalSystem({
      dim: 4,
      derivative: (state) => {
        const [x1, x2, v1, v2] = state
        return [v1!, v2!, -x1! + (x2! - x1!), -(x2! - x1!)]
      },
    })

    const traj = sys.trajectory({ initial: [1, 0, 0, 0], duration: 2, dt: 0.01 })
    expect(traj.length).toBeGreaterThan(100)

    // energy conservation: E = 0.5*(v1^2 + v2^2) + 0.5*(x1^2 + (x2-x1)^2)
    const first = traj[0]!
    const last = traj[traj.length - 1]!
    const energy = (s: number[]) =>
      0.5 * (s[2]! * s[2]! + s[3]! * s[3]!) + 0.5 * (s[0]! * s[0]! + (s[1]! - s[0]!) * (s[1]! - s[0]!))
    expect(energy(last)).toBeCloseTo(energy(first), 3)
  })
})

describe('fixedPoints', () => {
  it('finds the origin as a center for harmonic oscillator', () => {
    const sys = dynamicalSystem2D({
      dx: (x, y) => y,
      dy: (x, y) => -x,
    })

    const fps = sys.fixedPoints(unitDomain)
    expect(fps.length).toBe(1)
    expect(fps[0]!.position.x).toBeCloseTo(0)
    expect(fps[0]!.position.y).toBeCloseTo(0)
    expect(fps[0]!.classification).toBe('center')
  })

  it('finds stable node for overdamped oscillator', () => {
    const sys = dynamicalSystem2D({
      dx: (x, y) => y,
      dy: (x, y) => -x - 3 * y, // heavily damped
    })

    const fps = sys.fixedPoints(unitDomain)
    expect(fps.length).toBe(1)
    expect(fps[0]!.classification).toBe('stable-node')
  })

  it('finds saddle point', () => {
    // dx = x, dy = -y → saddle at origin
    const sys = dynamicalSystem2D({
      dx: (x, _y) => x,
      dy: (_x, y) => -y,
    })

    const fps = sys.fixedPoints(unitDomain)
    expect(fps.length).toBe(1)
    expect(fps[0]!.classification).toBe('saddle')
  })

  it('finds unstable spiral', () => {
    // dx = x + y, dy = -x + y → unstable spiral
    const sys = dynamicalSystem2D({
      dx: (x, y) => x + y,
      dy: (x, y) => -x + y,
    })

    const fps = sys.fixedPoints(unitDomain)
    expect(fps.length).toBe(1)
    expect(fps[0]!.classification).toBe('unstable-spiral')
  })

  it('finds multiple fixed points', () => {
    // dx = x(1-x), dy = -y → fixed points at (0,0) and (1,0)
    const sys = dynamicalSystem2D({
      dx: (x, _y) => x * (1 - x),
      dy: (_x, y) => -y,
    })

    const fps = sys.fixedPoints({ xMin: -1, xMax: 2, yMin: -1, yMax: 1 })
    expect(fps.length).toBe(2)

    const sorted = fps.sort((a, b) => a.position.x - b.position.x)
    expect(sorted[0]!.position.x).toBeCloseTo(0)
    expect(sorted[1]!.position.x).toBeCloseTo(1)
  })

  it('classifies stable spiral (damped oscillator)', () => {
    const sys = dynamicalSystem2D({
      dx: (x, y) => y,
      dy: (x, y) => -x - 0.5 * y,
    })

    const fps = sys.fixedPoints(unitDomain)
    expect(fps.length).toBe(1)
    expect(fps[0]!.classification).toBe('stable-spiral')
  })
})
