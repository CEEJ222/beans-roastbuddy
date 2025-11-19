import { requireAdmin } from '@/lib/auth'
import ScraperClient from './scraper-client'

export default async function ScraperPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 lg:px-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Coffee Profile</h1>
          <p className="mt-2 text-gray-600">
            Enter URLs to extract coffee profiles from vendor websites
          </p>
        </div>
        <ScraperClient />
      </div>
    </div>
  )
}

