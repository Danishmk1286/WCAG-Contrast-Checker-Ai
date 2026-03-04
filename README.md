# 🎨 Smart Color Contrast Assistant · AI-Driven WCAG Checker

![WCAG 2.2 Compliant](https://img.shields.io/badge/WCAG-2.2-22C55E?style=for-the-badge&logo=accessibility&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
[![Live Demo](https://img.shields.io/badge/Live-Demo-22C55E?style=for-the-badge&logo=vercel&logoColor=white)](https://www.thecolorcontrastchecker.com/)
[![GitHub Stars](https://img.shields.io/github/stars/Danishmk1286/WCAG-Contrast-Checker-Ai?style=for-the-badge&logo=github)](https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai/stargazers)

> **AI-powered WCAG 2.1 / 2.2 color contrast checker that preserves brand identity while making color combinations accessible.**

🌐 **Live Demo:** https://www.thecolorcontrastchecker.com/

💻 **Source Code:** https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai

---

<!-- Replace the line below with your actual demo GIF after recording with ScreenToGif -->
![Demo](https://github.com/user-attachments/assets/893ce398-d552-4337-86a1-25fe3a2c7dc4)

---

## 💡 What Is This?

Smart Color Contrast Assistant is a **machine-learning powered WCAG contrast checker** built for designers, frontend engineers, and accessibility specialists.

Unlike traditional tools that only say "Pass" or "Fail", this assistant:

- Detects accessibility issues
- Suggests the **closest brand-safe accessible alternatives**
- Ranks results using perceptual color difference (Delta E CIEDE2000)
- Supports WCAG AA and AAA for normal and large text

It helps teams fix accessibility problems **without compromising brand identity**.

---

## 🆚 How It Compares

| Feature | This Tool | WebAIM | Coolors | Adobe CC |
|---|---|---|---|---|
| AI color suggestions | ✅ | ❌ | ❌ | ❌ |
| Preserves brand colors | ✅ | ❌ | ❌ | ❌ |
| Color blindness preview | ✅ | ❌ | ✅ | ✅ |
| WCAG AA + AAA | ✅ | ✅ | ✅ | ✅ |
| 100% client-side | ✅ | ✅ | ✅ | ❌ |
| Perceptual Delta E ranking | ✅ | ❌ | ❌ | ❌ |
| Real-time live preview | ✅ | ❌ | ❌ | ❌ |

---

## 🚨 The Problem

Brand colors often fail WCAG contrast requirements.

Most contrast checkers:

- Only identify the issue
- Offer no intelligent fix
- Force manual trial and error
- Lead to inconsistent accessible alternatives

This results in:

- Time wasted adjusting colors manually
- Compromised aesthetics
- Inconsistent design systems
- Frustration between design and engineering teams

---

## ✨ Key Features

### 🎯 WCAG 2.1 & 2.2 Compliance
- AA and AAA validation
- Normal and large text thresholds
- Real-time ratio calculation

### 🤖 AI-Powered Color Suggestions
- Uses **TensorFlow.js** for ML-based recommendations
- Suggests the minimum visual adjustment needed
- Preserves hue when possible
- Prioritises brand similarity

### 🧠 Perceptual Accuracy
- Delta E (CIEDE2000) sorting
- Ensures suggested colors are perceptually closest to original

### 👁 Color Blindness Simulation
Preview how color pairs appear for users with:
- Protanopia
- Deuteranopia
- Tritanopia

### 🎨 Multiple Input Methods
- HEX, RGB, HSL
- Interactive color picker

### ⚡ Real-Time Feedback
- Instant contrast ratio
- Live pass/fail indicators
- Immediate suggestion updates

### 🔁 One-Click Swap
Instantly invert foreground and background colors.

### 🌐 100% Client-Side (Core Checker)
All contrast calculations run in the browser — no data leaves your machine.

---

## 🖼 Screenshots

<img width="1028" height="902" alt="Smart Color Contrast Assistant" src="https://github.com/user-attachments/assets/b6085b2e-e8f8-4e5e-8ea4-d6975f0ec051" />

---

## 📊 WCAG 2.2 Reference

| Level | Normal Text | Large Text |
|-------|-------------|------------|
| AA    | 4.5 : 1     | 3 : 1      |
| AAA   | 7 : 1       | 4.5 : 1    |

---

## 🧠 How It Works

1. User enters foreground and background colors.
2. The system calculates relative luminance and contrast ratio using WCAG formulas.
3. If contrast fails:
   - TensorFlow.js model evaluates color space
   - Generates minimal adjustments
   - Ranks suggestions using Delta E
4. Only accessible suggestions are displayed.

The goal is **maximum accessibility with minimum visual change**.

---

## 🏗 Tech Stack

### Frontend
- React 18 · TypeScript · Vite 5
- Tailwind CSS · Shadcn/ui
- TensorFlow.js · React Router

### Backend (Optional CMS / Blog)
- Node.js · Express
- SQLite (better-sqlite3) · JWT Authentication

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Frontend Setup

```bash
git clone https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai.git
cd WCAG-Contrast-Checker-Ai
npm install
cp .env.example .env
npm run dev
```

App runs at: `http://localhost:5173`

### Backend Setup (Optional CMS)

```bash
cd server
npm install
cp .env.example .env
npm start
```

API runs at: `http://localhost:3001`

---

## 🔐 Environment Variables

### Frontend (.env)
```
VITE_API_BASE=https://api.yourdomain.com/api
```

### Backend (server/.env)
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

See `.env.example` files for full configuration.

---

## 📜 Available Scripts

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run train-model` | Train ML color model |

### Backend
| Script | Description |
|--------|-------------|
| `npm start` | Start server |
| `npm run sync-blogs` | Sync blog posts |

---

## 📁 Project Structure

```
├── src/
│   ├── components/     # UI Components
│   ├── pages/
│   ├── hooks/
│   ├── lib/            # Color & WCAG utilities
│   └── data/
├── server/
├── public/
├── scripts/            # ML model logic
├── open_core/
└── docs/
```

---

## 🔒 Privacy & Security

- Core contrast calculations run **locally** — no data sent to any server
- No custom backend required for color checking
- Backend only used for CMS/blog features
- Environment variables protect API keys

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m "Add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

### 💡 Contribution Ideas
- Improved ML model training
- Better perceptual color ranking
- Unit & integration testing
- UI refinements & performance optimisation
- Internationalization
- Documentation improvements

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🔗 References

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">

Made with ♥ and accessibility in mind by **Danish K.**

**If this tool saved you time, a ⭐ means the world and helps other developers discover it!**

[![Star this repo](https://img.shields.io/github/stars/Danishmk1286/WCAG-Contrast-Checker-Ai?style=social)](https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai/stargazers)

</div>
