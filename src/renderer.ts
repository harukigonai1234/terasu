import { Vec2, vec2, length, normalize } from './vec2'
import { ScalarField, VectorField, Domain } from './field'
import { Particle } from './particle'

// Desmos-inspired palette
const COLORS = {
  background: '#ffffff',
  grid: '#e0e0e0',
  gridMinor: '#f0f0f0',
  axes: '#6b6b6b',
  tickText: '#444444',
  curves: ['#c74440', '#2d70b3', '#388c46', '#6042a6', '#fa7e19', '#000000'],
}

export interface RendererConfig {
  canvas: HTMLCanvasElement | OffscreenCanvas
  domain: Domain
  background?: string
  interactive?: boolean
}

export interface Renderer {
  clear(): void
  drawGrid(): void
  drawScalarField(field: ScalarField, options?: ScalarRenderOptions): void
  drawVectorField(field: VectorField, options?: VectorRenderOptions): void
  drawTrajectory(points: number[][], options?: TrajectoryRenderOptions): void
  drawParticle(particle: Particle, options?: ParticleRenderOptions): void
  worldToScreen(p: Vec2): Vec2
  screenToWorld(p: Vec2): Vec2
  getDomain(): Domain
  setDomain(domain: Domain): void
  onTrace(callback: TraceCallback | null): void
  onDrag(callback: DragCallback | null): void
  destroy(): void
}

export type TraceCallback = (worldPos: Vec2) => void
export type DragCallback = (worldPos: Vec2, phase: 'start' | 'move' | 'end') => void

export interface ScalarRenderOptions {
  colormap?: (value: number, min: number, max: number) => string
  resolution?: number
  t?: number
  opacity?: number
}

export interface VectorRenderOptions {
  resolution?: number
  color?: string
  scale?: number
  t?: number
  mode?: 'arrows' | 'dots'
  opacity?: number
}

export interface TrajectoryRenderOptions {
  color?: string
  lineWidth?: number
  opacity?: number
}

export interface ParticleRenderOptions {
  radius?: number
  color?: string
  trailColor?: string
  trailWidth?: number
}

export function createRenderer(config: RendererConfig): Renderer {
  const { canvas, background = COLORS.background } = config
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  if (!ctx) throw new Error('Could not get 2d context')

  let domain = { ...config.domain }
  let traceCallback: TraceCallback | null = null
  let dragCallback: DragCallback | null = null
  let isPanning = false
  let isDragging = false
  let panStart: Vec2 | null = null
  let panDomainStart: Domain | null = null
  const interactive = config.interactive !== false

  function getWidth() { return canvas.width }
  function getHeight() { return canvas.height }
  function domainWidth() { return domain.xMax - domain.xMin }
  function domainHeight() { return domain.yMax - domain.yMin }

  function worldToScreen(p: Vec2): Vec2 {
    const sx = ((p.x - domain.xMin) / domainWidth()) * getWidth()
    const sy = (1 - (p.y - domain.yMin) / domainHeight()) * getHeight()
    return vec2(sx, sy)
  }

  function screenToWorld(p: Vec2): Vec2 {
    const wx = (p.x / getWidth()) * domainWidth() + domain.xMin
    const wy = (1 - p.y / getHeight()) * domainHeight() + domain.yMin
    return vec2(wx, wy)
  }

  // Compute nice grid spacing (powers of 10, 2, 5)
  function niceStep(range: number, targetLines: number): number {
    const rough = range / targetLines
    const pow = Math.pow(10, Math.floor(Math.log10(rough)))
    const normalized = rough / pow
    if (normalized < 1.5) return pow
    if (normalized < 3.5) return 2 * pow
    if (normalized < 7.5) return 5 * pow
    return 10 * pow
  }

  // Mouse/touch interaction
  function getMousePos(e: MouseEvent): Vec2 {
    const rect = (canvas as HTMLCanvasElement).getBoundingClientRect()
    return vec2(e.clientX - rect.left, e.clientY - rect.top)
  }

  function handleMouseDown(e: MouseEvent) {
    const pos = getMousePos(e)
    const worldPos = screenToWorld(pos)

    if (dragCallback && e.shiftKey) {
      isDragging = true
      dragCallback(worldPos, 'start')
      return
    }

    isPanning = true
    panStart = pos
    panDomainStart = { ...domain }
  }

  function handleMouseMove(e: MouseEvent) {
    const pos = getMousePos(e)
    const worldPos = screenToWorld(pos)

    if (isDragging && dragCallback) {
      dragCallback(worldPos, 'move')
      return
    }

    if (isPanning && panStart && panDomainStart) {
      const dx = (pos.x - panStart.x) / getWidth() * (panDomainStart.xMax - panDomainStart.xMin)
      const dy = (pos.y - panStart.y) / getHeight() * (panDomainStart.yMax - panDomainStart.yMin)
      domain = {
        xMin: panDomainStart.xMin - dx,
        xMax: panDomainStart.xMax - dx,
        yMin: panDomainStart.yMin + dy,
        yMax: panDomainStart.yMax + dy,
      }
      return
    }

    if (traceCallback) {
      traceCallback(worldPos)
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (isDragging && dragCallback) {
      const pos = getMousePos(e)
      dragCallback(screenToWorld(pos), 'end')
    }
    isPanning = false
    isDragging = false
    panStart = null
    panDomainStart = null
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const pos = getMousePos(e)
    const worldPos = screenToWorld(pos)

    const factor = e.deltaY > 0 ? 1.1 : 0.9

    // Zoom centered on cursor
    domain = {
      xMin: worldPos.x + (domain.xMin - worldPos.x) * factor,
      xMax: worldPos.x + (domain.xMax - worldPos.x) * factor,
      yMin: worldPos.y + (domain.yMin - worldPos.y) * factor,
      yMax: worldPos.y + (domain.yMax - worldPos.y) * factor,
    }
  }

  if (interactive && canvas instanceof HTMLCanvasElement) {
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.style.cursor = 'grab'
  }

  return {
    worldToScreen,
    screenToWorld,

    getDomain() { return { ...domain } },
    setDomain(d: Domain) { domain = { ...d } },

    onTrace(callback: TraceCallback | null) { traceCallback = callback },
    onDrag(callback: DragCallback | null) { dragCallback = callback },

    destroy() {
      if (canvas instanceof HTMLCanvasElement) {
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseup', handleMouseUp)
        canvas.removeEventListener('mouseleave', handleMouseUp)
        canvas.removeEventListener('wheel', handleWheel)
      }
    },

    clear() {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, getWidth(), getHeight())
    },

    drawGrid() {
      const w = getWidth()
      const h = getHeight()
      const stepX = niceStep(domainWidth(), 10)
      const stepY = niceStep(domainHeight(), 10)

      // Minor grid
      const minorStepX = stepX / 5
      const minorStepY = stepY / 5
      ctx.strokeStyle = COLORS.gridMinor
      ctx.lineWidth = 0.5
      ctx.beginPath()
      for (let x = Math.ceil(domain.xMin / minorStepX) * minorStepX; x <= domain.xMax; x += minorStepX) {
        const sx = worldToScreen(vec2(x, 0)).x
        ctx.moveTo(sx, 0)
        ctx.lineTo(sx, h)
      }
      for (let y = Math.ceil(domain.yMin / minorStepY) * minorStepY; y <= domain.yMax; y += minorStepY) {
        const sy = worldToScreen(vec2(0, y)).y
        ctx.moveTo(0, sy)
        ctx.lineTo(w, sy)
      }
      ctx.stroke()

      // Major grid
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 0.5
      ctx.beginPath()
      for (let x = Math.ceil(domain.xMin / stepX) * stepX; x <= domain.xMax; x += stepX) {
        const sx = worldToScreen(vec2(x, 0)).x
        ctx.moveTo(sx, 0)
        ctx.lineTo(sx, h)
      }
      for (let y = Math.ceil(domain.yMin / stepY) * stepY; y <= domain.yMax; y += stepY) {
        const sy = worldToScreen(vec2(0, y)).y
        ctx.moveTo(0, sy)
        ctx.lineTo(w, sy)
      }
      ctx.stroke()

      // Axes
      ctx.strokeStyle = COLORS.axes
      ctx.lineWidth = 1.5
      ctx.beginPath()
      const originScreen = worldToScreen(vec2(0, 0))
      // x-axis
      if (domain.yMin <= 0 && domain.yMax >= 0) {
        ctx.moveTo(0, originScreen.y)
        ctx.lineTo(w, originScreen.y)
      }
      // y-axis
      if (domain.xMin <= 0 && domain.xMax >= 0) {
        ctx.moveTo(originScreen.x, 0)
        ctx.lineTo(originScreen.x, h)
      }
      ctx.stroke()

      // Tick labels
      ctx.fillStyle = COLORS.tickText
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (let x = Math.ceil(domain.xMin / stepX) * stepX; x <= domain.xMax; x += stepX) {
        if (Math.abs(x) < stepX * 0.01) continue // skip 0
        const sx = worldToScreen(vec2(x, 0)).x
        const axisY = Math.min(Math.max(originScreen.y + 4, 4), h - 14)
        ctx.fillText(formatTick(x), sx, axisY)
      }
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (let y = Math.ceil(domain.yMin / stepY) * stepY; y <= domain.yMax; y += stepY) {
        if (Math.abs(y) < stepY * 0.01) continue
        const sy = worldToScreen(vec2(0, y)).y
        const axisX = Math.min(Math.max(originScreen.x - 4, 30), w - 4)
        ctx.fillText(formatTick(y), axisX, sy)
      }
    },

    drawScalarField(field: ScalarField, options: ScalarRenderOptions = {}) {
      const resolution = options.resolution ?? 50
      const colormap = options.colormap ?? defaultColormap
      const opacity = options.opacity ?? 0.4
      const sample = field.sample(domain, resolution, options.t)

      let min = Infinity
      let max = -Infinity
      for (const row of sample.values) {
        for (const v of row) {
          if (v < min) min = v
          if (v > max) max = v
        }
      }

      const cellW = getWidth() / resolution
      const cellH = getHeight() / resolution
      ctx.globalAlpha = opacity

      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const v = sample.values[i]![j]!
          ctx.fillStyle = colormap(v, min, max)
          ctx.fillRect(j * cellW, (resolution - 1 - i) * cellH, cellW + 1, cellH + 1)
        }
      }
      ctx.globalAlpha = 1.0
    },

    drawVectorField(field: VectorField, options: VectorRenderOptions = {}) {
      const resolution = options.resolution ?? 20
      const color = options.color ?? COLORS.curves[1]!
      const arrowScale = options.scale ?? 1.0
      const mode = options.mode ?? 'arrows'
      const opacity = options.opacity ?? 0.9
      const sample = field.sample(domain, resolution, options.t)

      let maxMag = 0
      for (const row of sample.values) {
        for (const v of row) {
          const mag = length(v)
          if (mag > maxMag) maxMag = mag
        }
      }
      if (maxMag === 0) return

      const cellW = getWidth() / resolution
      const cellH = getHeight() / resolution

      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.globalAlpha = opacity

      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const v = sample.values[i]![j]!
          const mag = length(v)
          if (mag < 1e-10) continue

          const wx = domain.xMin + (j + 0.5) * (domainWidth() / resolution)
          const wy = domain.yMin + (i + 0.5) * (domainHeight() / resolution)
          const screenPos = worldToScreen(vec2(wx, wy))

          if (mode === 'dots') {
            const radius = (mag / maxMag) * 3 * arrowScale
            ctx.beginPath()
            ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
            ctx.fill()
            continue
          }

          const normalizedMag = (mag / maxMag) * Math.min(cellW, cellH) * 0.4 * arrowScale
          const dir = normalize(v)
          const screenDir = vec2(dir.x, -dir.y)
          const tip = vec2(
            screenPos.x + screenDir.x * normalizedMag,
            screenPos.y + screenDir.y * normalizedMag
          )
          const tail = vec2(
            screenPos.x - screenDir.x * normalizedMag * 0.3,
            screenPos.y - screenDir.y * normalizedMag * 0.3
          )

          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(tail.x, tail.y)
          ctx.lineTo(tip.x, tip.y)
          ctx.stroke()

          const headLen = normalizedMag * 0.3
          const angle = Math.atan2(screenDir.y, screenDir.x)
          ctx.beginPath()
          ctx.moveTo(tip.x, tip.y)
          ctx.lineTo(
            tip.x - headLen * Math.cos(angle - 0.4),
            tip.y - headLen * Math.sin(angle - 0.4)
          )
          ctx.lineTo(
            tip.x - headLen * Math.cos(angle + 0.4),
            tip.y - headLen * Math.sin(angle + 0.4)
          )
          ctx.closePath()
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1.0
    },

    drawTrajectory(points: number[][], options: TrajectoryRenderOptions = {}) {
      if (points.length < 2) return
      const color = options.color ?? COLORS.curves[0]!
      const lineWidth = options.lineWidth ?? 2.5
      const opacity = options.opacity ?? 0.9

      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.globalAlpha = opacity
      ctx.beginPath()

      const first = worldToScreen(vec2(points[0]![0]!, points[0]![1]!))
      ctx.moveTo(first.x, first.y)

      for (let i = 1; i < points.length; i++) {
        const p = worldToScreen(vec2(points[i]![0]!, points[i]![1]!))
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1.0
    },

    drawParticle(particle: Particle, options: ParticleRenderOptions = {}) {
      const radius = options.radius ?? 5
      const color = options.color ?? COLORS.curves[0]!
      const trailColor = options.trailColor ?? color
      const trailWidth = options.trailWidth ?? 2.5

      // Trail
      if (particle.trail.length > 1) {
        ctx.strokeStyle = trailColor
        ctx.lineWidth = trailWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        const first = worldToScreen(particle.trail[0]!)
        ctx.moveTo(first.x, first.y)
        for (let i = 1; i < particle.trail.length; i++) {
          const p = worldToScreen(particle.trail[i]!)
          ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1.0
      }

      // Particle dot
      const screenPos = worldToScreen(particle.state.position)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
      ctx.fill()
    },
  }
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000 || (Math.abs(value) < 0.01 && value !== 0)) {
    return value.toExponential(0)
  }
  // Remove trailing zeros
  return parseFloat(value.toFixed(4)).toString()
}

function defaultColormap(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  // Blue-white-red diverging colormap
  if (t < 0.5) {
    const s = t * 2
    const r = Math.round(lerp(44, 255, s))
    const g = Math.round(lerp(68, 255, s))
    const b = Math.round(lerp(179, 255, s))
    return `rgb(${r},${g},${b})`
  } else {
    const s = (t - 0.5) * 2
    const r = Math.round(lerp(255, 199, s))
    const g = Math.round(lerp(255, 68, s))
    const b = Math.round(lerp(255, 64, s))
    return `rgb(${r},${g},${b})`
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
