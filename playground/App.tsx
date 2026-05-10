import { useState, useRef, useEffect, useCallback } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import Select from '@cloudscape-design/components/select'
import Button from '@cloudscape-design/components/button'
import Modal from '@cloudscape-design/components/modal'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Tabs from '@cloudscape-design/components/tabs'
import * as terasu from '../src/index'
import { examples } from './examples'
import { GridSettingsPanel, GridSettingsButton } from '../src/grid-settings-panel'
import { defaultGridSettings, GridSettings } from '../src/grid-settings'
import { TemplateGallery } from '../src/template-gallery'
import type { Template } from '../src/templates'

const TERASU_TYPES = `
declare const terasu: {
  vec2(x: number, y: number): { x: number; y: number };
  vec3(x: number, y: number, z: number): { x: number; y: number; z: number };
  add(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number };
  sub(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number };
  scale(v: { x: number; y: number }, s: number): { x: number; y: number };
  length(v: { x: number; y: number }): number;
  lengthSq(v: { x: number; y: number }): number;
  normalize(v: { x: number; y: number }): { x: number; y: number };
  dot(a: { x: number; y: number }, b: { x: number; y: number }): number;
  scalarField(fn: (p: { x: number; y: number }, t?: number) => number): any;
  vectorField(fn: (p: { x: number; y: number }, t?: number) => { x: number; y: number }): any;
  dynamicalSystem(config: { dim: number; derivative: (state: number[], t: number, params: Record<string, number>) => number[] }): any;
  dynamicalSystem2D(config: { dx: (x: number, y: number, params: Record<string, number>) => number; dy: (x: number, y: number, params: Record<string, number>) => number; params?: Record<string, number> }): any;
  createParticle(config: { position: { x: number; y: number }; velocity?: { x: number; y: number }; mass?: number; charge?: number }): any;
  createTimeEvolution(config?: { dt?: number; speed?: number }): any;
  createParam(name: string, config: { value: number; range: [number, number]; step?: number; label?: string; unit?: string }): any;
  createParamSet(): any;
  createRenderer(config: { canvas: HTMLCanvasElement; domain: { xMin: number; xMax: number; yMin: number; yMax: number }; background?: string; interactive?: boolean }): any;
  createUI(config: { container: HTMLElement; params?: any; time?: any }): any;
  springForce(anchor: { x: number; y: number }, k: number, restLength?: number): any;
  constantForce(force: { x: number; y: number }): any;
};
declare const canvas: HTMLCanvasElement;
declare const controls: HTMLElement;
declare const t: { readonly value: number };
declare function requestAnimationFrame(fn: FrameRequestCallback): number;
`

const exampleOptions = [
  { label: 'Electric Dipole', value: 'dipole' },
  { label: 'Damped Oscillator', value: 'oscillator' },
  { label: 'Double Pendulum', value: 'pendulum' },
  { label: 'Wave Interference', value: 'wave' },
  { label: 'Lorenz Attractor', value: 'lorenz' },
]

export function App() {
  const [selectedExample, setSelectedExample] = useState(exampleOptions[0]!)
  const [code, setCode] = useState(examples.dipole!.trim())
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gridSettings, setGridSettings] = useState<GridSettings>(defaultGridSettings())
  const [panelWidth, setPanelWidth] = useState(380)
  const [activeTab, setActiveTab] = useState<string>('templates')
  const [timePlaying, setTimePlaying] = useState(true)
  const [timeSpeed, setTimeSpeed] = useState(1)
  const [timeDisplay, setTimeDisplay] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const resizingRef = useRef(false)
  const rendererRef = useRef<any>(null)
  const savedParamValues = useRef<Record<string, number>>({})
  const timeRef = useRef({ t: 0, playing: true, speed: 1 })

  const run = useCallback(() => {
    setError(null)

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    if (controlsRef.current) {
      controlsRef.current.innerHTML = ''
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    try {
      // Wrap createParamSet to restore saved values across re-runs
      const wrappedTerasu = {
        ...terasu,
        createParamSet() {
          const ps = terasu.createParamSet()
          const originalAdd = ps.add.bind(ps)
          ps.add = (name: string, config: any) => {
            const saved = savedParamValues.current[name]
            if (saved !== undefined) {
              config = { ...config, value: saved }
            }
            const p = originalAdd(name, config)
            p.subscribe((v: number) => { savedParamValues.current[name] = v })
            return p
          }
          return ps
        },
        createRenderer(config: any) {
          const r = terasu.createRenderer(config)
          rendererRef.current = r
          // Override drawGrid to pass current grid settings
          const originalDrawGrid = r.drawGrid.bind(r)
          r.drawGrid = (s?: any) => originalDrawGrid(s ?? gridSettings)
          r.setLockViewport(gridSettings.lockViewport)
          // Apply axis range from settings if user has customized
          if (gridSettings.xAxis.min !== -10 || gridSettings.xAxis.max !== 10 ||
              gridSettings.yAxis.min !== -10 || gridSettings.yAxis.max !== 10) {
            r.setDomain({
              xMin: gridSettings.xAxis.min,
              xMax: gridSettings.xAxis.max,
              yMin: gridSettings.yAxis.min,
              yMax: gridSettings.yAxis.max,
            })
          }
          return r
        },
      }

      // Built-in clock: t.value auto-advances each frame
      const clock = timeRef.current
      clock.t = 0
      clock.playing = timePlaying
      clock.speed = timeSpeed
      setTimeDisplay(0)
      const tParam = { get value() { return clock.t } }

      let frameCount = 0
      const wrappedCode = `return (function(terasu, canvas, controls, requestAnimationFrame, t) { ${code} })`
      const factory = new Function(wrappedCode)()
      const wrappedRAF = (fn: FrameRequestCallback) => {
        animFrameRef.current = window.requestAnimationFrame((timestamp) => {
          if (clock.playing) {
            clock.t += 0.016 * clock.speed
          }
          fn(timestamp)
          // Update React time display every 10 frames to avoid excessive re-renders
          frameCount++
          if (frameCount % 10 === 0) {
            setTimeDisplay(clock.t)
          }
        })
        return animFrameRef.current!
      }
      factory(wrappedTerasu, canvas, controlsRef.current, wrappedRAF, tParam)
    } catch (err) {
      setError(String(err))
    }
  }, [code, gridSettings])

  const handleExampleChange = useCallback((value: string) => {
    const exCode = examples[value]
    if (exCode) {
      setCode(exCode.trim())
    }
  }, [])

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      noLib: true,
    })
    monaco.languages.typescript.javascriptDefaults.addExtraLib(TERASU_TYPES, 'terasu.d.ts')

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      run()
    })
  }

  // Auto-run on code or settings change
  useEffect(() => {
    const timer = setTimeout(run, 300)
    return () => clearTimeout(timer)
  }, [code, gridSettings, run])

  // Resize canvas when window resizes or panel width changes
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [panelWidth])

  // Panel resize drag handling
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true
    const startX = e.clientX
    const startWidth = panelWidth

    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const delta = e.clientX - startX
      const raw = startWidth + delta
      const screenWidth = window.innerWidth

      // Snap zones: collapse to 0 if dragged below 80px, full-screen if within 80px of edge
      if (raw < 80) {
        setPanelWidth(0)
      } else if (raw > screenWidth - 80) {
        setPanelWidth(screenWidth)
      } else {
        setPanelWidth(raw)
      }
    }
    const onUp = () => {
      resizingRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f1b2d' }}>
      {/* Left panel: tabs for templates / code */}
      <div style={{ width: `${panelWidth}px`, display: 'flex', flexDirection: 'column', borderRight: '1px solid #414d5c', flexShrink: 0, background: '#1a2332' }}>
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'templates',
              label: 'Explore',
              content: (
                <div style={{ padding: '12px', overflow: 'auto', height: 'calc(100vh - 100px)' }}>
                  <TemplateGallery onSelect={(t: Template) => {
                    setCode(t.code)
                    setActiveTab('code')
                  }} />
                </div>
              ),
            },
            {
              id: 'code',
              label: 'Code',
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
                  {/* Toolbar */}
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #414d5c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Select
                      selectedOption={selectedExample}
                      onChange={({ detail }) => {
                        setSelectedExample(detail.selectedOption as typeof selectedExample)
                        handleExampleChange(detail.selectedOption.value!)
                      }}
                      options={exampleOptions}
                      expandToViewport
                    />
                    <Button variant="primary" onClick={run}>Run</Button>
                  </div>

                  {/* Editor */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Editor
                      height="100%"
                      language="javascript"
                      theme="vs-dark"
                      value={code}
                      onChange={(value) => setCode(value ?? '')}
                      onMount={handleEditorMount}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 8 },
                      }}
                    />
                  </div>

                  {/* Controls area */}
                  <div style={{ borderTop: '1px solid #414d5c', padding: '8px 12px', maxHeight: '200px', overflow: 'auto' }}>
                    <div ref={controlsRef} />
                    {error && (
                      <Box color="text-status-error" variant="code">
                        {error}
                      </Box>
                    )}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          width: '4px',
          cursor: 'col-resize',
          background: 'transparent',
          flexShrink: 0,
          zIndex: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#539fe5')}
        onMouseLeave={(e) => { if (!resizingRef.current) e.currentTarget.style.background = 'transparent' }}
      />

      {/* Right side: graph */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Overlay controls (Desmos-style pillbox) */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(30, 30, 50, 0.85)', borderRadius: '6px', padding: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          <GridSettingsButton onClick={() => setSettingsOpen(true)} />
          <SpaceBetween direction="vertical" size="xxxs">
            <Button iconName="zoom-in" variant="icon" onClick={() => {
              const r = rendererRef.current
              if (!r) return
              const d = r.getDomain()
              const cx = (d.xMin + d.xMax) / 2
              const cy = (d.yMin + d.yMax) / 2
              const factor = 0.8
              r.setDomain({
                xMin: cx + (d.xMin - cx) * factor,
                xMax: cx + (d.xMax - cx) * factor,
                yMin: cy + (d.yMin - cy) * factor,
                yMax: cy + (d.yMax - cy) * factor,
              })
            }} ariaLabel="Zoom In" />
            <Button iconName="zoom-out" variant="icon" onClick={() => {
              const r = rendererRef.current
              if (!r) return
              const d = r.getDomain()
              const cx = (d.xMin + d.xMax) / 2
              const cy = (d.yMin + d.yMax) / 2
              const factor = 1.25
              r.setDomain({
                xMin: cx + (d.xMin - cx) * factor,
                xMax: cx + (d.xMax - cx) * factor,
                yMin: cy + (d.yMin - cy) * factor,
                yMax: cy + (d.yMax - cy) * factor,
              })
            }} ariaLabel="Zoom Out" />
          </SpaceBetween>
        </div>

        {/* Time control bar at bottom of canvas */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 16px',
          background: 'rgba(30, 30, 50, 0.85)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Button
            iconName={timePlaying ? 'pause' : 'play'}
            variant="icon"
            onClick={() => {
              const next = !timePlaying
              setTimePlaying(next)
              timeRef.current.playing = next
            }}
            ariaLabel={timePlaying ? 'Pause' : 'Play'}
          />
          <Button
            iconName="undo"
            variant="icon"
            onClick={() => {
              timeRef.current.t = 0
              setTimeDisplay(0)
            }}
            ariaLabel="Reset time"
          />
          <Box variant="span" color="text-status-inactive" fontSize="body-s">
            t = {timeDisplay.toFixed(2)}
          </Box>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box variant="span" color="text-status-inactive" fontSize="body-s">Speed:</Box>
            {[0.25, 0.5, 1, 2, 5].map(s => (
              <Button
                key={s}
                variant={timeSpeed === s ? 'primary' : 'normal'}
                onClick={() => {
                  setTimeSpeed(s)
                  timeRef.current.speed = s
                }}
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>

        {/* Settings modal */}
        <Modal
          visible={settingsOpen}
          onDismiss={() => setSettingsOpen(false)}
          header="Graph Settings"
          size="medium"
        >
          <GridSettingsPanel
            settings={gridSettings}
            onChange={setGridSettings}
          />
        </Modal>
      </div>
    </div>
  )
}
