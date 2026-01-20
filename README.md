# Araviel - Your Intelligent AI Companion

<div align="center">

**The next generation of AI assistance with intelligent routing, gamification, and beautiful design.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## Overview

Araviel is a premium AI chat platform that intelligently routes your queries to the optimal AI model - **Claude**, **GPT-4**, or **Gemini** - for the best possible results. With a beautiful, modern UI, comprehensive gamification system, and seamless user experience, Araviel makes AI interaction delightful and productive.

### Key Features

- **Smart Auto-Routing** - Automatically selects the best AI model based on your query content
- **Beautiful Hime Welcome Screen** - Stunning animated welcome experience with personalized greetings
- **Professional Chat Interface** - Clean, responsive design optimized for productivity
- **Full Gamification System** - XP, levels (1-10), streaks, and 16+ achievements
- **Light/Dark Theme** - Gorgeous design in both modes with smooth transitions
- **Mobile-First Design** - Works perfectly on all devices with native-like bottom navigation

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.3 |
| **Styling** | Tailwind CSS 3.4 |
| **State Management** | Zustand 4.5 with persistence |
| **Icons** | Lucide React |
| **Font** | Inter (Google Fonts) |

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/araviel-web.git
cd araviel-web

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

---

## Project Structure

```
araviel-web/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Home page (Hime Welcome)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles & design system
│   ├── chat/[id]/            # Chat conversation page
│   ├── chats/                # All conversations list
│   ├── achievements/         # Achievements & gamification
│   └── settings/             # Settings page
│
├── lib/                      # Core utilities
│   ├── store.ts              # Zustand state management
│   ├── constants.ts          # App constants & config
│   └── utils.ts              # Helper functions
│
├── types/                    # TypeScript definitions
│   └── index.ts              # All type exports
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── next.config.js
```

---

## Features in Detail

### Auto-Routing System

Araviel intelligently routes your queries to the best AI model:

| Model | Best For | Keywords Detected |
|-------|----------|-------------------|
| **Claude** | Writing, analysis, creative tasks | write, essay, analyze, explain, creative |
| **GPT-4** | Code, logic, technical tasks | code, function, debug, algorithm, calculate |
| **Gemini** | Research, facts, current events | research, what is, who is, history, data |

### Gamification System

**Levels (1-10)**
- Newcomer, Explorer, Seeker, Adept, Scholar, Sage, Master, Virtuoso, Legend, Transcendent

**XP Rewards**
- Message sent: +5 XP
- Conversation complete: +10 XP
- Daily login: +25 XP
- Streak bonus: +10 XP per day

**Achievement Categories**
- Conversations - Milestones for chat count
- Streaks - Consecutive days of use
- Exploration - Discovering features
- Mastery - Level achievements
- Special - Unique accomplishments

### Design System

The CSS design system includes:
- CSS custom properties for theming
- Smooth animations (fade, scale, float, pulse)
- Glass morphism effects
- Gradient accents and borders
- Responsive breakpoints
- Accessibility features

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hime welcome screen with quick actions |
| Chat | `/chat/[id]` | Individual conversation view |
| Chats | `/chats` | All conversations list |
| Achievements | `/achievements` | XP, levels, and badges |
| Settings | `/settings` | Theme, preferences, data management |

---

## Configuration

### Theme Colors

```css
/* Brand Colors */
--brand-primary: #6366f1    /* Indigo */
--brand-secondary: #8b5cf6  /* Purple */
--brand-accent: #ec4899     /* Pink */

/* Model Colors */
--model-claude: #d97706     /* Amber */
--model-gpt: #10b981        /* Emerald */
--model-gemini: #3b82f6     /* Blue */
```

### Local Storage

Data persisted to localStorage:
- Theme preference
- User profile & XP/Level
- Conversations & messages
- Projects
- Achievements & streak data

---

## API Integration

The current implementation uses mock responses. To integrate real APIs:

1. Create API routes in `/app/api/`
2. Update the `sendMessage` function in `/lib/store.ts`
3. Add environment variables:

```env
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_KEY=your_gemini_key
```

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Build for Production

```bash
npm run build
npm run start
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Lucide](https://lucide.dev/) - Beautiful icons

---

<div align="center">
  <p><strong>Built with Araviel</strong></p>
</div>
