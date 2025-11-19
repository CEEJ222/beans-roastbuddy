import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AllBeansClient from './all-beans-client'

interface CoffeeProfile {
  id: string
  name: string | null
  vendor: string | null
  vendor_product_id: string | null
  vendor_url: string | null
  country: string | null
  region: string | null
  sub_region: string | null
  producer: string | null
  variety: string | null
  process_method: string | null
  altitude_min_m: number | null
  altitude_max_m: number | null
  flavor_notes: string[] | null
  vendor_description: string | null
  roasting_notes: string | null
  price_per_lb: number | null
  bean_type: string | null
  espresso_suitable: boolean | null
  status: string
  created_at: string
  scraped_at: string | null
}

export default async function AllBeansPage() {
  const { supabase } = await requireAdmin()

  const { data: profiles, error } = await supabase
    .from('vendor_coffee_catalog')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profiles:', error)
  }

  const profilesList = (profiles || []) as CoffeeProfile[]

  return <AllBeansClient initialProfiles={profilesList} />
}
