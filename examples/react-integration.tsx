/**
 * React Integration Example
 * 
 * This example shows how to integrate the color contrast checker
 * into a React application.
 */

import React, { useState, useMemo } from "react";
import { checkCompliance } from "../src/lib/colorUtils";
import { ColorSelector } from "../src/components/ColorSelector";
import { ContrastResults } from "../src/components/ContrastResults";

/**
 * Example React component using the color contrast checker
 */
export const ColorContrastDemo: React.FC = () => {
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  // Calculate contrast compliance
  const contrastResult = useMemo(() => {
    return checkCompliance(textColor, backgroundColor);
  }, [textColor, backgroundColor]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Color Contrast Checker</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Color Inputs */}
          <div className="space-y-6">
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

          {/* Results */}
          <div>
            <ContrastResults
              textColor={textColor}
              backgroundColor={backgroundColor}
            />
          </div>
        </div>

        {/* Usage Info */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Select your text color using the color picker</li>
            <li>Select your background color</li>
            <li>View the contrast ratio and WCAG compliance</li>
            <li>Use the suggestions to find accessible alternatives</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// Example of programmatic usage
export const useColorContrast = (
  textColor: string,
  backgroundColor: string
) => {
  return useMemo(() => {
    return checkCompliance(textColor, backgroundColor);
  }, [textColor, backgroundColor]);
};

