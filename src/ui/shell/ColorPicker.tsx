export interface ColorPickerProps {
  value: string
  presets: readonly string[]
  custom: string[]
  onPick: (hex: string) => void
  onAddCustom: (hex: string) => void
}

export function ColorPicker({ value, presets, custom, onPick, onAddCustom }: ColorPickerProps) {
  const norm = value.toLowerCase()
  const swatch = (hex: string) => (
    <button
      key={hex}
      type="button"
      className={hex.toLowerCase() === norm ? 'swatch selected' : 'swatch'}
      style={{ background: hex }}
      aria-label={`颜色 ${hex}`}
      onClick={() => onPick(hex)}
    />
  )
  return (
    <div className="color-picker">
      <div className="swatches">{presets.map(swatch)}</div>
      {custom.length > 0 && <div className="swatches">{custom.map(swatch)}</div>}
      <label className="swatch add-custom" aria-label="自定义颜色">
        ＋
        <input
          type="color"
          style={{ display: 'none' }}
          onChange={(e) => {
            const hex = e.target.value
            onAddCustom(hex)
            onPick(hex)
          }}
        />
      </label>
    </div>
  )
}
