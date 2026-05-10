import { describe, it, expect, beforeEach } from 'vitest'
import { examples } from './examples'
import * as terasu from '../src/index'

describe('playground integration', () => {
  let canvas: HTMLCanvasElement
  let controls: HTMLDivElement

  beforeEach(() => {
    document.body.innerHTML = ''
    canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 500
    controls = document.createElement('div')
    document.body.appendChild(canvas)
    document.body.appendChild(controls)
  })

  it('dipole example executes without error', () => {
    const raf = () => 0
    expect(() => {
      const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.dipole)
      fn(terasu, canvas, controls, raf)
    }).not.toThrow()
  })

  it('oscillator example executes without error', () => {
    const raf = () => 0
    expect(() => {
      const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.oscillator)
      fn(terasu, canvas, controls, raf)
    }).not.toThrow()
  })

  it('pendulum example executes without error', () => {
    const raf = () => 0
    expect(() => {
      const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.pendulum)
      fn(terasu, canvas, controls, raf)
    }).not.toThrow()
  })

  it('wave example executes without error', () => {
    const raf = () => 0
    expect(() => {
      const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.wave)
      fn(terasu, canvas, controls, raf)
    }).not.toThrow()
  })

  it('lorenz example executes without error', () => {
    const raf = () => 0
    expect(() => {
      const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.lorenz)
      fn(terasu, canvas, controls, raf)
    }).not.toThrow()
  })

  it('dipole example creates UI controls', () => {
    const raf = () => 0
    const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.dipole)
    fn(terasu, canvas, controls, raf)
    const sliders = controls.querySelectorAll('.terasu-slider')
    expect(sliders.length).toBeGreaterThan(0)
  })

  it('oscillator example creates param sliders', () => {
    const raf = () => 0
    const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.oscillator)
    fn(terasu, canvas, controls, raf)
    const sliders = controls.querySelectorAll('.terasu-slider')
    expect(sliders.length).toBe(2) // gamma and omega
  })

  it('lorenz example creates 3 param sliders', () => {
    const raf = () => 0
    const fn = new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', examples.lorenz)
    fn(terasu, canvas, controls, raf)
    const sliders = controls.querySelectorAll('.terasu-slider')
    expect(sliders.length).toBe(3) // sigma, rho, beta
  })
})
