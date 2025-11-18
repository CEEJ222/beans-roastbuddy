import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// HuggingFace Space API endpoint - update this with your actual endpoint
const HF_SPACE_API = process.env.HF_SPACE_API_URL || 'https://your-hf-space.hf.space/api/scrape'

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

    // Call HuggingFace Space API to scrape
    const scrapeResponse = await fetch(HF_SPACE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text()
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to scrape profile',
          error: errorText,
        },
        { status: 500 }
      )
    }

    const scrapedData = await scrapeResponse.json()

    // Extract vendor from URL or data
    const vendor = extractVendorFromUrl(url) || scrapedData.vendor || 'Unknown'

    // Prepare data for database
    const profileData = {
      status: 'pending',
      vendor,
      vendor_product_id: scrapedData.vendor_product_id || extractProductIdFromUrl(url),
      vendor_url: url,
      name: scrapedData.name || null,
      country: scrapedData.country || null,
      region: scrapedData.region || null,
      sub_region: scrapedData.sub_region || null,
      producer: scrapedData.producer || null,
      variety: scrapedData.variety || null,
      process_method: scrapedData.process_method || null,
      grade: scrapedData.grade || null,
      altitude_min_m: scrapedData.altitude_min_m || null,
      altitude_max_m: scrapedData.altitude_max_m || null,
      harvest_season: scrapedData.harvest_season || null,
      flavor_notes: Array.isArray(scrapedData.flavor_notes)
        ? scrapedData.flavor_notes
        : scrapedData.flavor_notes
        ? [scrapedData.flavor_notes]
        : null,
      vendor_description: scrapedData.vendor_description || scrapedData.description || null,
      roasting_notes: scrapedData.roasting_notes || null,
      price_per_lb: scrapedData.price_per_lb || scrapedData.price || null,
      bean_type: 'green',
      espresso_suitable: scrapedData.espresso_suitable || false,
      scraped_at: new Date().toISOString(),
    }

    // Save to database
    const { data, error } = await supabase
      .from('vendor_coffee_catalog')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to save profile to database',
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile scraped! Saved as pending review.',
      profileId: data.id,
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

