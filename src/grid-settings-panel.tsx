import Button from '@cloudscape-design/components/button'
import Toggle from '@cloudscape-design/components/toggle'
import Input from '@cloudscape-design/components/input'
import FormField from '@cloudscape-design/components/form-field'
import SpaceBetween from '@cloudscape-design/components/space-between'
import ExpandableSection from '@cloudscape-design/components/expandable-section'
import SegmentedControl from '@cloudscape-design/components/segmented-control'
import Box from '@cloudscape-design/components/box'
import type { GridSettings } from './grid-settings'

export interface GridSettingsPanelProps {
  settings: GridSettings
  onChange: (settings: GridSettings) => void
}

export function GridSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      iconName="settings"
      variant="icon"
      onClick={onClick}
      data-testid="grid-settings-btn"
      ariaLabel="Graph settings"
    />
  )
}

export function GridSettingsPanel({ settings, onChange }: GridSettingsPanelProps) {
  function update(partial: Partial<GridSettings>) {
    onChange({ ...settings, ...partial })
  }

  function updateXAxis(partial: Partial<GridSettings['xAxis']>) {
    onChange({ ...settings, xAxis: { ...settings.xAxis, ...partial } })
  }

  function updateYAxis(partial: Partial<GridSettings['yAxis']>) {
    onChange({ ...settings, yAxis: { ...settings.yAxis, ...partial } })
  }

  return (
    <SpaceBetween size="m" data-testid="grid-settings-panel">
      <SpaceBetween size="s">
        <Toggle
          checked={settings.showGrid}
          onChange={({ detail }) => update({ showGrid: detail.checked })}
          data-testid="toggle-grid"
        >
          Grid
        </Toggle>
        <Toggle
          checked={settings.showArrows}
          onChange={({ detail }) => update({ showArrows: detail.checked })}
          data-testid="toggle-arrows"
        >
          Arrows
        </Toggle>
        <Toggle
          checked={settings.showAxisNumbers}
          onChange={({ detail }) => update({ showAxisNumbers: detail.checked })}
          data-testid="toggle-axis-numbers"
        >
          Axis Numbers
        </Toggle>
        <Toggle
          checked={settings.showMinorGridlines}
          onChange={({ detail }) => update({ showMinorGridlines: detail.checked })}
          data-testid="toggle-minor-gridlines"
        >
          Minor Gridlines
        </Toggle>
      </SpaceBetween>

      <ExpandableSection headerText="X-Axis" data-testid="x-axis-section">
        <SpaceBetween size="s">
          <FormField label="Label">
            <Input
              value={settings.xAxis.label}
              onChange={({ detail }) => updateXAxis({ label: detail.value })}
              data-testid="x-axis-label"
            />
          </FormField>
          <FormField label={`${settings.xAxis.min} ≤ ${settings.xAxis.label} ≤ ${settings.xAxis.max}`}>
            <SpaceBetween direction="horizontal" size="xs">
              <Input
                type="number"
                value={String(settings.xAxis.min)}
                onChange={({ detail }) => updateXAxis({ min: parseFloat(detail.value) || 0 })}
                data-testid="x-axis-min"
              />
              <Box variant="span" color="text-status-inactive">to</Box>
              <Input
                type="number"
                value={String(settings.xAxis.max)}
                onChange={({ detail }) => updateXAxis({ max: parseFloat(detail.value) || 0 })}
                data-testid="x-axis-max"
              />
            </SpaceBetween>
          </FormField>
          <FormField label="Step">
            <Input
              type="number"
              value={settings.xAxis.step !== null ? String(settings.xAxis.step) : ''}
              placeholder="Auto"
              onChange={({ detail }) => updateXAxis({ step: detail.value ? parseFloat(detail.value) : null })}
              data-testid="x-axis-step"
            />
          </FormField>
          <SegmentedControl
            selectedId={settings.xAxis.scale}
            onChange={({ detail }) => updateXAxis({ scale: detail.selectedId as 'linear' | 'logarithmic' })}
            options={[
              { id: 'linear', text: 'Linear' },
              { id: 'logarithmic', text: 'Logarithmic' },
            ]}
            data-testid="x-axis-scale"
          />
        </SpaceBetween>
      </ExpandableSection>

      <ExpandableSection headerText="Y-Axis" data-testid="y-axis-section">
        <SpaceBetween size="s">
          <FormField label="Label">
            <Input
              value={settings.yAxis.label}
              onChange={({ detail }) => updateYAxis({ label: detail.value })}
              data-testid="y-axis-label"
            />
          </FormField>
          <FormField label={`${settings.yAxis.min} ≤ ${settings.yAxis.label} ≤ ${settings.yAxis.max}`}>
            <SpaceBetween direction="horizontal" size="xs">
              <Input
                type="number"
                value={String(settings.yAxis.min)}
                onChange={({ detail }) => updateYAxis({ min: parseFloat(detail.value) || 0 })}
                data-testid="y-axis-min"
              />
              <Box variant="span" color="text-status-inactive">to</Box>
              <Input
                type="number"
                value={String(settings.yAxis.max)}
                onChange={({ detail }) => updateYAxis({ max: parseFloat(detail.value) || 0 })}
                data-testid="y-axis-max"
              />
            </SpaceBetween>
          </FormField>
          <FormField label="Step">
            <Input
              type="number"
              value={settings.yAxis.step !== null ? String(settings.yAxis.step) : ''}
              placeholder="Auto"
              onChange={({ detail }) => updateYAxis({ step: detail.value ? parseFloat(detail.value) : null })}
              data-testid="y-axis-step"
            />
          </FormField>
          <SegmentedControl
            selectedId={settings.yAxis.scale}
            onChange={({ detail }) => updateYAxis({ scale: detail.selectedId as 'linear' | 'logarithmic' })}
            options={[
              { id: 'linear', text: 'Linear' },
              { id: 'logarithmic', text: 'Logarithmic' },
            ]}
            data-testid="y-axis-scale"
          />
        </SpaceBetween>
      </ExpandableSection>

      <Toggle
        checked={settings.lockViewport}
        onChange={({ detail }) => update({ lockViewport: detail.checked })}
        data-testid="toggle-lock-viewport"
      >
        Lock Viewport
      </Toggle>
    </SpaceBetween>
  )
}
