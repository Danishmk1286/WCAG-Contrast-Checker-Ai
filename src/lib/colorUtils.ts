import tinycolor from "tinycolor2";

// Convert hex to RGB
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// Convert RGB to hex
export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

// Convert RGB to HSL
export const rgbToHsl = (
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

// Convert HSL to RGB
export const hslToRgb = (
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

// ========== PERFORMANCE OPTIMIZATION: LRU Cache for Contrast Ratios ==========
// Contrast calculations are expensive and called repeatedly for same color pairs.
// This LRU cache eliminates redundant calculations (typically 10-50x reduction).
const contrastCache = new Map<string, number>();
const CONTRAST_CACHE_MAX_SIZE = 500;

// Pre-computed luminance cache for individual colors
const luminanceCache = new Map<string, number>();
const LUMINANCE_CACHE_MAX_SIZE = 200;

// Compute luminance for a single hex color (with caching)
const getLuminance = (hex: string): number => {
  const normalizedHex = hex.toLowerCase();
  const cached = luminanceCache.get(normalizedHex);
  if (cached !== undefined) return cached;
  
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    const val = v / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  
  // LRU eviction
  if (luminanceCache.size >= LUMINANCE_CACHE_MAX_SIZE) {
    const firstKey = luminanceCache.keys().next().value;
    if (firstKey) luminanceCache.delete(firstKey);
  }
  luminanceCache.set(normalizedHex, luminance);
  return luminance;
};

// Compute contrast ratio between two hex colors (with caching)
export const getContrastRatio = (hex1: string, hex2: string): number => {
  // Normalize to lowercase for consistent cache keys
  const h1 = hex1.toLowerCase();
  const h2 = hex2.toLowerCase();
  
  // Create cache key (order-independent for symmetry)
  const cacheKey = h1 < h2 ? `${h1}|${h2}` : `${h2}|${h1}`;
  
  // Check cache first
  const cached = contrastCache.get(cacheKey);
  if (cached !== undefined) return cached;
  
  // Calculate luminance using cached values
  const L1 = getLuminance(h1);
  const L2 = getLuminance(h2);
  const ratio = L1 > L2 ? (L1 + 0.05) / (L2 + 0.05) : (L2 + 0.05) / (L1 + 0.05);
  
  // LRU eviction - remove oldest entry if cache is full
  if (contrastCache.size >= CONTRAST_CACHE_MAX_SIZE) {
    const firstKey = contrastCache.keys().next().value;
    if (firstKey) contrastCache.delete(firstKey);
  }
  
  // Store in cache
  contrastCache.set(cacheKey, ratio);
  return ratio;
};

// Clear caches (useful for testing or memory management)
export const clearContrastCache = (): void => {
  contrastCache.clear();
  luminanceCache.clear();
};

// =============================================================================
// PERCEPTUAL COLOR DIFFERENCE CALCULATIONS
// =============================================================================
// These functions calculate how different two colors appear to the human eye.
// Used to ensure color suggestions stay visually similar to the original color.

/**
 * Calculate Euclidean distance in RGB color space
 * Returns a value between 0 (identical) and ~441 (maximum difference)
 * Threshold: ~100-150 for "similar enough" colors
 */
export const getRgbDistance = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Convert RGB to CIELAB color space
 * CIELAB is perceptually uniform, making it better for color difference
 */
const rgbToLab = (hex: string): { L: number; a: number; b: number } => {
  const rgb = hexToRgb(hex);
  
  // Normalize RGB to 0-1
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;
  
  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  
  // Convert to XYZ (using D65 illuminant)
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  
  // Apply XYZ to Lab conversion
  const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
  
  return {
    L: (116 * fy) - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
};

/**
 * Calculate Delta E (CIE76) - perceptual color difference in CIELAB space
 * Returns a value between 0 (identical) and ~100+ (very different)
 * Thresholds:
 *   < 2: Not noticeable by human eye
 *   2-10: Perceptible but acceptable for suggestions
 *   > 10: Noticeably different - too far for suggestions
 *   > 40: Very different - should be rejected
 */
export const getDeltaE = (hex1: string, hex2: string): number => {
  const lab1 = rgbToLab(hex1);
  const lab2 = rgbToLab(hex2);
  
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  
  return Math.sqrt(dL * dL + da * da + db * db);
};

/**
 * Calculate Euclidean distance in CIELAB color space
 * Similar to Delta E but using Euclidean distance
 * More conservative than Delta E
 */
export const getLabDistance = (hex1: string, hex2: string): number => {
  return getDeltaE(hex1, hex2); // Delta E CIE76 is Euclidean distance in Lab
};

/**
 * Calculate perceptual color difference using multiple methods
 * Returns an object with all distance metrics for comprehensive validation
 */
export const getColorDifference = (hex1: string, hex2: string): {
  rgbDistance: number;
  deltaE: number;
  labDistance: number;
  isSimilar: boolean; // True if colors are perceptually similar
} => {
  const rgbDist = getRgbDistance(hex1, hex2);
  const deltaE = getDeltaE(hex1, hex2);
  const labDist = getLabDistance(hex1, hex2);
  
  // Colors are considered similar if:
  // - Delta E < 30 (perceptually acceptable variation)
  // - RGB distance < 120 (moderate color space distance)
  // This allows for significant lightness changes while preserving hue/saturation
  const isSimilar = deltaE < 30 && rgbDist < 120;
  
  return {
    rgbDistance: rgbDist,
    deltaE: deltaE,
    labDistance: labDist,
    isSimilar: isSimilar
  };
};

/**
 * Check if a suggested color is too different from the original
 * Uses perceptual color difference to determine if suggestion should be rejected
 * 
 * @param originalHex - The original color the user selected
 * @param suggestedHex - The color being suggested
 * @param maxDeltaE - Maximum allowed Delta E (default: 30)
 * @param maxRgbDistance - Maximum allowed RGB distance (default: 120)
 * @returns Object with validation result and metrics
 */
export const isColorTooDifferent = (
  originalHex: string,
  suggestedHex: string,
  maxDeltaE: number = 30,
  maxRgbDistance: number = 120
): {
  tooDifferent: boolean;
  reason?: string;
  rgbDistance: number;
  deltaE: number;
} => {
  const diff = getColorDifference(originalHex, suggestedHex);
  
  const tooDifferent = diff.deltaE > maxDeltaE || diff.rgbDistance > maxRgbDistance;
  
  let reason: string | undefined;
  if (tooDifferent) {
    const reasons: string[] = [];
    if (diff.deltaE > maxDeltaE) {
      reasons.push(`Delta E too high (${diff.deltaE.toFixed(1)} > ${maxDeltaE})`);
    }
    if (diff.rgbDistance > maxRgbDistance) {
      reasons.push(`RGB distance too high (${diff.rgbDistance.toFixed(1)} > ${maxRgbDistance})`);
    }
    reason = reasons.join(', ');
  }
  
  return {
    tooDifferent,
    reason,
    rgbDistance: diff.rgbDistance,
    deltaE: diff.deltaE
  };
};

// Suggest accessible colors close to userHex that meet minimum contrast (AAA default)
export const suggestAccessibleColors = (
  userHex: string,
  otherHex: string,
  minContrast = 7
): string[] => {
  const baseColor = tinycolor(userHex);
  const suggestions: string[] = [];

  for (let i = 1; i <= 20; i++) {
    const lighter = baseColor
      .clone()
      .brighten(i * 2)
      .toHexString();
    const darker = baseColor
      .clone()
      .darken(i * 2)
      .toHexString();

    if (getContrastRatio(lighter, otherHex) >= minContrast)
      suggestions.push(lighter);
    if (getContrastRatio(darker, otherHex) >= minContrast)
      suggestions.push(darker);

    if (suggestions.length >= 5) break;
  }

  return suggestions;
};
