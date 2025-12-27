# Contributing to Araviel

Thank you for your interest in contributing to Araviel! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/araviel-web.git
   cd araviel-web
   ```

3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/original-org/araviel-web.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check for linting errors
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(chat): add message editing functionality
fix(sidebar): resolve project dropdown not closing
docs(readme): update installation instructions
```

### Branch Naming

Use descriptive branch names:
- `feature/add-message-reactions`
- `fix/sidebar-scroll-issue`
- `docs/api-documentation`
- `refactor/message-component`

## Making Changes

### Component Development

1. Create components in the appropriate directory:
   - `src/components/ui/` for reusable UI components
   - `src/components/chat/` for chat-specific components
   - `src/components/sidebar/` for sidebar components
   - `src/components/layout/` for layout components

2. Follow the component template:
   ```typescript
   'use client';

   import * as React from 'react';
   import { cn } from '@/lib/utils';

   interface ComponentProps {
     // Define props
   }

   const Component: React.FC<ComponentProps> = ({ ...props }) => {
     return (
       // JSX
     );
   };

   export { Component };
   ```

3. Export from the directory's `index.ts`

### State Management

1. Add actions and reducers to the appropriate slice in `src/store/slices/`
2. Create selectors in `src/store/selectors.ts`
3. Use typed hooks from `src/store/hooks.ts`

### Styling Guidelines

1. Use Tailwind CSS utility classes
2. Use CSS variables for colors and design tokens
3. Use the `cn()` utility for conditional classes
4. Keep responsive design in mind

### TypeScript Guidelines

1. Enable strict mode (already configured)
2. Define interfaces for all props and state
3. Avoid `any` type - use `unknown` if necessary
4. Export types from `src/types/`

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

1. Place tests next to the code they test or in `__tests__/` directories
2. Use descriptive test names
3. Test user interactions, not implementation details

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Submitting Changes

### Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Ensure no linting errors
4. Update the CHANGELOG.md if applicable
5. Create a Pull Request with a clear description

### Pull Request Template

```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
[Describe how you tested your changes]

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests for my changes
- [ ] All tests pass locally
- [ ] I have updated documentation as needed
```

### Review Process

1. A maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS information

### Feature Requests

Include:
- Clear description of the feature
- Use case / problem it solves
- Possible implementation approach
- Mockups if applicable

## Questions?

Feel free to open a discussion on GitHub or reach out to the maintainers.

Thank you for contributing! 🎉
