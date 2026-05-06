'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ExternalLink, Edit2, Save, X } from 'lucide-react'
import type { CoffeeProfile } from '@/types/coffee'

export default function BeanDetailModal({
  profile,
  onClose,
  onUpdate,
}: {
  profile: CoffeeProfile
  onClose: () => void
  onUpdate?: (updatedProfile: CoffeeProfile) => void
}) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: profile.name || '',
    vendor: profile.vendor || '',
    country: profile.country || '',
    region: profile.region || '',
    sub_region: profile.sub_region || '',
    producer: profile.producer || '',
    variety: profile.variety || '',
    process_method: profile.process_method || '',
    altitude_min_m: profile.altitude_min_m?.toString() || '',
    altitude_max_m: profile.altitude_max_m?.toString() || '',
    flavor_notes: (profile.flavor_notes || []).join(', '),
    vendor_description: profile.vendor_description || '',
    cupping_notes: profile.cupping_notes || '',
    roasting_notes: profile.roasting_notes || '',
    recommended_roast_levels: profile.recommended_roast_levels || [],
    price_per_lb: profile.price_per_lb?.toString() || '',
    arrival_date: profile.arrival_date ? profile.arrival_date.split('T')[0] : '',
    screen_size: profile.screen_size || '',
    cupping_score: profile.cupping_score?.toString() || '',
    bean_type: profile.bean_type || '',
    espresso_suitable: profile.espresso_suitable === true || profile.espresso_suitable === false ? profile.espresso_suitable : (null as boolean | null),
  } as any)

  const [selectedRoastLevels, setSelectedRoastLevels] = useState<string[]>(
    profile.recommended_roast_levels || []
  )

  // Sync form data when profile prop changes (but not when editing)
  useEffect(() => {
    if (!editing) {
      setFormData({
        name: profile.name || '',
        vendor: profile.vendor || '',
        country: profile.country || '',
        region: profile.region || '',
        sub_region: profile.sub_region || '',
        producer: profile.producer || '',
        variety: profile.variety || '',
        process_method: profile.process_method || '',
        altitude_min_m: profile.altitude_min_m?.toString() || '',
        altitude_max_m: profile.altitude_max_m?.toString() || '',
        flavor_notes: (profile.flavor_notes || []).join(', '),
        vendor_description: profile.vendor_description || '',
        roasting_notes: profile.roasting_notes || '',
        recommended_roast_levels: profile.recommended_roast_levels || [],
        price_per_lb: profile.price_per_lb?.toString() || '',
        arrival_date: profile.arrival_date ? profile.arrival_date.split('T')[0] : '',
        screen_size: profile.screen_size || '',
        cupping_score: profile.cupping_score?.toString() || '',
        bean_type: profile.bean_type || '',
        espresso_suitable: profile.espresso_suitable === true || profile.espresso_suitable === false ? profile.espresso_suitable : (null as boolean | null),
      })
      setSelectedRoastLevels(profile.recommended_roast_levels || [])
    }
  }, [profile, editing])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const submitData = {
        ...formData,
        recommended_roast_levels: selectedRoastLevels,
        flavor_notes: formData.flavor_notes ? formData.flavor_notes.split(',').map((n: string) => n.trim()).filter(Boolean) : [],
        altitude_min_m: formData.altitude_min_m ? parseInt(formData.altitude_min_m) : null,
        altitude_max_m: formData.altitude_max_m ? parseInt(formData.altitude_max_m) : null,
        price_per_lb: formData.price_per_lb ? parseFloat(formData.price_per_lb) : null,
        cupping_score: formData.cupping_score ? parseFloat(formData.cupping_score) : null,
        arrival_date: formData.arrival_date || null,
      }

      const response = await fetch(`/api/beans/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const result = await response.json()
        setEditing(false)
        if (onUpdate && result.profile) {
          onUpdate(result.profile)
        }
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update profile')
      }
    } catch (error) {
      alert('Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original profile
    setFormData({
      name: profile.name || '',
      vendor: profile.vendor || '',
      country: profile.country || '',
      region: profile.region || '',
      sub_region: profile.sub_region || '',
      producer: profile.producer || '',
      variety: profile.variety || '',
      process_method: profile.process_method || '',
      altitude_min_m: profile.altitude_min_m?.toString() || '',
      altitude_max_m: profile.altitude_max_m?.toString() || '',
      flavor_notes: (profile.flavor_notes || []).join(', '),
      vendor_description: profile.vendor_description || '',
      roasting_notes: profile.roasting_notes || '',
      recommended_roast_levels: profile.recommended_roast_levels || [],
      price_per_lb: profile.price_per_lb?.toString() || '',
      arrival_date: profile.arrival_date ? profile.arrival_date.split('T')[0] : '',
      screen_size: profile.screen_size || '',
      cupping_score: profile.cupping_score?.toString() || '',
      bean_type: profile.bean_type || '',
      espresso_suitable: profile.espresso_suitable === true || profile.espresso_suitable === false ? profile.espresso_suitable : (null as boolean | null),
    })
    setSelectedRoastLevels(profile.recommended_roast_levels || [])
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {editing ? (
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Coffee Name"
              className="text-2xl font-bold mb-2"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {profile.name || 'Unnamed Coffee'}
            </h2>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(profile.status)}
            {editing ? (
              <>
                <Input
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Vendor"
                  className="text-sm w-auto min-w-[120px]"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_per_lb}
                  onChange={(e) => setFormData({ ...formData, price_per_lb: e.target.value })}
                  placeholder="Price per lb"
                  className="text-sm w-auto min-w-[100px]"
                />
              </>
            ) : (
              <>
                {profile.vendor && (
                  <span className="text-sm text-gray-600">• {profile.vendor}</span>
                )}
                {profile.price_per_lb && (
                  <span className="text-sm font-medium text-gray-900">
                    • ${profile.price_per_lb.toFixed(2)}/lb
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
          {profile.vendor_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(profile.vendor_url || '', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on vendor site
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Origin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              {editing ? (
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                  className="w-full"
                />
              ) : (
                <div>{profile.country || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
              {editing ? (
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Region"
                  className="w-full"
                />
              ) : (
                <div>{profile.region || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sub-Region</label>
              {editing ? (
                <Input
                  value={formData.sub_region}
                  onChange={(e) => setFormData({ ...formData, sub_region: e.target.value })}
                  placeholder="Sub-Region"
                  className="w-full"
                />
              ) : (
                <div>{profile.sub_region || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Producer</label>
              {editing ? (
                <Input
                  value={formData.producer}
                  onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                  placeholder="Producer"
                  className="w-full"
                />
              ) : (
                <div>{profile.producer || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Altitude</label>
              {editing ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.altitude_min_m}
                    onChange={(e) => setFormData({ ...formData, altitude_min_m: e.target.value })}
                    placeholder="Min (m)"
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={formData.altitude_max_m}
                    onChange={(e) => setFormData({ ...formData, altitude_max_m: e.target.value })}
                    placeholder="Max (m)"
                    className="w-full"
                  />
                </div>
              ) : (
                <div>
                  {profile.altitude_min_m && profile.altitude_max_m
                    ? `${profile.altitude_min_m}-${profile.altitude_max_m} m`
                    : profile.altitude_min_m
                      ? `${profile.altitude_min_m} m`
                      : profile.altitude_max_m
                        ? `${profile.altitude_max_m} m`
                        : 'N/A'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coffee Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Variety</label>
              {editing ? (
                <Input
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="Variety"
                  className="w-full"
                />
              ) : (
                <div>{profile.variety || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Process</label>
              {editing ? (
                <Input
                  value={formData.process_method}
                  onChange={(e) => setFormData({ ...formData, process_method: e.target.value })}
                  placeholder="Process Method"
                  className="w-full"
                />
              ) : (
                <div>{profile.process_method || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bean Type</label>
              {editing ? (
                <select
                  value={formData.bean_type}
                  onChange={(e) => setFormData({ ...formData, bean_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select bean type...</option>
                  <option value="Regular">Regular</option>
                  <option value="Peaberry">Peaberry</option>
                  <option value="Maragogype (Large)">Maragogype (Large)</option>
                  <option value="Mixed">Mixed</option>
                </select>
              ) : (
                <div className="capitalize">{profile.bean_type || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Espresso Suitable</label>
              {editing ? (
                <select
                  value={formData.espresso_suitable === null ? 'null' : formData.espresso_suitable ? 'yes' : 'no'}
                  onChange={(e) => {
                    const value = e.target.value === 'null' ? null : e.target.value === 'yes'
                    setFormData({ ...formData, espresso_suitable: value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="null">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              ) : (
                <div>{profile.espresso_suitable !== null ? (profile.espresso_suitable ? 'Yes' : 'No') : 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cupping Score</label>
              {editing ? (
                <Input
                  type="number"
                  step="0.1"
                  value={formData.cupping_score}
                  onChange={(e) => setFormData({ ...formData, cupping_score: e.target.value })}
                  placeholder="Cupping Score"
                  className="w-full"
                />
              ) : (
                <div className="font-semibold">{profile.cupping_score || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Screen Size</label>
              {editing ? (
                <Input
                  value={formData.screen_size}
                  onChange={(e) => setFormData({ ...formData, screen_size: e.target.value })}
                  placeholder="Screen Size"
                  className="w-full"
                />
              ) : (
                <div>{profile.screen_size || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Arrival Date</label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.arrival_date}
                  onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                  className="w-full"
                />
              ) : (
                <div>{profile.arrival_date ? new Date(profile.arrival_date).toLocaleDateString() : 'N/A'}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Roast Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommended Roast Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {['city', 'city+', 'full_city', 'full_city+', 'french', 'light', 'medium', 'dark'].map((level) => (
                <label
                  key={level}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer ${
                    selectedRoastLevels.includes(level)
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                      : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoastLevels.includes(level)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoastLevels([...selectedRoastLevels, level])
                      } else {
                        setSelectedRoastLevels(selectedRoastLevels.filter(l => l !== level))
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {level === 'city+' ? 'City+' :
                     level === 'full_city' ? 'Full City' :
                     level === 'full_city+' ? 'Full City+' :
                     level.charAt(0).toUpperCase() + level.slice(1).replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.recommended_roast_levels && profile.recommended_roast_levels.length > 0 ? (
                profile.recommended_roast_levels.map((level, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {level === 'city+' ? 'City+' :
                     level === 'full_city' ? 'Full City' :
                     level === 'full_city+' ? 'Full City+' :
                     level.charAt(0).toUpperCase() + level.slice(1).replace(/_/g, ' ')}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">None selected</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Body and Acidity Intensity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasting Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Flavor Notes (comma-separated)
            </label>
            {editing ? (
              <Input
                value={formData.flavor_notes}
                onChange={(e) => setFormData({ ...formData, flavor_notes: e.target.value })}
                placeholder="chocolate, caramel, nutty"
                className="w-full"
              />
            ) : (
              <div className="text-sm text-gray-700">
                {profile.flavor_notes && profile.flavor_notes.length > 0
                  ? profile.flavor_notes.join(', ')
                  : 'None'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cupping Notes
            </label>
            {editing ? (
              <textarea
                value={formData.cupping_notes ?? ''}
                onChange={(e) => setFormData({ ...formData, cupping_notes: e.target.value })}
                placeholder="Detailed tasting / cup analysis"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {profile.cupping_notes || 'None'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roasting Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <textarea
              value={formData.roasting_notes}
              onChange={(e) => setFormData({ ...formData, roasting_notes: e.target.value })}
              placeholder="Roasting notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {profile.roasting_notes || 'None'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created: </span>
            <span>{new Date(profile.created_at).toLocaleString()}</span>
          </div>
          {profile.scraped_at && (
            <div>
              <span className="font-medium">Scraped: </span>
              <span>{new Date(profile.scraped_at).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Mode Actions */}
      {editing && (
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
