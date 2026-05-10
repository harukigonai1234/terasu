import { Vec2, vec2, length, normalize } from './vec2'
import { ScalarField, VectorField, Domain } from './field'
import { Particle } from './particle'

export interface RendererConfig {
  canvas: HTMLCanvasElement | OffscreenCanvas
  domain: Domain
  background?: string
}

export interface Renderer {
  clear(): void
  drawScalarField(field: ScalarField, options?: ScalarRenderOptions): void
  drawVectorField(field: VectorField, options?: VectorRenderOptions): void
  drawTrajectory(points: number[][], options?: TrajectoryRenderOptions): void
  drawParticle(particle: Particle, options?: ParticleRenderOptions): void
  worldToScreen(p: Vec2): Vec2
  screenToWorld(p: Vec2): Vec2
}

export interface ScalarRenderOptions {
  colormap?: (value: number, min: number, max: number) => string
  resolution?: number
  t?: number
}

export interface VectorRenderOptions {
  resolution?: number
  color?: string
  scale?: number
  t?: number
  mode?: 'arrows' | 'dots'
}

export interface TrajectoryRenderOptions {
  color?: string
  lineWidth?: number
}

export interface ParticleRenderOptions {
  radius?: number
  color?: string
  trailColor?: string
  trailWidth?: number
}

export function createRenderer(config: RendererConfig): Renderer {
  const { canvas, domain, background = '#1a1a2e' } = config
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  if (!ctx) throw new Error('Could not get 2d context')

  const width = canvas.width
  const height = canvas.height
  const domainWidth = domain.xMax - domain.xMin
  const domainHeight = domain.yMax - domain.yMin

  function worldToScreen(p: Vec2): Vec2 {
    const sx = ((p.x - domain.xMin) / domainWidth) * width
    // y is flipped: world y-up, screen y-down
    const sy = (1 - (p.y - domain.yMin) / domainHeight) * height
    return vec2(sx, sy)
  }

  function screenToWorld(p: Vec2): Vec2 {
    const wx = (p.x / width) * domainWidth + domain.xMin
    const wy = (1 - p.y / height) * domainHeight + domain.yMin
    return vec2(wx, wy)
  }

  return {
    worldToScreen,
    screenToWorld,

    clear() {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
    },

    drawScalarField(field: ScalarField, options: ScalarRenderOptions = {}) {
      const resolution = options.resolution ?? 50
      const colormap = options.colormap ?? defaultColormap
      const sample = field.sample(domain, resolution, options.t)

      // Find min/max for normalization
      let min = Infinity
      let max = -Infinity
      for (const row of sample.values) {
        for (const v of row) {
          if (v < min) min = v
          if (v > max) max = v
        }
      }

      const cellW = width / resolution
      const cellH = height / resolution

      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const v = sample.values[i]![j]!
          ctx.fillStyle = colormap(v, min, max)
          // i is row (y), j is column (x). y flipped.
          ctx.fillRect(j * cellW, (resolution - 1 - i) * cellH, cellW + 1, cellH + 1)
        }
      }
    },

    drawVectorField(field: VectorField, options: VectorRenderOptions = {}) {
      const resolution = options.resolution ?? 20
      const color = options.color ?? '#4cc9f0'
      const arrowScale = options.scale ?? 1.0
      const mode = options.mode ?? 'arrows'
      const sample = field.sample(domain, resolution, options.t)

      // Find max magnitude for normalization
      let maxMag = 0
      for (const row of sample.values) {
        for (const v of row) {
          const mag = length(v)
          if (mag > maxMag) maxMag = mag
        }
      }
      if (maxMag === 0) return

      const cellW = width / resolution
      const cellH = height / resolution

      ctx.strokeStyle = color
      ctx.fillStyle = color

      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const v = sample.values[i]![j]!
          const mag = length(v)
          if (mag < 1e-10) continue

          // Center of each grid cell in world coords
          const wx = domain.xMin + (j + 0.5) * (domainWidth / resolution)
          const wy = domain.yMin + (i + 0.5) * (domainHeight / resolution)
          const screenPos = worldToScreen(vec2(wx, wy))

          if (mode === 'dots') {
            const radius = (mag / maxMag) * 3 * arrowScale
            ctx.beginPath()
            ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
            ctx.fill()
            continue
          }

          // Arrow length proportional to magnitude, capped at cell size
          const normalizedMag = (mag / maxMag) * Math.min(cellW, cellH) * 0.4 * arrowScale
          const dir = normalize(v)
          // Flip y for screen coords
          const screenDir = vec2(dir.x, -dir.y)
          const tip = vec2(
            screenPos.x + screenDir.x * normalizedMag,
            screenPos.y + screenDir.y * normalizedMag
          )
          const tail = vec2(
            screenPos.x - screenDir.x * normalizedMag * 0.3,
            screenPos.y - screenDir.y * normalizedMag * 0.3
          )

          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(tail.x, tail.y)
          ctx.lineTo(tip.x, tip.y)
          ctx.stroke()

          // Arrowhead
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
    },

    drawTrajectory(points: number[][], options: TrajectoryRenderOptions = {}) {
      if (points.length < 2) return
      const color = options.color ?? '#f72585'
      const lineWidth = options.lineWidth ?? 2

      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.lineJoin = 'round'
      ctx.beginPath()

      const first = worldToScreen(vec2(points[0]![0]!, points[0]![1]!))
      ctx.moveTo(first.x, first.y)

      for (let i = 1; i < points.length; i++) {
        const p = worldToScreen(vec2(points[i]![0]!, points[i]![1]!))
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    },

    drawParticle(particle: Particle, options: ParticleRenderOptions = {}) {
      const radius = options.radius ?? 6
      const color = options.color ?? '#f72585'
      const trailColor = options.trailColor ?? color
      const trailWidth = options.trailWidth ?? 1.5

      // Draw trail
      if (particle.trail.length > 1) {
        ctx.strokeStyle = trailColor
        ctx.lineWidth = trailWidth
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

      // Draw particle
      const screenPos = worldToScreen(particle.state.position)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
      ctx.fill()
    },
  }
}

// Viridis-inspired colormap: dark purple → blue → green → yellow
function defaultColormap(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  const r = Math.round(lerp(68, 253, t))
  const g = Math.round(lerp(1, 231, t))
  const b = Math.round(lerp(84, 37, t))
  return `rgb(${r},${g},${b})`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
