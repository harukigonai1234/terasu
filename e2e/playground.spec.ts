import { test, expect } from '@playwright/test'

test.describe('playground e2e (real browser)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Switch to Code tab
    await page.getByRole('tab', { name: /code/i }).click()
    // Wait for auto-run debounce + first frame
    await page.waitForTimeout(500)
  })

  test('page loads with canvas and time slider', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    const timeSlider = page.getByTestId('time-slider')
    await expect(timeSlider).toBeVisible()
  })

  test('t advances over time', async ({ page }) => {
    const timeSlider = page.getByTestId('time-slider')
    const t0 = await timeSlider.inputValue()
    await page.waitForTimeout(500)
    const t1 = await timeSlider.inputValue()
    expect(parseFloat(t1)).toBeGreaterThan(parseFloat(t0))
  })

  test('pause stops t from advancing', async ({ page }) => {
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(100)

    const timeSlider = page.getByTestId('time-slider')
    const tAtPause = parseFloat(await timeSlider.inputValue())
    await page.waitForTimeout(500)
    const tAfterWait = parseFloat(await timeSlider.inputValue())
    expect(tAfterWait - tAtPause).toBeLessThan(0.02)
  })

  test('play resumes after pause', async ({ page }) => {
    await page.waitForTimeout(200)
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(100)

    const timeSlider = page.getByTestId('time-slider')
    const tPaused = parseFloat(await timeSlider.inputValue())

    await page.getByRole('button', { name: /play/i }).click()
    await page.waitForTimeout(500)
    const tResumed = parseFloat(await timeSlider.inputValue())
    expect(tResumed).toBeGreaterThan(tPaused)
  })

  test('scrubbing slider back changes t value', async ({ page }) => {
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /pause/i }).click()

    const timeSlider = page.getByTestId('time-slider')
    await timeSlider.fill('0')
    const val = parseFloat(await timeSlider.inputValue())
    expect(val).toBe(0)
  })

  test('canvas renders non-white pixels', async ({ page }) => {
    await page.waitForTimeout(1000)
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) return true
      }
      return false
    })
    expect(hasContent).toBe(true)
  })
})

test.describe('grid settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /code/i }).click()
    await page.waitForTimeout(500)
  })

  test('toggling grid off reduces drawn pixels', async ({ page }) => {
    // Pause to get stable frames
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(200)

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    // Open settings and toggle grid off
    await page.getByTestId('grid-settings-btn').click()
    await page.waitForTimeout(200)
    await page.getByTestId('toggle-grid').locator('input').click()
    // Close modal and wait for re-run debounce + render
    await page.keyboard.press('Escape')
    await page.waitForTimeout(800)

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    expect(pixelsAfter).toBeLessThan(pixelsBefore)
  })

  test('toggling axis numbers off removes tick labels', async ({ page }) => {
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(200)

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    await page.getByTestId('grid-settings-btn').click()
    await page.waitForTimeout(200)
    await page.getByTestId('toggle-axis-numbers').locator('input').click()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(800)

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    expect(pixelsAfter).toBeLessThan(pixelsBefore)
  })
})

test.describe('zoom', () => {
  test('zoom in changes canvas content (oscillator)', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-oscillator').click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(200)

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    const zoomIn = page.getByRole('button', { name: /zoom in/i })
    await zoomIn.click()
    await zoomIn.click()
    await zoomIn.click()
    await page.waitForTimeout(500)

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    expect(pixelsAfter).not.toBe(pixelsBefore)
  })

  test('zoom out changes canvas content (oscillator)', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-oscillator').click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(200)

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    const zoomOut = page.getByRole('button', { name: /zoom out/i })
    await zoomOut.click()
    await zoomOut.click()
    await zoomOut.click()
    await page.waitForTimeout(500)

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    expect(pixelsAfter).not.toBe(pixelsBefore)
  })
})

test.describe('template gallery', () => {
  const templates = ['dipole', 'oscillator', 'pendulum', 'wave', 'lorenz', 'spring', 'orbital']

  for (const id of templates) {
    test(`template "${id}" loads and renders without crash`, async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: /explore/i }).click()
      await page.waitForTimeout(300)
      await page.getByTestId(`template-card-${id}`).click()
      await page.waitForTimeout(1000)

      // Should have switched to Code tab and rendered something
      const hasContent = await page.evaluate(() => {
        const canvas = document.querySelector('canvas')!
        if (!canvas) return false
        const ctx = canvas.getContext('2d')!
        if (!ctx) return false
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) return true
        }
        return false
      })
      expect(hasContent).toBe(true)
    })
  }
})

test.describe('param sliders affect visualization', () => {
  test('changing oscillator damping changes the trajectories', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-oscillator').click()
    await page.waitForTimeout(1000)

    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(200)

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    // The createUI renders vanilla sliders with class terasu-slider
    // Change the first slider (gamma/damping) by interacting with the input
    const sliders = page.locator('input[type="range"]')
    // Skip the first one (time slider), get the second (damping)
    const dampingSlider = sliders.nth(1)
    await dampingSlider.fill('1.8')
    await page.waitForTimeout(800)

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    expect(pixelsAfter).not.toBe(pixelsBefore)
  })
})

test.describe('auto-run on code change', () => {
  test('editing code re-renders canvas after debounce', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /code/i }).click()
    await page.waitForTimeout(500)

    // Pause for stability
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(100)

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    // Type something in Monaco that changes the visualization
    // Focus the editor and select all, then type new code
    const editor = page.locator('.monaco-editor textarea')
    await editor.focus()
    await page.keyboard.press('Meta+a')
    await page.keyboard.type(`const { scalarField, createRenderer } = terasu
const domain = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }
const renderer = createRenderer({ canvas, domain })
const field = scalarField((p) => Math.sin(p.x * 3) * Math.cos(p.y * 3))
function draw() {
  renderer.clear()
  renderer.drawGrid()
  renderer.drawScalarField(field, { resolution: 50 })
  requestAnimationFrame(draw)
}
draw()`)

    // Wait for debounce (300ms) + render
    await page.waitForTimeout(1000)

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    expect(pixelsAfter).not.toBe(pixelsBefore)
  })
})

test.describe('time scrub affects trajectory', () => {
  test('oscillator: scrubbing t back to 0 shortens trajectories', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-oscillator').click()
    await page.waitForTimeout(2000)

    // Pause
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(200)

    const pixelsAtT = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    // Scrub t to near 0
    const timeSlider = page.getByTestId('time-slider')
    await timeSlider.fill('0.1')
    await page.waitForTimeout(500)

    const pixelsAtZero = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    // Fewer pixels at t≈0 (shorter trajectories)
    expect(pixelsAtZero).toBeLessThan(pixelsAtT)
  })

  test('wave: animation changes pixels when playing', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-wave').click()
    await page.waitForTimeout(500)

    // Capture two frames while playing
    const pixels1 = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    await page.waitForTimeout(300)

    const pixels2 = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 0
      for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
      return hash
    })

    // Pixels should differ between frames (wave is animating)
    expect(pixels2).not.toBe(pixels1)
  })
})

test.describe('oscillator and spring pause', () => {
  test('oscillator: pause freezes trajectory length', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-oscillator').click()
    await page.waitForTimeout(1000)

    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(100)

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    await page.waitForTimeout(500)

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    expect(Math.abs(pixelsAfter - pixelsBefore)).toBeLessThan(50)
  })

  test('spring: pause freezes particle motion', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-spring').click()
    await page.waitForTimeout(1000)

    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(100)

    const snapshot1 = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    await page.waitForTimeout(500)

    const snapshot2 = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
      }
      return count
    })

    expect(Math.abs(snapshot2 - snapshot1)).toBeLessThan(50)
  })
})
