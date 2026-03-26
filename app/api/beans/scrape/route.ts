import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Step 1: Firecrawl fetches + renders the page ─────────────────────────────
async function fetchMarkdownWithFirecrawl(url: string): Promise<string> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,  // strips nav/footer/sidebar noise
      waitFor: 2000,          // handles JS-rendered content (Sweet Maria's etc.)
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firecrawl error ${res.status}: ${text.substring(0, 200)}`)
  }

  const json = await res.json()
  const markdown = json?.data?.markdown

  if (!markdown) {
    throw new Error('Firecrawl returned no markdown content')
  }

  return markdown
}

// ─── Step 2: Supabase Edge Function (DeepSeek) extracts structured fields ─────
async function extractCoffeeProfile(markdown: string, sourceUrl: string): Promise<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL env var not set')
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var not set')

  const res = await fetch(`${supabaseUrl}/functions/v1/extract-coffee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ markdown, source_url: sourceUrl }),
  })

  const text = await res.text()
  let json: { success?: boolean; data?: unknown; error?: string }
  try {
    json = JSON.parse(text) as typeof json
  } catch {
    throw new Error(`Extraction API error ${res.status}: ${text.substring(0, 200)}`)
  }

  if (!res.ok) {
    const detail =
      typeof json.error === 'string' ? json.error : text.substring(0, 300)
    throw new Error(`Extraction API error ${res.status}: ${detail}`)
  }

  if (json.success && json.data && typeof json.data === 'object') return json.data
  if (json.success === false) throw new Error(json.error ?? 'Extraction failed')

  return json
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid URL provided' },
        { status: 400 }
      )
    }

    // Verify admin auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Clean URL - strip query params (variant selectors etc.)
    let cleanUrl = url
    try {
      const urlObj = new URL(url)
      if (urlObj.search) {
        console.log('Stripping query params:', urlObj.search)
        cleanUrl = urlObj.origin + urlObj.pathname
      }
    } catch {
      console.warn('Could not parse URL for cleaning, using as-is')
    }

    console.log('=== Scrape Request ===')
    console.log('URL:', cleanUrl)

    // ── Fetch page content via Firecrawl ──────────────────────────────────────
    let scrapedData: any
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)

      try {
        const markdown = await fetchMarkdownWithFirecrawl(cleanUrl)
        console.log(`Firecrawl returned ${markdown.length} chars of markdown`)

        scrapedData = await extractCoffeeProfile(markdown, cleanUrl)
        console.log('Extracted data:', JSON.stringify(scrapedData, null, 2))
      } finally {
        clearTimeout(timeout)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
        return NextResponse.json(
          { success: false, message: 'Request timed out', error: 'The scraping request took too long. Please try again.' },
          { status: 504 }
        )
      }
      console.error('Scrape/extract error:', err)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to scrape profile',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    if (!scrapedData) {
      return NextResponse.json(
        { success: false, message: 'No data returned from extraction API' },
        { status: 500 }
      )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Everything below this line is UNCHANGED from the original route
    // ─────────────────────────────────────────────────────────────────────────

    // Extract vendor from URL or data
    const vendor = extractVendorFromUrl(url) || scrapedData.vendor || 'Unknown'

    function extractNameFromUrl(url: string): string | null {
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        const lastPart = pathParts[pathParts.length - 1]
        return lastPart
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      } catch {
        return null
      }
    }

    const parsedName = scrapedData.name || extractNameFromUrl(url)
    const name = parsedName || 'Unnamed Coffee'

    function getValue(data: any, ...keys: string[]): any {
      for (const key of keys) {
        if (data?.[key] !== undefined && data[key] !== null && data[key] !== '') {
          return data[key]
        }
      }
      return null
    }

    function extractAltitude(data: any): { min: number | null; max: number | null } {
      const altitude = getValue(data, 'altitude_min_m', 'altitude_m', 'altitude', 'elevation')
      const altitudeMax = getValue(data, 'altitude_max_m', 'altitude_max', 'elevation_max')

      if (typeof altitude === 'number') {
        return { min: altitude, max: altitudeMax || altitude }
      }
      if (typeof altitude === 'string' && altitude.includes('-')) {
        const [min, max] = altitude.split('-').map((s: string) => parseInt(s.trim()))
        return { min: isNaN(min) ? null : min, max: isNaN(max) ? null : max }
      }

      return { min: null, max: null }
    }

    const processMethod = getValue(scrapedData, 'process_method', 'process', 'processing', 'processing_method')
    const pricePerLb = getValue(scrapedData, 'price_per_lb', 'price', 'price_per_pound', 'cost_per_lb')

    let flavorNotes: string[] | null = null
    const flavorNotesValue = getValue(scrapedData, 'flavor_notes', 'flavor_profile', 'tasting_notes', 'notes')
    if (Array.isArray(flavorNotesValue)) {
      flavorNotes = flavorNotesValue.filter((n: any) => n)
    } else if (typeof flavorNotesValue === 'string') {
      flavorNotes = flavorNotesValue.split(',').map((n: string) => n.trim()).filter(Boolean)
    }

    let recommendedRoastLevels: string[] | null = null
    const roastLevelsValue = getValue(scrapedData, 'recommended_roast_levels', 'roast_levels', 'roast_level')
    if (Array.isArray(roastLevelsValue)) {
      recommendedRoastLevels = roastLevelsValue.filter((n: any) => n).map((s: string) => s.toLowerCase())
    } else if (typeof roastLevelsValue === 'string') {
      recommendedRoastLevels = roastLevelsValue.split(',').map((n: string) => n.trim().toLowerCase()).filter(Boolean)
    }

    const espressoValue = getValue(scrapedData, 'espresso_suitable', 'espresso', 'suitable_for_espresso')
    let espressoSuitable: boolean | null = null
    if (espressoValue === true || espressoValue === 'yes' || String(espressoValue).toLowerCase() === 'true') {
      espressoSuitable = true
    } else if (espressoValue === false || espressoValue === 'no' || String(espressoValue).toLowerCase() === 'false') {
      espressoSuitable = false
    }

    let arrivalDate: string | null = null
    const arrivalDateValue = getValue(scrapedData, 'arrival_date', 'arrival', 'arrived')
    if (arrivalDateValue) {
      try {
        const date = new Date(arrivalDateValue)
        if (!isNaN(date.getTime())) {
          arrivalDate = date.toISOString().split('T')[0]
        }
      } catch {
        arrivalDate = null
      }
    }

    let cuppingScore: number | null = null
    const cuppingScoreValue = getValue(scrapedData, 'cupping_score', 'score', 'cupping')
    if (cuppingScoreValue !== null && cuppingScoreValue !== undefined && cuppingScoreValue !== '') {
      const parsed = parseFloat(String(cuppingScoreValue))
      if (!isNaN(parsed)) cuppingScore = parsed
    }

    function normalizeIntensity(value: any): number | null {
      if (value == null || value === '') return null
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num) || num < 0 || num > 5) return null
      return Math.round(num)
    }

    const altitude = extractAltitude(scrapedData)

    const profileData: any = {
      status: 'pending',
      vendor,
      vendor_product_id: getValue(scrapedData, 'vendor_product_id', 'product_id', 'id') || extractProductIdFromUrl(url),
      vendor_url: url,
      name,
      country: getValue(scrapedData, 'country', 'origin_country', 'origin'),
      region: getValue(scrapedData, 'region', 'origin_region'),
      sub_region: getValue(scrapedData, 'sub_region', 'subregion', 'sub_region_name'),
      producer: getValue(scrapedData, 'producer', 'farm', 'producer_name', 'farm_name'),
      variety: getValue(scrapedData, 'variety', 'cultivar', 'varietal'),
      process_method: processMethod,
      altitude_min_m: altitude.min,
      altitude_max_m: altitude.max,
      flavor_notes: flavorNotes,
      vendor_description: getValue(scrapedData, 'vendor_description', 'description', 'product_description', 'details'),
      roasting_notes: getValue(scrapedData, 'roasting_notes', 'roast_notes', 'roasting_recommendations'),
      recommended_roast_levels: recommendedRoastLevels,
      body_intensity: normalizeIntensity(scrapedData.body_intensity),
      acidity_intensity: normalizeIntensity(scrapedData.acidity_intensity),
      price_per_lb: pricePerLb ? parseFloat(String(pricePerLb).replace(/[^0-9.]/g, '')) : null,
      arrival_date: arrivalDate,
      screen_size: getValue(scrapedData, 'screen_size', 'screen', 'size'),
      cupping_score: cuppingScore,
      bean_type: getValue(scrapedData, 'bean_type', 'bean_type_name', 'type') || null,
      espresso_suitable: espressoSuitable,
      scraped_at: new Date().toISOString(),
    }

    console.log('Final profile data:', JSON.stringify(profileData, null, 2))

    // Upsert logic — unchanged
    const { data: existing, error: lookupError } = await supabase
      .from('vendor_coffee_catalog')
      .select('id, status, reviewed_by, reviewed_at, rejection_reason')
      .eq('vendor', profileData.vendor)
      .eq('vendor_product_id', profileData.vendor_product_id)
      .maybeSingle()

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.warn('Error checking for existing record:', lookupError)
    }

    let result
    if (existing) {
      const updateData: any = { ...profileData }

      if (existing.status === 'approved') {
        delete updateData.status
        delete updateData.reviewed_by
        delete updateData.reviewed_at
        delete updateData.rejection_reason
      } else {
        updateData.status = 'pending'
        updateData.reviewed_by = null
        updateData.reviewed_at = null
        updateData.rejection_reason = null
      }

      const { data, error } = await supabase
        .from('vendor_coffee_catalog')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Database update error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to update profile in database', error: error.message },
          { status: 500 }
        )
      }

      result = data
    } else {
      const { data, error } = await supabase
        .from('vendor_coffee_catalog')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to save profile to database', error: error.message },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      message: existing
        ? 'Profile updated with latest scraped data!'
        : 'Profile scraped! Saved as pending review.',
      profileId: result.id,
    })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while scraping',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function extractVendorFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    if (hostname.includes('captainscoffee')) return "The Captain's Coffee"
    if (hostname.includes('burman')) return 'Burman Coffee Traders'
    if (hostname.includes('sweetmarias')) return "Sweet Maria's"
    return null
  } catch {
    return null
  }
}

function extractProductIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    return pathParts[pathParts.length - 1] || null
  } catch {
    return null
  }
}