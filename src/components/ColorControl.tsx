import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Copy, Pipette, Lock, Unlock, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from "@/lib/colorUtils";

// TypeScript declaration for EyeDropper API
declare global {
  interface Window {
    EyeDropper?: {
      new (): {
        open(): Promise<{ sRGBHex: string }>;
      };
    };
  }
}

interface ColorControlProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  onCopy: (color: string, label: string) => void;
  onColorChange?: (color: string, source: "picker" | "slider" | "input") => void;
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
  advancedSettingsOpen?: boolean;
  onAdvancedSettingsToggle?: (open: boolean) => void;
}

// Slider with input controls component
interface SliderWithInputProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const SliderWithInput: React.FC<SliderWithInputProps> = React.memo(({ label, value, max, unit, onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState(String(Math.round(value)));
  const [isDragging, setIsDragging] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const pendingValueRef = React.useRef<number | null>(null);
  const inputId = React.useId();
  const sliderId = React.useId();
  const labelId = React.useId();
  
  // Sync input value when slider value changes (only if not dragging)
  useEffect(() => {
    if (!isDragging) {
      const roundedValue = Math.round(value);
      setInputValue(String(roundedValue));
    }
  }, [value, isDragging]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value;
    setInputValue(val);
    
    const numVal = parseFloat(val);
    if (!isNaN(numVal) && numVal >= 0 && numVal <= max) {
      onChange(numVal); // Immediate update for input
    }
  };
  
  // PERFORMANCE: Optimized slider handling with RAF coalescing
  // This batches multiple slider updates into single RAF frames, reducing
  // unnecessary re-renders and contrast recalculations during fast drags
  const handleSliderChange = React.useCallback((newValue: number) => {
    if (disabled) return;
    
    setIsDragging(true);
    setInputValue(String(Math.round(newValue)));
    
    // Store pending value and coalesce updates
    pendingValueRef.current = newValue;
    
    // Use single RAF to batch updates at 60fps
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingValueRef.current !== null) {
          onChange(pendingValueRef.current);
        }
      });
    }
    
    // Clear and reset debounce timeout for drag end detection
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsDragging(false);
      // Final update to ensure value is synced
      if (pendingValueRef.current !== null) {
        onChange(pendingValueRef.current);
        pendingValueRef.current = null;
      }
    }, 100); // Reduced from 150ms for snappier response
  }, [disabled, onChange]);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleInputBlur = () => {
    const numVal = parseFloat(inputValue);
    if (isNaN(numVal) || numVal < 0) {
      const roundedValue = Math.round(value);
      setInputValue(String(roundedValue));
    } else if (numVal > max) {
      setInputValue(String(max));
      onChange(max);
    } else {
      onChange(numVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      return;
    }
    
    // Handle arrow keys for increment/decrement
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentVal = parseFloat(inputValue);
      const numVal = isNaN(currentVal) ? Math.round(value) : currentVal;
      const newValue = Math.min(max, Math.round(numVal) + 1);
      setInputValue(String(newValue));
      onChange(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentVal = parseFloat(inputValue);
      const numVal = isNaN(currentVal) ? Math.round(value) : currentVal;
      const newValue = Math.max(0, Math.round(numVal) - 1);
      setInputValue(String(newValue));
      onChange(newValue);
    }
  };

  return (
    <div 
      className="space-y-2 md:space-y-2.5 flex-shrink-0"
      style={{
        contain: 'layout style',
        minHeight: '80px'
      }}
    >
      <div className="flex justify-between items-center gap-2">
        <Label id={labelId} htmlFor={inputId} className="text-xs font-semibold text-foreground leading-tight flex-shrink-0">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            id={inputId}
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            min={0}
            max={max}
            step={1}
            aria-labelledby={labelId}
            aria-describedby={unit ? `${inputId}-unit` : undefined}
            className="w-16 h-8 text-xs font-mono font-bold text-center px-2 py-1 border border-border/40 rounded-md focus:ring-1 focus:ring-primary disabled:opacity-50"
            style={{
              contain: 'layout style',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"'
            }}
          />
          {unit && (
            <span id={`${inputId}-unit`} className="text-xs font-semibold text-foreground/80 min-w-[20px]" aria-hidden="true">
              {unit}
            </span>
          )}
        </div>
      </div>
      <Slider
        id={sliderId}
        value={[value]}
        onValueChange={([v]) => handleSliderChange(v)}
        disabled={disabled}
        max={max}
        step={1}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
});

SliderWithInput.displayName = "SliderWithInput";

const ColorControl = React.memo<ColorControlProps>(
  ({ color, onChange, label, onCopy, onColorChange, isLocked: externalLocked, onLockChange, advancedSettingsOpen: externalAdvancedOpen, onAdvancedSettingsToggle }) => {
    const [inputValue, setInputValue] = useState(color.toUpperCase());
    const [error, setError] = useState("");
    const [internalLocked, setInternalLocked] = useState(false);
    const [colorMode, setColorMode] = useState<"hsl" | "rgb">("hsl");
    const [internalAdvancedOpen, setInternalAdvancedOpen] = useState(false);
    const isLocked = externalLocked !== undefined ? externalLocked : internalLocked;
    const advancedSettingsOpen = externalAdvancedOpen !== undefined ? externalAdvancedOpen : internalAdvancedOpen;

    useEffect(() => {
      setInputValue(color.toUpperCase());
    }, [color]);

    const rgb = useMemo(() => hexToRgb(color), [color]);
    const hsl = useMemo(
      () => rgbToHsl(rgb.r, rgb.g, rgb.b),
      [rgb.r, rgb.g, rgb.b]
    );

    const handleHslChange = useCallback(
      (channel: "h" | "s" | "l", value: number) => {
        if (isLocked) return; // Prevent changes when locked
        const newHsl = { ...hsl, [channel]: value };
        const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        onChange(newColor);
        onColorChange?.(newColor, "slider");
      },
      [hsl, isLocked, onChange, onColorChange]
    );

    const handleRgbChange = useCallback(
      (channel: "r" | "g" | "b", value: number) => {
        if (isLocked) return; // Prevent changes when locked
        const newRgb = { ...rgb, [channel]: value };
        const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        onChange(newColor);
        onColorChange?.(newColor, "slider");
      },
      [rgb, isLocked, onChange, onColorChange]
    );

    const handleHexChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isLocked) return; // Prevent changes when locked
        let val = e.target.value.toUpperCase();

        // Auto add "#" if missing
        if (!val.startsWith("#")) {
          val = "#" + val;
        }

        setInputValue(val);

        if (/^#[0-9A-F]{6}$/i.test(val)) {
          onChange(val);
          onColorChange?.(val, "input");
          setError("");
        } else if (val.length > 1 && val.length < 7) {
          setError("Incomplete hex code");
        } else if (val.length >= 7 && !/^#[0-9A-F]{6}$/i.test(val)) {
          setError("Invalid hex code");
        } else {
          setError("");
        }
      },
      [onChange, isLocked]
    );

    const handleColorPickerChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isLocked) return; // Prevent changes when locked
        const newColor = e.target.value;
        onChange(newColor);
        onColorChange?.(newColor, "picker");
        setError("");
      },
      [onChange, isLocked, onColorChange]
    );

    const handleEyeDropperClick = useCallback(async () => {
      if (isLocked) return;
      
      // Check if EyeDropper API is available
      if (!window.EyeDropper) {
        // Fallback to color picker if EyeDropper is not available
        const colorInput = document.querySelector(`input[type="color"][aria-label*="${label}"]`) as HTMLInputElement;
        if (colorInput) {
          colorInput.click();
        }
        return;
      }

      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        
        if (result.sRGBHex) {
          const newColor = result.sRGBHex;
          onChange(newColor);
          onColorChange?.(newColor, "picker");
          setError("");
        }
      } catch (err) {
        // User cancelled or error occurred - do nothing
        console.log("Eye dropper cancelled or error:", err);
      }
    }, [isLocked, label, onChange, onColorChange]);

    const handleLockToggle = useCallback(() => {
      const newLocked = !isLocked;
      if (externalLocked === undefined) {
        setInternalLocked(newLocked);
      }
      onLockChange?.(newLocked);
    }, [isLocked, externalLocked, onLockChange]);

    const handleModeChange = useCallback((mode: "hsl" | "rgb") => {
      setColorMode(mode);
      // Color value is preserved automatically through the useMemo hooks
      // HEX code will update instantly when sliders change
    }, []);

    const handleAdvancedSettingsToggle = useCallback(() => {
      const newState = !advancedSettingsOpen;
      if (externalAdvancedOpen === undefined) {
        setInternalAdvancedOpen(newState);
      }
      onAdvancedSettingsToggle?.(newState);
      // Advanced Settings state persists - no auto-close on color changes or tab switches
    }, [advancedSettingsOpen, externalAdvancedOpen, onAdvancedSettingsToggle]);

    const handleCopyClick = useCallback(() => {
      onCopy(color, label);
    }, [color, label, onCopy]);

    const inputId = React.useId();

    return (
      <div 
        className="flex-1 flex flex-col space-y-3 md:space-y-5 min-h-0"
        style={{
          contain: 'layout style',
          willChange: 'auto'
        }}
      >
        {/* Color Picker + Hex Input - Perfectly Aligned */}
        <div className="flex items-end gap-3 md:gap-4 flex-shrink-0">
          {/* Color Picker - Desktop Only */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={handleColorPickerChange}
                disabled={isLocked}
                className={`rounded-lg border-2 border-border/60 dark:border-foreground/30 cursor-pointer shadow-md hover:border-primary hover:shadow-lg transition-colors duration-200 ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  width: '56px',
                  height: '56px',
                  contain: 'layout style paint',
                  willChange: 'border-color, box-shadow'
                }}
                aria-label={`${label} color picker`}
              />
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <Lock className="w-5 h-5 text-foreground/60" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-semibold text-foreground/80 leading-tight">Color Picker</span>
          </div>

          {/* Hex Code Input - Perfect Alignment with Icons */}
          <div className="flex-1 flex flex-col">
            <Label htmlFor={inputId} className="text-xs font-semibold text-foreground mb-2.5 block leading-tight">
              Hex Code
            </Label>
            <div className="relative">
              {/* Mobile: Color Picker Inside Input (Prefix) */}
              <div className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10">
                <input
                  type="color"
                  value={color}
                  onChange={handleColorPickerChange}
                  disabled={isLocked}
                  className={`w-7 h-7 rounded border border-border/50 cursor-pointer transition-colors duration-200 ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/60'
                  }`}
                  style={{
                    contain: 'layout style paint',
                    willChange: 'border-color'
                  }}
                  aria-label={`${label} color picker`}
                />
              </div>
              <Input
                id={inputId}
                type="text"
                value={inputValue}
                onChange={handleHexChange}
                disabled={isLocked}
                className={`font-mono text-sm font-semibold pr-20 md:pr-24 bg-background border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 h-9 md:h-11 rounded-md ${
                  isLocked ? 'opacity-70 cursor-not-allowed' : ''
                } pl-11 md:pl-3`}
                placeholder="#FFFFFF"
              />
              {/* Icons Container - Right Side */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:gap-1">
                {/* Eye Dropper Icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEyeDropperClick}
                  disabled={isLocked}
                  className={`h-8 w-8 md:h-9 md:w-9 rounded hover:bg-muted/80 transition-colors ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label={`Pick color from screen for ${label}`}
                  title="Pick color from screen (Eye dropper)"
                >
                  <Pipette className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
                {/* Lock/Unlock Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLockToggle}
                  className={`h-8 w-8 md:h-9 md:w-9 rounded hover:bg-muted/80 transition-colors ${
                    isLocked ? 'text-primary' : 'text-foreground/60'
                  }`}
                  aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
                  title={isLocked ? "Unlock color" : "Lock color"}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  )}
                </Button>
                {/* Copy Icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyClick}
                  className="h-8 w-8 md:h-9 md:w-9 rounded hover:bg-muted/80 transition-colors"
                  aria-label={`Copy ${label}`}
                  title="Copy color"
                >
                  <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="text-red-700 text-xs font-medium bg-red-100 border border-red-300 rounded-md p-1.5 mt-1.5 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700">
            {error}
          </div>
        )}

        {/* Mobile: Advanced Settings Button */}
        <div className="md:hidden flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleAdvancedSettingsToggle}
            className="w-full flex items-center justify-between gap-2 py-2 px-3.5 text-sm font-semibold border border-border/50 hover:border-primary/40 transition-colors duration-200 min-h-[40px] rounded-md"
            style={{
              contain: 'layout style',
              willChange: 'border-color'
            }}
            aria-expanded={advancedSettingsOpen}
            aria-label="Toggle advanced color settings"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Advanced Settings</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${
                advancedSettingsOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>

        {/* Mode Toggle - HSL/RGB - Desktop Always Visible, Mobile Only When Advanced Open */}
        <div className={`flex-shrink-0 mb-3 md:mb-4 ${advancedSettingsOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex gap-2 p-1 bg-muted/50 dark:bg-muted/30 rounded-md border border-border/40">
            <button
              type="button"
              role="tab"
              aria-selected={colorMode === "hsl"}
              onClick={() => handleModeChange("hsl")}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-md transition-colors duration-200 min-h-[44px] ${
                colorMode === "hsl"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-foreground/85 hover:text-foreground hover:bg-muted/50"
              }`}
              style={{
                contain: 'layout style',
                willChange: 'background-color, color'
              }}
              aria-label="HSL mode"
            >
              HSL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={colorMode === "rgb"}
              onClick={() => handleModeChange("rgb")}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-md transition-colors duration-200 min-h-[44px] ${
                colorMode === "rgb"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-foreground/85 hover:text-foreground hover:bg-muted/50"
              }`}
              style={{
                contain: 'layout style',
                willChange: 'background-color, color'
              }}
              aria-label="RGB mode"
            >
              RGB
            </button>
          </div>
        </div>

          {/* HSL/RGB Controls - Refined - Desktop Always Visible, Mobile Only When Advanced Open */}
        <div 
          className={`flex-1 flex flex-col bg-muted/30 dark:bg-muted/20 rounded-md p-3.5 md:p-5 border border-border/40 min-h-0 ${
            advancedSettingsOpen ? 'block' : 'hidden md:flex'
          }`}
          style={{
            contain: 'layout style',
            willChange: 'auto'
          }}
        >
          <div className="flex-1 flex flex-col justify-between space-y-3 md:space-y-5">
            {colorMode === "hsl" ? (
              // HSL Sliders
              [
                { key: "h", label: "Hue", max: 360, unit: "°" },
                { key: "s", label: "Saturation", max: 100, unit: "%" },
                { key: "l", label: "Lightness", max: 100, unit: "%" },
            ].map(({ key, label, max, unit }) => {
              const value = hsl[key as "h" | "s" | "l"];
              return (
                <SliderWithInput
                  key={key}
                  label={label}
                  value={value}
                  max={max}
                  unit={unit}
                  onChange={(v) => handleHslChange(key as "h" | "s" | "l", v)}
                  disabled={isLocked}
                />
              );
            })
          ) : (
              // RGB Sliders
              [
                { key: "r", label: "Red", max: 255, unit: "" },
                { key: "g", label: "Green", max: 255, unit: "" },
                { key: "b", label: "Blue", max: 255, unit: "" },
              ].map(({ key, label, max, unit }) => {
                const value = rgb[key as "r" | "g" | "b"];
                return (
                  <SliderWithInput
                    key={key}
                    label={label}
                    value={value}
                    max={max}
                    unit={unit || ""}
                    onChange={(v) => handleRgbChange(key as "r" | "g" | "b", v)}
                    disabled={isLocked}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }
);

ColorControl.displayName = "ColorControl";

export default ColorControl;
