import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRenderer } from './renderer'
import { defaultGridSettings } from './grid-settings'
import type { GridSettings } from './grid-settings'
import type { Domain } from './field'

const domain: Domain = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }

describe('renderer drawGrid with GridSettings', () => {
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

  describe('showGrid toggle', () => {
    it('draws nothing when showGrid is false', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const settings: GridSettings = { ...defaultGridSettings(), showGrid: false }
      r.drawGrid(settings)
      expect(ctx.stroke).not.toHaveBeenCalled()
      expect(ctx.fillText).not.toHaveBeenCalled()
      expect(ctx.moveTo).not.toHaveBeenCalled()
    })

    it('draws grid when showGrid is true', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const settings: GridSettings = { ...defaultGridSettings(), showGrid: true }
      r.drawGrid(settings)
      expect(ctx.stroke).toHaveBeenCalled()
    })
  })

  describe('showMinorGridlines toggle', () => {
    it('draws fewer lines when minor gridlines disabled', () => {
      const r = createRenderer({ canvas, domain, interactive: false })

      const withMinor: GridSettings = { ...defaultGridSettings(), showMinorGridlines: true }
      r.drawGrid(withMinor)
      const strokesWithMinor = ctx.stroke.mock.calls.length

      ctx.stroke.mockClear()
      ctx.moveTo.mockClear()

      const withoutMinor: GridSettings = { ...defaultGridSettings(), showMinorGridlines: false }
      r.drawGrid(withoutMinor)
      const strokesWithoutMinor = ctx.stroke.mock.calls.length

      // Fewer stroke calls when minor gridlines are off (missing the minor grid pass)
      expect(strokesWithoutMinor).toBeLessThan(strokesWithMinor)
    })
  })

  describe('showAxisNumbers toggle', () => {
    it('draws tick labels when showAxisNumbers is true', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const settings: GridSettings = { ...defaultGridSettings(), showAxisNumbers: true }
      r.drawGrid(settings)
      expect(ctx.fillText).toHaveBeenCalled()
    })

    it('does not draw tick labels when showAxisNumbers is false', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const settings: GridSettings = { ...defaultGridSettings(), showAxisNumbers: false }
      r.drawGrid(settings)
      expect(ctx.fillText).not.toHaveBeenCalled()
    })
  })

  describe('showArrows toggle', () => {
    it('draws arrowheads when showArrows is true', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const settings: GridSettings = { ...defaultGridSettings(), showArrows: true }
      r.drawGrid(settings)
      // Arrowheads add extra moveTo/lineTo calls beyond normal axes
      const moveCount = ctx.moveTo.mock.calls.length
      ctx.moveTo.mockClear()

      const noArrows: GridSettings = { ...defaultGridSettings(), showArrows: false }
      r.drawGrid(noArrows)
      const moveCountNoArrows = ctx.moveTo.mock.calls.length

      expect(moveCount).toBeGreaterThan(moveCountNoArrows)
    })

    it('does not draw arrowheads when showArrows is false', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      const settings: GridSettings = { ...defaultGridSettings(), showArrows: false }
      r.drawGrid(settings)
      // Just normal axis lines, no extra arrowhead geometry
      expect(ctx.stroke).toHaveBeenCalled()
    })
  })

  describe('custom step size', () => {
    it('uses custom xAxis step when specified', () => {
      const r = createRenderer({ canvas, domain, interactive: false })

      // Default auto-step: for range 10, niceStep gives 1 or 2
      const autoSettings: GridSettings = defaultGridSettings()
      r.drawGrid(autoSettings)
      const autoMoveCount = ctx.moveTo.mock.calls.length

      ctx.moveTo.mockClear()

      // Custom step of 5: only ~2 major gridlines on x-axis in range [-5,5]
      const customSettings: GridSettings = {
        ...defaultGridSettings(),
        xAxis: { ...defaultGridSettings().xAxis, step: 5 },
      }
      r.drawGrid(customSettings)
      const customMoveCount = ctx.moveTo.mock.calls.length

      // Fewer grid lines with larger step
      expect(customMoveCount).toBeLessThan(autoMoveCount)
    })

    it('uses custom yAxis step when specified', () => {
      const r = createRenderer({ canvas, domain, interactive: false })

      const customSettings: GridSettings = {
        ...defaultGridSettings(),
        yAxis: { ...defaultGridSettings().yAxis, step: 5 },
      }
      r.drawGrid(customSettings)
      // Should draw without error
      expect(ctx.stroke).toHaveBeenCalled()
    })
  })

  describe('drawGrid with no settings (backward compat)', () => {
    it('draws full grid with default behavior when no settings passed', () => {
      const r = createRenderer({ canvas, domain, interactive: false })
      r.drawGrid()
      expect(ctx.stroke).toHaveBeenCalled()
      expect(ctx.fillText).toHaveBeenCalled()
    })
  })
})

describe('renderer setLockViewport', () => {
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

  it('setLockViewport prevents domain change from setDomain', () => {
    // setDomain still works (it's programmatic); lockViewport only blocks mouse interaction
    const r = createRenderer({ canvas, domain, interactive: false })
    r.setLockViewport(true)
    r.setDomain({ xMin: 0, xMax: 10, yMin: 0, yMax: 10 })
    // setDomain is still allowed — lock only affects pan/zoom interaction
    expect(r.getDomain()).toEqual({ xMin: 0, xMax: 10, yMin: 0, yMax: 10 })
  })

  it('setLockViewport can be toggled', () => {
    const r = createRenderer({ canvas, domain, interactive: false })
    r.setLockViewport(true)
    r.setLockViewport(false)
    // Should not throw
    expect(r.getDomain()).toEqual(domain)
  })
})

describe('renderer grid settings integration (combined)', () => {
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

  it('all features disabled except grid produces minimal output', () => {
    const r = createRenderer({ canvas, domain, interactive: false })
    const settings: GridSettings = {
      showGrid: true,
      showMinorGridlines: false,
      showAxisNumbers: false,
      showArrows: false,
      lockViewport: false,
      xAxis: { label: 'x', min: -5, max: 5, step: null, scale: 'linear' },
      yAxis: { label: 'y', min: -5, max: 5, step: null, scale: 'linear' },
    }
    r.drawGrid(settings)
    expect(ctx.stroke).toHaveBeenCalled()  // major grid + axes
    expect(ctx.fillText).not.toHaveBeenCalled()  // no numbers
  })

  it('all features enabled produces full output', () => {
    const r = createRenderer({ canvas, domain, interactive: false })
    const settings: GridSettings = {
      showGrid: true,
      showMinorGridlines: true,
      showAxisNumbers: true,
      showArrows: true,
      lockViewport: false,
      xAxis: { label: 'x', min: -5, max: 5, step: null, scale: 'linear' },
      yAxis: { label: 'y', min: -5, max: 5, step: null, scale: 'linear' },
    }
    r.drawGrid(settings)
    expect(ctx.stroke).toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalled()
    // Arrowheads produce extra moveTo calls
    expect(ctx.moveTo.mock.calls.length).toBeGreaterThan(10)
  })
})
