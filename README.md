# Araviel - AI Chat Assistant

A modern, feature-rich AI chat interface built with Next.js 14, TypeScript, Tailwind CSS, and Redux Toolkit. Araviel provides a seamless experience for interacting with multiple AI models including Claude, ChatGPT, Gemini, and Perplexity.

## Features

- **Multi-Model Support**: Choose between Auto, Claude, ChatGPT, Gemini, and Perplexity
- **Project Organization**: Organize conversations into projects with custom emojis
- **Dark/Light Theme**: Automatic system theme detection with manual override
- **File Attachments**: Upload images and documents to enhance your conversations
- **Web Search**: Toggle web search for up-to-date information
- **Responsive Design**: Fully responsive with mobile-first approach
- **Keyboard Shortcuts**: Efficient navigation with keyboard shortcuts
- **State Persistence**: Conversations and settings persist across sessions

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) with strict mode
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom design system
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) with redux-persist
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Utilities**: [tailwind-merge](https://github.com/dcastil/tailwind-merge), [clsx](https://github.com/lukeed/clsx)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/araviel-web.git
cd araviel-web
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── StoreProvider.tsx   # Redux provider
├── components/
│   ├── chat/               # Chat-related components
│   │   ├── ChatHeader.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageItem.tsx
│   │   ├── MessageList.tsx
│   │   ├── ModelSelector.tsx
│   │   └── WelcomeScreen.tsx
│   ├── layout/             # Layout components
│   │   ├── MainLayout.tsx
│   │   └── ModalManager.tsx
│   ├── sidebar/            # Sidebar components
│   │   ├── NewChatButton.tsx
│   │   ├── ProfileSection.tsx
│   │   ├── ProjectsSection.tsx
│   │   ├── RecentChatsSection.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SidebarHeader.tsx
│   │   └── SidebarNav.tsx
│   └── ui/                 # Reusable UI components
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Dropdown.tsx
│       ├── IconButton.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── TextArea.tsx
│       └── Toast.tsx
├── hooks/                  # Custom React hooks
│   ├── useKeyboardShortcuts.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   ├── useScrollPosition.ts
│   └── useTheme.ts
├── lib/                    # Utility functions
│   └── utils.ts
├── store/                  # Redux store
│   ├── hooks.ts            # Typed hooks
│   ├── index.ts            # Store configuration
│   ├── selectors.ts        # Memoized selectors
│   └── slices/
│       ├── chatSlice.ts
│       ├── projectSlice.ts
│       ├── uiSlice.ts
│       └── userSlice.ts
└── types/                  # TypeScript definitions
    ├── chat.ts
    ├── index.ts
    ├── project.ts
    ├── ui.ts
    └── user.ts
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript check |
| `npm run format` | Format code with Prettier |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | New chat |
| `Ctrl/Cmd + B` | Toggle sidebar |
| `Escape` | Close modal |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |

## Design System

### Colors

The application uses a custom color palette defined in CSS variables:

- **Background**: `--background-primary`, `--background-secondary`, `--background-tertiary`
- **Text**: `--text-primary`, `--text-secondary`, `--text-tertiary`
- **Accent**: `--accent-primary`, `--accent-hover`, `--accent-glow`
- **Border**: `--border`, `--border-hover`

### Typography

- **Sans-serif**: Inter (via Google Fonts)
- **Monospace**: JetBrains Mono (for code blocks)

## State Management

The application uses Redux Toolkit with the following slices:

- **chatSlice**: Manages chats, messages, and streaming state
- **projectSlice**: Manages projects and categories
- **uiSlice**: Manages UI state (theme, modals, dropdowns, toasts)
- **userSlice**: Manages user data and settings

State is persisted to localStorage using redux-persist with the following configuration:
- Whitelisted: `chat`, `project`, `user`
- Blacklisted: `ui` (transient state)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:
- Follows the existing code style
- Has proper TypeScript types
- Includes relevant tests
- Updates documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Redux Toolkit](https://redux-toolkit.js.org/) for state management
- [Lucide](https://lucide.dev/) for beautiful icons
