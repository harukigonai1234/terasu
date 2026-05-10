import { Param, ParamSet } from './param'
import { TimeEvolution } from './time-evolution'

export interface UIConfig {
  container: HTMLElement
  params?: ParamSet
  time?: TimeEvolution
}

export interface UI {
  container: HTMLElement
  destroy(): void
}

export function createUI(config: UIConfig): UI {
  const { container, params, time } = config
  container.classList.add('terasu-ui')

  const panel = document.createElement('div')
  panel.className = 'terasu-panel'
  container.appendChild(panel)

  // Generate sliders from param set
  if (params) {
    for (const [name, param] of params.params) {
      panel.appendChild(createSlider(name, param))
    }
  }

  // Playback controls
  if (time) {
    panel.appendChild(createPlaybackControls(time))
  }

  injectStyles()

  return {
    container,
    destroy() {
      panel.remove()
    },
  }
}

function createSlider(_name: string, param: Param): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'terasu-slider'

  const label = document.createElement('label')
  const valueDisplay = document.createElement('span')
  valueDisplay.className = 'terasu-slider-value'
  valueDisplay.textContent = formatValue(param.value, param.unit)

  label.textContent = `${param.label} `
  label.appendChild(valueDisplay)

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(param.range[0])
  input.max = String(param.range[1])
  input.step = String(param.step)
  input.value = String(param.value)

  input.addEventListener('input', () => {
    param.set(parseFloat(input.value))
  })

  param.subscribe((value) => {
    input.value = String(value)
    valueDisplay.textContent = formatValue(value, param.unit)
  })

  wrapper.appendChild(label)
  wrapper.appendChild(input)
  return wrapper
}

function createPlaybackControls(time: TimeEvolution): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'terasu-playback'

  const playBtn = document.createElement('button')
  playBtn.className = 'terasu-btn'
  playBtn.textContent = '▶'
  playBtn.addEventListener('click', () => {
    if (time.running) {
      time.pause()
      playBtn.textContent = '▶'
    } else {
      time.play()
      playBtn.textContent = '⏸'
    }
  })

  const resetBtn = document.createElement('button')
  resetBtn.className = 'terasu-btn'
  resetBtn.textContent = '⟲'
  resetBtn.addEventListener('click', () => {
    time.reset()
    playBtn.textContent = '▶'
  })

  const timeDisplay = document.createElement('span')
  timeDisplay.className = 'terasu-time'
  timeDisplay.textContent = 't = 0.00'

  // Update time display on each animation frame via MutationObserver pattern
  // The render loop will call updateTimeDisplay
  ;(wrapper as any).__updateTime = () => {
    timeDisplay.textContent = `t = ${time.t.toFixed(2)}`
  }

  wrapper.appendChild(playBtn)
  wrapper.appendChild(resetBtn)
  wrapper.appendChild(timeDisplay)
  return wrapper
}

function formatValue(value: number, unit: string): string {
  const formatted = Math.abs(value) < 0.01 ? value.toExponential(2) : value.toFixed(2)
  return unit ? `${formatted} ${unit}` : formatted
}

let stylesInjected = false
function injectStyles() {
  if (stylesInjected) return
  stylesInjected = true

  const style = document.createElement('style')
  style.textContent = `
    .terasu-ui {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
    }
    .terasu-panel {
      background: #16162a;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .terasu-slider {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .terasu-slider label {
      color: #a0a0c0;
      display: flex;
      justify-content: space-between;
    }
    .terasu-slider-value {
      color: #4cc9f0;
      font-variant-numeric: tabular-nums;
    }
    .terasu-slider input[type="range"] {
      width: 100%;
      accent-color: #4cc9f0;
    }
    .terasu-playback {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid #2a2a4a;
    }
    .terasu-btn {
      background: #2a2a4a;
      border: none;
      color: #e0e0f0;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .terasu-btn:hover {
      background: #3a3a5a;
    }
    .terasu-time {
      color: #a0a0c0;
      margin-left: auto;
      font-variant-numeric: tabular-nums;
    }
  `
  document.head.appendChild(style)
}

// Called by render loop to keep time display in sync
export function updateUI(container: HTMLElement) {
  const playback = container.querySelector('.terasu-playback')
  if (playback && (playback as any).__updateTime) {
    ;(playback as any).__updateTime()
  }
}
