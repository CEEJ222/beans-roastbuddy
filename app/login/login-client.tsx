'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPageClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Beans admin] Supabase client init failed:', message)
      setError(
        message.includes('Missing Supabase')
          ? 'Server is missing Supabase env vars. In Vercel → beans-roastbuddy → Settings → Environment Variables, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for Production, then redeploy.'
          : 'Failed to initialize authentication. Please check your configuration.'
      )
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      setError('Authentication not ready. Please refresh the page.')
      return
    }

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message || 'Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      if (!data?.session) {
        setError('Login failed - no session created')
        setLoading(false)
        return
      }

      // Explicitly set the session to ensure cookies are written
      // This is important for @supabase/ssr to properly set cookies
      const { error: sessionError } = await supabase.auth.setSession(data.session)
      if (sessionError) {
        console.error('Failed to set session:', sessionError)
        setError('Failed to save session: ' + sessionError.message)
        setLoading(false)
        return
      }

      // Verify the session is available
      const {
        data: { session: verifySession },
      } = await supabase.auth.getSession()
      if (!verifySession) {
        setError('Session not available after login')
        setLoading(false)
        return
      }

      console.log('Login successful, session verified. Redirecting...')

      // Wait a moment to ensure cookies are written to the browser
      // This is important for the middleware to read the cookies on the next request
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Use window.location.replace for a hard redirect (doesn't add to history)
      // This ensures a full page reload and the middleware will definitely see the cookies
      window.location.replace('/beans/scraper')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Beans Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage the coffee catalog
          </p>
        </div>
        <form onSubmit={handleSignIn} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !supabase}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
