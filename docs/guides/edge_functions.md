# Edge Functions Guide for LLM-Play

## Introduction

This guide explains how Edge Functions are used in LLM-Play for submission handling. Edge Functions provide a lightweight, low-latency way to process API requests at the edge (closer to users), improving global performance.

## Next.js Edge API Routes vs. Supabase Edge Functions

LLM-Play uses **Next.js Edge API Routes** for submission handling instead of Supabase Deno Edge Functions. Key differences:

| Feature      | Next.js Edge API Routes   | Supabase Edge Functions           |
| ------------ | ------------------------- | --------------------------------- |
| Runtime      | Edge Runtime (V8 isolate) | Deno Runtime                      |
| Integration  | Built into Next.js        | Separate deployment               |
| Cold Start   | Very fast                 | Fast                              |
| Node.js APIs | Limited subset            | Deno APIs (similar but different) |
| Deployment   | With main application     | Separate process                  |
| Code Reuse   | Direct access to app code | Needs duplication                 |

See [ADR-0004](../adrs/ADR-0004.md) for details on this architectural decision.

## Current Edge Function Implementation

LLM-Play currently implements the following Edge Functions:

1. **Environment Submission** (`/app/api/edge-submit/route.ts`):
   - Validates environment submissions
   - Stores data in the environments table
   - Creates jobs for processing
   - Returns detailed results or errors

## Using Edge Functions From the Frontend

To use the Edge Functions from frontend components:

```typescript
import { EdgeSubmissionService } from '@/services/edge-submission';

// Create the service
const edgeSubmissionService = new EdgeSubmissionService();

// Use it to submit an environment
try {
  const result = await edgeSubmissionService.submitEnvironment({
    name: 'My Environment',
    description: 'This environment tests XYZ capabilities',
    metadata: {
      environmentType: 'text-game',
      difficultyLevel: 'medium',
      tags: ['reasoning', 'logic'],
      successCriteria: 'The LLM should solve all puzzles correctly',
    },
  });

  // Handle successful submission
  console.log('Submission successful!', result);
} catch (error) {
  // Handle errors
  console.error('Submission failed:', error.message);
}
```

## Developing New Edge Functions

When developing new Edge Functions for LLM-Play:

1. **Configure the Edge Runtime**:

   ```typescript
   export const config = {
     runtime: 'edge',
   };
   ```

2. **Keep Dependencies Minimal**:

   - Edge functions have size limitations
   - Avoid large libraries

3. **Handle CORS if Needed**:

   ```typescript
   // Add CORS headers for cross-origin requests
   const response = NextResponse.json({ ... });
   response.headers.set('Access-Control-Allow-Origin', '*');
   return response;
   ```

4. **Comprehensive Error Handling**:

   - Always return structured error responses
   - Include appropriate HTTP status codes

5. **Testing Edge Functions**:
   - Create dedicated tests in `__tests__/api/[function-name]/route.test.ts`
   - Mock the Edge runtime environment
   - Test both success and error cases

## Best Practices

- **Keep Functions Focused**: Each Edge Function should do one thing well
- **Validate Inputs**: Always validate all inputs before processing
- **Structured Responses**: Use consistent response formats
- **Error Codes**: Include meaningful error codes for frontend handling
- **Logging**: Include appropriate logging for debugging
- **Performance**: Optimize for fast cold starts and response times

## Limitations

- Limited access to Node.js APIs
- 1MB size limit for the function bundle
- No access to filesystem APIs
- Limited memory and CPU
- Some npm packages may not be compatible

## Resources

- [Next.js Edge Runtime Documentation](https://nextjs.org/docs/app/api-reference/edge)
- [Edge API Route Examples](https://github.com/vercel/next.js/tree/canary/examples/edge-api-routes)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (for comparison)
