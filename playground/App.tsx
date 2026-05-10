import { useState, useRef, useEffect, useCallback } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import AppLayout from '@cloudscape-design/components/app-layout'
import Select from '@cloudscape-design/components/select'
import Button from '@cloudscape-design/components/button'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Container from '@cloudscape-design/components/container'
import * as terasu from '../src/index'
import { examples } from './examples'
import { GridSettingsPanel, GridSettingsButton } from '../src/grid-settings-panel'
import { defaultGridSettings, GridSettings } from '../src/grid-settings'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number | null>(null)

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
      const wrappedCode = `return (function(terasu, canvas, controls, requestAnimationFrame) { ${code} })`
      const factory = new Function(wrappedCode)()
      const wrappedRAF = (fn: FrameRequestCallback) => {
        animFrameRef.current = window.requestAnimationFrame(fn)
        return animFrameRef.current
      }
      factory(terasu, canvas, controlsRef.current, wrappedRAF)
    } catch (err) {
      setError(String(err))
    }
  }, [code])

  const handleExampleChange = useCallback((value: string) => {
    const exCode = examples[value]
    if (exCode) {
      setCode(exCode.trim())
    }
  }, [])

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Add terasu type definitions for autocomplete
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

    // Cmd+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      run()
    })
  }

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
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: 'calc(100vh - 120px)' }}>
          <Container
            header={
              <Header
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Select
                      selectedOption={selectedExample}
                      onChange={({ detail }) => {
                        setSelectedExample(detail.selectedOption as typeof selectedExample)
                        handleExampleChange(detail.selectedOption.value!)
                      }}
                      options={exampleOptions}
                    />
                    <Button variant="primary" onClick={run}>Run ⌘↵</Button>
                  </SpaceBetween>
                }
              >
                Code
              </Header>
            }
          >
            <div style={{ height: '500px', border: '1px solid #414d5c', borderRadius: '4px', overflow: 'hidden' }}>
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
                  padding: { top: 12 },
                }}
              />
            </div>
          </Container>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Container
              header={
                <Header
                  actions={
                    <GridSettingsButton onClick={() => setSettingsOpen(!settingsOpen)} />
                  }
                >
                  Visualization
                </Header>
              }
            >
              <div style={{ position: 'relative', width: '100%', height: '400px', background: '#ffffff', borderRadius: '4px' }}>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
            </Container>

            {settingsOpen && (
              <Container header={<Header>Graph Settings</Header>}>
                <GridSettingsPanel
                  settings={gridSettings}
                  onChange={setGridSettings}
                />
              </Container>
            )}

            <Container header={<Header>Controls</Header>}>
              <div ref={controlsRef} />
              {error && (
                <Box color="text-status-error" variant="code">
                  {error}
                </Box>
              )}
            </Container>
          </div>
        </div>
      }
      headerSelector="#header"
    />
  )
}
