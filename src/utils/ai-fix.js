/**
 * AI Color Fix Utilities
 * Suggests accessible color alternatives with optional AI enhancement
 */

import { hexToRgb, rgbToHex, getContrastRatio, getRelativeLuminance } from './contrast';

/**
 * AI prompt template for color suggestions
 * Use this with your own AI API integration
 */
export const AI_PROMPT_TEMPLATE = `Given a foreground color {foreground} and background color {background} with contrast ratio {ratio}, suggest an accessible alternative that:
1. Meets WCAG 2.2 AA standard (4.5:1 minimum)
2. Preserves the original color's hue as much as possible
3. Returns only the hex color code`;


/**
 * Convert RGB to HSL
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Find a color with a specific target contrast ratio
 * Handles edge cases where foreground is at extreme lightness values
 * @param {string} foreground - Foreground hex color
 * @param {string} background - Background hex color
 * @param {number} targetRatio - Target contrast ratio
 * @returns {object} Color and ratio that achieves target (or closest possible)
 */
export function findColorForRatio(foreground, background, targetRatio) {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  const fgLum = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Get HSL of foreground to preserve hue
  const hsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);
  
  // Determine the best direction to search based on current luminance
  // For contrast, we want to move AWAY from the background luminance
  const currentRatio = getContrastRatio(foreground, background);
  
  // Determine if lightening or darkening will increase contrast
  // If foreground is lighter than background, go even lighter (or if at max, go darker)
  // If foreground is darker than background, go even darker (or if at min, go lighter)
  let shouldLighten;
  if (fgLum > bgLum) {
    // Foreground is lighter - try to go even lighter first
    shouldLighten = hsl.l < 95; // Only if there's room to go lighter
  } else {
    // Foreground is darker - try to go even darker first  
    shouldLighten = hsl.l > 95; // Go lighter only if we're already very light (edge case)
  }
  
  // If foreground is at an extreme, flip direction
  if (hsl.l >= 95) shouldLighten = false;
  if (hsl.l <= 5) shouldLighten = true;
  
  // Binary search for optimal lightness
  let low, high;
  if (shouldLighten) {
    low = hsl.l;
    high = 100;
  } else {
    low = 0;
    high = hsl.l;
  }
  
  // Ensure we have a valid range
  if (Math.abs(high - low) < 1) {
    // Flip direction if range is too small
    if (shouldLighten) {
      low = 0;
      high = hsl.l;
    } else {
      low = hsl.l;
      high = 100;
    }
  }
  
  let bestColor = foreground;
  let bestRatio = currentRatio;
  let bestDiff = Math.abs(currentRatio - targetRatio);
  
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const rgb = hslToRgb(hsl.h, hsl.s, mid);
    const testColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    const ratio = getContrastRatio(testColor, background);
    const diff = Math.abs(ratio - targetRatio);
    
    if (ratio >= 4.5 && diff < bestDiff) {
      bestColor = testColor;
      bestRatio = ratio;
      bestDiff = diff;
    }
    
    if (ratio < targetRatio) {
      // Need more contrast - move away from background
      if (shouldLighten) {
        low = mid; // Go lighter
      } else {
        high = mid; // Go darker
      }
    } else {
      // Have enough or too much contrast
      if (shouldLighten) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }
  
  return { color: bestColor, ratio: bestRatio };
}

/**
 * Smart fallback algorithm to find accessible color
 * Preserves hue while adjusting lightness for contrast
 * @param {string} foreground - Foreground hex color
 * @param {string} background - Background hex color
 * @param {number} targetRatio - Target contrast ratio (default 4.5 for AA)
 * @returns {string} Suggested accessible color
 */
export function findAccessibleColor(foreground, background, targetRatio = 4.5) {
  const result = findColorForRatio(foreground, background, targetRatio);
  return result.color;
}

/**
 * Generate multiple accessible color suggestions with varying contrast ratios
 * Provides 5-6 options ranging from minimum AA (4.5:1) to high contrast (16:1)
 * while preserving the original color's hue
 * @param {string} foreground - Foreground hex color (user's brand color)
 * @param {string} background - Background hex color
 * @returns {Array<{color: string, ratio: number, level: string}>} Array of suggestions
 */
export function generateSuggestions(foreground, background) {
  const suggestions = [];
  const seen = new Set();
  
  // Target ratios from minimum AA to high contrast
  const targetRatios = [
    { target: 4.5, level: 'AA' },      // Minimum AA
    { target: 5.5, level: 'AA' },      // Mid AA  
    { target: 7.0, level: 'AAA' },     // Minimum AAA
    { target: 9.0, level: 'AAA' },     // Good AAA
    { target: 12.0, level: 'AAA' },    // High contrast
    { target: 16.0, level: 'AAA' },    // Maximum contrast
  ];
  
  for (const { target } of targetRatios) {
    const result = findColorForRatio(foreground, background, target);
    
    if (result.ratio >= 4.5 && !seen.has(result.color)) {
      seen.add(result.color);
      suggestions.push({
        color: result.color,
        ratio: Math.round(result.ratio * 100) / 100,
        level: result.ratio >= 7 ? 'AAA' : 'AA'
      });
    }
  }
  
  // If we have fewer than 3 suggestions, try the opposite direction
  if (suggestions.length < 3) {
    const fgRgb = hexToRgb(foreground);
    const hsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);
    
    // Try different lightness values manually
    const lightnessValues = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    for (const l of lightnessValues) {
      if (suggestions.length >= 6) break;
      
      const rgb = hslToRgb(hsl.h, Math.max(hsl.s, 20), l);
      const testColor = rgbToHex(rgb.r, rgb.g, rgb.b);
      const ratio = getContrastRatio(testColor, background);
      
      if (ratio >= 4.5 && !seen.has(testColor)) {
        seen.add(testColor);
        suggestions.push({
          color: testColor,
          ratio: Math.round(ratio * 100) / 100,
          level: ratio >= 7 ? 'AAA' : 'AA'
        });
      }
    }
  }
  
  // If we still have fewer than 5 suggestions, add some hue variations
  if (suggestions.length < 5) {
    const fgRgb = hexToRgb(foreground);
    const hsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);
    const hueShifts = [-20, -10, 10, 20];
    
    for (const shift of hueShifts) {
      if (suggestions.length >= 6) break;
      
      const newHue = (hsl.h + shift + 360) % 360;
      const rgb = hslToRgb(newHue, hsl.s, hsl.l);
      const shiftedColor = rgbToHex(rgb.r, rgb.g, rgb.b);
      const result = findColorForRatio(shiftedColor, background, 4.5);
      
      if (result.ratio >= 4.5 && !seen.has(result.color)) {
        seen.add(result.color);
        suggestions.push({
          color: result.color,
          ratio: Math.round(result.ratio * 100) / 100,
          level: result.ratio >= 7 ? 'AAA' : 'AA'
        });
      }
    }
  }
  
  // Sort by contrast ratio
  suggestions.sort((a, b) => a.ratio - b.ratio);
  
  return suggestions.slice(0, 6);
}

/**
 * Optional: Call external AI API for suggestions
 * Configure VITE_AI_API_KEY and VITE_AI_API_URL in .env
 * Falls back to algorithmic suggestions if not configured
 * @param {string} foreground - Foreground hex color
 * @param {string} background - Background hex color
 * @returns {Promise<Array>} AI-generated suggestions
 */
export async function getAISuggestions(foreground, background) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const apiUrl = import.meta.env.VITE_AI_API_URL;
  
  // Fallback to algorithmic suggestions if no API configured
  if (!apiKey || !apiUrl) {
    return generateSuggestions(foreground, background);
  }
  
  try {
    const ratio = getContrastRatio(foreground, background);
    const prompt = AI_PROMPT_TEMPLATE
      .replace('{foreground}', foreground)
      .replace('{background}', background)
      .replace('{ratio}', ratio.toFixed(2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      throw new Error('AI API request failed');
    }
    
    const data = await response.json();
    const aiColor = data.choices?.[0]?.message?.content?.match(/#[A-Fa-f0-9]{6}/)?.[0];
    
    if (aiColor) {
      const aiRatio = getContrastRatio(aiColor, background);
      const baseSuggestions = generateSuggestions(foreground, background);
      return [
        { color: aiColor, ratio: Math.round(aiRatio * 100) / 100, level: aiRatio >= 7 ? 'AAA' : 'AA', source: 'AI' },
        ...baseSuggestions.filter(s => s.color !== aiColor)
      ].slice(0, 6);
    }
  } catch (error) {
    console.warn('AI suggestion failed, using fallback:', error.message);
  }
  
  return generateSuggestions(foreground, background);
}
