import { WCAGContrastChecker, ContrastResult } from './wcag-contrast-checker';

/**
 * Example 1: Basic Usage
 */
function basicExample() {
    console.log('=== Example 1: Basic Usage ===');

    const checker = new WCAGContrastChecker();
    const result = checker.check('#ffffff', '#000000');

    console.log(`Contrast ratio: ${result.ratio.toFixed(2)}`);
    console.log(`Passes AA (normal text): ${result.aaNormal ? '✓' : '✗'}`);
    console.log(`Passes AAA (normal text): ${result.aaaNormal ? '✓' : '✗'}`);
    console.log();
}

/**
 * Example 2: Testing Multiple Color Combinations
 */
function batchExample() {
    console.log('=== Example 2: Batch Testing ===');

    const checker = new WCAGContrastChecker();

    const colorPairs = [
        { text: '#000000', bg: '#ffffff', name: 'Black on White' },
        { text: '#ffffff', bg: '#0066cc', name: 'White on Blue' },
        { text: '#333333', bg: '#f0f0f0', name: 'Dark Gray on Light Gray' },
        { text: '#666666', bg: '#ffffff', name: 'Medium Gray on White' },
        { text: '#ff0000', bg: '#ffffff', name: 'Red on White' },
    ];

    colorPairs.forEach(({ text, bg, name }) => {
        const result = checker.check(text, bg);
        const pass = result.aaNormal ? '✓ PASS' : '✗ FAIL';
        console.log(`${name}: ${result.ratio.toFixed(2)} ${pass}`);
    });
    console.log();
}

/**
 * Example 3: Finding Accessible Color
 */
function findAccessibleColor() {
    console.log('=== Example 3: Finding Accessible Color ===');

    const checker = new WCAGContrastChecker();
    const backgroundColor = '#0066cc';

    // Test different text colors
    const textColors = ['#ffffff', '#f0f0f0', '#cccccc', '#999999', '#666666'];

    console.log(`Finding accessible text colors for background: ${backgroundColor}`);

    for (const textColor of textColors) {
        const result = checker.check(textColor, backgroundColor);
        if (result.aaNormal) {
            console.log(`✓ ${textColor} works! (Ratio: ${result.ratio.toFixed(2)})`);
        } else {
            console.log(`✗ ${textColor} fails (Ratio: ${result.ratio.toFixed(2)})`);
        }
    }
    console.log();
}

/**
 * Example 4: Validation Function
 */
function validateColorScheme(textColor: string, bgColor: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const checker = new WCAGContrastChecker();
    const result = checker.check(textColor, bgColor);

    const passes = level === 'AAA' ? result.aaaNormal : result.aaNormal;

    if (!passes) {
        console.warn(
            `⚠️  Color combination fails WCAG ${level}: ${textColor} on ${bgColor} ` +
            `(ratio: ${result.ratio.toFixed(2)})`
        );
    }

    return passes;
}

function validationExample() {
    console.log('=== Example 4: Validation ===');

    validateColorScheme('#000000', '#ffffff', 'AA');  // Passes
    validateColorScheme('#777777', '#ffffff', 'AA');  // Fails
    validateColorScheme('#000000', '#ffffff', 'AAA'); // Passes
    console.log();
}

/**
 * Example 5: Reporting
 */
function generateReport() {
    console.log('=== Example 5: Accessibility Report ===');

    const checker = new WCAGContrastChecker();

    const colors = [
        { text: '#000000', bg: '#ffffff', label: 'Primary Text' },
        { text: '#666666', bg: '#ffffff', label: 'Secondary Text' },
        { text: '#999999', bg: '#ffffff', label: 'Disabled Text' },
    ];

    console.log('Color Scheme Accessibility Report\n');
    console.log('Component        | Ratio  | AA  | AAA | Status');
    console.log('----------------|--------|-----|-----|--------');

    colors.forEach(({ text, bg, label }) => {
        const result = checker.check(text, bg);
        const aaStatus = result.aaNormal ? '✓' : '✗';
        const aaaStatus = result.aaaNormal ? '✓' : '✗';
        const status = result.aaNormal ? 'PASS' : 'FAIL';

        console.log(
            `${label.padEnd(16)}| ${result.ratio.toFixed(2).padEnd(7)}| ${aaStatus}   | ${aaaStatus}   | ${status}`
        );
    });
    console.log();
}

// Run all examples
console.log('\n🎨 WCAG Contrast Checker - Examples\n');
console.log('═'.repeat(50) + '\n');

basicExample();
batchExample();
findAccessibleColor();
validationExample();
generateReport();

console.log('═'.repeat(50));
console.log('\n✅ All examples completed!\n');
