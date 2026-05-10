import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GridSettingsPanel, GridSettingsButton } from './grid-settings-panel'
import { defaultGridSettings } from './grid-settings'
import type { GridSettings } from './grid-settings'

describe('GridSettingsButton', () => {
  afterEach(cleanup)

  it('renders a settings button', () => {
    const onClick = vi.fn()
    render(<GridSettingsButton onClick={onClick} />)
    const btn = screen.getByTestId('grid-settings-btn')
    expect(btn).toBeDefined()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GridSettingsButton onClick={onClick} />)
    fireEvent.click(screen.getByTestId('grid-settings-btn'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('GridSettingsPanel', () => {
  afterEach(cleanup)

  it('renders all toggle controls', () => {
    const onChange = vi.fn()
    render(<GridSettingsPanel settings={defaultGridSettings()} onChange={onChange} />)
    expect(screen.getByTestId('toggle-grid')).toBeDefined()
    expect(screen.getByTestId('toggle-arrows')).toBeDefined()
    expect(screen.getByTestId('toggle-axis-numbers')).toBeDefined()
    expect(screen.getByTestId('toggle-minor-gridlines')).toBeDefined()
    expect(screen.getByTestId('toggle-lock-viewport')).toBeDefined()
  })

  it('renders x-axis and y-axis sections', () => {
    const onChange = vi.fn()
    render(<GridSettingsPanel settings={defaultGridSettings()} onChange={onChange} />)
    expect(screen.getByTestId('x-axis-section')).toBeDefined()
    expect(screen.getByTestId('y-axis-section')).toBeDefined()
  })

  it('toggling grid calls onChange with updated setting', () => {
    const onChange = vi.fn()
    const settings = defaultGridSettings()
    render(<GridSettingsPanel settings={settings} onChange={onChange} />)

    const toggle = screen.getByTestId('toggle-grid').querySelector('input')!
    fireEvent.click(toggle)

    expect(onChange).toHaveBeenCalledTimes(1)
    const updated: GridSettings = onChange.mock.calls[0][0]
    expect(updated.showGrid).toBe(false)
  })

  it('toggling arrows calls onChange', () => {
    const onChange = vi.fn()
    render(<GridSettingsPanel settings={defaultGridSettings()} onChange={onChange} />)

    const toggle = screen.getByTestId('toggle-arrows').querySelector('input')!
    fireEvent.click(toggle)

    const updated: GridSettings = onChange.mock.calls[0][0]
    expect(updated.showArrows).toBe(true)
  })

  it('toggling minor gridlines calls onChange', () => {
    const onChange = vi.fn()
    render(<GridSettingsPanel settings={defaultGridSettings()} onChange={onChange} />)

    const toggle = screen.getByTestId('toggle-minor-gridlines').querySelector('input')!
    fireEvent.click(toggle)

    const updated: GridSettings = onChange.mock.calls[0][0]
    expect(updated.showMinorGridlines).toBe(false)
  })

  it('toggling lock viewport calls onChange', () => {
    const onChange = vi.fn()
    render(<GridSettingsPanel settings={defaultGridSettings()} onChange={onChange} />)

    const toggle = screen.getByTestId('toggle-lock-viewport').querySelector('input')!
    fireEvent.click(toggle)

    const updated: GridSettings = onChange.mock.calls[0][0]
    expect(updated.lockViewport).toBe(true)
  })

  it('preserves other settings when toggling one', () => {
    const onChange = vi.fn()
    const settings = defaultGridSettings()
    settings.showArrows = true
    render(<GridSettingsPanel settings={settings} onChange={onChange} />)

    const toggle = screen.getByTestId('toggle-grid').querySelector('input')!
    fireEvent.click(toggle)

    const updated: GridSettings = onChange.mock.calls[0][0]
    expect(updated.showArrows).toBe(true) // preserved
    expect(updated.showGrid).toBe(false) // changed
  })
})
