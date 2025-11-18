import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern to ensure only one client instance
// Using @supabase/ssr for cookie-based auth that works with middleware
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Use SSR browser client - automatically handles cookies for middleware
  supabaseClient = createBrowserClient(supabaseUrl, supabaseKey)

  return supabaseClient
}

