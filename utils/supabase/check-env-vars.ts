// Returns true if the required Supabase environment variables are present.
export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);