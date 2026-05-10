import { useEffect, useRef, useState, useCallback } from 'react'
import Slider from '@cloudscape-design/components/slider'
import Button from '@cloudscape-design/components/button'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Container from '@cloudscape-design/components/container'
import type { ParamSet } from './param'
import type { TimeEvolution } from './time-evolution'

interface ParamSliderProps {
  name: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}

function ParamSlider({ name, label, value, min, max, step, unit, onChange }: ParamSliderProps) {
  return (
    <div data-testid={`param-${name}`}>
      <Box variant="awsui-key-label">
        {label} <Box variant="span" color="text-status-info">{value.toFixed(2)}{unit ? ` ${unit}` : ''}</Box>
      </Box>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={({ detail }) => onChange(detail.value)}
      />
    </div>
  )
}

interface PlaybackControlsProps {
  time: TimeEvolution
  running: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
}

function PlaybackControls({ time, running, onPlay, onPause, onReset }: PlaybackControlsProps) {
  return (
    <SpaceBetween direction="horizontal" size="xs">
      <Button
        iconName={running ? 'pause' : 'play'}
        variant="icon"
        onClick={running ? onPause : onPlay}
        data-testid="play-btn"
      />
      <Button
        iconName="undo"
        variant="icon"
        onClick={onReset}
        data-testid="reset-btn"
      />
      <Box variant="span" color="text-status-inactive" data-testid="time-display">
        t = {time.t.toFixed(2)}
      </Box>
    </SpaceBetween>
  )
}

export interface TerasuUIProps {
  params?: ParamSet
  time?: TimeEvolution
}

export function TerasuUI({ params, time }: TerasuUIProps) {
  const [paramValues, setParamValues] = useState<Record<string, number>>(() =>
    params ? params.values() : {}
  )
  const [running, setRunning] = useState(false)
  const [, setTick] = useState(0)
  const animRef = useRef<number | null>(null)

  // Subscribe to param changes from outside
  useEffect(() => {
    if (!params) return
    const unsub = params.subscribe(() => {
      setParamValues(params.values())
    })
    return unsub
  }, [params])

  // Animation loop to update time display
  useEffect(() => {
    if (!time || !running) return
    const loop = () => {
      time.step()
      setTick(t => t + 1)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [time, running])

  const handleParamChange = useCallback((name: string, value: number) => {
    params?.get(name)?.set(value)
    setParamValues(prev => ({ ...prev, [name]: value }))
  }, [params])

  const handlePlay = useCallback(() => {
    time?.play()
    setRunning(true)
  }, [time])

  const handlePause = useCallback(() => {
    time?.pause()
    setRunning(false)
  }, [time])

  const handleReset = useCallback(() => {
    time?.reset()
    setRunning(false)
    setTick(0)
  }, [time])

  return (
    <Container data-testid="terasu-ui">
      <SpaceBetween size="m">
        {params && Array.from(params.params.entries()).map(([name, param]) => (
          <ParamSlider
            key={name}
            name={name}
            label={param.label}
            value={paramValues[name] ?? param.value}
            min={param.range[0]}
            max={param.range[1]}
            step={param.step}
            unit={param.unit}
            onChange={(v) => handleParamChange(name, v)}
          />
        ))}
        {time && (
          <PlaybackControls
            time={time}
            running={running}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
          />
        )}
      </SpaceBetween>
    </Container>
  )
}
