import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRenderer } from './renderer'
import { scalarField, vectorField, Domain } from './field'
import { createParticle } from './particle'
import { vec2 } from './vec2'

const domain: Domain = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }

describe('renderer', () => {
  let canvas: HTMLCanvasElement
  let ctx: any

  beforeEach(() => {
    canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 500
    // Get the mock context provided by test-setup.ts
    ctx = canvas.getContext('2d')!
    // Replace methods with spies
    ctx.fillRect = vi.fn()
    ctx.beginPath = vi.fn()
    ctx.moveTo = vi.fn()
    ctx.lineTo = vi.fn()
    ctx.stroke = vi.fn()
    ctx.fill = vi.fn()
    ctx.arc = vi.fn()
    ctx.closePath = vi.fn()
    // Make getContext always return this same spied ctx
    canvas.getContext = () => ctx
  })

  describe('coordinate transforms', () => {
    it('worldToScreen maps domain bottom-left to canvas bottom-left (y-flipped)', () => {
      const r = createRenderer({ canvas, domain })
      const bl = r.worldToScreen(vec2(-5, -5))
      expect(bl.x).toBeCloseTo(0)
      expect(bl.y).toBeCloseTo(500)
    })

    it('worldToScreen maps domain top-right to canvas top-right', () => {
      const r = createRenderer({ canvas, domain })
      const tr = r.worldToScreen(vec2(5, 5))
      expect(tr.x).toBeCloseTo(500)
      expect(tr.y).toBeCloseTo(0)
    })

    it('worldToScreen maps domain center to canvas center', () => {
      const r = createRenderer({ canvas, domain })
      const center = r.worldToScreen(vec2(0, 0))
      expect(center.x).toBeCloseTo(250)
      expect(center.y).toBeCloseTo(250)
    })

    it('screenToWorld is inverse of worldToScreen', () => {
      const r = createRenderer({ canvas, domain })
      const original = vec2(2.5, -1.3)
      const screen = r.worldToScreen(original)
      const back = r.screenToWorld(screen)
      expect(back.x).toBeCloseTo(original.x)
      expect(back.y).toBeCloseTo(original.y)
    })

    it('handles non-square canvas and domain', () => {
      canvas.width = 800
      canvas.height = 400
      const wideDomain: Domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 5 }
      const r = createRenderer({ canvas, domain: wideDomain })
      const tr = r.worldToScreen(vec2(10, 5))
      expect(tr.x).toBeCloseTo(800)
      expect(tr.y).toBeCloseTo(0)
    })
  })

  describe('clear', () => {
    it('fills entire canvas with background color', () => {
      const r = createRenderer({ canvas, domain, background: '#000000' })
      r.clear()
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 500, 500)
    })

    it('uses default dark background when not specified', () => {
      const r = createRenderer({ canvas, domain })
      r.clear()
      expect(ctx.fillStyle).toBe('#1a1a2e')
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 500, 500)
    })
  })

  describe('drawScalarField', () => {
    it('renders grid of colored cells', () => {
      const r = createRenderer({ canvas, domain })
      const field = scalarField((p) => p.x + p.y)
      r.drawScalarField(field, { resolution: 10 })
      // 10x10 = 100 cells rendered
      expect(ctx.fillRect).toHaveBeenCalledTimes(100)
    })

    it('respects resolution parameter', () => {
      const r = createRenderer({ canvas, domain })
      const field = scalarField(() => 1)
      r.drawScalarField(field, { resolution: 5 })
      expect(ctx.fillRect).toHaveBeenCalledTimes(25)
    })

    it('handles uniform field without crashing', () => {
      const r = createRenderer({ canvas, domain })
      const field = scalarField(() => 42)
      expect(() => r.drawScalarField(field, { resolution: 10 })).not.toThrow()
    })
  })

  describe('drawVectorField', () => {
    it('renders arrows for each grid cell with nonzero vector', () => {
      const r = createRenderer({ canvas, domain })
      const field = vectorField((p) => vec2(-p.y, p.x))
      r.drawVectorField(field, { resolution: 5 })
      // Each arrow: beginPath + moveTo + lineTo + stroke + arrowhead (beginPath + moveTo + lineTo + lineTo + closePath + fill)
      expect(ctx.stroke).toHaveBeenCalled()
      expect(ctx.fill).toHaveBeenCalled()
    })

    it('skips zero-magnitude vectors', () => {
      const r = createRenderer({ canvas, domain })
      // Field is zero everywhere except at one point — should mostly skip
      const field = vectorField(() => vec2(0, 0))
      r.drawVectorField(field, { resolution: 5 })
      // maxMag is 0, function returns early
      expect(ctx.stroke).not.toHaveBeenCalled()
    })

    it('dots mode renders arcs instead of lines', () => {
      const r = createRenderer({ canvas, domain })
      const field = vectorField(() => vec2(1, 0))
      r.drawVectorField(field, { resolution: 5, mode: 'dots' })
      expect(ctx.arc).toHaveBeenCalled()
      // In dots mode, no stroke for arrow lines
      expect(ctx.stroke).not.toHaveBeenCalled()
    })

    it('applies custom color', () => {
      const r = createRenderer({ canvas, domain })
      const field = vectorField(() => vec2(1, 0))
      r.drawVectorField(field, { resolution: 3, color: '#ff0000' })
      expect(ctx.strokeStyle).toBe('#ff0000')
    })
  })

  describe('drawTrajectory', () => {
    it('draws connected line through points', () => {
      const r = createRenderer({ canvas, domain })
      const points = [[0, 0], [1, 1], [2, 0], [3, -1]]
      r.drawTrajectory(points)
      expect(ctx.moveTo).toHaveBeenCalledTimes(1)
      expect(ctx.lineTo).toHaveBeenCalledTimes(3)
      expect(ctx.stroke).toHaveBeenCalledTimes(1)
    })

    it('does nothing for fewer than 2 points', () => {
      const r = createRenderer({ canvas, domain })
      r.drawTrajectory([[0, 0]])
      expect(ctx.moveTo).not.toHaveBeenCalled()
      r.drawTrajectory([])
      expect(ctx.moveTo).not.toHaveBeenCalled()
    })

    it('applies custom color and line width', () => {
      const r = createRenderer({ canvas, domain })
      r.drawTrajectory([[0, 0], [1, 1]], { color: '#00ff00', lineWidth: 3 })
      expect(ctx.strokeStyle).toBe('#00ff00')
      expect(ctx.lineWidth).toBe(3)
    })
  })

  describe('drawParticle', () => {
    it('draws a filled circle at particle position', () => {
      const r = createRenderer({ canvas, domain })
      const p = createParticle({ position: vec2(0, 0) })
      r.drawParticle(p)
      expect(ctx.arc).toHaveBeenCalledTimes(1)
      expect(ctx.fill).toHaveBeenCalledTimes(1)
      // Should be at canvas center (250, 250)
      expect(ctx.arc).toHaveBeenCalledWith(250, 250, 6, 0, Math.PI * 2)
    })

    it('draws particle at correct screen position', () => {
      const r = createRenderer({ canvas, domain })
      // (5, 5) should map to (500, 0) — top-right
      const p = createParticle({ position: vec2(5, 5) })
      r.drawParticle(p)
      expect(ctx.arc).toHaveBeenCalledWith(500, 0, 6, 0, Math.PI * 2)
    })

    it('draws trail when particle has trail history', () => {
      const r = createRenderer({ canvas, domain })
      const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
      p.trailEnabled = true
      for (let i = 0; i < 5; i++) p.step(0.1, i * 0.1)
      r.drawParticle(p)
      // Trail: moveTo + 4 lineTo + stroke, then particle: arc + fill
      expect(ctx.moveTo).toHaveBeenCalledTimes(1)
      expect(ctx.lineTo).toHaveBeenCalledTimes(4)
    })

    it('does not draw trail when trail is empty', () => {
      const r = createRenderer({ canvas, domain })
      const p = createParticle({ position: vec2(0, 0) })
      r.drawParticle(p)
      expect(ctx.moveTo).not.toHaveBeenCalled()
      expect(ctx.lineTo).not.toHaveBeenCalled()
    })

    it('applies custom radius and color', () => {
      const r = createRenderer({ canvas, domain })
      const p = createParticle({ position: vec2(0, 0) })
      r.drawParticle(p, { radius: 10, color: '#ff00ff' })
      expect(ctx.arc).toHaveBeenCalledWith(250, 250, 10, 0, Math.PI * 2)
      expect(ctx.fillStyle).toBe('#ff00ff')
    })
  })
})
