# WCAG 2.1 Guidelines Reference

This document provides a quick reference for WCAG 2.1 color contrast requirements.

## Overview

The Web Content Accessibility Guidelines (WCAG) 2.1 define minimum contrast ratios for text and images of text to ensure readability for users with visual impairments.

## Contrast Ratio Requirements

### Level AA (Minimum Standard)

| Text Type | Minimum Contrast Ratio |
|-----------|----------------------|
| Normal text (< 18pt or < 14pt bold) | 4.5:1 |
| Large text (≥ 18pt or ≥ 14pt bold) | 3:1 |
| UI components and graphical objects | 3:1 |

### Level AAA (Enhanced)

| Text Type | Minimum Contrast Ratio |
|-----------|----------------------|
| Normal text | 7:1 |
| Large text | 4.5:1 |

## Text Size Definitions

### Normal Text
- Font size less than 18pt (24px)
- Font size less than 14pt (18.67px) if bold

### Large Text
- Font size 18pt (24px) or larger
- Font size 14pt (18.67px) or larger if bold

## UI Components

UI components and graphical objects require a contrast ratio of at least 3:1 against adjacent colors. This includes:
- Buttons
- Form controls
- Icons
- Graphs and charts
- Focus indicators

## Exceptions

The following are exempt from contrast requirements:
- Logos and brand names
- Decorative text that conveys no information
- Text that is part of an inactive UI component
- Text that is part of a logo or brand name

## Best Practices

1. **Test Early**: Check contrast during design phase
2. **Test Multiple Combinations**: Test text on various backgrounds
3. **Consider Context**: Ensure contrast works in all UI states
4. **Use Tools**: Leverage automated testing tools
5. **Manual Review**: Always verify with manual testing

## Resources

- [WCAG 2.1 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WCAG 2.1 Enhanced Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

## Common Contrast Ratios

| Color Pair | Contrast Ratio | WCAG Level |
|------------|---------------|-----------|
| Black on White | 21:1 | AAA |
| White on Black | 21:1 | AAA |
| Dark Gray (#333) on White | 12.6:1 | AAA |
| Medium Gray (#666) on White | 5.7:1 | AA |
| Light Gray (#999) on White | 2.8:1 | Fail |
| Blue (#0066CC) on White | 7:1 | AAA |
| Red (#CC0000) on White | 5.3:1 | AA |

## Testing Checklist

- [ ] Normal text meets AA standards (4.5:1)
- [ ] Large text meets AA standards (3:1)
- [ ] UI components meet 3:1 contrast
- [ ] Focus indicators are visible
- [ ] Text works on all background colors
- [ ] Hover states maintain contrast
- [ ] Disabled states are distinguishable
- [ ] Error states are clearly visible

