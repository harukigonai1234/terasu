import { describe, it, expect } from 'vitest'
import { createParamSet } from './param'

describe('param value persistence across re-creation', () => {
  it('demonstrates the pattern: wrap createParamSet to restore saved values', () => {
    // This tests the pattern used in the playground to preserve slider values across runs.
    // Simulates: first run creates params, user adjusts them, second run restores values.

    const savedValues: Record<string, number> = {}

    function wrappedCreateParamSet() {
      const ps = createParamSet()
      const originalAdd = ps.add.bind(ps)
      ps.add = (name: string, config: any) => {
        const saved = savedValues[name]
        if (saved !== undefined) {
          config = { ...config, value: saved }
        }
        const p = originalAdd(name, config)
        p.subscribe((v: number) => { savedValues[name] = v })
        return p
      }
      return ps
    }

    // First run: create params with defaults
    const ps1 = wrappedCreateParamSet()
    const k1 = ps1.add('k', { value: 4, range: [0, 20] })
    const g1 = ps1.add('g', { value: 9.81, range: [0, 25] })
    expect(k1.value).toBe(4)
    expect(g1.value).toBe(9.81)

    // User adjusts sliders
    k1.set(12)
    g1.set(1.62)
    expect(savedValues['k']).toBe(12)
    expect(savedValues['g']).toBe(1.62)

    // Second run: re-create params — values should be restored
    const ps2 = wrappedCreateParamSet()
    const k2 = ps2.add('k', { value: 4, range: [0, 20] })
    const g2 = ps2.add('g', { value: 9.81, range: [0, 25] })
    expect(k2.value).toBe(12)  // restored, not default
    expect(g2.value).toBe(1.62) // restored, not default
  })

  it('uses default when no saved value exists', () => {
    const savedValues: Record<string, number> = {}

    function wrappedCreateParamSet() {
      const ps = createParamSet()
      const originalAdd = ps.add.bind(ps)
      ps.add = (name: string, config: any) => {
        const saved = savedValues[name]
        if (saved !== undefined) {
          config = { ...config, value: saved }
        }
        const p = originalAdd(name, config)
        p.subscribe((v: number) => { savedValues[name] = v })
        return p
      }
      return ps
    }

    // First run with no prior saved values
    const ps = wrappedCreateParamSet()
    const k = ps.add('k', { value: 4, range: [0, 20] })
    expect(k.value).toBe(4) // default, no saved value
  })

  it('clamps restored value to new range if code changes range', () => {
    const savedValues: Record<string, number> = { k: 50 }

    function wrappedCreateParamSet() {
      const ps = createParamSet()
      const originalAdd = ps.add.bind(ps)
      ps.add = (name: string, config: any) => {
        const saved = savedValues[name]
        if (saved !== undefined) {
          config = { ...config, value: saved }
        }
        const p = originalAdd(name, config)
        p.subscribe((v: number) => { savedValues[name] = v })
        return p
      }
      return ps
    }

    // Saved value is 50, but new range is [0, 20] — should clamp to 20
    const ps = wrappedCreateParamSet()
    const k = ps.add('k', { value: 4, range: [0, 20] })
    expect(k.value).toBe(20) // clamped to max
  })

  it('subscription fires on subsequent changes after restore', () => {
    const savedValues: Record<string, number> = { k: 10 }

    function wrappedCreateParamSet() {
      const ps = createParamSet()
      const originalAdd = ps.add.bind(ps)
      ps.add = (name: string, config: any) => {
        const saved = savedValues[name]
        if (saved !== undefined) {
          config = { ...config, value: saved }
        }
        const p = originalAdd(name, config)
        p.subscribe((v: number) => { savedValues[name] = v })
        return p
      }
      return ps
    }

    const ps = wrappedCreateParamSet()
    const k = ps.add('k', { value: 4, range: [0, 20] })
    expect(k.value).toBe(10)

    // Further change should update saved values
    k.set(15)
    expect(savedValues['k']).toBe(15)
  })
})
