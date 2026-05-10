export interface GridSettings {
  showGrid: boolean
  showMinorGridlines: boolean
  showAxisNumbers: boolean
  showArrows: boolean
  lockViewport: boolean
  xAxis: AxisSettings
  yAxis: AxisSettings
}

export interface AxisSettings {
  label: string
  min: number
  max: number
  step: number | null  // null = auto
  scale: 'linear' | 'logarithmic'
}

export function defaultGridSettings(): GridSettings {
  return {
    showGrid: true,
    showMinorGridlines: true,
    showAxisNumbers: true,
    showArrows: false,
    lockViewport: false,
    xAxis: {
      label: 'x',
      min: -10,
      max: 10,
      step: null,
      scale: 'linear',
    },
    yAxis: {
      label: 'y',
      min: -10,
      max: 10,
      step: null,
      scale: 'linear',
    },
  }
}
