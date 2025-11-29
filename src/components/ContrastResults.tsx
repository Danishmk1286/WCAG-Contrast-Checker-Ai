/**
 * ContrastResults - Demo Component
 * 
 * Displays WCAG 2.1 compliance results for a color pair.
 * This is a safe, open-source implementation.
 */

import React from "react";
import { checkCompliance } from "../lib/colorUtils";

interface ContrastResultsProps {
  textColor: string;
  backgroundColor: string;
}

export const ContrastResults: React.FC<ContrastResultsProps> = ({
  textColor,
  backgroundColor,
}) => {
  const result = checkCompliance(textColor, backgroundColor);

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
      {/* Contrast Ratio Display */}
      <div className={`text-center py-8 px-4 rounded-xl border-2 transition-all ${
        result.ratio >= 4.5
          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
          : result.ratio >= 3
          ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800"
          : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800"
      }`}>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Contrast Ratio
        </div>
        <div className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-none">
          {result.ratio.toFixed(2)}
        </div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          :1
        </div>
        <div
          className={`text-base font-semibold mt-2 ${
            result.ratio >= 4.5
              ? "text-green-700 dark:text-green-300"
              : result.ratio >= 3
              ? "text-amber-700 dark:text-amber-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {result.ratio >= 4.5
            ? "✓ Great contrast"
            : result.ratio >= 3
            ? "⚠ Fair contrast"
            : "✗ Poor contrast"}
        </div>
      </div>

      {/* WCAG Compliance Badges */}
      <div className="grid grid-cols-2 gap-4">
        {/* Normal Text */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Normal Text
          </div>
          <div className="flex flex-col gap-2.5">
            <div
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                result.aaNormal
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              <span className="text-sm">{result.aaNormal ? "✓" : "✗"}</span>
              <span>AA {result.aaNormal ? "Pass" : "Fail"}</span>
            </div>
            <div
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                result.aaaNormal
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              <span className="text-sm">{result.aaaNormal ? "✓" : "✗"}</span>
              <span>AAA {result.aaaNormal ? "Pass" : "Fail"}</span>
            </div>
          </div>
        </div>

        {/* Large Text */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Large Text
          </div>
          <div className="flex flex-col gap-2.5">
            <div
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                result.aaLarge
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              <span className="text-sm">{result.aaLarge ? "✓" : "✗"}</span>
              <span>AA {result.aaLarge ? "Pass" : "Fail"}</span>
            </div>
            <div
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                result.aaaLarge
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              <span className="text-sm">{result.aaaLarge ? "✓" : "✗"}</span>
              <span>AAA {result.aaaLarge ? "Pass" : "Fail"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div
        className="rounded-lg border-2 border-gray-300 dark:border-gray-600 p-6 min-h-[200px] flex-1 flex flex-col"
        style={{
          backgroundColor: backgroundColor,
          color: textColor,
        }}
      >
        <div className="space-y-4 flex-1">
          <h2 className="text-2xl font-bold leading-tight">Sample Heading</h2>
          <p className="text-lg leading-relaxed">
            This is a sample paragraph demonstrating how your text color looks
            on the selected background color.
          </p>
          <p className="text-base leading-relaxed">
            Additional content to show how different text sizes appear with your
            color combination.
          </p>
          <div className="pt-4 border-t flex-1" style={{ borderColor: textColor + "30" }}>
            <p className="text-sm opacity-90 leading-relaxed">
              Smaller text for captions and metadata
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

