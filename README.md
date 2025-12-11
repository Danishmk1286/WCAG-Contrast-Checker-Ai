# 🎨 Contrast Buddy: AI-Driven WCAG Color Contrast Checker

<div align="center">

![WCAG 2.2 Compliant](https://img.shields.io/badge/WCAG-2.2-22C55E?style=for-the-badge&logo=accessibility&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**AI-powered WCAG color contrast checker that detects accessibility issues and suggests accessible color combinations using machine learning.**

[🚀 Live Demo](https://www.thecolorcontrastchecker.com/) • [📖 Features](#features) • [🤝 Contribute](#contributing)

</div>

---

## ✨ Features

- ✅ **WCAG 2.2 Compliance** - Full support for AA and AAA level checking
- ✅ **AI-Powered Suggestions** - Get intelligent color alternatives (optional OpenAI API)
- ✅ **Smart Fallback** - Works without AI using algorithmic suggestions
- ✅ **Real-Time Preview** - See contrast ratio update instantly
- ✅ **One-Click Swap** - Instantly swap foreground and background colors
- ✅ **Zero Backend** - Works entirely in the browser
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai.git
cd WCAG-Contrast-Checker-Ai
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

---

## 🎯 Usage

1. Enter or pick your text and background colors
2. View the contrast ratio and WCAG compliance status
3. If failing, click "Get AI Fix Suggestions" for accessible alternatives
4. Click any suggestion to apply it instantly

### AI Configuration (Optional)

The app works without any configuration using smart algorithmic suggestions.

To enable AI-powered suggestions, create a `.env` file:

```env
VITE_AI_API_KEY=your-openai-api-key
VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
```

---

## 📊 WCAG 2.2 Requirements

| Level | Normal Text (≤18pt) | Large Text (≥18pt or ≥14pt bold) |
|-------|---------------------|-----------------------------------|
| **AA** | 4.5:1 | 3:1 |
| **AAA** | 7:1 | 4.5:1 |

---

## 🏗️ Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool
- **Pure CSS** - No framework dependencies
- **OpenAI API** (Optional) - For AI-powered suggestions

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- 🌍 Internationalization
- 🎨 UI/UX improvements
- 🧪 Testing
- 📱 Mobile enhancements
- 🐛 Bug fixes
- ⚡ Performance optimization
- 📚 Documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live Demo**: [www.thecolorcontrastchecker.com](https://www.thecolorcontrastchecker.com/)
- **Repository**: [github.com/Danishmk1286/WCAG-Contrast-Checker-Ai](https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai)
- **WCAG Guidelines**: [W3C WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)

---

<div align="center">

**Made with ❤️ for an accessible web**

⭐ Star this repo if you find it helpful!

</div>
