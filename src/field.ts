import { Vec2, vec2 } from './vec2'

export type ScalarFieldFn = (p: Vec2, t?: number) => number
export type VectorFieldFn = (p: Vec2, t?: number) => Vec2

export interface ScalarField {
  kind: 'scalar'
  fn: ScalarFieldFn
  sample(domain: Domain, resolution: number, t?: number): ScalarSample
}

export interface VectorField {
  kind: 'vector'
  fn: VectorFieldFn
  sample(domain: Domain, resolution: number, t?: number): VectorSample
}

export interface Domain {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface ScalarSample {
  domain: Domain
  resolution: number
  values: number[][]
}

export interface VectorSample {
  domain: Domain
  resolution: number
  values: Vec2[][]
}

export function scalarField(fn: ScalarFieldFn): ScalarField {
  return {
    kind: 'scalar',
    fn,
    sample(domain: Domain, resolution: number, t?: number): ScalarSample {
      const values: number[][] = []
      const dx = (domain.xMax - domain.xMin) / (resolution - 1)
      const dy = (domain.yMax - domain.yMin) / (resolution - 1)

      for (let i = 0; i < resolution; i++) {
        const row: number[] = []
        for (let j = 0; j < resolution; j++) {
          const p = vec2(domain.xMin + j * dx, domain.yMin + i * dy)
          row.push(fn(p, t))
        }
        values.push(row)
      }
      return { domain, resolution, values }
    },
  }
}

export function vectorField(fn: VectorFieldFn): VectorField {
  return {
    kind: 'vector',
    fn,
    sample(domain: Domain, resolution: number, t?: number): VectorSample {
      const values: Vec2[][] = []
      const dx = (domain.xMax - domain.xMin) / (resolution - 1)
      const dy = (domain.yMax - domain.yMin) / (resolution - 1)

      for (let i = 0; i < resolution; i++) {
        const row: Vec2[] = []
        for (let j = 0; j < resolution; j++) {
          const p = vec2(domain.xMin + j * dx, domain.yMin + i * dy)
          row.push(fn(p, t))
        }
        values.push(row)
      }
      return { domain, resolution, values }
    },
  }
}
