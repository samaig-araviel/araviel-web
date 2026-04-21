# Araviel Web

Web client for Araviel — one interface for every leading AI model, with the right model picked for each task automatically.

---

## Overview

Araviel Web is the React frontend that talks to the **Araviel API**. Users send a message, the API routes it through **ADE** to the best model, and the response streams back in real time.

Feature surface:

- **Chat** — streamed responses with thinking, citations, and tool activity
- **Projects** — group related conversations with shared context
- **Images** — generated image gallery
- **Shares** — public read-only snapshots of conversations
- **Search** — find prior conversations by content
- **Subscriptions & credits** — plan management and usage tracking
- **Settings** — theme, preferences, account
- **Models** — browse the catalog of supported models

---

## Tech Stack

- **React 18** + **React Router**
- **Redux Toolkit** for state (auth, chat, projects, subscription, theme, …)
- **Vite** for dev server and bundling
- **Supabase** for auth and realtime data
- **Recharts**, **Mermaid**, **highlight.js** for rich message rendering
- **Vitest** + **Testing Library** for tests

---

## Setup

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

Create a `.env` file with the variables needed to talk to the backend. Obtain the values from your team — never commit them.

```env
VITE_ARAVIEL_API_BASE=   # Base URL of the Araviel API
VITE_SUPABASE_URL=       # Supabase project URL
VITE_SUPABASE_ANON_KEY=  # Supabase anon (public) key
VITE_SITE_ORIGIN=        # Public origin used for share links and SEO
```

### Run

```bash
npm run dev       # http://localhost:5173
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # eslint
npm test          # vitest
```

---

## Project Structure

```
src/
├── components/     # Feature views (Chat, Projects, Images, Settings, ...)
├── store/
│   └── slices/     # Redux slices (auth, chat, projects, subscription, theme, ...)
├── services/       # API clients (api, auth headers, credits, subscription, ...)
├── hooks/          # Reusable React hooks
├── lib/            # Utilities (SEO, formatting, parsing, ...)
├── config/         # App configuration
├── data/           # Static data
├── router.jsx      # Route definitions
├── App.jsx         # Root layout + auth gate
└── main.jsx        # Entry point
```

---

## Deployment

Built for Vercel. Connect the repository and Vercel auto-detects Vite; set the `VITE_*` environment variables in the project dashboard and deploy. Any static host that serves the `dist/` folder with SPA fallback works too.
