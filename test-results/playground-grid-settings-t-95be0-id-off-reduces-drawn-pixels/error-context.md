# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playground.spec.ts >> grid settings >> toggling grid off reduces drawn pixels
- Location: e2e/playground.spec.ts:86:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5488
Received:   5488
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - tablist [ref=e8]:
        - tab "Explore" [ref=e10] [cursor=pointer]:
          - generic [ref=e12]: Explore
        - tab "Code" [selected] [ref=e14] [cursor=pointer]:
          - generic [ref=e16]: Code
      - tabpanel "Code" [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - button "Electric Dipole" [ref=e24]:
              - generic [ref=e25]: Electric Dipole
              - generic [ref=e27]:
                - img
            - button "Run" [ref=e28] [cursor=pointer]
          - code [ref=e32]:
            - generic [ref=e33]:
              - textbox "Editor content" [ref=e34]
              - textbox [ref=e35]
              - generic [ref=e37]:
                - generic [ref=e40]: "1"
                - generic [ref=e42]: "2"
                - generic [ref=e46]: "3"
                - generic [ref=e48]: "4"
                - generic [ref=e50]: "5"
                - generic [ref=e53]: "6"
                - generic [ref=e56]: "7"
                - generic [ref=e57]:
                  - generic [ref=e58] [cursor=pointer]: 
                  - generic [ref=e59]: "8"
                - generic [ref=e61]: "9"
                - generic [ref=e63]: "10"
                - generic [ref=e65]: "11"
                - generic [ref=e67]: "12"
                - generic [ref=e69]: "13"
                - generic [ref=e71]: "14"
                - generic [ref=e73]: "15"
                - generic [ref=e75]: "16"
              - generic [ref=e107]:
                - generic [ref=e109]: // Electric dipole field
                - generic [ref=e111]: "const { vectorField, createRenderer,"
                - generic [ref=e113]: createParamSet, createUI, vec2, add, scale,
                - generic [ref=e115]: "lengthSq, sub } = terasu"
                - generic [ref=e118]: const params = createParamSet()
                - generic [ref=e120]: "const charge = params.add('charge', { value: 1,"
                - generic [ref=e122]: "range: [0.1, 5], unit: 'C' })"
                - generic [ref=e124]: "const separation = params.add('separation', {"
                - generic [ref=e126]: "value: 2, range: [0.5, 5], unit: 'm' })"
                - generic [ref=e129]: "function dipoleField(p) {"
                - generic [ref=e131]: const d = separation.value / 2
                - generic [ref=e133]: const pos = vec2(d, 0)
                - generic [ref=e135]: const neg = vec2(-d, 0)
                - generic [ref=e138]: const r1 = sub(p, pos)
                - generic [ref=e140]: const r2 = sub(p, neg)
                - generic [ref=e142]: const r1sq = lengthSq(r1)
                - generic [ref=e144]: const r2sq = lengthSq(r2)
          - generic [ref=e146]:
            - generic [ref=e147]:
              - button "Play" [ref=e148] [cursor=pointer]:
                - generic [ref=e149]:
                  - img
              - generic [ref=e150]: t
              - slider [ref=e151]: "0"
              - generic [ref=e152]: "0.00"
            - generic [ref=e154]:
              - generic [ref=e155]:
                - generic [ref=e156]:
                  - text: charge
                  - generic [ref=e157]: 1.00 C
                - slider [ref=e158]: "0.982"
              - generic [ref=e159]:
                - generic [ref=e160]:
                  - text: separation
                  - generic [ref=e161]: 2.00 m
                - slider [ref=e162]: "1.985"
    - generic [ref=e166]:
      - button "Graph settings" [ref=e167] [cursor=pointer]:
        - generic [ref=e168]:
          - img
      - generic [ref=e169]:
        - button "Zoom In" [ref=e171] [cursor=pointer]:
          - generic [ref=e172]:
            - img
        - button "Zoom Out" [ref=e174] [cursor=pointer]:
          - generic [ref=e175]:
            - img
  - dialog "Graph Settings" [ref=e176] [cursor=pointer]:
    - generic [ref=e178]:
      - generic [ref=e181]:
        - heading "Graph Settings" [level=2] [ref=e183]:
          - generic [ref=e184]: Graph Settings
        - button [ref=e187]:
          - generic [ref=e188]:
            - img
      - generic [ref=e190]:
        - generic [ref=e192]:
          - generic [ref=e195]:
            - checkbox "Grid" [active] [ref=e198]
            - generic [ref=e200]: Grid
          - generic [ref=e203]:
            - checkbox "Arrows" [ref=e206]
            - generic [ref=e208]: Arrows
          - generic [ref=e211]:
            - checkbox "Axis Numbers" [checked] [ref=e214]
            - generic [ref=e216]: Axis Numbers
          - generic [ref=e219]:
            - checkbox "Minor Gridlines" [checked] [ref=e222]
            - generic [ref=e224]: Minor Gridlines
        - button "X-Axis" [ref=e230]:
          - generic [ref=e232]:
            - img
          - generic [ref=e233]: X-Axis
        - button "Y-Axis" [ref=e239]:
          - generic [ref=e241]:
            - img
          - generic [ref=e242]: Y-Axis
        - generic [ref=e245]:
          - checkbox "Lock Viewport" [ref=e248]
          - generic [ref=e250]: Lock Viewport
  - generic [ref=e251]:
    - alert
    - alert
```

# Test source

```ts
  32  | 
  33  |     const timeSlider = page.getByTestId('time-slider')
  34  |     const tAtPause = parseFloat(await timeSlider.inputValue())
  35  |     await page.waitForTimeout(500)
  36  |     const tAfterWait = parseFloat(await timeSlider.inputValue())
  37  |     expect(tAfterWait - tAtPause).toBeLessThan(0.02)
  38  |   })
  39  | 
  40  |   test('play resumes after pause', async ({ page }) => {
  41  |     await page.waitForTimeout(200)
  42  |     await page.getByRole('button', { name: /pause/i }).click()
  43  |     await page.waitForTimeout(100)
  44  | 
  45  |     const timeSlider = page.getByTestId('time-slider')
  46  |     const tPaused = parseFloat(await timeSlider.inputValue())
  47  | 
  48  |     await page.getByRole('button', { name: /play/i }).click()
  49  |     await page.waitForTimeout(500)
  50  |     const tResumed = parseFloat(await timeSlider.inputValue())
  51  |     expect(tResumed).toBeGreaterThan(tPaused)
  52  |   })
  53  | 
  54  |   test('scrubbing slider back changes t value', async ({ page }) => {
  55  |     await page.waitForTimeout(500)
  56  |     await page.getByRole('button', { name: /pause/i }).click()
  57  | 
  58  |     const timeSlider = page.getByTestId('time-slider')
  59  |     await timeSlider.fill('0')
  60  |     const val = parseFloat(await timeSlider.inputValue())
  61  |     expect(val).toBe(0)
  62  |   })
  63  | 
  64  |   test('canvas renders non-white pixels', async ({ page }) => {
  65  |     await page.waitForTimeout(1000)
  66  |     const hasContent = await page.evaluate(() => {
  67  |       const canvas = document.querySelector('canvas')!
  68  |       const ctx = canvas.getContext('2d')!
  69  |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  70  |       for (let i = 0; i < data.length; i += 4) {
  71  |         if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) return true
  72  |       }
  73  |       return false
  74  |     })
  75  |     expect(hasContent).toBe(true)
  76  |   })
  77  | })
  78  | 
  79  | test.describe('grid settings', () => {
  80  |   test.beforeEach(async ({ page }) => {
  81  |     await page.goto('/')
  82  |     await page.getByRole('tab', { name: /code/i }).click()
  83  |     await page.waitForTimeout(500)
  84  |   })
  85  | 
  86  |   test('toggling grid off reduces drawn pixels', async ({ page }) => {
  87  |     // Use the default dipole example which draws grid + vector field
  88  |     // The dipole loads on start and draws grid. Pixel count includes grid lines.
  89  |     await page.waitForTimeout(1000)
  90  |     await page.getByRole('button', { name: /pause/i }).click()
  91  |     await page.waitForTimeout(200)
  92  | 
  93  |     const pixelsBefore = await page.evaluate(() => {
  94  |       const canvas = document.querySelector('canvas')!
  95  |       const ctx = canvas.getContext('2d')!
  96  |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  97  |       let count = 0
  98  |       for (let i = 0; i < data.length; i += 4) {
  99  |         if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
  100 |       }
  101 |       return count
  102 |     })
  103 |     expect(pixelsBefore).toBeGreaterThan(100)
  104 | 
  105 |     // Toggle grid off — this should remove grid lines while keeping arrows
  106 |     await page.getByTestId('grid-settings-btn').click()
  107 |     await page.waitForTimeout(300)
  108 |     await page.getByTestId('toggle-grid').locator('input').click()
  109 |     // gridSettings change triggers auto-run effect (300ms debounce) + render
  110 |     await page.waitForTimeout(2000)
  111 | 
  112 |     const pixelsAfter = await page.evaluate(() => {
  113 |       const canvas = document.querySelector('canvas')!
  114 |       const ctx = canvas.getContext('2d')!
  115 |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  116 |       let count = 0
  117 |       for (let i = 0; i < data.length; i += 4) {
  118 |         if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
  119 |       }
  120 |       return count
  121 |     })
  122 | 
  123 |     // Debug: take screenshots
  124 |     await page.screenshot({ path: 'test-results/grid-after.png' })
  125 | 
  126 |     // Grid lines should be gone — fewer pixels (arrows remain)
  127 |     // If this still fails with same count, grid isn't being drawn in the first place
  128 |     // (the 5488 pixels are ALL from the vector field arrows)
  129 |     if (pixelsAfter === pixelsBefore) {
  130 |       console.log('SAME pixel count — grid likely not contributing visible pixels over the dipole field')
  131 |     }
> 132 |     expect(pixelsAfter).toBeLessThan(pixelsBefore)
      |                         ^ Error: expect(received).toBeLessThan(expected)
  133 |   })
  134 | 
  135 |   test('toggling axis numbers off removes tick labels', async ({ page }) => {
  136 |     await page.getByRole('button', { name: /pause/i }).click()
  137 |     await page.waitForTimeout(200)
  138 | 
  139 |     const pixelsBefore = await page.evaluate(() => {
  140 |       const canvas = document.querySelector('canvas')!
  141 |       const ctx = canvas.getContext('2d')!
  142 |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  143 |       let count = 0
  144 |       for (let i = 0; i < data.length; i += 4) {
  145 |         if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
  146 |       }
  147 |       return count
  148 |     })
  149 | 
  150 |     await page.getByTestId('grid-settings-btn').click()
  151 |     await page.waitForTimeout(200)
  152 |     await page.getByTestId('toggle-axis-numbers').locator('input').click()
  153 |     await page.keyboard.press('Escape')
  154 |     await page.waitForTimeout(800)
  155 | 
  156 |     const pixelsAfter = await page.evaluate(() => {
  157 |       const canvas = document.querySelector('canvas')!
  158 |       const ctx = canvas.getContext('2d')!
  159 |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  160 |       let count = 0
  161 |       for (let i = 0; i < data.length; i += 4) {
  162 |         if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
  163 |       }
  164 |       return count
  165 |     })
  166 | 
  167 |     expect(pixelsAfter).toBeLessThan(pixelsBefore)
  168 |   })
  169 | })
  170 | 
  171 | test.describe('zoom', () => {
  172 |   test('zoom in changes canvas content (oscillator)', async ({ page }) => {
  173 |     await page.goto('/')
  174 |     await page.getByRole('tab', { name: /explore/i }).click()
  175 |     await page.waitForTimeout(300)
  176 |     await page.getByTestId('template-card-oscillator').click()
  177 |     await page.waitForTimeout(1000)
  178 |     await page.getByRole('button', { name: /pause/i }).click()
  179 |     await page.waitForTimeout(200)
  180 | 
  181 |     const pixelsBefore = await page.evaluate(() => {
  182 |       const canvas = document.querySelector('canvas')!
  183 |       const ctx = canvas.getContext('2d')!
  184 |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  185 |       let hash = 0
  186 |       for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
  187 |       return hash
  188 |     })
  189 | 
  190 |     const zoomIn = page.getByRole('button', { name: /zoom in/i })
  191 |     await zoomIn.click()
  192 |     await zoomIn.click()
  193 |     await zoomIn.click()
  194 |     await page.waitForTimeout(500)
  195 | 
  196 |     const pixelsAfter = await page.evaluate(() => {
  197 |       const canvas = document.querySelector('canvas')!
  198 |       const ctx = canvas.getContext('2d')!
  199 |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  200 |       let hash = 0
  201 |       for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
  202 |       return hash
  203 |     })
  204 | 
  205 |     expect(pixelsAfter).not.toBe(pixelsBefore)
  206 |   })
  207 | 
  208 |   test('zoom out changes canvas content (oscillator)', async ({ page }) => {
  209 |     await page.goto('/')
  210 |     await page.getByRole('tab', { name: /explore/i }).click()
  211 |     await page.waitForTimeout(300)
  212 |     await page.getByTestId('template-card-oscillator').click()
  213 |     await page.waitForTimeout(1000)
  214 |     await page.getByRole('button', { name: /pause/i }).click()
  215 |     await page.waitForTimeout(200)
  216 | 
  217 |     const pixelsBefore = await page.evaluate(() => {
  218 |       const canvas = document.querySelector('canvas')!
  219 |       const ctx = canvas.getContext('2d')!
  220 |       const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  221 |       let hash = 0
  222 |       for (let i = 0; i < data.length; i += 40) { hash += data[i]! }
  223 |       return hash
  224 |     })
  225 | 
  226 |     const zoomOut = page.getByRole('button', { name: /zoom out/i })
  227 |     await zoomOut.click()
  228 |     await zoomOut.click()
  229 |     await zoomOut.click()
  230 |     await page.waitForTimeout(500)
  231 | 
  232 |     const pixelsAfter = await page.evaluate(() => {
```