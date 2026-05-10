import { dynamicalSystem2D, DynamicalSystem } from '../dynamical-system'
import { createParamSet, ParamSet } from '../param'

export interface OscillatorExploration {
  params: ParamSet
  system(): DynamicalSystem
}

export function createOscillatorExploration(): OscillatorExploration {
  const params = createParamSet()
  const gamma = params.add('gamma', { value: 0.2, range: [0, 2], label: 'Damping γ' })
  const omega = params.add('omega', { value: 1.0, range: [0.1, 5], label: 'Frequency ω' })

  return {
    params,
    system(): DynamicalSystem {
      return dynamicalSystem2D({
        dx: (_x, v) => v,
        dy: (x, v) => -2 * gamma.value * v - omega.value ** 2 * x,
      })
    },
  }
}
