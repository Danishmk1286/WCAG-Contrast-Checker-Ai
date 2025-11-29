/**
 * Basic Usage Example
 * 
 * This example demonstrates how to use the core color contrast utilities
 * in your own projects.
 */

import {
  getContrastRatio,
  checkCompliance,
  suggestAccessibleColors,
  getAccessibleTextColor,
} from "../src/lib/colorUtils";

// Example 1: Calculate contrast ratio
console.log("=== Example 1: Calculate Contrast Ratio ===");
const ratio = getContrastRatio("#000000", "#ffffff");
console.log(`Black on white: ${ratio.toFixed(2)}:1`); // 21:1 (maximum)

const ratio2 = getContrastRatio("#888888", "#999999");
console.log(`Gray on gray: ${ratio2.toFixed(2)}:1`); // ~1.27:1 (poor)

// Example 2: Check WCAG compliance
console.log("\n=== Example 2: Check WCAG Compliance ===");
const compliance = checkCompliance("#333333", "#ffffff");
console.log("Dark gray on white:");
console.log(`  Ratio: ${compliance.ratio.toFixed(2)}:1`);
console.log(`  AA Normal: ${compliance.aaNormal ? "Pass" : "Fail"}`);
console.log(`  AAA Normal: ${compliance.aaaNormal ? "Pass" : "Fail"}`);
console.log(`  AA Large: ${compliance.aaLarge ? "Pass" : "Fail"}`);
console.log(`  AAA Large: ${compliance.aaaLarge ? "Pass" : "Fail"}`);

// Example 3: Get accessible text color
console.log("\n=== Example 3: Get Accessible Text Color ===");
const darkBg = "#1a1a1a";
const accessibleText = getAccessibleTextColor(darkBg);
console.log(`For background ${darkBg}, use text color: ${accessibleText}`);
const contrast = getContrastRatio(accessibleText, darkBg);
console.log(`Contrast ratio: ${contrast.toFixed(2)}:1`);

// Example 4: Suggest accessible colors
console.log("\n=== Example 4: Suggest Accessible Colors ===");
const baseColor = "#888888";
const targetBg = "#ffffff";
const suggestions = suggestAccessibleColors(baseColor, targetBg, 4.5, 5);

console.log(`Suggestions for ${baseColor} on ${targetBg}:`);
suggestions.forEach((suggestion, index) => {
  const contrast = getContrastRatio(suggestion, targetBg);
  console.log(
    `  ${index + 1}. ${suggestion} - Contrast: ${contrast.toFixed(2)}:1`
  );
});

// Example 5: Validate color scheme
console.log("\n=== Example 5: Validate Color Scheme ===");
function validateColorScheme(textColor: string, bgColor: string): boolean {
  const result = checkCompliance(textColor, bgColor);

  if (!result.aaNormal) {
    console.warn(
      `⚠️ Color combination fails WCAG AA: ${textColor} on ${bgColor}`
    );
    console.warn(`   Contrast ratio: ${result.ratio.toFixed(2)}:1`);
    console.warn(`   Required: 4.5:1 for normal text`);
    return false;
  }

  console.log(
    `✅ Color combination passes WCAG AA: ${textColor} on ${bgColor}`
  );
  console.log(`   Contrast ratio: ${result.ratio.toFixed(2)}:1`);
  return true;
}

validateColorScheme("#333333", "#ffffff"); // Should pass
validateColorScheme("#888888", "#999999"); // Should fail

