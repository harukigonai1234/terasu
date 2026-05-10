import type { VisionModel, DiagramParseResult } from './types'

/**
 * Local vision model for parsing physics diagrams.
 * Runs in-browser via WebGPU/WASM using ONNX Runtime or Transformers.js.
 *
 * Architecture:
 * - Fine-tuned Florence-2 or SmolVLM (~250M params, ~500MB)
 * - Input: image of a physics problem/diagram
 * - Output: structured JSON with objects, labels, forces, text
 *
 * The model handles ONLY perception. All physics reasoning is deterministic.
 */

export interface ModelConfig {
  modelPath: string
  backend?: 'webgpu' | 'wasm' | 'cpu'
  onProgress?: (progress: number) => void
}

export function createVisionModel(config: ModelConfig): VisionModel {
  let loaded = false

  return {
    get loaded() { return loaded },

    async load() {
      // TODO: Load ONNX model via Transformers.js or ONNX Runtime Web
      // const { pipeline } = await import('@huggingface/transformers')
      // model = await pipeline('image-to-text', config.modelPath, { device: config.backend })
      loaded = true
      config.onProgress?.(1.0)
    },

    async parse(image: ImageData | HTMLCanvasElement | Blob): Promise<DiagramParseResult> {
      if (!loaded) throw new Error('Model not loaded. Call load() first.')

      // TODO: Run inference
      // const result = await model(image, { prompt: 'Parse this physics diagram into structured JSON' })
      // return parseModelOutput(result)

      // Placeholder: return empty result
      return {
        objects: [],
        labels: [],
        forces: [],
        text: [],
        confidence: 0,
      }
    },

    dispose() {
      loaded = false
      // TODO: Release model memory
    },
  }
}

/**
 * Generates synthetic training data for the vision model.
 * Renders physics diagrams programmatically and pairs them with structured labels.
 */
export interface TrainingExample {
  image: HTMLCanvasElement
  label: DiagramParseResult
  problemType: string
}

export interface DiagramRendererConfig {
  width: number
  height: number
  noise?: boolean
  handwritingFont?: boolean
}

export function generateTrainingData(
  scenarioType: string,
  params: Record<string, number>,
  config: DiagramRendererConfig
): TrainingExample {
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : null

  if (!canvas) {
    throw new Error('Canvas not available (server-side). Use a canvas polyfill.')
  }

  canvas.width = config.width
  canvas.height = config.height
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, config.width, config.height)

  const label: DiagramParseResult = {
    objects: [],
    labels: [],
    forces: [],
    text: [],
    confidence: 1.0,
  }

  switch (scenarioType) {
    case 'inclined-plane':
      renderInclinedPlane(ctx, params, config, label)
      break
    case 'projectile':
      renderProjectile(ctx, params, config, label)
      break
    case 'atwood-machine':
      renderAtwoodMachine(ctx, params, config, label)
      break
    case 'spring-mass':
      renderSpringMass(ctx, params, config, label)
      break
    default:
      break
  }

  return { image: canvas, label, problemType: scenarioType }
}

function renderInclinedPlane(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  config: DiagramRendererConfig,
  label: DiagramParseResult
) {
  const { width, height } = config
  const angle = params.angle ?? 30
  const mass = params.mass ?? 5

  const rad = angle * Math.PI / 180
  const baseX = width * 0.1
  const baseY = height * 0.8
  const rampLength = width * 0.6
  const topX = baseX + rampLength * Math.cos(rad)
  const topY = baseY - rampLength * Math.sin(rad)

  // Draw ramp
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(baseX, baseY)
  ctx.lineTo(topX, topY)
  ctx.lineTo(topX, baseY)
  ctx.closePath()
  ctx.stroke()

  // Draw block (midway up the ramp)
  const blockSize = 30
  const midX = (baseX + topX) / 2
  const midY = (baseY + topY) / 2
  ctx.save()
  ctx.translate(midX, midY)
  ctx.rotate(-rad)
  ctx.fillStyle = '#4a90d9'
  ctx.fillRect(-blockSize / 2, -blockSize, blockSize, blockSize)
  ctx.restore()

  // Label the angle
  ctx.fillStyle = '#333333'
  ctx.font = '14px sans-serif'
  ctx.fillText(`${angle}°`, baseX + 40, baseY - 10)

  // Label the mass
  ctx.fillText(`${mass} kg`, midX - 10, midY - blockSize - 5)

  // Populate structured label
  label.objects.push(
    { type: 'block', label: 'm', properties: { mass }, position: { x: midX, y: midY } },
    { type: 'surface', properties: { angle, subtype: 'incline' } }
  )
  label.labels.push(`${mass} kg`, `${angle}°`)
}

function renderProjectile(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  config: DiagramRendererConfig,
  label: DiagramParseResult
) {
  const { width, height } = config
  const angle = params.angle ?? 45
  const speed = params.speed ?? 20

  // Ground line
  const groundY = height * 0.8
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(width, groundY)
  ctx.stroke()

  // Launch point
  const launchX = width * 0.15
  ctx.fillStyle = '#333333'
  ctx.beginPath()
  ctx.arc(launchX, groundY, 4, 0, Math.PI * 2)
  ctx.fill()

  // Velocity arrow
  const rad = angle * Math.PI / 180
  const arrowLen = 60
  ctx.strokeStyle = '#c74440'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(launchX, groundY)
  ctx.lineTo(launchX + arrowLen * Math.cos(rad), groundY - arrowLen * Math.sin(rad))
  ctx.stroke()

  // Angle arc
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(launchX, groundY, 25, -rad, 0)
  ctx.stroke()

  // Labels
  ctx.fillStyle = '#333333'
  ctx.font = '14px sans-serif'
  ctx.fillText(`${angle}°`, launchX + 30, groundY - 5)
  ctx.fillText(`v₀ = ${speed} m/s`, launchX + arrowLen * 0.5, groundY - arrowLen * 0.5 - 10)

  label.objects.push({ type: 'particle', label: 'projectile', properties: { speed, angle } })
  label.labels.push(`${angle}°`, `${speed} m/s`)
}

function renderAtwoodMachine(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  config: DiagramRendererConfig,
  label: DiagramParseResult
) {
  const { width, height } = config
  const m1 = params.m1 ?? 4
  const m2 = params.m2 ?? 6

  // Pulley
  const pulleyX = width * 0.5
  const pulleyY = height * 0.15
  const pulleyR = 20
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(pulleyX, pulleyY, pulleyR, 0, Math.PI * 2)
  ctx.stroke()

  // Strings and masses
  const leftX = pulleyX - pulleyR
  const rightX = pulleyX + pulleyR
  const leftMassY = height * 0.5
  const rightMassY = height * 0.6

  // Left string + mass
  ctx.beginPath()
  ctx.moveTo(leftX, pulleyY)
  ctx.lineTo(leftX, leftMassY)
  ctx.stroke()
  ctx.fillStyle = '#4a90d9'
  ctx.fillRect(leftX - 15, leftMassY, 30, 30)

  // Right string + mass
  ctx.beginPath()
  ctx.moveTo(rightX, pulleyY)
  ctx.lineTo(rightX, rightMassY)
  ctx.stroke()
  ctx.fillStyle = '#d94a4a'
  ctx.fillRect(rightX - 15, rightMassY, 30, 30)

  // Labels
  ctx.fillStyle = '#333333'
  ctx.font = '14px sans-serif'
  ctx.fillText(`${m1} kg`, leftX - 20, leftMassY + 45)
  ctx.fillText(`${m2} kg`, rightX - 20, rightMassY + 45)

  label.objects.push(
    { type: 'block', label: 'm1', properties: { mass: m1 }, position: { x: leftX, y: leftMassY } },
    { type: 'block', label: 'm2', properties: { mass: m2 }, position: { x: rightX, y: rightMassY } },
    { type: 'pulley', properties: {}, position: { x: pulleyX, y: pulleyY } }
  )
  label.labels.push(`${m1} kg`, `${m2} kg`)
}

function renderSpringMass(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  config: DiagramRendererConfig,
  label: DiagramParseResult
) {
  const { width, height } = config
  const mass = params.mass ?? 2
  const k = params.k ?? 100

  const wallX = width * 0.1
  const groundY = height * 0.6
  const blockX = width * 0.5
  const blockSize = 30

  // Wall
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(wallX, groundY - 50)
  ctx.lineTo(wallX, groundY)
  ctx.stroke()
  // Hatching
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(wallX, groundY - 50 + i * 10)
    ctx.lineTo(wallX - 8, groundY - 42 + i * 10)
    ctx.stroke()
  }

  // Ground
  ctx.beginPath()
  ctx.moveTo(wallX, groundY)
  ctx.lineTo(width * 0.8, groundY)
  ctx.stroke()

  // Spring (zigzag)
  const springStartX = wallX
  const springEndX = blockX - blockSize / 2
  const numZigs = 8
  const zigWidth = (springEndX - springStartX) / numZigs
  ctx.beginPath()
  ctx.moveTo(springStartX, groundY - blockSize / 2)
  for (let i = 0; i < numZigs; i++) {
    const x = springStartX + (i + 0.5) * zigWidth
    const y = groundY - blockSize / 2 + (i % 2 === 0 ? -10 : 10)
    ctx.lineTo(x, y)
  }
  ctx.lineTo(springEndX, groundY - blockSize / 2)
  ctx.stroke()

  // Block
  ctx.fillStyle = '#4a90d9'
  ctx.fillRect(blockX - blockSize / 2, groundY - blockSize, blockSize, blockSize)

  // Labels
  ctx.fillStyle = '#333333'
  ctx.font = '14px sans-serif'
  ctx.fillText(`${mass} kg`, blockX - 15, groundY - blockSize - 10)
  ctx.fillText(`k = ${k} N/m`, (wallX + blockX) / 2 - 20, groundY - blockSize / 2 - 20)

  label.objects.push(
    { type: 'block', label: 'm', properties: { mass }, position: { x: blockX, y: groundY - blockSize / 2 } },
    { type: 'spring', label: 'k', properties: { k }, position: { x: (wallX + blockX) / 2, y: groundY - blockSize / 2 } }
  )
  label.labels.push(`${mass} kg`, `k = ${k} N/m`)
}
