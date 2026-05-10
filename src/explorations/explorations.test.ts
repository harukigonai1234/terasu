import { describe, it, expect } from 'vitest'
import { createDipoleExploration } from './dipole'
import { createOscillatorExploration } from './oscillator'
import { createDoublePendulumExploration } from './double-pendulum'
import { createWaveInterferenceExploration } from './wave-interference'
import { createLorenzExploration } from './lorenz'
import { vec2 } from '../vec2'

describe('dipole exploration', () => {
  it('creates field that is nonzero away from charges', () => {
    const exp = createDipoleExploration()
    const field = exp.field()
    const v = field.fn(vec2(3, 3))
    expect(v.x).not.toBe(0)
    expect(v.y).not.toBe(0)
  })

  it('field is zero at singularity (near charge)', () => {
    const exp = createDipoleExploration()
    const field = exp.field()
    // At the positive charge position (separation/2, 0) = (1, 0)
    const v = field.fn(vec2(1, 0))
    expect(v.x).toBe(0)
    expect(v.y).toBe(0)
  })

  it('responds to param changes', () => {
    const exp = createDipoleExploration()
    const before = exp.field().fn(vec2(3, 0))
    exp.params.get('charge')!.set(5)
    const after = exp.field().fn(vec2(3, 0))
    expect(Math.abs(after.x)).toBeGreaterThan(Math.abs(before.x))
  })
})

describe('oscillator exploration', () => {
  it('produces trajectories that spiral inward when damped', () => {
    const exp = createOscillatorExploration()
    const sys = exp.system()
    const traj = sys.trajectory({ initial: [3, 0], duration: 20, dt: 0.01 })
    const last = traj[traj.length - 1]!
    // Should be near origin after 20s of damped motion
    expect(Math.abs(last[0]!)).toBeLessThan(0.5)
    expect(Math.abs(last[1]!)).toBeLessThan(0.5)
  })

  it('undamped oscillator conserves amplitude', () => {
    const exp = createOscillatorExploration()
    exp.params.get('gamma')!.set(0)
    const sys = exp.system()
    const traj = sys.trajectory({ initial: [3, 0], duration: 10, dt: 0.01 })
    const last = traj[traj.length - 1]!
    // Energy conservation: x^2 + v^2/omega^2 should stay constant
    const energy = last[0]! ** 2 + last[1]! ** 2
    expect(energy).toBeCloseTo(9, 1) // started at (3,0), E=9
  })
})

describe('double pendulum exploration', () => {
  it('produces 4D trajectory', () => {
    const exp = createDoublePendulumExploration()
    const sys = exp.system()
    const traj = sys.trajectory({
      initial: [Math.PI / 4, Math.PI / 4, 0, 0],
      duration: 2,
      dt: 0.01,
    })
    expect(traj[0]).toHaveLength(4)
    expect(traj.length).toBeGreaterThan(100)
  })

  it('toCartesian converts angles to tip position', () => {
    const exp = createDoublePendulumExploration()
    // Both pendulums hanging straight down: θ1=0, θ2=0
    const [x, y] = exp.toCartesian([0, 0, 0, 0])
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(-2) // L1 + L2 = 2 below pivot
  })

  it('shows sensitivity to initial conditions (chaos)', () => {
    const exp = createDoublePendulumExploration()
    const sys = exp.system()
    const traj1 = sys.trajectory({ initial: [2, 1, 0, 0], duration: 10, dt: 0.005 })
    const traj2 = sys.trajectory({ initial: [2.001, 1, 0, 0], duration: 10, dt: 0.005 })
    const last1 = traj1[traj1.length - 1]!
    const last2 = traj2[traj2.length - 1]!
    // After 10s, tiny perturbation should have diverged significantly
    const diff = Math.abs(last1[0]! - last2[0]!) + Math.abs(last1[1]! - last2[1]!)
    expect(diff).toBeGreaterThan(0.1)
  })
})

describe('wave interference exploration', () => {
  it('produces scalar field with wave pattern', () => {
    const exp = createWaveInterferenceExploration()
    const field = exp.field(0)
    // Sample at a few points — should be nonzero
    const v1 = field.fn(vec2(0, 0))
    const v2 = field.fn(vec2(2, 1))
    expect(v1).not.toBe(0)
    expect(v2).not.toBe(0)
  })

  it('time evolution changes field values', () => {
    const exp = createWaveInterferenceExploration()
    const f0 = exp.field(0).fn(vec2(0, 0))
    const f1 = exp.field(0.1).fn(vec2(0, 0))
    expect(f0).not.toBeCloseTo(f1, 3)
  })

  it('more sources create more complex pattern', () => {
    const exp = createWaveInterferenceExploration()
    exp.params.get('sources')!.set(1)
    const single = exp.field(0).fn(vec2(0, 0))
    exp.params.get('sources')!.set(4)
    const multi = exp.field(0).fn(vec2(0, 0))
    // Values should differ (interference)
    expect(single).not.toBeCloseTo(multi, 2)
  })
})

describe('lorenz exploration', () => {
  it('trajectory stays on attractor (bounded)', () => {
    const exp = createLorenzExploration()
    const sys = exp.system()
    const traj = sys.trajectory({ initial: [1, 1, 1], duration: 50, dt: 0.005 })
    // All points should remain bounded within known Lorenz attractor bounds
    for (const state of traj.slice(-100)) {
      expect(Math.abs(state[0]!)).toBeLessThan(30)
      expect(Math.abs(state[1]!)).toBeLessThan(40)
      expect(state[2]!).toBeLessThan(60)
      expect(state[2]!).toBeGreaterThan(0)
    }
  })

  it('exhibits sensitivity to initial conditions', () => {
    const exp = createLorenzExploration()
    const sys = exp.system()
    const traj1 = sys.trajectory({ initial: [1, 1, 1], duration: 30, dt: 0.005 })
    const traj2 = sys.trajectory({ initial: [1.001, 1, 1], duration: 30, dt: 0.005 })
    const last1 = traj1[traj1.length - 1]!
    const last2 = traj2[traj2.length - 1]!
    const diff = Math.abs(last1[0]! - last2[0]!) + Math.abs(last1[1]! - last2[1]!)
    expect(diff).toBeGreaterThan(1)
  })
})
