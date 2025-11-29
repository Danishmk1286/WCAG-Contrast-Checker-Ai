/**
 * Index - Demo Page
 * 
 * Main demonstration page showing color contrast checking functionality.
 * This is a safe, open-source implementation without backend dependencies.
 */

import React, { useState, useMemo } from "react";
import { ColorSelector } from "../components/ColorSelector";
import { ContrastResults } from "../components/ContrastResults";
import { LivePreview } from "../components/LivePreview";
import { checkCompliance } from "../lib/colorUtils";

const Index: React.FC = () => {
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  // Calculate contrast compliance
  const contrastResult = useMemo(() => {
    return checkCompliance(textColor, backgroundColor);
  }, [textColor, backgroundColor]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800 px-4 sm:px-6 py-16 md:py-24 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-[1.1] tracking-tight">
            Color Contrast Checker
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-snug">
            Test your colors against WCAG 2.1 accessibility standards
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-500 mb-10 max-w-4xl mx-auto leading-relaxed">
            This is a demonstration of color contrast checking functionality.
            Enter your colors below to see real-time WCAG compliance results.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 py-12 md:py-16">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-stretch">
            {/* Color Controls */}
            <div className="flex flex-col">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Set Your Colors
                </h2>
                <div className="space-y-6 flex-1">
                  <ColorSelector
                    label="Text Color"
                    value={textColor}
                    onChange={setTextColor}
                    otherColor={backgroundColor}
                  />
                  <ColorSelector
                    label="Background Color"
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    otherColor={textColor}
                  />
                </div>
              </div>
            </div>

            {/* Contrast Results */}
            <div className="flex flex-col">
              <ContrastResults
                textColor={textColor}
                backgroundColor={backgroundColor}
              />
            </div>
          </div>

          {/* Live Preview Section */}
          <div id="live-preview-section" className="mt-12">
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Live Contrast Preview
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400">
                See how your colors perform in real website interfaces and
                components
              </p>
            </div>
            <LivePreview
              textColor={textColor}
              backgroundColor={backgroundColor}
            />
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-white dark:bg-gray-800 px-4 sm:px-6 py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
            About WCAG 2.1 Standards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Level AA
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Normal text: 4.5:1 contrast</li>
                <li>• Large text: 3:1 contrast</li>
                <li>• Minimum standard for most websites</li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Level AAA
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Normal text: 7:1 contrast</li>
                <li>• Large text: 4.5:1 contrast</li>
                <li>• Enhanced accessibility standard</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Credits */}
      <footer className="bg-white dark:bg-gray-800 px-4 sm:px-6 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Created by</span>
            <a
              href="https://www.linkedin.com/in/danishmk1286/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-1 underline-offset-2"
            >
              Danish
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

