export interface VendorCoffeeProfile {
  id: string
  vendor: string | null
  vendor_product_id: string | null
  vendor_url: string | null
  name: string | null
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
  recommended_roast_levels: string[] | null
  body_intensity: number | null
  acidity_intensity: number | null
  price_per_lb: number | null
  bean_type: string | null
  arrival_date: string | null
  screen_size: string | null
  cupping_score: number | null
  espresso_suitable: boolean | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  scraped_at: string | null
  created_at: string
  updated_at: string
}

