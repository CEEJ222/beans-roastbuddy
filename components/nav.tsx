'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, ExternalLink } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Don't show nav on login or unauthorized pages
  if (pathname === '/login' || pathname === '/unauthorized') {
    return null
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
    }
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Beans Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://roastbuddy.app', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Main Site
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {loading ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

