import { describe, it, expect } from 'vitest'
import { examples } from './examples'

describe('playground examples', () => {
  it('has all 5 required examples', () => {
    expect(Object.keys(examples)).toHaveLength(5)
    expect(examples.dipole).toBeDefined()
    expect(examples.oscillator).toBeDefined()
    expect(examples.pendulum).toBeDefined()
    expect(examples.wave).toBeDefined()
    expect(examples.lorenz).toBeDefined()
  })

  it('each example is non-empty and contains terasu reference', () => {
    for (const [name, code] of Object.entries(examples)) {
      expect(code.length, `${name} should have content`).toBeGreaterThan(50)
      expect(code, `${name} should reference terasu`).toContain('terasu')
    }
  })

  it('each example calls createRenderer', () => {
    for (const [name, code] of Object.entries(examples)) {
      expect(code, `${name} should create a renderer`).toContain('createRenderer')
    }
  })

  it('each example has a draw loop', () => {
    for (const [name, code] of Object.entries(examples)) {
      expect(code, `${name} should have animation loop`).toContain('requestAnimationFrame')
    }
  })

  it('no example has syntax errors (parseable as JS)', () => {
    for (const [name, code] of Object.entries(examples)) {
      expect(() => {
        new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', code)
      }, `${name} should parse without syntax error`).not.toThrow()
    }
  })
})
