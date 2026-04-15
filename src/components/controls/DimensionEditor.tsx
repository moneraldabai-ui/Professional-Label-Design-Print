import { useLabelStore } from '../../store/useLabelStore'

function DimensionEditor() {
  const dimensions = useLabelStore((s) => s.dimensions)
  const setDimensions = useLabelStore((s) => s.setDimensions)
  const presetSizes = useLabelStore((s) => s.presetSizes)
  const applyPreset = useLabelStore((s) => s.applyPreset)

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value > 0 && value <= 300) {
      setDimensions({ width: value })
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value > 0 && value <= 300) {
      setDimensions({ height: value })
    }
  }

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10)
    if (index >= 0) {
      applyPreset(index)
    }
  }

  // Find current preset index (if dimensions match a preset)
  const currentPresetIndex = presetSizes.findIndex(
    (p) => p.width === dimensions.width && p.height === dimensions.height
  )

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-dark uppercase tracking-wide">
        Label Size
      </h2>

      {/* Preset Selector */}
      <div>
        <label className="label-text">Preset Sizes</label>
        <select
          className="input-field"
          value={currentPresetIndex >= 0 ? currentPresetIndex : ''}
          onChange={handlePresetChange}
        >
          {currentPresetIndex < 0 && (
            <option value="">Custom Size</option>
          )}
          {presetSizes.map((preset, index) => (
            <option key={index} value={index}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Manual Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text">Width (mm)</label>
          <input
            type="number"
            className="input-field font-mono"
            value={dimensions.width}
            onChange={handleWidthChange}
            min={10}
            max={300}
            step={1}
          />
        </div>
        <div>
          <label className="label-text">Height (mm)</label>
          <input
            type="number"
            className="input-field font-mono"
            value={dimensions.height}
            onChange={handleHeightChange}
            min={10}
            max={300}
            step={1}
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        Changes apply instantly to the preview
      </p>
    </section>
  )
}

export default DimensionEditor
