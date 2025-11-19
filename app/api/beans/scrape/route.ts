import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// HuggingFace Space FastAPI endpoint
// Format: https://[username]-[space-name].hf.space/api/scrape
function getHuggingFaceApiUrl(): string {
  const envUrl = process.env.HF_SPACE_API_URL
  
  // If env var is set and is a URL, use it
  if (envUrl && envUrl.startsWith('http')) {
    // If it already has /api/scrape, use as-is
    if (envUrl.includes('/api/scrape')) {
      return envUrl
    }
    // Otherwise append /api/scrape
    return `${envUrl.replace(/\/$/, '')}/api/scrape`
  }
  
  // If it's a space ID format (username/space-name), convert to URL
  if (envUrl && envUrl.includes('/') && !envUrl.startsWith('http')) {
    const [username, spaceName] = envUrl.split('/')
    const subdomain = `${username}-${spaceName.replace(/_/g, '-')}`
    return `https://${subdomain}.hf.space/api/scrape`
  }
  
  // Default FastAPI endpoint
  return 'https://Ceej222-Green-Coffee-Bot.hf.space/api/scrape'
}

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

    // Call HuggingFace Space FastAPI endpoint
    const hfApiUrl = getHuggingFaceApiUrl()
    
    // Clean URL - remove query parameters that might cause issues
    // Some scraping endpoints have trouble with variant parameters
    let cleanUrl = url
    try {
      const urlObj = new URL(url)
      // Remove query parameters if present (like ?variant=...)
      if (urlObj.search) {
        console.log('Removing query parameters from URL:', urlObj.search)
        cleanUrl = urlObj.origin + urlObj.pathname
      }
    } catch (e) {
      // If URL parsing fails, use original
      console.warn('Failed to parse URL for cleaning:', e)
    }
    
    const requestBody = { url: cleanUrl }
    
    console.log('=== HuggingFace FastAPI Request ===')
    console.log('API URL:', hfApiUrl)
    console.log('Original URL:', url)
    console.log('Cleaned URL:', cleanUrl)
    console.log('Request body:', JSON.stringify(requestBody))

    let scrapedData: any
    try {
      // Add timeout to prevent hanging requests (5 minutes max)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minutes
      
      let scrapeResponse: Response
      try {
        scrapeResponse = await fetch(hfApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }

      const responseText = await scrapeResponse.text()
      console.log('Response status:', scrapeResponse.status)
      console.log('Response text:', responseText.substring(0, 500))

      if (!scrapeResponse.ok) {
        console.error('HuggingFace API error:', responseText)
        console.error('Status:', scrapeResponse.status)
        console.error('Full response text (first 1000 chars):', responseText.substring(0, 1000))
        
        // Parse error details if possible
        let errorMessage = `API returned ${scrapeResponse.status}`
        let isJsonError = false
        
        // Check if response looks like JSON before trying to parse
        const trimmedResponse = responseText.trim()
        const looksLikeJson = trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[')
        
        if (looksLikeJson) {
          try {
            const errorJson = JSON.parse(responseText)
            // Check for detail field (FastAPI format)
            if (errorJson.detail) {
              errorMessage = errorJson.detail
              // Check if the error is about JSON parsing (from the API itself)
              if (errorMessage.includes('Expecting property name') || errorMessage.includes('JSON') || errorMessage.includes('parse')) {
                isJsonError = true
                errorMessage = 'The scraping service encountered an error processing this URL. This may be due to the website structure or service issues. Please try again or contact support if the problem persists.'
              }
              // If detail is just "Bad request:" or empty, try to get more info
              if (errorMessage.trim().endsWith(':') || errorMessage.trim().length === 0) {
                errorMessage = `Bad request from scraping service (HTTP ${scrapeResponse.status}). The URL may not be supported or the service may be experiencing issues.`
              }
            } else if (errorJson.error || errorJson.message) {
              // Check for other common error field names
              errorMessage = errorJson.error || errorJson.message || errorMessage
            } else {
              // If we have JSON but no error details, use the full response
              errorMessage = JSON.stringify(errorJson).substring(0, 200)
            }
          } catch (parseError) {
            // Response looked like JSON but failed to parse - this is unusual
            console.error('Failed to parse error response as JSON:', parseError)
            isJsonError = true
            errorMessage = `The scraping service returned an invalid response. Please try again or contact support if the problem persists.`
          }
        } else {
          // Response is not JSON, use the text directly
          const textPreview = responseText.substring(0, 200).trim()
          if (textPreview) {
            errorMessage = textPreview
          } else {
            errorMessage = `HTTP ${scrapeResponse.status} error from scraping service`
          }
        }
        
        // Check for specific error types and provide user-friendly messages
        if (errorMessage.includes('Gateway Time-out') || errorMessage.includes('504') || scrapeResponse.status === 504) {
          errorMessage = 'The scraping service timed out. This may be due to high demand or the website taking too long to respond. Please try again in a moment.'
        } else if (errorMessage.includes('Bad request') || scrapeResponse.status === 400) {
          errorMessage = `The scraping service could not process this URL. The URL may be invalid, not supported, or the service may be experiencing issues. (HTTP ${scrapeResponse.status})`
        } else if (errorMessage.includes('Expecting property name') || isJsonError) {
          // Already handled above, but ensure we have a user-friendly message
          if (!errorMessage.includes('scraping service')) {
            errorMessage = 'The scraping service encountered an error processing this URL. This may be due to the website structure or service issues. Please try again or contact support if the problem persists.'
          }
        }
        
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to scrape profile',
            error: errorMessage,
          },
          { status: 500 }
        )
      }

      // Try to parse as JSON
      let response
      try {
        response = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to parse API response',
            error: 'API returned invalid JSON',
          },
          { status: 500 }
        )
      }

      // Extract the actual data from the response (API returns {success: true, data: {...}})
      if (response.success && response.data) {
        scrapedData = response.data
      } else {
        console.error('API response missing success or data:', response)
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid API response format',
            error: 'API response missing expected data structure',
          },
          { status: 500 }
        )
      }

      console.log('Scraped data from FastAPI:', JSON.stringify(scrapedData, null, 2))
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      
      // Handle timeout/abort errors
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
          return NextResponse.json(
            {
              success: false,
              message: 'Request timed out',
              error: 'The scraping request took too long and was cancelled. Please try again with a different URL or contact support if the problem persists.',
            },
            { status: 504 }
          )
        }
      }
      
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to scraping API',
          error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        },
        { status: 500 }
      )
    }

    // Guard: Ensure scrapedData is defined (should never happen, but safety check)
    if (!scrapedData) {
      console.error('scrapedData is undefined after API call')
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid API response',
          error: 'No data returned from scraping API',
        },
        { status: 500 }
      )
    }

    // Extract vendor from URL or data
    const vendor = extractVendorFromUrl(url) || scrapedData.vendor || 'Unknown'
    
    // Extract name from URL if not in scraped data
    function extractNameFromUrl(url: string): string | null {
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        // Usually the last part is the product name
        const lastPart = pathParts[pathParts.length - 1]
        // Convert from slug format (ethiopia-sidama-daye-bensa-natural) to readable
        return lastPart
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      } catch {
        return null
      }
    }
    
    // Use parsed name, or extract from URL, or fallback
    const parsedName = scrapedData.name || extractNameFromUrl(url)
    const name = parsedName || 'Unnamed Coffee'

    // Helper function to safely extract nested values
    function getValue(data: any, ...keys: string[]): any {
      for (const key of keys) {
        if (data?.[key] !== undefined && data[key] !== null && data[key] !== '') {
          return data[key]
        }
      }
      return null
    }
    
    // Handle altitude - could be single value or range
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
    
    // Handle process method - check multiple possible field names
    const processMethod = getValue(scrapedData, 'process_method', 'process', 'processing', 'processing_method')
    
    // Handle price - check multiple possible field names
    const pricePerLb = getValue(scrapedData, 'price_per_lb', 'price_per_lb', 'price', 'price_per_pound', 'cost_per_lb')
    
    // Handle flavor notes - could be array, string, or comma-separated string
    let flavorNotes: string[] | null = null
    const flavorNotesValue = getValue(scrapedData, 'flavor_notes', 'flavor_profile', 'tasting_notes', 'notes')
    if (Array.isArray(flavorNotesValue)) {
      flavorNotes = flavorNotesValue.filter((n: any) => n)
    } else if (typeof flavorNotesValue === 'string') {
      flavorNotes = flavorNotesValue.split(',').map((n: string) => n.trim()).filter(Boolean)
    }
    
    // Handle recommended roast levels - could be array or comma-separated string
    let recommendedRoastLevels: string[] | null = null
    const roastLevelsValue = getValue(scrapedData, 'recommended_roast_levels', 'roast_levels', 'roast_level')
    if (Array.isArray(roastLevelsValue)) {
      recommendedRoastLevels = roastLevelsValue.filter((n: any) => n).map((s: string) => s.toLowerCase())
    } else if (typeof roastLevelsValue === 'string') {
      recommendedRoastLevels = roastLevelsValue.split(',').map((n: string) => n.trim().toLowerCase()).filter(Boolean)
    }
    
    // Handle espresso_suitable - convert 'yes'/'no' strings to boolean
    const espressoValue = getValue(scrapedData, 'espresso_suitable', 'espresso', 'suitable_for_espresso')
    let espressoSuitable: boolean | null = null
    if (espressoValue === true || espressoValue === 'yes' || String(espressoValue).toLowerCase() === 'true') {
      espressoSuitable = true
    } else if (espressoValue === false || espressoValue === 'no' || String(espressoValue).toLowerCase() === 'false') {
      espressoSuitable = false
    }
    
    // Handle arrival_date - should be DATE format
    let arrivalDate: string | null = null
    const arrivalDateValue = getValue(scrapedData, 'arrival_date', 'arrival', 'arrived')
    if (arrivalDateValue) {
      try {
        const date = new Date(arrivalDateValue)
        if (!isNaN(date.getTime())) {
          arrivalDate = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
        }
      } catch {
        arrivalDate = null
      }
    }
    
    // Handle cupping_score - should be numeric
    let cuppingScore: number | null = null
    const cuppingScoreValue = getValue(scrapedData, 'cupping_score', 'score', 'cupping')
    if (cuppingScoreValue !== null && cuppingScoreValue !== undefined && cuppingScoreValue !== '') {
      const parsed = parseFloat(String(cuppingScoreValue))
      if (!isNaN(parsed)) {
        cuppingScore = parsed
      }
    }
    
    // Helper function to normalize intensity values (0-5)
    function normalizeIntensity(value: any): number | null {
      if (value == null || value === '') return null
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num) || num < 0 || num > 5) return null
      return Math.round(num)
    }

    
    const altitude = extractAltitude(scrapedData)

    // Prepare data for database
    const profileData: any = {
      status: 'pending',
      vendor,
      vendor_product_id: getValue(scrapedData, 'vendor_product_id', 'product_id', 'id') || extractProductIdFromUrl(url),
      vendor_url: url,
      name: name,
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
    
    console.log('Final profile data being saved:', JSON.stringify(profileData, null, 2))

    // Check if record already exists (unique constraint on vendor + vendor_product_id)
    const { data: existing, error: lookupError } = await supabase
      .from('vendor_coffee_catalog')
      .select('id, status, reviewed_by, reviewed_at, rejection_reason')
      .eq('vendor', profileData.vendor)
      .eq('vendor_product_id', profileData.vendor_product_id)
      .maybeSingle()

    // If lookup fails (not just "not found"), log but continue with insert
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.warn('Error checking for existing record:', lookupError)
    }

    let result
    if (existing) {
      // Record exists - update it, but preserve review status if already approved
      const updateData: any = { ...profileData }
      
      // If already approved, don't overwrite review fields or status
      if (existing.status === 'approved') {
        delete updateData.status
        delete updateData.reviewed_by
        delete updateData.reviewed_at
        delete updateData.rejection_reason
      } else {
        // If pending or rejected, reset to pending and clear review fields
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
          {
            success: false,
            message: 'Failed to update profile in database',
            error: error.message,
          },
          { status: 500 }
        )
      }

      result = data
    } else {
      // New record - insert it
      const { data, error } = await supabase
        .from('vendor_coffee_catalog')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to save profile to database',
            error: error.message,
          },
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

