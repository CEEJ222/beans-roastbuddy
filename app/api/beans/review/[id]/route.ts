import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, data, rejection_reason } = await request.json()

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
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

    if (action === 'approve') {
      // Process flavor notes - handle both array and comma-separated string
      let flavorNotes: string[] | null = null
      if (Array.isArray(data.flavor_notes)) {
        flavorNotes = data.flavor_notes.filter((n: any) => n && n.trim())
      } else if (typeof data.flavor_notes === 'string') {
        flavorNotes = data.flavor_notes.split(',').map((note: string) => note.trim()).filter(Boolean)
      }

      // Prepare update data
      const updateData: any = {
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        name: data.name || null,
        vendor: data.vendor || null,
        country: data.country || null,
        region: data.region || null,
        sub_region: data.sub_region || null,
        producer: data.producer || null,
        variety: data.variety || null,
        process_method: data.process_method || null,
        altitude_min_m: typeof data.altitude_min_m === 'number' ? data.altitude_min_m : (data.altitude_min_m ? parseInt(data.altitude_min_m) : null),
        altitude_max_m: typeof data.altitude_max_m === 'number' ? data.altitude_max_m : (data.altitude_max_m ? parseInt(data.altitude_max_m) : null),
        flavor_notes: flavorNotes,
        vendor_description: data.vendor_description || null,
        cupping_notes: data.cupping_notes || null,
        roasting_notes: data.roasting_notes || null,
        recommended_roast_levels: Array.isArray(data.recommended_roast_levels) ? data.recommended_roast_levels : null,
        price_per_lb: typeof data.price_per_lb === 'number' ? data.price_per_lb : (data.price_per_lb ? parseFloat(data.price_per_lb) : null),
        arrival_date: data.arrival_date || null,
        screen_size: data.screen_size || null,
        cupping_score: typeof data.cupping_score === 'number' ? data.cupping_score : (data.cupping_score ? parseFloat(data.cupping_score) : null),
        bean_type: data.bean_type || null,
        espresso_suitable: data.espresso_suitable === true || data.espresso_suitable === 'yes' ? true : data.espresso_suitable === false || data.espresso_suitable === 'no' ? false : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('vendor_coffee_catalog')
        .update(updateData)
        .eq('id', params.id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to approve profile', error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Profile approved' })
    } else if (action === 'reject') {
      if (!rejection_reason || !rejection_reason.trim()) {
        return NextResponse.json(
          { success: false, message: 'Rejection reason is required' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('vendor_coffee_catalog')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to reject profile', error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Profile rejected' })
    }
  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

