# AI Color Contrast Checker

A lightweight, frontend-only tool to check WCAG 2.2 color contrast compliance and get AI-powered accessible color suggestions.

![Demo](public/demo.gif)

## Features

- ✅ WCAG 2.2 contrast ratio calculation
- ✅ AA/AAA compliance checking for normal and large text
- ✅ Smart color fix suggestions that preserve hue
- ✅ Optional AI-powered suggestions via OpenAI
- ✅ One-click color swapping
- ✅ Real-time preview
- ✅ Zero backend required

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-contrast-checker)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/ai-contrast-checker)

## Install

```bash
git clone https://github.com/yourusername/ai-contrast-checker.git
cd ai-contrast-checker
npm install
```

## Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
```

## Usage

1. Enter or pick your text color
2. Enter or pick your background color
3. View the contrast ratio and WCAG compliance
4. If failing, click "Get AI Fix Suggestions" for accessible alternatives
5. Click any suggestion to apply it

## AI Configuration (Optional)

The app works without any configuration using smart algorithmic suggestions.

To enable AI-powered suggestions, copy `.env.example` to `.env` and add your OpenAI API key:

```bash
cp .env.example .env
```

```
VITE_AI_API_KEY=your-openai-api-key
VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
```

## Tech Stack

- React 18
- Vite 5
- Pure CSS (no frameworks)

## WCAG 2.2 Contrast Requirements

| Level | Normal Text | Large Text |
|-------|-------------|------------|
| AA    | 4.5:1       | 3:1        |
| AAA   | 7:1         | 4.5:1      |

Large text = 18pt+ regular or 14pt+ bold

## License

MIT © 2024


