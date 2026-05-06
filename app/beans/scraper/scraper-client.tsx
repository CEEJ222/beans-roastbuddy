'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScrapeResult {
  success: boolean
  message: string
  profileId?: string
  error?: string
}

interface DiscoverItem {
  url: string
  alreadyExists: boolean
}

interface DiscoverResponse {
  success: boolean
  vendor?: string
  vendorNotes?: string | null
  total?: number
  truncated?: boolean
  items?: DiscoverItem[]
  message?: string
  error?: string
}

type Mode = 'single' | 'bulk' | 'listing'

export default function ScraperClient() {
  const [singleUrl, setSingleUrl] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [listingUrl, setListingUrl] = useState('')
  const [mode, setMode] = useState<Mode>('single')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScrapeResult[]>([])
  const [discovered, setDiscovered] = useState<DiscoverResponse | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [discoverError, setDiscoverError] = useState<string | null>(null)
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

  const scrapeUrls = async (urls: string[]) => {
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

        if (!response.ok || !data.success) {
          scrapeResults.push({
            success: false,
            message: data.message || 'Failed to scrape profile',
            error: data.error || `HTTP ${response.status}`,
          })
        } else {
          scrapeResults.push(data)
        }

        setResults([...scrapeResults])
      } catch (error) {
        scrapeResults.push({
          success: false,
          message: `Failed to scrape: ${url}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        setResults([...scrapeResults])
      }
    }
  }

  const handleBulkScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    const urls = bulkUrls.split('\n').filter(url => url.trim())
    if (urls.length === 0) return

    setLoading(true)
    setResults([])
    await scrapeUrls(urls)
    setLoading(false)
  }

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listingUrl.trim()) return

    setLoading(true)
    setDiscovered(null)
    setDiscoverError(null)
    setResults([])

    try {
      const response = await fetch('/api/beans/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: listingUrl }),
      })
      const data: DiscoverResponse = await response.json()

      if (!response.ok || !data.success) {
        setDiscoverError(data.error || data.message || `HTTP ${response.status}`)
      } else {
        setDiscovered(data)
        // Default-select all NEW items (not already in catalog)
        const fresh = (data.items || [])
          .filter((it) => !it.alreadyExists)
          .map((it) => it.url)
        setSelectedUrls(new Set(fresh))
      }
    } catch (error) {
      setDiscoverError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleScrapeSelected = async () => {
    const urls = Array.from(selectedUrls)
    if (urls.length === 0) return
    setLoading(true)
    setResults([])
    await scrapeUrls(urls)
    setLoading(false)
  }

  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    if (!discovered?.items) return
    setSelectedUrls(checked ? new Set(discovered.items.map((it) => it.url)) : new Set())
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
        <button
          onClick={() => setMode('listing')}
          className={`px-4 py-2 rounded-md font-medium ${
            mode === 'listing'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Listing URL
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

      {/* Listing URL Form */}
      {mode === 'listing' && (
        <div className="space-y-4">
          <form onSubmit={handleDiscover} className="space-y-4">
            <div>
              <label htmlFor="listing-url" className="block text-sm font-medium text-gray-700 mb-2">
                Listing / collection / category page URL
              </label>
              <input
                id="listing-url"
                type="url"
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="https://www.sweetmarias.com/green-coffee/latest-additions.html"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Paste a vendor listing/collection page. We&apos;ll find the product URLs and let you choose which to scrape.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !listingUrl.trim() || results.length > 0}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && !discovered ? 'Discovering...' : 'Discover Products'}
            </button>
          </form>

          {discoverError && (
            <div className="p-3 rounded-md text-sm bg-red-50 text-red-800">
              ✗ {discoverError}
            </div>
          )}

          {discovered?.items && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {discovered.vendor} — found {discovered.total} product{discovered.total === 1 ? '' : 's'}
                    {discovered.truncated && ' (capped at 100)'}
                  </div>
                  {discovered.vendorNotes && (
                    <div className="text-xs text-amber-700 mt-1">⚠ {discovered.vendorNotes}</div>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedUrls.size === discovered.items.length && discovered.items.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                  Select all
                </label>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-md divide-y">
                {discovered.items.map((item) => (
                  <label
                    key={item.url}
                    className="flex items-start gap-3 p-2 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUrls.has(item.url)}
                      onChange={() => toggleUrl(item.url)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-mono text-xs text-gray-700">{item.url}</div>
                      {item.alreadyExists && (
                        <div className="text-xs text-amber-600">already in catalog — will re-scrape and update</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={handleScrapeSelected}
                disabled={loading || selectedUrls.size === 0}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && results.length > 0
                  ? `Scraping ${results.length} of ${selectedUrls.size}...`
                  : `Scrape ${selectedUrls.size} selected`}
              </button>
            </div>
          )}
        </div>
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
