export interface ParsedProblem {
  type: ProblemType
  objects: PhysicsObject[]
  constraints: Constraint[]
  knowns: Record<string, PhysicsValue>
  unknowns: string[]
  scenario?: string
}

export type ProblemType =
  | 'inclined-plane'
  | 'projectile'
  | 'atwood-machine'
  | 'circular-motion'
  | 'spring-mass'
  | 'collision'
  | 'charged-particle'
  | 'rc-circuit'
  | 'unknown'

export interface PhysicsObject {
  id: string
  type: 'block' | 'particle' | 'ball' | 'car' | 'rod' | 'spring' | 'rope' | 'pulley' | 'charge' | 'capacitor' | 'resistor'
  properties: Record<string, PhysicsValue>
}

export interface PhysicsValue {
  magnitude: number
  unit: string
}

export interface Constraint {
  type: 'surface' | 'string' | 'spring' | 'field' | 'friction' | 'initial-condition'
  properties: Record<string, any>
}

// Patterns for extracting physical quantities
const MASS_PATTERN = /(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/i
const ANGLE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:°|degree|degrees)/i
const SPEED_PATTERN = /(\d+(?:\.\d+)?)\s*(?:m\/s|meters? per second)/i
const HEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s*(?:m|meter|meters)\s*(?:tall|high|above|height)/i
const DISTANCE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:m|meter|meters)\s*(?:long|apart|from|away|separation|separated)/i
const MU_S_PATTERN = /(?:μs|mu_s|coefficient of static friction|static friction)\s*(?:=|is|of)\s*(\d+(?:\.\d+)?)/i
const MU_K_PATTERN = /(?:μk|mu_k|coefficient of kinetic friction|kinetic friction)\s*(?:=|is|of)\s*(\d+(?:\.\d+)?)/i
const SPRING_K_PATTERN = /(?:k|spring constant)\s*(?:=|is|of)\s*(\d+(?:\.\d+)?)\s*(?:N\/m)?/i
const CHARGE_PATTERN = /(-?\d+(?:\.\d+)?)\s*(?:μC|µC|microCoulomb)/i
const RESISTANCE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:(?:k|M)?Ω|ohm)/i
const CAPACITANCE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:μF|µF|microfarad)/i
const VOLTAGE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:V|volt)/i

// Scenario detection keywords
const INCLINE_KEYWORDS = /incline|ramp|slope|inclined plane/i
const PROJECTILE_KEYWORDS = /launch|projectile|thrown|fired|cliff|trajectory/i
const ATWOOD_KEYWORDS = /atwood|pulley|two masses.*connected|string over/i
const CIRCULAR_KEYWORDS = /circular|circle|orbit|banked|curve|centripetal/i
const CIRCULAR_LOOP_KEYWORD = /\bloop\b/i
const SPRING_KEYWORDS = /spring|oscillat|harmonic|shm/i
const COLLISION_KEYWORDS = /collid|collision|impact|bullet.*block|ballistic/i
const CHARGE_KEYWORDS = /charge|electric field|coulomb|dipole|capacitor/i
const CIRCUIT_KEYWORDS = /circuit|resistor|capacitor.*charge|\brc\b|\brl\b|battery/i

export function parseProblem(text: string): ParsedProblem {
  const normalized = text.toLowerCase().trim()

  const type = detectProblemType(normalized)
  const objects = extractObjects(text)
  const knowns = extractKnowns(text)
  const constraints = extractConstraints(text, type)
  const unknowns = extractUnknowns(text)

  return { type, objects, constraints, knowns, unknowns }
}

function detectProblemType(text: string): ProblemType {
  if (INCLINE_KEYWORDS.test(text)) return 'inclined-plane'
  if (PROJECTILE_KEYWORDS.test(text)) return 'projectile'
  if (ATWOOD_KEYWORDS.test(text)) return 'atwood-machine'

  const hasCircular = CIRCULAR_KEYWORDS.test(text) || CIRCULAR_LOOP_KEYWORD.test(text)
  const hasCircuit = CIRCUIT_KEYWORDS.test(text)
  const hasCharge = CHARGE_KEYWORDS.test(text)

  // If circular keywords are present but charge/circuit keywords also match,
  // prefer the EM type (charge density on arcs, circuit loops, etc.)
  if (hasCircular && !hasCircuit && !hasCharge) return 'circular-motion'

  if (SPRING_KEYWORDS.test(text)) return 'spring-mass'
  if (COLLISION_KEYWORDS.test(text)) return 'collision'

  // For circuit vs charge: circuit is more specific
  if (hasCircuit) return 'rc-circuit'
  if (hasCharge) return 'charged-particle'

  // Circular motion that co-occurs with EM keywords: check if it's truly
  // circular motion (e.g., "circular orbit in magnetic field") vs. geometric shape in EM context
  if (hasCircular) {
    // If the problem mentions magnetic field + circular orbit/motion, it's circular-motion
    if (/magnetic/i.test(text)) return 'circular-motion'
    // Otherwise (semicircular arc of charge, etc.) fall through to unknown
  }

  return 'unknown'
}

function extractObjects(text: string): PhysicsObject[] {
  const objects: PhysicsObject[] = []

  // Detect blocks/masses
  const massMatch = text.match(MASS_PATTERN)
  if (massMatch) {
    objects.push({
      id: 'obj1',
      type: 'block',
      properties: { mass: { magnitude: parseFloat(massMatch[1]!), unit: 'kg' } },
    })
  }

  // Detect multiple masses (e.g., "4 kg and 6 kg" or "4 kg mass and a 6 kg mass")
  const multiMass = text.match(/(\d+(?:\.\d+)?)\s*kg\s*(?:mass\s*)?(?:and|,)\s*(?:a\s+)?(\d+(?:\.\d+)?)\s*kg/i)
  if (multiMass) {
    objects.length = 0
    objects.push({
      id: 'obj1',
      type: 'block',
      properties: { mass: { magnitude: parseFloat(multiMass[1]!), unit: 'kg' } },
    })
    objects.push({
      id: 'obj2',
      type: 'block',
      properties: { mass: { magnitude: parseFloat(multiMass[2]!), unit: 'kg' } },
    })
  }

  // Detect springs
  const springMatch = text.match(SPRING_K_PATTERN)
  if (springMatch) {
    objects.push({
      id: 'spring1',
      type: 'spring',
      properties: { k: { magnitude: parseFloat(springMatch[1]!), unit: 'N/m' } },
    })
  }

  return objects
}

function extractKnowns(text: string): Record<string, PhysicsValue> {
  const knowns: Record<string, PhysicsValue> = {}

  const mass = text.match(MASS_PATTERN)
  if (mass) knowns.mass = { magnitude: parseFloat(mass[1]!), unit: 'kg' }

  const angle = text.match(ANGLE_PATTERN)
  if (angle) knowns.angle = { magnitude: parseFloat(angle[1]!), unit: 'degrees' }

  const speed = text.match(SPEED_PATTERN)
  if (speed) knowns.speed = { magnitude: parseFloat(speed[1]!), unit: 'm/s' }

  const height = text.match(HEIGHT_PATTERN)
  if (height) knowns.height = { magnitude: parseFloat(height[1]!), unit: 'm' }

  const muS = text.match(MU_S_PATTERN)
  if (muS) knowns.mu_s = { magnitude: parseFloat(muS[1]!), unit: '' }

  const muK = text.match(MU_K_PATTERN)
  if (muK) knowns.mu_k = { magnitude: parseFloat(muK[1]!), unit: '' }

  const springK = text.match(SPRING_K_PATTERN)
  if (springK) knowns.spring_k = { magnitude: parseFloat(springK[1]!), unit: 'N/m' }

  const charge = text.match(CHARGE_PATTERN)
  if (charge) knowns.charge = { magnitude: parseFloat(charge[1]!), unit: 'μC' }

  const resistance = text.match(RESISTANCE_PATTERN)
  if (resistance) {
    let value = parseFloat(resistance[1]!)
    if (/kΩ|kohm/i.test(text)) value *= 1000
    if (/MΩ|Mohm/i.test(text)) value *= 1e6
    knowns.resistance = { magnitude: value, unit: 'Ω' }
  }

  const capacitance = text.match(CAPACITANCE_PATTERN)
  if (capacitance) knowns.capacitance = { magnitude: parseFloat(capacitance[1]!), unit: 'μF' }

  const voltage = text.match(VOLTAGE_PATTERN)
  if (voltage) knowns.voltage = { magnitude: parseFloat(voltage[1]!), unit: 'V' }

  return knowns
}

function extractConstraints(text: string, type: ProblemType): Constraint[] {
  const constraints: Constraint[] = []

  if (type === 'inclined-plane') {
    const muS = text.match(MU_S_PATTERN)
    const muK = text.match(MU_K_PATTERN)
    constraints.push({
      type: 'surface',
      properties: {
        inclined: true,
        mu_s: muS ? parseFloat(muS[1]!) : undefined,
        mu_k: muK ? parseFloat(muK[1]!) : undefined,
      },
    })
  }

  if (/frictionless/i.test(text)) {
    constraints.push({ type: 'friction', properties: { frictionless: true } })
  }

  if (/from rest|starts? at rest|initially at rest/i.test(text)) {
    constraints.push({ type: 'initial-condition', properties: { v0: 0 } })
  }

  if (/released|drops?\b|dropped/i.test(text)) {
    constraints.push({ type: 'initial-condition', properties: { v0: 0, released: true } })
  }

  return constraints
}

function extractUnknowns(text: string): string[] {
  const unknowns: string[] = []

  if (/(?:find|calculate|determine).*acceleration|acceleration.*(?:find|calculate)|what is the acceleration/i.test(text)) unknowns.push('acceleration')
  if (/(?:find|calculate|determine).*speed|speed.*(?:find|calculate)|how fast|what is the speed|(?:find|calculate|determine).*velocity/i.test(text)) unknowns.push('speed')
  if (/(?:find|calculate|determine).*tension|tension.*(?:find|calculate)/i.test(text)) unknowns.push('tension')
  if (/(?:find|calculate|determine).*normal|normal force/i.test(text)) unknowns.push('normal_force')
  if (/(?:find|calculate|determine).*time|how long|time.*(?:find|calculate)/i.test(text)) unknowns.push('time')
  if (/(?:find|calculate|determine).*distance|how far|range/i.test(text)) unknowns.push('distance')
  if (/(?:find|calculate|determine).*force|force.*required|minimum force/i.test(text)) unknowns.push('force')
  if (/(?:find|calculate|determine).*energy|energy.*(?:find|calculate)/i.test(text)) unknowns.push('energy')
  if (/(?:find|calculate|determine).*current|current.*(?:find|calculate)/i.test(text)) unknowns.push('current')
  if (/(?:find|calculate|determine).*voltage|voltage.*(?:find|calculate)/i.test(text)) unknowns.push('voltage')
  if (/does it slide|will it slide|whether.*slide/i.test(text)) unknowns.push('slides')
  if (/(?:find|calculate|determine).*period|period.*(?:find|calculate)/i.test(text)) unknowns.push('period')
  if (/(?:find|calculate|determine).*frequency|frequency.*(?:find|calculate)/i.test(text)) unknowns.push('frequency')
  if (/(?:find|calculate|determine).*electric field|field.*(?:find|calculate)/i.test(text)) unknowns.push('electric_field')

  return unknowns
}
