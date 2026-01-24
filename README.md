# Araviel Web

A modern React web application for Araviel - an AI assistant interface.

## What is Araviel?

Araviel is a clean, minimalist AI chat interface featuring:

- **Collapsible Sidebar** - Navigation with Home, Projects, Library, and Settings
- **Recent Chats** - Quick access to previous conversations
- **Theme Switching** - Light, Dark, and System theme modes
- **Chat Interface** - Clean input area with mode selection (Auto, Code, Write)
- **Responsive Design** - Works on all screen sizes

## Tech Stack

- **React 18** - UI library
- **Redux Toolkit** - State management
- **Vite** - Build tool and dev server
- **CSS Modules** - Scoped styling

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/samaig-araviel/araviel-web.git
   cd araviel-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── Icons.jsx          # SVG icon components
│   ├── Sidebar/           # Sidebar navigation component
│   │   ├── Sidebar.jsx
│   │   ├── Sidebar.module.css
│   │   └── index.js
│   └── MainContent/       # Main chat interface
│       ├── MainContent.jsx
│       ├── MainContent.module.css
│       └── index.js
├── store/
│   ├── index.js           # Redux store configuration
│   └── slices/
│       ├── themeSlice.js  # Theme state management
│       ├── sidebarSlice.js # Sidebar state management
│       └── chatSlice.js   # Chat state management
├── App.jsx                # Main application component
├── App.css                # App-level styles
├── main.jsx               # Application entry point
└── index.css              # Global styles and CSS variables
```

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-detect Vite and configure the build
5. Click Deploy

Or use the Vercel CLI:

```bash
npm install -g vercel
vercel
```

## API Integration

This is the frontend UI for Araviel. To connect to your backend API:

1. Create a `.env` file:
   ```
   VITE_API_URL=https://your-api-url.com
   ```

2. Use the environment variable in your API calls:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL
   ```

## License

MIT
