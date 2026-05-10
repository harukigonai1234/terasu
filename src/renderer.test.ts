import { describe, it, expect, vi } from 'vitest'
import { createRenderer } from './renderer'
import { scalarField, vectorField, Domain } from './field'
import { createParticle } from './particle'
import { vec2 } from './vec2'

const domain: Domain = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }

function mockCanvas(w = 500, h = 500) {
  const calls: string[] = []
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'miter',
    globalAlpha: 1,
    fillRect: vi.fn((..._args: number[]) => { calls.push('fillRect') }),
    beginPath: vi.fn(() => { calls.push('beginPath') }),
    moveTo: vi.fn((..._args: number[]) => { calls.push('moveTo') }),
    lineTo: vi.fn((..._args: number[]) => { calls.push('lineTo') }),
    stroke: vi.fn(() => { calls.push('stroke') }),
    fill: vi.fn(() => { calls.push('fill') }),
    arc: vi.fn((..._args: number[]) => { calls.push('arc') }),
    closePath: vi.fn(() => { calls.push('closePath') }),
  }

  const canvas = {
    width: w,
    height: h,
    getContext: (_type: string) => ctx,
  }

  return { canvas: canvas as unknown as HTMLCanvasElement, ctx, calls }
}

describe('renderer coordinate transforms', () => {
  it('worldToScreen maps domain corners to canvas corners', () => {
    const { canvas } = mockCanvas()
    const r = createRenderer({ canvas, domain })

    // bottom-left of domain → bottom-left of canvas (but y is flipped)
    const bl = r.worldToScreen(vec2(-5, -5))
    expect(bl.x).toBeCloseTo(0)
    expect(bl.y).toBeCloseTo(500) // bottom in screen coords

    // top-right of domain → top-right of canvas
    const tr = r.worldToScreen(vec2(5, 5))
    expect(tr.x).toBeCloseTo(500)
    expect(tr.y).toBeCloseTo(0) // top in screen coords

    // center
    const center = r.worldToScreen(vec2(0, 0))
    expect(center.x).toBeCloseTo(250)
    expect(center.y).toBeCloseTo(250)
  })

  it('screenToWorld is inverse of worldToScreen', () => {
    const { canvas } = mockCanvas()
    const r = createRenderer({ canvas, domain })

    const original = vec2(2.5, -1.3)
    const screen = r.worldToScreen(original)
    const back = r.screenToWorld(screen)
    expect(back.x).toBeCloseTo(original.x)
    expect(back.y).toBeCloseTo(original.y)
  })

  it('handles non-square domains', () => {
    const { canvas } = mockCanvas(800, 400)
    const wideDomain: Domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 5 }
    const r = createRenderer({ canvas, domain: wideDomain })

    const tr = r.worldToScreen(vec2(10, 5))
    expect(tr.x).toBeCloseTo(800)
    expect(tr.y).toBeCloseTo(0)
  })
})

describe('renderer drawing', () => {
  it('clear fills canvas with background', () => {
    const { canvas, ctx } = mockCanvas()
    const r = createRenderer({ canvas, domain, background: '#000' })
    r.clear()
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 500, 500)
  })

  it('drawScalarField renders cells', () => {
    const { canvas, ctx } = mockCanvas()
    const r = createRenderer({ canvas, domain })
    const field = scalarField((p) => p.x + p.y)
    r.drawScalarField(field, { resolution: 10 })
    // 10x10 grid = 100 cells
    expect(ctx.fillRect).toHaveBeenCalledTimes(100)
  })

  it('drawVectorField renders arrows', () => {
    const { canvas, ctx } = mockCanvas()
    const r = createRenderer({ canvas, domain })
    const field = vectorField((p) => vec2(-p.y, p.x))
    r.drawVectorField(field, { resolution: 5 })
    // 5x5 = 25 arrows, each has a line stroke + arrowhead fill
    expect(ctx.stroke.mock.calls.length).toBeGreaterThan(0)
    expect(ctx.fill.mock.calls.length).toBeGreaterThan(0)
  })

  it('drawTrajectory draws connected line', () => {
    const { canvas, ctx } = mockCanvas()
    const r = createRenderer({ canvas, domain })
    const points = [[0, 0], [1, 1], [2, 0]]
    r.drawTrajectory(points)
    expect(ctx.moveTo).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).toHaveBeenCalledTimes(2)
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('drawParticle renders circle', () => {
    const { canvas, ctx } = mockCanvas()
    const r = createRenderer({ canvas, domain })
    const p = createParticle({ position: vec2(1, 2) })
    r.drawParticle(p)
    expect(ctx.arc).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
  })

  it('drawParticle renders trail when present', () => {
    const { canvas, ctx } = mockCanvas()
    const r = createRenderer({ canvas, domain })
    const p = createParticle({ position: vec2(0, 0), velocity: vec2(1, 0) })
    p.trailEnabled = true
    for (let i = 0; i < 10; i++) p.step(0.1, i * 0.1)
    r.drawParticle(p)
    // trail: moveTo + 9 lineTo + stroke, then particle: arc + fill
    expect(ctx.moveTo).toHaveBeenCalled()
    expect(ctx.lineTo).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalled()
  })
})
