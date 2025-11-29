# Component API Documentation

This document describes the React components available in this demo project.

## ColorSelector

A color picker component with basic suggestion functionality.

### Props

```typescript
interface ColorSelectorProps {
  label: string;              // Label for the color input
  value: string;              // Current color value (hex format)
  onChange: (color: string) => void;  // Callback when color changes
  otherColor?: string;        // Optional: other color for generating suggestions
}
```

### Example

```tsx
import { ColorSelector } from './components/ColorSelector';

<ColorSelector
  label="Text Color"
  value="#000000"
  onChange={(color) => setTextColor(color)}
  otherColor="#ffffff"
/>
```

### Features

- Color picker input
- Hex text input
- Simple algorithmic color suggestions (demo only)
- Accessible labels and ARIA attributes

## ContrastResults

Displays WCAG 2.1 compliance results for a color pair.

### Props

```typescript
interface ContrastResultsProps {
  textColor: string;          // Text color (hex format)
  backgroundColor: string;    // Background color (hex format)
}
```

### Example

```tsx
import { ContrastResults } from './components/ContrastResults';

<ContrastResults
  textColor="#000000"
  backgroundColor="#ffffff"
/>
```

### Features

- Contrast ratio display
- WCAG AA/AAA compliance badges
- Live preview of color combination
- Responsive design

## LivePreview

A preview component showing how colors look in UI elements.

### Props

```typescript
interface LivePreviewProps {
  textColor: string;          // Text color (hex format)
  backgroundColor: string;    // Background color (hex format)
}
```

### Example

```tsx
import { LivePreview } from './components/LivePreview';

<LivePreview
  textColor="#000000"
  backgroundColor="#ffffff"
/>
```

### Features

- Navigation header preview
- Card components
- Form elements
- Button states
- Responsive grid layout

## Usage Notes

### Color Format

All components expect colors in hex format:
- `#ffffff` (full format)
- `#fff` (short format)
- `ffffff` (without #)

### Styling

Components use Tailwind CSS classes and support dark mode via the `dark:` prefix.

### Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Semantic HTML
- Color contrast compliance

## Customization

Components can be customized by:
1. Modifying Tailwind classes
2. Adding custom CSS
3. Extending component props
4. Wrapping in custom containers

