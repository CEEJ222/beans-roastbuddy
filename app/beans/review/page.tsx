import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface CoffeeProfile {
  id: string
  name: string
  vendor: string
  price_per_lb: number | null
  country: string | null
  status: string
  created_at: string
}

export default async function ReviewPage() {
  const { supabase } = await requireAdmin()

  const { data: profiles, error } = await supabase
    .from('vendor_coffee_catalog')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profiles:', error)
  }

  const profilesList = (profiles || []) as CoffeeProfile[]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
            <p className="mt-2 text-gray-600">
              {profilesList.length} pending profile{profilesList.length !== 1 ? 's' : ''} to review
            </p>
          </div>
          <Link
            href="/beans/scraper"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Scrape New Profile
          </Link>
        </div>

        {profilesList.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No pending profiles to review</p>
            <Link
              href="/beans/scraper"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
            >
              Scrape your first profile →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profilesList.map((profile) => (
              <Link
                key={profile.id}
                href={`/beans/review/${profile.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {profile.name || 'Unnamed Coffee'}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>{profile.vendor}</div>
                  {profile.price_per_lb && (
                    <div>${profile.price_per_lb.toFixed(2)}/lb</div>
                  )}
                  {profile.country && <div>{profile.country}</div>}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Pending • {formatTimeAgo(profile.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

