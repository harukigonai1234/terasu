/**
 * Generates a training dataset of (diagram image, structured JSON) pairs.
 * Run this script to produce training data for the physics diagram vision model.
 *
 * Each example:
 *   - A rendered physics diagram (PNG)
 *   - A JSON file with the expected parse result
 *
 * To run: npx tsx src/vision/generate-dataset.ts
 * Requires: node-canvas (npm install canvas)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// We'll use the same rendering logic but for Node (requires 'canvas' package)
// For now, generate the JSON labels — images can be rendered when canvas is available

interface TrainingPair {
  id: string
  problemType: string
  problemText: string
  params: Record<string, number>
  expectedOutput: {
    objects: Array<{ type: string; label?: string; properties: Record<string, any> }>
    labels: string[]
    forces: Array<{ on: string; direction: string; label?: string }>
    text: string[]
  }
}

function generateInclinedPlaneVariations(): TrainingPair[] {
  const pairs: TrainingPair[] = []
  const masses = [1, 2, 3, 5, 8, 10, 12, 15, 20]
  const angles = [15, 20, 25, 30, 37, 40, 45, 53, 60]
  const frictions = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]

  let id = 0
  for (const mass of masses) {
    for (const angle of angles) {
      for (const mu of frictions.slice(0, 3)) { // limit combos
        id++
        const hasF = mu > 0
        pairs.push({
          id: `incline_${id}`,
          problemType: 'inclined-plane',
          problemText: hasF
            ? `A ${mass} kg block on a ${angle}° incline with coefficient of kinetic friction μk = ${mu}. Find the acceleration.`
            : `A ${mass} kg block on a frictionless ${angle}° incline. Find the acceleration.`,
          params: { mass, angle, mu_k: mu },
          expectedOutput: {
            objects: [
              { type: 'block', label: 'm', properties: { mass } },
              { type: 'surface', properties: { angle, subtype: 'incline', mu_k: mu } },
            ],
            labels: [`${mass} kg`, `${angle}°`, ...(hasF ? [`μk = ${mu}`] : [])],
            forces: [
              { on: 'block', direction: 'down', label: 'mg' },
              { on: 'block', direction: 'perpendicular_to_surface', label: 'N' },
              ...(hasF ? [{ on: 'block', direction: 'up_along_surface', label: 'f' }] : []),
            ],
            text: ['Find the acceleration'],
          },
        })
      }
    }
  }
  return pairs
}

function generateProjectileVariations(): TrainingPair[] {
  const pairs: TrainingPair[] = []
  const speeds = [10, 15, 20, 25, 30, 40, 50]
  const angles = [20, 30, 37, 45, 53, 60, 75]
  const heights = [0, 5, 10, 20, 45, 100]

  let id = 0
  for (const speed of speeds) {
    for (const angle of angles.slice(0, 4)) {
      for (const height of heights.slice(0, 3)) {
        id++
        const fromHeight = height > 0
        pairs.push({
          id: `projectile_${id}`,
          problemType: 'projectile',
          problemText: fromHeight
            ? `A ball is launched from the top of a ${height} m tall cliff with an initial speed of ${speed} m/s at an angle of ${angle}° above the horizontal. Find the time in the air and the range.`
            : `A projectile is fired from ground level at ${speed} m/s at ${angle}° above the horizontal. Find the maximum height and range.`,
          params: { speed, angle, height },
          expectedOutput: {
            objects: [
              { type: 'particle', label: 'projectile', properties: { speed, angle } },
              ...(fromHeight ? [{ type: 'surface', properties: { height, subtype: 'cliff' } }] : []),
            ],
            labels: [`${speed} m/s`, `${angle}°`, ...(fromHeight ? [`${height} m`] : [])],
            forces: [
              { on: 'projectile', direction: 'down', label: 'mg' },
            ],
            text: fromHeight ? ['Find the time', 'Find the range'] : ['Find the maximum height', 'Find the range'],
          },
        })
      }
    }
  }
  return pairs
}

function generateAtwoodVariations(): TrainingPair[] {
  const pairs: TrainingPair[] = []
  const massPairs = [[2, 3], [3, 5], [4, 6], [1, 4], [5, 8], [2, 7], [10, 15], [3, 3]]

  let id = 0
  for (const [m1, m2] of massPairs) {
    id++
    pairs.push({
      id: `atwood_${id}`,
      problemType: 'atwood-machine',
      problemText: `An Atwood machine consists of a ${m1} kg and ${m2} kg mass connected by a light string over a frictionless pulley. Find the acceleration and the tension in the string.`,
      params: { m1: m1!, m2: m2! },
      expectedOutput: {
        objects: [
          { type: 'block', label: 'm1', properties: { mass: m1 } },
          { type: 'block', label: 'm2', properties: { mass: m2 } },
          { type: 'pulley', properties: {} },
        ],
        labels: [`${m1} kg`, `${m2} kg`],
        forces: [
          { on: 'm1', direction: 'down', label: 'm1·g' },
          { on: 'm1', direction: 'up', label: 'T' },
          { on: 'm2', direction: 'down', label: 'm2·g' },
          { on: 'm2', direction: 'up', label: 'T' },
        ],
        text: ['Find the acceleration', 'Find the tension'],
      },
    })
  }
  return pairs
}

function generateSpringMassVariations(): TrainingPair[] {
  const pairs: TrainingPair[] = []
  const masses = [0.2, 0.4, 0.5, 1, 2, 3, 5]
  const springs = [50, 100, 160, 200, 400, 800]

  let id = 0
  for (const mass of masses) {
    for (const k of springs.slice(0, 3)) {
      id++
      pairs.push({
        id: `spring_${id}`,
        problemType: 'spring-mass',
        problemText: `A ${mass} kg mass is attached to a spring with k = ${k} N/m on a frictionless surface. It is displaced from equilibrium and released from rest. Find the period and maximum speed.`,
        params: { mass, k },
        expectedOutput: {
          objects: [
            { type: 'block', label: 'm', properties: { mass } },
            { type: 'spring', label: 'k', properties: { k } },
          ],
          labels: [`${mass} kg`, `k = ${k} N/m`],
          forces: [
            { on: 'block', direction: 'horizontal_restoring', label: '-kx' },
            { on: 'block', direction: 'down', label: 'mg' },
            { on: 'block', direction: 'up', label: 'N' },
          ],
          text: ['Find the period', 'Find the maximum speed'],
        },
      })
    }
  }
  return pairs
}

function generateCircularMotionVariations(): TrainingPair[] {
  const pairs: TrainingPair[] = []
  const masses = [0.2, 0.5, 1, 2, 5, 1500]
  const radii = [0.5, 0.8, 1, 2, 5, 50]
  const speeds = [2, 5, 7, 10, 15, 20]

  let id = 0
  for (let i = 0; i < masses.length; i++) {
    id++
    const mass = masses[i]!
    const radius = radii[i]!
    const speed = speeds[i]!
    const isLarge = mass > 100
    pairs.push({
      id: `circular_${id}`,
      problemType: 'circular-motion',
      problemText: isLarge
        ? `A ${mass} kg car travels over a hill that can be modeled as a circular arc of radius ${radius} m. Find the normal force at the top when traveling at ${speed} m/s.`
        : `A ${mass} kg ball on a string of length ${radius} m swings in a vertical circle. Find the minimum speed at the top for the string to remain taut.`,
      params: { mass, radius, speed },
      expectedOutput: {
        objects: [
          { type: isLarge ? 'block' : 'particle', label: isLarge ? 'car' : 'ball', properties: { mass } },
          { type: 'circle', properties: { radius } },
        ],
        labels: [`${mass} kg`, `${radius} m`, ...(speed ? [`${speed} m/s`] : [])],
        forces: [
          { on: isLarge ? 'car' : 'ball', direction: 'down', label: 'mg' },
          { on: isLarge ? 'car' : 'ball', direction: 'toward_center', label: isLarge ? 'N' : 'T' },
        ],
        text: isLarge ? ['Find the normal force'] : ['Find the minimum speed'],
      },
    })
  }
  return pairs
}

function generateCollisionVariations(): TrainingPair[] {
  const pairs: TrainingPair[] = []
  const scenarios = [
    { m1: 2000, m2: 1000, v1: 20, v2: 30, type: '2D', desc: 'truck east, car north, lock together' },
    { m1: 0.01, m2: 2, v1: 400, v2: 0, type: 'ballistic', desc: 'bullet embeds in block (ballistic pendulum)' },
    { m1: 2, m2: 4, v1: 6, v2: 0, type: '1D-elastic', desc: 'elastic collision, second mass at rest' },
    { m1: 5, m2: 3, v1: 4, v2: -2, type: '1D-inelastic', desc: 'head-on, lock together' },
    { m1: 3, m2: 3, v1: 5, v2: -5, type: '1D-elastic', desc: 'equal masses, equal opposite speeds' },
  ]

  let id = 0
  for (const s of scenarios) {
    id++
    pairs.push({
      id: `collision_${id}`,
      problemType: 'collision',
      problemText: `A ${s.m1} kg object moving at ${s.v1} m/s collides with a ${s.m2} kg object ${s.v2 === 0 ? 'at rest' : `moving at ${Math.abs(s.v2)} m/s ${s.v2 < 0 ? 'in the opposite direction' : 'in the same direction'}`}. ${s.desc}. Find the speed after collision.`,
      params: { m1: s.m1, m2: s.m2, v1: s.v1, v2: s.v2 },
      expectedOutput: {
        objects: [
          { type: 'block', label: 'm1', properties: { mass: s.m1, velocity: s.v1 } },
          { type: 'block', label: 'm2', properties: { mass: s.m2, velocity: s.v2 } },
        ],
        labels: [`${s.m1} kg`, `${s.v1} m/s`, `${s.m2} kg`, ...(s.v2 !== 0 ? [`${Math.abs(s.v2)} m/s`] : [])],
        forces: [],
        text: ['Find the speed after collision'],
      },
    })
  }
  return pairs
}

// Generate the full dataset
export function generateFullDataset(): TrainingPair[] {
  return [
    ...generateInclinedPlaneVariations(),
    ...generateProjectileVariations(),
    ...generateAtwoodVariations(),
    ...generateSpringMassVariations(),
    ...generateCircularMotionVariations(),
    ...generateCollisionVariations(),
  ]
}

// If run directly, output the dataset as JSON
if (typeof process !== 'undefined' && process.argv[1]?.includes('generate-dataset')) {
  const dataset = generateFullDataset()
  const outputDir = join(process.cwd(), 'training-data')
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

  writeFileSync(
    join(outputDir, 'dataset.json'),
    JSON.stringify(dataset, null, 2)
  )

  console.log(`Generated ${dataset.length} training pairs`)
  console.log(`  Inclined plane: ${dataset.filter(d => d.problemType === 'inclined-plane').length}`)
  console.log(`  Projectile: ${dataset.filter(d => d.problemType === 'projectile').length}`)
  console.log(`  Atwood: ${dataset.filter(d => d.problemType === 'atwood-machine').length}`)
  console.log(`  Spring-mass: ${dataset.filter(d => d.problemType === 'spring-mass').length}`)
  console.log(`  Circular motion: ${dataset.filter(d => d.problemType === 'circular-motion').length}`)
  console.log(`  Collision: ${dataset.filter(d => d.problemType === 'collision').length}`)
  console.log(`\nSaved to ${join(outputDir, 'dataset.json')}`)
}
