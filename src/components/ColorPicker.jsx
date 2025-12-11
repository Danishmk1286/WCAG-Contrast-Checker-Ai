import { isValidHex } from '../utils/contrast';

export function ColorPicker({ label, color, onChange }) {
  const handleInputChange = (e) => {
    let value = e.target.value;
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    if (value.length <= 7) {
      onChange(value);
    }
  };

  return (
    <div className="color-picker">
      <label>{label}</label>
      <div className="color-input-group">
        <input
          type="color"
          value={isValidHex(color) ? color : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="color-swatch-input"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={color}
          onChange={handleInputChange}
          placeholder="#000000"
          maxLength={7}
          className="color-hex-input"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

