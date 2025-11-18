'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScrapeResult {
  success: boolean
  message: string
  profileId?: string
  error?: string
}

export default function ScraperClient() {
  const [singleUrl, setSingleUrl] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScrapeResult[]>([])
  const router = useRouter()

  const handleSingleScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!singleUrl.trim()) return

    setLoading(true)
    setResults([])

    try {
      const response = await fetch('/api/beans/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleUrl }),
      })

      const data = await response.json()
      setResults([data])
      
      if (data.success) {
        setSingleUrl('')
        setTimeout(() => {
          router.push('/beans/review')
        }, 2000)
      }
    } catch (error) {
      setResults([{
        success: false,
        message: 'Failed to scrape profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleBulkScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    const urls = bulkUrls.split('\n').filter(url => url.trim())
    if (urls.length === 0) return

    setLoading(true)
    setResults([])

    const scrapeResults: ScrapeResult[] = []
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i].trim()
      try {
        const response = await fetch('/api/beans/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        const data = await response.json()
        scrapeResults.push(data)
        setResults([...scrapeResults])
      } catch (error) {
        scrapeResults.push({
          success: false,
          message: `Failed to scrape: ${url}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        setResults([...scrapeResults])
      }
    }

    setLoading(false)
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Mode Toggle */}
      <div className="mb-6 flex gap-4 border-b pb-4">
        <button
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-md font-medium ${
            mode === 'single'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Single URL
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-md font-medium ${
            mode === 'bulk'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bulk URLs
        </button>
      </div>

      {/* Single URL Form */}
      {mode === 'single' && (
        <form onSubmit={handleSingleScrape} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Coffee Product URL
            </label>
            <input
              id="url"
              type="url"
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://thecaptainscoffee.com/products/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !singleUrl.trim()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scraping...' : 'Scrape Profile'}
          </button>
        </form>
      )}

      {/* Bulk URLs Form */}
      {mode === 'bulk' && (
        <form onSubmit={handleBulkScrape} className="space-y-4">
          <div>
            <label htmlFor="bulk-urls" className="block text-sm font-medium text-gray-700 mb-2">
              URLs (one per line)
            </label>
            <textarea
              id="bulk-urls"
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="https://thecaptainscoffee.com/products/...&#10;https://thecaptainscoffee.com/products/...&#10;..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !bulkUrls.trim()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? `Scraping ${results.length}...` : 'Scrape All URLs'}
          </button>
        </form>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">✓ {successCount} successful</span>
            {failCount > 0 && <span className="text-red-600">✗ {failCount} failed</span>}
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-md text-sm ${
                  result.success
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {result.success ? (
                  <div>✓ {result.message}</div>
                ) : (
                  <div>
                    ✗ {result.message}
                    {result.error && <div className="text-xs mt-1">{result.error}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {successCount > 0 && (
            <div className="mt-4">
              <button
                onClick={() => router.push('/beans/review')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Review Pending Profiles →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

