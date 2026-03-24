import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Always allow login and unauthorized pages first - this prevents 404s
    // Check this BEFORE doing anything else that might throw
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/unauthorized') {
      let response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
      
      // Only check auth if we're on login page to potentially redirect
      if (request.nextUrl.pathname === '/login') {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          if (supabaseUrl && supabaseKey) {
            const supabase = createServerClient(
              supabaseUrl,
              supabaseKey,
              {
                cookies: {
                  getAll() {
                    return request.cookies.getAll()
                  },
                  setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                      request.cookies.set(name, value)
                      response.cookies.set(name, value, options)
                    })
                  },
                },
              }
            )
            
            const { data: { user } } = await supabase.auth.getUser()
            
            // If user is already authenticated, redirect to scraper
            if (user) {
              return NextResponse.redirect(new URL('/beans/scraper', request.url))
            }
          }
        } catch (error) {
          // If auth check fails, just allow access to login page
          if (process.env.NODE_ENV === 'development') {
            console.error('[Middleware] Auth check failed on login page:', error)
          }
          // Continue to return response - allow access to login page
        }
      }
      
      return response
    }

    // Protect /beans routes - require authentication
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
    
    if (request.nextUrl.pathname.startsWith('/beans')) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Middleware] Missing Supabase environment variables')
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value)
                response.cookies.set(name, value, options)
              })
            },
          },
        }
      )

      // Refresh the session and get user - this ensures cookies are properly read
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Debug logging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Checking auth for:', request.nextUrl.pathname)
        console.log('[Middleware] User:', user ? user.email : 'none')
        console.log('[Middleware] Error:', error)
      }
      
      // If no user or there's an error, redirect to login
      if (!user || error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] No user or auth error, redirecting to login')
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] User authenticated, allowing access')
      }
    } catch (error) {
      // If auth check fails, redirect to login
      if (process.env.NODE_ENV === 'development') {
        console.error('[Middleware] Auth check failed:', error)
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

    return response
  } catch (error) {
    // If anything fails, log it but don't block the request
    // This ensures routes are always accessible even if middleware has issues
    if (process.env.NODE_ENV === 'development') {
      console.error('[Middleware] Unexpected error:', error)
    }
    // Return a default response to allow the request to proceed
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

