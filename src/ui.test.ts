import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUI } from './ui'
import { createParamSet } from './param'
import { createTimeEvolution } from './time-evolution'

// Minimal DOM mock
function mockDOM() {
  const elements: any[] = []
  const head = { appendChild: vi.fn() }

  const createElement = (tag: string) => {
    const el: any = {
      tag,
      className: '',
      textContent: '',
      type: '',
      min: '',
      max: '',
      step: '',
      value: '',
      children: [] as any[],
      classList: { add: vi.fn() },
      style: { textContent: '' },
      listeners: {} as Record<string, Function[]>,
      appendChild(child: any) { el.children.push(child); return child },
      remove: vi.fn(),
      querySelector: (sel: string) => {
        return findInTree(el, sel)
      },
      addEventListener(event: string, fn: Function) {
        if (!el.listeners[event]) el.listeners[event] = []
        el.listeners[event].push(fn)
      },
    }
    elements.push(el)
    return el
  }

  function findInTree(el: any, className: string): any {
    const cls = className.replace('.', '')
    if (el.className === cls) return el
    for (const child of el.children || []) {
      const found = findInTree(child, className)
      if (found) return found
    }
    return null
  }

  ;(globalThis as any).document = {
    createElement,
    head,
  }

  return { elements, createElement, head }
}

describe('createUI', () => {
  beforeEach(() => {
    mockDOM()
  })

  it('creates panel inside container', () => {
    const container: any = {
      classList: { add: vi.fn() },
      children: [] as any[],
      appendChild(child: any) { container.children.push(child) },
      querySelector: () => null,
    }

    createUI({ container })
    expect(container.classList.add).toHaveBeenCalledWith('terasu-ui')
    expect(container.children.length).toBe(1)
    expect(container.children[0].className).toBe('terasu-panel')
  })

  it('generates slider for each param', () => {
    const container: any = {
      classList: { add: vi.fn() },
      children: [] as any[],
      appendChild(child: any) { container.children.push(child) },
      querySelector: () => null,
    }

    const params = createParamSet()
    params.add('gravity', { value: 9.81, range: [0, 25], unit: 'm/s²' })
    params.add('length', { value: 1, range: [0.1, 5], unit: 'm' })

    createUI({ container, params })
    const panel = container.children[0]
    // 2 sliders
    const sliders = panel.children.filter((c: any) => c.className === 'terasu-slider')
    expect(sliders.length).toBe(2)
  })

  it('generates playback controls when time provided', () => {
    const container: any = {
      classList: { add: vi.fn() },
      children: [] as any[],
      appendChild(child: any) { container.children.push(child) },
      querySelector: () => null,
    }

    const time = createTimeEvolution()
    createUI({ container, time })
    const panel = container.children[0]
    const playback = panel.children.find((c: any) => c.className === 'terasu-playback')
    expect(playback).toBeDefined()
  })

  it('slider input updates param value', () => {
    const container: any = {
      classList: { add: vi.fn() },
      children: [] as any[],
      appendChild(child: any) { container.children.push(child) },
      querySelector: () => null,
    }

    const params = createParamSet()
    params.add('x', { value: 5, range: [0, 10] })

    createUI({ container, params })
    const panel = container.children[0]
    const slider = panel.children[0]
    // Find the input element (range slider)
    const input = slider.children.find((c: any) => c.tag === 'input')
    expect(input).toBeDefined()

    // Simulate user dragging slider
    input.value = '7'
    input.listeners['input'][0]()
    expect(params.get('x')!.value).toBe(7)
  })

  it('play button toggles time running state', () => {
    const container: any = {
      classList: { add: vi.fn() },
      children: [] as any[],
      appendChild(child: any) { container.children.push(child) },
      querySelector: () => null,
    }

    const time = createTimeEvolution()
    createUI({ container, time })
    const panel = container.children[0]
    const playback = panel.children.find((c: any) => c.className === 'terasu-playback')
    const playBtn = playback.children.find((c: any) => c.textContent === '▶')

    expect(time.running).toBe(false)
    playBtn.listeners['click'][0]()
    expect(time.running).toBe(true)
    expect(playBtn.textContent).toBe('⏸')
    playBtn.listeners['click'][0]()
    expect(time.running).toBe(false)
    expect(playBtn.textContent).toBe('▶')
  })

  it('reset button resets time and updates button', () => {
    const container: any = {
      classList: { add: vi.fn() },
      children: [] as any[],
      appendChild(child: any) { container.children.push(child) },
      querySelector: () => null,
    }

    const time = createTimeEvolution({ dt: 0.1 })
    createUI({ container, time })
    time.play()
    time.stepN(10)
    expect(time.t).toBeGreaterThan(0)

    const panel = container.children[0]
    const playback = panel.children.find((c: any) => c.className === 'terasu-playback')
    const resetBtn = playback.children.find((c: any) => c.textContent === '⟲')
    const playBtn = playback.children.find((c: any) => c.className === 'terasu-btn')

    resetBtn.listeners['click'][0]()
    expect(time.t).toBe(0)
    expect(time.running).toBe(false)
    expect(playBtn.textContent).toBe('▶')
  })

  it('destroy removes panel', () => {
    const container: any = {
      classList: { add: vi.fn() },
      children: [] as any[],
      appendChild(child: any) { container.children.push(child) },
      querySelector: () => null,
    }

    const ui = createUI({ container })
    const panel = container.children[0]
    ui.destroy()
    expect(panel.remove).toHaveBeenCalled()
  })
})
