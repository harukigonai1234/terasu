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

    // Read initial value
    const t0 = await timeSlider.inputValue()

    // Wait for some frames
    await page.waitForTimeout(500)

    const t1 = await timeSlider.inputValue()
    expect(parseFloat(t1)).toBeGreaterThan(parseFloat(t0))
  })

  test('pause stops t from advancing', async ({ page }) => {
    // Let time advance a bit
    await page.waitForTimeout(300)

    // Click pause
    await page.getByRole('button', { name: /pause/i }).click()

    // Wait a moment for any in-flight frames to settle
    await page.waitForTimeout(100)

    const timeSlider = page.getByTestId('time-slider')
    const tAtPause = parseFloat(await timeSlider.inputValue())

    // Wait significantly longer
    await page.waitForTimeout(500)

    const tAfterWait = parseFloat(await timeSlider.inputValue())
    // t should not have advanced (allow 1 frame tolerance for in-flight RAF)
    expect(tAfterWait - tAtPause).toBeLessThan(0.02)
  })

  test('play resumes after pause', async ({ page }) => {
    await page.waitForTimeout(200)

    // Pause
    await page.getByRole('button', { name: /pause/i }).click()
    await page.waitForTimeout(100)

    const timeSlider = page.getByTestId('time-slider')
    const tPaused = parseFloat(await timeSlider.inputValue())

    // Play
    await page.getByRole('button', { name: /play/i }).click()
    await page.waitForTimeout(500)

    const tResumed = parseFloat(await timeSlider.inputValue())
    expect(tResumed).toBeGreaterThan(tPaused)
  })

  test('scrubbing slider back changes t value', async ({ page }) => {
    await page.waitForTimeout(500)

    // Pause first
    await page.getByRole('button', { name: /pause/i }).click()

    const timeSlider = page.getByTestId('time-slider')

    // Scrub to 0
    await timeSlider.fill('0')

    const val = parseFloat(await timeSlider.inputValue())
    expect(val).toBe(0)
  })

  test('canvas has non-white pixels (something rendered)', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Check canvas isn't blank by evaluating pixel data
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      const ctx = canvas.getContext('2d')
      if (!ctx) return false
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      // Check if any pixel is not pure white (255,255,255)
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          return true
        }
      }
      return false
    })

    expect(hasContent).toBe(true)
  })

  test('canvas renders something (not blank)', async ({ page }) => {
    await page.waitForTimeout(1000)

    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      const ctx = canvas.getContext('2d')
      if (!ctx) return false
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          return true
        }
      }
      return false
    })

    expect(hasContent).toBe(true)
  })
})
