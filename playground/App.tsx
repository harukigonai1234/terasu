import { useState, useRef, useEffect, useCallback } from 'react'
import AppLayout from '@cloudscape-design/components/app-layout'
import Select from '@cloudscape-design/components/select'
import Button from '@cloudscape-design/components/button'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Container from '@cloudscape-design/components/container'
import Textarea from '@cloudscape-design/components/textarea'
import * as terasu from '../src/index'
import { examples } from './examples'
import { GridSettingsPanel, GridSettingsButton } from '../src/grid-settings-panel'
import { defaultGridSettings, GridSettings } from '../src/grid-settings'

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

  useEffect(() => {
    const timer = setTimeout(run, 100)
    return () => clearTimeout(timer)
  }, [code, run])

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
      run()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [run])

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
                    <Button variant="primary" onClick={run}>Run</Button>
                  </SpaceBetween>
                }
              >
                Code
              </Header>
            }
          >
            <Textarea
              value={code}
              onChange={({ detail }) => setCode(detail.value)}
              rows={30}
              spellcheck={false}
            />
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
