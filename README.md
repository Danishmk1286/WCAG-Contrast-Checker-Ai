# Color Contrast Checker - Open Source Demo

> A demonstration of WCAG 2.1 color contrast checking functionality for educational and community purposes.

## 🎯 Purpose

This repository contains a **public demonstration** of color contrast checking features. It showcases:

- ✅ Core WCAG 2.1 contrast ratio calculations
- ✅ Interactive color selection UI
- ✅ Real-time contrast analysis
- ✅ Live preview components
- ✅ Educational examples

## ⚠️ Important Notice

**This is a demonstration repository.** It contains:

- ✅ Safe, open-source contrast calculation algorithms
- ✅ Demo UI components for educational purposes
- ✅ Example implementations
- ✅ Documentation and usage guides

**It does NOT contain:**

- ❌ Proprietary ML/AI models or algorithms
- ❌ Backend APIs or server code
- ❌ Authentication or user management
- ❌ Database schemas or migrations
- ❌ Payment or subscription logic
- ❌ Admin panels or CMS functionality
- ❌ Production secrets or configuration

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 📁 Project Structure

```
github/
├── src/
│   ├── components/      # Demo UI components
│   ├── lib/            # Core utilities (safe algorithms only)
│   ├── pages/          # Example pages
│   └── hooks/          # React hooks
├── examples/           # Usage examples
├── docs/               # Documentation
└── README.md           # This file
```

## 🧩 Core Features

### 1. Color Contrast Calculation

The core algorithm implements WCAG 2.1 contrast ratio calculation:

```typescript
import { getContrastRatio, checkCompliance } from './lib/colorUtils';

const ratio = getContrastRatio('#000000', '#ffffff');
// Returns: 21 (maximum contrast)

const compliance = checkCompliance('#333333', '#ffffff');
// Returns: { aaNormal: true, aaaNormal: false, ... }
```

### 2. Interactive Color Selector

Demo component for selecting colors with real-time feedback:

```tsx
import { ColorSelector } from './components/ColorSelector';

<ColorSelector
  label="Text Color"
  value={textColor}
  onChange={setTextColor}
/>
```

### 3. Contrast Results Display

Component showing WCAG compliance status:

```tsx
import { ContrastResults } from './components/ContrastResults';

<ContrastResults
  result={contrastResult}
  textColor={textColor}
  backgroundColor={backgroundColor}
/>
```

### 4. Live Preview

Preview component demonstrating color usage in UI:

```tsx
import { LivePreview } from './components/LivePreview';

<LivePreview
  textColor={textColor}
  backgroundColor={backgroundColor}
/>
```

## 📚 Documentation

- [Core Algorithms](./docs/core-algorithms.md) - Explanation of contrast calculation
- [Component API](./docs/component-api.md) - Component usage guide
- [Examples](./examples/) - Code examples and demos
- [WCAG Guidelines](./docs/wcag-guidelines.md) - WCAG 2.1 reference

## 🎓 Educational Value

This repository is designed for:

- **Learning**: Understand WCAG contrast requirements
- **Contributing**: Improve accessibility tools
- **Integration**: Use core algorithms in your projects
- **Teaching**: Educational examples and documentation

## 🔧 Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **TinyColor2** - Color manipulation

## 📖 Usage Examples

See the [`examples/`](./examples/) directory for:

- Basic contrast checking
- Component integration
- Custom implementations
- Best practices

## 🤝 Contributing

Contributions are welcome! This is an educational repository focused on:

- Improving documentation
- Adding examples
- Enhancing demo components
- Fixing bugs in demo code

**Note**: This repository does not accept contributions that add backend, authentication, or proprietary features.

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🔗 Full Product

This demo represents a subset of features from the full product. For the complete experience with AI suggestions, advanced features, and production capabilities, visit the main product website.

## 🙏 Acknowledgments

Built with ❤️ for web accessibility. Special thanks to the WCAG working group and the accessibility community.

---

**Remember**: This is a demonstration repository. For production use, ensure you implement proper error handling, validation, and security measures.

