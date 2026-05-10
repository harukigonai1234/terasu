export type ExpressionType =
  | 'scalar-function'    // y = f(x), or f(x) = ...
  | 'vector-field'       // F(x,y) = [_, _]
  | 'ode-system'         // dx/dt = ..., dy/dt = ...
  | 'parameter'          // a = 3, with optional range
  | 'unknown'

export interface ParsedExpression {
  type: ExpressionType
  raw: string
  name?: string
  vars?: string[]
  body?: string
  components?: string[]   // for vector fields
  range?: [number, number] // for parameters
}

// Detect whether a single line is a parameter assignment: `k = 3` or `k = 3 [0, 10]`
const PARAM_PATTERN = /^([a-zA-Zα-ωΑ-Ω_]\w*)\s*=\s*(-?[\d.]+)(?:\s*\[(-?[\d.]+)\s*,\s*(-?[\d.]+)\])?$/

// Detect vector field: `F(x, y) = [-y, x]` or `F(x,y) = [expr, expr]`
const VECTOR_FIELD_PATTERN = /^([a-zA-Z_]\w*)\((\w+)\s*,\s*(\w+)\)\s*=\s*\[(.+),(.+)\]$/

// Detect scalar function: `y = f(x)` or `f(x) = expr` or `y = expr`
const SCALAR_FUNC_PATTERN = /^(?:([a-zA-Z_]\w*)\((\w+)\)\s*=\s*(.+)|y\s*=\s*(.+))$/

// Detect ODE: `dx/dt = expr`
const ODE_PATTERN = /^d([a-zA-Z_]\w*)\/dt\s*=\s*(.+)$/

export function parseExpression(input: string): ParsedExpression {
  const trimmed = input.trim()

  // Parameter: `k = 3` or `k = 3 [0, 10]`
  const paramMatch = trimmed.match(PARAM_PATTERN)
  if (paramMatch) {
    const [, name, value, rangeMin, rangeMax] = paramMatch
    return {
      type: 'parameter',
      raw: trimmed,
      name: name!,
      body: value!,
      range: rangeMin && rangeMax ? [parseFloat(rangeMin), parseFloat(rangeMax)] : undefined,
    }
  }

  // Vector field: `F(x, y) = [-y, x]`
  const vecMatch = trimmed.match(VECTOR_FIELD_PATTERN)
  if (vecMatch) {
    const [, name, var1, var2, comp1, comp2] = vecMatch
    return {
      type: 'vector-field',
      raw: trimmed,
      name: name!,
      vars: [var1!, var2!],
      components: [comp1!.trim(), comp2!.trim()],
    }
  }

  // Scalar function: `y = sin(x)` or `f(x) = x^2`
  const scalarMatch = trimmed.match(SCALAR_FUNC_PATTERN)
  if (scalarMatch) {
    const [, funcName, funcVar, funcBody, yBody] = scalarMatch
    if (funcName && funcVar && funcBody) {
      return {
        type: 'scalar-function',
        raw: trimmed,
        name: funcName,
        vars: [funcVar],
        body: funcBody.trim(),
      }
    }
    if (yBody) {
      return {
        type: 'scalar-function',
        raw: trimmed,
        name: 'y',
        vars: ['x'],
        body: yBody.trim(),
      }
    }
  }

  // ODE: `dx/dt = expr`
  const odeMatch = trimmed.match(ODE_PATTERN)
  if (odeMatch) {
    const [, varName, body] = odeMatch
    return {
      type: 'ode-system',
      raw: trimmed,
      name: varName!,
      body: body!.trim(),
    }
  }

  return { type: 'unknown', raw: trimmed }
}

// Parse multiple lines and group ODEs into a system
export function parseExpressions(input: string): ParsedExpression[] {
  const lines = input.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('//'))
  return lines.map(parseExpression)
}

// Detect if a set of expressions forms an ODE system
export function detectODESystem(expressions: ParsedExpression[]): { vars: string[]; bodies: string[] } | null {
  const odes = expressions.filter(e => e.type === 'ode-system')
  if (odes.length < 2) return null
  return {
    vars: odes.map(e => e.name!),
    bodies: odes.map(e => e.body!),
  }
}
