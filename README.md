# Araviel Web

The web client for Araviel — one interface for every leading AI model, with the right model picked for each task automatically.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)

---

## Overview

Araviel Web is the React frontend that talks to the **Araviel API**. You send a message, the backend routes it through **ADE** to the best model, and the answer streams back in real time.

Key features:

- **Chat** — streamed responses, with thinking and citations where supported
- **Projects** — group related conversations with shared context
- **Images** — generated image gallery
- **Shares** — public, read-only snapshots of conversations
- **Subscriptions & credits** — plan management and usage tracking
- **Settings** — theme, preferences, and account

---

## Tech Stack

- **React 18** + **React Router**
- **Redux Toolkit** for state
- **Vite** for the dev server and build
- **Supabase** for auth and realtime data
- **Vitest** + **Testing Library** for tests

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
npm run build     # production build
npm run preview   # preview the production build
npm test          # run the test suite
npm run lint      # lint
```

---

## Deployment

Built for Vercel: connect the repository (Vite is auto-detected), set the `VITE_*` environment variables in the project dashboard, and deploy. Any static host that serves the `dist/` folder with SPA fallback works too.
