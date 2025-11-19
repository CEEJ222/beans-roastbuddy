'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, ExternalLink, Coffee, FileCheck, Database, Scissors } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

  const navLinks = [
    { href: '/beans/review', label: 'Review Queue', icon: FileCheck },
    { href: '/beans', label: 'Green Coffee Catalog', icon: Database },
    { href: '/beans/scraper', label: 'Add Coffee Profile', icon: Scissors },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/beans" className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Beans Admin</h1>
            </Link>
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'flex items-center gap-2',
                        isActive && 'bg-accent'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
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

