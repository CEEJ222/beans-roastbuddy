'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, ExternalLink, Coffee, FileCheck, Database, Plus, Menu } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  // Don't show sidebar on login or unauthorized pages
  if (pathname === '/login' || pathname === '/unauthorized') {
    return null
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
    }
  }

  const navLinks = [
    { href: '/beans/review', label: 'Review Queue', icon: FileCheck },
    { href: '/beans', label: 'Green Coffee Catalog', icon: Database },
    { href: '/beans/scraper', label: 'Add Coffee Profile', icon: Plus },
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Coffee className="h-6 w-6" />
        <h1 className="text-xl font-semibold">Beans Admin</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-3 py-4 border-t space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => window.open('https://roastbuddy.app', '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          Main Site
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="h-4 w-4" />
          {loading ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar (Sheet) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 lg:border-r bg-background">
        <NavContent />
      </aside>

      {/* Spacer for desktop sidebar */}
      <div className="hidden lg:block lg:w-64" />
    </>
  )
}
