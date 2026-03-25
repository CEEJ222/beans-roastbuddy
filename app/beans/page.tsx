import { requireAdmin } from '@/lib/auth'
import type { CoffeeProfile } from '@/types/coffee'
import AllBeansClient from './all-beans-client'

export const dynamic = 'force-dynamic'

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
