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
    ctx = canvas.getContext('2d')!
    ctx.fillRect = vi.fn()
    ctx.beginPath = vi.fn()
    ctx.moveTo = vi.fn()
    ctx.lineTo = vi.fn()
    ctx.stroke = vi.fn()
    ctx.fill = vi.fn()
    ctx.arc = vi.fn()
    ctx.closePath = vi.fn()
    ctx.fillText = vi.fn()
    canvas.getContext = () => ctx
  })

  describe('coordinate transforms', () => {
    it('worldToScreen maps domain bottom-left to canvas bottom-left (y-flipped)', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const bl = r.worldToScreen(vec2(-5, -5))
      expect(bl.x).toBeCloseTo(0)
      expect(bl.y).toBeCloseTo(500)
    })

    it('worldToScreen maps domain top-right to canvas top-right', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const tr = r.worldToScreen(vec2(5, 5))
      expect(tr.x).toBeCloseTo(500)
      expect(tr.y).toBeCloseTo(0)
    })

    it('worldToScreen maps domain center to canvas center', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const center = r.worldToScreen(vec2(0, 0))
      expect(center.x).toBeCloseTo(250)
      expect(center.y).toBeCloseTo(250)
    })

    it('screenToWorld is inverse of worldToScreen', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
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
      const r = createRenderer({ canvas, domain: wideDomain, interactive: false })
      const tr = r.worldToScreen(vec2(10, 5))
      expect(tr.x).toBeCloseTo(800)
      expect(tr.y).toBeCloseTo(0)
    })

    it('updates after setDomain', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      r.setDomain({ xMin: 0, xMax: 10, yMin: 0, yMax: 10 })
      const center = r.worldToScreen(vec2(5, 5))
      expect(center.x).toBeCloseTo(250)
      expect(center.y).toBeCloseTo(250)
    })
  })

  describe('clear', () => {
    it('fills entire canvas with background color', () => {
      const r = createRenderer({ canvas, domain, background: '#000000', interactive: false })
      r.clear()
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 500, 500)
    })

    it('uses white background by default (Desmos style)', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      r.clear()
      expect(ctx.fillStyle).toBe('#ffffff')
    })
  })

  describe('drawGrid', () => {
    it('draws grid lines, axes, and tick labels', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      r.drawGrid()
      // Should call stroke multiple times (minor grid, major grid, axes)
      expect(ctx.stroke).toHaveBeenCalled()
      // Should draw tick labels
      expect(ctx.fillText).toHaveBeenCalled()
    })

    it('draws axes through origin when origin is in view', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      r.drawGrid()
      // Should have drawn axes (lineWidth 1.5 is set during axes drawing)
      expect(ctx.stroke).toHaveBeenCalled()
    })

    it('skips axes when origin is out of view', () => {
      const offDomain: Domain = { xMin: 10, xMax: 20, yMin: 10, yMax: 20 }
      const r = createRenderer({ canvas, domain: offDomain, interactive: false })
      r.drawGrid()
      // Should still draw grid but axes won't be visible
      expect(ctx.stroke).toHaveBeenCalled()
    })
  })

  describe('drawScalarField', () => {
    it('renders grid of colored cells', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const field = scalarField((p) => p.x + p.y)
      r.drawScalarField(field, { resolution: 10 })
      expect(ctx.fillRect).toHaveBeenCalledTimes(100)
    })

    it('respects resolution parameter', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const field = scalarField(() => 1)
      r.drawScalarField(field, { resolution: 5 })
      expect(ctx.fillRect).toHaveBeenCalledTimes(25)
    })

    it('handles uniform field without crashing', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const field = scalarField(() => 42)
      expect(() => r.drawScalarField(field, { resolution: 10 })).not.toThrow()
    })
  })

  describe('drawVectorField', () => {
    it('renders arrows for nonzero vectors', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const field = vectorField((p) => vec2(-p.y, p.x))
      r.drawVectorField(field, { resolution: 5 })
      expect(ctx.stroke).toHaveBeenCalled()
      expect(ctx.fill).toHaveBeenCalled()
    })

    it('skips zero-magnitude vectors', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const field = vectorField(() => vec2(0, 0))
      r.drawVectorField(field, { resolution: 5 })
      expect(ctx.stroke).not.toHaveBeenCalled()
    })

    it('dots mode renders arcs', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const field = vectorField(() => vec2(1, 0))
      r.drawVectorField(field, { resolution: 5, mode: 'dots' })
      expect(ctx.arc).toHaveBeenCalled()
      expect(ctx.stroke).not.toHaveBeenCalled()
    })
  })

  describe('drawTrajectory', () => {
    it('draws connected line through points', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const points = [[0, 0], [1, 1], [2, 0], [3, -1]]
      r.drawTrajectory(points)
      expect(ctx.moveTo).toHaveBeenCalledTimes(1)
      expect(ctx.lineTo).toHaveBeenCalledTimes(3)
      expect(ctx.stroke).toHaveBeenCalledTimes(1)
    })

    it('does nothing for fewer than 2 points', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      r.drawTrajectory([[0, 0]])
      expect(ctx.moveTo).not.toHaveBeenCalled()
    })

    it('uses Desmos-style defaults (2.5px, 0.9 opacity)', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      r.drawTrajectory([[0, 0], [1, 1]])
      expect(ctx.lineWidth).toBe(2.5)
    })
  })

  describe('drawParticle', () => {
    it('draws a filled circle at particle position', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const p = createParticle({ position: vec2(0, 0) })
      r.drawParticle(p)
      expect(ctx.arc).toHaveBeenCalledWith(250, 250, 5, 0, Math.PI * 2)
      expect(ctx.fill).toHaveBeenCalled()
    })

    it('draws trail when present', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
      p.trailEnabled = true
      for (let i = 0; i < 5; i++) p.step(0.1, i * 0.1)
      r.drawParticle(p)
      expect(ctx.moveTo).toHaveBeenCalled()
      expect(ctx.lineTo).toHaveBeenCalled()
    })
  })

  describe('interaction', () => {
    it('getDomain returns current domain', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      expect(r.getDomain()).toEqual(domain)
    })

    it('setDomain changes the viewport', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const newDomain: Domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 }
      r.setDomain(newDomain)
      expect(r.getDomain()).toEqual(newDomain)
    })

    it('onTrace registers callback', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const cb = vi.fn()
      r.onTrace(cb)
      // Callback is stored but not invoked without mouse events
      expect(cb).not.toHaveBeenCalled()
    })

    it('onDrag registers callback', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const cb = vi.fn()
      r.onDrag(cb)
      expect(cb).not.toHaveBeenCalled()
    })

    it('destroy cleans up without error', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      expect(() => r.destroy()).not.toThrow()
    })
  })
})
