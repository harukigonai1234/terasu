import { describe, it, expect } from 'vitest'
import { parseExpression, parseExpressions, detectODESystem } from './expression-parser'

describe('parseExpression', () => {
  describe('parameter detection', () => {
    it('detects simple assignment', () => {
      const result = parseExpression('k = 3')
      expect(result.type).toBe('parameter')
      expect(result.name).toBe('k')
      expect(result.body).toBe('3')
    })

    it('detects assignment with decimal', () => {
      const result = parseExpression('g = 9.81')
      expect(result.type).toBe('parameter')
      expect(result.name).toBe('g')
      expect(result.body).toBe('9.81')
    })

    it('detects assignment with range', () => {
      const result = parseExpression('k = 4 [0.1, 20]')
      expect(result.type).toBe('parameter')
      expect(result.name).toBe('k')
      expect(result.body).toBe('4')
      expect(result.range).toEqual([0.1, 20])
    })

    it('detects negative values', () => {
      const result = parseExpression('a = -2.5')
      expect(result.type).toBe('parameter')
      expect(result.body).toBe('-2.5')
    })

    it('detects greek letter names', () => {
      const result = parseExpression('ω = 2')
      expect(result.type).toBe('parameter')
      expect(result.name).toBe('ω')
    })
  })

  describe('vector field detection', () => {
    it('detects vector field with two components', () => {
      const result = parseExpression('F(x, y) = [-y, x]')
      expect(result.type).toBe('vector-field')
      expect(result.name).toBe('F')
      expect(result.vars).toEqual(['x', 'y'])
      expect(result.components).toEqual(['-y', 'x'])
    })

    it('detects vector field with complex expressions', () => {
      const result = parseExpression('E(x, y) = [x/(x*x+y*y), y/(x*x+y*y)]')
      expect(result.type).toBe('vector-field')
      expect(result.components![0]).toContain('x/(x*x+y*y)')
      expect(result.components![1]).toContain('y/(x*x+y*y)')
    })

    it('detects vector field without spaces', () => {
      const result = parseExpression('V(x,y) = [-y, x]')
      expect(result.type).toBe('vector-field')
      expect(result.vars).toEqual(['x', 'y'])
    })
  })

  describe('scalar function detection', () => {
    it('detects y = f(x) form', () => {
      const result = parseExpression('y = sin(x)')
      expect(result.type).toBe('scalar-function')
      expect(result.name).toBe('y')
      expect(result.vars).toEqual(['x'])
      expect(result.body).toBe('sin(x)')
    })

    it('detects named function form', () => {
      const result = parseExpression('f(x) = x*x + 2*x + 1')
      expect(result.type).toBe('scalar-function')
      expect(result.name).toBe('f')
      expect(result.vars).toEqual(['x'])
      expect(result.body).toBe('x*x + 2*x + 1')
    })

    it('detects polynomial', () => {
      const result = parseExpression('y = x^2')
      expect(result.type).toBe('scalar-function')
      expect(result.body).toBe('x^2')
    })
  })

  describe('ODE detection', () => {
    it('detects dx/dt = expression', () => {
      const result = parseExpression('dx/dt = y')
      expect(result.type).toBe('ode-system')
      expect(result.name).toBe('x')
      expect(result.body).toBe('y')
    })

    it('detects dy/dt = expression', () => {
      const result = parseExpression('dy/dt = -x - 0.5*y')
      expect(result.type).toBe('ode-system')
      expect(result.name).toBe('y')
      expect(result.body).toBe('-x - 0.5*y')
    })

    it('handles complex ODE expressions', () => {
      const result = parseExpression('dx/dt = sigma*(y - x)')
      expect(result.type).toBe('ode-system')
      expect(result.name).toBe('x')
      expect(result.body).toBe('sigma*(y - x)')
    })
  })

  describe('unknown expressions', () => {
    it('returns unknown for unparseable input', () => {
      expect(parseExpression('hello world').type).toBe('unknown')
      expect(parseExpression('').type).toBe('unknown')
      expect(parseExpression('???').type).toBe('unknown')
    })
  })
})

describe('parseExpressions (multi-line)', () => {
  it('parses multiple lines', () => {
    const input = `k = 4 [0.1, 20]
dx/dt = y
dy/dt = -k*x`
    const results = parseExpressions(input)
    expect(results).toHaveLength(3)
    expect(results[0]!.type).toBe('parameter')
    expect(results[1]!.type).toBe('ode-system')
    expect(results[2]!.type).toBe('ode-system')
  })

  it('skips empty lines and comments', () => {
    const input = `// This is a comment
k = 3

dx/dt = y
// another comment
dy/dt = -k*x`
    const results = parseExpressions(input)
    expect(results).toHaveLength(3)
  })
})

describe('detectODESystem', () => {
  it('detects a 2D ODE system', () => {
    const expressions = parseExpressions(`dx/dt = y
dy/dt = -x - 0.5*y`)
    const system = detectODESystem(expressions)
    expect(system).not.toBeNull()
    expect(system!.vars).toEqual(['x', 'y'])
    expect(system!.bodies).toEqual(['y', '-x - 0.5*y'])
  })

  it('returns null for less than 2 ODEs', () => {
    const expressions = parseExpressions('dx/dt = y')
    expect(detectODESystem(expressions)).toBeNull()
  })

  it('detects system mixed with parameters', () => {
    const expressions = parseExpressions(`k = 4
b = 0.2
dx/dt = y
dy/dt = -k*x - b*y`)
    const system = detectODESystem(expressions)
    expect(system).not.toBeNull()
    expect(system!.vars).toEqual(['x', 'y'])
    expect(system!.bodies).toEqual(['y', '-k*x - b*y'])
  })

  it('detects 3D system (Lorenz)', () => {
    const expressions = parseExpressions(`dx/dt = sigma*(y - x)
dy/dt = x*(rho - z) - y
dz/dt = x*y - beta*z`)
    const system = detectODESystem(expressions)
    expect(system).not.toBeNull()
    expect(system!.vars).toEqual(['x', 'y', 'z'])
    expect(system!.bodies).toHaveLength(3)
  })
})
