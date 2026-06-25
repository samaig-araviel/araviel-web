# Araviel Web

The web client for Araviel — one interface for every leading AI model, with the right model picked for each task automatically.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)

---

## Overview

Araviel Web is the React frontend that talks to the **Araviel API**. You send a message, the backend routes it through **ADE** to the best model, and the answer streams back in real time.

Key features:

- **Chat** — streamed responses with thinking timelines, citations, and markdown support
- **Projects** — group related conversations with shared context
- **Images** — generated image gallery with download options
- **Shares** — public, read-only snapshots of conversations
- **Exports** — save conversations as Word, PDF, Excel, or PowerPoint files
- **Model selection & comparison** — switch between models or compare responses side-by-side
- **Subscriptions & credits** — Stripe-powered plan management, usage tracking, and credit packs
- **Settings** — theme (light/dark/system), preferences, account, and usage insights
- **Analytics** — dashboard to track usage patterns
- **Age verification** — COPPA-compliant 13+ requirement with age gating

---

## Tech Stack

### Core Framework

- **React 18** + **React Router** for the UI and navigation
- **Redux Toolkit** for global state management

### Build & Dev

- **Vite** for fast dev server and optimized builds
- **Vitest** + **Testing Library** for unit and component tests

### Backend & Auth

- **Supabase** for authentication, realtime subscriptions, and storage
- **@vercel/speed-insights** for performance monitoring

### Content & Export

- **Highlight.js** for syntax highlighting code blocks
- **Mermaid** for diagram rendering
- **Recharts** for data visualization and analytics
- **DOMPurify** for HTML sanitization
- **File export libraries**: docx, exceljs, pdfmake, pptxgenjs for Word, Excel, PDF, & PowerPoint

### Code Quality

- **ESLint** with React and React Hooks plugins
- **Prettier** for consistent code formatting
- **Husky** + **Lint-Staged** for git hooks and pre-commit linting

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/samaig-araviel/araviel-web.git
cd araviel-web
npm install
```

### Environment

Create a `.env` file pointing at the backend and Supabase. Ask your team for the values — never commit them.

```env
VITE_ARAVIEL_API_BASE=   # Base URL of the Araviel API
VITE_SUPABASE_URL=       # Supabase project URL
VITE_SUPABASE_ANON_KEY=  # Supabase anon (public) key
VITE_SITE_ORIGIN=        # Public origin used for share links and SEO
```

### Run

```bash
npm run dev       # start the dev server at http://localhost:5173
npm run build     # production build (includes prebuild model sync)
npm run preview   # preview the production build

# Testing
npm test          # run the test suite once
npm run test:watch   # run tests in watch mode

# Code Quality
npm run lint      # lint the codebase
npm run lint:fix  # automatically fix linting issues
npm run format    # format code with Prettier

# Development
npm run sync-models  # manually sync AI models from backend
```

---

## Code Quality & Style

This project enforces code consistency through:

- **ESLint** for static analysis — catches bugs and enforces best practices
- **Prettier** for formatting — all code is automatically formatted
- **Husky** + **Lint-Staged** — linting and formatting run automatically before commits

No need to manually format; just use `npm run lint:fix` and `npm run format` before pushing.

---

## Deployment

Built for **Vercel**: connect the repository (Vite is auto-detected), set the `VITE_*` environment variables in the project settings, and deploy.

**Note:** The build process automatically syncs AI models from the backend during `prebuild` — you don't need to manually run `sync-models` (though you can run it locally for development).

Any static host that serves the `dist/` folder with SPA fallback works too (Next.js, Firebase Hosting, Netlify, etc.).
