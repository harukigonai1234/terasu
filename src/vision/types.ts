export interface DiagramObject {
  type: 'block' | 'surface' | 'pulley' | 'spring' | 'rope' | 'charge' | 'particle' | 'circle' | 'arrow'
  label?: string
  properties: Record<string, any>
  position?: { x: number; y: number }
}

export interface DetectedForce {
  on: string
  direction: string
  label?: string
}

export interface DiagramParseResult {
  objects: DiagramObject[]
  labels: string[]
  forces: DetectedForce[]
  text: string[]
  coordinateSystem?: { type: string; angle?: number }
  confidence: number
}

export interface VisionModel {
  loaded: boolean
  load(): Promise<void>
  parse(image: ImageData | HTMLCanvasElement | Blob): Promise<DiagramParseResult>
  dispose(): void
}
