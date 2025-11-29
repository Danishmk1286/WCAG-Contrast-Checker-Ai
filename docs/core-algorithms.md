# Core Algorithms Documentation

This document explains the core color contrast calculation algorithms used in this project.

## WCAG 2.1 Contrast Ratio Formula

The contrast ratio calculation follows the WCAG 2.1 specification exactly:

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
```

Where:
- `L1` is the relative luminance of the lighter color
- `L2` is the relative luminance of the darker color

## Relative Luminance Calculation

Relative luminance is calculated using the sRGB color space:

### Step 1: Normalize RGB Values

Convert RGB values (0-255) to normalized values (0-1):

```
R_normalized = R / 255
G_normalized = G / 255
B_normalized = B / 255
```

### Step 2: Apply Gamma Correction

Apply sRGB gamma correction:

```
if (R_normalized <= 0.03928)
  R_corrected = R_normalized / 12.92
else
  R_corrected = ((R_normalized + 0.055) / 1.055) ^ 2.4
```

Repeat for G and B.

### Step 3: Calculate Relative Luminance

```
L = 0.2126 * R_corrected + 0.7152 * G_corrected + 0.0722 * B_corrected
```

The coefficients (0.2126, 0.7152, 0.0722) represent the human eye's sensitivity to red, green, and blue light.

## WCAG Compliance Levels

### Level AA (Minimum)

- **Normal text** (< 18pt or < 14pt bold): Contrast ratio ≥ 4.5:1
- **Large text** (≥ 18pt or ≥ 14pt bold): Contrast ratio ≥ 3:1

### Level AAA (Enhanced)

- **Normal text**: Contrast ratio ≥ 7:1
- **Large text**: Contrast ratio ≥ 4.5:1

## Implementation Details

### Color Format Support

The implementation accepts hex color strings in the following formats:
- `#ffffff`
- `#fff`
- `ffffff`
- `fff`

All formats are normalized to full hex format (`#ffffff`) internally.

### Edge Cases

1. **Same color**: Returns contrast ratio of 1:1
2. **Maximum contrast** (black on white): Returns 21:1
3. **Invalid colors**: Returns default values (black/white)

## Algorithm Complexity

- **Time Complexity**: O(1) - constant time for a single calculation
- **Space Complexity**: O(1) - constant space

## References

- [WCAG 2.1 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [sRGB Color Space](https://www.w3.org/TR/css-color-3/#srgb)
- [Relative Luminance](https://www.w3.org/WAI/GL/wiki/Relative_luminance)

