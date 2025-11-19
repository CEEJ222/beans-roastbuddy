import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

export const metadata: Metadata = {
  title: 'Beans Admin - Roast Buddy',
  description: 'Admin interface for coffee catalog management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}

