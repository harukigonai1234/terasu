export const examples: Record<string, string> = {
  dipole: `// Electric dipole field
const { vectorField, createRenderer, createParamSet, createUI, vec2, add, scale, lengthSq, sub } = terasu

const params = createParamSet()
const charge = params.add('charge', { value: 1, range: [0.1, 5], unit: 'C' })
const separation = params.add('separation', { value: 2, range: [0.5, 5], unit: 'm' })

function dipoleField(p) {
  const d = separation.value / 2
  const pos = vec2(d, 0)
  const neg = vec2(-d, 0)

  const r1 = sub(p, pos)
  const r2 = sub(p, neg)
  const r1sq = lengthSq(r1)
  const r2sq = lengthSq(r2)

  if (r1sq < 0.1 || r2sq < 0.1) return vec2(0, 0)

  const E1 = scale(r1, charge.value / (r1sq * Math.sqrt(r1sq)))
  const E2 = scale(r2, -charge.value / (r2sq * Math.sqrt(r2sq)))
  return add(E1, E2)
}

const field = vectorField(dipoleField)
const domain = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }

const renderer = createRenderer({ canvas, domain })
const ui = createUI({ container: controls, params })

function draw() {
  renderer.clear()
  renderer.drawGrid()
  renderer.drawVectorField(field, { resolution: 25 })
  requestAnimationFrame(draw)
}
draw()
`,

  oscillator: `// Damped harmonic oscillator phase portrait (scrub t to see evolution)
const { dynamicalSystem2D, createRenderer, createParamSet, createUI } = terasu

const params = createParamSet()
const gamma = params.add('gamma', { value: 0.2, range: [0, 2], label: 'Damping γ' })
const omega = params.add('omega', { value: 1.0, range: [0.1, 5], label: 'Frequency ω' })

const domain = { xMin: -4, xMax: 4, yMin: -4, yMax: 4 }
const renderer = createRenderer({ canvas, domain })
const ui = createUI({ container: controls, params })

function draw() {
  const sys = dynamicalSystem2D({
    dx: (x, v) => v,
    dy: (x, v) => -2 * gamma.value * v - omega.value ** 2 * x,
  })

  renderer.clear()
  renderer.drawGrid()
  renderer.drawVectorField(sys.phasePortrait(domain), { resolution: 20 })

  const duration = Math.max(0.1, t.value)
  const colors = ['#c74440', '#2d70b3', '#388c46', '#6042a6']
  const initials = [[3, 0], [-2, 2], [0, -3], [2, 2]]
  initials.forEach((init, i) => {
    const traj = sys.trajectory({ initial: init, duration: duration, dt: 0.02 })
    renderer.drawTrajectory(traj, { color: colors[i] })
  })

  requestAnimationFrame(draw)
}
draw()
`,

  pendulum: `// Double pendulum (chaotic trajectories)
const { dynamicalSystem, createRenderer, createParamSet, createUI } = terasu

const params = createParamSet()
const g = params.add('g', { value: 9.81, range: [1, 20], unit: 'm/s²' })

const domain = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 }
const renderer = createRenderer({ canvas, domain })

const sys = dynamicalSystem({
  dim: 4,
  derivative: (s) => {
    const [t1, t2, w1, w2] = s
    const dt = t1 - t2
    const den = 2 - Math.cos(2 * dt)

    const dw1 = (-g.value * (2 * Math.sin(t1) - Math.sin(t2) * Math.cos(dt))
                 - Math.sin(dt) * (w2 * w2 + w1 * w1 * Math.cos(dt))) / den
    const dw2 = (2 * Math.sin(dt) * (w1 * w1 + g.value * Math.cos(t1)
                 + w2 * w2 * Math.cos(dt) * 0.5)) / den

    return [w1, w2, dw1, dw2]
  },
})

const colors = ['#c74440', '#2d70b3']
const initials = [
  [Math.PI * 0.75, Math.PI * 0.5, 0, 0],
  [Math.PI * 0.75 + 0.01, Math.PI * 0.5, 0, 0],
]

const ui = createUI({ container: controls, params })

function draw() {
  const duration = Math.max(0.1, t.value)
  renderer.clear()
  renderer.drawGrid()
  initials.forEach((init, i) => {
    const traj = sys.trajectory({ initial: init, duration: duration, dt: 0.005 })
    const points = traj.map(s => {
      const x = Math.sin(s[0]) + Math.sin(s[1])
      const y = -Math.cos(s[0]) - Math.cos(s[1])
      return [x, y]
    })
    renderer.drawTrajectory(points, { color: colors[i], lineWidth: 1.5 })
  })
  requestAnimationFrame(draw)
}
draw()
`,

  wave: `// 2D wave interference pattern
const { scalarField, createRenderer, createParamSet, createUI } = terasu

const params = createParamSet()
const freq = params.add('frequency', { value: 3, range: [1, 10], unit: 'Hz' })
const sources = params.add('sources', { value: 2, range: [1, 5], step: 1 })

const domain = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }
const renderer = createRenderer({ canvas, domain })
const ui = createUI({ container: controls, params })

function wave(p, sourcePos, time) {
  const dx = p.x - sourcePos[0]
  const dy = p.y - sourcePos[1]
  const r = Math.sqrt(dx * dx + dy * dy) + 0.01
  return Math.sin(freq.value * 2 * Math.PI * (r - time)) / r
}

function draw() {
  const field = scalarField((p) => {
    let sum = 0
    const n = Math.round(sources.value)
    const spacing = 3 / Math.max(n - 1, 1)
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? 0 : -1.5 + i * spacing
      sum += wave(p, [-4, y], t.value)
    }
    return sum
  })

  renderer.clear()
  renderer.drawScalarField(field, { resolution: 80, opacity: 0.6 })
  renderer.drawGrid()
  requestAnimationFrame(draw)
}
draw()
`,

  lorenz: `// Lorenz attractor
const { dynamicalSystem, createRenderer, createParamSet, createUI } = terasu

const params = createParamSet()
const sigma = params.add('σ', { value: 10, range: [1, 20] })
const rho = params.add('ρ', { value: 28, range: [1, 50] })
const beta = params.add('β', { value: 2.667, range: [0.5, 5] })

const domain = { xMin: -25, xMax: 25, yMin: 0, yMax: 50 }
const renderer = createRenderer({ canvas, domain })
const ui = createUI({ container: controls, params })

const sys = dynamicalSystem({
  dim: 3,
  derivative: (s) => {
    const [x, y, z] = s
    return [
      sigma.value * (y - x),
      x * (rho.value - z) - y,
      x * y - beta.value * z,
    ]
  },
})

function draw() {
  const duration = Math.max(0.1, t.value * 2)
  const traj = sys.trajectory({
    initial: [1, 1, 1],
    duration: duration,
    dt: 0.005,
  })
  const projected = traj.map(s => [s[0], s[2]])

  renderer.clear()
  renderer.drawGrid()
  renderer.drawTrajectory(projected, { color: '#2d70b3', lineWidth: 1 })
  requestAnimationFrame(draw)
}
draw()
`,
}
