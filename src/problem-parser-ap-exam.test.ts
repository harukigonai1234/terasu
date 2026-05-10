import { describe, it, expect } from 'vitest'
import { parseProblem } from './problem-parser'

/**
 * Tests against REAL AP Physics C Mechanics exam problems.
 * Source: College Board AP Physics C Mechanics Practice Exam (2008).
 * Each test verifies the parser can extract structured data from actual exam text.
 */

describe('AP Physics C Mechanics - Free Response Questions', () => {
  describe('FRQ 1: Projectile + Collision + Pendulum', () => {
    const problem = `A chunk of clay of mass 0.20 kg is thrown from the ground with an initial speed of 12 m/s at an angle of 30 degrees with the horizontal. At the top of its trajectory, the clay strikes a small block of mass 2.3 kg suspended from a 3.0 m long string. The clay sticks to the block, which then swings freely.`

    it('detects as projectile/collision problem', () => {
      const result = parseProblem(problem)
      // Contains both projectile and collision keywords
      expect(result.type === 'projectile' || result.type === 'collision').toBe(true)
    })

    it('extracts clay mass', () => {
      const result = parseProblem(problem)
      expect(result.knowns.mass).toBeDefined()
    })

    it('extracts initial speed', () => {
      const result = parseProblem(problem)
      expect(result.knowns.speed).toEqual({ magnitude: 12, unit: 'm/s' })
    })

    it('extracts launch angle', () => {
      const result = parseProblem(problem)
      expect(result.knowns.angle).toEqual({ magnitude: 30, unit: 'degrees' })
    })

    const partA = `Calculate the horizontal distance D between the launching point of the clay and a point on the floor directly below the initial position of the block.`

    it('detects distance as unknown from part (a)', () => {
      const result = parseProblem(problem + ' ' + partA)
      expect(result.unknowns).toContain('distance')
    })

    const partB = `Calculate the speed of the block-clay system immediately after the collision with the clay.`

    it('detects speed as unknown from part (b)', () => {
      const result = parseProblem(problem + ' ' + partB)
      expect(result.unknowns).toContain('speed')
    })
  })

  describe('FRQ 2: Force sensor + cart + data analysis', () => {
    const problem = `In the lab apparatus, a force sensor attached to a cart is connected by a string to a block. The string passes over a pulley. The block is allowed to fall, accelerating the cart.`

    it('detects as atwood-machine type (cart + pulley + string)', () => {
      const result = parseProblem(problem)
      expect(result.type).toBe('atwood-machine')
    })
  })

  describe('FRQ 3: Falling spool (rotation)', () => {
    const problem = `A student holds one end of a thread, which is wrapped around a cylindrical spool. The student then drops the spool from a height h above the floor, and the thread unwinds as it falls. The spool has a mass M and a radius R. Calculate the linear acceleration of the spool as it falls.`

    it('detects constraints (released/dropped)', () => {
      const result = parseProblem(problem)
      const ic = result.constraints.find(c => c.type === 'initial-condition')
      expect(ic).toBeDefined()
    })

    it('detects acceleration as unknown', () => {
      const result = parseProblem(problem)
      expect(result.unknowns).toContain('acceleration')
    })
  })
})

describe('AP Physics C Mechanics - Multiple Choice', () => {
  it('MC 2: ball thrown up, find displacement', () => {
    const problem = `A ball is thrown straight up from a point 2 m above the ground. The ball reaches a maximum height of 3 m above its starting point and then falls 5 m to the ground. When the ball strikes the ground, find the distance from its starting point.`
    const result = parseProblem(problem)
    expect(result.type).toBe('projectile')
    expect(result.unknowns).toContain('distance')
  })

  it('MC 4: two projectiles at complementary angles', () => {
    const problem = `Two projectiles are launched with the same initial speed from the same location, one at a 30 degree angle and the other at a 60 degree angle with the horizontal. They land at the same height at which they were launched.`
    const result = parseProblem(problem)
    expect(result.type).toBe('projectile')
    expect(result.knowns.angle).toBeDefined()
  })

  it('MC 5: object with force applied then removed', () => {
    const problem = `An object of mass 100 kg is initially at rest on a horizontal frictionless surface. At time t = 0, a horizontal force of 10 N is applied to the object for 1 s and then removed.`
    const result = parseProblem(problem)
    expect(result.knowns.mass).toEqual({ magnitude: 100, unit: 'kg' })
    const ic = result.constraints.find(c => c.type === 'initial-condition')
    expect(ic).toBeDefined()
    expect(ic!.properties.v0).toBe(0)
    const frictionless = result.constraints.find(c => c.type === 'friction')
    expect(frictionless).toBeDefined()
  })

  it('MC 7: projectile at highest point', () => {
    const problem = `A rock is thrown from the edge of a cliff with an initial velocity at an angle with the horizontal. Find the speed at the highest point P.`
    const result = parseProblem(problem)
    expect(result.type).toBe('projectile')
    expect(result.unknowns).toContain('speed')
  })
})

describe('AP Physics C Mechanics - additional real problems', () => {
  it('inclined plane with two friction coefficients', () => {
    const problem = `A 5 kg block sits on a 30 degree incline. The coefficients of static and kinetic friction are μs = 0.4 and μk = 0.3. Determine whether the block slides. If a horizontal force F is applied to the block pushing it into the surface of the incline, find the minimum force that prevents the block from sliding.`
    const result = parseProblem(problem)
    expect(result.type).toBe('inclined-plane')
    expect(result.knowns.mass).toEqual({ magnitude: 5, unit: 'kg' })
    expect(result.knowns.angle).toEqual({ magnitude: 30, unit: 'degrees' })
    expect(result.knowns.mu_s).toEqual({ magnitude: 0.4, unit: '' })
    expect(result.knowns.mu_k).toEqual({ magnitude: 0.3, unit: '' })
    expect(result.unknowns).toContain('slides')
    expect(result.unknowns).toContain('force')
  })

  it('Atwood machine with massive pulley', () => {
    const problem = `An Atwood machine consists of a 4 kg mass and a 6 kg mass connected by a light string over a massless, frictionless pulley. Find the acceleration of the system and the tension in the string.`
    const result = parseProblem(problem)
    expect(result.type).toBe('atwood-machine')
    const blocks = result.objects.filter(o => o.type === 'block')
    expect(blocks.length).toBe(2)
    expect(blocks[0]!.properties.mass!.magnitude).toBe(4)
    expect(blocks[1]!.properties.mass!.magnitude).toBe(6)
    expect(result.unknowns).toContain('acceleration')
    expect(result.unknowns).toContain('tension')
  })

  it('spring-mass oscillation', () => {
    const problem = `A 0.4 kg mass is attached to a spring with k = 160 N/m on a frictionless surface. It is displaced 0.1 m from equilibrium and released from rest. Find the angular frequency, period, and frequency, the maximum speed and maximum acceleration.`
    const result = parseProblem(problem)
    expect(result.type).toBe('spring-mass')
    expect(result.knowns.mass).toEqual({ magnitude: 0.4, unit: 'kg' })
    expect(result.knowns.spring_k).toEqual({ magnitude: 160, unit: 'N/m' })
    expect(result.unknowns).toContain('frequency')
    expect(result.unknowns).toContain('speed')
    expect(result.unknowns).toContain('acceleration')
    const ic = result.constraints.find(c => c.type === 'initial-condition')
    expect(ic).toBeDefined()
  })

  it('car on circular hill', () => {
    const problem = `A 1500 kg car travels over a hill that can be modeled as a circular arc of radius 50 m. Find the normal force on the car at the top of the hill when traveling at 15 m/s. Find the maximum speed at which the car can travel over the top without losing contact with the road.`
    const result = parseProblem(problem)
    expect(result.type).toBe('circular-motion')
    expect(result.knowns.mass).toEqual({ magnitude: 1500, unit: 'kg' })
    expect(result.knowns.speed).toEqual({ magnitude: 15, unit: 'm/s' })
    expect(result.unknowns).toContain('force')
    expect(result.unknowns).toContain('speed')
  })

  it('2D collision (truck and car)', () => {
    const problem = `A 2000 kg truck traveling east at 20 m/s collides with a 1000 kg car traveling north at 30 m/s at an intersection. They lock together after impact. Find the speed and direction of the wreckage immediately after collision.`
    const result = parseProblem(problem)
    expect(result.type).toBe('collision')
    expect(result.unknowns).toContain('speed')
  })

  it('RC circuit charging', () => {
    const problem = `A capacitor C = 50 μF is charged through a resistor R = 10 kΩ from a 9 V battery. Find the time constant, the voltage across the capacitor at t = 0.3 s, and the time to reach 99% of final voltage.`
    const result = parseProblem(problem)
    expect(result.type).toBe('rc-circuit')
    expect(result.knowns.capacitance).toEqual({ magnitude: 50, unit: 'μF' })
    expect(result.knowns.voltage).toEqual({ magnitude: 9, unit: 'V' })
    expect(result.unknowns).toContain('time')
    expect(result.unknowns).toContain('voltage')
  })

  it('proton in magnetic field (cyclotron)', () => {
    const problem = `A proton enters a uniform magnetic field B = 0.5 T perpendicular to its velocity of 3000000 m/s. Find the radius of the circular orbit and the period of revolution.`
    const result = parseProblem(problem)
    expect(result.type).toBe('circular-motion')
    expect(result.unknowns).toContain('period')
  })

  it('block on block friction coupling', () => {
    const problem = `A 2 kg block is placed on top of a 5 kg block which rests on a frictionless table. The coefficient of static friction between the blocks is μs = 0.3. A horizontal force F is applied to the bottom block. Find the maximum force that can be applied without the top block slipping, and the acceleration of the system at that maximum force.`
    const result = parseProblem(problem)
    expect(result.knowns.mu_s).toEqual({ magnitude: 0.3, unit: '' })
    expect(result.unknowns).toContain('force')
    expect(result.unknowns).toContain('acceleration')
  })

  it('vertical circular motion', () => {
    const problem = `A small ball of mass 0.2 kg is attached to a string of length 0.8 m and swings in a vertical circle. Find the minimum speed at the top of the circle for the string to remain taut.`
    const result = parseProblem(problem)
    expect(result.type).toBe('circular-motion')
    expect(result.knowns.mass).toEqual({ magnitude: 0.2, unit: 'kg' })
    expect(result.unknowns).toContain('speed')
  })

  it('ballistic pendulum', () => {
    const problem = `A 0.01 kg bullet traveling at 400 m/s embeds itself in a 2 kg wooden block suspended as a ballistic pendulum. Find the velocity of the block immediately after impact and the maximum height the pendulum rises.`
    const result = parseProblem(problem)
    expect(result.type).toBe('collision')
    expect(result.knowns.speed).toEqual({ magnitude: 400, unit: 'm/s' })
  })
})
