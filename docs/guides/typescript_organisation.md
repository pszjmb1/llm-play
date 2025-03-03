# TypeScript Organization Guide for LLM-Play

## Overview

This document outlines the TypeScript organization strategy for LLM-Play, focusing on maintainable and scalable type definitions that support our reinforcement learning environment testing platform.

## Core Principles

### Co-location First
Types should initially reside alongside their components or features. Only extract types when there's a clear need for sharing across multiple parts of the application.

### Domain-Driven Organization
Types are organized based on their domain within the LLM-Play ecosystem:
- Environment definitions
- Testing infrastructure
- Analytics and results
- User management

## Type Sharing Guidelines

1. **When to Create Shared Types**
   - Types used across multiple components
   - Core domain types that represent key entities
   - Types that define public interfaces or APIs

2. **When to Keep Types Co-located**
   - Component-specific prop types
   - Local state interfaces
   - Helper types used only within a single feature

3. **Type Extension Practices**
   ```typescript
   // Extending core types for specific features
   interface BaseEnvironment {
     id: string;
     name: string;
   }

   interface DetailedEnvironment extends BaseEnvironment {
     metrics: EnvironmentMetrics;
     history: ExecutionHistory[];
   }
   ```

## Schema Organization

### Co-location with Types
From the [Zod Docs](https://zod.dev/?id=introduction):
```
Zod is a TypeScript-first schema declaration and validation library. I'm using the term "schema" to broadly refer to any data type, from a simple string to a complex nested object.

Zod is designed to be as developer-friendly as possible. The goal is to eliminate duplicative type declarations. With Zod, you declare a validator once and Zod will automatically infer the static TypeScript type. It's easy to compose simpler types into complex data structures.
```

[Zod](https://zod.dev/) schemas should be co-located with their corresponding TypeScript types. This approach:
- Maintains a single source of truth
- Makes it easier to keep types and validations in sync
- Improves discoverability
- Reduces cognitive load when updating either types or schemas

Example of co-located types and schemas:

```typescript
// types/environment.ts
import { z } from 'zod';

// TypeScript interface
export interface Environment {
  id: string;
  name: string;
  description: string;
  version: string;
  metadata: EnvironmentMetadata;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Corresponding Zod schema
export const environmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string(),
  metadata: z.record(z.any()),
  status: z.enum(['pending', 'processing', 'completed', 'failed'])
});

// Helper type derived from schema
export type EnvironmentFromSchema = z.infer<typeof environmentSchema>;
```

### Schema Naming Conventions
- Suffix schema objects with `Schema` (e.g., `environmentSchema`)
- For types derived from schemas, use the suffix `FromSchema` (e.g., `EnvironmentFromSchema`)
- Keep schema property names identical to interface property names

### Schema Organization Patterns

1. **Basic Co-location**
```typescript
// types/submission.ts
export interface Submission { ... }
export const submissionSchema = z.object({ ... });
```

2. **Nested Schemas**
```typescript
// types/test-execution.ts
export interface TestConfig { ... }
export interface TestExecution { ... }

export const testConfigSchema = z.object({ ... });
export const testExecutionSchema = z.object({
  config: testConfigSchema,
  ...
});
```

3. **Shared Schema Components**
```typescript
// types/common.ts
export const commonSchemas = {
  id: z.string().uuid(),
  timestamp: z.date(),
  metadata: z.record(z.any())
} as const;

// types/environment.ts
import { commonSchemas } from './common';

export const environmentSchema = z.object({
  id: commonSchemas.id,
  createdAt: commonSchemas.timestamp,
  ...
});
```

## Best Practices

1. **Naming Conventions**
   - Use PascalCase for interface and type names
   - Use descriptive, domain-specific names
   - Prefix interfaces with 'I' only when necessary for clarity

2. **Type Safety**
   - Use strict type checking
   - Avoid `any` types
   - Leverage union types for finite sets of values
   - Use generics for reusable type patterns

3. **Documentation**
   - Include JSDoc comments for complex types
   - Document type parameters and constraints
   - Provide examples for non-obvious use cases

4. **Organization**
   - Group related types in the same file
   - Keep type definitions close to their primary usage
   - Create index files for better type importing

## Implementation Example

Here's a practical example of how these principles come together:

```typescript
// features/test-execution/types.ts
import type { Environment } from '@/types/environment';
import type { TestStatus } from '@/types/testing';

export interface TestExecutionProps {
  environment: Environment;
  config: TestExecutionConfig;
  onComplete: (results: TestResults) => void;
  onError: (error: TestError) => void;
}

export interface TestExecutionConfig {
  retryCount?: number;
  timeout?: number;
  validateOutput?: boolean;
}

export interface TestError {
  code: string;
  message: string;
  stack?: string;
}

// Component implementation
const TestExecution: React.FC<TestExecutionProps> = ({
  environment,
  config,
  onComplete,
  onError,
}) => {
  // Implementation
};
```

## Maintenance and Evolution

1. **Regular Type Audits**
   - Review and refactor types periodically
   - Remove unused types
   - Consolidate similar types
   - Update documentation

2. **Version Control**
   - Include type changes in PR descriptions
   - Document breaking type changes
   - Maintain backwards compatibility when possible

3. **Testing**
   - Include type testing in CI/CD
   - Use TypeScript's strict mode
   - Test edge cases and type boundaries

## Conclusion

This TypeScript organization strategy ensures that LLM-Play maintains a scalable and maintainable type system. By following these guidelines, we can maintain type safety while keeping the codebase organized and easy to understand.

Remember that this is a living document, and the organization strategy should evolve with the project's needs. Regular reviews and updates to this guide are encouraged as new patterns and requirements emerge.