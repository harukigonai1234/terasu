import { Vec2, vec2, add, scale, sub, lengthSq } from './vec2'
import { VectorField } from './field'

export type ForceFn = (state: ParticleState, t: number) => Vec2

export interface ParticleState {
  position: Vec2
  velocity: Vec2
}

export interface ParticleConfig {
  position: Vec2
  velocity?: Vec2
  mass?: number
  charge?: number
}

export interface Particle {
  state: ParticleState
  mass: number
  charge: number
  forces: ForceFn[]
  trail: Vec2[]
  trailEnabled: boolean

  addForce(force: ForceFn): void
  inField(field: VectorField, type: ForceType): void
  netForce(t: number): Vec2
  step(dt: number, t: number): void
  reset(config: ParticleConfig): void
}

export type ForceType = 'gravity' | 'lorentz' | 'drag'

export function createParticle(config: ParticleConfig): Particle {
  const state: ParticleState = {
    position: { ...config.position },
    velocity: config.velocity ? { ...config.velocity } : vec2(0, 0),
  }
  const mass = config.mass ?? 1
  const charge = config.charge ?? 0
  const forces: ForceFn[] = []
  const trail: Vec2[] = []
  let trailEnabled = false

  const particle: Particle = {
    get state() { return state },
    mass,
    charge,
    forces,
    trail,
    get trailEnabled() { return trailEnabled },
    set trailEnabled(v: boolean) { trailEnabled = v },

    addForce(force: ForceFn) {
      forces.push(force)
    },

    // F = qE for 'gravity' (scalar potential gradient interpreted as force field)
    // F = q(E + v×B) for 'lorentz' (2D: B is scalar out-of-plane)
    // F = -b*v for 'drag' (b = charge as coefficient, mass-independent)
    inField(field: VectorField, type: ForceType) {
      switch (type) {
        case 'gravity':
          forces.push((s) => {
            const f = field.fn(s.position)
            return scale(f, mass)
          })
          break
        case 'lorentz':
          forces.push((s) => {
            const E = field.fn(s.position)
            return scale(E, charge)
          })
          break
        case 'drag':
          forces.push((s) => {
            return scale(s.velocity, -mass * 0.1)
          })
          break
      }
    },

    netForce(t: number): Vec2 {
      let total = vec2(0, 0)
      for (const f of forces) {
        total = add(total, f(state, t))
      }
      return total
    },

    // Velocity Verlet: symplectic, O(dt^2), preserves energy better than Euler
    step(dt: number, t: number) {
      const a1 = scale(particle.netForce(t), 1 / mass)

      state.position = add(state.position, add(
        scale(state.velocity, dt),
        scale(a1, 0.5 * dt * dt)
      ))

      const a2 = scale(particle.netForce(t + dt), 1 / mass)
      state.velocity = add(state.velocity, scale(add(a1, a2), 0.5 * dt))

      if (trailEnabled) {
        trail.push({ ...state.position })
      }
    },

    reset(cfg: ParticleConfig) {
      state.position = { ...cfg.position }
      state.velocity = cfg.velocity ? { ...cfg.velocity } : vec2(0, 0)
      trail.length = 0
    },
  }

  return particle
}

// Spring force between particle and a fixed anchor point
export function springForce(anchor: Vec2, k: number, restLength = 0): ForceFn {
  return (state) => {
    const displacement = sub(anchor, state.position)
    const dist = Math.sqrt(lengthSq(displacement))
    if (dist === 0) return vec2(0, 0)
    const stretch = dist - restLength
    return scale(displacement, (k * stretch) / dist)
  }
}

// Constant uniform force (e.g., gravity near Earth's surface)
export function constantForce(force: Vec2): ForceFn {
  return () => force
}
