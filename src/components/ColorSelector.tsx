/**
 * ColorSelector - Demo Component
 * 
 * A simplified color picker component for demonstration purposes.
 * This is a safe, open-source implementation without any backend dependencies.
 */

import React, { useState } from "react";
import { getContrastRatio, checkCompliance } from "../lib/colorUtils";
import tinycolor from "tinycolor2";

interface ColorSelectorProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  otherColor?: string; // For generating suggestions
}

/**
 * Demo color suggestion generator
 * This is a simple algorithm - not a proprietary ML model
 */
const generateSimpleSuggestions = (
  baseColor: string,
  targetColor: string
): string[] => {
  const suggestions: string[] = [];
  const base = tinycolor(baseColor);
  
  // Generate more variations to ensure we get at least 4 suggestions
  const variations = [
    base.clone().lighten(30),
    base.clone().lighten(20),
    base.clone().lighten(10),
    base.clone().darken(10),
    base.clone().darken(20),
    base.clone().darken(30),
    base.clone().saturate(30),
    base.clone().saturate(20),
    base.clone().desaturate(20),
    base.clone().desaturate(30),
    base.clone().lighten(15).saturate(15),
    base.clone().darken(15).saturate(15),
  ];
  
  // First, collect all variations with their contrast ratios
  const allVariations: Array<{ hex: string; contrast: number }> = [];
  
  for (const variation of variations) {
    const hex = variation.toHexString();
    const contrast = getContrastRatio(hex, targetColor);
    if (!suggestions.includes(hex)) {
      allVariations.push({ hex, contrast });
    }
  }
  
  // Sort by contrast (highest first) and take best ones that meet AA
  allVariations.sort((a, b) => b.contrast - a.contrast);
  
  for (const { hex, contrast } of allVariations) {
    if (contrast >= 4.5) {
      suggestions.push(hex);
      if (suggestions.length >= 4) break;
    }
  }
  
  // If we still don't have 4, try more aggressive variations
  if (suggestions.length < 4) {
    const moreVariations = [
      base.clone().lighten(40),
      base.clone().lighten(50),
      base.clone().darken(40),
      base.clone().darken(50),
      base.clone().spin(30).lighten(20),
      base.clone().spin(-30).darken(20),
      base.clone().spin(60).lighten(15),
      base.clone().spin(-60).darken(15),
    ];
    
    for (const variation of moreVariations) {
      const hex = variation.toHexString();
      const contrast = getContrastRatio(hex, targetColor);
      
      if (!suggestions.includes(hex)) {
        if (contrast >= 4.5) {
          suggestions.push(hex);
        } else {
          // Store for fallback if we need more
          allVariations.push({ hex, contrast });
        }
        if (suggestions.length >= 4) break;
      }
    }
  }
  
  // If we still don't have 4, use the best available options (even if below AA)
  if (suggestions.length < 4) {
    allVariations.sort((a, b) => b.contrast - a.contrast);
    for (const { hex } of allVariations) {
      if (!suggestions.includes(hex)) {
        suggestions.push(hex);
        if (suggestions.length >= 4) break;
      }
    }
  }
  
  // Final fallback: generate simple variations to ensure we have 4
  let fallbackCount = 0;
  while (suggestions.length < 4 && fallbackCount < 20) {
    const fallback = base.clone()
      .lighten(fallbackCount * 5)
      .toHexString();
    if (!suggestions.includes(fallback)) {
      suggestions.push(fallback);
    }
    fallbackCount++;
  }
  
  return suggestions.slice(0, 4);
};

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  label,
  value,
  onChange,
  otherColor,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Generate suggestions when other color is available
  React.useEffect(() => {
    if (otherColor && showSuggestions) {
      const newSuggestions = generateSimpleSuggestions(value, otherColor);
      setSuggestions(newSuggestions);
    }
  }, [value, otherColor, showSuggestions]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleColorChange}
            className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const color = tinycolor(e.target.value);
              if (color.isValid()) {
                onChange(color.toHexString());
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:opacity-100"
            placeholder="#000000"
          />
        </div>
        
        {otherColor && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            aria-label="Show color suggestions"
          >
            💡 Suggestions
          </button>
        )}
      </div>

      {/* Simple color suggestions (demo only) */}
      {showSuggestions && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            AI Color Suggestions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {suggestions.slice(0, 4).map((suggestion, index) => {
              const contrast = otherColor
                ? getContrastRatio(suggestion, otherColor)
                : 0;
              const meetsAA = contrast >= 4.5;
              
              return (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="relative group flex flex-col items-center"
                  aria-label={`Use color ${suggestion} with contrast ratio ${contrast.toFixed(2)}`}
                >
                  <div
                    className={`w-full aspect-square rounded-lg border-2 transition-all shadow-sm cursor-pointer hover:scale-105 hover:shadow-md ${
                      meetsAA
                        ? "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                        : "border-amber-300 dark:border-amber-600 hover:border-amber-400 dark:hover:border-amber-500"
                    }`}
                    style={{ backgroundColor: suggestion }}
                  />
                  <div className={`mt-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                    meetsAA ? "text-gray-600 dark:text-gray-400" : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {contrast.toFixed(2)}:1
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-500 font-mono mt-0.5">
                    {suggestion}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
            Click any suggestion to apply it
          </p>
        </div>
      )}
    </div>
  );
};

