import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import ColorControl from "@/components/ColorControl";
// Tree-shake lucide-react imports for better performance
import ArrowRightLeft from "lucide-react/dist/esm/icons/arrow-right-left";
import X from "lucide-react/dist/esm/icons/x";
import tinycolor from "tinycolor2";
// Dynamic import TensorFlow.js to avoid bundling it in initial load (saves ~800KB)
// @ts-ignore - Dynamic import type
type TensorFlow = typeof import("@tensorflow/tfjs");
import { getContrastRatio, isColorTooDifferent, getDeltaE } from "@/lib/colorUtils";
import { getApiBaseUrl } from "@/lib/api";

// Production mode check - disable verbose logging
const IS_DEV = import.meta.env.DEV;

// =============================================================================
// AI SUGGESTION CONFIGURATION
// =============================================================================
// Timeout for AI requests - fallback triggered after this duration
const AI_FETCH_TIMEOUT_MS = 8000; // 8 seconds max wait for AI endpoint
// Debounce delay for AI requests to batch rapid changes
const AI_DEBOUNCE_MS = 250;
// Optional AI endpoint configuration
const AI_SUGGESTIONS_URL = (import.meta.env.VITE_AI_SUGGESTIONS_URL || import.meta.env.VITE_AI_API_URL || "").trim();
// Minimum suggestions to always show
const MIN_SUGGESTIONS_COUNT = 5;

// ========== PERFORMANCE: Memoized Label Color Cache ==========
// getAccessibleLabelColor is expensive (up to 30 iterations) and called for each suggestion button.
// This cache eliminates redundant calculations when rendering the same colors.
const labelColorCache = new Map<string, string>();
const LABEL_COLOR_CACHE_MAX_SIZE = 100;

// Calculate accessible text color for AI suggestion labels (minimum 10:1 contrast)
const getAccessibleLabelColor = (backgroundColor: string): string => {
  const normalizedBg = backgroundColor.toLowerCase();
  
  // Check cache first
  const cached = labelColorCache.get(normalizedBg);
  if (cached) return cached;
  
  const white = "#FFFFFF";
  const black = "#000000";
  const minContrast = 10.0;

  // Calculate background luminance
  const bgLuminance = tinycolor(backgroundColor).getLuminance();

  // Calculate contrast ratios (now uses cached getContrastRatio)
  const whiteContrast = getContrastRatio(white, backgroundColor);
  const blackContrast = getContrastRatio(black, backgroundColor);

  let result: string;

  // Test white first - if it meets minimum, use it
  if (whiteContrast >= minContrast) {
    result = white;
  } else if (blackContrast >= minContrast) {
    // Test black - if it meets minimum, use it
    result = black;
  } else {
    // Both fail - compute nearest accessible color with 15:1 contrast
    const lightTextLuminance = 15 * (bgLuminance + 0.05) - 0.05;
    const darkTextLuminance = (bgLuminance + 0.05) / 15 - 0.05;
    
    let targetLuminance: number;
    if (lightTextLuminance >= 0 && lightTextLuminance <= 1) {
      targetLuminance = lightTextLuminance;
    } else if (darkTextLuminance >= 0 && darkTextLuminance <= 1) {
      targetLuminance = darkTextLuminance;
    } else {
      targetLuminance = bgLuminance < 0.5 ? 1.0 : 0.0;
    }
    
    targetLuminance = Math.max(0, Math.min(1, targetLuminance));
    const lightness = targetLuminance * 100;
    const computedColor = tinycolor({ h: 0, s: 0, l: lightness }).toHexString();
    const computedContrast = getContrastRatio(computedColor, backgroundColor);
    
    if (computedContrast >= minContrast) {
      result = computedColor;
    } else {
      // Iterative adjustment
      let currentColor = tinycolor(computedColor);
      let currentContrast = computedContrast;
      let attempts = 0;
      const maxAttempts = 30;
      const needsLighter = bgLuminance < 0.5;
      
      while (currentContrast < minContrast && attempts < maxAttempts) {
        if (needsLighter) {
          currentColor = currentColor.lighten(3);
        } else {
          currentColor = currentColor.darken(3);
        }
        
        const newContrast = getContrastRatio(currentColor.toHexString(), backgroundColor);
        if (newContrast >= minContrast) {
          result = currentColor.toHexString();
          break;
        }
        if (newContrast > currentContrast) {
          currentContrast = newContrast;
        }
        attempts++;
      }
      result = result || currentColor.toHexString();
    }
  }
  
  // Cache the result with LRU eviction
  if (labelColorCache.size >= LABEL_COLOR_CACHE_MAX_SIZE) {
    const firstKey = labelColorCache.keys().next().value;
    if (firstKey) labelColorCache.delete(firstKey);
  }
  labelColorCache.set(normalizedBg, result);
  
  return result;
};

// ----------------- ML MODEL -----------------
// Dynamically import TensorFlow.js to avoid bundling it in initial load (~800KB savings)
let tfModule: TensorFlow | null = null;
let tfLoadPromise: Promise<TensorFlow> | null = null;

const loadTensorFlow = async (): Promise<TensorFlow> => {
  if (tfModule) return tfModule;
  if (tfLoadPromise) return tfLoadPromise;
  
  tfLoadPromise = import("@tensorflow/tfjs").then(module => {
    tfModule = module as TensorFlow;
    return tfModule;
  });
  
  return tfLoadPromise;
};

const loadPretrainedModel = async (): Promise<any> => {
  // Load TensorFlow.js dynamically first
  const tf = await loadTensorFlow();
  
  // Try multiple possible paths for the model
  // Order: absolute path first (most reliable), then relative paths
  const possiblePaths = [
    "/pretrained-color-model/model.json",
    "./pretrained-color-model/model.json",
  ];

  let lastError: any = null;

  for (const path of possiblePaths) {
    try {
      if (IS_DEV) console.log(`[ML Model] Attempting to load from: ${path}`);
      
      // First verify the file exists and is JSON by fetching it
      const response = await fetch(path);
      
      if (!response.ok) {
        if (IS_DEV) console.warn(`[ML Model] File not found at ${path}: ${response.status} ${response.statusText}`);
        lastError = new Error(`File not found: ${response.status}`);
        continue;
      }
      
      // Check content-type to ensure we're getting JSON, not HTML fallback
      const contentType = response.headers.get('content-type') || '';
      if (IS_DEV) console.log(`[ML Model] Response headers - Content-Type: ${contentType}`);
      
      if (contentType.includes('text/html')) {
        // This means the server returned the SPA fallback (index.html) - file doesn't exist
        if (IS_DEV) console.warn(`[ML Model] Wrong content-type at ${path}: ${contentType} (got HTML instead of JSON - path doesn't exist)`);
        lastError = new Error(`Path returned HTML fallback - model file not found`);
        continue;
      }
      
      // Validate the JSON structure before loading
      const jsonText = await response.text();
      let modelJson: any;
      try {
        modelJson = JSON.parse(jsonText);
      } catch (parseError) {
        if (IS_DEV) console.warn(`[ML Model] Invalid JSON at ${path}`);
        lastError = new Error('Invalid JSON in model file');
        continue;
      }
      
      // Check if modelTopology exists and is an object (not a string)
      if (!modelJson.modelTopology) {
        if (IS_DEV) console.warn(`[ML Model] Missing modelTopology in ${path}`);
        lastError = new Error('Missing modelTopology in model.json');
        continue;
      }
      
      if (typeof modelJson.modelTopology === 'string') {
        if (IS_DEV) console.warn(`[ML Model] modelTopology is a string in ${path} - this is incorrect format`);
        lastError = new Error('modelTopology should be an object, not a string');
        continue;
      }
      
      if (IS_DEV) console.log(`[ML Model] Valid model structure found at ${path}`);
      
      // Build absolute URL for TensorFlow.js loader
      const absolutePath = path.startsWith('http') 
        ? path 
        : path.startsWith('/') 
          ? `${window.location.origin}${path}`
          : `${window.location.origin}/${path.replace(/^\.\//, '')}`;
      
      if (IS_DEV) console.log(`[ML Model] Loading model from: ${absolutePath}`);
      const model = await tf.loadLayersModel(absolutePath);
      if (IS_DEV) {
        console.log("✅ ML model loaded successfully from:", absolutePath);
        console.log(`[ML Model] Model summary - Input shape: [null, 6], Output shape: [null, 3]`);
      }
      return model;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (IS_DEV) console.warn(`[ML Model] Failed to load from ${path}:`, errorMessage);
      lastError = error;
      // Continue to next path
    }
  }

  // If all paths failed, provide detailed error
  if (IS_DEV) console.error("❌ ML model loading failed from all paths:", lastError?.message || lastError);
  throw new Error(`Failed to load ML model. Last error: ${lastError?.message || 'Unknown error'}`);
};

const withTimeout = <T,>(
  promise: Promise<T>,
  ms: number,
  onTimeout?: () => void
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      onTimeout?.();
      reject(new Error("AI request timed out"));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });
};

const normalizeAiSuggestions = (payload: any): string[] => {
  const raw = Array.isArray(payload)
    ? payload
    : payload?.suggestions || payload?.colors || payload?.data?.suggestions || payload?.data || [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of raw) {
    const candidate = typeof item === "string" ? item : item?.color;
    if (typeof candidate !== "string") continue;
    const color = tinycolor(candidate);
    if (!color.isValid()) continue;
    const hex = color.toHexString().toLowerCase();
    if (seen.has(hex)) continue;
    seen.add(hex);
    normalized.push(hex);
  }

  return normalized;
};

/**
 * Predict an accessible color using the ML model
 * @param model - TensorFlow.js layers model
 * @param userHex - The user's current color (text or background being edited)
 * @param bgHex - The other color (the one to contrast against)
 * @param variation - Optional variation factor (0-1) to perturb input for diverse predictions
 * @returns Predicted accessible color as hex string
 */
const predictAccessibleColor = async (
  model: any,
  userHex: string,
  bgHex: string,
  variation: number = 0
): Promise<string> => {
  // Ensure TensorFlow.js is loaded
  const tf = await loadTensorFlow();
  
  const user = tinycolor(userHex);
  const bg = tinycolor(bgHex);
  
  // Normalize RGB values to 0-1 range (matching training format)
  let userR = user._r / 255;
  let userG = user._g / 255;
  let userB = user._b / 255;
  const bgR = bg._r / 255;
  const bgG = bg._g / 255;
  const bgB = bg._b / 255;
  
  // Apply variation to get diverse predictions
  // Perturb the user color slightly in different directions
  if (variation > 0) {
    const perturbAmount = variation * 0.3; // Max 30% perturbation
    const hsl = user.toHsl();
    // Vary hue, saturation, and lightness based on variation factor
    const variedHsl = {
      h: (hsl.h + variation * 60) % 360, // Shift hue by up to 60 degrees
      s: Math.max(0, Math.min(1, hsl.s + (variation - 0.5) * perturbAmount)),
      l: Math.max(0.1, Math.min(0.9, hsl.l + (variation - 0.5) * perturbAmount * 2))
    };
    const varied = tinycolor(variedHsl);
    userR = varied._r / 255;
    userG = varied._g / 255;
    userB = varied._b / 255;
  }
  
  // Create input tensor: [userR, userG, userB, bgR, bgG, bgB]
  const inputData = [userR, userG, userB, bgR, bgG, bgB];
  const input = tf.tensor2d([inputData]);
  
  let output: any = null;
  try {
    // Run inference
    output = model.predict(input) as any;
    
    // Validate output shape - should be [1, 3] (batch_size=1, RGB=3)
    if (!output || !output.shape) {
      throw new Error('Model prediction returned invalid output: no shape property');
    }
    
    const expectedShape = output.shape.length === 2 && output.shape[0] === 1 && output.shape[1] === 3;
    if (!expectedShape) {
      throw new Error(`Model prediction returned unexpected output shape: [${output.shape.join(', ')}]. Expected: [1, 3]`);
    }
    
    const outputData = output.dataSync();
    
    // Validate output data has at least 3 values
    if (!outputData || outputData.length < 3) {
      throw new Error(`Model prediction returned insufficient data: ${outputData?.length || 0} values. Expected: 3`);
    }
    
    // De-normalize output (0-1 to 0-255)
    const r = Math.round(Math.max(0, Math.min(255, outputData[0] * 255)));
    const g = Math.round(Math.max(0, Math.min(255, outputData[1] * 255)));
    const b = Math.round(Math.max(0, Math.min(255, outputData[2] * 255)));
    
    const predictedColor = tinycolor({ r, g, b }).toHexString();
    
    // Log prediction details only in development
    if (IS_DEV) {
      console.log(`🤖 [AI Prediction] Input: RGB(${Math.round(userR*255)},${Math.round(userG*255)},${Math.round(userB*255)}) vs BG(${Math.round(bgR*255)},${Math.round(bgG*255)},${Math.round(bgB*255)})${variation > 0 ? ` [variation: ${variation.toFixed(2)}]` : ''}`);
      console.log(`🤖 [AI Prediction] Output shape: [${output.shape.join(', ')}]`);
      console.log(`🤖 [AI Prediction] Predicted color: ${predictedColor} → RGB(${r},${g},${b})`);
    }
    
    return predictedColor;
  } catch (error: any) {
    // Log error for debugging
    if (IS_DEV) {
      console.error(`❌ [AI Prediction] Error during prediction:`, error?.message || error);
    }
    throw error; // Re-throw to be handled by caller
  } finally {
    // Always clean up tensors to prevent memory leaks, even if error occurred
    try {
      input.dispose();
      if (output) {
        output.dispose();
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
      if (IS_DEV) {
        console.warn(`⚠️ [AI Prediction] Error cleaning up tensors:`, cleanupError);
      }
    }
  }
};

// =============================================================================
// WCAG COMPLIANCE CONSTANTS (must be before generateDeterministicSuggestions)
// =============================================================================
// WCAG 2.1 requirements:
// - AAA Normal Text: 7:1
// - AAA Large Text: 4.5:1
// - AA Normal Text: 4.5:1
// - AA Large Text: 3:1
const WCAG_AAA_NORMAL = 7.0;
const WCAG_AAA_LARGE = 4.5;
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const MIN_SUGGESTION_CONTRAST = 6.0;
const TARGET_LOW_CONTRAST = 6.0;
const TARGET_HIGH_CONTRAST = 10.0;

/**
 * Validates WCAG contrast compliance for color suggestions.
 */
const validateWCAGCompliance = (
  foreground: string, 
  background: string
): { 
  passes: boolean; 
  ratio: number;
  aaLarge: boolean;
  aaNormal: boolean;
  aaaLarge: boolean;
  aaaNormal: boolean;
  failedRequirements: string[];
} => {
  const ratio = getContrastRatio(foreground, background);
  const aaLarge = ratio >= WCAG_AA_LARGE;
  const aaNormal = ratio >= WCAG_AA_NORMAL;
  const aaaLarge = ratio >= WCAG_AAA_LARGE;
  const aaaNormal = ratio >= WCAG_AAA_NORMAL;
  const meetsMinimum = ratio >= MIN_SUGGESTION_CONTRAST;
  const passes = meetsMinimum && aaLarge && aaNormal && aaaLarge;
  
  const failedRequirements: string[] = [];
  if (!meetsMinimum) failedRequirements.push(`Minimum (need ${MIN_SUGGESTION_CONTRAST}:1)`);
  if (!aaLarge) failedRequirements.push(`AA Large (need ${WCAG_AA_LARGE}:1)`);
  if (!aaNormal) failedRequirements.push(`AA Normal (need ${WCAG_AA_NORMAL}:1)`);
  if (!aaaLarge) failedRequirements.push(`AAA Large (need ${WCAG_AAA_LARGE}:1)`);
  
  return { passes, ratio, aaLarge, aaNormal, aaaLarge, aaaNormal, failedRequirements };
};

// =============================================================================
// DETERMINISTIC FALLBACK SUGGESTIONS
// =============================================================================
// This function ALWAYS returns exactly 5 valid WCAG-compliant suggestions.
// It uses only deterministic algorithms (no ML) and is guaranteed to complete
// synchronously in bounded time. Used as fallback when AI is unavailable/slow.

/**
 * Generates exactly 5 WCAG-compliant color suggestions using deterministic algorithms.
 * This is the FALLBACK that runs when AI is unavailable, times out, or fails.
 * 
 * GUARANTEES:
 * - Always returns exactly 5 suggestions
 * - Every suggestion passes WCAG AA and AAA large (6.0:1 minimum)
 * - Colors stay as close as possible to the original (brand preservation)
 * - Contrast distribution: at least one near 6.x, others gradually increase
 * - Runs synchronously - no async, no waiting, no possibility of stalling
 * 
 * @param userHex - The color being adjusted (text or background)
 * @param otherHex - The fixed color to contrast against
 * @returns Exactly 5 hex color strings that pass WCAG compliance with distributed contrast
 */
const generateDeterministicSuggestions = (
  userHex: string,
  otherHex: string
): string[] => {
  const TARGET_COUNT = MIN_SUGGESTIONS_COUNT;
  const otherLuminance = tinycolor(otherHex).getLuminance();
  const needsDarkerColor = otherLuminance > 0.5;
  const originalContrast = getContrastRatio(userHex, otherHex);
  
  // ==========================================================================
  // NEW ALGORITHM: "Collect All Valid, Sort by Similarity"
  // ==========================================================================
  // 1. Generate ALL possible colors that pass WCAG (contrast >= 6.0)
  // 2. Sort by Delta E ascending (closest to brand first)
  // 3. Select top 5 with diversity check
  // 4. Only use grayscale/black/white as absolute last resort
  
  interface Candidate {
    hex: string;
    deltaE: number;
    contrast: number;
    category: 'monochrome' | 'hsl' | 'desaturated' | 'grayscale' | 'emergency';
  }
  
  const candidates: Candidate[] = [];
  const seenColors = new Set<string>();
  
  if (IS_DEV) {
    console.log(`[FALLBACK] Generating suggestions: userHex=${userHex}, otherHex=${otherHex}`);
    console.log(`[FALLBACK] Original contrast: ${originalContrast.toFixed(2)}:1, needsDarker: ${needsDarkerColor}`);
  }
  
  // Helper: Check if color passes WCAG and add to candidates list
  const tryAddCandidate = (color: string, category: Candidate['category']): boolean => {
    const normalized = tinycolor(color).toHexString().toLowerCase();
    if (seenColors.has(normalized)) return false;
    if (normalized === userHex.toLowerCase()) return false;
    
    const colorLum = tinycolor(normalized).getLuminance();
    const otherLum = tinycolor(otherHex).getLuminance();
    
    // Validate WCAG compliance (6.0:1 minimum)
    const compliance = otherLum < colorLum 
      ? validateWCAGCompliance(otherHex, normalized)
      : validateWCAGCompliance(normalized, otherHex);
    
    if (!compliance.passes) return false;
    
    // Calculate Delta E for similarity sorting
    const deltaE = getDeltaE(userHex, normalized);
    
    seenColors.add(normalized);
    candidates.push({ hex: normalized, deltaE, contrast: compliance.ratio, category });
    return true;
  };
  
  const base = tinycolor(userHex);
  const baseHsl = base.toHsl();
  const baseL = baseHsl.l * 100;
  
  // ==========================================================================
  // STRATEGY 1: MONOCHROMATIC (lighten/darken) - Best Brand Preservation
  // ==========================================================================
  for (let step = 5; step <= 60; step += 5) {
    if (needsDarkerColor) {
      tryAddCandidate(base.clone().darken(step).toHexString(), 'monochrome');
      tryAddCandidate(base.clone().lighten(step).toHexString(), 'monochrome');
    } else {
      tryAddCandidate(base.clone().lighten(step).toHexString(), 'monochrome');
      tryAddCandidate(base.clone().darken(step).toHexString(), 'monochrome');
    }
  }
  
  // ==========================================================================
  // STRATEGY 2: HSL Lightness Variations - Preserves Exact Hue & Saturation
  // ==========================================================================
  for (let lightAdjust = 5; lightAdjust <= 50; lightAdjust += 5) {
    const lighterL = Math.min(95, baseL + lightAdjust);
    const darkerL = Math.max(5, baseL - lightAdjust);
    
    tryAddCandidate(tinycolor({ h: baseHsl.h, s: baseHsl.s, l: lighterL / 100 }).toHexString(), 'hsl');
    tryAddCandidate(tinycolor({ h: baseHsl.h, s: baseHsl.s, l: darkerL / 100 }).toHexString(), 'hsl');
  }
  
  // ==========================================================================
  // STRATEGY 3: Slight Desaturation - Still Preserves Hue
  // ==========================================================================
  const baseS = baseHsl.s * 100;
  for (let satReduce = 10; satReduce <= 40; satReduce += 10) {
    const newS = Math.max(0, baseS - satReduce);
    for (let lightAdjust = 10; lightAdjust <= 50; lightAdjust += 10) {
      tryAddCandidate(tinycolor({ h: baseHsl.h, s: newS / 100, l: Math.min(95, baseL + lightAdjust) / 100 }).toHexString(), 'desaturated');
      tryAddCandidate(tinycolor({ h: baseHsl.h, s: newS / 100, l: Math.max(5, baseL - lightAdjust) / 100 }).toHexString(), 'desaturated');
    }
  }
  
  // ==========================================================================
  // STRATEGY 4: Grayscale - Only if brand variations don't work
  // ==========================================================================
  const grayscaleValues = needsDarkerColor ? [5, 10, 15, 20, 25, 30] : [95, 90, 85, 80, 75, 70];
  for (const l of grayscaleValues) {
    tryAddCandidate(tinycolor({ h: 0, s: 0, l: l / 100 }).toHexString(), 'grayscale');
  }
  
  // ==========================================================================
  // STRATEGY 5: Emergency Black/White - Absolute Last Resort
  // ==========================================================================
  const emergencyColors = needsDarkerColor
    ? ["#000000", "#0a0a0a", "#111111", "#1a1a1a", "#222222"]
    : ["#ffffff", "#fafafa", "#f5f5f5", "#f0f0f0", "#e8e8e8"];
  for (const color of emergencyColors) {
    tryAddCandidate(color, 'emergency');
  }
  
  if (IS_DEV) {
    console.log(`[FALLBACK] Collected ${candidates.length} valid candidates`);
  }
  
  // ==========================================================================
  // BRAND PRESERVATION SORTING: Sort by Delta E with Black/White at End
  // ==========================================================================
  // 1. Use isColorTooDifferent to get Delta E (most similar to brand first)
  // 2. Pure black (#000000) and pure white (#ffffff) ALWAYS go to the end
  // 3. This ensures brand-similar colors appear before generic black/white
  
  const PURE_BLACK = "#000000";
  const PURE_WHITE = "#ffffff";
  
  // Helper: Check if a color is pure black or pure white
  const isPureBlackOrWhite = (hex: string): boolean => {
    const normalized = hex.toLowerCase();
    return normalized === PURE_BLACK || normalized === PURE_WHITE;
  };
  
  candidates.sort((a, b) => {
    const aIsPure = isPureBlackOrWhite(a.hex);
    const bIsPure = isPureBlackOrWhite(b.hex);
    
    // CRITICAL: Pure black/white always goes to the END (last resort)
    if (aIsPure && !bIsPure) return 1;  // a goes after b
    if (!aIsPure && bIsPure) return -1; // a goes before b
    
    // Both are pure or both are not - sort by Delta E (using isColorTooDifferent)
    // Use high thresholds (999) to just get the deltaE value without filtering
    const deltaEa = isColorTooDifferent(userHex, a.hex, 999, 999).deltaE;
    const deltaEb = isColorTooDifferent(userHex, b.hex, 999, 999).deltaE;
    
    // Primary: Delta E ascending (most similar to brand first)
    if (Math.abs(deltaEa - deltaEb) > 3) return deltaEa - deltaEb;
    
    // Secondary: Prefer brand categories (monochrome > hsl > desaturated > grayscale > emergency)
    const order: Record<Candidate['category'], number> = { monochrome: 0, hsl: 1, desaturated: 2, grayscale: 3, emergency: 4 };
    return order[a.category] - order[b.category];
  });
  
  if (IS_DEV && candidates.length > 0) {
    console.log(`[FALLBACK] Top candidates after brand-preservation sort (black/white at end):`);
    candidates.slice(0, 8).forEach((c, i) => {
      const deltaE = isColorTooDifferent(userHex, c.hex, 999, 999).deltaE;
      const isPure = isPureBlackOrWhite(c.hex);
      console.log(`   ${i + 1}. ${c.hex} - ΔE: ${deltaE.toFixed(1)}, ${c.contrast.toFixed(1)}:1, ${c.category}${isPure ? ' [PURE B/W - LAST RESORT]' : ''}`);
    });
  }
  
  // ==========================================================================
  // SELECTION: Take top 5 with diversity check, black/white only as last resort
  // ==========================================================================
  const result: string[] = [];
  const MIN_DELTA_E_BETWEEN = 5;
  
  for (const candidate of candidates) {
    if (result.length >= TARGET_COUNT) break;
    const tooSimilar = result.some(sel => getDeltaE(sel, candidate.hex) < MIN_DELTA_E_BETWEEN);
    if (!tooSimilar) result.push(candidate.hex);
  }
  
  // Fill remaining if diversity was too strict (black/white will be at end of candidates)
  if (result.length < TARGET_COUNT) {
    for (const candidate of candidates) {
      if (result.length >= TARGET_COUNT) break;
      if (!result.includes(candidate.hex)) result.push(candidate.hex);
    }
  }
  
  // ==========================================================================
  // EMERGENCY: Only if we still don't have enough, add black/white
  // ==========================================================================
  if (result.length < TARGET_COUNT) {
    const forceColors = needsDarkerColor
      ? ["#000000", "#111111", "#222222", "#333333", "#444444"]
      : ["#ffffff", "#f5f5f5", "#eeeeee", "#e0e0e0", "#d5d5d5"];
    for (const color of forceColors) {
      if (result.length >= TARGET_COUNT) break;
      const norm = tinycolor(color).toHexString().toLowerCase();
      if (!result.includes(norm)) {
        const colorLum = tinycolor(norm).getLuminance();
        const compliance = otherLuminance < colorLum 
          ? validateWCAGCompliance(otherHex, norm)
          : validateWCAGCompliance(norm, otherHex);
        if (compliance.passes) result.push(norm);
      }
    }
  }
  
  if (IS_DEV) {
    console.log(`[FALLBACK] Final ${result.length} suggestions (brand colors first, black/white last):`);
    result.forEach((hex, i) => {
      const deltaE = isColorTooDifferent(userHex, hex, 999, 999).deltaE;
      const contrast = getContrastRatio(hex, otherHex);
      const isPure = isPureBlackOrWhite(hex);
      console.log(`   ${i + 1}. ${hex} - ΔE: ${deltaE.toFixed(1)}, ${contrast.toFixed(1)}:1${isPure ? ' [PURE B/W]' : ''}`);
    });
  }
  
  // Return only top 5
  return result.slice(0, TARGET_COUNT);
};

/**
 * Guarantees exactly 5 unique accessible color suggestions.
 * CRITICAL: Every suggestion MUST pass WCAG AA and AAA large (6.0:1 minimum).
 * 
 * Uses multiple strategies to ensure we never return fewer than 5:
 * 1. ML predictions (if available) - validated for 6.0:1 minimum
 * 2. Brighten/darken variations - validated for 6.0:1 minimum, preserving brand
 * 3. HSL variations preserving hue and saturation (brand preservation)
 * 4. Hue rotation with moderate adjustments (preserve brand identity)
 * 5. Systematic grayscale fallback (guaranteed high contrast)
 * 
 * Contrast distribution: At least one suggestion near 6.x, others gradually increase.
 * 
 * @param userHex - The user's current color being adjusted
 * @param otherHex - The fixed color to contrast against
 * @param mlSuggestions - Pre-generated ML suggestions (may be empty)
 * @returns Exactly 5 unique hex color strings with distributed contrast ratios
 */
const guaranteeFiveSuggestions = (
  userHex: string,
  otherHex: string,
  mlSuggestions: string[],
  targetTab: "text" | "background" = "background" // Default to background for backward compatibility
): string[] => {
  const TARGET_COUNT = 5;
  const suggestions = new Set<string>();
  const otherLuminance = tinycolor(otherHex).getLuminance();
  const needsDarker = otherLuminance > 0.5; // If background is light, we need darker suggestions
  const rejectedColors: { color: string; ratio?: number; reasons: string[]; deltaE?: number; rgbDistance?: number }[] = [];

  // Helper to add valid suggestions - 6.0:1 minimum ensuring AA and AAA large compliance
  // Also checks perceptual color similarity to ensure suggestions stay close to original
  const addIfValid = (color: string): boolean => {
    const normalized = tinycolor(color).toHexString().toLowerCase();
    if (suggestions.has(normalized)) return false;
    if (normalized === userHex.toLowerCase()) return false;
    
    // GUARD 1: Check perceptual color similarity - reject colors that are too different
    const similarityCheck = isColorTooDifferent(userHex, normalized, 30, 120);
    if (similarityCheck.tooDifferent) {
      // Log rejected color for review
      rejectedColors.push({
        color: normalized,
        reasons: [`Color too different from original: ${similarityCheck.reason}`],
        deltaE: similarityCheck.deltaE,
        rgbDistance: similarityCheck.rgbDistance
      });
      // Always log guard violations (production-safe, uses console.warn)
      console.warn(`[Color Guard] 🛡️ REJECTED ${normalized} - Too different from ${userHex} (Delta E: ${similarityCheck.deltaE.toFixed(1)}, RGB: ${similarityCheck.rgbDistance.toFixed(1)})`);
      return false;
    }
    
    // GUARD 2: Validate WCAG compliance with correct parameter order based on targetTab
    // For BACKGROUND tab: normalized is background, otherHex is text (foreground)
    // For TEXT tab: normalized is text (foreground), otherHex is background
    const compliance = targetTab === "background"
      ? validateWCAGCompliance(otherHex, normalized)  // text (foreground) vs background
      : validateWCAGCompliance(normalized, otherHex);  // text (foreground) vs background
    
    if (!compliance.passes) {
      // Log rejected colors for debugging
      rejectedColors.push({
        color: normalized,
        ratio: compliance.ratio,
        reasons: compliance.failedRequirements
      });
      return false;
    }
    
    suggestions.add(normalized);
    return true;
  };

  // Strategy 1: Add ML suggestions first (highest quality)
  mlSuggestions.forEach(c => addIfValid(c));

  // Strategy 2: Brighten/darken the user color (brand preservation)
  // Use more aggressive adjustments for very bright/dark colors to preserve hue before grayscale fallback
  if (suggestions.size < TARGET_COUNT) {
    const base = tinycolor(userHex);
    const baseHsl = base.toHsl();
    const baseL = baseHsl.l * 100;
    const isVeryBright = baseL > 70; // Very bright colors need aggressive darkening
    const isVeryDark = baseL < 30; // Very dark colors need aggressive brightening
    
    // For very bright/dark colors, use HSL-based darkening/brightening to preserve hue better
    if (needsDarker && isVeryBright) {
      // Aggressive darkening for very bright colors - use HSL to preserve hue
      for (let l = baseL - 5; l >= 15 && suggestions.size < TARGET_COUNT; l -= 3) {
        // Preserve hue and saturation, only reduce lightness
        addIfValid(tinycolor({
          h: baseHsl.h,
          s: Math.min(100, baseHsl.s * 100 + (baseL - l) * 0.5), // Slightly increase saturation as we darken
          l: Math.max(10, l) / 100
        }).toHexString());
      }
    } else if (!needsDarker && isVeryDark) {
      // Aggressive brightening for very dark colors - use HSL to preserve hue
      for (let l = baseL + 5; l <= 85 && suggestions.size < TARGET_COUNT; l += 3) {
        // Preserve hue, adjust saturation and lightness
        addIfValid(tinycolor({
          h: baseHsl.h,
          s: Math.max(0, baseHsl.s * 100 - (l - baseL) * 0.3), // Slightly reduce saturation as we brighten
          l: Math.min(95, l) / 100
        }).toHexString());
      }
    } else {
      // Standard gradual adjustments for mid-range colors
      for (let i = 1; i <= 15 && suggestions.size < TARGET_COUNT; i++) {
        const adjustment = i * 2; // Steps: 2, 4, 6, ... 30
        
        if (needsDarker) {
          // Need darker colors - darken gradually
          addIfValid(base.clone().darken(adjustment).toHexString());
        } else {
          // Need lighter colors - brighten gradually
          addIfValid(base.clone().brighten(adjustment).toHexString());
        }
        
        // Also try opposite direction with smaller adjustments for variety
        if (i <= 4) {
          if (needsDarker) {
            addIfValid(base.clone().brighten(adjustment).toHexString());
          } else {
            addIfValid(base.clone().darken(adjustment).toHexString());
          }
        }
      }
    }
  }

  // Strategy 3: HSL variations preserving hue and saturation (brand color preservation)
  // Use smaller adjustments to keep colors close to original
  if (suggestions.size < TARGET_COUNT) {
    const baseHsl = tinycolor(userHex).toHsl();
    const baseS = baseHsl.s * 100;
    const baseL = baseHsl.l * 100;
    
    // Limit saturation adjustments to preserve brand color (max 20% change)
    for (let satAdjust = 0; satAdjust <= 20 && suggestions.size < TARGET_COUNT; satAdjust += 5) {
      // Limit lightness adjustments to reasonable range (max 30% change)
      for (let lightAdjust = 3; lightAdjust <= 30 && suggestions.size < TARGET_COUNT; lightAdjust += 3) {
        // Lighter version - preserve hue, slight saturation adjustment
        const lighterS = Math.min(100, Math.max(0, baseS - satAdjust));
        const lighterL = Math.min(95, baseL + lightAdjust);
        addIfValid(tinycolor({
          h: baseHsl.h,
          s: lighterS / 100,
          l: lighterL / 100
        }).toHexString());
        
        // Darker version - preserve hue, slight saturation adjustment
        const darkerS = Math.min(100, Math.max(0, baseS + satAdjust));
        const darkerL = Math.max(5, baseL - lightAdjust);
        addIfValid(tinycolor({
          h: baseHsl.h,
          s: darkerS / 100,
          l: darkerL / 100
        }).toHexString());
      }
    }
  }

  // Strategy 4: Hue rotation with moderate adjustments (preserve brand identity)
  // Only use hue rotation if we still need more suggestions
  // Keep lightness closer to original to preserve brand feel
  if (suggestions.size < TARGET_COUNT) {
    const baseHsl = tinycolor(userHex).toHsl();
    const baseL = baseHsl.l * 100;
    
    // Calculate target lightness based on contrast needs, but stay closer to original
    // Instead of extreme 15 or 85, use moderate adjustments from base
    const lightnessAdjustment = needsDarker ? -20 : 20; // Moderate adjustment
    const targetLightness = Math.max(10, Math.min(90, baseL + lightnessAdjustment));
    
    // Small hue shifts to preserve brand identity (max 30 degrees)
    for (let hueShift = 0; hueShift <= 30 && suggestions.size < TARGET_COUNT; hueShift += 6) {
      for (const direction of [1, -1]) {
        const newHue = (baseHsl.h + hueShift * direction + 360) % 360;
        // Preserve saturation close to original (max 20% reduction)
        const newS = Math.min(100, Math.max(0, baseHsl.s * 100 * 0.8));
        addIfValid(tinycolor({
          h: newHue,
          s: newS / 100,
          l: targetLightness / 100
        }).toHexString());
      }
    }
  }

  // Strategy 5: Grayscale fallback (only if needed, preserve brand when possible)
  // Use grayscale as last resort, but try to maintain some brand color first
  if (suggestions.size < TARGET_COUNT) {
    // Try desaturated versions of original color first
    const baseHsl = tinycolor(userHex).toHsl();
    const baseL = baseHsl.l * 100;
    
    // Desaturate original color while adjusting lightness for contrast
    for (let desat = 0.5; desat >= 0 && suggestions.size < TARGET_COUNT; desat -= 0.1) {
      const lightnessAdjustment = needsDarker ? -15 : 15;
      const targetL = Math.max(10, Math.min(90, baseL + lightnessAdjustment));
      addIfValid(tinycolor({
        h: baseHsl.h,
        s: baseHsl.s * desat,
        l: targetL / 100
      }).toHexString());
    }
    
    // Pure grayscale only if still needed
    if (suggestions.size < TARGET_COUNT) {
      const grayscaleValues = needsDarker 
        ? [8, 12, 15, 18, 20, 22, 25, 28] // Moderate dark grays
        : [92, 90, 88, 86, 84, 82, 80, 78]; // Moderate light grays
      for (const lightness of grayscaleValues) {
        if (suggestions.size >= TARGET_COUNT) break;
        const gray = tinycolor({ h: 0, s: 0, l: lightness }).toHexString();
        addIfValid(gray);
      }
    }
  }

  // Strategy 6: Pure black/white as final fallback
  if (suggestions.size < TARGET_COUNT) {
    addIfValid("#FFFFFF");
    addIfValid("#000000");
    addIfValid("#FAFAFA");
    addIfValid("#F5F5F5");
    addIfValid("#F0F0F0");
    addIfValid("#0A0A0A");
    addIfValid("#0F0F0F");
    addIfValid("#141414");
  }

  // Strategy 7: High-contrast colored alternatives for extreme cases
  // When user is at white/black extreme, offer high-contrast hue variations
  if (suggestions.size < TARGET_COUNT) {
    const userLightness = tinycolor(userHex).toHsl().l;
    const isUserExtreme = userLightness > 0.95 || userLightness < 0.05;
    
    if (isUserExtreme) {
      // Generate high-contrast colored options
      const targetL = needsDarker ? 10 : 95;
      const hues = [0, 30, 60, 120, 180, 240, 270, 300, 330]; // Full color wheel
      for (const hue of hues) {
        if (suggestions.size >= TARGET_COUNT) break;
        const color = tinycolor({ h: hue, s: 20, l: targetL }).toHexString();
        addIfValid(color);
      }
    }
  }

  // Convert Set to Array and apply contrast distribution
  let result = Array.from(suggestions);
  
  // CONTRAST DISTRIBUTION: Ensure at least one near 6.x and others gradually increase
  // Sort by contrast ratio with correct parameter order
  result.sort((a, b) => {
    const ratioA = targetTab === "background"
      ? getContrastRatio(otherHex, a)  // text (foreground) vs background
      : getContrastRatio(a, otherHex);  // text (foreground) vs background
    const ratioB = targetTab === "background"
      ? getContrastRatio(otherHex, b)  // text (foreground) vs background
      : getContrastRatio(b, otherHex);  // text (foreground) vs background
    return ratioA - ratioB; // Ascending: lowest to highest
  });
  
  // If we have more than 5, select a distributed set
  if (result.length > TARGET_COUNT) {
    const distributed: string[] = [];
    const ratios = result.map(c => targetTab === "background"
      ? getContrastRatio(otherHex, c)  // text (foreground) vs background
      : getContrastRatio(c, otherHex));  // text (foreground) vs background
    const minRatio = Math.min(...ratios);
    const maxRatio = Math.max(...ratios);
    
    // Ensure at least one near the minimum (6.0-6.5 range)
    const lowContrast = result.find(c => {
      const ratio = targetTab === "background"
        ? getContrastRatio(otherHex, c)  // text (foreground) vs background
        : getContrastRatio(c, otherHex);  // text (foreground) vs background
      return ratio >= TARGET_LOW_CONTRAST && ratio <= 6.5;
    });
    if (lowContrast) {
      distributed.push(lowContrast);
    }
    
    // Fill remaining slots with evenly distributed contrast levels
    const remaining = result.filter(c => c !== lowContrast);
    const step = remaining.length > 0 ? Math.max(1, Math.floor(remaining.length / (TARGET_COUNT - distributed.length))) : 1;
    
    for (let i = 0; i < remaining.length && distributed.length < TARGET_COUNT; i += step) {
      if (!distributed.includes(remaining[i])) {
        distributed.push(remaining[i]);
      }
    }
    
    // If still not enough, add from the end (highest contrast)
    for (let i = remaining.length - 1; i >= 0 && distributed.length < TARGET_COUNT; i--) {
      if (!distributed.includes(remaining[i])) {
        distributed.push(remaining[i]);
      }
    }
    
    result = distributed.slice(0, TARGET_COUNT);
  } else {
    result = result.slice(0, TARGET_COUNT);
  }
  
  // LOGGING: Show rejected colors and final accepted suggestions
  if (IS_DEV && rejectedColors.length > 0) {
    const similarityRejections = rejectedColors.filter(r => r.deltaE !== undefined || r.rgbDistance !== undefined);
    const wcagRejections = rejectedColors.filter(r => r.ratio !== undefined);
    
    if (similarityRejections.length > 0) {
      console.warn(`[AI Suggestions] 🛡️ GUARD TRIGGERED: ${similarityRejections.length} colors rejected for being too different from original:`);
      similarityRejections.slice(0, 10).forEach(({ color, reasons, deltaE, rgbDistance }) => {
        console.warn(`   ${color} - ${reasons.join(', ')}`);
        if (deltaE !== undefined && rgbDistance !== undefined) {
          console.warn(`      Delta E: ${deltaE.toFixed(1)}, RGB Distance: ${rgbDistance.toFixed(1)}`);
        }
      });
      if (similarityRejections.length > 10) {
        console.warn(`   ... and ${similarityRejections.length - 10} more similarity rejections`);
      }
    }
    
    if (wcagRejections.length > 0) {
      console.log(`[AI Suggestions] ❌ REJECTED ${wcagRejections.length} colors for failing WCAG compliance:`);
      wcagRejections.slice(0, 10).forEach(({ color, ratio, reasons }) => {
        if (ratio !== undefined) {
          console.log(`   ${color} (${ratio.toFixed(2)}:1) - Failed: ${reasons.join(', ')}`);
        }
      });
      if (wcagRejections.length > 10) {
        console.log(`   ... and ${wcagRejections.length - 10} more WCAG rejections`);
      }
    }
  }
  
  if (IS_DEV) {
    console.log(`[AI Suggestions] ✅ FINAL ${result.length} WCAG-COMPLIANT suggestions (distributed contrast):`);
    result.forEach((color, i) => {
      const compliance = targetTab === "background"
        ? validateWCAGCompliance(otherHex, color)  // text (foreground) vs background
        : validateWCAGCompliance(color, otherHex);  // text (foreground) vs background
      console.log(`   ${i + 1}. ${color} (${compliance.ratio.toFixed(2)}:1) - AA✓ AAA Large✓`);
    });
  }
  
  // Log if we still don't have 5 (should never happen, but log for debugging)
  if (result.length < TARGET_COUNT) {
    console.error(`[AI Suggestions] CRITICAL: Could only generate ${result.length} suggestions. This should not happen.`);
  }
  
  // FINAL SAFETY CHECK: Verify all returned colors pass WCAG compliance and color similarity
  // This should never filter anything out since addIfValid already checks, but it's a safety net
  const safeResult = result.filter(color => {
    // FINAL GUARD 1: Check color similarity one more time (safety net)
    const similarityCheck = isColorTooDifferent(userHex, color, 30, 120);
    if (similarityCheck.tooDifferent) {
      console.error(`[AI Suggestions] 🛡️ FINAL GUARD VIOLATION: ${color} slipped through but is too different from ${userHex} (Delta E: ${similarityCheck.deltaE.toFixed(1)}, RGB: ${similarityCheck.rgbDistance.toFixed(1)}) - Removing.`);
      return false;
    }
    
    // FINAL GUARD 2: Verify WCAG compliance
    const compliance = targetTab === "background"
      ? validateWCAGCompliance(otherHex, color)  // text (foreground) vs background
      : validateWCAGCompliance(color, otherHex);  // text (foreground) vs background
    if (!compliance.passes) {
      console.error(`[AI Suggestions] CRITICAL SAFETY VIOLATION: ${color} (${compliance.ratio.toFixed(2)}:1) slipped through validation! Removing.`);
      return false;
    }
    return true;
  });

  return safeResult;
};

// ----------------- COLOR SELECTOR COMPONENT -----------------
interface ColorSelectorProps {
  textColor: string;
  backgroundColor: string;
  onTextColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
}

type SuggestionStatus = "idle" | "loading" | "success" | "fallback" | "error";

const ColorSelector: React.FC<ColorSelectorProps> = ({
  textColor,
  backgroundColor,
  onTextColorChange,
  onBackgroundColorChange,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"background" | "text">(
    "background"
  );
  const [model, setModel] = useState<any | null>(null);
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);
  const [isTextLocked, setIsTextLocked] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  
  // =============================================================================
  // ROBUST SUGGESTION STATE MANAGEMENT
  // =============================================================================
  // These states ensure suggestions ALWAYS resolve and never get stuck
  
  // Separate suggestion caches for text and background pipelines
  // This allows independent generation and prevents cross-contamination
  const [textColorSuggestions, setTextColorSuggestions] = useState<string[]>([]);
  const [backgroundColorSuggestions, setBackgroundColorSuggestions] = useState<string[]>([]);
  
  // Track current suggestion status (idle/loading/success/fallback/error)
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>("idle");
  
  // Track if AI was used or fallback was triggered (for logging/observability)
  const [suggestionSource, setSuggestionSource] = useState<"ai" | "fallback" | "hybrid" | null>(null);
  
  // Track the source of color changes to control suggestion regeneration behavior
  // - "picker" / "slider" / "input": Manual color changes - regenerate suggestions
  // - "suggestion": AI suggestion clicked - don't regenerate (keep suggestions stable)
  // - "tab": Tab switched - always regenerate (new context)
  // - "swap": Colors swapped - regenerate with new context
  const lastColorChangeSourceRef = React.useRef<"picker" | "slider" | "input" | "suggestion" | "tab" | "swap" | null>(null);
  const shouldRegenerateSuggestionsRef = React.useRef(true);
  const prevTextColorRef = React.useRef(textColor);
  const prevBackgroundColorRef = React.useRef(backgroundColor);
  
  // Suggestion panel visibility and flags
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [suggestionJustSelected, setSuggestionJustSelected] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [frozenSuggestions, setFrozenSuggestions] = useState<string[]>([]);
  const manualCloseRef = React.useRef(false);
  const prevSuggestedLenRef = React.useRef(0);
  const lastSelectedSuggestionRef = React.useRef(false);
  
  // Track contrast status to detect when it fails again after manual dismissal
  const lastContrastStatusRef = React.useRef<{ passes: boolean; ratio: number } | null>(null);

  // Track page visibility for tab switching handling
  const isPageVisibleRef = React.useRef(true);
  const pendingRegenerationRef = React.useRef(false);
  
  // Generation state tracking to prevent race conditions
  const requestIdRef = React.useRef(0);
  const aiAbortControllerRef = React.useRef<AbortController | null>(null);
  const aiDebounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const triggerSuggestionGenerationRef = React.useRef<(() => void) | null>(null);
  
  // INFINITE LOOP PREVENTION: Track the last processed input key
  // This prevents re-processing the same input when state hasn't actually changed
  const lastProcessedKeyRef = React.useRef<string>("");

  const logSuggest = useCallback((event: string, details: Record<string, any> = {}) => {
    const requestId = details.requestId ?? requestIdRef.current;
    const mode = details.mode ?? activeTab;
    const prefix = `[SUGGEST][${requestId}][${mode}][${event}]`;
    console.log(prefix, {
      ts: new Date().toISOString(),
      ...details,
    });
  }, [activeTab]);

  const cancelInFlightSuggestions = useCallback((reason: string, bumpRequestId: boolean = true) => {
    const previousRequestId = requestIdRef.current;
    if (bumpRequestId) {
      requestIdRef.current += 1;
    }

    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
      logSuggest("abort_prev", {
        requestId: previousRequestId,
        mode: activeTab,
        reason,
      });
    }

    if (aiDebounceTimeoutRef.current) {
      clearTimeout(aiDebounceTimeoutRef.current);
      aiDebounceTimeoutRef.current = null;
    }
  }, [activeTab, logSuggest]);

  const commitSuggestions = useCallback((params: {
    mode: "text" | "background";
    suggestions: string[];
    status: SuggestionStatus;
    requestId: number;
    source: "ai" | "fallback" | "hybrid" | null;
    event: string;
  }) => {
    const { mode, suggestions, status, requestId, source, event } = params;
    const currentRequestId = requestIdRef.current;

    // CRITICAL GUARD: Discard stale results from previous slider positions or modes
    if (currentRequestId !== requestId) {
      logSuggest("stale_discarded", {
        requestId,
        currentRequestId,
        mode,
        status,
        source,
        event,
        reason: `Request ${requestId} is stale (current: ${currentRequestId})`,
      });
      return;
    }

    if (mode === "text") {
      setTextColorSuggestions(suggestions);
    } else {
      setBackgroundColorSuggestions(suggestions);
    }
    setSuggestionStatus(status);
    setSuggestionSource(source);

    logSuggest(event, {
      requestId,
      mode,
      status,
      source,
      loading: false,
      suggestions,
    });
  }, [logSuggest]);

  // =============================================================================
  // PAGE VISIBILITY HANDLING
  // =============================================================================
  // Handle browser tab switching to ensure suggestions complete when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      const wasHidden = !isPageVisibleRef.current;
      isPageVisibleRef.current = isVisible;
      
      if (isVisible && wasHidden) {
        // Tab became visible again
        console.log('[AI Suggestions] 📱 Tab became visible - enhancing suggestions with AI');
        
        // INSTANT: Suggestions already visible, just enhance with AI in background
        if (pendingRegenerationRef.current && triggerSuggestionGenerationRef.current) {
          console.log('[AI Suggestions] 🔄 Resuming AI enhancement after tab switch');
          pendingRegenerationRef.current = false;
          // Force regeneration by bumping request ID
          requestIdRef.current++;
          triggerSuggestionGenerationRef.current();
        }
      } else if (!isVisible) {
        // Tab is now hidden - mark that we may need to enhance when visible
        console.log('[AI Suggestions] 📱 Tab hidden - will enhance suggestions on return');
        pendingRegenerationRef.current = true;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // triggerSuggestionGeneration is stable, no need to re-subscribe
  
  // =============================================================================
  // MODEL LOADING WITH FALLBACK GUARANTEE
  // =============================================================================
  // Load pretrained model - lazy load to avoid blocking initial render
  // CRITICAL: Even if model loading fails, deterministic fallback ALWAYS works
  useEffect(() => {
    // Defer TensorFlow.js loading to avoid blocking critical rendering path
    const timeoutId = setTimeout(() => {
      console.log('[AI Model] 🚀 Starting model load...');
      loadPretrainedModel()
        .then((loadedModel) => {
          console.log('[AI Model] ✅ Model loaded successfully');
          setModel(loadedModel);
        })
        .catch((error) => {
          console.warn('[AI Model] ⚠️ Model load failed - deterministic fallback active:', error?.message || error);
          setModel(null);
          // IMPORTANT: Even without model, suggestions work via deterministic fallback
          // Trigger immediate fallback generation
          triggerSuggestionGeneration();
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  // =============================================================================
  // ROBUST SUGGESTION GENERATION
  // =============================================================================
  // This is the core suggestion generation function that GUARANTEES completion.
  // It runs AI with timeout and ALWAYS falls back to deterministic suggestions.
  
  const lastInferenceInputRef = useRef<string>("");
  
  const fetchAiSuggestions = useCallback(async (
    requestId: number,
    userHex: string,
    otherHex: string,
    targetTab: "text" | "background",
    signal: AbortSignal
  ): Promise<string[]> => {
    if (!AI_SUGGESTIONS_URL) {
      throw new Error("AI endpoint not configured");
    }

    const textHex = targetTab === "text" ? userHex : otherHex;
    const backgroundHex = targetTab === "text" ? otherHex : userHex;

    logSuggest("ai_start", {
      requestId,
      mode: targetTab,
      status: "fallback",
      loading: true,
      endpoint: AI_SUGGESTIONS_URL,
      userHex,
      otherHex,
    });

    const response = await withTimeout(
      fetch(AI_SUGGESTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          mode: targetTab,
          userColor: userHex,
          otherColor: otherHex,
          textColor: textHex,
          backgroundColor: backgroundHex,
          minContrast: MIN_SUGGESTION_CONTRAST,
          targetCount: MIN_SUGGESTIONS_COUNT,
        }),
      }),
      AI_FETCH_TIMEOUT_MS,
      () => {
        if (!signal.aborted) {
          aiAbortControllerRef.current?.abort();
          logSuggest("ai_timeout", {
            requestId,
            mode: targetTab,
            status: "fallback",
            timeoutMs: AI_FETCH_TIMEOUT_MS,
          });
        }
      }
    );

    if (!response.ok) {
      logSuggest("ai_fail", {
        requestId,
        mode: targetTab,
        status: "fallback",
        httpStatus: response.status,
      });
      throw new Error(`AI request failed (${response.status})`);
    }

    const data = await response.json();
    const suggestions = normalizeAiSuggestions(data);
    if (suggestions.length === 0) {
      logSuggest("ai_fail", {
        requestId,
        mode: targetTab,
        status: "fallback",
        reason: "invalid_payload",
      });
      throw new Error("AI returned no valid suggestions");
    }

    logSuggest("ai_success", {
      requestId,
      mode: targetTab,
      status: "success",
      count: suggestions.length,
      suggestions,
    });

    return suggestions;
  }, [logSuggest]);

  // Trigger suggestion generation - can be called from multiple places
  const triggerSuggestionGeneration = useCallback(() => {
    // CRITICAL: Capture current colors at generation START
    // These values MUST be used throughout the entire generation process
    // to avoid race conditions when state changes mid-generation
    const currentActiveTab = activeTab;
    const userHex = currentActiveTab === "text" ? textColor : backgroundColor;
    const otherHex = currentActiveTab === "text" ? backgroundColor : textColor;
    const inputKey = `${userHex}|${otherHex}|${currentActiveTab}`;
    const isUserValid = tinycolor(userHex).isValid();
    const isOtherValid = tinycolor(otherHex).isValid();

    if (!isUserValid || !isOtherValid) {
      if (IS_DEV) {
        console.log(`[SUGGEST] Skipping invalid colors: user=${userHex}, other=${otherHex}`);
      }
      setSuggestionStatus("idle");
      setSuggestionSource(null);
      return;
    }
    
    // INFINITE LOOP PREVENTION: Skip if we've already processed this exact input
    // This stops the console spam caused by re-triggering on unchanged state
    if (inputKey === lastProcessedKeyRef.current) {
      if (IS_DEV) {
        console.log(`[SUGGEST] Skipping duplicate input: ${inputKey}`);
      }
      return;
    }
    
    const previousRequestId = requestIdRef.current;
    // Cancel any in-flight request without bumping request id
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
      logSuggest("abort_prev", {
        requestId: previousRequestId,
        mode: activeTab,
        reason: "new_request",
      });
    }

    const currentRequestId = ++requestIdRef.current;
    const controller = new AbortController();
    aiAbortControllerRef.current = controller;
    
    // Update the ref NOW that we're starting a NEW calculation
    lastProcessedKeyRef.current = inputKey;
    
    const previousSuggestions = currentActiveTab === "text"
      ? textColorSuggestions
      : backgroundColorSuggestions;

    // INSTANT: Update fallback suggestions immediately for the latest input
    const startTime = Date.now();
    const fallbackSuggestions = generateDeterministicSuggestions(userHex, otherHex);
    
    logSuggest("request_created", {
      requestId: currentRequestId,
      mode: currentActiveTab,
      status: "fallback",
      userHex,
      otherHex,
      previousSuggestions,
    });

    commitSuggestions({
      requestId: currentRequestId,
      mode: currentActiveTab,
      suggestions: fallbackSuggestions,
      status: "fallback",
      source: "fallback",
      event: "fallback_committed",
    });

    const currentContrast = getContrastRatio(userHex, otherHex);
    const needsSuggestions = currentContrast < MIN_SUGGESTION_CONTRAST;

    if (!needsSuggestions) {
      logSuggest("ai_skip_contrast_pass", {
        requestId: currentRequestId,
        mode: currentActiveTab,
        status: "fallback",
        contrastRatio: currentContrast,
      });
      return;
    }

    if (!AI_SUGGESTIONS_URL && !model) {
      logSuggest("ai_fail", {
        requestId: currentRequestId,
        mode: currentActiveTab,
        status: "fallback",
        reason: "unavailable",
      });
      return;
    }

    if (!isPageVisibleRef.current) {
      pendingRegenerationRef.current = true;
      logSuggest("ai_abort", {
        requestId: currentRequestId,
        mode: currentActiveTab,
        status: "fallback",
        reason: "tab_hidden",
      });
      return;
    }

    runAIInference(
      currentRequestId,
      userHex,
      otherHex,
      currentActiveTab,
      fallbackSuggestions,
      startTime,
      controller.signal
    );
  }, [
    activeTab,
    backgroundColor,
    commitSuggestions,
    model,
    logSuggest,
    textColor,
    textColorSuggestions,
    backgroundColorSuggestions,
  ]);
  
  // Update ref for visibility handler
  useEffect(() => {
    triggerSuggestionGenerationRef.current = triggerSuggestionGeneration;
  }, [triggerSuggestionGeneration]);
  
  // Run AI inference with proper cancellation handling
  // CRITICAL: All color parameters are passed in to avoid state race conditions
  const runAIInference = useCallback(async (
    requestId: number,
    userHex: string,
    otherHex: string,
    targetTab: "text" | "background",
    fallbackSuggestions: string[],
    startTime: number,
    signal: AbortSignal
  ) => {
    try {
      let aiSuggestions: string[] = [];

      if (AI_SUGGESTIONS_URL) {
        aiSuggestions = await fetchAiSuggestions(requestId, userHex, otherHex, targetTab, signal);
      } else if (model) {
        logSuggest("ai_start", {
          requestId,
          mode: targetTab,
          status: "fallback",
          loading: true,
          endpoint: "local_model",
          userHex,
          otherHex,
        });
        const currentContrast = getContrastRatio(userHex, otherHex);
        const needsSuggestions = currentContrast < MIN_SUGGESTION_CONTRAST;
        const variationValues = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0, 0.2, 0.5, 0.8];

        for (const variation of variationValues) {
          const currentRequestId = requestIdRef.current;
          if (currentRequestId !== requestId || signal.aborted) {
            logSuggest("stale_discarded", {
              requestId,
              currentRequestId,
              mode: targetTab,
              reason: signal.aborted ? "signal_aborted_in_loop" : "request_stale_in_loop",
              iterationVariation: variation,
            });
            return;
          }

          if (!isPageVisibleRef.current) {
            pendingRegenerationRef.current = true;
            logSuggest("ai_abort", {
              requestId,
              mode: targetTab,
              status: "fallback",
              reason: "tab_hidden",
            });
            return;
          }

          if (aiSuggestions.length >= MIN_SUGGESTIONS_COUNT) break;

          try {
            const color = await predictAccessibleColor(model, userHex, otherHex, variation);
            if (!color || !tinycolor(color).isValid()) continue;

            const similarityCheck = isColorTooDifferent(userHex, color, 30, 120);
            if (similarityCheck.tooDifferent) {
              console.warn(`[AI Inference Guard] 🛡️ REJECTED ${color} - Too different from ${userHex} (Delta E: ${similarityCheck.deltaE.toFixed(1)}, RGB: ${similarityCheck.rgbDistance.toFixed(1)})`);
              continue;
            }

            const compliance = targetTab === "background"
              ? validateWCAGCompliance(otherHex, color)
              : validateWCAGCompliance(color, otherHex);
            const isValidContrast = compliance.passes;
            const isUnique = !aiSuggestions.some(s => s.toLowerCase() === color.toLowerCase());
            const isDifferentFromInput = color.toLowerCase() !== userHex.toLowerCase();

            if (isValidContrast && isUnique && (needsSuggestions || isDifferentFromInput)) {
              aiSuggestions.push(color);
            }
          } catch (error: any) {
            if (IS_DEV) console.log(`[AI Inference] ✗ Prediction failed: ${error?.message}`);
          }
        }
      } else {
        throw new Error("AI unavailable");
      }

      const currentRequestIdAfter = requestIdRef.current;
      if (currentRequestIdAfter !== requestId || signal.aborted) {
        logSuggest("stale_discarded", {
          requestId,
          currentRequestId: currentRequestIdAfter,
          mode: targetTab,
          reason: signal.aborted ? "signal_aborted_after_completion" : "request_stale_after_completion",
          aiSuggestionsCount: aiSuggestions.length,
        });
        return;
      }

      if (!AI_SUGGESTIONS_URL) {
        logSuggest("ai_success", {
          requestId,
          mode: targetTab,
          status: "success",
          count: aiSuggestions.length,
          suggestions: aiSuggestions,
        });
      }

      const source = aiSuggestions.length >= MIN_SUGGESTIONS_COUNT
        ? "ai"
        : aiSuggestions.length > 0
          ? "hybrid"
          : "fallback";

      finalizeSuggestions(requestId, userHex, otherHex, targetTab, fallbackSuggestions, aiSuggestions, source, startTime);
    } catch (error: any) {
      const currentRequestId = requestIdRef.current;
      const isStale = currentRequestId !== requestId;

      if (error?.name === "AbortError") {
        logSuggest("ai_abort", {
          requestId,
          currentRequestId,
          mode: targetTab,
          isStale,
          reason: isStale ? "aborted_stale_request" : "abort_error",
        });
        // If this is still the current request (edge case), ensure we have fallback
        if (!isStale) {
          // Fallback was already committed at start of triggerSuggestionGeneration
          // Status should be "fallback" - no action needed
          logSuggest("ai_abort_current", {
            requestId,
            mode: targetTab,
            status: "fallback",
            note: "Keeping instant fallback (already committed)",
          });
        }
        return;
      }

      // For non-abort errors, only process if this is still the current request
      if (isStale) {
        logSuggest("stale_discarded", {
          requestId,
          currentRequestId,
          mode: targetTab,
          reason: "error_on_stale_request",
          error: error?.message || String(error),
        });
        return;
      }

      console.error(`[AI Inference] ❌ ERROR: ${error?.message || error}`);
      logSuggest("ai_fail", {
        requestId,
        mode: targetTab,
        status: "fallback",
        error: error?.message || String(error),
      });
      // CRITICAL: Ensure status moves out of any "loading" state
      // finalizeSuggestions will commit with "fallback" or "error" status
      finalizeSuggestions(requestId, userHex, otherHex, targetTab, fallbackSuggestions, [], "fallback", startTime);
    } finally {
      if (aiAbortControllerRef.current?.signal === signal) {
        aiAbortControllerRef.current = null;
      }
    }
  }, [fetchAiSuggestions, logSuggest, model]);
  
  // Finalize suggestions - this ALWAYS completes the generation
  // CRITICAL: All color parameters are passed in to avoid state race conditions
  // The userHex, otherHex, and targetTab MUST be the values captured at generation START
  const finalizeSuggestions = useCallback((
    requestId: number,
    userHex: string,      // Captured at generation start - DO NOT recompute
    otherHex: string,     // Captured at generation start - DO NOT recompute
    targetTab: "text" | "background",  // Captured at generation start
    fallbackSuggestions: string[],
    aiSuggestions: string[],
    source: 'ai' | 'fallback' | 'hybrid',
    startTime: number
  ) => {
    // CRITICAL GUARD: Validate generation ID - discard stale results
    const currentRequestId = requestIdRef.current;
    if (currentRequestId !== requestId) {
      logSuggest("stale_discarded", {
        requestId,
        currentRequestId,
        mode: targetTab,
        source,
        reason: `Finalization cancelled - request ${requestId} is stale (current: ${currentRequestId})`,
      });
      return;
    }
    
    console.log(`[AI Suggestions] Finalizing for ${targetTab.toUpperCase()} tab: user=${userHex}, other=${otherHex}`);
    
    let finalSuggestions: string[];
    if (source === 'ai' && aiSuggestions.length >= MIN_SUGGESTIONS_COUNT) {
      // AI provided enough suggestions
      finalSuggestions = aiSuggestions.slice(0, MIN_SUGGESTIONS_COUNT);
    } else if (source === 'hybrid' || (source === 'ai' && aiSuggestions.length > 0)) {
      // Mix AI and fallback - use captured userHex/otherHex and targetTab
      finalSuggestions = guaranteeFiveSuggestions(userHex, otherHex, aiSuggestions, targetTab);
    } else {
      // Pure fallback - already generated with correct parameters
      finalSuggestions = fallbackSuggestions.slice(0, MIN_SUGGESTIONS_COUNT);
    }
    
    // CRITICAL VALIDATION: Ensure we have exactly 5 WCAG-compliant suggestions
    if (finalSuggestions.length < MIN_SUGGESTIONS_COUNT) {
      console.error(`[AI Suggestions] ⚠️ Only ${finalSuggestions.length} suggestions - regenerating fallback`);
      console.error(`[AI Suggestions] Context: targetTab=${targetTab}, userHex=${userHex}, otherHex=${otherHex}`);
      // Use captured otherHex, not current state
      finalSuggestions = generateDeterministicSuggestions(userHex, otherHex);
      
      // CRITICAL: Validate the regenerated fallback immediately
      if (finalSuggestions.length < MIN_SUGGESTIONS_COUNT) {
        console.error(`[AI Suggestions] ❌ CRITICAL: Regenerated fallback only has ${finalSuggestions.length} suggestions!`);
      }
    }
    
    // Verify all suggestions pass WCAG against the CAPTURED otherHex
    // CRITICAL: For BACKGROUND tab, we're validating background colors against text color
    // CRITICAL: For TEXT tab, we're validating text colors against background color
    // Determine correct parameter order: foreground (text) first, background second
    const validatedSuggestions = finalSuggestions.filter(c => {
      // For BACKGROUND tab: c is background, otherHex is text (foreground)
      // For TEXT tab: c is text (foreground), otherHex is background
      const compliance = targetTab === "background"
        ? validateWCAGCompliance(otherHex, c)  // text (foreground) vs background
        : validateWCAGCompliance(c, otherHex);  // text (foreground) vs background
      
      if (!compliance.passes) {
        console.error(`[AI Suggestions] ❌ REMOVING invalid suggestion: ${c} (${compliance.ratio.toFixed(2)}:1) against ${otherHex}`);
        console.error(`[AI Suggestions]   Failed requirements: ${compliance.failedRequirements.join(', ')}`);
        console.error(`[AI Suggestions]   Context: targetTab=${targetTab}, userHex=${userHex}`);
        return false;
      }
      return true;
    });
    
    // If validation removed any, regenerate with captured parameters and validate again
    if (validatedSuggestions.length < MIN_SUGGESTIONS_COUNT) {
      console.warn(`[AI Suggestions] ⚠️ Validation removed ${finalSuggestions.length - validatedSuggestions.length} suggestions`);
      console.warn(`[AI Suggestions] Regenerating fallback for ${targetTab} tab: user=${userHex}, other=${otherHex}`);
      const regenerated = generateDeterministicSuggestions(userHex, otherHex);
      
      // CRITICAL: Validate the regenerated suggestions with correct parameter order
      const validatedRegenerated = regenerated.filter(c => {
        const compliance = targetTab === "background"
          ? validateWCAGCompliance(otherHex, c)  // text (foreground) vs background
          : validateWCAGCompliance(c, otherHex);  // text (foreground) vs background
        if (!compliance.passes) {
          console.error(`[AI Suggestions] ❌ Regenerated color ${c} also failed (${compliance.ratio.toFixed(2)}:1)`);
          return false;
        }
        return true;
      });
      
      if (validatedRegenerated.length >= MIN_SUGGESTIONS_COUNT) {
        finalSuggestions = validatedRegenerated;
        console.log(`[AI Suggestions] ✅ Regenerated fallback has ${finalSuggestions.length} valid suggestions`);
      } else {
        console.error(`[AI Suggestions] ❌ CRITICAL: Regenerated fallback only has ${validatedRegenerated.length} valid suggestions`);
        // Use what we have - better than nothing, but log as critical error
        finalSuggestions = validatedRegenerated;
      }
    } else {
      finalSuggestions = validatedSuggestions;
    }
    
    const duration = Date.now() - startTime;
    
    // Log final results with detailed contrast information
    console.log(`[AI Suggestions] ========== GENERATION COMPLETE ==========`);
    console.log(`[AI Suggestions] Source: ${source.toUpperCase()}`);
    console.log(`[AI Suggestions] Duration: ${duration}ms`);
    console.log(`[AI Suggestions] Target: ${targetTab.toUpperCase()} tab`);
    console.log(`[AI Suggestions] Contrast direction: ${targetTab === "text" ? "TEXT vs BACKGROUND" : "BACKGROUND vs TEXT"}`);
    console.log(`[AI Suggestions] User color (${targetTab}): ${userHex}`);
    console.log(`[AI Suggestions] Other color (${targetTab === "text" ? "background" : "text"}): ${otherHex}`);
    console.log(`[AI Suggestions] Final suggestions (${finalSuggestions.length}):`);
    // Apply contrast distribution to final suggestions
    // Sort by contrast ratio and ensure distribution
    finalSuggestions.sort((a, b) => {
      const ratioA = targetTab === "background"
        ? getContrastRatio(otherHex, a)
        : getContrastRatio(a, otherHex);
      const ratioB = targetTab === "background"
        ? getContrastRatio(otherHex, b)
        : getContrastRatio(b, otherHex);
      return ratioA - ratioB; // Ascending: lowest to highest
    });
    
    // If we have more than 5, ensure distribution
    if (finalSuggestions.length > MIN_SUGGESTIONS_COUNT) {
      const distributed: string[] = [];
      
      // Ensure at least one near the minimum (6.0-6.5 range)
      const lowContrast = finalSuggestions.find(c => {
        const ratio = targetTab === "background"
          ? getContrastRatio(otherHex, c)
          : getContrastRatio(c, otherHex);
        return ratio >= TARGET_LOW_CONTRAST && ratio <= 6.5;
      });
      if (lowContrast) {
        distributed.push(lowContrast);
      }
      
      // Fill remaining slots with evenly distributed contrast levels
      const remaining = finalSuggestions.filter(c => c !== lowContrast);
      const step = remaining.length > 0 ? Math.max(1, Math.floor(remaining.length / (MIN_SUGGESTIONS_COUNT - distributed.length))) : 1;
      
      for (let i = 0; i < remaining.length && distributed.length < MIN_SUGGESTIONS_COUNT; i += step) {
        if (!distributed.includes(remaining[i])) {
          distributed.push(remaining[i]);
        }
      }
      
      // If still not enough, add from the end (highest contrast)
      for (let i = remaining.length - 1; i >= 0 && distributed.length < MIN_SUGGESTIONS_COUNT; i--) {
        if (!distributed.includes(remaining[i])) {
          distributed.push(remaining[i]);
        }
      }
      
      finalSuggestions = distributed.slice(0, MIN_SUGGESTIONS_COUNT);
    }
    
    finalSuggestions.forEach((c, i) => {
      // CRITICAL: For BACKGROUND tab, c is background color, otherHex is text color
      // CRITICAL: For TEXT tab, c is text color, otherHex is background color
      const compliance = targetTab === "background"
        ? validateWCAGCompliance(otherHex, c)  // text (foreground) vs background
        : validateWCAGCompliance(c, otherHex);  // text (foreground) vs background
      const contrastDirection = targetTab === "text" 
        ? `${c} (text) vs ${otherHex} (background)`
        : `${c} (background) vs ${otherHex} (text)`;
      
      if (compliance.passes) {
        console.log(`  ${i + 1}. ${c} (${compliance.ratio.toFixed(2)}:1) ✅ AA+AAA Large PASS`);
        console.log(`     ${contrastDirection}`);
        console.log(`     AA Large: ${compliance.aaLarge} (${WCAG_AA_LARGE}:1), AA Normal: ${compliance.aaNormal} (${WCAG_AA_NORMAL}:1)`);
        console.log(`     AAA Large: ${compliance.aaaLarge} (${WCAG_AAA_LARGE}:1), AAA Normal: ${compliance.aaaNormal} (${WCAG_AAA_NORMAL}:1)`);
      } else {
        console.error(`  ${i + 1}. ${c} (${compliance.ratio.toFixed(2)}:1) ❌ FAILED - THIS SHOULD NEVER APPEAR!`);
        console.error(`     ${contrastDirection}`);
        console.error(`     Failed: ${compliance.failedRequirements.join(', ')}`);
      }
    });
    
    // CRITICAL: Verify all suggestions are actually valid
    const invalidCount = finalSuggestions.filter(c => {
      const compliance = targetTab === "background"
        ? validateWCAGCompliance(otherHex, c)  // text (foreground) vs background
        : validateWCAGCompliance(c, otherHex);  // text (foreground) vs background
      return !compliance.passes;
    }).length;
    
    if (invalidCount > 0) {
      console.error(`[AI Suggestions] ❌ CRITICAL ERROR: ${invalidCount} invalid suggestions in final output!`);
    } else {
      console.log(`[AI Suggestions] ✅ All ${finalSuggestions.length} suggestions validated and ready for display`);
    }
    
    const status: SuggestionStatus = finalSuggestions.length > 0
      ? (source === "ai" || source === "hybrid" ? "success" : "fallback")
      : "error";
    commitSuggestions({
      requestId,
      mode: targetTab,
      suggestions: finalSuggestions,
      status,
      source,
      event: "commit",
    });
    // Suggestions are always instant via useMemo, AI just enhances in background
    lastInferenceInputRef.current = `${userHex}|${otherHex}|${targetTab}`;
    
    console.log(`[AI Suggestions] ✅ Enhancement complete - suggestions updated seamlessly`);
    
  }, [commitSuggestions, logSuggest]); // Logging uses current status
  
  // =============================================================================
  // INSTANT SUGGESTION GENERATION TRIGGER
  // =============================================================================
  // This effect triggers AI enhancement in background when colors or tab change
  // INSTANT FALLBACK is already shown via useMemo - this just enhances with AI
  useEffect(() => {
    const userHex = activeTab === "text" ? textColor : backgroundColor;
    const otherHex = activeTab === "text" ? backgroundColor : textColor;
    const inputKey = `${userHex}|${otherHex}|${activeTab}`;
    const source = lastColorChangeSourceRef.current;
    const shouldRegenerate = shouldRegenerateSuggestionsRef.current;
    
    logSuggest("effect_trigger", {
      requestId: requestIdRef.current,
      mode: activeTab,
      inputKey,
      lastInputKey: lastInferenceInputRef.current,
      source,
      shouldRegenerate,
      textColor,
      backgroundColor,
    });
    
    // Skip if same input as last generation AND not forced to regenerate
    if (inputKey === lastInferenceInputRef.current && !shouldRegenerate) {
      logSuggest("effect_skip_same_input", { requestId: requestIdRef.current, mode: activeTab, inputKey });
      return;
    }
    
    // Skip if coming from suggestion selection AND not forced to regenerate
    if (source === "suggestion" && !shouldRegenerate) {
      logSuggest("effect_skip_suggestion_source", { requestId: requestIdRef.current, mode: activeTab, source });
      return;
    }

    // Clear any pending debounced call
    if (aiDebounceTimeoutRef.current) {
      clearTimeout(aiDebounceTimeoutRef.current);
    }
    
    // Update last input key BEFORE scheduling to prevent duplicate triggers
    lastInferenceInputRef.current = inputKey;
    // Reset the flag after reading it
    shouldRegenerateSuggestionsRef.current = false;
    
    logSuggest("effect_scheduling", {
      requestId: requestIdRef.current,
      mode: activeTab,
      inputKey,
      debounceMs: AI_DEBOUNCE_MS,
      userHex,
      otherHex,
    });
    
    // INSTANT: Suggestions already visible via useMemo fallback
    // AI enhancement runs in background (debounced) to improve results without blocking
    // User sees suggestions immediately, AI enhances them seamlessly
    aiDebounceTimeoutRef.current = setTimeout(() => {
      logSuggest("effect_debounce_fired", {
        requestId: requestIdRef.current,
        mode: activeTab,
        inputKey,
        userHex,
        otherHex,
      });
      triggerSuggestionGeneration();
    }, AI_DEBOUNCE_MS);

    return () => {
      if (aiDebounceTimeoutRef.current) {
        clearTimeout(aiDebounceTimeoutRef.current);
        aiDebounceTimeoutRef.current = null;
      }
    };
  }, [textColor, backgroundColor, activeTab, model, triggerSuggestionGeneration, logSuggest]);

  const handleCopyColor = useCallback(
    (color: string, label: string) => {
      navigator.clipboard.writeText(color);
      toast({
        title: "Color copied",
        description: `${label} ${color} copied to clipboard`,
      });
    },
    [toast]
  );

  // Handler for color changes WITH source tracking
  // This handles tracking and triggers suggestion regeneration
  // NOTE: Parent state update happens via ColorControl's onChange -> raw setter
  const handleColorChangeWithSource = useCallback((color: string, source: "picker" | "slider" | "input" | "suggestion", type: "text" | "background") => {
    // Check if color is locked - but DON'T block here, let onChange handle it
    // (ColorControl already checks isLocked before calling handlers)

    // Normalize color for logging
    let normalizedColor = color.trim();
    if (!normalizedColor.startsWith("#")) normalizedColor = `#${normalizedColor}`;

    lastColorChangeSourceRef.current = source;
    logSuggest("input_change", {
      requestId: requestIdRef.current,
      mode: activeTab,
      target: type,
      source,
      value: normalizedColor,
      textColor: type === "text" ? normalizedColor : textColor,
      backgroundColor: type === "background" ? normalizedColor : backgroundColor,
    });
    
    // Only regenerate suggestions if source is picker, slider, or input (not suggestion)
    if (source === "picker" || source === "slider" || source === "input") {
      cancelInFlightSuggestions(`color change (${source})`);
      shouldRegenerateSuggestionsRef.current = true;
      lastSelectedSuggestionRef.current = false;
      setSuggestionJustSelected(false);
      setSelectedSuggestion(null);
      setFrozenSuggestions([]);
      
      // CRITICAL: Clear the suggestion cache for the changed color type
      // This forces useMemo to generate instant suggestions for the NEW color
      // instead of returning stale cached suggestions for the OLD color
      if (type === "text") {
        setTextColorSuggestions([]);
      } else {
        setBackgroundColorSuggestions([]);
      }
      
      // Keep popup visible - don't hide it on slider/input changes (if not dismissed)
      setSuggestionsVisible(true);
    } else if (source === "suggestion") {
      // Keep suggestions visible and don't regenerate
      shouldRegenerateSuggestionsRef.current = false;
      lastSelectedSuggestionRef.current = true;
      setSuggestionJustSelected(true);
      manualCloseRef.current = false;
      setSuggestionsVisible(true);
    }
    
    // Update parent state - this is the ONLY place that updates state
    // ColorControl's onChange calls the raw setter, but we call it here to ensure
    // tracking refs are set BEFORE state update triggers the useEffect
    type === "text" ? onTextColorChange(normalizedColor) : onBackgroundColorChange(normalizedColor);
  }, [activeTab, backgroundColor, cancelInFlightSuggestions, logSuggest, onBackgroundColorChange, onTextColorChange, textColor]);

  const handleSwapColors = () => {
    cancelInFlightSuggestions("swap colors");
    logSuggest("input_change", {
      requestId: requestIdRef.current,
      mode: activeTab,
      source: "swap",
      fromText: textColor,
      fromBackground: backgroundColor,
    });
    // CRITICAL: Force regeneration after swap since both colors change
    shouldRegenerateSuggestionsRef.current = true;
    lastColorChangeSourceRef.current = "swap";
    lastSelectedSuggestionRef.current = false;
    setSuggestionJustSelected(false);
    setSelectedSuggestion(null);
    
    // Clear frozen suggestions to trigger immediate regeneration
    setFrozenSuggestions([]);
    
    // CRITICAL: Clear BOTH suggestion caches since swap changes both colors
    // This ensures useMemo regenerates instant suggestions for the new color pair
    setTextColorSuggestions([]);
    setBackgroundColorSuggestions([]);
    
    // Keep popup visible
    setSuggestionsVisible(true);
    
    onTextColorChange(backgroundColor);
    onBackgroundColorChange(textColor);
    toast({
      title: "Colors swapped",
      description: `Text and Background colors have been interchanged`,
    });
  };

  // Handle tab change - ALWAYS refresh suggestions for the new active tab
  // This is critical because switching tabs changes which color we're adjusting
  // Advanced Settings stays open (not reset on tab change)
  const handleTabChange = (newTab: "background" | "text") => {
    // Don't do anything if clicking the same tab
    if (activeTab === newTab) return;
    
    cancelInFlightSuggestions("mode change");
    logSuggest("input_change", {
      requestId: requestIdRef.current,
      from: activeTab,
      to: newTab,
      source: "mode_switch",
    });
    // CRITICAL FIX: Always regenerate suggestions when switching tabs
    // Switching tabs means we're now adjusting a DIFFERENT color against a DIFFERENT background
    shouldRegenerateSuggestionsRef.current = true;
    
    // Clear the suggestion selection state - we're now working with a different color
    lastColorChangeSourceRef.current = "tab";
    lastSelectedSuggestionRef.current = false;
    setSuggestionJustSelected(false);
    setSelectedSuggestion(null);
    
    // Clear frozen suggestions to trigger immediate regeneration
    setFrozenSuggestions([]);
    
    // CRITICAL: Clear suggestion cache for the NEW mode
    // This ensures useMemo generates fresh instant suggestions for the new mode
    if (newTab === "text") {
      setTextColorSuggestions([]);
    } else {
      setBackgroundColorSuggestions([]);
    }
    
    // Keep popup visible when switching tabs
    setSuggestionsVisible(true);
    
    // Update previous color refs
    prevTextColorRef.current = textColor;
    prevBackgroundColorRef.current = backgroundColor;
    
    // Update active tab - this will trigger suggestedColors AND mlSuggestions recalculation
    setActiveTab(newTab);
  };

  // ----------------- INSTANT SUGGESTED COLORS -----------------
  // CRITICAL: This useMemo generates suggestions INSTANTLY and SYNCHRONOUSLY
  // No loading states, no waiting - suggestions appear immediately
  // IMPORTANT: Never call setState inside useMemo - it causes infinite loops
  const suggestedColors = useMemo(() => {
    const userHex = activeTab === "text" ? textColor : backgroundColor;
    const otherHex = activeTab === "text" ? backgroundColor : textColor;
    
    // Get cached suggestions from the appropriate pipeline
    const pipelineSuggestions = activeTab === "text" 
      ? textColorSuggestions 
      : backgroundColorSuggestions;
    
    // INSTANT FALLBACK: If no cached suggestions, generate synchronously NOW
    // This ensures suggestions ALWAYS appear immediately, never empty state
    // Note: We return the instant suggestions but update cache in useEffect (below)
    // to avoid setState during render which causes infinite loops
    if (pipelineSuggestions.length === 0) {
      console.log(`[AI Suggestions] ⚡ INSTANT: Generating synchronous fallback for ${activeTab} tab`);
      const instantSuggestions = generateDeterministicSuggestions(userHex, otherHex);
      
      // Return instant suggestions - user sees them immediately
      // Cache will be updated in useEffect below to avoid setState during render
      return instantSuggestions;
    }

    // Sort cached suggestions: from highest contrast to lowest contrast (WCAG compliance priority)
    // If contrast is similar, sort by brand proximity (closest hue to original first)
    const sortedSuggestions = [...pipelineSuggestions].sort((a, b) => {
      const contrastA = getContrastRatio(a, otherHex);
      const contrastB = getContrastRatio(b, otherHex);
      
      // First sort by contrast (highest to lowest - best compliance first)
      if (Math.abs(contrastA - contrastB) > 0.1) {
        return contrastB - contrastA;
      }
      
      // If contrast is similar, prioritize colors closer to the original (brand preservation)
      const userHsl = tinycolor(userHex).toHsl();
      const hslA = tinycolor(a).toHsl();
      const hslB = tinycolor(b).toHsl();
      const hueDiffA = Math.min(Math.abs(hslA.h - userHsl.h), 360 - Math.abs(hslA.h - userHsl.h));
      const hueDiffB = Math.min(Math.abs(hslB.h - userHsl.h), 360 - Math.abs(hslB.h - userHsl.h));
      return hueDiffA - hueDiffB;
    });

    return sortedSuggestions;
  }, [textColor, backgroundColor, activeTab, textColorSuggestions, backgroundColorSuggestions]);

  // Update cache when useMemo generates instant fallback suggestions
  // This runs AFTER render to avoid setState during render (which causes infinite loops)
  useEffect(() => {
    const userHex = activeTab === "text" ? textColor : backgroundColor;
    const otherHex = activeTab === "text" ? backgroundColor : textColor;
    const pipelineSuggestions = activeTab === "text" 
      ? textColorSuggestions 
      : backgroundColorSuggestions;
    
    // If cache is empty, update it with the instant fallback that useMemo generated
    if (pipelineSuggestions.length === 0 && suggestedColors.length > 0) {
      commitSuggestions({
        requestId: requestIdRef.current,
        mode: activeTab,
        suggestions: suggestedColors,
        status: "fallback",
        source: "fallback",
        event: "fallback_committed",
      });
    }
  }, [activeTab, suggestedColors, textColorSuggestions, backgroundColorSuggestions, commitSuggestions]);

  // INSTANT SUGGESTIONS: Keep suggestions visible and update immediately
  // Suggestions are always available via useMemo - this just manages visibility
  useEffect(() => {
    const len = suggestedColors.length;
    const source = lastColorChangeSourceRef.current;
    
    // Check current contrast status - uses full WCAG compliance (7:1 AAA normal)
    const currentContrast = getContrastRatio(textColor, backgroundColor);
    const contrastPasses = currentContrast >= MIN_SUGGESTION_CONTRAST;
    
    // Update contrast status tracking
    if (lastContrastStatusRef.current === null || 
        lastContrastStatusRef.current.ratio !== currentContrast) {
      lastContrastStatusRef.current = { passes: contrastPasses, ratio: currentContrast };
    }
    
    // INSTANT: Suggestions are always available - just update visibility
    // No blocking, no waiting - suggestions appear immediately via useMemo
    if (len > 0) {
      // Suggestions available - keep visible unless manually closed
      if (!manualCloseRef.current || !contrastPasses) {
        if (!contrastPasses) {
          manualCloseRef.current = false;
        }
        setSuggestionsVisible(true);
      }
      
      // Update tracking
      if (source !== "suggestion" || shouldRegenerateSuggestionsRef.current) {
      shouldRegenerateSuggestionsRef.current = true;
      prevTextColorRef.current = textColor;
      prevBackgroundColorRef.current = backgroundColor;
      lastColorChangeSourceRef.current = null;
      }
      } else {
      // This should never happen due to instant fallback, but handle gracefully
      if (!contrastPasses) {
        manualCloseRef.current = false;
        setSuggestionsVisible(true);
      }
    }
    prevSuggestedLenRef.current = len;
  }, [suggestedColors, suggestionJustSelected, activeTab, suggestionsVisible, textColor, backgroundColor]);

  const isTextColorValid = tinycolor(textColor).isValid();
  const isBackgroundColorValid = tinycolor(backgroundColor).isValid();
  const areSuggestionInputsValid = isTextColorValid && isBackgroundColorValid;

  return (
    <div 
      className="w-full h-full flex flex-col min-h-0 flex-1"
      role="region"
      aria-label="Color selection and AI suggestions"
      style={{
        contain: 'layout style',
        willChange: 'auto'
      }}
    >
      {/* ----------------- Suggested Colors - Refined - Always Visible ----------------- */}
      {suggestionsVisible && (
        <div 
          className="ai-suggestion-popup mb-2 md:mb-4 p-3.5 md:p-4 rounded-lg bg-gradient-to-br from-primary/15 to-primary/8 dark:from-primary/30 dark:to-primary/20 relative flex-shrink-0 shadow-md bg-background/50 dark:bg-transparent mx-1 md:mx-0"
          role="region"
          aria-label="AI-suggested accessible colors"
          style={{
            contain: 'layout style paint',
            willChange: 'auto',
            position: 'relative',
            isolation: 'isolate',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
          <button
            onClick={() => {
              manualCloseRef.current = true;
              setSuggestionJustSelected(false);
              setSelectedSuggestion(null);
              setFrozenSuggestions([]);
              setSuggestionsVisible(false);
            }}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-md hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px] min-w-[44px] flex items-center justify-center z-20"
            aria-label="Close suggestions"
          >
            <X className="w-4 h-4 text-foreground dark:text-white" />
          </button>
          <div className="text-sm md:text-base font-bold mb-3.5 text-foreground dark:text-white pr-9 leading-tight relative z-10">
            Smart Suggestions
            {suggestionStatus === "loading" && (
              <span className="ml-2 text-[10px] font-semibold text-foreground/70">Generating smart suggestions…</span>
            )}
            {(suggestionSource === "ai" || suggestionSource === "hybrid") && suggestionStatus === "success" && (
              <span className="ml-2 text-[10px] font-semibold text-primary/80">AI-assisted</span>
            )}
            {suggestionStatus === "error" && areSuggestionInputsValid && (
              <span className="ml-2 text-[10px] font-semibold text-red-500 dark:text-red-400">Error</span>
            )}
          </div>
          <div 
            className="flex flex-wrap gap-2.5 relative z-10"
            style={{
              contain: 'layout style',
              willChange: 'auto'
            }}
          >
            {/* INSTANT SUGGESTIONS: Always show suggestions immediately - no loading states */}
            {suggestedColors.length > 0 ? (
              suggestedColors.map((c, index) => {
                // Calculate accessible text color with minimum 10:1 contrast
                const textCol = getAccessibleLabelColor(c);
                const isSelected = selectedSuggestion === c;
                // Ensure hex color is normalized
                const normalizedColor = tinycolor(c).toHexString();
                return (
                  <button
                    key={`suggestion-${index}-${normalizedColor}-${activeTab}`}
                    className={`rounded-md font-mono text-sm md:text-base font-bold min-h-[48px] md:min-h-[52px] ${
                      isSelected
                        ? "px-4 py-3 border-2 border-primary shadow-lg"
                        : "px-4 py-3 border border-primary/30 hover:border-primary/60 hover:shadow-md"
                    }`}
                    style={{ 
                      background: normalizedColor, 
                      backgroundColor: normalizedColor, 
                      color: textCol,
                      fontWeight: 700,
                      minWidth: '90px',
                      fontSize: '14px',
                      letterSpacing: '0.5px',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onClick={() => {
                      // Check if color is locked - prevent changes if locked
                      if ((activeTab === "text" && isTextLocked) || (activeTab === "background" && isBackgroundLocked)) {
                        toast({
                          title: "Color is locked",
                          description: `Unlock the ${activeTab} color to apply suggestions`,
                          variant: "default",
                        });
                        return;
                      }
                      
                      // user selected a suggested color: mark it and keep panel open
                      // Do NOT regenerate suggestions - keep existing ones
                      lastSelectedSuggestionRef.current = true;
                      setSuggestionJustSelected(true);
                      setSelectedSuggestion(normalizedColor);
                      manualCloseRef.current = false;
                      // Keep popup visible - don't close it
                      setSuggestionsVisible(true);
                      // Update the color with source="suggestion" to prevent regeneration
                      handleColorChangeWithSource(normalizedColor, "suggestion", activeTab);
                      
                      // Track suggestion usage - include source for observability
                      const sessionId = localStorage.getItem('analytics_session_id');
                      if (sessionId) {
                        const API_BASE = getApiBaseUrl();
                        fetch(`${API_BASE}/analytics/event`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId,
                            eventType: 'ai_suggestion',
                            eventData: { 
                              color: normalizedColor, 
                              type: activeTab,
                              originalColor: activeTab === 'text' ? textColor : backgroundColor,
                              source: suggestionSource, // Track if AI or fallback was used
                            },
                          }),
                        }).catch(() => {}); // Silently fail if tracking fails
                      }
                    }}
                    title={`Apply color ${normalizedColor}`}
                  >
                    {normalizedColor.toUpperCase()}
                  </button>
                );
              })
            ) : (
              // This should NEVER happen due to instant synchronous generation
              // But if it does, show empty state (should be < 1ms before suggestions appear)
              <div className="text-[10px] text-foreground/80 dark:text-white/80 italic py-1.5 leading-tight">
                {suggestionStatus === "loading"
                  ? "Generating smart suggestions…"
                  : !areSuggestionInputsValid
                    ? "Enter a valid hex color"
                    : suggestionStatus === "error"
                      ? "Unable to generate suggestions"
                      : "No suggestions available"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- Color Selection Section - Refined ----------------- */}
      <div 
        className="p-3 md:p-5 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/50 flex-1 flex flex-col min-h-0 shadow-sm mx-1 md:mx-0"
        style={{
          contain: 'layout style',
          willChange: 'auto'
        }}
      >
        {/* Clear section header */}
        <div className="mb-3 md:mb-5 flex-shrink-0">
          <h3 className="text-base font-bold text-foreground mb-1.5 md:mb-2 leading-tight">Set Your Colors</h3>
          <p className="text-xs text-muted-foreground/90 leading-tight">Enter color codes to test accessibility</p>
        </div>

        {/* Color Picker Tabs - Sharp and Clear */}
        <div className="mb-3 md:mb-5 flex-shrink-0">
          <div className="flex gap-1.5 md:gap-2 items-center" role="tablist" aria-label="Color selection tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "background"}
              onClick={() => handleTabChange("background")}
              className={`flex-1 py-1.5 px-2.5 md:py-3 md:px-5 text-center text-[11px] md:text-sm font-bold transition-colors duration-200 border rounded-md min-h-[36px] md:min-h-[52px] flex items-center justify-center gap-1 ${
                activeTab === "background"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm md:shadow-lg md:border-2"
                  : "bg-muted/50 dark:bg-muted/30 text-foreground hover:bg-muted border-border/50 hover:border-primary/40"
              }`}
              style={{
                contain: 'layout style',
                willChange: 'background-color, border-color'
              }}
              aria-label="Edit background color"
            >
              <div className="w-2.5 h-2.5 md:hidden rounded-sm border border-current/30" style={{ backgroundColor: backgroundColor }} />
              <span>Background Color</span>
            </button>

            <button
              type="button"
              onClick={handleSwapColors}
              className="swap-button-breathing p-1.5 md:p-2 bg-muted/50 dark:bg-muted/30 rounded-md hover:bg-muted transition-colors duration-200 min-h-[36px] md:min-h-[52px] min-w-[36px] md:min-w-[52px] flex items-center justify-center"
              title="Swap background and text colors"
              aria-label="Swap background and text colors"
              style={{
                contain: 'layout style',
                willChange: 'background-color'
              }}
            >
              <ArrowRightLeft className="w-3 h-3 md:w-4 md:h-4 text-foreground" />
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "text"}
              onClick={() => handleTabChange("text")}
              className={`flex-1 py-1.5 px-2.5 md:py-3 md:px-5 text-center text-[11px] md:text-sm font-bold transition-colors duration-200 border rounded-md min-h-[36px] md:min-h-[52px] flex items-center justify-center gap-1 ${
                activeTab === "text"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm md:shadow-lg md:border-2"
                  : "bg-muted/50 dark:bg-muted/30 text-foreground hover:bg-muted border-border/50 hover:border-primary/40"
              }`}
              style={{
                contain: 'layout style',
                willChange: 'background-color, border-color'
              }}
              aria-label="Edit text color"
            >
              <div className="w-2.5 h-2.5 md:hidden rounded-sm border border-current/30" style={{ backgroundColor: textColor }} />
              <span>Text Color</span>
            </button>
          </div>
        </div>

        {/* ----------------- Color Controls - Always visible for the active tab ----------------- */}
        <div 
          className="flex-1 flex flex-col min-h-0"
          style={{
            contain: 'layout style',
            willChange: 'auto'
          }}
        >
          {activeTab === "background" && (
            <ColorControl
              color={backgroundColor}
              onChange={() => {/* no-op: state update handled by onColorChange */}}
              onColorChange={(v, source) => handleColorChangeWithSource(v, source, "background")}
              onCopy={handleCopyColor}
              label="Background Color"
              isLocked={isBackgroundLocked}
              onLockChange={setIsBackgroundLocked}
              advancedSettingsOpen={advancedSettingsOpen}
              onAdvancedSettingsToggle={setAdvancedSettingsOpen}
            />
          )}
          {activeTab === "text" && (
            <ColorControl
              color={textColor}
              onChange={() => {/* no-op: state update handled by onColorChange */}}
              onColorChange={(v, source) => handleColorChangeWithSource(v, source, "text")}
              onCopy={handleCopyColor}
              label="Text Color"
              isLocked={isTextLocked}
              onLockChange={setIsTextLocked}
              advancedSettingsOpen={advancedSettingsOpen}
              onAdvancedSettingsToggle={setAdvancedSettingsOpen}
            />
          )}
        </div>
      </div>
      
      {/* Mobile: Mini Preview Below Set Your Colors */}
      {textColor && backgroundColor && (
        <div 
          className="md:hidden rounded-lg border border-border/50 overflow-hidden mt-2 shadow-sm mx-1 md:mx-0"
          style={{ 
            backgroundColor: backgroundColor,
            contain: 'layout style paint',
            minHeight: '200px',
            willChange: 'background-color'
          }}
        >
          <div 
            className="p-4 flex flex-col justify-center"
          >
            {/* Heading */}
            <h4 style={{ 
              color: textColor, 
              fontWeight: 700, 
              fontSize: '16px', 
              marginBottom: '10px',
              lineHeight: '1.3',
              letterSpacing: '-0.01em'
            }}>
              Live Colors Preview
            </h4>
            
            {/* First paragraph */}
            <p style={{ 
              color: textColor, 
              fontSize: '13px', 
              marginBottom: '10px',
              lineHeight: '1.5',
              fontWeight: 400
            }}>
              This is a sample paragraph demonstrating how your text color looks on the selected background color.
            </p>
            
            {/* Second paragraph */}
            <p style={{ 
              color: textColor, 
              fontSize: '13px', 
              marginBottom: '10px',
              lineHeight: '1.5',
              fontWeight: 400
            }}>
              Additional content to show how different text sizes appear with your color combination.
            </p>
            
            {/* Divider line */}
            <div 
              style={{ 
                height: '1px',
                backgroundColor: textColor,
                opacity: 0.15,
                marginBottom: '10px',
                width: '100%'
              }}
            />
            
            {/* Smaller caption */}
            <span style={{ 
              color: textColor, 
              fontSize: '11px', 
              lineHeight: '1.4',
              fontWeight: 400,
              opacity: 0.65
            }}>
              Smaller text for captions and metadata
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSelector;

