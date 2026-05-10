import { dynamicalSystem, DynamicalSystem } from '../dynamical-system'
import { createParamSet, ParamSet } from '../param'

export interface DoublePendulumExploration {
  params: ParamSet
  system(): DynamicalSystem
  toCartesian(state: number[]): [number, number]
}

// State: [θ1, θ2, ω1, ω2], equal masses and lengths
export function createDoublePendulumExploration(): DoublePendulumExploration {
  const params = createParamSet()
  const g = params.add('g', { value: 9.81, range: [1, 20], unit: 'm/s²' })

  return {
    params,
    system(): DynamicalSystem {
      return dynamicalSystem({
        dim: 4,
        derivative: (s) => {
          const [t1, t2, w1, w2] = [s[0]!, s[1]!, s[2]!, s[3]!]
          const dt = t1 - t2
          const den = 2 - Math.cos(2 * dt)

          const dw1 = (-g.value * (2 * Math.sin(t1) - Math.sin(t2) * Math.cos(dt))
                       - Math.sin(dt) * (w2 * w2 + w1 * w1 * Math.cos(dt))) / den
          const dw2 = (2 * Math.sin(dt) * (w1 * w1 + g.value * Math.cos(t1)
                       + w2 * w2 * Math.cos(dt) * 0.5)) / den

          return [w1, w2, dw1, dw2]
        },
      })
    },
    // Convert angular state to (x, y) position of tip of second pendulum
    toCartesian(state: number[]): [number, number] {
      const t1 = state[0]!
      const t2 = state[1]!
      return [
        Math.sin(t1) + Math.sin(t2),
        -Math.cos(t1) - Math.cos(t2),
      ]
    },
  }
}
