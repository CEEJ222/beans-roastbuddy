import { requireAdmin } from '@/lib/auth'
import ScraperClient from './scraper-client'

export default async function ScraperPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coffee Profile Scraper</h1>
          <p className="mt-2 text-gray-600">
            Enter URLs to scrape coffee profiles from vendor websites
          </p>
        </div>
        <ScraperClient />
      </div>
    </div>
  )
}

