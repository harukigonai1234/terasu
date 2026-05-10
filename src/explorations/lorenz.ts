import { dynamicalSystem, DynamicalSystem } from '../dynamical-system'
import { createParamSet, ParamSet } from '../param'

export interface LorenzExploration {
  params: ParamSet
  system(): DynamicalSystem
}

export function createLorenzExploration(): LorenzExploration {
  const params = createParamSet()
  const sigma = params.add('sigma', { value: 10, range: [1, 20], label: 'σ' })
  const rho = params.add('rho', { value: 28, range: [1, 50], label: 'ρ' })
  const beta = params.add('beta', { value: 2.667, range: [0.5, 5], label: 'β' })

  return {
    params,
    system(): DynamicalSystem {
      return dynamicalSystem({
        dim: 3,
        derivative: (s) => {
          const [x, y, z] = [s[0]!, s[1]!, s[2]!]
          return [
            sigma.value * (y - x),
            x * (rho.value - z) - y,
            x * y - beta.value * z,
          ]
        },
      })
    },
  }
}
