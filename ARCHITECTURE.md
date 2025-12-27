# Architecture Overview

This document provides an in-depth look at the Araviel application architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Layout    │  │    Page     │  │      StoreProvider      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         Components                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Sidebar  │  │   Chat   │  │  Layout  │  │   UI (shared)    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         State Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Redux Store                              ││
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────────────┐  ││
│  │  │  Chat   │  │ Project  │  │   UI   │  │      User      │  ││
│  │  │  Slice  │  │  Slice   │  │ Slice  │  │     Slice      │  ││
│  │  └─────────┘  └──────────┘  └────────┘  └────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                         Utilities                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Hooks   │  │   Lib    │  │  Types   │  │    Selectors    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
MainLayout
├── Sidebar
│   ├── SidebarHeader
│   ├── NewChatButton
│   ├── SidebarNav
│   ├── ProjectsSection
│   │   └── ProjectItem
│   │       └── ProjectChatItem
│   ├── RecentChatsSection
│   │   └── ChatItem
│   └── ProfileSection
│       └── ProfileDropdown
├── ChatInterface
│   ├── ChatHeader
│   ├── MessageList / WelcomeScreen
│   │   └── MessageItem
│   │       └── AttachmentPreview
│   └── MessageInput
│       └── ModelSelector
├── ModalManager
│   ├── ProjectFormModal
│   ├── DeleteConfirmModal
│   ├── ChatRenameModal
│   └── MoveToProjectModal
└── ToastContainer
    └── ToastItem
```

### Component Guidelines

1. **Single Responsibility**: Each component should do one thing well
2. **Composition over Inheritance**: Use composition patterns for flexibility
3. **Props Interface**: Define clear TypeScript interfaces for all props
4. **State Colocation**: Keep state as close to where it's used as possible
5. **Memoization**: Use `React.memo` for expensive renders

## State Management

### Redux Store Structure

```typescript
interface RootState {
  chat: ChatState;
  project: ProjectState;
  ui: UIState;
  user: UserState;
}
```

### Slice Responsibilities

| Slice | Responsibility |
|-------|---------------|
| `chatSlice` | Chat CRUD, messages, streaming, model selection |
| `projectSlice` | Project CRUD, categories, archiving |
| `uiSlice` | Theme, modals, dropdowns, toasts, responsive state |
| `userSlice` | User profile, settings, authentication |

### Data Flow

```
User Action → Dispatch Action → Reducer → New State → UI Update
                    ↓
            Side Effects (Thunks)
                    ↓
            API Calls (future)
                    ↓
            Dispatch Success/Failure
```

### Selectors

We use memoized selectors (via `createSelector`) for:
- Computing derived state
- Preventing unnecessary re-renders
- Encapsulating state shape

```typescript
// Example selector composition
export const selectCurrentChatMessages = createSelector(
  [selectCurrentChat],
  (chat) => chat?.messages ?? []
);
```

## Styling Architecture

### Design Tokens

CSS variables define the design system:

```css
:root {
  --background-primary: #0d0f12;
  --text-primary: #ffffff;
  --accent-primary: #6366f1;
  /* ... */
}
```

### Utility Classes

We use Tailwind CSS with custom configuration:

1. **Base Layer**: Reset and typography
2. **Components Layer**: Reusable component styles
3. **Utilities Layer**: Single-purpose utilities

### cn() Helper

The `cn()` function merges Tailwind classes safely:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  props.className
)} />
```

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useTheme` | Theme management with system detection |
| `useMediaQuery` | Responsive breakpoint detection |
| `useScrollPosition` | Track scroll state for auto-scroll |
| `useKeyboardShortcuts` | Global keyboard shortcuts |
| `useLocalStorage` | Persist state to localStorage |

## Performance Considerations

### Code Splitting

- Components are loaded dynamically where appropriate
- Heavy dependencies are lazy-loaded

### Memoization Strategy

1. **Components**: `React.memo` for expensive renders
2. **Callbacks**: `useCallback` for stable references
3. **Values**: `useMemo` for expensive computations
4. **Selectors**: `createSelector` for derived state

### Bundle Optimization

- Tree-shaking enabled
- CSS purging in production
- Image optimization via Next.js

## Security Considerations

### XSS Prevention

- All user content is sanitized before rendering
- dangerouslySetInnerHTML is used sparingly with DOMPurify

### State Security

- Sensitive data is not persisted to localStorage
- API keys should use environment variables

## Testing Strategy

### Unit Tests

- Components with React Testing Library
- Hooks with renderHook
- Utils with Jest

### Integration Tests

- User flows with Cypress
- API integration with MSW

### Type Safety

- Strict TypeScript mode
- No implicit any
- Exhaustive type checking

## Future Considerations

### Scalability

- Consider splitting large slices
- Implement proper caching strategy
- Add service worker for offline support

### API Integration

- Define API client abstraction
- Implement proper error handling
- Add request caching/deduplication

### Real-time Features

- WebSocket integration for streaming
- Optimistic updates
- Conflict resolution
