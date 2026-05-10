import * as terasu from '../src/index'
import { examples } from './examples'

const editor = document.getElementById('editor') as HTMLTextAreaElement
const canvasEl = document.getElementById('canvas') as HTMLCanvasElement
const controlsEl = document.getElementById('controls') as HTMLDivElement
const errorEl = document.getElementById('error') as HTMLDivElement
const exampleSelect = document.getElementById('examples') as HTMLSelectElement
const runBtn = document.getElementById('run-btn') as HTMLButtonElement

let currentAnimationFrame: number | null = null

function resizeCanvas() {
  const rect = canvasEl.parentElement!.getBoundingClientRect()
  canvasEl.width = rect.width
  canvasEl.height = rect.height - controlsEl.offsetHeight
}

function clearError() {
  errorEl.textContent = ''
  errorEl.classList.remove('visible')
}

function showError(err: unknown) {
  errorEl.textContent = String(err)
  errorEl.classList.add('visible')
}

function run() {
  clearError()

  // Cancel previous animation loop
  if (currentAnimationFrame !== null) {
    cancelAnimationFrame(currentAnimationFrame)
    currentAnimationFrame = null
  }

  // Clear controls
  controlsEl.innerHTML = ''

  resizeCanvas()

  const code = editor.value

  try {
    // Wrap in function with terasu, canvas, and controls in scope
    const wrappedCode = `
      return (function(terasu, canvas, controls, requestAnimationFrame) {
        ${code}
      })
    `
    const factory = new Function(wrappedCode)()

    // Override requestAnimationFrame to track the handle
    const wrappedRAF = (fn: FrameRequestCallback) => {
      currentAnimationFrame = window.requestAnimationFrame(fn)
      return currentAnimationFrame
    }

    factory(terasu, canvasEl, controlsEl, wrappedRAF)
  } catch (err) {
    showError(err)
  }
}

function loadExample(name: string) {
  const code = examples[name]
  if (code) {
    editor.value = code.trim()
    run()
  }
}

// Keyboard shortcut: Cmd+Enter or Ctrl+Enter to run
editor.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    run()
  }
  // Tab inserts spaces
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = editor.selectionStart
    const end = editor.selectionEnd
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end)
    editor.selectionStart = editor.selectionEnd = start + 2
  }
})

runBtn.addEventListener('click', run)
exampleSelect.addEventListener('change', () => loadExample(exampleSelect.value))
window.addEventListener('resize', resizeCanvas)

// Load first example on start
loadExample('dipole')
