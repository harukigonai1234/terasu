import { vectorField, VectorField, vec2, add, sub, scale, lengthSq } from '../index'
import { createParamSet, ParamSet } from '../param'

export interface DipoleExploration {
  params: ParamSet
  field(): VectorField
}

export function createDipoleExploration(): DipoleExploration {
  const params = createParamSet()
  const charge = params.add('charge', { value: 1, range: [0.1, 5], unit: 'C' })
  const separation = params.add('separation', { value: 2, range: [0.5, 5], unit: 'm' })

  return {
    params,
    field(): VectorField {
      const d = separation.value / 2
      return vectorField((p) => {
        const r1 = sub(p, vec2(d, 0))
        const r2 = sub(p, vec2(-d, 0))
        const r1sq = lengthSq(r1)
        const r2sq = lengthSq(r2)
        if (r1sq < 0.1 || r2sq < 0.1) return vec2(0, 0)
        const E1 = scale(r1, charge.value / (r1sq * Math.sqrt(r1sq)))
        const E2 = scale(r2, -charge.value / (r2sq * Math.sqrt(r2sq)))
        return add(E1, E2)
      })
    },
  }
}
