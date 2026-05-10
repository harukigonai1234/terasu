import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { TerasuUI } from './ui-react'
import { createParamSet } from './param'
import { createTimeEvolution } from './time-evolution'

describe('TerasuUI React component', () => {
  afterEach(() => {
    cleanup()
  })

  describe('param sliders', () => {
    it('renders a slider for each param', () => {
      const params = createParamSet()
      params.add('gravity', { value: 9.81, range: [0, 25], unit: 'm/s²' })
      params.add('length', { value: 1, range: [0.1, 5], unit: 'm' })

      render(<TerasuUI params={params} />)
      expect(screen.getByTestId('param-gravity')).toBeDefined()
      expect(screen.getByTestId('param-length')).toBeDefined()
    })

    it('displays param label', () => {
      const params = createParamSet()
      params.add('g', { value: 9.81, range: [0, 25], label: 'Gravity' })

      render(<TerasuUI params={params} />)
      expect(screen.getByText('Gravity')).toBeDefined()
    })

    it('displays current value', () => {
      const params = createParamSet()
      params.add('g', { value: 9.81, range: [0, 25] })

      render(<TerasuUI params={params} />)
      expect(screen.getByText('9.81')).toBeDefined()
    })

    it('displays value with unit', () => {
      const params = createParamSet()
      params.add('g', { value: 9.81, range: [0, 25], unit: 'm/s²' })

      render(<TerasuUI params={params} />)
      expect(screen.getByText('9.81 m/s²')).toBeDefined()
    })

    it('updates display when param changes externally', () => {
      const params = createParamSet()
      params.add('x', { value: 5, range: [0, 10] })

      render(<TerasuUI params={params} />)
      expect(screen.getByText('5.00')).toBeDefined()

      act(() => { params.get('x')!.set(8) })
      expect(screen.getByText('8.00')).toBeDefined()
    })
  })

  describe('playback controls', () => {
    it('renders playback controls when time is provided', () => {
      const time = createTimeEvolution()
      render(<TerasuUI time={time} />)
      expect(screen.getByTestId('play-btn')).toBeDefined()
      expect(screen.getByTestId('reset-btn')).toBeDefined()
      expect(screen.getByTestId('time-display')).toBeDefined()
    })

    it('does not render playback controls when time is not provided', () => {
      render(<TerasuUI />)
      expect(screen.queryByTestId('play-btn')).toBeNull()
    })

    it('displays initial time as 0.00', () => {
      const time = createTimeEvolution()
      render(<TerasuUI time={time} />)
      expect(screen.getByTestId('time-display').textContent).toContain('t = 0.00')
    })

    it('play button starts time evolution', () => {
      const time = createTimeEvolution()
      render(<TerasuUI time={time} />)
      const playBtn = screen.getByTestId('play-btn')
      fireEvent.click(playBtn)
      expect(time.running).toBe(true)
    })

    it('clicking play again pauses', () => {
      const time = createTimeEvolution()
      render(<TerasuUI time={time} />)
      const playBtn = screen.getByTestId('play-btn')
      fireEvent.click(playBtn) // play
      fireEvent.click(playBtn) // pause
      expect(time.running).toBe(false)
    })

    it('reset sets time to 0 and stops', () => {
      const time = createTimeEvolution({ dt: 0.1 })
      time.play()
      time.stepN(10)
      expect(time.t).toBeGreaterThan(0)

      render(<TerasuUI time={time} />)
      const resetBtn = screen.getByTestId('reset-btn')
      fireEvent.click(resetBtn)
      expect(time.t).toBe(0)
      expect(time.running).toBe(false)
    })
  })

  describe('combined params and time', () => {
    it('renders both sliders and playback together', () => {
      const params = createParamSet()
      params.add('k', { value: 1, range: [0, 10] })
      const time = createTimeEvolution()

      render(<TerasuUI params={params} time={time} />)
      expect(screen.getByTestId('param-k')).toBeDefined()
      expect(screen.getByTestId('play-btn')).toBeDefined()
    })

    it('renders nothing when no params or time given', () => {
      const { container } = render(<TerasuUI />)
      // Should still render the container wrapper
      expect(container.querySelector('[data-testid="terasu-ui"]')).toBeDefined()
    })
  })
})
