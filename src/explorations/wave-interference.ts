import { scalarField, ScalarField } from '../field'
import { createParamSet, ParamSet } from '../param'

export interface WaveInterferenceExploration {
  params: ParamSet
  field(t: number): ScalarField
}

export function createWaveInterferenceExploration(): WaveInterferenceExploration {
  const params = createParamSet()
  const freq = params.add('frequency', { value: 3, range: [1, 10], unit: 'Hz' })
  const numSources = params.add('sources', { value: 2, range: [1, 5], step: 1 })

  return {
    params,
    field(t: number): ScalarField {
      return scalarField((p) => {
        let sum = 0
        const n = Math.round(numSources.value)
        const spacing = 3 / Math.max(n - 1, 1)
        for (let i = 0; i < n; i++) {
          const sy = n === 1 ? 0 : -1.5 + i * spacing
          const dx = p.x - (-4)
          const dy = p.y - sy
          const r = Math.sqrt(dx * dx + dy * dy) + 0.01
          sum += Math.sin(freq.value * 2 * Math.PI * (r - t)) / r
        }
        return sum
      })
    },
  }
}
