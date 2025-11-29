/**
 * Color Contrast Utilities - Open Source Core
 * 
 * This file contains safe, open-source implementations of WCAG 2.1
 * color contrast calculation algorithms. No proprietary logic is included.
 * 
 * Based on WCAG 2.1 guidelines:
 * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */

import tinycolor from "tinycolor2";

/**
 * Convert hex color to RGB values
 * @param hex - Hex color string (e.g., "#ffffff" or "ffffff")
 * @returns RGB object with r, g, b values (0-255)
 */
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

/**
 * Convert RGB to hex color string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string (e.g., "#ffffff")
 */
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

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 * 
 * @param hex - Hex color string
 * @returns Relative luminance (0-1, where 1 is brightest)
 */
const getRelativeLuminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  
  // Normalize RGB values to 0-1 range
  const normalize = (val: number) => val / 255;
  
  // Apply gamma correction (sRGB)
  const gammaCorrect = (val: number) => {
    const normalized = normalize(val);
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  
  const R = gammaCorrect(r);
  const G = gammaCorrect(g);
  const B = gammaCorrect(b);
  
  // Calculate relative luminance using WCAG formula
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter color and L2 is the darker color
 * 
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio (1-21, where 21 is maximum contrast)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const L1 = getRelativeLuminance(color1);
  const L2 = getRelativeLuminance(color2);
  
  // Ensure L1 is the lighter color
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  
  // Calculate contrast ratio
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG 2.1 Compliance Levels
 */
export const WCAG_LEVELS = {
  AA_NORMAL: 4.5,      // Minimum contrast for normal text (AA)
  AA_LARGE: 3.0,       // Minimum contrast for large text (AA)
  AAA_NORMAL: 7.0,     // Enhanced contrast for normal text (AAA)
  AAA_LARGE: 4.5,      // Enhanced contrast for large text (AAA)
} as const;

/**
 * Check WCAG 2.1 compliance for a color pair
 * 
 * @param textColor - Text color in hex format
 * @param backgroundColor - Background color in hex format
 * @returns Compliance object with boolean flags for each level
 */
export const checkCompliance = (
  textColor: string,
  backgroundColor: string
): {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
} => {
  const ratio = getContrastRatio(textColor, backgroundColor);
  
  return {
    ratio,
    aaNormal: ratio >= WCAG_LEVELS.AA_NORMAL,
    aaLarge: ratio >= WCAG_LEVELS.AA_LARGE,
    aaaNormal: ratio >= WCAG_LEVELS.AAA_NORMAL,
    aaaLarge: ratio >= WCAG_LEVELS.AAA_LARGE,
  };
};

/**
 * Suggest accessible color variations
 * This is a simple demo implementation - not a proprietary algorithm
 * 
 * @param baseColor - Base color to adjust
 * @param targetColor - Color to contrast against
 * @param minContrast - Minimum contrast ratio (default: 4.5 for AA)
 * @param maxSuggestions - Maximum number of suggestions (default: 5)
 * @returns Array of suggested hex colors
 */
export const suggestAccessibleColors = (
  baseColor: string,
  targetColor: string,
  minContrast: number = WCAG_LEVELS.AA_NORMAL,
  maxSuggestions: number = 5
): string[] => {
  const suggestions: string[] = [];
  const base = tinycolor(baseColor);
  
  // Try lighter variations
  for (let i = 1; i <= 20; i++) {
    const lighter = base.clone().brighten(i * 2).toHexString();
    if (getContrastRatio(lighter, targetColor) >= minContrast) {
      suggestions.push(lighter);
      if (suggestions.length >= maxSuggestions) break;
    }
  }
  
  // Try darker variations if we need more suggestions
  if (suggestions.length < maxSuggestions) {
    for (let i = 1; i <= 20; i++) {
      const darker = base.clone().darken(i * 2).toHexString();
      if (getContrastRatio(darker, targetColor) >= minContrast) {
        suggestions.push(darker);
        if (suggestions.length >= maxSuggestions) break;
      }
    }
  }
  
  return suggestions.slice(0, maxSuggestions);
};

/**
 * Get accessible text color for a given background
 * Returns white or black based on which provides better contrast
 * 
 * @param backgroundColor - Background color in hex format
 * @param minContrast - Minimum contrast ratio (default: 4.5)
 * @returns Hex color string for accessible text
 */
export const getAccessibleTextColor = (
  backgroundColor: string,
  minContrast: number = WCAG_LEVELS.AA_NORMAL
): string => {
  const white = "#FFFFFF";
  const black = "#000000";
  
  const whiteContrast = getContrastRatio(white, backgroundColor);
  const blackContrast = getContrastRatio(black, backgroundColor);
  
  // Return the color with better contrast that meets minimum
  if (whiteContrast >= minContrast && whiteContrast >= blackContrast) {
    return white;
  }
  
  if (blackContrast >= minContrast) {
    return black;
  }
  
  // If neither meets minimum, return the better one anyway
  return whiteContrast > blackContrast ? white : black;
};

