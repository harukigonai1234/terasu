export interface Clock {
  readonly value: number
  playing: boolean
  speed: number
  tick(dt: number): void
  reset(): void
}

export function createClock(config?: { speed?: number; playing?: boolean }): Clock {
  let t = 0
  let playing = config?.playing ?? true
  let speed = config?.speed ?? 1

  return {
    get value() { return t },
    get playing() { return playing },
    set playing(v: boolean) { playing = v },
    get speed() { return speed },
    set speed(v: number) { speed = v },
    tick(dt: number) {
      if (playing) {
        t += dt * speed
      }
    },
    reset() {
      t = 0
    },
  }
}
