import { Vec2, vec2 } from './vec2'
import { VectorField, vectorField, Domain } from './field'
import { DerivativeFn, rk4, euler } from './integrators'

export type Integrator = 'rk4' | 'euler'

export interface Params {
  [key: string]: number
}

export interface System2DConfig {
  dx: (x: number, y: number, params: Params) => number
  dy: (x: number, y: number, params: Params) => number
  params?: Params
}

export interface SystemConfig {
  dim: number
  derivative: (state: number[], t: number, params: Params) => number[]
  params?: Params
}

export interface TrajectoryOptions {
  initial: number[]
  duration: number
  dt?: number
  integrator?: Integrator
}

export interface FixedPoint {
  position: Vec2
  classification: 'stable-node' | 'unstable-node' | 'saddle' | 'stable-spiral' | 'unstable-spiral' | 'center' | 'unknown'
  eigenvalues: [number, number]
}

export interface DynamicalSystem {
  dim: number
  derivative: DerivativeFn
  params: Params
  trajectory(options: TrajectoryOptions): number[][]
  phasePortrait(domain: Domain): VectorField
  fixedPoints(domain: Domain, resolution?: number): FixedPoint[]
}

function getIntegrator(name: Integrator) {
  return name === 'euler' ? euler : rk4
}

// Classifies via the trace-determinant plane (Strogatz, Nonlinear Dynamics, §5.2)
function classifyFixedPoint(jacobian: [number, number, number, number]): { classification: FixedPoint['classification']; eigenvalues: [number, number] } {
  const [a, b, c, d] = jacobian
  const trace = a + d
  const det = a * d - b * c
  const discriminant = trace * trace - 4 * det

  let eigenvalues: [number, number]
  if (discriminant >= 0) {
    const sqrtDisc = Math.sqrt(discriminant)
    eigenvalues = [(trace + sqrtDisc) / 2, (trace - sqrtDisc) / 2]
  } else {
    eigenvalues = [trace / 2, trace / 2]
  }

  if (det < 0) {
    return { classification: 'saddle', eigenvalues }
  }

  if (discriminant < 0) {
    if (trace < -1e-10) return { classification: 'stable-spiral', eigenvalues }
    if (trace > 1e-10) return { classification: 'unstable-spiral', eigenvalues }
    return { classification: 'center', eigenvalues }
  }

  if (trace < -1e-10) return { classification: 'stable-node', eigenvalues }
  if (trace > 1e-10) return { classification: 'unstable-node', eigenvalues }
  return { classification: 'unknown', eigenvalues }
}

function numericalJacobian(derivative: DerivativeFn, point: number[], t: number): [number, number, number, number] {
  const eps = 1e-6
  const x = point[0] ?? 0
  const y = point[1] ?? 0

  const fCenter = derivative(point, t)
  const fXPlus = derivative([x + eps, y], t)
  const fYPlus = derivative([x, y + eps], t)

  const dfdx_0 = (fXPlus[0]! - fCenter[0]!) / eps
  const dfdy_0 = (fYPlus[0]! - fCenter[0]!) / eps
  const dfdx_1 = (fXPlus[1]! - fCenter[1]!) / eps
  const dfdy_1 = (fYPlus[1]! - fCenter[1]!) / eps

  return [dfdx_0, dfdy_0, dfdx_1, dfdy_1]
}

export function dynamicalSystem(config: SystemConfig): DynamicalSystem {
  const params = config.params ?? {}
  const derivative: DerivativeFn = (state, t) => config.derivative(state, t, params)

  return {
    dim: config.dim,
    derivative,
    params,

    trajectory(options: TrajectoryOptions): number[][] {
      const { initial, duration, dt = 0.01, integrator = 'rk4' } = options
      const integrate = getIntegrator(integrator)
      const steps = Math.ceil(duration / dt)
      const points: number[][] = [initial]
      let state = initial
      for (let i = 0; i < steps; i++) {
        state = integrate(derivative, state, i * dt, dt)
        points.push(state)
      }
      return points
    },

    phasePortrait(_domain: Domain): VectorField {
      return vectorField((p: Vec2) => {
        const d = derivative([p.x, p.y], 0)
        return vec2(d[0]!, d[1]!)
      })
    },

    // Grid search with Newton-Raphson from each cell center. Deduplicates within 1e-6.
    fixedPoints(domain: Domain, resolution = 20): FixedPoint[] {
      const dx = (domain.xMax - domain.xMin) / resolution
      const dy = (domain.yMax - domain.yMin) / resolution
      const candidates: FixedPoint[] = []

      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const x0 = domain.xMin + (j + 0.5) * dx
          const y0 = domain.yMin + (i + 0.5) * dy

          const found = newtonRaphson(derivative, [x0, y0])
          if (!found) continue

          const fx = found[0]!
          const fy = found[1]!

          if (fx < domain.xMin || fx > domain.xMax) continue
          if (fy < domain.yMin || fy > domain.yMax) continue

          const isDuplicate = candidates.some(
            (c) => Math.abs(c.position.x - fx) < 1e-6 && Math.abs(c.position.y - fy) < 1e-6
          )
          if (isDuplicate) continue

          const jacobian = numericalJacobian(derivative, found, 0)
          const { classification, eigenvalues } = classifyFixedPoint(jacobian)
          candidates.push({ position: vec2(fx, fy), classification, eigenvalues })
        }
      }

      return candidates
    },
  }
}

export function dynamicalSystem2D(config: System2DConfig): DynamicalSystem {
  const params = config.params ?? {}
  return dynamicalSystem({
    dim: 2,
    derivative: (state, _t, p) => [
      config.dx(state[0]!, state[1]!, p),
      config.dy(state[0]!, state[1]!, p),
    ],
    params,
  })
}

function newtonRaphson(derivative: DerivativeFn, guess: number[], maxIter = 50, tol = 1e-10): number[] | null {
  let x = guess[0] ?? 0
  let y = guess[1] ?? 0

  for (let i = 0; i < maxIter; i++) {
    const f = derivative([x, y], 0)
    const fxVal = f[0]!
    const fyVal = f[1]!

    if (Math.abs(fxVal) < tol && Math.abs(fyVal) < tol) {
      return [x, y]
    }

    const J = numericalJacobian(derivative, [x, y], 0)
    const [a, b, c, d] = J
    const det = a * d - b * c

    if (Math.abs(det) < 1e-12) return null

    x -= (d * fxVal - b * fyVal) / det
    y -= (-c * fxVal + a * fyVal) / det
  }

  return null
}
