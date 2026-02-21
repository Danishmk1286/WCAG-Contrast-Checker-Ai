/**
 * WCAG Color Contrast Checker - Core Algorithm
 * 
 * This is the core contrast checking algorithm that calculates 
 * contrast ratios according to WCAG 2.1 guidelines.
 * 
 * Usage Example:
 * ```typescript
 * const checker = new WCAGContrastChecker();
 * const result = checker.check('#ffffff', '#000000');
 * console.log(result.ratio); // 21
 * console.log(result.aaNormal); // true
 * console.log(result.aaaLarge); // true
 * ```
 */

export interface ContrastResult {
    ratio: number;
    aaLarge: boolean;     // WCAG 2.1 AA for large text (>= 3:1)
    aaNormal: boolean;    // WCAG 2.1 AA for normal text (>= 4.5:1)
    aaaLarge: boolean;    // WCAG 2.1 AAA for large text (>= 4.5:1)
    aaaNormal: boolean;   // WCAG 2.1 AAA for normal text (>= 7:1)
}

export class WCAGContrastChecker {
    /**
     * Converts hex color to RGB
     * @param hex - Hex color code (e.g., "#ffffff" or "fff")
     * @returns RGB object or null if invalid
     */
    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : null;
    }

    /**
     * Calculates relative luminance according to WCAG 2.1
     * @param r - Red value (0-255)
     * @param g - Green value (0-255)
     * @param b - Blue value (0-255)
     * @returns Relative luminance (0-1)
     */
    private getLuminance(r: number, g: number, b: number): number {
        const [rs, gs, bs] = [r, g, b].map((c) => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * Calculates contrast ratio between two colors
     * @param color1 - First hex color
     * @param color2 - Second hex color
     * @returns Contrast ratio (1-21)
     */
    public getContrastRatio(color1: string, color2: string): number {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        if (!rgb1 || !rgb2) return 0;

        const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
    }

    /**
     * Checks WCAG compliance for a contrast ratio
     * @param ratio - Contrast ratio to check
     * @returns Compliance results for different levels
     */
    private checkCompliance(ratio: number): ContrastResult {
        return {
            ratio,
            aaLarge: ratio >= 3,          // WCAG 2.1 Level AA for large text
            aaNormal: ratio >= 4.5,        // WCAG 2.1 Level AA for normal text
            aaaLarge: ratio >= 4.5,        // WCAG 2.1 Level AAA for large text
            aaaNormal: ratio >= 7,         // WCAG 2.1 Level AAA for normal text
        };
    }

    /**
     * Main method to check contrast between two colors
     * @param textColor - Text color in hex
     * @param backgroundColor - Background color in hex
     * @returns Full compliance results
     */
    public check(textColor: string, backgroundColor: string): ContrastResult {
        const ratio = this.getContrastRatio(textColor, backgroundColor);
        return this.checkCompliance(ratio);
    }
}

// Example usage:
// const checker = new WCAGContrastChecker();
// const result = checker.check('#ffffff', '#4a4d4a');
// console.log(`Contrast ratio: ${result.ratio.toFixed(2)}`);
// console.log(`Passes AA (normal text): ${result.aaNormal}`);
// console.log(`Passes AAA (normal text): ${result.aaaNormal}`);
