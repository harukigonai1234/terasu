import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { App } from './App'

describe('pause end-to-end (full App, no mocks on physics)', () => {
  let rafCallbacks: FrameRequestCallback[] = []
  let rafId = 0

  beforeEach(() => {
    rafCallbacks = []
    rafId = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return ++rafId
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCallbacks = []
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  function flushFrames(n: number) {
    for (let i = 0; i < n; i++) {
      const cbs = [...rafCallbacks]
      rafCallbacks = []
      for (const cb of cbs) {
        cb(performance.now())
      }
    }
  }

  function switchToCodeTab() {
    const codeTab = screen.getByRole('tab', { name: /code/i })
    fireEvent.click(codeTab)
  }

  it('renders the app without crashing', async () => {
    render(<App />)
    // Should find the Explore tab at minimum
    expect(screen.getByRole('tab', { name: /explore/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /code/i })).toBeDefined()
  })

  it('Code tab has a time slider with play/pause', async () => {
    render(<App />)
    act(() => switchToCodeTab())

    await act(async () => {
      await new Promise(r => setTimeout(r, 400))
    })

    const slider = screen.getByTestId('time-slider') as HTMLInputElement
    expect(slider).toBeDefined()
    expect(slider.type).toBe('range')

    const pauseBtn = screen.getByRole('button', { name: /pause/i })
    expect(pauseBtn).toBeDefined()
  })

  it('t value advances after frames flush', async () => {
    render(<App />)
    act(() => switchToCodeTab())

    await act(async () => {
      await new Promise(r => setTimeout(r, 400))
    })

    act(() => flushFrames(30))

    const slider = screen.getByTestId('time-slider') as HTMLInputElement
    const val = parseFloat(slider.value)
    expect(val).toBeGreaterThan(0)
  })

  it('clicking pause stops t from advancing', async () => {
    render(<App />)
    act(() => switchToCodeTab())

    await act(async () => {
      await new Promise(r => setTimeout(r, 400))
    })

    act(() => flushFrames(30))

    const slider = screen.getByTestId('time-slider') as HTMLInputElement
    const tBefore = parseFloat(slider.value)
    expect(tBefore).toBeGreaterThan(0)

    const pauseBtn = screen.getByRole('button', { name: /pause/i })
    act(() => fireEvent.click(pauseBtn))

    act(() => flushFrames(30))

    const tAfter = parseFloat(slider.value)
    expect(tAfter).toBe(tBefore)
  })

  it('scrubbing slider back to 0 resets t', async () => {
    render(<App />)
    act(() => switchToCodeTab())

    await act(async () => {
      await new Promise(r => setTimeout(r, 400))
    })

    // Advance time
    act(() => flushFrames(30))

    const slider = screen.getByTestId('time-slider') as HTMLInputElement
    expect(parseFloat(slider.value)).toBeGreaterThan(0)

    // Pause first so it doesn't keep advancing
    const pauseBtn = screen.getByRole('button', { name: /pause/i })
    act(() => fireEvent.click(pauseBtn))

    // Scrub back to 0
    act(() => {
      fireEvent.change(slider, { target: { value: '0' } })
    })

    expect(parseFloat(slider.value)).toBe(0)

    // Flush more frames — should stay at 0 since paused
    act(() => flushFrames(10))
    expect(parseFloat(slider.value)).toBe(0)
  })

  it('scrubbing to arbitrary value updates t', async () => {
    render(<App />)
    act(() => switchToCodeTab())

    await act(async () => {
      await new Promise(r => setTimeout(r, 400))
    })

    const pauseBtn = screen.getByRole('button', { name: /pause/i })
    act(() => fireEvent.click(pauseBtn))

    const slider = screen.getByTestId('time-slider') as HTMLInputElement
    act(() => {
      fireEvent.change(slider, { target: { value: '7.5' } })
    })

    expect(parseFloat(slider.value)).toBeCloseTo(7.5)
  })

  it('clicking play after pause resumes advancement', async () => {
    render(<App />)
    act(() => switchToCodeTab())

    await act(async () => {
      await new Promise(r => setTimeout(r, 400))
    })

    act(() => flushFrames(10))

    const pauseBtn = screen.getByRole('button', { name: /pause/i })
    act(() => fireEvent.click(pauseBtn))

    act(() => flushFrames(10))
    const slider = screen.getByTestId('time-slider') as HTMLInputElement
    const tPaused = parseFloat(slider.value)

    const playBtn = screen.getByRole('button', { name: /play/i })
    act(() => fireEvent.click(playBtn))

    act(() => flushFrames(10))
    const tResumed = parseFloat(slider.value)
    expect(tResumed).toBeGreaterThan(tPaused)
  })
})
