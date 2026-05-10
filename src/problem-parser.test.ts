import { describe, it, expect } from 'vitest'
import { parseProblem } from './problem-parser'

describe('problem parser', () => {
  describe('problem type detection', () => {
    it('detects inclined plane', () => {
      const result = parseProblem('A 5 kg block on a 30° incline with μs = 0.4')
      expect(result.type).toBe('inclined-plane')
    })

    it('detects projectile motion', () => {
      const result = parseProblem('A ball is launched from the top of a 45 m tall cliff at 30 m/s at 53° above horizontal')
      expect(result.type).toBe('projectile')
    })

    it('detects Atwood machine', () => {
      const result = parseProblem('An Atwood machine consists of a 4 kg mass and a 6 kg mass connected by a light string over a pulley')
      expect(result.type).toBe('atwood-machine')
    })

    it('detects circular motion', () => {
      const result = parseProblem('A 1500 kg car travels over a circular hill of radius 50 m')
      expect(result.type).toBe('circular-motion')
    })

    it('detects spring-mass', () => {
      const result = parseProblem('A 0.4 kg mass is attached to a spring with k = 160 N/m on a frictionless surface')
      expect(result.type).toBe('spring-mass')
    })

    it('detects collision', () => {
      const result = parseProblem('A 2000 kg truck traveling at 20 m/s collides with a 1000 kg car')
      expect(result.type).toBe('collision')
    })

    it('detects charged particle / electrostatics', () => {
      const result = parseProblem('Three charges are arranged: q1 = +4 μC at x=0, q2 = -2 μC at x=3m')
      expect(result.type).toBe('charged-particle')
    })

    it('detects RC circuit', () => {
      const result = parseProblem('A capacitor C = 50 μF is charged through a resistor R = 10 kΩ from a 9 V battery')
      expect(result.type).toBe('rc-circuit')
    })
  })

  describe('extracting knowns', () => {
    it('extracts mass', () => {
      const result = parseProblem('A 5 kg block slides down a ramp')
      expect(result.knowns.mass).toEqual({ magnitude: 5, unit: 'kg' })
    })

    it('extracts angle', () => {
      const result = parseProblem('A block on a 30° incline')
      expect(result.knowns.angle).toEqual({ magnitude: 30, unit: 'degrees' })
    })

    it('extracts speed', () => {
      const result = parseProblem('A ball is launched at 30 m/s')
      expect(result.knowns.speed).toEqual({ magnitude: 30, unit: 'm/s' })
    })

    it('extracts coefficient of static friction', () => {
      const result = parseProblem('The coefficient of static friction is 0.4')
      expect(result.knowns.mu_s).toEqual({ magnitude: 0.4, unit: '' })
    })

    it('extracts coefficient of kinetic friction', () => {
      const result = parseProblem('μk = 0.3 on the surface')
      expect(result.knowns.mu_k).toEqual({ magnitude: 0.3, unit: '' })
    })

    it('extracts spring constant', () => {
      const result = parseProblem('A spring with k = 200 N/m')
      expect(result.knowns.spring_k).toEqual({ magnitude: 200, unit: 'N/m' })
    })

    it('extracts charge', () => {
      const result = parseProblem('A point charge of 4 μC')
      expect(result.knowns.charge).toEqual({ magnitude: 4, unit: 'μC' })
    })

    it('extracts voltage', () => {
      const result = parseProblem('A 9 V battery charges the capacitor')
      expect(result.knowns.voltage).toEqual({ magnitude: 9, unit: 'V' })
    })

    it('extracts capacitance', () => {
      const result = parseProblem('A capacitor C = 50 μF')
      expect(result.knowns.capacitance).toEqual({ magnitude: 50, unit: 'μF' })
    })
  })

  describe('extracting objects', () => {
    it('extracts a single block with mass', () => {
      const result = parseProblem('A 5 kg block on a 30° incline')
      expect(result.objects.length).toBeGreaterThanOrEqual(1)
      const block = result.objects.find(o => o.type === 'block')
      expect(block).toBeDefined()
      expect(block!.properties.mass).toEqual({ magnitude: 5, unit: 'kg' })
    })

    it('extracts two masses for Atwood machine', () => {
      const result = parseProblem('A 4 kg and 6 kg mass connected by a string over a pulley')
      const blocks = result.objects.filter(o => o.type === 'block')
      expect(blocks.length).toBe(2)
      expect(blocks[0]!.properties.mass!.magnitude).toBe(4)
      expect(blocks[1]!.properties.mass!.magnitude).toBe(6)
    })

    it('extracts spring', () => {
      const result = parseProblem('A mass attached to a spring with k = 160 N/m')
      const spring = result.objects.find(o => o.type === 'spring')
      expect(spring).toBeDefined()
      expect(spring!.properties.k).toEqual({ magnitude: 160, unit: 'N/m' })
    })
  })

  describe('extracting constraints', () => {
    it('detects frictionless', () => {
      const result = parseProblem('A block on a frictionless incline')
      const frictionConstraint = result.constraints.find(c => c.type === 'friction')
      expect(frictionConstraint).toBeDefined()
      expect(frictionConstraint!.properties.frictionless).toBe(true)
    })

    it('detects starts from rest', () => {
      const result = parseProblem('A 3 kg block starts from rest on an incline')
      const ic = result.constraints.find(c => c.type === 'initial-condition')
      expect(ic).toBeDefined()
      expect(ic!.properties.v0).toBe(0)
    })

    it('detects released from rest', () => {
      const result = parseProblem('The block is released from a height of 5 m')
      const ic = result.constraints.find(c => c.type === 'initial-condition')
      expect(ic).toBeDefined()
      expect(ic!.properties.released).toBe(true)
    })

    it('extracts friction coefficients for inclined plane', () => {
      const result = parseProblem('A 5 kg block on a 30° incline with μs = 0.4 and μk = 0.3')
      const surface = result.constraints.find(c => c.type === 'surface')
      expect(surface).toBeDefined()
      expect(surface!.properties.mu_s).toBe(0.4)
      expect(surface!.properties.mu_k).toBe(0.3)
    })
  })

  describe('extracting unknowns', () => {
    it('detects "find the acceleration"', () => {
      const result = parseProblem('Find the acceleration of the block')
      expect(result.unknowns).toContain('acceleration')
    })

    it('detects "find the speed"', () => {
      const result = parseProblem('Find the speed after traveling 2 m')
      expect(result.unknowns).toContain('speed')
    })

    it('detects "does it slide"', () => {
      const result = parseProblem('Determine whether the block slides')
      expect(result.unknowns).toContain('slides')
    })

    it('detects "find the tension"', () => {
      const result = parseProblem('Find the tension in the string')
      expect(result.unknowns).toContain('tension')
    })

    it('detects multiple unknowns', () => {
      const result = parseProblem('Find the acceleration of the system and the tension in the string')
      expect(result.unknowns).toContain('acceleration')
      expect(result.unknowns).toContain('tension')
    })

    it('detects "find the time"', () => {
      const result = parseProblem('How long is the ball in the air?')
      expect(result.unknowns).toContain('time')
    })

    it('detects "find the distance"', () => {
      const result = parseProblem('How far does the block travel?')
      expect(result.unknowns).toContain('distance')
    })

    it('detects "find the period"', () => {
      const result = parseProblem('Find the period of oscillation')
      expect(result.unknowns).toContain('period')
    })
  })

  describe('full problem parsing (real AP problems)', () => {
    it('parses inclined plane with friction', () => {
      const result = parseProblem(
        'A 5 kg block sits on a 30° incline. The coefficients of static and kinetic friction are μs = 0.4 and μk = 0.3. Determine whether the block slides.'
      )
      expect(result.type).toBe('inclined-plane')
      expect(result.knowns.mass).toEqual({ magnitude: 5, unit: 'kg' })
      expect(result.knowns.angle).toEqual({ magnitude: 30, unit: 'degrees' })
      expect(result.knowns.mu_s).toEqual({ magnitude: 0.4, unit: '' })
      expect(result.knowns.mu_k).toEqual({ magnitude: 0.3, unit: '' })
      expect(result.unknowns).toContain('slides')
    })

    it('parses projectile from cliff', () => {
      const result = parseProblem(
        'A ball is launched from the top of a 45 m tall cliff with an initial speed of 30 m/s at an angle of 53° above the horizontal. Find the time the ball is in the air and the horizontal range.'
      )
      expect(result.type).toBe('projectile')
      expect(result.knowns.height).toEqual({ magnitude: 45, unit: 'm' })
      expect(result.knowns.speed).toEqual({ magnitude: 30, unit: 'm/s' })
      expect(result.knowns.angle).toEqual({ magnitude: 53, unit: 'degrees' })
      expect(result.unknowns).toContain('time')
      expect(result.unknowns).toContain('distance')
    })

    it('parses Atwood machine', () => {
      const result = parseProblem(
        'An Atwood machine consists of a 4 kg and 6 kg mass connected by a light string over a massless frictionless pulley. Find the acceleration and the tension in the string.'
      )
      expect(result.type).toBe('atwood-machine')
      const blocks = result.objects.filter(o => o.type === 'block')
      expect(blocks.length).toBe(2)
      expect(result.unknowns).toContain('acceleration')
      expect(result.unknowns).toContain('tension')
    })

    it('parses spring-mass SHM', () => {
      const result = parseProblem(
        'A 0.4 kg mass is attached to a spring with k = 160 N/m on a frictionless surface. It is displaced 0.1 m from equilibrium and released from rest. Find the period and maximum speed.'
      )
      expect(result.type).toBe('spring-mass')
      expect(result.knowns.mass).toEqual({ magnitude: 0.4, unit: 'kg' })
      expect(result.knowns.spring_k).toEqual({ magnitude: 160, unit: 'N/m' })
      expect(result.unknowns).toContain('period')
      expect(result.unknowns).toContain('speed')
    })

    it('parses 2D collision', () => {
      const result = parseProblem(
        'A 2000 kg truck traveling at 20 m/s collides with a 1000 kg car traveling at 30 m/s. Find the speed after the collision.'
      )
      expect(result.type).toBe('collision')
      expect(result.unknowns).toContain('speed')
    })

    it('parses RC circuit', () => {
      const result = parseProblem(
        'A capacitor C = 50 μF is charged through a resistor R = 10 kΩ from a 9 V battery. Find the time to reach 99% of final voltage.'
      )
      expect(result.type).toBe('rc-circuit')
      expect(result.knowns.capacitance).toEqual({ magnitude: 50, unit: 'μF' })
      expect(result.knowns.voltage).toEqual({ magnitude: 9, unit: 'V' })
      expect(result.unknowns).toContain('time')
    })

    it('parses circular motion (car over hill)', () => {
      const result = parseProblem(
        'A 1500 kg car travels over a hill that can be modeled as a circular arc of radius 50 m. Find the normal force on the car at the top when traveling at 15 m/s. Find the maximum speed without losing contact.'
      )
      expect(result.type).toBe('circular-motion')
      expect(result.knowns.mass).toEqual({ magnitude: 1500, unit: 'kg' })
      expect(result.knowns.speed).toEqual({ magnitude: 15, unit: 'm/s' })
      expect(result.unknowns).toContain('force')
      expect(result.unknowns).toContain('speed')
    })
  })
})
