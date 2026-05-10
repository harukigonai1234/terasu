export interface ParamConfig {
  value: number
  range: [number, number]
  step?: number
  label?: string
  unit?: string
}

export type ParamListener = (value: number, param: Param) => void

export interface Param {
  readonly label: string
  readonly unit: string
  readonly range: [number, number]
  readonly step: number
  value: number
  subscribe(listener: ParamListener): () => void
  set(value: number): void
}

export function createParam(name: string, config: ParamConfig): Param {
  const range = config.range
  const step = config.step ?? (range[1] - range[0]) / 100
  const label = config.label ?? name
  const unit = config.unit ?? ''
  const listeners: Set<ParamListener> = new Set()
  let currentValue = clamp(config.value, range[0], range[1])

  const param: Param = {
    get label() { return label },
    get unit() { return unit },
    get range() { return range },
    get step() { return step },

    get value() { return currentValue },
    set value(v: number) { param.set(v) },

    subscribe(listener: ParamListener): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },

    set(v: number) {
      const clamped = clamp(v, range[0], range[1])
      if (clamped === currentValue) return
      currentValue = clamped
      for (const listener of listeners) {
        listener(currentValue, param)
      }
    },
  }

  return param
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// Collect all params used in a system for auto-generating UI
export interface ParamSet {
  params: Map<string, Param>
  add(name: string, config: ParamConfig): Param
  get(name: string): Param | undefined
  values(): Record<string, number>
  subscribe(listener: () => void): () => void
}

export function createParamSet(): ParamSet {
  const params = new Map<string, Param>()
  const globalListeners: Set<() => void> = new Set()

  return {
    params,

    add(name: string, config: ParamConfig): Param {
      const p = createParam(name, config)
      params.set(name, p)
      p.subscribe(() => {
        for (const listener of globalListeners) listener()
      })
      return p
    },

    get(name: string): Param | undefined {
      return params.get(name)
    },

    // Snapshot of all current values, keyed by name
    values(): Record<string, number> {
      const result: Record<string, number> = {}
      for (const [name, p] of params) {
        result[name] = p.value
      }
      return result
    },

    subscribe(listener: () => void): () => void {
      globalListeners.add(listener)
      return () => { globalListeners.delete(listener) }
    },
  }
}
