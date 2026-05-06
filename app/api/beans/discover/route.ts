import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findVendorByUrl, isProductUrl, stripQueryAndHash, VENDORS } from '@/lib/vendors'

const MAX_URLS = 100

async function fetchLinksWithFirecrawl(url: string): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY env var not set')

  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['links'],
      onlyMainContent: false,
      waitFor: 2000,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firecrawl error ${res.status}: ${text.substring(0, 200)}`)
  }

  const json = await res.json()
  const links = json?.data?.links
  if (!Array.isArray(links)) {
    throw new Error('Firecrawl returned no links')
  }
  return links.filter((l): l is string => typeof l === 'string')
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid URL provided' },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const vendor = findVendorByUrl(url)
    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unknown vendor',
          error: `No registry entry matches this hostname. Supported vendors: ${VENDORS.map((v) => v.name).join(', ')}`,
        },
        { status: 400 },
      )
    }

    let links: string[]
    try {
      links = await fetchLinksWithFirecrawl(url)
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch listing page',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
        { status: 502 },
      )
    }

    const productUrls = Array.from(
      new Set(
        links
          .filter((l) => isProductUrl(l, vendor))
          .map(stripQueryAndHash),
      ),
    ).slice(0, MAX_URLS)

    let existing: Set<string> = new Set()
    if (productUrls.length > 0) {
      const { data } = await supabase
        .from('vendor_coffee_catalog')
        .select('vendor_url, status')
        .in('vendor_url', productUrls)
      if (data) {
        existing = new Set(data.map((r: { vendor_url: string }) => r.vendor_url))
      }
    }

    const items = productUrls.map((u) => ({
      url: u,
      alreadyExists: existing.has(u),
    }))

    return NextResponse.json({
      success: true,
      vendor: vendor.name,
      vendorNotes: vendor.notes ?? null,
      total: items.length,
      truncated: links.filter((l) => isProductUrl(l, vendor)).length > MAX_URLS,
      items,
    })
  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while discovering products',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
