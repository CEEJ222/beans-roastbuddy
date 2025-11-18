'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  grade: string | null
  altitude_min_m: number | null
  altitude_max_m: number | null
  harvest_season: string | null
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

export default function ReviewDetailClient({ profile }: { profile: CoffeeProfile }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [editing, setEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    name: profile.name || '',
    vendor: profile.vendor || '',
    country: profile.country || '',
    region: profile.region || '',
    sub_region: profile.sub_region || '',
    producer: profile.producer || '',
    variety: profile.variety || '',
    process_method: profile.process_method || '',
    grade: profile.grade || '',
    altitude_min_m: profile.altitude_min_m?.toString() || '',
    altitude_max_m: profile.altitude_max_m?.toString() || '',
    harvest_season: profile.harvest_season || '',
    flavor_notes: (profile.flavor_notes || []).join(', '),
    vendor_description: profile.vendor_description || '',
    roasting_notes: profile.roasting_notes || '',
    price_per_lb: profile.price_per_lb?.toString() || '',
    espresso_suitable: profile.espresso_suitable ?? false,
  })

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/beans/review/${profile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          data: formData,
        }),
      })

      if (response.ok) {
        router.push('/beans/review')
        router.refresh()
      } else {
        alert('Failed to approve profile')
      }
    } catch (error) {
      alert('Error approving profile')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/beans/review/${profile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionReason,
        }),
      })

      if (response.ok) {
        router.push('/beans/review')
        router.refresh()
      } else {
        alert('Failed to reject profile')
      }
    } catch (error) {
      alert('Error rejecting profile')
    } finally {
      setLoading(false)
      setShowRejectModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/beans/review"
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            ← Back to Review Queue
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editing ? 'Edit Profile' : 'Review Profile'}
              </h1>
              {profile.vendor_url && (
                <a
                  href={profile.vendor_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                >
                  View on vendor site →
                </a>
              )}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {editing ? 'Cancel Edit' : 'Edit'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coffee Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor *
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Region
                </label>
                <input
                  type="text"
                  value={formData.sub_region}
                  onChange={(e) => setFormData({ ...formData, sub_region: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producer
                </label>
                <input
                  type="text"
                  value={formData.producer}
                  onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Coffee Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variety
                </label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Process Method
                </label>
                <input
                  type="text"
                  value={formData.process_method}
                  onChange={(e) => setFormData({ ...formData, process_method: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harvest Season
                </label>
                <input
                  type="text"
                  value={formData.harvest_season}
                  onChange={(e) => setFormData({ ...formData, harvest_season: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Altitude Min (m)
                </label>
                <input
                  type="number"
                  value={formData.altitude_min_m}
                  onChange={(e) => setFormData({ ...formData, altitude_min_m: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Altitude Max (m)
                </label>
                <input
                  type="number"
                  value={formData.altitude_max_m}
                  onChange={(e) => setFormData({ ...formData, altitude_max_m: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per lb ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_per_lb}
                  onChange={(e) => setFormData({ ...formData, price_per_lb: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 mt-6">
                  <input
                    type="checkbox"
                    checked={formData.espresso_suitable}
                    onChange={(e) => setFormData({ ...formData, espresso_suitable: e.target.checked })}
                    disabled={!editing}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Espresso Suitable</span>
                </label>
              </div>
            </div>

            {/* Flavor Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flavor Notes (comma-separated)
              </label>
              <input
                type="text"
                value={formData.flavor_notes}
                onChange={(e) => setFormData({ ...formData, flavor_notes: e.target.value })}
                disabled={!editing}
                placeholder="chocolate, caramel, nutty"
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
              />
            </div>

            {/* Descriptions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Description
              </label>
              <textarea
                value={formData.vendor_description}
                onChange={(e) => setFormData({ ...formData, vendor_description: e.target.value })}
                disabled={!editing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roasting Notes
              </label>
              <textarea
                value={formData.roasting_notes}
                onChange={(e) => setFormData({ ...formData, roasting_notes: e.target.value })}
                disabled={!editing}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t flex gap-4">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : '✓ Approve'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Reject Profile</h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you rejecting this profile?
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

