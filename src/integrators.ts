export type DerivativeFn = (state: number[], t: number) => number[]

export function euler(derivative: DerivativeFn, state: number[], t: number, dt: number): number[] {
  const dstate = derivative(state, t)
  return state.map((s, i) => s + dstate[i]! * dt)
}

export function rk4(derivative: DerivativeFn, state: number[], t: number, dt: number): number[] {
  const k1 = derivative(state, t)

  const s2 = state.map((s, i) => s + k1[i]! * dt * 0.5)
  const k2 = derivative(s2, t + dt * 0.5)

  const s3 = state.map((s, i) => s + k2[i]! * dt * 0.5)
  const k3 = derivative(s3, t + dt * 0.5)

  const s4 = state.map((s, i) => s + k3[i]! * dt)
  const k4 = derivative(s4, t + dt)

  return state.map((s, i) =>
    s + (dt / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!)
  )
}
