import { test, expect } from '@playwright/test'

test.describe('playground e2e (real browser)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /code/i }).click()
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

test.describe('template gallery', () => {
  const templates = ['dipole', 'oscillator', 'pendulum', 'wave', 'lorenz', 'spring', 'orbital']

  for (const id of templates) {
    test(`template "${id}" loads and renders without crash`, async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: /explore/i }).click()
      await page.waitForTimeout(300)
      await page.getByTestId(`template-card-${id}`).click()
      await page.waitForTimeout(1000)

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

test.describe('wave animation', () => {
  test('wave pixels change between frames (animating)', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /explore/i }).click()
    await page.waitForTimeout(300)
    await page.getByTestId('template-card-wave').click()
    await page.waitForTimeout(500)

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
