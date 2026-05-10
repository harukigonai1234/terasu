import { describe, it, expect } from 'vitest'
import { parseProblem, ProblemType } from './problem-parser'
import { readFileSync } from 'fs'
import { join } from 'path'

interface TrainingQuestion {
  id: string
  unit: number
  unitName: string
  format: string
  problemText: string
  answer: string
  solution: string
}

function loadTrainingData(filename: string): TrainingQuestion[] {
  const path = join(__dirname, '..', 'training-data', filename)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

/**
 * Acceptable problem types per AP Physics curriculum unit.
 * A problem from a given unit should be classified as one of the listed types
 * or 'unknown' (if the parser doesn't have enough keywords to classify it).
 */
const ACCEPTABLE_TYPES: Record<string, ProblemType[]> = {
  'Kinematics': ['projectile', 'inclined-plane', 'unknown'],
  'Force and Translational Dynamics': ['inclined-plane', 'atwood-machine', 'circular-motion', 'spring-mass', 'unknown'],
  'Linear Momentum': ['collision', 'projectile', 'spring-mass', 'unknown'],
  'Work, Energy, and Power': ['inclined-plane', 'spring-mass', 'projectile', 'circular-motion', 'collision', 'unknown'],
  'Torque and Rotational Dynamics': ['inclined-plane', 'atwood-machine', 'circular-motion', 'unknown'],
  'Energy and Momentum of Rotating Systems': ['inclined-plane', 'circular-motion', 'collision', 'spring-mass', 'projectile', 'unknown'],
  'Oscillations': ['spring-mass', 'circular-motion', 'unknown'],
  "Electric Charges, Fields, and Gauss's Law": ['charged-particle', 'unknown'],
  'Electric Potential': ['charged-particle', 'circular-motion', 'unknown'],
  'Conductors, Capacitors, and Dielectrics': ['charged-particle', 'rc-circuit', 'unknown'],
  'Electric Circuits': ['rc-circuit', 'charged-particle', 'unknown'],
  'Magnetic Fields': ['circular-motion', 'charged-particle', 'unknown'],
  'Electromagnetic Induction': ['rc-circuit', 'circular-motion', 'charged-particle', 'unknown'],
}

describe('Parser validation against AP training data', () => {
  const files = [
    'ap-mech-unit1-2.json',
    'ap-mech-unit3-4.json',
    'ap-mech-unit5-7.json',
    'ap-em-unit8-10.json',
    'ap-em-unit11-13.json',
  ]

  const allQuestions: TrainingQuestion[] = []
  for (const file of files) {
    allQuestions.push(...loadTrainingData(file))
  }

  it('loads all 260 AP questions', () => {
    expect(allQuestions.length).toBe(260)
  })

  describe('problem type classification is acceptable for every question', () => {
    for (const q of allQuestions) {
      it(`${q.id}: ${q.unitName} - classifies correctly`, () => {
        const result = parseProblem(q.problemText)
        const acceptable = ACCEPTABLE_TYPES[q.unitName]
        expect(acceptable).toBeDefined()
        expect(acceptable).toContain(result.type)
      })
    }
  })

  describe('coverage statistics', () => {
    it('classifies at least 55% of questions as a known type', () => {
      let classified = 0
      for (const q of allQuestions) {
        const result = parseProblem(q.problemText)
        if (result.type !== 'unknown') classified++
      }
      const coverage = classified / allQuestions.length
      expect(coverage).toBeGreaterThanOrEqual(0.55)
    })

    it('correctly identifies projectile problems from Kinematics unit', () => {
      const kinematicsQuestions = allQuestions.filter(q => q.unitName === 'Kinematics')
      const projectiles = kinematicsQuestions.filter(q => parseProblem(q.problemText).type === 'projectile')
      // At least some kinematics problems should be detected as projectile
      expect(projectiles.length).toBeGreaterThanOrEqual(3)
    })

    it('correctly identifies collision problems from Linear Momentum unit', () => {
      const momentumQuestions = allQuestions.filter(q => q.unitName === 'Linear Momentum')
      const collisions = momentumQuestions.filter(q => parseProblem(q.problemText).type === 'collision')
      expect(collisions.length).toBeGreaterThanOrEqual(3)
    })

    it('correctly identifies spring-mass problems from Oscillations unit', () => {
      const oscQuestions = allQuestions.filter(q => q.unitName === 'Oscillations')
      const springs = oscQuestions.filter(q => parseProblem(q.problemText).type === 'spring-mass')
      expect(springs.length).toBeGreaterThanOrEqual(10)
    })

    it('correctly identifies charged-particle problems from Electric Charges unit', () => {
      const chargeQuestions = allQuestions.filter(q => q.unitName === "Electric Charges, Fields, and Gauss's Law")
      const charged = chargeQuestions.filter(q => parseProblem(q.problemText).type === 'charged-particle')
      expect(charged.length).toBeGreaterThanOrEqual(15)
    })

    it('correctly identifies rc-circuit problems from Electric Circuits unit', () => {
      const circuitQuestions = allQuestions.filter(q => q.unitName === 'Electric Circuits')
      const circuits = circuitQuestions.filter(q => parseProblem(q.problemText).type === 'rc-circuit')
      expect(circuits.length).toBeGreaterThanOrEqual(15)
    })

    it('never misclassifies a circuit loop as circular-motion', () => {
      const circuitQuestions = allQuestions.filter(q => q.unitName === 'Electric Circuits')
      const misclassified = circuitQuestions.filter(q => parseProblem(q.problemText).type === 'circular-motion')
      expect(misclassified.length).toBe(0)
    })

    it('never misclassifies a charge-arc problem as circular-motion', () => {
      const chargeQuestions = allQuestions.filter(q => q.unitName === "Electric Charges, Fields, and Gauss's Law")
      const misclassified = chargeQuestions.filter(q => parseProblem(q.problemText).type === 'circular-motion')
      expect(misclassified.length).toBe(0)
    })
  })

  describe('known quantity extraction', () => {
    it('extracts mass from problems that mention kg', () => {
      const withMass = allQuestions.filter(q => /\d+(?:\.\d+)?\s*kg/i.test(q.problemText))
      let extracted = 0
      for (const q of withMass) {
        const result = parseProblem(q.problemText)
        if (result.knowns.mass) extracted++
      }
      // At least 80% of problems with kg values should have mass extracted
      expect(extracted / withMass.length).toBeGreaterThanOrEqual(0.8)
    })

    it('extracts angle from problems that mention degrees', () => {
      const withAngle = allQuestions.filter(q => /\d+\s*(?:degrees|°)/.test(q.problemText))
      let extracted = 0
      for (const q of withAngle) {
        const result = parseProblem(q.problemText)
        if (result.knowns.angle) extracted++
      }
      expect(extracted / withAngle.length).toBeGreaterThanOrEqual(0.7)
    })

    it('extracts speed from problems that mention m/s', () => {
      const withSpeed = allQuestions.filter(q => /\d+(?:\.\d+)?\s*m\/s/.test(q.problemText))
      let extracted = 0
      for (const q of withSpeed) {
        const result = parseProblem(q.problemText)
        if (result.knowns.speed) extracted++
      }
      expect(extracted / withSpeed.length).toBeGreaterThanOrEqual(0.7)
    })
  })
})
