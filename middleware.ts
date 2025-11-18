import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  // This is important for cookie-based auth with @supabase/ssr
  const { data: { user }, error } = await supabase.auth.getUser()

  // Don't protect login or unauthorized pages
  // If user is already authenticated and on login page, redirect to scraper
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/unauthorized') {
    if (user && request.nextUrl.pathname === '/login') {
      // User is logged in but on login page - redirect to scraper
      return NextResponse.redirect(new URL('/beans/scraper', request.url))
    }
    return response
  }

  // Protect /beans routes - require authentication
  if (request.nextUrl.pathname.startsWith('/beans')) {
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Checking auth for:', request.nextUrl.pathname)
      console.log('[Middleware] User:', user ? user.email : 'none')
      console.log('[Middleware] Error:', error)
      console.log('[Middleware] Cookies:', request.cookies.getAll().map(c => c.name))
    }
    
    // If no user and no error (means not authenticated), redirect to login
    if (!user && !error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] No user, redirecting to login')
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // If there's an auth error, also redirect to login
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Auth error, redirecting to login:', error.message)
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] User authenticated, allowing access')
    }
  }

  return response
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

