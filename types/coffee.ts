/** Row shape for `vendor_coffee_catalog` (used by beans admin UI). */
export interface CoffeeProfile {
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
  cupping_notes: string | null
  roasting_notes: string | null
  recommended_roast_levels: string[] | null
  price_per_lb: number | null
  arrival_date: string | null
  screen_size: string | null
  cupping_score: number | null
  bean_type: string | null
  espresso_suitable: boolean | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  scraped_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  updated_at: string
}
