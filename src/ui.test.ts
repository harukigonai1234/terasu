import { describe, it, expect, beforeEach } from 'vitest'
import { createUI } from './ui'
import { createParamSet } from './param'
import { createTimeEvolution } from './time-evolution'

describe('createUI', () => {
  let container: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('adds terasu-ui class to container', () => {
    createUI({ container })
    expect(container.classList.contains('terasu-ui')).toBe(true)
  })

  it('renders a panel element inside container', () => {
    createUI({ container })
    const panel = container.querySelector('.terasu-panel')
    expect(panel).not.toBeNull()
  })

  it('renders a slider for each param in the ParamSet', () => {
    const params = createParamSet()
    params.add('gravity', { value: 9.81, range: [0, 25], unit: 'm/s²' })
    params.add('length', { value: 1, range: [0.1, 5], unit: 'm' })

    createUI({ container, params })
    const sliders = container.querySelectorAll('.terasu-slider')
    expect(sliders.length).toBe(2)
  })

  it('slider has a label with the param name', () => {
    const params = createParamSet()
    params.add('gravity', { value: 9.81, range: [0, 25], label: 'Gravity', unit: 'm/s²' })

    createUI({ container, params })
    const label = container.querySelector('.terasu-slider label')
    expect(label).not.toBeNull()
    expect(label!.textContent).toContain('Gravity')
  })

  it('slider displays current value with unit', () => {
    const params = createParamSet()
    params.add('g', { value: 9.81, range: [0, 25], unit: 'm/s²' })

    createUI({ container, params })
    const valueDisplay = container.querySelector('.terasu-slider-value')
    expect(valueDisplay).not.toBeNull()
    expect(valueDisplay!.textContent).toContain('9.81')
    expect(valueDisplay!.textContent).toContain('m/s²')
  })

  it('slider input has correct min, max, step, value attributes', () => {
    const params = createParamSet()
    params.add('x', { value: 5, range: [0, 10], step: 0.5 })

    createUI({ container, params })
    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.min).toBe('0')
    expect(input.max).toBe('10')
    expect(input.step).toBe('0.5')
    expect(input.value).toBe('5')
  })

  it('dragging slider updates param value', () => {
    const params = createParamSet()
    params.add('x', { value: 5, range: [0, 10] })

    createUI({ container, params })
    const input = container.querySelector('input[type="range"]') as HTMLInputElement

    input.value = '7'
    input.dispatchEvent(new Event('input'))
    expect(params.get('x')!.value).toBe(7)
  })

  it('changing param programmatically updates slider and display', () => {
    const params = createParamSet()
    params.add('x', { value: 5, range: [0, 10] })

    createUI({ container, params })
    params.get('x')!.set(3)

    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input.value).toBe('3')
    const valueDisplay = container.querySelector('.terasu-slider-value')
    expect(valueDisplay!.textContent).toContain('3.00')
  })

  it('renders playback controls when time is provided', () => {
    const time = createTimeEvolution()
    createUI({ container, time })
    const playback = container.querySelector('.terasu-playback')
    expect(playback).not.toBeNull()
  })

  it('does not render playback controls when time is not provided', () => {
    createUI({ container })
    const playback = container.querySelector('.terasu-playback')
    expect(playback).toBeNull()
  })

  it('play button starts with ▶ text', () => {
    const time = createTimeEvolution()
    createUI({ container, time })
    const buttons = container.querySelectorAll('.terasu-btn')
    const playBtn = buttons[0] as HTMLButtonElement
    expect(playBtn.textContent).toBe('▶')
  })

  it('clicking play toggles to pause icon and starts time', () => {
    const time = createTimeEvolution()
    createUI({ container, time })
    const playBtn = container.querySelectorAll('.terasu-btn')[0] as HTMLButtonElement

    expect(time.running).toBe(false)
    playBtn.click()
    expect(time.running).toBe(true)
    expect(playBtn.textContent).toBe('⏸')
  })

  it('clicking pause toggles back to play icon and stops time', () => {
    const time = createTimeEvolution()
    createUI({ container, time })
    const playBtn = container.querySelectorAll('.terasu-btn')[0] as HTMLButtonElement

    playBtn.click() // play
    playBtn.click() // pause
    expect(time.running).toBe(false)
    expect(playBtn.textContent).toBe('▶')
  })

  it('reset button resets time to 0', () => {
    const time = createTimeEvolution({ dt: 0.1 })
    createUI({ container, time })
    time.play()
    time.stepN(10)
    expect(time.t).toBeGreaterThan(0)

    const resetBtn = container.querySelectorAll('.terasu-btn')[1] as HTMLButtonElement
    resetBtn.click()
    expect(time.t).toBe(0)
    expect(time.running).toBe(false)
  })

  it('reset button resets play button text to ▶', () => {
    const time = createTimeEvolution()
    createUI({ container, time })
    const playBtn = container.querySelectorAll('.terasu-btn')[0] as HTMLButtonElement
    const resetBtn = container.querySelectorAll('.terasu-btn')[1] as HTMLButtonElement

    playBtn.click() // play
    expect(playBtn.textContent).toBe('⏸')
    resetBtn.click()
    expect(playBtn.textContent).toBe('▶')
  })

  it('displays time value', () => {
    const time = createTimeEvolution()
    createUI({ container, time })
    const timeDisplay = container.querySelector('.terasu-time')
    expect(timeDisplay).not.toBeNull()
    expect(timeDisplay!.textContent).toBe('t = 0.00')
  })

  it('injects styles into document head', () => {
    createUI({ container })
    const styles = document.querySelectorAll('style')
    const terasuStyle = Array.from(styles).find(s => s.textContent!.includes('.terasu-panel'))
    expect(terasuStyle).not.toBeNull()
  })

  it('destroy removes the panel from DOM', () => {
    const ui = createUI({ container })
    expect(container.querySelector('.terasu-panel')).not.toBeNull()
    ui.destroy()
    expect(container.querySelector('.terasu-panel')).toBeNull()
  })

  it('multiple params render in order', () => {
    const params = createParamSet()
    params.add('alpha', { value: 1, range: [0, 10] })
    params.add('beta', { value: 2, range: [0, 10] })
    params.add('gamma', { value: 3, range: [0, 10] })

    createUI({ container, params })
    const sliders = container.querySelectorAll('.terasu-slider')
    expect(sliders.length).toBe(3)
    expect(sliders[0]!.querySelector('label')!.textContent).toContain('alpha')
    expect(sliders[1]!.querySelector('label')!.textContent).toContain('beta')
    expect(sliders[2]!.querySelector('label')!.textContent).toContain('gamma')
  })
})
