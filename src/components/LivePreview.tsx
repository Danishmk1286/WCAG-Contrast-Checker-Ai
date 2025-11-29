/**
 * LivePreview - Demo Component
 * 
 * A simplified live preview component demonstrating color usage in UI elements.
 * This is a safe, open-source implementation without backend dependencies.
 */

import React, { useMemo } from "react";
import tinycolor from "tinycolor2";

interface LivePreviewProps {
  textColor: string;
  backgroundColor: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  textColor,
  backgroundColor,
}) => {
  // Simple design system using only user-selected colors
  const designSystem = useMemo(() => {
    const primary = tinycolor(textColor);
    const bg = tinycolor(backgroundColor);
    const isLight = bg.getLuminance() > 0.5;

    // Simple color variations
    const primaryHover = isLight
      ? primary.darken(10).toHexString()
      : primary.lighten(10).toHexString();

    const borderColor = primary.setAlpha(0.3).toHexString();
    const surface = bg.toHexString();

    return {
      primary: primary.toHexString(),
      primaryHover,
      borderColor,
      surface,
      textPrimary: textColor,
      bg: backgroundColor,
      isLight,
    };
  }, [textColor, backgroundColor]);

  return (
    <div className="space-y-6 border rounded-xl p-6 w-full border-gray-300 dark:border-gray-700 bg-transparent">
      {/* Navigation Header Preview */}
      <div className="rounded-lg border overflow-hidden border-gray-300 dark:border-gray-700">
        <div className="p-5" style={{ backgroundColor: designSystem.bg }}>
          <div className="flex items-center justify-between">
            <div
              className="text-xl font-bold leading-tight"
              style={{ color: designSystem.textPrimary }}
            >
              Brand Logo
            </div>
            <nav className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm font-semibold transition-colors"
                style={{ color: designSystem.textPrimary }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = designSystem.primaryHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = designSystem.textPrimary)
                }
              >
                Home
              </a>
              <a
                href="#"
                className="text-sm font-medium transition-colors"
                style={{ color: designSystem.textPrimary }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = designSystem.primaryHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = designSystem.textPrimary)
                }
              >
                Features
              </a>
              <button
                className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                style={{
                  backgroundColor: designSystem.primary,
                  color: designSystem.bg,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    designSystem.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    designSystem.primary;
                }}
              >
                Sign In
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Card Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Card */}
        <div
          className="rounded-lg border overflow-hidden p-6"
          style={{
            borderColor: designSystem.borderColor,
            backgroundColor: designSystem.bg,
          }}
        >
          <h3
            className="text-xs font-bold mb-5 uppercase tracking-wider"
            style={{ color: designSystem.textPrimary }}
          >
            App Card
          </h3>
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: designSystem.surface,
                borderColor: designSystem.borderColor,
              }}
            >
              <div
                className="text-base font-bold mb-2 leading-tight"
                style={{ color: designSystem.textPrimary }}
              >
                Feature Title
              </div>
              <div
                className="text-sm leading-relaxed opacity-90"
                style={{ color: designSystem.textPrimary }}
              >
                Feature description text
              </div>
            </div>
            <button
              className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              style={{
                backgroundColor: designSystem.primary,
                color: designSystem.bg,
              }}
            >
              View Details
            </button>
          </div>
        </div>

        {/* Form Example */}
        <div
          className="rounded-lg border overflow-hidden p-6"
          style={{
            borderColor: designSystem.borderColor,
            backgroundColor: designSystem.bg,
          }}
        >
          <h3
            className="text-xs font-bold mb-5 uppercase tracking-wider"
            style={{ color: designSystem.textPrimary }}
          >
            Form
          </h3>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: designSystem.textPrimary }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border text-sm placeholder:opacity-100"
                style={{
                  borderColor: designSystem.borderColor,
                  backgroundColor: designSystem.bg,
                  color: designSystem.textPrimary,
                }}
              />
            </div>
            <button
              className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              style={{
                backgroundColor: designSystem.primary,
                color: designSystem.bg,
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Buttons Showcase */}
      <div
        className="rounded-lg border overflow-hidden p-6"
        style={{
          borderColor: designSystem.borderColor,
          backgroundColor: designSystem.bg,
        }}
      >
        <h3
          className="text-xs font-bold mb-5 uppercase tracking-wider"
          style={{ color: designSystem.textPrimary }}
        >
          Buttons & States
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{
              backgroundColor: designSystem.primary,
              color: designSystem.bg,
            }}
          >
            Primary
          </button>
          <button
            className="px-5 py-2.5 rounded-lg font-semibold text-sm border transition-colors"
            style={{
              backgroundColor: "transparent",
              color: designSystem.textPrimary,
              borderColor: designSystem.borderColor,
            }}
          >
            Outline
          </button>
          <button
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors opacity-60 cursor-not-allowed"
            style={{
              backgroundColor: designSystem.primary,
              color: designSystem.bg,
            }}
            disabled
          >
            Disabled
          </button>
        </div>
      </div>
    </div>
  );
};

