# LLM-Play Codebase Guide

## Build & Test Commands
- **Development**: `npm run dev` - Start Next.js development server
- **Build**: `npm run build` - Production build
- **Lint**: `npm run lint` - Run ESLint
- **Format**: `npm run format` - Run Prettier
- **Tests**: `npm run test` - Run all tests with Vitest
- **Single Test**: `npm run test -- path/to/test` (example: `npm run test -- __tests__/services/submission.test.ts`)
- **Watch Tests**: `npm run test:watch` - Run tests in watch mode
- **Coverage**: `npm run test:coverage` - Test with coverage report

## Code Style Guidelines
- **TypeScript**: Use strict typing with explicit interfaces/types
- **Imports**: Use absolute imports with `@/` prefix (e.g., `@/components/ui/button`)
- **React**: Use functional components with hooks
- **Forms**: Use react-hook-form with zod schemas for validation
- **State**: Prefer React hooks (useState, useEffect) for local state
- **Error Handling**: Use try/catch blocks with proper error typing (see SubmissionError pattern)
- **Testing**: Component tests with @testing-library/react, mock external dependencies
- **Database**: Use repository pattern to abstract database operations
- **CSS**: Use Tailwind with class-variance-authority for component styling
- **Components**: Use shadcn/ui component structure with proper composition