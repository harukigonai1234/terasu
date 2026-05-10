import { Particle } from './particle'

export interface TimeEvolutionConfig {
  dt?: number
  speed?: number
}

export interface TimeEvolution {
  t: number
  dt: number
  speed: number
  running: boolean
  particles: Particle[]

  addParticle(particle: Particle): void
  step(): void
  stepN(n: number): void
  play(): void
  pause(): void
  reset(): void
  scrubTo(targetT: number): void
}

export function createTimeEvolution(config: TimeEvolutionConfig = {}): TimeEvolution {
  const dt = config.dt ?? 0.01
  const initialSpeed = config.speed ?? 1.0
  const particles: Particle[] = []
  let t = 0
  let running = false

  const evolution: TimeEvolution = {
    get t() { return t },
    set t(v: number) { t = v },
    dt,
    get speed() { return initialSpeed },
    get running() { return running },
    particles,

    addParticle(particle: Particle) {
      particles.push(particle)
    },

    step() {
      const effectiveDt = dt * evolution.speed
      for (const p of particles) {
        p.step(effectiveDt, t)
      }
      t += effectiveDt
    },

    stepN(n: number) {
      for (let i = 0; i < n; i++) {
        evolution.step()
      }
    },

    play() {
      running = true
    },

    pause() {
      running = false
    },

    reset() {
      t = 0
      running = false
      for (const p of particles) {
        p.trail.length = 0
      }
    },

    // Re-integrates from t=0. Requires particles to have been reset to initial conditions.
    scrubTo(targetT: number) {
      t = 0
      const steps = Math.round(targetT / dt)
      evolution.stepN(steps)
    },
  }

  return evolution
}
