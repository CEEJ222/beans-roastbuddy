import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}

